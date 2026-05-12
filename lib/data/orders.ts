import { getServiceClient } from '@/lib/supabase/server';

export interface OrderView {
  id: string;
  ref: string;
  profileId: string | null;
  status: 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';
  paymentMethod: 'card' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';
  codStatus: 'uncollected' | 'collected' | null;
  cardBrand: string | null;
  cardLast4: string | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  delivery: {
    line1: string;
    line2: string | null;
    city: string;
    postcode: string;
    date: string;
    windowStart: string;
    windowEnd: string;
    notes: string | null;
    feeGbp: number;
    zoneId: string | null;
  };
  subtotalGbp: number;
  totalGbp: number;
  refundAmountGbp: number | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  items: {
    id: string;
    name: string;
    unitPriceGbp: number;
    quantity: number;
    lineTotalGbp: number;
    variantsChosen: Record<string, { label: string; deltaGbp: number }>;
    addonsChosen: { label: string; deltaGbp: number }[];
    specialInstructions: string | null;
    imagePath: string | null;
  }[];
}

/**
 * Look up an order by its reference. Uses the service client because /track,
 * /receipt, and /confirmation are reachable by anyone with the ref — the ref
 * itself is the access token (8-char + 4-digit, ~28 bits of entropy).
 *
 * Returns null if not found.
 */
export async function getOrderByRef(ref: string): Promise<OrderView | null> {
  const supabase = getServiceClient();
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('ref', ref)
    .maybeSingle();
  if (!order) return null;

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)
    .order('display_order', { ascending: true });

  return {
    id: order.id,
    ref: order.ref,
    profileId: order.profile_id,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    codStatus: order.cod_status,
    cardBrand: order.card_brand,
    cardLast4: order.card_last4,
    customer: {
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      email: order.customer_email,
      phone: order.customer_phone,
    },
    delivery: {
      line1: order.delivery_line1,
      line2: order.delivery_line2,
      city: order.delivery_city,
      postcode: order.delivery_postcode,
      date: order.delivery_date,
      windowStart: order.delivery_window_start,
      windowEnd: order.delivery_window_end,
      notes: order.delivery_notes,
      feeGbp: Number(order.delivery_fee_gbp),
      zoneId: order.delivery_zone_id,
    },
    subtotalGbp: Number(order.subtotal_gbp),
    totalGbp: Number(order.total_gbp),
    refundAmountGbp: order.refund_amount_gbp ? Number(order.refund_amount_gbp) : null,
    cancelledAt: order.cancelled_at,
    cancelledReason: order.cancelled_reason,
    createdAt: order.created_at,
    items: (items ?? []).map((it) => ({
      id: it.id,
      name: it.name,
      unitPriceGbp: Number(it.unit_price_gbp),
      quantity: it.quantity,
      lineTotalGbp: Number(it.line_total_gbp),
      variantsChosen: it.variants_chosen as Record<string, { label: string; deltaGbp: number }>,
      addonsChosen: it.addons_chosen as { label: string; deltaGbp: number }[],
      specialInstructions: it.special_instructions,
      imagePath: it.image_path,
    })),
  };
}
