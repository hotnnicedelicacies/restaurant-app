'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { getOrderByRef } from '@/lib/data/orders';
import { sendEmail } from '@/lib/email/send';
import { statusUpdateEmail, cancellationEmail } from '@/lib/email/templates';
import { siteConfig } from '@/constants/siteConfig';
import { requireAdmin } from './auth';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  preparing: 'Preparing',
  on_its_way: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/**
 * Move an order through the lifecycle. Optionally adds a kitchen note that
 * is emailed to the customer when visibleToCustomer is true.
 */
export async function updateOrderStatus(args: {
  ref: string;
  next: 'received' | 'preparing' | 'on_its_way' | 'delivered';
  noteBody?: string;
  noteVisibleToCustomer?: boolean;
}): Promise<Result> {
  const admin = await requireAdmin();
  const order = await getOrderByRef(args.ref);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.status === 'cancelled') return { ok: false, error: 'Cancelled orders cannot change status.' };

  const supabase = getServiceClient();
  const { error: updErr } = await supabase
    .from('orders')
    .update({ status: args.next })
    .eq('id', order.id);
  if (updErr) return { ok: false, error: updErr.message };

  let note = args.noteBody?.trim() ?? null;
  const visibleToCustomer = note ? Boolean(args.noteVisibleToCustomer) : false;

  // Always log a system note on transitions for the kitchen timeline
  await supabase.from('kitchen_notes').insert({
    order_id: order.id,
    author_id: admin.id,
    author_name: admin.displayName,
    status_at_time: args.next,
    body: note ?? `Status moved to ${STATUS_LABELS[args.next] ?? args.next}.`,
    visible_to_customer: visibleToCustomer,
    emailed: false,
  });

  // Email customer the kitchen note if visible
  if (note && visibleToCustomer) {
    const refreshed = await getOrderByRef(args.ref);
    if (refreshed) {
      const email = statusUpdateEmail(refreshed, {
        author: admin.displayName,
        body: note,
        statusLabel: STATUS_LABELS[args.next] ?? args.next,
      });
      await sendEmail({
        to: refreshed.customer.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
    }
  }

  revalidatePath(`/admin/orders/${args.ref}`);
  revalidatePath('/admin/orders');
  revalidatePath(`/track/${args.ref}`);
  return { ok: true };
}

/** Mark a COD order as collected (driver returned with cash). */
export async function markCodCollected(ref: string): Promise<Result> {
  const admin = await requireAdmin();
  const order = await getOrderByRef(ref);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.paymentMethod !== 'cod') return { ok: false, error: 'Only COD orders can be marked collected.' };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('orders')
    .update({
      cod_status: 'collected',
      cod_collected_at: new Date().toISOString(),
      cod_collected_by: admin.id,
      payment_status: 'paid',
    })
    .eq('id', order.id);
  if (error) return { ok: false, error: error.message };

  await supabase.from('kitchen_notes').insert({
    order_id: order.id,
    author_id: admin.id,
    author_name: admin.displayName,
    status_at_time: order.status,
    body: 'COD payment collected.',
    visible_to_customer: false,
    emailed: false,
  });

  revalidatePath(`/admin/orders/${ref}`);
  revalidatePath('/admin/payments');
  return { ok: true };
}

