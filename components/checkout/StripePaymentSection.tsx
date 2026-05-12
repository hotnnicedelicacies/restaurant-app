'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
}: {
  orderRef: string;
  returnUrl: string;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error('Payment form is still loading. Try again in a moment.');
      return;
    }

    setSubmitting(true);
    // NB: don't clear the cart here. If we do, the parent CheckoutForm
    // sees an empty cart and unmounts these Elements before Stripe can
    // 3DS / redirect, dropping the user onto an "empty basket" screen.
    // The confirmation page clears the cart once payment lands.
    //
    // `redirect: 'if_required'` — for plain card payments that don't need
    // 3DS (e.g. Stripe's 4242 test card), confirmPayment succeeds inline
    // and we navigate to /confirmation ourselves. Without this flag,
    // Stripe always tries to redirect, which behaves unpredictably across
    // localhost / iframes / popup blockers and was a likely cause of
    // PaymentIntents stranded in `requires_payment_method`.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    if (error) {
      // Validation error (invalid card / wrong CVC), card declined, etc.
      // Stripe surfaces the message — show it loud.
      console.error('[stripe] confirmPayment failed', error);
      toast.error(error.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    // Inline success path (no redirect was needed — typical for test card).
    // Stripe also returns here after a successful 3DS redirect that didn't
    // hit return_url for any reason. Either way, head to the confirmation.
    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      router.push(returnUrl);
      return;
    }

    // We're here without an error AND without a succeeded PI. That's
    // ambiguous — surface it rather than silently leaving the user
    // staring at a spinning button.
    toast.error('Payment did not complete. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="rounded-[2px] border border-rule bg-cream p-6">
        <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
          <h2 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
            Card <em>details</em>
          </h2>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-bronze-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1e7d3f]" />
            Secured by Stripe
          </span>
        </header>

        <div className="rounded-[2px] border border-rule bg-cream-soft p-4">
          <PaymentElement />
        </div>

        <p className="mt-4 flex items-start gap-1.5 font-serif text-[12.5px] italic leading-[1.5] text-ink-muted">
          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-bronze-deep" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            <b className="font-medium not-italic text-walnut">Your card details never touch our servers.</b>{' '}
            They're entered directly into Stripe's hosted form — we receive only a payment token.
          </span>
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-[2px] bg-walnut px-5 py-4 font-serif text-[15px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-50"
      >
        {submitting ? 'Confirming payment…' : `Pay & place order · № ${orderRef}`}
      </button>

      <p className="text-center font-serif text-[13px] italic text-ink-muted">
        Your order is held for 30 minutes while you complete payment.
      </p>
    </form>
  );
}
