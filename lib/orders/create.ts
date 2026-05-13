'use server';

import { z } from 'zod';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { matchZoneByPostcode } from '@/lib/data/zones';
import { getHours, type WeekDay } from '@/lib/data/hours';
import { getOperations } from '@/lib/data/operations';
import { getStripe } from '@/lib/stripe/server';
import { siteConfig } from '@/constants/siteConfig';
import { sendEmail } from '@/lib/email/send';
import { orderConfirmationEmail } from '@/lib/email/templates';
import { getOrderByRef } from '@/lib/data/orders';
import type { VariantsBlob, AddonsBlob } from '@/lib/supabase/types';

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
  // 1. Validate shape
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: String(first.path[0] ?? '') };
  }
  const data = parsed.data;

  // 2. Operations gate — owner can pause the kitchen from /admin/settings.
  //    Authoritative server-side check; UI also hides the CTA but never
  //    rely on that alone.
  const operations = await getOperations();
  if (!operations.storeOpen) {
    return {
      ok: false,
      error:
        operations.closedMessage ||
        "The kitchen is paused for new orders right now. Please check back soon or message us on WhatsApp.",
    };
  }

  // 3. Trading-day / same-day-cutoff gate.
  //    `delivery_date` must be a day the kitchen is open (`hours.days`);
  //    if it's today, the request must arrive before the same-day cutoff.
  const hours = await getHours();
  const dateValidation = validateDeliveryDate(data.deliveryDate, hours);
  if (!dateValidation.ok) return dateValidation;

  // 4. Match zone (also enforces "in delivery area"). Quoted zones don't
  //    have a self-serve fixed fee — bounce to WhatsApp.
  const zone = await matchZoneByPostcode(data.postcode);
  if (!zone) {
    return {
      ok: false,
      field: 'postcode',
      error: "We don't deliver to this postcode by default. Please message us on WhatsApp.",
    };
  }

  // 5. Re-load every menu item from the DB and rebuild the line totals
  //    from authoritative values. The client can lie about price /
  //    availability / hidden state; we don't trust any of it.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const itemIds = Array.from(
    new Set(data.lines.map((l) => l.menuItemId).filter((id) => UUID_RE.test(id))),
  );
  if (itemIds.length !== data.lines.length || itemIds.length === 0) {
    return {
      ok: false,
      error: "Some items in your basket are out of date. Please refresh and re-add them.",
    };
  }

  const svc = getServiceClient();
  const { data: itemRows, error: itemErr } = await svc
    .from('menu_items')
    .select('id, name, price_gbp, is_available_today, is_hidden, archived_at, is_cod_eligible, variants, addons')
    .in('id', itemIds);
  if (itemErr) {
    return { ok: false, error: 'Could not verify your basket. Please try again.' };
  }
  const itemById = new Map((itemRows ?? []).map((r) => [r.id, r]));

  type ResolvedLine = {
    raw: (typeof data.lines)[number];
    name: string;
    unitPriceGbp: number;
    lineTotalGbp: number;
    isCodEligible: boolean;
  };
  const resolvedLines: ResolvedLine[] = [];

  for (const line of data.lines) {
    const row = itemById.get(line.menuItemId);
    if (!row) {
      return { ok: false, error: `"${line.name}" is no longer on the menu. Please remove it from your basket.` };
    }
    if (row.is_hidden || row.archived_at) {
      return { ok: false, error: `"${row.name}" is no longer available. Please remove it from your basket.` };
    }
    if (!row.is_available_today) {
      return { ok: false, error: `"${row.name}" has sold out for today. Please remove it from your basket.` };
    }
    const priced = resolveUnitPrice(row, line);
    if (!priced.ok) return { ok: false, error: priced.error };
    resolvedLines.push({
      raw: line,
      name: row.name,
      unitPriceGbp: priced.unitPriceGbp,
      lineTotalGbp: priced.unitPriceGbp * line.quantity,
      isCodEligible: row.is_cod_eligible,
    });
  }

  // 6. Compute server-trusted totals + zone min check
  const subtotal = resolvedLines.reduce((s, l) => s + l.lineTotalGbp, 0);
  if (subtotal < zone.minOrderGbp) {
    return {
      ok: false,
      field: 'lines',
      error: `Minimum order for ${zone.name} is £${zone.minOrderGbp.toFixed(2)} — your basket is £${subtotal.toFixed(2)}.`,
    };
  }
  const total = subtotal + zone.baseFeeGbp;

  // 7. COD eligibility — global admin toggle, zone-level, and per-meal.
  if (data.paymentMethod === 'cod') {
    if (!operations.codEnabled) {
      return {
        ok: false,
        field: 'paymentMethod',
        error: 'Cash on delivery is currently unavailable. Please pay by card.',
      };
    }
    if (!zone.allowsCod) {
      return {
        ok: false,
        field: 'paymentMethod',
        error: `Cash on delivery is not available for ${zone.name}. Please use card payment.`,
      };
    }
    const ineligible = resolvedLines.filter((l) => l.isCodEligible === false);
    if (ineligible.length > 0) {
      return {
        ok: false,
        field: 'paymentMethod',
        error: `Cash on delivery isn't available for: ${ineligible.map((l) => l.name).join(', ')}. Please pay by card.`,
      };
    }
  }

  // 8. Generate ref + insert order via service client
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

  // 9. Insert line items with server-trusted prices.
  const { error: itemsErr } = await supabase.from('order_items').insert(
    resolvedLines.map((rl, i) => ({
      order_id: order.id,
      menu_item_id: rl.raw.menuItemId,
      name: rl.name,
      unit_price_gbp: rl.unitPriceGbp,
      quantity: rl.raw.quantity,
      line_total_gbp: rl.lineTotalGbp,
      variants_chosen: rl.raw.variantsChosen,
      addons_chosen: rl.raw.addonsChosen,
      special_instructions: rl.raw.specialInstructions ?? null,
      image_path: rl.raw.imageSrc ?? null,
      display_order: i,
    }))
  );

  if (itemsErr) {
    // Best-effort rollback
    await supabase.from('orders').delete().eq('id', order.id);
    return { ok: false, error: itemsErr.message };
  }

  // 10. Auto kitchen note (Received)
  await supabase.from('kitchen_notes').insert({
    order_id: order.id,
    author_id: null,
    author_name: 'System',
    status_at_time: 'received',
    body: "Order received, thank you. We'll start cooking before 11am.",
    visible_to_customer: true,
    emailed: false,
  });

  // 11. For card: create Stripe PaymentIntent + attach order ref
  if (data.paymentMethod === 'card') {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'gbp',
        // Card only. Don't use `automatic_payment_methods: { enabled: true }` here
        // because that opens up Link / Klarna / Revolut Pay / Amazon Pay in the
        // PaymentElement — all of which use redirect-based confirmation flows.
        // If a customer picks one and abandons mid-redirect, Stripe leaves the
        // PI in `requires_payment_method` forever (no payment_method, no
        // last_payment_error, no charge — indistinguishable from a fresh PI).
        // For a kitchen taking UK card payments we want exactly one path.
        payment_method_types: ['card'],
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

  // 12. COD: order is good — send confirmation + admin notification email
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

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const WEEKDAY_NAMES: WeekDay[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/**
 * Validate a `YYYY-MM-DD` delivery date against the admin-controlled
 * trading days + same-day cutoff. Comparisons are done in Europe/London
 * — the business operates there and the cutoff is specified in local time.
 */
function validateDeliveryDate(
  iso: string,
  hours: { days: WeekDay[]; sameDayCutoff: string },
): { ok: true } | { ok: false; field: string; error: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return { ok: false, field: 'deliveryDate', error: 'Please pick a delivery date.' };
  }
  const [, y, m, d] = match;
  // Use UTC noon to avoid DST edge-flips when extracting weekday.
  const date = new Date(`${y}-${m}-${d}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, field: 'deliveryDate', error: 'Please pick a valid delivery date.' };
  }
  const weekday = WEEKDAY_NAMES[date.getUTCDay()];
  const openDays = new Set(hours.days);
  if (!openDays.has(weekday)) {
    return {
      ok: false,
      field: 'deliveryDate',
      error: `We're closed on ${weekday}. Please pick another day.`,
    };
  }

  // Same-day check: if the requested date is "today" in Europe/London, the
  // request must arrive before the cutoff hh:mm.
  const todayLondon = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
  }).format(new Date()); // "YYYY-MM-DD"
  if (iso === todayLondon) {
    const nowHm = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()); // "HH:mm"
    if (nowHm >= hours.sameDayCutoff) {
      return {
        ok: false,
        field: 'deliveryDate',
        error: `Same-day delivery cuts off at ${hours.sameDayCutoff}. Please pick tomorrow or later.`,
      };
    }
  }
  return { ok: true };
}

