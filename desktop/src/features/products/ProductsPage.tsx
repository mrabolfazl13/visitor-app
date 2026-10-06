import { useEffect, useState, useDeferredValue } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { productsApi } from '../../services/api';
import { useAuthStore } from '../../stores/auth';
import { useCategories, useDeleteProduct, useProducts, useSaveProduct } from '../../hooks/queries';
import type { Product, ProductPayload, ProductSort, SortOrder } from '../../types/models';
import { Badge, Button, Card, EmptyState, Field, Input, LoadingRow, Modal, Pagination, Select, Textarea } from '../../components/ui';
import { formatDateTime, formatNumber, formatPrice, statusLabel } from '../../utils/format';

const PER_PAGE = 20;
const SORTS: { key: ProductSort; label: string }[] = [
  { key: 'created_at', label: 'تازگی' },
  { key: 'name', label: 'نام' },
  { key: 'sku', label: 'کد کالا' },
  { key: 'unit_price', label: 'قیمت' },
  { key: 'stock_quantity', label: 'موجودی' },
];

const EMPTY_PRODUCT: ProductPayload = {
  sku: '',
  name: '',
  description: '',
  category_id: null,
  unit_price: '',
  unit: 'piece',
  minimum_order_quantity: 1,
  stock_quantity: 0,
  status: 'active',
};

