'use server';

import { z } from 'zod';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { matchZoneByPostcode } from '@/lib/data/zones';
import { getStripe } from '@/lib/stripe/server';
import { siteConfig } from '@/constants/siteConfig';
import { sendEmail } from '@/lib/email/send';
import { orderConfirmationEmail } from '@/lib/email/templates';
import { getOrderByRef } from '@/lib/data/orders';

// --- Schema for incoming order payload ---

const cartLineSchema = z.object({
  menuItemId: z.string(),
  slug: z.string(),
  name: z.string(),
  basePriceGbp: z.number().nonnegative(),
  unitPriceGbp: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  variantsChosen: z.record(
    z.string(),
    z.object({ label: z.string(), deltaGbp: z.number() })
  ),
  addonsChosen: z.array(z.object({ label: z.string(), deltaGbp: z.number() })),
  specialInstructions: z.string().optional(),
  imageSrc: z.string().optional(),
});

const createOrderSchema = z.object({
  // Contact
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(7, 'Valid phone required'),
  email: z.string().email('Valid email required'),
  // Delivery
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().min(2),
  deliveryDate: z.string().min(1),
  deliveryWindowStart: z.string().min(1),
  deliveryWindowEnd: z.string().min(1),
  deliveryNotes: z.string().optional(),
  // Payment
  paymentMethod: z.enum(['card', 'cod']),
  // Cart
  lines: z.array(cartLineSchema).min(1, 'Your basket is empty'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type CreateOrderResult =
  | { ok: true; ref: string; orderId: string; clientSecret?: string }
  | { ok: false; error: string; field?: string };

/**
 * Server action: validate input + match zone + create order + (for card)
 * create a Stripe PaymentIntent → return the clientSecret for the client
 * to confirm. For COD: order is created immediately as pending.
 *
 * Uses the SERVICE client to insert orders, because guest checkouts (no
 * profile_id) need to bypass RLS that requires auth.uid().
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  // 1. Validate
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: String(first.path[0] ?? '') };
  }
  const data = parsed.data;

  // 2. Match zone (also enforces "in delivery area")
  const zone = await matchZoneByPostcode(data.postcode);
  if (!zone) {
    return {
      ok: false,
      field: 'postcode',
      error: "We don't deliver to this postcode by default. Please message us on WhatsApp.",
    };
  }

  // 3. Compute totals server-side (never trust client prices)
  const subtotal = data.lines.reduce((sum, l) => sum + l.unitPriceGbp * l.quantity, 0);
  if (subtotal < zone.minOrderGbp) {
    return {
      ok: false,
      field: 'lines',
      error: `Minimum order for ${zone.name} is £${zone.minOrderGbp.toFixed(2)} — your basket is £${subtotal.toFixed(2)}.`,
    };
  }
  const total = subtotal + zone.baseFeeGbp;

  // 4. COD eligibility check
  if (data.paymentMethod === 'cod' && !zone.allowsCod) {
    return {
      ok: false,
      field: 'paymentMethod',
      error: `Cash on delivery is not available for ${zone.name}. Please use card payment.`,
    };
  }

  // 5. Generate ref + insert order via service client
  const supabase = getServiceClient();
  const { data: refRow } = await supabase.rpc('generate_order_ref' as never);
  const ref = (refRow as unknown as string) || `HNN-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Get profile_id if signed in
  const userClient = await getServerClient();
  const { data: { user } } = await userClient.auth.getUser();

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      ref,
      profile_id: user?.id ?? null,
      customer_first_name: data.firstName,
      customer_last_name: data.lastName,
      customer_email: data.email,
      customer_phone: data.phone,
      delivery_line1: data.address1,
      delivery_line2: data.address2 ?? null,
      delivery_city: data.city,
      delivery_postcode: data.postcode.toUpperCase(),
      delivery_zone_id: zone.id,
      delivery_fee_gbp: zone.baseFeeGbp,
      delivery_date: data.deliveryDate,
      delivery_window_start: data.deliveryWindowStart,
      delivery_window_end: data.deliveryWindowEnd,
      delivery_notes: data.deliveryNotes ?? null,
      subtotal_gbp: subtotal,
      total_gbp: total,
      payment_method: data.paymentMethod,
      payment_status: 'pending',
      cod_status: data.paymentMethod === 'cod' ? 'uncollected' : null,
      status: 'received',
    })
    .select('id')
    .single();

  if (orderErr || !order) {
    return { ok: false, error: orderErr?.message ?? 'Failed to create order' };
  }

  // 6. Insert line items
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const { error: itemsErr } = await supabase.from('order_items').insert(
    data.lines.map((l, i) => ({
      order_id: order.id,
      // Legacy carts (pre-DB-cutover) stored the slug here. The column is a
      // nullable FK to menu_items.id — fall back to null if it's not a UUID
      // so checkout still works while the customer's stale cart drains.
      menu_item_id: UUID_RE.test(l.menuItemId) ? l.menuItemId : null,
      name: l.name,
      unit_price_gbp: l.unitPriceGbp,
      quantity: l.quantity,
      line_total_gbp: l.unitPriceGbp * l.quantity,
      variants_chosen: l.variantsChosen,
      addons_chosen: l.addonsChosen,
      special_instructions: l.specialInstructions ?? null,
      image_path: l.imageSrc ?? null,
      display_order: i,
    }))
  );

  if (itemsErr) {
    // Best-effort rollback
    await supabase.from('orders').delete().eq('id', order.id);
    return { ok: false, error: itemsErr.message };
  }

  // 7. Auto kitchen note (Received)
  await supabase.from('kitchen_notes').insert({
    order_id: order.id,
    author_id: null,
    author_name: 'System',
    status_at_time: 'received',
    body: "Order received, thank you. We'll start cooking before 11am.",
    visible_to_customer: true,
    emailed: false,
  });

  // 8. For card: create Stripe PaymentIntent + attach order ref
  if (data.paymentMethod === 'card') {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'gbp',
        automatic_payment_methods: { enabled: true },
        metadata: {
          order_id: order.id,
          order_ref: ref,
        },
        description: `Order ${ref} · ${siteConfig.name}`,
        receipt_email: data.email,
        statement_descriptor_suffix: 'HNNICE',
      });

      // Save PI id on the order
      await supabase
        .from('orders')
        .update({ stripe_payment_intent_id: pi.id })
        .eq('id', order.id);

      return { ok: true, ref, orderId: order.id, clientSecret: pi.client_secret ?? undefined };
    } catch (err) {
      // Roll back the order so the customer can retry cleanly
      await supabase.from('orders').delete().eq('id', order.id);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Payment setup failed. Please try again.',
      };
    }
  }

  // 9. COD: order is good — send confirmation + admin notification email
  try {
    const fullOrder = await getOrderByRef(ref);
    if (fullOrder) {
      const email = orderConfirmationEmail(fullOrder);
      await sendEmail({
        to: fullOrder.customer.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      const adminTo = process.env.ORDER_NOTIFICATION_EMAIL || siteConfig.email.notificationToDefault;
      if (adminTo) {
        await sendEmail({
          to: adminTo,
          subject: `New COD order · ${fullOrder.ref}`,
          html: email.html,
        });
      }
    }
  } catch (err) {
    // Don't fail the order if email send breaks
    console.error('[createOrder] COD confirmation email failed:', err);
  }

  return { ok: true, ref, orderId: order.id };
}
