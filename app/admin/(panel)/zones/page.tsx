import { getServiceClient } from '@/lib/supabase/server';
import ZonesManager from './ZonesManager';

export default async function AdminZonesPage() {
  const supabase = getServiceClient();
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ data: zones }, { data: recentOrders }] = await Promise.all([
    supabase
      .from('delivery_zones')
      .select('*')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('orders')
      .select('delivery_zone_id')
      .gte('created_at', monthAgo),
  ]);

  const monthlyOrdersByZone: Record<string, number> = {};
  for (const o of recentOrders ?? []) {
    if (!o.delivery_zone_id) continue;
    monthlyOrdersByZone[o.delivery_zone_id] = (monthlyOrdersByZone[o.delivery_zone_id] ?? 0) + 1;
  }

  return (
    <ZonesManager
      zones={(zones ?? []).map((z) => ({
        id: z.id,
        name: z.name,
        postcodes: z.postcodes,
        baseFeeGbp: Number(z.base_fee_gbp),
        minOrderGbp: Number(z.min_order_gbp),
        prepTimeMin: z.prep_time_min,
        prepTimeMax: z.prep_time_max,
        isQuoted: z.is_quoted,
        allowsCod: z.allows_cod,
        isActive: z.is_active,
        displayOrder: z.display_order,
        monthlyOrders: monthlyOrdersByZone[z.id] ?? 0,
      }))}
    />
  );
}
