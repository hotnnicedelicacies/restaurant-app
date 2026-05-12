import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getOrderByRef } from '@/lib/data/orders';
import { siteConfig } from '@/constants/siteConfig';
import { formatGBP, formatLongDate, formatTime } from '@/lib/utils';
import { maybeBackSyncStripe } from '@/lib/admin/orderActions';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Receipt',
  robots: { index: false, follow: false },
};

// Never cache the receipt — payment_status can flip via webhook or admin
// Stripe re-sync at any point and the receipt must show the latest truth.
export const dynamic = 'force-dynamic';

const SYNC_LOOKBACK_MS = 60 * 60 * 1000;

export default async function ReceiptPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  let order = await getOrderByRef(ref);
  if (!order) notFound();

  // If a customer lands here with a card payment still pending or failed
  // and the order is recent, re-pull from Stripe before rendering.
  if (
    order.paymentMethod === 'card' &&
    (order.paymentStatus === 'pending' || order.paymentStatus === 'failed') &&
    Date.now() - new Date(order.createdAt).getTime() < SYNC_LOOKBACK_MS
  ) {
    await maybeBackSyncStripe(order.ref, 'receipt');
    const refreshed = await getOrderByRef(ref);
    if (refreshed) order = refreshed;
  }

  const isPaid =
    (order.paymentMethod === 'card' && order.paymentStatus === 'paid') ||
    (order.paymentMethod === 'cod' && order.codStatus === 'collected');
  const isRefunded = order.paymentStatus === 'refunded';
  const isPartial = order.paymentStatus === 'partially_refunded';
  const isPending = order.paymentMethod === 'card' && order.paymentStatus === 'pending';
  const isFailed = order.paymentStatus === 'failed';

  const stampLabel = isRefunded
    ? 'Refunded'
    : isPartial
      ? 'Partial refund'
      : isPaid
        ? 'Paid'
        : isFailed
          ? 'Failed'
          : isPending
            ? 'Pending'
            : 'Due on delivery';

  const stampColor = isPaid
    ? '#1e7d3f'
    : isRefunded || isFailed
      ? '#8B2A1A'
      : 'var(--color-bronze-deep)';

  const paymentStatusLine = isPaid
    ? 'Paid in full'
    : isRefunded
      ? `Refunded ${formatGBP(order.refundAmountGbp ?? order.totalGbp)}`
      : isPartial
        ? `Partially refunded ${formatGBP(order.refundAmountGbp ?? 0)}`
        : isPending
          ? 'Awaiting confirmation from Stripe'
          : isFailed
            ? "Payment didn't go through"
            : order.paymentMethod === 'cod'
              ? 'Due on delivery (cash)'
              : 'Pending';

  return (
    <>
      {/* Slim header — hidden when printing */}
      <header
        className="print:hidden"
        style={{
          background: 'var(--color-walnut)',
          color: 'var(--color-cream)',
          borderBottom: '1px solid var(--color-rule-light)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            gap: 16,
          }}
        >
          <a href="/" style={{ display: 'inline-flex' }}>
            <Image src="/logo.png" alt={siteConfig.name} width={36} height={36} />
          </a>
          <span className="t-mono" style={{ color: 'var(--color-bronze)', letterSpacing: '0.22em' }}>
            Receipt
          </span>
          <a
            href="/account"
            style={{
              color: 'var(--color-cream)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 14,
              borderBottom: '1px solid var(--color-rule-light)',
              paddingBottom: 2,
            }}
          >
            ← My account
          </a>
        </div>
      </header>

      <div className="receipt-page">
        {/* Action bar (hidden in print) */}
        <div className="receipt-actions print:hidden">
          <div className="receipt-actions__left">
            For your records · We&apos;ve also emailed a copy.
          </div>
          <div className="receipt-actions__right">
            <PrintButton />
          </div>
        </div>

        {/* Receipt document */}
        <article className="receipt">
          <div className="receipt__paid-stamp" style={{ color: stampColor, borderColor: stampColor }}>
            {stampLabel}
          </div>

          <header className="receipt__header">
            <div className="receipt__brand">
              <Image src="/logo.png" alt={siteConfig.name} width={60} height={60} />
              <div className="receipt__brand-meta">
                A home kitchen · Middlesbrough
                <br />
                {siteConfig.contact.email}
                <br />
                {siteConfig.contact.phone}
              </div>
            </div>
            <div className="receipt__doc-info">
              <div className="receipt__doc-type">Receipt</div>
              <div className="receipt__ref">№ {order.ref}</div>
              <div className="receipt__date">
                Issued · {formatLongDate(order.createdAt)}
              </div>
            </div>
          </header>

          <h1 className="receipt__title">
            Receipt for your <em>order</em>
          </h1>
          <p className="receipt__title-sub">
            Thank you for ordering with us. This is your record of payment.
          </p>

          {/* Parties */}
          <div className="receipt__parties">
            <div>
              <div className="receipt__party-label">Billed to</div>
              <p className="receipt__party-name">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="receipt__party-lines">
                {order.delivery.line1}
                {order.delivery.line2 && <>, {order.delivery.line2}</>}
                <br />
                {order.delivery.city} · {order.delivery.postcode}
                <br />
                {order.customer.email}
                <br />
                {order.customer.phone}
              </p>
            </div>
            <div>
              <div className="receipt__party-label">Delivered to</div>
              <p className="receipt__party-name">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <p className="receipt__party-lines">
                {order.delivery.line1}
                {order.delivery.line2 && <>, {order.delivery.line2}</>}
                <br />
                {order.delivery.city} · {order.delivery.postcode}
                <br />
                <b>
                  {order.status === 'delivered'
                    ? 'Delivered'
                    : order.status === 'cancelled'
                      ? 'Cancelled'
                      : 'Scheduled'}
                </b>{' '}
                · {formatLongDate(order.delivery.date)}
                {order.status !== 'cancelled' && (
                  <>
                    <br />
                    Window {order.delivery.windowStart.slice(0, 5)} – {order.delivery.windowEnd.slice(0, 5)}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Itemized table */}
          <table className="receipt__table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="receipt__qty-col">Qty</th>
                <th className="receipt__unit-col">Unit</th>
                <th className="receipt__total-col">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const variantParts = Object.values(item.variantsChosen ?? {}).map((v) => v.label);
                const addonsLine = (item.addonsChosen ?? []).map((a) => a.label).join(', ');
                const meta = [variantParts.join(' · '), addonsLine].filter(Boolean).join(' · ');
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="receipt__item-name">{item.name}</div>
                      {meta && <div className="receipt__item-meta">{meta}</div>}
                      {item.specialInstructions && (
                        <div className="receipt__item-note">
                          &quot;{item.specialInstructions}&quot;
                        </div>
                      )}
                    </td>
                    <td className="receipt__qty">{item.quantity}</td>
                    <td style={{ textAlign: 'right', paddingRight: 12 }}>
                      {formatGBP(item.unitPriceGbp)}
                    </td>
                    <td>{formatGBP(item.lineTotalGbp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="receipt__totals">
            <div className="receipt__total-row">
              <span>Subtotal</span>
              <span>{formatGBP(order.subtotalGbp)}</span>
            </div>
            <div className="receipt__total-row receipt__total-row--muted">
              <span>
                Delivery <em>· {order.delivery.city} {order.delivery.postcode.split(' ')[0]}</em>
              </span>
              <span>{formatGBP(order.delivery.feeGbp)}</span>
            </div>
            <div className="receipt__total-row receipt__total-row--grand">
              <span>{isPaid ? 'Total paid' : isRefunded ? 'Total (refunded)' : 'Total'}</span>
              <span>{formatGBP(order.totalGbp)}</span>
            </div>
            {order.refundAmountGbp && order.refundAmountGbp > 0 && !isRefunded && (
              <div className="receipt__total-row receipt__total-row--muted">
                <span>
                  <em>Refunded</em>
                </span>
                <span>− {formatGBP(order.refundAmountGbp)}</span>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="receipt__payment">
            <div>
              <div className="receipt__payment-label">Payment method</div>
              <p className="receipt__payment-value">
                {order.paymentMethod === 'card' ? (
                  <>
                    {order.cardBrand ? (
                      <>
                        <b>{order.cardBrand}</b> ending {order.cardLast4 ?? '••••'}
                      </>
                    ) : (
                      <b>Card</b>
                    )}
                    <br />
                    <em>Processed securely by Stripe</em>
                  </>
                ) : (
                  <>
                    <b>Cash on delivery</b>
                    <br />
                    <em>Paid to the driver on arrival</em>
                  </>
                )}
              </p>
            </div>
            <div>
              <div className="receipt__payment-label">Payment status</div>
              <p className="receipt__payment-value">
                <b style={{ color: stampColor }}>{paymentStatusLine}</b>
                <br />
                <em>
                  {isPaid
                    ? `Receipt · ${formatLongDate(order.createdAt)}, ${formatTime(order.createdAt)}`
                    : isPending
                      ? 'This page will update when payment clears.'
                      : isFailed
                        ? 'Please retry payment or contact us.'
                        : `Order placed · ${formatTime(order.createdAt)}`}
                </em>
              </p>
            </div>
          </div>

          {/* Thanks */}
          <p className="receipt__thanks">
            &quot;No shortcuts. No frozen meals. Just dinner. Thank you for ordering.&quot;
          </p>

          {/* Footer */}
          <footer className="receipt__footer">
            <div className="receipt__footer-hygiene">
              ★ ★ ★ ★ ★ &nbsp;Food Hygiene · {siteConfig.foodHygiene.authority}
            </div>
            {siteConfig.name} · Middlesbrough, UK
            <br />
            Questions about this receipt?{' '}
            <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a> ·{' '}
            <a href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phone}</a>
          </footer>
        </article>

      </div>

      {/* Site footer — hidden in print. Slim variant: just the copy strip. */}
      <footer className="site-footer print:hidden" style={{ paddingTop: 32 }}>
        <div className="container">
          <div className="site-footer__copy" style={{ border: 0, paddingTop: 0 }}>
            <span>
              © {new Date().getFullYear()} {siteConfig.name} · Middlesbrough, UK
            </span>
            <span>
              ★ ★ ★ ★ ★ &nbsp;Food Hygiene · {siteConfig.foodHygiene.authority}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
