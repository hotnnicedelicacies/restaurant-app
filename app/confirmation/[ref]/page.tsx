import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import HeritageButton from '@/components/ui/HeritageButton';
import { getOrderByRef } from '@/lib/data/orders';
import { siteConfig } from '@/constants/siteConfig';
import { formatGBP, formatLongDate, formatTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ payment_intent?: string; redirect_status?: string }>;
}

/**
 * Customer-facing order confirmation. Reached from:
 *   - Stripe redirect after successful card payment: /confirmation/[ref]?payment_intent=…&redirect_status=succeeded
 *   - Direct redirect after COD checkout: /confirmation/[ref]
 *
 * The `payment_intent` query parameter from Stripe is informational only —
 * the source of truth is the webhook setting orders.payment_status.
 */
export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { ref } = await params;
  const order = await getOrderByRef(ref);
  if (!order) notFound();

  const sp = await searchParams;
  const cardPending = order.paymentMethod === 'card' && order.paymentStatus === 'pending';
  const cardFailed = sp.redirect_status === 'failed';

  return (
    <>
      <SiteHeader />
      <main>
        <section className="py-[clamp(56px,8vw,96px)]">
          <div className="container">
            <div className="mx-auto max-w-[760px] rounded-[2px] border border-[--color-border] bg-[--color-cream] p-[clamp(36px,5vw,56px)] text-center">
              {cardFailed ? (
                <FailedHeader />
              ) : (
                <SuccessHeader name={order.customer.firstName} />
              )}

              <span className="mb-7 inline-block rounded-[2px] border border-[--color-border] px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.2em] text-[--color-walnut]">
                Order № {order.ref}
              </span>

              <div className="my-6 mx-auto block h-px w-10 bg-[--color-bronze] opacity-70" />

              <div className="my-7 grid grid-cols-1 gap-6 border-y border-[--color-border] py-6 text-left sm:grid-cols-3">
                <Meta label="Delivering to">
                  <b className="font-medium">{order.customer.firstName} {order.customer.lastName}</b>
                  <br />{order.delivery.line1}{order.delivery.line2 ? `, ${order.delivery.line2}` : ''}
                  <br />{order.delivery.city} · {order.delivery.postcode}
                </Meta>
                <Meta label="When">
                  <b className="font-medium">{formatLongDate(order.delivery.date)}</b>
                  <br />Window · {order.delivery.windowStart.slice(0, 5)} – {order.delivery.windowEnd.slice(0, 5)}
                  <br /><em className="italic text-[--color-ink-muted]">Cooked this morning</em>
                </Meta>
                <Meta label={order.paymentMethod === 'card' ? 'Paid' : 'Payment'}>
                  <b className="font-medium">{formatGBP(order.totalGbp)}</b>
                  <br />
                  {order.paymentMethod === 'card'
                    ? order.cardBrand
                      ? `${order.cardBrand} ending ${order.cardLast4}`
                      : 'Card payment'
                    : 'Cash on delivery'}
                  <br />
                  <em className="italic text-[--color-ink-muted]">
                    {order.paymentStatus === 'paid'
                      ? 'Receipt sent to email'
                      : order.paymentMethod === 'cod'
                        ? 'Pay the driver on arrival'
                        : 'Confirming payment…'}
                  </em>
                </Meta>
              </div>

              {cardPending && (
                <p className="mb-4 mx-auto max-w-[52ch] font-serif text-[14px] italic text-[--color-ink-muted]">
                  Your payment is being confirmed. You'll get an email the moment it clears — usually within a minute.
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-3">
                <HeritageButton href={siteConfig.routes.track(order.ref)} variant="primary">
                  Track your order →
                </HeritageButton>
                <HeritageButton href={siteConfig.routes.menu} variant="ghost">
                  Browse the menu
                </HeritageButton>
              </div>

              <p className="mt-6 font-serif text-[14px] italic text-[--color-ink-muted]">
                We've also sent a confirmation to{' '}
                <b className="font-medium not-italic text-[--color-walnut]">{order.customer.email}</b>.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SuccessHeader({ name }: { name: string }) {
  return (
    <>
      <div
        aria-hidden
        className="relative mx-auto mb-6 inline-flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[--color-bronze]"
      >
        <span className="font-serif text-[36px] italic font-normal leading-none text-[--color-bronze-deep]">✓</span>
      </div>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[--color-bronze-deep]">
        Order received · {formatLongDate(new Date())}
      </div>
      <h1 className="m-0 mb-3 font-serif text-[clamp(32px,4.5vw,48px)] font-medium leading-[1.04] tracking-[-0.005em] text-[--color-walnut]">
        Thank you, <em className="italic font-normal text-[--color-bronze-deep]">{name}.</em>
      </h1>
      <p className="mx-auto mb-6 max-w-[52ch] font-serif text-[17px] italic leading-[1.5] text-[--color-ink-muted]">
        Your order is in. The kitchen has it on the pass — you'll get a text when it leaves the kitchen, and another when it's at your door.
      </p>
    </>
  );
}

function FailedHeader() {
  return (
    <>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8B2A1A]">
        Payment didn't go through
      </div>
      <h1 className="m-0 mb-3 font-serif text-[clamp(32px,4.5vw,48px)] font-medium leading-[1.04] tracking-[-0.005em] text-[--color-walnut]">
        Let's try that <em className="italic font-normal text-[#8B2A1A]">again.</em>
      </h1>
      <p className="mx-auto mb-6 max-w-[52ch] font-serif text-[17px] italic leading-[1.5] text-[--color-ink-muted]">
        No money was taken. Your order is held — head back to checkout to retry with a different card, or message us on WhatsApp.
      </p>
    </>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[--color-bronze-deep]">{label}</div>
      <div className="font-serif text-[15px] leading-[1.4] text-[--color-walnut]">{children}</div>
    </div>
  );
}
