const numberFormat = new Intl.NumberFormat('fa-IR');
const decimalFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

const priceFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatQuantity(value: number): string {
  return decimalFormat.format(value);
}

export function formatPrice(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return `${priceFormat.format(numeric)} تومان`;
}

const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFormatter.format(date);
}

export function formatPersianDigits(value: string | number): string {
  const map = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(value).replace(/\d/g, (digit) => map[Number(digit)]);
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'فعال',
    inactive: 'غیرفعال',
    draft: 'پیش‌نویس',
    archived: 'بایگانی',
  };
  return map[status] ?? status;
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN: 'مدیر سیستم',
    SELLER: 'فروشنده',
    ACCOUNTANT: 'حسابدار',
    WAREHOUSE: 'انبار',
    SHIPPER: 'ارسال',
  };
  return map[role] ?? role;
}

export function fullName(user: { first_name: string; last_name: string }): string {
  return `${user.first_name} ${user.last_name}`.trim();
}
