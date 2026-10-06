import { useMemo } from 'react';
import { AlertTriangle, Boxes, Package, Users, Wallet } from 'lucide-react';
import { useSnapshot } from '../../hooks/useSnapshot';
import { useAuthStore } from '../../stores/auth';
import { Badge, Card, EmptyState, LoadingRow } from '../../components/ui';
import { formatDate, formatNumber, formatPrice, fullName, roleLabel } from '../../utils/format';

const LOW_STOCK_THRESHOLD = 10;

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const snapshot = useSnapshot();

  const metrics = useMemo(() => {
    const products = snapshot.data?.products ?? [];
    const customers = snapshot.data?.customers ?? [];

    const stockUnits = products.reduce((sum, product) => sum + product.stock_quantity, 0);
    const lowStock = products
      .filter((product) => product.status === 'active' && product.stock_quantity <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock_quantity - b.stock_quantity);
    const inventoryValue = products.reduce((sum, product) => sum + Number(product.unit_price) * product.stock_quantity, 0);

    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentCustomers = [...customers]
      .filter((customer) => new Date(customer.created_at).getTime() >= monthAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      productCount: products.length,
      customerCount: customers.length,
      stockUnits,
      lowStock,
      inventoryValue,
      newCustomers: recentCustomers,
    };
  }, [snapshot.data]);

  if (snapshot.isPending) {
    return (
      <div className="page">
        <LoadingRow label="در حال دریافت اطلاعات…" />
      </div>
    );
  }

  if (snapshot.isError) {
    return (
      <div className="page">
        <EmptyState
          title="اطلاعات سرور در دسترس نیست"
          description={snapshot.error instanceof Error ? snapshot.error.message : undefined}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>داشبورد</h1>
          <p className="page-sub">
            {user ? `${fullName(user)} · ${user.roles.map(roleLabel).join(' · ')}` : ''}
          </p>
        </div>
      </header>

      <div className="metric-grid">
        <article className="metric">
          <div className="metric-icon"><Package size={20} /></div>
          <div>
            <p className="metric-label">تعداد کالاها</p>
            <p className="metric-value">{formatNumber(metrics.productCount)}</p>
          </div>
        </article>

        <article className="metric">
          <div className="metric-icon"><Users size={20} /></div>
          <div>
            <p className="metric-label">تعداد مشتریان</p>
            <p className="metric-value">{formatNumber(metrics.customerCount)}</p>
          </div>
        </article>

        <article className="metric">
          <div className="metric-icon"><Boxes size={20} /></div>
          <div>
            <p className="metric-label">جمع واحدهای انبار</p>
            <p className="metric-value">{formatNumber(metrics.stockUnits)}</p>
          </div>
        </article>

        <article className="metric">
          <div className="metric-icon"><Wallet size={20} /></div>
          <div>
            <p className="metric-label">ارزش موجودی</p>
            <p className="metric-value">{formatPrice(metrics.inventoryValue)}</p>
          </div>
        </article>
      </div>

      <div className="split-grid">
        <Card title={`کالاهای کم‌موجود (${formatNumber(metrics.lowStock.length)})`}>
          {metrics.lowStock.length === 0 ? (
            <EmptyState title="همه کالاها موجودی کافی دارند" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>کالا</th>
                  <th>کد</th>
                  <th>موجودی</th>
                  <th>قیمت</th>
                </tr>
              </thead>
              <tbody>
                {metrics.lowStock.slice(0, 8).map((product) => (
                  <tr key={product.id}>
                    <td className="cell-title">
                      <span className="inline-alert"><AlertTriangle size={14} /> {product.name}</span>
                    </td>
                    <td className="mono">{product.sku}</td>
                    <td><Badge tone={product.stock_quantity === 0 ? 'danger' : 'warning'}>{formatNumber(product.stock_quantity)}</Badge></td>
                    <td>{formatPrice(product.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title={`مشتریان تازه (${formatNumber(metrics.newCustomers.length)})`}>
          {metrics.newCustomers.length === 0 ? (
            <EmptyState title="در ۳۰ روز گذشته مشتری تازه‌ای ثبت نشده است" />
          ) : (
            <ul className="list">
              {metrics.newCustomers.slice(0, 8).map((customer) => (
                <li key={customer.id} className="list-row">
                  <div>
                    <p className="list-title">{customer.first_name} {customer.last_name}</p>
                    <p className="list-sub">{customer.company_name ?? 'بدون شرکت'}</p>
                  </div>
                  <span className="list-meta">{formatDate(customer.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
