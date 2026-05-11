import Stripe from 'stripe';

/**
 * Server-side Stripe client. Never expose to the browser — uses the
 * STRIPE_SECRET_KEY. Lazily constructed so dev without keys doesn't crash.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set. Cannot create Stripe client.');
  }
  _stripe = new Stripe(key, {
    // Pin a known-good API version. Update as Stripe releases new ones.
    apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
    typescript: true,
    appInfo: {
      name: 'Hot N Nice Delicacies',
      version: '0.1.0',
    },
  });
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
