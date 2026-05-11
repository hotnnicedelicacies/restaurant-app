import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import { formatGBP, formatLongDate, formatTime } from '@/lib/utils';
import AdminOrdersTable, { type OrderRow } from './AdminOrdersTable';

interface SearchParams {
  status?: string;
  payment?: string;
  q?: string;
}

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'on_its_way', label: 'On its way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const activeStatus = sp.status ?? 'all';
  const supabase = getServiceClient();

  let q = supabase
    .from('orders')
    .select(
      'id, ref, status, payment_method, payment_status, cod_status, customer_first_name, customer_last_name, customer_phone, delivery_postcode, total_gbp, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (activeStatus !== 'all') {
    q = q.eq(
      'status',
      activeStatus as 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled'
    );
  }
  if (sp.payment === 'card' || sp.payment === 'cod') {
    q = q.eq('payment_method', sp.payment);
  }
  if (sp.q) {
    q = q.or(
      `ref.ilike.%${sp.q}%,customer_first_name.ilike.%${sp.q}%,customer_last_name.ilike.%${sp.q}%,customer_phone.ilike.%${sp.q}%,delivery_postcode.ilike.%${sp.q}%`
    );
  }

  const { data: orders, error } = await q;

  // Fetch counts per status for the toolbar chips
  const { data: allTodayRaw } = await supabase
    .from('orders')
    .select('status')
    .order('created_at', { ascending: false })
    .limit(500);
  const allToday = allTodayRaw ?? [];
  const counts: Record<string, number> = {
    all: allToday.length,
    received: 0,
    preparing: 0,
    on_its_way: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const o of allToday) counts[o.status] = (counts[o.status] ?? 0) + 1;

  // Aggregate the line-item names per order — single round trip
  const orderIds = (orders ?? []).map((o) => o.id);
  const itemsByOrder: Record<string, string[]> = {};
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id, name, quantity')
      .in('order_id', orderIds);
    for (const it of items ?? []) {
      const arr = itemsByOrder[it.order_id] ?? (itemsByOrder[it.order_id] = []);
      arr.push(it.quantity > 1 ? `${it.name} × ${it.quantity}` : it.name);
    }
  }

  const rows: OrderRow[] = (orders ?? []).map((o) => ({
    ref: o.ref,
    status: o.status,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    codStatus: o.cod_status,
    customerName: `${o.customer_first_name} ${o.customer_last_name}`,
    customerPhone: o.customer_phone,
    deliveryPostcode: o.delivery_postcode,
    totalGbp: Number(o.total_gbp),
    createdAt: o.created_at,
    itemsLine: (itemsByOrder[o.id] ?? []).join(' · '),
  }));

  const today = formatLongDate(new Date());

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">{today} · Live service</div>
          <h1 className="admin-page-head__title">
            Today's <em>orders</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <Link
            href="/admin/payments"
            className="receipt-btn"
            style={{ textDecoration: 'none' }}
          >
            Payments →
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-banner admin-banner--danger" style={{ marginBottom: 16 }}>
          <p className="admin-banner__text">{error.message}</p>
        </div>
      )}

      <div className="admin-toolbar">
        <form className="admin-toolbar__search" method="get">
          {activeStatus !== 'all' && <input type="hidden" name="status" value={activeStatus} />}
          {sp.payment && <input type="hidden" name="payment" value={sp.payment} />}
          <svg
            className="admin-toolbar__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Search by order №, customer name, phone, or email…"
          />
        </form>
        {STATUS_PILLS.map((pill) => {
          const isActive = activeStatus === pill.value;
          const href =
            pill.value === 'all'
              ? `/admin/orders${sp.payment ? `?payment=${sp.payment}` : ''}`
              : `/admin/orders?status=${pill.value}${sp.payment ? `&payment=${sp.payment}` : ''}`;
          const count = counts[pill.value];
          return (
            <Link
              key={pill.value}
              href={href}
              className={`admin-filter ${isActive ? 'is-active' : ''}`}
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              {pill.label}
              {typeof count === 'number' && count > 0 && (
                <span className="admin-filter__count">{count}</span>
              )}
            </Link>
          );
        })}
      </div>

      <AdminOrdersTable rows={rows} />

      <p className="t-body-muted" style={{ marginTop: 16, textAlign: 'center' }}>
        Showing {rows.length} of {rows.length} orders.
      </p>
    </>
  );
}
