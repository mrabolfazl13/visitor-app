import { useEffect, useState, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { customersApi } from '../../services/api';
import { useCustomers, useDeleteCustomer, useSaveCustomer } from '../../hooks/queries';
import type { Customer, CustomerPayload } from '../../types/models';
import { Badge, Button, Card, EmptyState, Field, Input, LoadingRow, Modal, Pagination, Textarea } from '../../components/ui';
import { formatDate, formatNumber, formatPersianDigits, fullName } from '../../utils/format';

const PER_PAGE = 20;

const EMPTY_CUSTOMER: CustomerPayload = {
  first_name: '',
  last_name: '',
  mobile: '',
  company_name: '',
  national_id: '',
  economic_id: '',
  notes: '',
};

function toPayload(customer: Customer): CustomerPayload {
  return {
    first_name: customer.first_name,
    last_name: customer.last_name,
    mobile: customer.mobile,
    company_name: customer.company_name ?? '',
    national_id: customer.national_id ?? '',
    economic_id: customer.economic_id ?? '',
    notes: customer.notes ?? '',
  };
}

function CustomerForm({
  initial,
  pending,
  onSubmit,
  onClose,
}: {
  initial: Customer | null;
  pending: boolean;
  onSubmit: (payload: CustomerPayload) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CustomerPayload>(() => (initial ? toPayload(initial) : EMPTY_CUSTOMER));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CustomerPayload>(key: K, value: CustomerPayload[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.first_name.trim() || !draft.last_name.trim()) {
      setError('نام و نام خانوادگی الزامی است');
      return;
    }
    const digits = draft.mobile.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('شماره همراه باید حداقل ۱۰ رقم باشد');
      return;
    }
    setError(null);
    onSubmit({ ...draft, mobile: digits, company_name: draft.company_name || null, national_id: draft.national_id || null, economic_id: draft.economic_id || null, notes: draft.notes || null });
  };

  return (
    <Modal title={initial ? `ویرایش ${fullName(initial)}` : 'مشتری جدید'} onClose={onClose} width="lg">
      <form className="form-grid" onSubmit={submit}>
        <Field label="نام">
          <Input value={draft.first_name} onChange={(e) => set('first_name', e.target.value)} autoFocus />
        </Field>
        <Field label="نام خانوادگی">
          <Input value={draft.last_name} onChange={(e) => set('last_name', e.target.value)} />
        </Field>
        <Field label="همراه" hint="مثال: 09121234567">
          <Input value={draft.mobile} dir="ltr" inputMode="tel" onChange={(e) => set('mobile', e.target.value)} />
        </Field>
        <Field label="نام شرکت">
          <Input value={draft.company_name ?? ''} onChange={(e) => set('company_name', e.target.value)} />
        </Field>
        <Field label="شناسه ملی">
          <Input value={draft.national_id ?? ''} dir="ltr" onChange={(e) => set('national_id', e.target.value)} />
        </Field>
        <Field label="کد اقتصادی">
          <Input value={draft.economic_id ?? ''} dir="ltr" onChange={(e) => set('economic_id', e.target.value)} />
        </Field>
        <div className="form-span">
          <Field label="یادداشت">
            <Textarea value={draft.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>
        {error ? <p className="form-error form-span">{error}</p> : null}
        <div className="form-actions form-span">
          <Button type="submit" busy={pending}>{initial ? 'ذخیره تغییرات' : 'ثبت مشتری'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>انصراف</Button>
        </div>
      </form>
    </Modal>
  );
}

function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  return (
    <Modal title={fullName(customer)} onClose={onClose} width="md">
      <dl className="detail-grid">
        <dt>همراه</dt>
        <dd className="mono">{formatPersianDigits(customer.mobile)}</dd>
        <dt>شرکت</dt>
        <dd>{customer.company_name ?? '—'}</dd>
        <dt>شناسه ملی</dt>
        <dd className="mono">{customer.national_id ?? '—'}</dd>
        <dt>کد اقتصادی</dt>
        <dd className="mono">{customer.economic_id ?? '—'}</dd>
        <dt>تاریخ ثبت</dt>
        <dd>{formatDate(customer.created_at)}</dd>
        <dt>یادداشت</dt>
        <dd>{customer.notes ?? '—'}</dd>
      </dl>
      <h3 className="detail-subtitle">آدرس‌ها</h3>
      {customer.addresses.length === 0 ? (
        <p className="muted">آدرسی برای این مشتری ثبت نشده است.</p>
      ) : (
        <ul className="list">
          {customer.addresses.map((address) => (
            <li key={address.id} className="list-row">
              <div>
                <p className="list-title">{address.province} · {address.city}</p>
                <p className="list-sub">{address.street_address}</p>
              </div>
              {address.is_default ? <Badge tone="info"> پیش‌فرض</Badge> : null}
            </li>
          ))}
        </ul>
      )}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose}>بستن</Button>
      </div>
    </Modal>
  );
}

export function CustomersPage() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get('search') ?? '');
  const deferredTerm = useDeferredValue(term);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [confirming, setConfirming] = useState<Customer | null>(null);

  const page = Number(params.get('page') ?? 1);
  const highlight = params.get('highlight');

  const customers = useCustomers({ page, per_page: PER_PAGE, search: deferredTerm || undefined });
  const save = useSaveCustomer();
  const remove = useDeleteCustomer();

  const patch = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  };

  const rows = customers.data?.data ?? [];
  const pagination = customers.data?.pagination;

  useEffect(() => {
    if (deferredTerm !== (params.get('search') ?? '')) patch({ search: deferredTerm || null });
  }, [deferredTerm]);


  const alreadyVisible = rows.some((customer) => customer.id === highlight);

  const highlightedCustomer = useQuery({
    queryKey: ['customer', highlight],
    queryFn: () => customersApi.get(highlight as string),
    enabled: Boolean(highlight) && !alreadyVisible,
  });

  useEffect(() => {
    if (highlight && alreadyVisible) {
      document.querySelector('.is-highlighted')?.scrollIntoView({ block: 'center' });
    }
  }, [highlight, alreadyVisible]);

  useEffect(() => {
    if (!highlightedCustomer.data) return;
    setViewing(highlightedCustomer.data);
    patch({ highlight: null });
  }, [highlightedCustomer.data]);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>مشتریان</h1>
          <p className="page-sub">
            {pagination ? `${formatNumber(pagination.total)} مشتری` : 'در حال شمارش مشتریان…'}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} aria-hidden="true" />
          مشتری جدید
        </Button>
      </header>

      <Card>
        <div className="toolbar">
          <Input
            className="toolbar-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="جستجو بر اساس نام، همراه یا شرکت…"
            aria-label="جستجوی مشتری"
          />
        </div>

        {customers.isPending ? (
          <LoadingRow />
        ) : customers.isError ? (
          <EmptyState title="دریافت مشتریان ناموفق بود" description={customers.error instanceof Error ? customers.error.message : undefined} />
        ) : rows.length === 0 ? (
          <EmptyState title="مشتری‌ای مطابق این جستجو یافت نشد" description="با «مشتری جدید» می‌توانید اولین رکورد را ثبت کنید." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>نام</th>
                <th>همراه</th>
                <th>شرکت</th>
                <th>آدرس</th>
                <th>ثبت</th>
                <th className="col-actions">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => (
                <tr key={customer.id} className={customer.id === highlight ? 'is-highlighted' : ''}>
                  <td className="cell-title">{fullName(customer)}</td>
                  <td className="mono">{formatPersianDigits(customer.mobile)}</td>
                  <td>{customer.company_name ?? '—'}</td>
                  <td>{customer.addresses[0] ? `${customer.addresses[0].province} · ${customer.addresses[0].city}` : '—'}</td>
                  <td>{formatDate(customer.created_at)}</td>
                  <td className="col-actions">
                    <button className="icon-btn" onClick={() => setViewing(customer)} aria-label={`مشاهده ${fullName(customer)}`}>
                      <Eye size={16} />
                    </button>
                    <button className="icon-btn" onClick={() => setEditing(customer)} aria-label={`ویرایش ${fullName(customer)}`}>
                      <Pencil size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => setConfirming(customer)} aria-label={`حذف ${fullName(customer)}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination ? (
          <Pagination page={page} perPage={PER_PAGE} total={pagination.total} totalPages={pagination.total_pages} onChange={(next) => patch({ page: String(next) })} />
        ) : null}
      </Card>

      {creating || editing ? (
        <CustomerForm
          initial={editing}
          pending={save.isPending}
          onSubmit={(payload) =>
            save.mutate({ id: editing?.id, payload }, { onSuccess: () => { setEditing(null); setCreating(false); } })
          }
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      ) : null}

      {viewing ? <CustomerDetail customer={viewing} onClose={() => setViewing(null)} /> : null}

      {confirming ? (
        <Modal title="حذف مشتری" onClose={() => setConfirming(null)}>
          <p className="confirm-text">
            آیا از حذف «{fullName(confirming)}» مطمئن هستید؟ سوابق این مشتری در سامانه باقی می‌ماند.
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
