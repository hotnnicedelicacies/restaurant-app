import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import { formatGBP, formatShortDate, formatTime } from '@/lib/utils';

interface SearchParams {
  range?: 'today' | 'week' | 'month' | 'all';
}

const RANGES: { value: NonNullable<SearchParams['range']>; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

function rangeStart(range: SearchParams['range']): string | null {
  const now = new Date();
  if (range === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === 'week') return new Date(now.getTime() - 7 * 86_400_000).toISOString();
  if (range === 'month') return new Date(now.getTime() - 30 * 86_400_000).toISOString();
  return null;
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const range = sp.range ?? 'today';
  const from = rangeStart(range);

  const supabase = getServiceClient();
  let q = supabase
    .from('orders')
    .select('id, ref, status, payment_method, payment_status, cod_status, customer_first_name, customer_last_name, total_gbp, refund_amount_gbp, created_at, delivery_date')
    .order('created_at', { ascending: false });
  if (from) q = q.gte('created_at', from);
  const { data: orders, error } = await q;

  const list = orders ?? [];
  const card = list.filter((o) => o.payment_method === 'card');
  const cod = list.filter((o) => o.payment_method === 'cod');

  const cardPaid = card.filter((o) => o.payment_status === 'paid');
  const cardRefunded = card.filter((o) => o.payment_status === 'refunded' || o.payment_status === 'partially_refunded');
  const codCollected = cod.filter((o) => o.cod_status === 'collected');
  const codUncollected = cod.filter((o) => o.cod_status !== 'collected' && o.status !== 'cancelled');

  const sumCardGross = cardPaid.reduce((s, o) => s + Number(o.total_gbp), 0);
  const sumCardRefunded = cardRefunded.reduce((s, o) => s + Number(o.refund_amount_gbp ?? 0), 0);
  const sumCardNet = sumCardGross - sumCardRefunded;
  const sumCodCollected = codCollected.reduce((s, o) => s + Number(o.total_gbp), 0);
  const sumCodOutstanding = codUncollected.reduce((s, o) => s + Number(o.total_gbp), 0);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
        <div>
          <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Money</p>
          <h1 className="m-0 font-serif text-[clamp(26px,3.4vw,32px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut">
            Payments & <em className="italic font-normal text-bronze-deep">reconciliation.</em>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/payments?range=${r.value}`}
              className={`rounded-[2px] border px-3 py-1.5 font-serif text-[12.5px] font-medium tracking-[0.04em] ${
                range === r.value ? 'border-walnut bg-walnut text-cream' : 'border-rule bg-cream text-walnut hover:border-walnut'
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-[2px] border border-danger/40 bg-danger/5 px-4 py-3 font-serif text-[13.5px] italic text-danger">
          {error.message}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Card · gross" value={formatGBP(sumCardGross)} sub={`${cardPaid.length} order${cardPaid.length === 1 ? '' : 's'}`} />
        <Stat label="Card · refunded" value={formatGBP(sumCardRefunded)} sub={`${cardRefunded.length} order${cardRefunded.length === 1 ? '' : 's'}`} tone="danger" />
        <Stat label="Card · net" value={formatGBP(sumCardNet)} sub="After refunds" tone="success" />
        <Stat label="COD · collected" value={formatGBP(sumCodCollected)} sub={`${codCollected.length} collected`} />
      </div>

      <section className="mb-8 rounded-[2px] border border-rule bg-cream p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="m-0 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
            COD outstanding · {formatGBP(sumCodOutstanding)}
          </h2>
          <p className="m-0 font-serif text-[12px] italic text-ink-muted">{codUncollected.length} order{codUncollected.length === 1 ? '' : 's'} awaiting cash collection</p>
        </div>
        {codUncollected.length === 0 ? (
          <p className="m-0 font-serif text-[13.5px] italic text-ink-muted">All caught up — no uncollected cash in this window.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {codUncollected.map((o) => (
              <li key={o.id} className="flex items-center justify-between border-t border-rule pt-2 first:border-0 first:pt-0">
                <div className="font-serif text-[13.5px] text-walnut">
                  <Link href={`/admin/orders/${o.ref}`} className="font-mono text-[12px] hover:text-bronze-deep">{o.ref}</Link>
                  <span className="mx-2 text-ink-muted">·</span>
                  {o.customer_first_name} {o.customer_last_name}
                  <span className="ml-2 text-[12px] italic text-ink-muted">{formatShortDate(o.delivery_date)}</span>
                </div>
                <div className="font-serif text-[14px] font-medium tabular-nums text-walnut">{formatGBP(Number(o.total_gbp))}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[2px] border border-rule bg-cream p-5">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
          Recent card payments ({card.length})
        </h2>
        {card.length === 0 ? (
          <p className="m-0 font-serif text-[13.5px] italic text-ink-muted">No card transactions in this window.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-bronze-deep">
                <th className="py-2 font-normal">Order</th>
                <th className="py-2 font-normal">Placed</th>
                <th className="py-2 font-normal">Customer</th>
                <th className="py-2 font-normal">Status</th>
                <th className="py-2 text-right font-normal">Net</th>
              </tr>
            </thead>
            <tbody className="font-serif text-[13.5px] text-walnut">
              {card.map((o) => {
                const refunded = Number(o.refund_amount_gbp ?? 0);
                const net = Number(o.total_gbp) - refunded;
                return (
                  <tr key={o.id} className="border-t border-rule">
                    <td className="py-2 pr-3">
                      <Link href={`/admin/orders/${o.ref}`} className="font-mono text-[12px] text-walnut hover:text-bronze-deep">{o.ref}</Link>
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11.5px] text-ink-muted">{formatShortDate(o.created_at)} · {formatTime(o.created_at)}</td>
                    <td className="py-2 pr-3">{o.customer_first_name} {o.customer_last_name}</td>
                    <td className="py-2 pr-3 text-[12px] italic text-ink-muted">{o.payment_status}{refunded > 0 ? ` · ${formatGBP(refunded)} refunded` : ''}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{formatGBP(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'success' | 'danger' }) {
  const accent =
    tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-walnut';
  return (
    <div className="rounded-[2px] border border-rule bg-cream p-4">
      <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">{label}</p>
      <p className={`m-0 font-serif text-[24px] font-medium tabular-nums leading-tight ${accent}`}>{value}</p>
      <p className="m-0 mt-1 font-serif text-[12px] italic text-ink-muted">{sub}</p>
    </div>
  );
}
