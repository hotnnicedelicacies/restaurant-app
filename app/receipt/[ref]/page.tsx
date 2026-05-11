import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderByRef } from '@/lib/data/orders';
import { siteConfig } from '@/constants/siteConfig';
import { formatGBP, formatLongDate, formatTime } from '@/lib/utils';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Receipt',
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  preparing: 'Preparing',
  on_its_way: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default async function ReceiptPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const order = await getOrderByRef(ref);
  if (!order) notFound();

  const paymentLabel =
    order.paymentMethod === 'card'
      ? order.paymentStatus === 'refunded'
        ? 'Refunded · Card'
        : order.paymentStatus === 'partially_refunded'
          ? 'Partially refunded · Card'
          : order.paymentStatus === 'paid'
            ? `Paid · ${order.cardBrand ? `${order.cardBrand} ending ${order.cardLast4}` : 'Card'}`
            : 'Card · pending'
      : order.codStatus === 'collected'
        ? 'Paid · Cash on delivery'
        : 'Due on delivery · Cash';

  return (
    <div className="min-h-screen bg-cream-soft text-walnut">
      {/* Action bar — hidden when printing */}
      <div className="print:hidden">
        <div className="border-b border-rule bg-cream">
          <div className="mx-auto flex max-w-[820px] items-center justify-between gap-3 px-6 py-4">
            <Link
              href={siteConfig.routes.track(order.ref)}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-walnut hover:text-bronze-deep"
            >
              ← Back to tracking
            </Link>
            <PrintButton />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[820px] px-6 py-10 print:px-0 print:py-0">
        <article className="rounded-[2px] border border-rule bg-cream p-[clamp(28px,5vw,56px)] print:rounded-none print:border-0 print:p-10">
          {/* Letterhead */}
          <header className="mb-8 flex items-start justify-between gap-6 border-b border-rule pb-7">
            <div>
              <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
                Vol. 01 · Receipt
              </p>
              <h1 className="m-0 font-serif text-[clamp(28px,4vw,36px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut">
                {siteConfig.name}
              </h1>
              <p className="m-0 mt-1 font-serif text-[13px] italic text-ink-muted">
                {siteConfig.voice.kitchenLocation}
              </p>
            </div>
            <div className="text-right">
              <p className="m-0 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
                Order №
              </p>
              <p className="m-0 mt-1 font-mono text-[15px] tracking-[0.04em] text-walnut">
                {order.ref}
              </p>
              <p className="m-0 mt-2 font-serif text-[12px] italic text-ink-muted">
                Issued {formatLongDate(order.createdAt)}
              </p>
            </div>
          </header>

          {/* Customer + delivery + payment grid */}
          <section className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <MetaBlock label="Billed to">
              <b className="font-medium">{order.customer.firstName} {order.customer.lastName}</b>
              <br />
              <span className="italic text-ink-muted">{order.customer.email}</span>
              <br />
              <span className="italic text-ink-muted">{order.customer.phone}</span>
            </MetaBlock>
            <MetaBlock label="Delivered to">
              {order.delivery.line1}
              {order.delivery.line2 && <><br />{order.delivery.line2}</>}
              <br />{order.delivery.city}
              <br />{order.delivery.postcode}
            </MetaBlock>
            <MetaBlock label="Delivery window">
              <b className="font-medium">{formatLongDate(order.delivery.date)}</b>
              <br />
              {order.delivery.windowStart.slice(0, 5)} – {order.delivery.windowEnd.slice(0, 5)}
              <br />
              <span className="italic text-ink-muted">Status · {STATUS_LABELS[order.status] ?? order.status}</span>
            </MetaBlock>
          </section>

          {/* Line items */}
          <section className="mb-6">
            <h2 className="mb-3 border-b border-rule pb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
              Items ordered
            </h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">
                  <th className="py-2.5 font-normal">Description</th>
                  <th className="py-2.5 text-right font-normal">Qty</th>
                  <th className="py-2.5 text-right font-normal">Unit</th>
                  <th className="py-2.5 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody className="font-serif text-[14px] text-walnut">
                {order.items.map((item) => {
                  const variantParts = Object.values(item.variantsChosen ?? {}).map((v) => v.label);
                  const addonsLine = (item.addonsChosen ?? []).map((a) => a.label).join(', ');
                  const sublines = [variantParts.join(' · '), addonsLine].filter(Boolean).join(' · ');
                  return (
                    <tr key={item.id} className="border-t border-rule align-top">
                      <td className="py-3 pr-3">
                        <div className="font-medium">{item.name}</div>
                        {sublines && (
                          <div className="mt-0.5 font-serif text-[12.5px] italic text-ink-muted">{sublines}</div>
                        )}
                        {item.specialInstructions && (
                          <div className="mt-1 border-l-2 border-rule pl-2.5 font-serif text-[12.5px] italic text-ink-muted">
                            "{item.specialInstructions}"
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono text-[13px] tabular-nums">× {item.quantity}</td>
                      <td className="py-3 text-right tabular-nums">{formatGBP(item.unitPriceGbp)}</td>
                      <td className="py-3 text-right tabular-nums font-medium">{formatGBP(item.lineTotalGbp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="mb-8 ml-auto max-w-[360px]">
            <div className="flex justify-between border-t border-rule py-2 font-serif text-[14px] text-walnut">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatGBP(order.subtotalGbp)}</span>
            </div>
            <div className="flex justify-between py-2 font-serif text-[14px] italic text-ink-muted">
              <span>Delivery</span>
              <span className="tabular-nums">{formatGBP(order.delivery.feeGbp)}</span>
            </div>
            <div className="flex justify-between border-t border-walnut py-3 font-serif text-[17px] font-semibold text-walnut">
              <span>Total</span>
              <span className="tabular-nums">{formatGBP(order.totalGbp)}</span>
            </div>
            <p className="m-0 mt-1 text-right font-serif text-[12px] italic text-ink-muted">
              {paymentLabel}
            </p>
            {order.refundAmountGbp && order.refundAmountGbp > 0 && (
              <div className="mt-2 flex justify-between border-t border-dashed border-rule pt-2 font-serif text-[13px] italic text-ink-muted">
                <span>Refunded</span>
                <span className="tabular-nums">{formatGBP(order.refundAmountGbp)}</span>
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="border-t border-rule pt-5 text-center">
            <p className="m-0 font-serif text-[14px] italic text-ink-muted">
              {siteConfig.voice.tagline}
            </p>
            <p className="m-0 mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
              {siteConfig.contact.email} · {siteConfig.contact.phone}
            </p>
            <p className="m-0 mt-3 font-serif text-[12px] italic text-ink-muted">
              Food hygiene rating · {siteConfig.foodHygiene.rating}/5 ({siteConfig.foodHygiene.ratingLabel}) ·{' '}
              {siteConfig.foodHygiene.authority}
            </p>
          </footer>
        </article>

        <p className="mt-6 text-center font-serif text-[12px] italic text-ink-muted print:hidden">
          Need this as a PDF? Use your browser's "Save as PDF" option from the print dialog.
        </p>
      </main>
    </div>
  );
}

function MetaBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-bronze-deep">{label}</div>
      <div className="font-serif text-[14px] leading-[1.4] text-walnut">{children}</div>
    </div>
  );
}
