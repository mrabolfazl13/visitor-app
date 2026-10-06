import { request } from './http';
import type {
  AuthUser,
  Category,
  Customer,
  CustomerPayload,
  CustomerQuery,
  LoginResponse,
  Page,
  Product,
  ProductPayload,
  ProductQuery,
} from '../types/models';

export interface Credentials {
  email: string;
  password: string;
}

export const authApi = {
  login: (credentials: Credentials) =>
    request<LoginResponse>('POST', '/auth/login', { body: credentials, auth: false }),
  me: () => request<AuthUser>('GET', '/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('POST', '/auth/change-password', {
      body: { current_password: currentPassword, new_password: newPassword },
    }),
  logout: () => request<{ success: boolean }>('POST', '/auth/logout', { auth: false }),
};

const ALL_PAGE_SIZE = 100;
const MAX_ALL_PAGES = 20;

async function collectAll<T>(fetcher: (query: { page: number; per_page: number }) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_ALL_PAGES; page += 1) {
    const result = await fetcher({ page, per_page: ALL_PAGE_SIZE });
    items.push(...result.data);
    if (items.length >= result.pagination.total || result.data.length === 0) break;
  }
  return items;
}

export const productsApi = {
  list: (query: ProductQuery) => request<Page<Product>>('GET', '/products', { query }),
  all: () => collectAll((query) => request<Page<Product>>('GET', '/products', { query })),
  get: (id: string) => request<Product>('GET', `/products/${id}`),
  create: (payload: ProductPayload) => request<Product>('POST', '/products', { body: payload }),
  update: (id: string, payload: Partial<ProductPayload>) =>
    request<Product>('PUT', `/products/${id}`, { body: payload }),
  remove: (id: string) => request<{ success: boolean }>('DELETE', `/products/${id}`),
};

export const customersApi = {
  list: (query: CustomerQuery) => request<Page<Customer>>('GET', '/customers', { query }),
  all: () => collectAll((query) => request<Page<Customer>>('GET', '/customers', { query })),
  get: (id: string) => request<Customer>('GET', `/customers/${id}`),
  create: (payload: CustomerPayload) => request<Customer>('POST', '/customers', { body: payload }),
  update: (id: string, payload: Partial<CustomerPayload>) =>
    request<Customer>('PUT', `/customers/${id}`, { body: payload }),
  remove: (id: string) => request<{ success: boolean }>('DELETE', `/customers/${id}`),
};

export const categoriesApi = {
  list: () => request<Category[]>('GET', '/categories'),
};
