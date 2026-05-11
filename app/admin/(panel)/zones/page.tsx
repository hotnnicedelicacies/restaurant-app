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
    <div>
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
        <div>
          <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Delivery</p>
          <h1 className="m-0 font-serif text-[clamp(26px,3.4vw,32px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut">
            Delivery <em className="italic font-normal text-bronze-deep">zones.</em>
          </h1>
          <p className="m-0 mt-1 font-serif text-[13px] italic text-ink-muted">
            Postcode prefixes covered, with fees and minimums. Variable-quoted zones bypass the fee at checkout.
          </p>
        </div>
      </header>
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
    </div>
  );
}
