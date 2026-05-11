'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

/**
 * Mounted inside <Elements clientSecret=…>. Renders Stripe's PaymentElement
 * iframe + a confirm-payment button. On success Stripe redirects to the
 * return_url (the confirmation page). On failure we surface the error.
 */
export default function StripePaymentSection({
  orderRef,
  returnUrl,
  onClearCart,
}: {
  orderRef: string;
  returnUrl: string;
  onClearCart: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    // Clear the cart optimistically — even if the payment fails the customer
    // can retry from the existing order via the same /checkout link.
    onClearCart();
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // confirmPayment only returns here on immediate error (e.g. validation
    // failure). On success Stripe redirects to return_url before we get here.
    if (error) {
      toast.error(error.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="rounded-[2px] border border-[--color-border] bg-[--color-cream] p-6">
        <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-[--color-border] pb-3.5">
          <h2 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-[--color-walnut] [&_em]:font-normal [&_em]:italic">
            Card <em>details</em>
          </h2>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[--color-bronze-deep]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1e7d3f]" />
            Secured by Stripe
          </span>
        </header>

        <div className="rounded-[2px] border border-[--color-border] bg-[--color-cream-soft] p-4">
          <PaymentElement />
        </div>

        <p className="mt-4 flex items-start gap-1.5 font-serif text-[12.5px] italic leading-[1.5] text-[--color-ink-muted]">
          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[--color-bronze-deep]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            <b className="font-medium not-italic text-[--color-walnut]">Your card details never touch our servers.</b>{' '}
            They're entered directly into Stripe's hosted form — we receive only a payment token.
          </span>
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-[2px] bg-[--color-walnut] px-5 py-4 font-serif text-[15px] font-semibold uppercase tracking-[0.16em] text-[--color-cream] [font-variant:small-caps] transition-colors hover:bg-[--color-bronze-deep] disabled:opacity-50"
      >
        {submitting ? 'Confirming payment…' : `Pay & place order · № ${orderRef}`}
      </button>

      <p className="text-center font-serif text-[13px] italic text-[--color-ink-muted]">
        Your order is held for 30 minutes while you complete payment.
      </p>
    </form>
  );
}
