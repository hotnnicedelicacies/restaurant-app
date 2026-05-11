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
  if (key.startsWith('pk_')) {
    // Loud diagnostic — Stripe's own message ("cannot be made with a
    // publishable API key") only surfaces inside the failing API call.
    throw new Error(
      'STRIPE_SECRET_KEY is set to a publishable key (pk_…). It must be the secret key (sk_…). Update the env var in Vercel.'
    );
  }
  _stripe = new Stripe(key, {
    apiVersion: '2026-04-22.dahlia',
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
