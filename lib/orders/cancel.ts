'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { getOrderByRef } from '@/lib/data/orders';
import { sendEmail } from '@/lib/email/send';
import { cancellationEmail } from '@/lib/email/templates';
import { siteConfig } from '@/constants/siteConfig';
import { getContact } from '@/lib/data/contact';
import { getEmailConfig } from '@/lib/data/emailConfig';

type Result = { ok: true } | { ok: false; error: string };

/**
 * Customer-initiated cancellation. Only allowed while status='received'.
 * For card orders: issues a full Stripe refund (which the webhook syncs
 * back to payment_status). For COD: no money taken, just status change.
 *
 * Access control: the ref itself is the access token (matches the
 * /track/[ref] pattern). In production, additionally check that the
 * session user owns the order, but for v1 we trust the unguessable ref.
 */
export async function customerCancelOrder(ref: string): Promise<Result> {
  const order = await getOrderByRef(ref);
  if (!order) return { ok: false, error: 'Order not found.' };

  if (order.status !== 'received') {
    return {
      ok: false,
      error: "We've already started cooking — message us on WhatsApp instead.",
    };
  }

  const supabase = getServiceClient();

  // Mark order cancelled
  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: 'Cancelled by customer before cooking started',
    })
    .eq('id', order.id);

  if (updateErr) return { ok: false, error: updateErr.message };

  // For card: issue a Stripe refund. Webhook will sync payment_status + refund_amount.
  if (order.paymentMethod === 'card' && order.paymentStatus === 'paid') {
    try {
      const stripe = getStripe();
      // Find the PI id to refund
      const { data: row } = await supabase
        .from('orders')
        .select('stripe_payment_intent_id')
        .eq('id', order.id)
        .single();
      if (row?.stripe_payment_intent_id) {
        await stripe.refunds.create({
          payment_intent: row.stripe_payment_intent_id,
          reason: 'requested_by_customer',
        });
      }
    } catch (err) {
      // Refund failed — rollback the cancellation so admin can intervene
      await supabase
        .from('orders')
        .update({ status: 'received', cancelled_at: null, cancelled_reason: null })
        .eq('id', order.id);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Refund failed — please contact us on WhatsApp.',
      };
    }
  }

  // Auto kitchen note
  await supabase.from('kitchen_notes').insert({
    order_id: order.id,
    author_id: null,
    author_name: 'System',
    status_at_time: 'cancelled',
    body: order.paymentMethod === 'card'
      ? 'Order cancelled by customer. Full refund has been issued.'
      : 'Order cancelled by customer before cooking started.',
    visible_to_customer: true,
    emailed: false,
  });

  // Send cancellation email (best-effort)
  const refreshed = await getOrderByRef(ref);
  if (refreshed) {
    const contact = await getContact();
    const email = cancellationEmail(refreshed, {
      contactEmail: contact.email,
      contactWhatsapp: contact.whatsapp,
    }, 'Cancelled by customer before cooking started');
    await sendEmail({
      to: refreshed.customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    // Notify the kitchen — same pattern as the new-order alerts so the
    // owner sees a cancellation land in the inbox even if they're not
    // staring at the admin dashboard.
    try {
      const cfg = await getEmailConfig();
      if (cfg.notificationTo) {
        const refundLine =
          refreshed.paymentMethod === 'card'
            ? ' · refund issued'
            : refreshed.paymentMethod === 'cod'
              ? ' · COD (no payment taken)'
              : '';
        await sendEmail({
          to: cfg.notificationTo,
          subject: `Order cancelled by customer · ${refreshed.ref}${refundLine}`,
          html: email.html,
        });
      }
    } catch (err) {
      console.error('[customerCancelOrder] admin notification failed:', err);
    }
  }

  revalidatePath(siteConfig.routes.track(ref));
  return { ok: true };
}