/**
 * Rebuild a line's unit price from the DB row + the customer's chosen
 * variants/addons. We trust the DB for both the base price and the
 * delta values — the customer's claimed deltas are ignored. If a chosen
 * label isn't present in the current menu blob the cart is stale and we
 * reject so the customer re-customises against current options.
 */
function resolveUnitPrice(
  row: { name: string; price_gbp: number; variants: VariantsBlob; addons: AddonsBlob },
  line: {
    variantsChosen: Record<string, { label: string; deltaGbp: number }>;
    addonsChosen: { label: string; deltaGbp: number }[];
  },
): { ok: true; unitPriceGbp: number } | { ok: false; error: string } {
  let unit = Number(row.price_gbp);
  if (Number.isNaN(unit) || unit < 0) {
    return { ok: false, error: `Could not price "${row.name}". Please try again.` };
  }
  for (const [groupName, choice] of Object.entries(line.variantsChosen)) {
    const group = row.variants.groups.find((g) => g.name === groupName);
    if (!group) {
      return { ok: false, error: `"${row.name}" options have changed. Please re-customise the item.` };
    }
    const opt = group.options.find((o) => o.label === choice.label);
    if (!opt) {
      return { ok: false, error: `"${row.name}" options have changed. Please re-customise the item.` };
    }
    unit += Number(opt.price_delta_gbp) || 0;
  }
  for (const addon of line.addonsChosen) {
    const opt = row.addons.items.find((a) => a.label === addon.label);
    if (!opt) {
      return { ok: false, error: `Add-ons for "${row.name}" have changed. Please re-customise the item.` };
    }
    unit += Number(opt.price_delta_gbp) || 0;
  }
  // Defend against float drift; prices are in pounds with 2dp.
  return { ok: true, unitPriceGbp: Math.round(unit * 100) / 100 };
}