/** Issue a refund — full or partial — against a paid card order. */
export async function refundOrder(args: { ref: string; amountGbp?: number; reason?: string }): Promise<Result> {
  const admin = await requireAdmin();
  const order = await getOrderByRef(args.ref);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.paymentMethod !== 'card') return { ok: false, error: 'Refunds only available for card payments.' };
  if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'partially_refunded') {
    return { ok: false, error: `Cannot refund order with payment status ${order.paymentStatus}.` };
  }

  const supabase = getServiceClient();
  const { data: row } = await supabase
    .from('orders')
    .select('stripe_payment_intent_id')
    .eq('id', order.id)
    .single();
  if (!row?.stripe_payment_intent_id) return { ok: false, error: 'No Stripe payment intent on file.' };

  try {
    await getStripe().refunds.create({
      payment_intent: row.stripe_payment_intent_id,
      amount: args.amountGbp ? Math.round(args.amountGbp * 100) : undefined,
      reason: 'requested_by_customer',
      metadata: {
        refunded_by: admin.id,
        order_ref: order.ref,
        admin_reason: args.reason ?? '',
      },
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Refund failed.' };
  }

  await supabase.from('kitchen_notes').insert({
    order_id: order.id,
    author_id: admin.id,
    author_name: admin.displayName,
    status_at_time: order.status,
    body: args.amountGbp
      ? `Issued partial refund of £${args.amountGbp.toFixed(2)}.${args.reason ? ` Reason: ${args.reason}` : ''}`
      : `Issued full refund.${args.reason ? ` Reason: ${args.reason}` : ''}`,
    visible_to_customer: false,
    emailed: false,
  });

  revalidatePath(`/admin/orders/${args.ref}`);
  revalidatePath('/admin/payments');
  return { ok: true };
}

/** Admin-initiated cancellation. Issues full refund if card+paid. */
export async function adminCancelOrder(ref: string, reason: string): Promise<Result> {
  const admin = await requireAdmin();
  const order = await getOrderByRef(ref);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.status === 'cancelled') return { ok: false, error: 'Already cancelled.' };
  if (order.status === 'delivered') return { ok: false, error: 'Cannot cancel a delivered order.' };

  const supabase = getServiceClient();
  const { error: updErr } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason,
    })
    .eq('id', order.id);
  if (updErr) return { ok: false, error: updErr.message };

  if (order.paymentMethod === 'card' && order.paymentStatus === 'paid') {
    const { data: row } = await supabase
      .from('orders')
      .select('stripe_payment_intent_id')
      .eq('id', order.id)
      .single();
    if (row?.stripe_payment_intent_id) {
      try {
        await getStripe().refunds.create({
          payment_intent: row.stripe_payment_intent_id,
          reason: 'requested_by_customer',
          metadata: { order_ref: order.ref, cancelled_by: admin.id },
        });
      } catch (err) {
        // Roll back
        await supabase
          .from('orders')
          .update({ status: order.status, cancelled_at: null, cancelled_reason: null })
          .eq('id', order.id);
        return { ok: false, error: err instanceof Error ? err.message : 'Refund failed; cancel rolled back.' };
      }
    }
  }

  await supabase.from('kitchen_notes').insert({
    order_id: order.id,
    author_id: admin.id,
    author_name: admin.displayName,
    status_at_time: 'cancelled',
    body: `Cancelled by ${admin.displayName}. Reason: ${reason}`,
    visible_to_customer: true,
    emailed: false,
  });

  // Email customer
  const refreshed = await getOrderByRef(ref);
  if (refreshed) {
    const email = cancellationEmail(refreshed, reason);
    await sendEmail({
      to: refreshed.customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }

  revalidatePath(`/admin/orders/${ref}`);
  revalidatePath('/admin/orders');
  revalidatePath(`/track/${ref}`);
  return { ok: true };
}

/** Add a free-form kitchen note. */
export async function addKitchenNote(args: {
  ref: string;
  body: string;
  visibleToCustomer: boolean;
}): Promise<Result> {
  const admin = await requireAdmin();
  const order = await getOrderByRef(args.ref);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (!args.body.trim()) return { ok: false, error: 'Note cannot be empty.' };

  const supabase = getServiceClient();
  await supabase.from('kitchen_notes').insert({
    order_id: order.id,
    author_id: admin.id,
    author_name: admin.displayName,
    status_at_time: order.status,
    body: args.body.trim(),
    visible_to_customer: args.visibleToCustomer,
    emailed: false,
  });

  if (args.visibleToCustomer) {
    const email = statusUpdateEmail(order, {
      author: admin.displayName,
      body: args.body.trim(),
      statusLabel: STATUS_LABELS[order.status] ?? order.status,
    });
    await sendEmail({
      to: order.customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }

  revalidatePath(`/admin/orders/${args.ref}`);
  revalidatePath(`/track/${args.ref}`);
  return { ok: true };
}

/**
 * Manual Stripe sync — used when the webhook may have been missed (local
 * dev without `stripe listen`, transient network issue, etc.). Fetches
 * the PaymentIntent + latest charge from Stripe directly and reconciles
 * payment_status / card_brand / card_last4 / refund_amount on our order.
 */
export async function syncStripePayment(
  ref: string,
  opts?: { actorName?: string; actorId?: string | null }
): Promise<Result<{ paymentStatus: string; changed: boolean }>> {
  let actorId: string | null = opts?.actorId ?? null;
  let actorName: string = opts?.actorName ?? 'System';
  if (!opts) {
    // Manual invocation from admin UI — require admin.
    const admin = await requireAdmin();
    actorId = admin.id;
    actorName = admin.displayName;
  }

  const order = await getOrderByRef(ref);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.paymentMethod !== 'card') return { ok: false, error: 'Only card orders can be synced.' };

  const supabase = getServiceClient();
  const { data: row } = await supabase
    .from('orders')
    .select('stripe_payment_intent_id')
    .eq('id', order.id)
    .single();
  if (!row?.stripe_payment_intent_id) return { ok: false, error: 'No Stripe PaymentIntent on file.' };

  let stripeStatus: string;
  let cardBrand: string | null = null;
  let cardLast4: string | null = null;
  let refundedTotal = 0;

  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id, {
      expand: ['latest_charge'],
    });
    stripeStatus = pi.status; // 'succeeded' | 'requires_payment_method' | 'requires_action' | etc.
    const charge =
      pi.latest_charge && typeof pi.latest_charge !== 'string' ? pi.latest_charge : null;
    if (charge) {
      cardBrand = charge.payment_method_details?.card?.brand ?? null;
      cardLast4 = charge.payment_method_details?.card?.last4 ?? null;
      refundedTotal = (charge.amount_refunded ?? 0) / 100;
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Stripe lookup failed.' };
  }

  // Map Stripe states to our payment_status
  let nextPaymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  if (stripeStatus === 'succeeded') {
    if (refundedTotal >= Number(order.totalGbp)) nextPaymentStatus = 'refunded';
    else if (refundedTotal > 0) nextPaymentStatus = 'partially_refunded';
    else nextPaymentStatus = 'paid';
  } else if (stripeStatus === 'canceled' || stripeStatus === 'requires_payment_method') {
    nextPaymentStatus = 'failed';
  } else {
    nextPaymentStatus = 'pending';
  }

  const changed = nextPaymentStatus !== order.paymentStatus;

  if (changed) {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: nextPaymentStatus,
        card_brand: cardBrand,
        card_last4: cardLast4,
        refund_amount_gbp: refundedTotal > 0 ? refundedTotal : null,
      })
      .eq('id', order.id);
    if (error) return { ok: false, error: error.message };

    await supabase.from('kitchen_notes').insert({
      order_id: order.id,
      author_id: actorId,
      author_name: actorName,
      status_at_time: order.status,
      body: `Stripe re-sync · payment_status now '${nextPaymentStatus}' (stripe says '${stripeStatus}').`,
      visible_to_customer: false,
      emailed: false,
    });

    // Bust the order ref everywhere it appears so customer-facing pages
    // (receipt, track, confirmation) don't keep serving the stale status.
    revalidatePath(`/admin/orders/${ref}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin/payments');
    revalidatePath(`/receipt/${ref}`);
    revalidatePath(`/track/${ref}`);
    revalidatePath(`/confirmation/${ref}`);
  }

  return { ok: true, data: { paymentStatus: nextPaymentStatus, changed } };
}

/**
 * Best-effort background sync invoked from server components (no auth
 * required because we don't expose it as an action). Throttles per ref
 * using an in-memory map so a fast double-load doesn't double-hit Stripe.
 * Use from `/admin/orders/[ref]` page load when payment_status is pending
 * or failed and the order is more than ~30s old.
 */
const _lastSyncAt = new Map<string, number>();
const SYNC_COOLDOWN_MS = 15_000; // 15s between auto-syncs per ref

export async function maybeBackSyncStripe(
  ref: string,
  reason: string
): Promise<void> {
  try {
    const now = Date.now();
    const last = _lastSyncAt.get(ref) ?? 0;
    if (now - last < SYNC_COOLDOWN_MS) return;
    _lastSyncAt.set(ref, now);
    await syncStripePayment(ref, { actorName: `Auto-sync (${reason})`, actorId: null });
  } catch {
    // Swallow — never break page rendering because of a sync hiccup.
  }
}
