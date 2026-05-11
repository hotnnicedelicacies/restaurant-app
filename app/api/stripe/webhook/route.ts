import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { getServiceClient } from '@/lib/supabase/server';

/**
 * Stripe webhook handler.
 *
 * Events we listen to (configure these in Stripe dashboard at
 *   Developers → Webhooks → Add endpoint):
 *
 *   - payment_intent.succeeded      → mark order paid + (Phase 5) email
 *   - payment_intent.payment_failed → mark order failed
 *   - charge.refunded               → sync refund amount + reason
 *   - charge.dispute.created        → alert admin (Phase 5)
 *
 * Endpoint URL: /api/stripe/webhook
 */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get('stripe-signature');

  if (!sig) return new NextResponse('Missing signature', { status: 400 });
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return new NextResponse(`Webhook signature error: ${message}`, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata.order_id;
        if (!orderId) break;

        // Find latest charge for card details
        const charges = await getStripe().charges.list({ payment_intent: pi.id, limit: 1 });
        const charge = charges.data[0];

        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            card_brand: charge?.payment_method_details?.card?.brand ?? null,
            card_last4: charge?.payment_method_details?.card?.last4 ?? null,
          })
          .eq('id', orderId);

        // TODO Phase 5: trigger confirmation email via Resend
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata.order_id;
        if (!orderId) break;
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', orderId);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
        if (!piId) break;

        const { data: order } = await supabase
          .from('orders')
          .select('id, total_gbp')
          .eq('stripe_payment_intent_id', piId)
          .maybeSingle();
        if (!order) break;

        const refundedTotal = (charge.amount_refunded ?? 0) / 100;
        const fullyRefunded = refundedTotal >= Number(order.total_gbp);

        await supabase
          .from('orders')
          .update({
            payment_status: fullyRefunded ? 'refunded' : 'partially_refunded',
            refund_amount_gbp: refundedTotal,
          })
          .eq('id', order.id);
        break;
      }

      case 'charge.dispute.created': {
        // Phase 5: send urgent admin email
        const dispute = event.data.object as Stripe.Dispute;
        console.warn('[stripe] Dispute created on charge', dispute.charge, 'amount:', dispute.amount);
        // TODO: log to admin_alerts table or send email
        break;
      }

      default:
        // Ignore other event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe webhook] handler error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Stripe sends raw bodies; disable Next.js body parsing (we use request.text())
export const config = {
  api: {
    bodyParser: false,
  },
};
