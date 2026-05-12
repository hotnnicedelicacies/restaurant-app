import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';
import { getServiceClient } from '@/lib/supabase/server';
import { getOrderByRef } from '@/lib/data/orders';
import { sendEmail } from '@/lib/email/send';
import { orderConfirmationEmail } from '@/lib/email/templates';
import { siteConfig } from '@/constants/siteConfig';

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

        // Send confirmation email (best-effort; logged but not blocking)
        const ref = pi.metadata.order_ref;
        if (ref) {
          const order = await getOrderByRef(ref);
          if (order) {
            const email = orderConfirmationEmail(order);
            await sendEmail({
              to: order.customer.email,
              subject: email.subject,
              html: email.html,
              text: email.text,
            });
            // Notify admin too (best-effort)
            const adminTo = process.env.ORDER_NOTIFICATION_EMAIL || siteConfig.email.notificationToDefault;
            if (adminTo) {
              await sendEmail({
                to: adminTo,
                subject: `New order · ${order.ref} · ${email.subject.replace('Order received · ', '')}`,
                html: email.html,
              });
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled': {
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
        // Disputes have a hard ~7-day response SLA from Stripe — get an
        // alert into the kitchen inbox immediately so admin can pull the
        // evidence together. Best-effort: never throw out of the webhook.
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
        const amount = (dispute.amount ?? 0) / 100;
        console.warn('[stripe] Dispute created on charge', chargeId, 'amount:', amount, 'reason:', dispute.reason);
        try {
          const adminTo = process.env.ORDER_NOTIFICATION_EMAIL || siteConfig.email.notificationToDefault;
          if (adminTo) {
            const stripeUrl = chargeId ? `https://dashboard.stripe.com/charges/${chargeId}` : 'https://dashboard.stripe.com/disputes';
            await sendEmail({
              to: adminTo,
              subject: `⚠ Stripe dispute · ${dispute.reason ?? 'unknown reason'} · £${amount.toFixed(2)}`,
              html: `
                <div style="font-family:'Cormorant Garamond',serif;color:#2D1F18;">
                  <p style="font-family:'Geist Mono',monospace;font-size:11px;letter-spacing:0.18em;color:#7E5530;text-transform:uppercase;">Dispute created</p>
                  <h1 style="margin:0 0 12px;font-size:24px;">A customer has disputed a charge.</h1>
                  <p><b>Charge:</b> ${chargeId ?? '—'}</p>
                  <p><b>Amount:</b> £${amount.toFixed(2)}</p>
                  <p><b>Reason:</b> ${dispute.reason ?? 'unknown'}</p>
                  <p><a href="${stripeUrl}" style="color:#7E5530;">Open in Stripe →</a></p>
                  <p style="font-style:italic;color:#4a3a2c;">Respond within 7 days or the dispute is lost. Submit evidence (receipt, delivery confirmation, kitchen notes) from the Stripe dashboard.</p>
                </div>
              `,
              text: `Stripe dispute created.\nCharge: ${chargeId ?? '—'}\nAmount: £${amount.toFixed(2)}\nReason: ${dispute.reason ?? 'unknown'}\n\nOpen in Stripe: ${stripeUrl}\n\nRespond within 7 days.`,
            });
          }
        } catch (err) {
          console.error('[stripe webhook] dispute email failed:', err);
        }
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

// App router route handlers don't auto-parse bodies — request.text() gives
// the raw payload Stripe needs for signature verification. No config needed.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
