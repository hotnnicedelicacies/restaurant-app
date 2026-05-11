import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import { formatGBP, formatShortDate, formatTime } from '@/lib/utils';

interface SearchParams {
  status?: string;
  payment?: string;
  q?: string;
}

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: 'all', label: 'All open' },
  { value: 'received', label: 'Received' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'on_its_way', label: 'On its way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  preparing: 'Preparing',
  on_its_way: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const activeStatus = sp.status ?? 'all';
  const supabase = getServiceClient();

  let query = supabase
    .from('orders')
    .select('id, ref, status, payment_method, payment_status, cod_status, customer_first_name, customer_last_name, customer_phone, delivery_postcode, delivery_date, delivery_window_start, total_gbp, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (activeStatus !== 'all') {
    query = query.eq('status', activeStatus as 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled');
  }
  if (sp.payment === 'card' || sp.payment === 'cod') {
    query = query.eq('payment_method', sp.payment);
  }
  if (sp.q) {
    query = query.or(`ref.ilike.%${sp.q}%,customer_first_name.ilike.%${sp.q}%,customer_last_name.ilike.%${sp.q}%,customer_phone.ilike.%${sp.q}%,delivery_postcode.ilike.%${sp.q}%`);
  }

  const { data: orders, error } = await query;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
        <div>
          <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
            Orders
          </p>
          <h1 className="m-0 font-serif text-[clamp(26px,3.4vw,32px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut">
            Today's <em className="italic font-normal text-bronze-deep">service.</em>
          </h1>
        </div>
        <p className="m-0 font-serif text-[13px] italic text-ink-muted">
          {orders?.length ?? 0} order{orders?.length === 1 ? '' : 's'}
        </p>
      </header>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {STATUS_PILLS.map((pill) => {
          const isActive = activeStatus === pill.value;
          const href =
            pill.value === 'all'
              ? `/admin/orders${sp.payment ? `?payment=${sp.payment}` : ''}`
              : `/admin/orders?status=${pill.value}${sp.payment ? `&payment=${sp.payment}` : ''}`;
          return (
            <Link
              key={pill.value}
              href={href}
              className={`rounded-[2px] border px-3 py-1.5 font-serif text-[12.5px] font-medium tracking-[0.04em] transition-colors ${
                isActive
                  ? 'border-walnut bg-walnut text-cream'
                  : 'border-rule bg-cream text-walnut hover:border-walnut'
              }`}
            >
              {pill.label}
            </Link>
          );
        })}
        <span className="mx-2 h-5 w-px bg-rule" />
        <Link
          href={`/admin/orders${activeStatus !== 'all' ? `?status=${activeStatus}` : ''}`}
          className={`rounded-[2px] border px-3 py-1.5 font-serif text-[12.5px] font-medium ${!sp.payment ? 'border-walnut bg-walnut text-cream' : 'border-rule bg-cream text-walnut hover:border-walnut'}`}
        >
          All payment
        </Link>
        <Link
          href={`/admin/orders?payment=card${activeStatus !== 'all' ? `&status=${activeStatus}` : ''}`}
          className={`rounded-[2px] border px-3 py-1.5 font-serif text-[12.5px] font-medium ${sp.payment === 'card' ? 'border-walnut bg-walnut text-cream' : 'border-rule bg-cream text-walnut hover:border-walnut'}`}
        >
          Card
        </Link>
        <Link
          href={`/admin/orders?payment=cod${activeStatus !== 'all' ? `&status=${activeStatus}` : ''}`}
          className={`rounded-[2px] border px-3 py-1.5 font-serif text-[12.5px] font-medium ${sp.payment === 'cod' ? 'border-walnut bg-walnut text-cream' : 'border-rule bg-cream text-walnut hover:border-walnut'}`}
        >
          COD
        </Link>

        <form className="ml-auto flex items-center gap-2" method="get">
          {activeStatus !== 'all' && <input type="hidden" name="status" value={activeStatus} />}
          {sp.payment && <input type="hidden" name="payment" value={sp.payment} />}
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Search ref, name, postcode…"
            className="rounded-[2px] border border-rule bg-cream px-3 py-1.5 font-serif text-[13px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
          />
          <button
            type="submit"
            className="rounded-[2px] border border-walnut bg-transparent px-3 py-1.5 font-serif text-[12px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-[2px] border border-danger/40 bg-danger/5 px-4 py-3 font-serif text-[13.5px] italic text-danger">
          {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-[2px] border border-rule bg-cream">
        <table className="w-full border-collapse">
          <thead className="bg-cream-soft">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-bronze-deep">
              <th className="px-4 py-3 font-normal">Order</th>
              <th className="px-4 py-3 font-normal">Placed</th>
              <th className="px-4 py-3 font-normal">Customer</th>
              <th className="px-4 py-3 font-normal">Delivery</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Payment</th>
              <th className="px-4 py-3 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody className="font-serif text-[13.5px] text-walnut">
            {(orders ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-serif italic text-ink-muted">
                  No orders match those filters.
                </td>
              </tr>
            ) : (
              orders!.map((o) => (
                <tr key={o.id} className="border-t border-rule hover:bg-cream-soft">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.ref}`} className="font-mono text-[12.5px] text-walnut hover:text-bronze-deep">
                      {o.ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-muted">
                    {formatShortDate(o.created_at)} · {formatTime(o.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customer_first_name} {o.customer_last_name}</div>
                    <div className="text-[12px] italic text-ink-muted">{o.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-[12.5px]">
                    <div>{formatShortDate(o.delivery_date)}</div>
                    <div className="font-mono text-[11.5px] text-ink-muted">{o.delivery_window_start.slice(0, 5)} · {o.delivery_postcode}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-[12.5px]">
                    <div className="font-medium uppercase tracking-[0.04em]">{o.payment_method === 'card' ? 'Card' : 'COD'}</div>
                    <div className="text-[11.5px] italic text-ink-muted">
                      {o.payment_method === 'cod'
                        ? o.cod_status === 'collected' ? 'Collected' : 'Uncollected'
                        : o.payment_status}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatGBP(Number(o.total_gbp))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    received: 'border-bronze bg-bronze/10 text-bronze-deep',
    preparing: 'border-walnut bg-walnut/10 text-walnut',
    on_its_way: 'border-walnut bg-walnut text-cream',
    delivered: 'border-success bg-success/10 text-success',
    cancelled: 'border-danger bg-danger/10 text-danger',
  };
  return (
    <span className={`inline-block rounded-[2px] border px-2 py-0.5 font-serif text-[11.5px] font-medium tracking-[0.04em] [font-variant:small-caps] ${styles[status] ?? 'border-rule bg-cream text-walnut'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
