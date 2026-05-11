import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import { formatGBP, formatShortDate, formatTime } from '@/lib/utils';

interface SearchParams {
  range?: 'today' | 'week' | 'month' | 'all';
  tab?: 'stripe' | 'cod' | 'refunds';
}

const RANGES: { value: NonNullable<SearchParams['range']>; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
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

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const range = sp.range ?? 'today';
  const tab = sp.tab ?? 'stripe';
  const from = rangeStart(range);

  const supabase = getServiceClient();
  let q = supabase
    .from('orders')
    .select(
      'id, ref, status, payment_method, payment_status, cod_status, customer_first_name, customer_last_name, total_gbp, refund_amount_gbp, card_brand, card_last4, stripe_payment_intent_id, created_at, delivery_date'
    )
    .order('created_at', { ascending: false });
  if (from) q = q.gte('created_at', from);
  const { data: orders } = await q;

  const list = orders ?? [];
  const card = list.filter((o) => o.payment_method === 'card');
  const cod = list.filter((o) => o.payment_method === 'cod');
  const cardPaid = card.filter((o) => o.payment_status === 'paid' || o.payment_status === 'partially_refunded');
  const cardRefunded = card.filter((o) => Number(o.refund_amount_gbp ?? 0) > 0);
  const codCollected = cod.filter((o) => o.cod_status === 'collected');
  const codUncollected = cod.filter((o) => o.cod_status !== 'collected' && o.status !== 'cancelled');

  const sumCardGross = cardPaid.reduce((s, o) => s + Number(o.total_gbp), 0);
  const sumCardRefunded = cardRefunded.reduce((s, o) => s + Number(o.refund_amount_gbp ?? 0), 0);
  const sumCodCollected = codCollected.reduce((s, o) => s + Number(o.total_gbp), 0);
  const sumCodOutstanding = codUncollected.reduce((s, o) => s + Number(o.total_gbp), 0);
  const sumGross = sumCardGross + sumCodCollected;

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">Payments &amp; reconciliation</div>
          <h1 className="admin-page-head__title">
            The <em>books</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/payments?range=${r.value}${sp.tab ? `&tab=${sp.tab}` : ''}`}
              className={`admin-filter ${range === r.value ? 'is-active' : ''}`}
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI stats */}
      <div className="admin-stats">
        <Stat label={`${RANGES.find((r) => r.value === range)?.label} · Gross`} value={formatGBP(sumGross)} />
        <Stat label="Card · Net" value={formatGBP(sumCardGross - sumCardRefunded)} sub={`${cardPaid.length} payments · Stripe`} />
        <Stat label="COD · Collected" value={formatGBP(sumCodCollected)} sub={`${codCollected.length} of ${cod.length} orders`} />
        <Stat
          label="Uncollected COD"
          value={formatGBP(sumCodOutstanding)}
          sub={`${codUncollected.length} order${codUncollected.length === 1 ? '' : 's'} awaiting cash`}
          tone={sumCodOutstanding > 0 ? 'danger' : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="tabs" role="tablist">
        {[
          { key: 'stripe', label: 'Stripe payments', count: card.length },
          { key: 'cod', label: 'COD reconciliation', count: codUncollected.length },
          { key: 'refunds', label: 'Refunds', count: cardRefunded.length },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/admin/payments?range=${range}&tab=${t.key}`}
            className={`tab ${tab === t.key ? 'is-active' : ''}`}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            {t.label} <span className="tab__count">{t.count}</span>
          </Link>
        ))}
      </div>

      {tab === 'stripe' && (
        <section className="tab-panel is-active">
          <div className="admin-table-wrap" style={{ marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Stripe ID / Time</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Card</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {card.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <p className="t-body-muted">No card transactions in this window.</p>
                    </td>
                  </tr>
                ) : (
                  card.map((o) => {
                    const refunded = Number(o.refund_amount_gbp ?? 0);
                    const fullyRefunded = refunded >= Number(o.total_gbp);
                    return (
                      <tr key={o.id}>
                        <td>
                          <div className="admin-table__ref">
                            {o.stripe_payment_intent_id ? `${o.stripe_payment_intent_id.slice(0, 8)}…${o.stripe_payment_intent_id.slice(-4)}` : '—'}
                          </div>
                          <div className="admin-table__time">
                            {formatShortDate(o.created_at)} · {formatTime(o.created_at)}
                          </div>
                        </td>
                        <td>
                          <Link
                            href={`/admin/orders/${o.ref}`}
                            className="admin-table__action"
                            style={{ margin: 0, fontStyle: 'normal' }}
                          >
                            {o.ref}
                          </Link>
                        </td>
                        <td>
                          <div className="admin-table__customer">
                            <b>
                              {o.customer_first_name} {o.customer_last_name}
                            </b>
                          </div>
                        </td>
                        <td>
                          {o.card_brand ? `${o.card_brand} · ${o.card_last4 ?? '****'}` : '—'}
                        </td>
                        <td className="admin-table__total">
                          {formatGBP(Number(o.total_gbp))}
                          {refunded > 0 && (
                            <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--color-ink-muted)' }}>
                              − {formatGBP(refunded)} refunded
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={fullyRefunded ? 'pill pill--refunded' : refunded > 0 ? 'pill pill--refunded' : 'pill pill--collected'}>
                            {fullyRefunded ? 'Refunded' : refunded > 0 ? 'Partial refund' : 'Succeeded'}
                          </span>
                        </td>
                        <td className="admin-table__actions">
                          <Link href={`/admin/orders/${o.ref}`} className="admin-table__action">
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'cod' && (
        <section className="tab-panel is-active">
          <div className="admin-table-wrap" style={{ marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Delivery</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cod.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <p className="t-body-muted">No COD orders in this window.</p>
                    </td>
                  </tr>
                ) : (
                  cod.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          href={`/admin/orders/${o.ref}`}
                          className="admin-table__action"
                          style={{ margin: 0, fontStyle: 'normal' }}
                        >
                          {o.ref}
                        </Link>
                        <div className="admin-table__time">{formatTime(o.created_at)}</div>
                      </td>
                      <td>
                        <div className="admin-table__customer">
                          <b>
                            {o.customer_first_name} {o.customer_last_name}
                          </b>
                        </div>
                      </td>
                      <td>{formatShortDate(o.delivery_date)}</td>
                      <td className="admin-table__total">{formatGBP(Number(o.total_gbp))}</td>
                      <td>
                        <span className={o.cod_status === 'collected' ? 'pill pill--collected' : 'pill pill--uncollected'}>
                          {o.cod_status === 'collected' ? 'Collected' : 'Awaiting cash'}
                        </span>
                      </td>
                      <td className="admin-table__actions">
                        <Link href={`/admin/orders/${o.ref}`} className="admin-table__action">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'refunds' && (
        <section className="tab-panel is-active">
          <div className="admin-table-wrap" style={{ marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Refunded</th>
                  <th>Original</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cardRefunded.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <p className="t-body-muted">No refunds in this window.</p>
                    </td>
                  </tr>
                ) : (
                  cardRefunded.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          href={`/admin/orders/${o.ref}`}
                          className="admin-table__action"
                          style={{ margin: 0, fontStyle: 'normal' }}
                        >
                          {o.ref}
                        </Link>
                      </td>
                      <td>
                        <div className="admin-table__customer">
                          <b>
                            {o.customer_first_name} {o.customer_last_name}
                          </b>
                        </div>
                      </td>
                      <td>{formatShortDate(o.created_at)}</td>
                      <td className="admin-table__total">{formatGBP(Number(o.refund_amount_gbp ?? 0))}</td>
                      <td className="admin-table__total" style={{ fontStyle: 'italic', color: 'var(--color-ink-muted)' }}>
                        {formatGBP(Number(o.total_gbp))}
                      </td>
                      <td className="admin-table__actions">
                        <Link href={`/admin/orders/${o.ref}`} className="admin-table__action">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'danger';
}) {
  return (
    <div className="admin-stat">
      <div className="admin-stat__label">{label}</div>
      <div className="admin-stat__value" style={tone === 'danger' ? { color: 'var(--color-danger)' } : undefined}>
        {value}
      </div>
      {sub && <div className="admin-stat__delta">{sub}</div>}
    </div>
  );
}
