import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PageHero from '@/components/layout/PageHero';
import HeritageButton from '@/components/ui/HeritageButton';
import CustomerCancelButton from './CustomerCancelButton';
import { getOrderByRef } from '@/lib/data/orders';
import { getServiceClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';
import { formatGBP, formatShortDate, formatTime } from '@/lib/utils';
import Image from 'next/image';
import { getStorageUrl } from '@/lib/supabase/storage';

export const metadata: Metadata = {
  title: 'Track order',
  robots: { index: false, follow: false },
};

// Always show the freshest status — webhooks / admin syncs flip status
// continuously and stale renders confuse customers.
export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, { label: string; numeral: string }> = {
  received: { label: 'Received', numeral: 'i' },
  preparing: { label: 'Preparing', numeral: 'ii' },
  on_its_way: { label: 'On its way', numeral: 'iii' },
  delivered: { label: 'Delivered', numeral: 'iv' },
};

const STAGES = ['received', 'preparing', 'on_its_way', 'delivered'] as const;

export default async function TrackPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const order = await getOrderByRef(ref);
  if (!order) notFound();

  // Latest kitchen note (visible-to-customer)
  const supabase = getServiceClient();
  const { data: notes } = await supabase
    .from('kitchen_notes')
    .select('*')
    .eq('order_id', order.id)
    .eq('visible_to_customer', true)
    .order('created_at', { ascending: false });
  const latestNote = notes?.[0];

  const isCancelled = order.status === 'cancelled';
  const currentStageIdx = isCancelled ? -1 : STAGES.indexOf(order.status as typeof STAGES[number]);
  const canCancel = order.status === 'received';

  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow={`Order Tracking · ${isCancelled ? 'Cancelled' : 'Live status'}`}
          title={
            isCancelled ? (
              <>This order is <em>cancelled.</em></>
            ) : order.status === 'delivered' ? (
              <>Order <em>delivered.</em></>
            ) : (
              <>Your order is <em>on the way.</em></>
            )
          }
          sub={`Order № ${order.ref} · Placed ${formatShortDate(order.createdAt)} at ${formatTime(order.createdAt)}`}
        />

        <section className="container py-[clamp(40px,5vw,56px)] pb-[clamp(48px,7vw,88px)]">
          <div className="grid items-start gap-[clamp(28px,4vw,40px)] md:grid-cols-[1.4fr_1fr]">
            <main className="min-w-0">

              {/* Status */}
              <section className="mb-5 rounded-[2px] border border-rule bg-cream p-6">
                <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
                  <h2 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut">
                    Status · <em className="font-normal italic">{isCancelled ? 'Cancelled' : STATUS_LABELS[order.status]?.label ?? order.status}</em>
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">Live</span>
                </header>

                {/* Timeline */}
                {!isCancelled && (
                  <div className="relative grid grid-cols-4 gap-4 my-6" aria-label="Order progress">
                    <div className="pointer-events-none absolute top-[18px] left-[12.5%] right-[12.5%] h-px bg-rule" aria-hidden />
                    {STAGES.map((stage, i) => {
                      const isDone = i < currentStageIdx;
                      const isCurrent = i === currentStageIdx;
                      const isPending = i > currentStageIdx;
                      return (
                        <div key={stage} className="relative z-10 text-center">
                          <div
                            className={`mx-auto mb-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-full font-serif text-[16px] italic ${
                              isCurrent
                                ? 'border border-walnut bg-walnut text-cream'
                                : isDone
                                  ? 'border border-bronze bg-bronze text-walnut'
                                  : 'border border-rule bg-cream text-ink-muted'
                            }`}
                            style={isCurrent ? { boxShadow: '0 0 0 5px var(--color-cream-soft)' } : undefined}
                          >
                            {STATUS_LABELS[stage]?.numeral}
                          </div>
                          <p className={`m-0 font-serif text-[12px] font-medium tracking-[0.12em] [font-variant:small-caps] ${isPending ? 'text-ink-muted' : 'text-walnut'}`}>
                            {STATUS_LABELS[stage]?.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isCancelled && (
                  <p className="m-0 font-serif text-[16px] italic leading-[1.5] text-ink-muted">
                    {order.cancelledReason ?? 'This order has been cancelled.'}
                    {order.refundAmountGbp && (
                      <span> A refund of <b className="not-italic font-medium text-walnut">{formatGBP(order.refundAmountGbp)}</b> has been issued. It typically arrives in 5–10 business days.</span>
                    )}
                  </p>
                )}

                {latestNote && !isCancelled && (
                  <div className="mt-5 rounded-r-[2px] border-l-[3px] border-bronze bg-cream-soft p-4">
                    <p className="m-0 mb-1 font-serif text-[14px] font-medium text-walnut">
                      From the kitchen · {formatTime(latestNote.created_at)}
                    </p>
                    <p className="m-0 font-serif text-[17px] italic leading-[1.55] text-walnut">
                      "{latestNote.body}"
                    </p>
                  </div>
                )}
              </section>

              {/* Items */}
              <section className="mb-5 rounded-[2px] border border-rule bg-cream p-6">
                <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
                  <h2 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut">
                    What you <em className="font-normal italic">ordered</em>
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">
                    {order.items.length} item{order.items.length === 1 ? '' : 's'}
                  </span>
                </header>

                <div className="flex flex-col gap-3">
                  {order.items.map((item) => {
                    const variantParts = Object.entries(item.variantsChosen ?? {}).map(([k, v]) => `${v.label}`);
                    const addonsLine = (item.addonsChosen ?? []).map((a) => a.label).join(', ');
                    return (
                      <div key={item.id} className="grid grid-cols-[44px_1fr_auto] items-start gap-3">
                        {item.imagePath ? (
                          <Image
                            src={getStorageUrl(item.imagePath)}
                            alt={item.name}
                            width={88}
                            height={88}
                            className="aspect-square w-11 rounded-[2px] object-cover"
                          />
                        ) : (
                          <div className="aspect-square w-11 rounded-[2px] bg-cream-soft" />
                        )}
                        <div className="min-w-0">
                          <h3 className="m-0 font-serif text-[15px] font-medium leading-tight text-walnut">{item.name}</h3>
                          {(variantParts.length > 0 || addonsLine) && (
                            <p className="m-0 mt-0.5 font-serif text-[12.5px] italic leading-[1.4] text-ink-muted">
                              {[variantParts.join(' · '), addonsLine].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="m-0 mt-1 border-l-2 border-rule pl-3 font-serif text-[12.5px] italic text-ink-muted">
                              "{item.specialInstructions}"
                            </p>
                          )}
                          <span className="font-mono text-[11px] text-ink-muted">× {item.quantity}</span>
                        </div>
                        <span className="whitespace-nowrap font-serif text-[15px] font-semibold text-walnut">
                          {formatGBP(item.lineTotalGbp)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-1 border-t border-rule pt-4 font-serif text-[15px] text-walnut">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatGBP(order.subtotalGbp)}</span></div>
                  <div className="flex justify-between italic text-ink-muted"><span>Delivery</span><span>{formatGBP(order.delivery.feeGbp)}</span></div>
                  <div className="mt-1.5 flex justify-between border-t border-rule pt-3 text-[18px] font-semibold">
                    <span>
                      {order.paymentMethod === 'card'
                        ? `Paid · ${order.cardBrand ? `${order.cardBrand} ${order.cardLast4 ?? ''}` : 'Card'}`
                        : `Due on delivery · Cash`}
                    </span>
                    <span>{formatGBP(order.totalGbp)}</span>
                  </div>
                </div>
              </section>

              {/* Help + Cancel */}
              <section className="rounded-[2px] border border-rule bg-cream p-6 text-center">
                <h3 className="m-0 mb-2 font-serif text-[20px] font-medium text-walnut">
                  Need to change something?
                </h3>
                {canCancel ? (
                  <>
                    <p className="m-0 mb-4 font-serif text-[14px] italic text-ink-muted">
                      We haven't started cooking yet — you can cancel now for an instant full refund.
                    </p>
                    <CustomerCancelButton orderRef={order.ref} paymentMethod={order.paymentMethod} />
                    <div className="mt-4 border-t border-dashed border-rule pt-4">
                      <p className="m-0 mb-2 font-serif text-[14px] italic text-ink-muted">
                        Or message us with changes:
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <HeritageButton
                          href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(`Hi Hot N Nice — I have a question about my order ${order.ref}.\n\n`)}`}
                          variant="ghost"
                        >
                          Message us on WhatsApp
                        </HeritageButton>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="m-0 mb-4 font-serif text-[14px] italic text-ink-muted">
                      {isCancelled
                        ? 'This order has been cancelled.'
                        : `Your order is ${STATUS_LABELS[order.status]?.label.toLowerCase()}. Self-cancellation is only available before the kitchen starts cooking — message us for changes from here.`}
                    </p>
                    {!isCancelled && (
                      <div className="flex flex-wrap justify-center gap-3">
                        <HeritageButton
                          href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(`Hi Hot N Nice — I have a question about my order ${order.ref}.\n\n`)}`}
                          variant="primary"
                        >
                          Message us on WhatsApp →
                        </HeritageButton>
                        <HeritageButton href={`tel:${siteConfig.contact.phone}`} variant="ghost">
                          Call the kitchen
                        </HeritageButton>
                      </div>
                    )}
                  </>
                )}
              </section>
            </main>

            {/* Delivery sidebar */}
            <aside className="sticky top-[92px]">
              <div className="rounded-[2px] border border-rule bg-cream p-6">
                <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
                  <h2 className="m-0 font-serif text-[22px] font-medium text-walnut">Delivering <em className="font-normal italic">to</em></h2>
                </header>
                <p className="m-0 mb-1 font-serif text-[15px] font-medium text-walnut">
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                <p className="m-0 mb-2 font-serif text-[14px] italic text-ink-muted">
                  {order.delivery.line1}{order.delivery.line2 ? `, ${order.delivery.line2}` : ''}
                  <br />{order.delivery.city} · {order.delivery.postcode}
                </p>
                <p className="m-0 font-serif text-[14px] italic text-ink-muted">{order.customer.phone}</p>

                <div className="mt-4 border-t border-rule pt-4">
                  <div className="flex justify-between font-serif text-[14px] italic text-ink-muted">
                    <span>Window</span>
                    <span>{order.delivery.windowStart.slice(0, 5)} – {order.delivery.windowEnd.slice(0, 5)}</span>
                  </div>
                </div>

                <a
                  href={siteConfig.routes.receipt(order.ref)}
                  className="mt-4 block w-full rounded-[2px] border border-walnut px-5 py-3 text-center font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] transition-colors hover:bg-walnut hover:text-cream"
                >
                  View receipt →
                </a>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
