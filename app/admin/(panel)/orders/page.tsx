import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import { formatLongDate } from '@/lib/utils';
import { maybeBackSyncStripe } from '@/lib/admin/orderActions';
import AdminOrdersTable, { type OrderRow } from './AdminOrdersTable';
import ExportCsvButton from './ExportCsvButton';

export const dynamic = 'force-dynamic';

const SYNC_LOOKBACK_MS = 60 * 60 * 1000; // auto-sync only orders < 1h old

interface SearchParams {
  status?: string;
  payment?: string;
  q?: string;
  range?: 'today' | 'week' | 'month' | 'all';
}

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'on_its_way', label: 'On its way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const RANGES: { value: NonNullable<SearchParams['range']>; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

function rangeStart(range: SearchParams['range']): string | null {
  const now = new Date();
  if (!range || range === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === 'week') return new Date(now.getTime() - 7 * 86_400_000).toISOString();
  if (range === 'month') return new Date(now.getTime() - 30 * 86_400_000).toISOString();
  return null;
}

function buildHref(sp: SearchParams, overrides: Partial<SearchParams>): string {
  const merged = { ...sp, ...overrides };
  const params = new URLSearchParams();
  if (merged.status && merged.status !== 'all') params.set('status', merged.status);
  if (merged.payment) params.set('payment', merged.payment);
  if (merged.range && merged.range !== 'today') params.set('range', merged.range);
  if (merged.q) params.set('q', merged.q);
  return `/admin/orders${params.toString() ? `?${params.toString()}` : ''}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const activeStatus = sp.status ?? 'all';
  const range = sp.range ?? 'all';
  const supabase = getServiceClient();
  const from = rangeStart(range);

  function buildOrdersQuery() {
    let q = supabase
      .from('orders')
      .select(
        'id, ref, status, payment_method, payment_status, cod_status, customer_first_name, customer_last_name, customer_phone, delivery_postcode, total_gbp, created_at, stripe_payment_intent_id'
      )
      .order('created_at', { ascending: false })
      .limit(200);
    if (from) q = q.gte('created_at', from);
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
    return q;
  }

  let { data: orders, error } = await buildOrdersQuery();

  // Best-effort back-sync any pending/failed card orders in the last hour.
  // Parallel + 15s per-ref throttle in maybeBackSyncStripe keeps it cheap.
  const stalePendingRefs = (orders ?? [])
    .filter(
      (o) =>
        o.payment_method === 'card' &&
        (o.payment_status === 'pending' || o.payment_status === 'failed') &&
        Date.now() - new Date(o.created_at).getTime() < SYNC_LOOKBACK_MS
    )
    .map((o) => o.ref);
  if (stalePendingRefs.length > 0) {
    await Promise.all(stalePendingRefs.map((r) => maybeBackSyncStripe(r, 'orders-list')));
    const refresh = await buildOrdersQuery();
    if (refresh.data) orders = refresh.data;
  }

  // Counts per status — scoped to the same date range as the table.
  let countsQuery = supabase.from('orders').select('status');
  if (from) countsQuery = countsQuery.gte('created_at', from);
  const { data: allInRange } = await countsQuery;
  const counts: Record<string, number> = {
    all: (allInRange ?? []).length,
    received: 0,
    preparing: 0,
    on_its_way: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const o of allInRange ?? []) counts[o.status] = (counts[o.status] ?? 0) + 1;

  // Aggregate line-item names per order
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
    stripePaymentIntentId: o.stripe_payment_intent_id,
  }));

  const today = formatLongDate(new Date());
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? 'All time';

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">
            {rangeLabel} · {today}
          </div>
          <h1 className="admin-page-head__title">
            Today's <em>orders</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <ExportCsvButton rows={rows} rangeLabel={rangeLabel} />
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
          {sp.range && sp.range !== 'today' && (
            <input type="hidden" name="range" value={sp.range} />
          )}
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
          const count = counts[pill.value];
          return (
            <Link
              key={pill.value}
              href={buildHref(sp, { status: pill.value })}
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
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={buildHref(sp, { range: r.value })}
              className={`admin-filter ${range === r.value ? 'is-active' : ''}`}
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              {r.label}
            </Link>
          ))}
        </span>
      </div>

      <AdminOrdersTable rows={rows} />

      <p className="t-body-muted" style={{ marginTop: 16, textAlign: 'center' }}>
        Showing {rows.length} {rows.length === 1 ? 'order' : 'orders'} · {rangeLabel.toLowerCase()}
      </p>
    </>
  );
}
