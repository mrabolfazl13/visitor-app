import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Users } from 'lucide-react';
import { useCustomers, useProducts } from '../hooks/queries';
import { useUiStore } from '../stores/ui';
import { formatPrice } from '../utils/format';

interface Hit {
  id: string;
  kind: 'product' | 'customer';
  title: string;
  subtitle: string;
  path: string;
}

export function CommandPalette() {
  const open = useUiStore((state) => state.paletteOpen);
  const setOpen = useUiStore((state) => state.setPaletteOpen);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounced = useDeferredValue(term);

  const enabled = open && debounced.trim().length >= 1;
  const products = useProducts({ search: debounced, per_page: 6, page: 1 }, { enabled });
  const customers = useCustomers({ search: debounced, per_page: 6, page: 1 }, { enabled });

  const hits = useMemo<Hit[]>(() => {
    if (!enabled) return [];
    const productHits = (products.data?.data ?? []).map((product) => ({
      id: `p-${product.id}`,
      kind: 'product' as const,
      title: product.name,
      subtitle: `${product.sku} · ${formatPrice(product.unit_price)}`,
      path: `/products?highlight=${product.id}`,
    }));
    const customerHits = (customers.data?.data ?? []).map((customer) => ({
      id: `c-${customer.id}`,
      kind: 'customer' as const,
      title: `${customer.first_name} ${customer.last_name}`.trim(),
      subtitle: [customer.company_name, customer.mobile].filter(Boolean).join(' · '),
      path: `/customers?highlight=${customer.id}`,
    }));
    return [...productHits, ...customerHits];
  }, [enabled, products.data, customers.data]);

  useEffect(() => {
    if (open) {
      setTerm('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setActive(0), [debounced]);

  if (!open) return null;

  const isLoading = enabled && (products.isFetching || customers.isFetching);

  const choose = (hit: Hit | undefined) => {
    if (!hit) return;
    setOpen(false);
    navigate(hit.path);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(hits.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(hits[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="palette-overlay" onMouseDown={() => setOpen(false)} role="presentation">
      <div className="palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-input">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="جستجوی کالا یا مشتری…"
            aria-label="جستجوی سراسری"
          />
          <kbd>Esc</kbd>
        </div>

        {hits.length > 0 ? (
          <ul className="palette-results">
            {hits.map((hit, index) => (
              <li key={hit.id}>
                <button
                  className={`palette-hit ${index === active ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(hit)}
                >
                  {hit.kind === 'product' ? <Package size={16} aria-hidden="true" /> : <Users size={16} aria-hidden="true" />}
                  <span className="hit-title">{hit.title}</span>
                  <span className="hit-subtitle">{hit.subtitle}</span>
                  <span className={`hit-kind hit-kind-${hit.kind}`}>{hit.kind === 'product' ? 'کالا' : 'مشتری'}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="palette-empty">
            {isLoading ? 'در حال جستجو…' : term.trim() ? 'نتیجه‌ای یافت نشد' : 'برای جستجو تایپ کنید'}
          </p>
        )}
      </div>
    </div>
  );
}
