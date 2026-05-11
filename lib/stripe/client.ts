'use client';

import { loadStripe, type Stripe } from '@stripe/stripe-js';

/**
 * Client-side Stripe loader. Memoised so we only fetch the JS once.
 */
let _stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
  if (_stripePromise) return _stripePromise;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
    return Promise.resolve(null);
  }
  _stripePromise = loadStripe(key);
  return _stripePromise;
}