function ProductForm({
  initial,
  categories,
  pending,
  onSubmit,
  onClose,
}: {
  initial: Product | null;
  categories: { id: string; name: string }[];
  pending: boolean;
  onSubmit: (payload: ProductPayload) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ProductPayload>(() =>
    initial
      ? {
          sku: initial.sku,
          name: initial.name,
          description: initial.description ?? '',
          category_id: initial.category_id,
          unit_price: initial.unit_price,
          unit: initial.unit,
          minimum_order_quantity: initial.minimum_order_quantity,
          stock_quantity: initial.stock_quantity,
          status: initial.status,
        }
      : EMPTY_PRODUCT,
  );
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const price = Number(draft.unit_price);
    if (!draft.sku.trim() || !draft.name.trim()) {
      setError('کد کالا و نام الزامی است');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('قیمت باید عددی بزرگ‌تر از صفر باشد');
      return;
    }
    setError(null);
    onSubmit({ ...draft, unit_price: String(price) });
  };

  return (
    <Modal title={initial ? `ویرایش ${initial.name}` : 'کالای جدید'} onClose={onClose} width="lg">
      <form className="form-grid" onSubmit={submit}>
        <Field label="نام کالا">
          <Input value={draft.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        </Field>
        <Field label="کد کالا (SKU)">
          <Input value={draft.sku} dir="ltr" onChange={(e) => set('sku', e.target.value)} />
        </Field>
        <Field label="قیمت واحد (تومان)">
          <Input value={String(draft.unit_price)} dir="ltr" inputMode="decimal" onChange={(e) => set('unit_price', e.target.value)} />
        </Field>
        <Field label="موجودی">
          <Input
            value={String(draft.stock_quantity)}
            dir="ltr"
            inputMode="numeric"
            onChange={(e) => set('stock_quantity', Number(e.target.value.replace(/\D/g, '')) || 0)}
          />
        </Field>
        <Field label="واحد">
          <Input value={draft.unit} onChange={(e) => set('unit', e.target.value)} />
        </Field>
        <Field label="حداقل سفارش">
          <Input
            value={String(draft.minimum_order_quantity)}
            dir="ltr"
            inputMode="numeric"
            onChange={(e) => set('minimum_order_quantity', Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))}
          />
        </Field>
        <Field label="دسته‌بندی">
          <Select value={draft.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}>
            <option value="">بدون دسته</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="وضعیت">
          <Select value={draft.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
            <option value="draft">پیش‌نویس</option>
          </Select>
        </Field>
        <div className="form-span">
          <Field label="توضیحات">
            <Textarea value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
        {error ? <p className="form-error form-span">{error}</p> : null}
        <div className="form-actions form-span">
          <Button type="submit" busy={pending}>{initial ? 'ذخیره تغییرات' : 'ثبت کالا'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
        </div>
      </form>
    </Modal>
  );
}

function ProductDetail({
  product,
  categoryName,
  onClose,
  onEdit,
}: {
  product: Product;
  categoryName: string | null;
  onClose: () => void;
  onEdit?: () => void;
}) {
  return (
    <Modal title={product.name} onClose={onClose} width="md">
      <dl className="detail-grid">
        <dt>کد کالا</dt>
        <dd className="mono">{product.sku}</dd>
        <dt>دسته‌بندی</dt>
        <dd>{categoryName ?? '—'}</dd>
        <dt>قیمت واحد</dt>
        <dd>{formatPrice(product.unit_price)}</dd>
        <dt>موجودی</dt>
        <dd>
          <Badge tone={product.stock_quantity === 0 ? 'danger' : product.stock_quantity <= 10 ? 'warning' : 'success'}>
            {formatNumber(product.stock_quantity)} {product.unit}
          </Badge>
        </dd>
        <dt>حداقل سفارش</dt>
        <dd>{formatNumber(product.minimum_order_quantity)} {product.unit}</dd>
        <dt>وضعیت</dt>
        <dd>{statusLabel(product.status)}</dd>
        <dt>تاریخ ثبت</dt>
        <dd>{formatDateTime(product.created_at)}</dd>
        <dt>آخرین تغییر</dt>
        <dd>{formatDateTime(product.updated_at)}</dd>
        <dt>تصاویر</dt>
        <dd>{product.images.length === 0 ? 'بدون تصویر' : `${formatNumber(product.images.length)} تصویر`}</dd>
      </dl>
      {product.description ? <p className="detail-desc">{product.description}</p> : null}
      <div className="form-actions">
        {onEdit ? <Button onClick={onEdit}>ویرایش کالا</Button> : null}
        <Button variant="ghost" onClick={onClose}>بستن</Button>
      </div>
    </Modal>
  );
}

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const isAdmin = useAuthStore((state) => state.hasRole('ADMIN'));
  const [term, setTerm] = useState(params.get('search') ?? '');
  const deferredTerm = useDeferredValue(term);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState<Product | null>(null);

  const page = Number(params.get('page') ?? 1);
  const categoryId = params.get('category') ?? '';
  const status = params.get('status') ?? '';
  const inStock = params.get('in_stock') === '1';
  const sort = (params.get('sort') as ProductSort) ?? 'created_at';
  const order = (params.get('order') as SortOrder) ?? 'desc';
  const highlight = params.get('highlight');

  const categories = useCategories();
  const [detail, setDetail] = useState<Product | null>(null);

  const products = useProducts({ page, per_page: PER_PAGE, search: deferredTerm || undefined, category_id: categoryId || undefined, status: status || undefined, in_stock: inStock || undefined, sort, order });
  const save = useSaveProduct();
  const remove = useDeleteProduct();

  const alreadyVisible = (products.data?.data ?? []).some((product) => product.id === highlight);
  const highlightedProduct = useQuery({
    queryKey: ['product', highlight],
    queryFn: () => productsApi.get(highlight as string),
    enabled: Boolean(highlight) && !alreadyVisible,
  });

  useEffect(() => {
    if (!highlightedProduct.data) return;
    setDetail(highlightedProduct.data);
    patch({ highlight: null });
  }, [highlightedProduct.data]);

  const patch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (deferredTerm !== (params.get('search') ?? '')) {
      patch({ search: deferredTerm || null });
    }
  }, [deferredTerm]);

  useEffect(() => {
    if (!highlight) return;
    if (alreadyVisible) {
      document.querySelector('.is-highlighted')?.scrollIntoView({ block: 'center' });
    }
    const timer = window.setTimeout(() => patch({ highlight: null }), 4000);
    return () => window.clearTimeout(timer);
  }, [highlight, alreadyVisible]);

  const toggleSort = (key: ProductSort) => {
    const nextOrder: SortOrder = sort === key && order === 'asc' ? 'desc' : 'asc';
    patch({ sort: key, order: nextOrder });
  };

  const onSubmit = (payload: ProductPayload) => {
    save.mutate(
      { id: editing?.id, payload },
      { onSuccess: () => { setEditing(null); setCreating(false); } },
    );
  };

  const rows = products.data?.data ?? [];
  const pagination = products.data?.pagination;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>کالاها</h1>
          <p className="page-sub">
            {pagination ? `${formatNumber(pagination.total)} کالا در سامانه` : 'در حال شمارش کالاها…'}
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" />
            کالای جدید
          </Button>
        ) : null}
      </header>

      <Card>
        <div className="toolbar">
          <Input
            className="toolbar-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="جستجو بر اساس نام یا کد کالا…"
            aria-label="جستجوی کالا"
          />
          <Select value={categoryId} onChange={(event) => patch({ category: event.target.value || null })} aria-label="دسته‌بندی">
            <option value="">همه دسته‌ها</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => patch({ status: event.target.value || null })} aria-label="وضعیت">
            <option value="">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
            <option value="draft">پیش‌نویس</option>
          </Select>
          <label className="check">
            <input type="checkbox" checked={inStock} onChange={(event) => patch({ in_stock: event.target.checked ? '1' : null })} />
            فقط موجودی دار
          </label>
          <Select value={`${sort}:${order}`} onChange={(event) => { const [key, dir] = event.target.value.split(':'); patch({ sort: key, order: dir }); }} aria-label="ترتیب">
            {SORTS.map((item) => (
              <option key={`${item.key}-desc`} value={`${item.key}:desc`}>{item.label} (نزولی)</option>
            ))}
            {SORTS.map((item) => (
              <option key={`${item.key}-asc`} value={`${item.key}:asc`}>{item.label} (صعودی)</option>
            ))}
          </Select>
        </div>

        {products.isPending ? (
          <LoadingRow />
        ) : products.isError ? (
          <EmptyState title="دریافت کالاها ناموفق بود" description={products.error instanceof Error ? products.error.message : undefined} />
        ) : rows.length === 0 ? (
          <EmptyState title="کالایی مطابق این جستجو یافت نشد" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th><button className="th-btn" onClick={() => toggleSort('name')}>نام کالا</button></th>
                <th><button className="th-btn" onClick={() => toggleSort('sku')}>کد</button></th>
                <th>دسته</th>
                <th><button className="th-btn" onClick={() => toggleSort('unit_price')}>قیمت</button></th>
                <th><button className="th-btn" onClick={() => toggleSort('stock_quantity')}>موجودی</button></th>
                <th>وضعیت</th>
                {isAdmin ? <th className="col-actions">عملیات</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id} className={product.id === highlight ? 'is-highlighted' : ''}>
                  <td className="cell-title">
                    <button className="link-cell" onClick={() => setDetail(product)}>{product.name}</button>
                  </td>
                  <td className="mono">{product.sku}</td>
                  <td>{(categories.data ?? []).find((category) => category.id === product.category_id)?.name ?? '—'}</td>
                  <td>{formatPrice(product.unit_price)}</td>
                  <td>
                    <Badge tone={product.stock_quantity === 0 ? 'danger' : product.stock_quantity <= 10 ? 'warning' : 'neutral'}>
                      {formatNumber(product.stock_quantity)} {product.unit}
                    </Badge>
                  </td>
                  <td>{statusLabel(product.status)}</td>
                  {isAdmin ? (
                    <td className="col-actions">
                      <button className="icon-btn" onClick={() => setEditing(product)} aria-label={`ویرایش ${product.name}`}>
                        <Pencil size={16} />
                      </button>
                      <button className="icon-btn danger" onClick={() => setConfirming(product)} aria-label={`حذف ${product.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination ? (
          <Pagination page={page} perPage={PER_PAGE} total={pagination.total} totalPages={pagination.total_pages} onChange={(next) => patch({ page: String(next) })} />
        ) : null}
      </Card>

      {detail ? (
        <ProductDetail
          product={detail}
          categoryName={(categories.data ?? []).find((category) => category.id === detail.category_id)?.name ?? null}
          onClose={() => setDetail(null)}
          onEdit={
            isAdmin
              ? () => {
                  setEditing(detail);
                  setDetail(null);
                }
              : undefined
          }
        />
      ) : null}

      {creating || editing ? (
        <ProductForm
          initial={editing}
          categories={categories.data ?? []}
          pending={save.isPending}
          onSubmit={onSubmit}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      ) : null}

      {confirming ? (
        <Modal title="حذف کالا" onClose={() => setConfirming(null)}>
          <p className="confirm-text">
            آیا از حذف «{confirming.name}» مطمئن هستید؟ این عملیات به‌صورت نرم انجام می‌شود و قابل بازگشت است.
          </p>
          <div className="form-actions">
            <Button
              variant="danger"
              busy={remove.isPending}
              onClick={() => remove.mutate(confirming.id, { onSuccess: () => setConfirming(null) })}
            >
              حذف
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(null)}>انصراف</Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
