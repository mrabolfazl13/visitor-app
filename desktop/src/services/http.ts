import { invoke } from '@tauri-apps/api/core';
import { getItem, isTauri, removeItem, setItem } from './storage';

export const DEFAULT_BASE_URL = 'https://visitor.absadeghi.ir/api/v1';
const BROWSER_BASE_PATH = '/api/v1';

const ACCESS_KEY = 'auth.accessToken';
const REFRESH_KEY = 'auth.refreshToken';

export interface HttpResult {
  status: number;
  body: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, detail: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

type SessionListener = () => void;
const sessionListeners = new Set<SessionListener>();

export function onSessionExpired(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

let baseUrlOverride: string | null = null;

export async function getBaseUrl(): Promise<string> {
  if (baseUrlOverride) return baseUrlOverride;
  const stored = await getItem('settings.baseUrl');
  baseUrlOverride = stored && stored.trim() ? stored.trim().replace(/\/+$/, '') : DEFAULT_BASE_URL;
  return baseUrlOverride;
}

export async function setBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new ApiError(0, null, 'آدرس سرور باید با http:// یا https:// شروع شود');
  }
  baseUrlOverride = trimmed;
  await setItem('settings.baseUrl', trimmed);
}

/** In the browser the API is reached through the dev proxy on the same origin. */
function joinBase(baseUrl: string, path: string): string {
  return isTauri ? `${baseUrl}${path}` : `${BROWSER_BASE_PATH}${path}`;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function loadTokens(): Promise<boolean> {
  accessToken = await getItem(ACCESS_KEY);
  return Boolean(accessToken);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  await Promise.all([setItem(ACCESS_KEY, access), setItem(REFRESH_KEY, refresh)]);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY)]);
}

function detailFrom(body: string): unknown {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
      const detail = (parsed as { detail: unknown }).detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const first = detail[0] as { msg?: string; loc?: unknown[] } | undefined;
        if (first?.msg) return `${fieldLabel(first.loc)}: ${humanizeValidation(first.msg)}`;
      }
      return detail;
    }
    return parsed;
  } catch {
    return body.slice(0, 300);
  }
}

function fieldLabel(loc: unknown[] | undefined): string {
  const names = (loc ?? []).filter((part): part is string | number => typeof part === 'string' || typeof part === 'number');
  const field = names[names.length - 1];
  if (typeof field !== 'string') return 'فرم';
  const map: Record<string, string> = {
    email: 'ایمیل',
    password: 'رمز عبور',
    mobile: 'همراه',
    first_name: 'نام',
    last_name: 'نام خانوادگی',
    sku: 'کد کالا',
    name: 'نام',
    unit_price: 'قیمت',
    stock_quantity: 'موجودی',
  };
  return map[field] ?? field;
}

function humanizeValidation(msg: string): string {
  if (msg.startsWith('String should have at least')) return 'نباید خالی باشد';
  if (msg.startsWith('String should have at most')) return 'بسیار طولانی است';
  if (msg.includes('value is not a valid')) return 'مقدار معتبر نیست';
  if (msg.includes('greater than 0')) return 'باید بزرگ‌تر از صفر باشد';
  if (msg.includes('greater than or equal to 0')) return 'نباید منفی باشد';
  if (msg.includes('invalid email')) return 'فرمت معتبر نیست';
  return msg;
}

function messageFor(status: number, detail: unknown): string {
  if (status === 401) return 'نشست شما پایان یافته است. دوباره وارد شوید.';
  if (status === 403) return 'مجوز انجام این کار را ندارید.';
  if (status === 404) return 'مورد مورد نظر یافت نشد.';
  if (status === 409) return typeof detail === 'string' ? detail : 'این رکورد قبلاً ثبت شده است.';
  if (status === 422) return typeof detail === 'string' ? detail : 'اطلاعات واردشده معتبر نیست.';
  if (status >= 500) return 'خطای سمت سرور رخ داده است.';
  return typeof detail === 'string' && detail ? detail : 'درخواست ناموفق بود.';
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  query?: object;
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
}

async function send(url: string, method: string, headers: [string, string][], body: string | null, timeoutMs: number): Promise<HttpResult> {
  if (isTauri) {
    return invoke<HttpResult>('api_request', { req: { method, url, headers, body, timeout_ms: timeoutMs } });
  }
  const response = await fetch(url, {
    method,
    headers: Object.fromEntries(headers),
    body: body ?? undefined,
  });
  return { status: response.status, body: await response.text() };
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refresh = await getItem(REFRESH_KEY);
  if (!refresh) return false;
  const base = await getBaseUrl();
  try {
    const result = await send(joinBase(base, '/auth/refresh'), 'POST', [['Content-Type', 'application/json']], JSON.stringify({ refresh_token: refresh }), 15_000);
    if (result.status !== 200) return false;
    const data = JSON.parse(result.body) as { access_token: string };
    accessToken = data.access_token;
    await setItem(ACCESS_KEY, data.access_token);
    return true;
  } catch {
    return false;
  }
}

function buildUrl(base: string, path: string, query?: object): string {
  const full = joinBase(base, path);
  if (!query) return full;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const scalar: QueryValue = value as QueryValue;
    if (scalar === null || scalar === undefined || scalar === '') continue;
    params.set(key, String(scalar));
  }
  const qs = params.toString();
  return qs ? `${full}?${qs}` : full;
}

export async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, auth = true, timeoutMs = 15_000 } = options;
  const base = await getBaseUrl();
  const url = buildUrl(base, path, query);

  const execute = async (): Promise<HttpResult> => {
    const headers: [string, string][] = [['Accept', 'application/json']];
    if (body !== undefined) headers.push(['Content-Type', 'application/json']);
    if (auth && accessToken) headers.push(['Authorization', `Bearer ${accessToken}`]);
    return send(url, method, headers, body === undefined ? null : JSON.stringify(body), timeoutMs);
  };

  let result = await execute();

  if (result.status === 401 && auth) {
    refreshInFlight ??= tryRefresh().finally(() => {
      refreshInFlight = null;
    });
    const refreshed = await refreshInFlight;
    if (refreshed) {
      result = await execute();
    } else {
      await clearTokens();
      sessionListeners.forEach((listener) => listener());
    }
  }

  if (result.status >= 200 && result.status < 300) {
    if (!result.body) return undefined as T;
    return JSON.parse(result.body) as T;
  }

  const detail = detailFrom(result.body);
  throw new ApiError(result.status, detail, messageFor(result.status, detail));
}
