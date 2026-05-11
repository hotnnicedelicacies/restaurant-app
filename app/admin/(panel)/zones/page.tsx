import { getServiceClient } from '@/lib/supabase/server';
import ZonesManager from './ZonesManager';

export default async function AdminZonesPage() {
  const supabase = getServiceClient();
  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('*')
    .is('archived_at', null)
    .order('display_order', { ascending: true });

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
      }))}
    />
  );
}
