import { getServerClient } from '@/lib/supabase/server';

export interface DeliveryZoneView {
  id: string;
  name: string;
  postcodes: string[];
  baseFeeGbp: number;
  minOrderGbp: number;
  prepTimeMin: number;
  prepTimeMax: number;
  isQuoted: boolean;
  allowsCod: boolean;
}

/**
 * Normalise a UK postcode to its area prefix.
 *   "ts1 3AB" → "TS1"
 *   "SW1A 1AA" → "SW1A" then we also try "SW1" as a fallback
 *
 * Returns an ordered list of candidates to try, most-specific first.
 */
export function postcodeCandidates(input: string): string[] {
  const clean = input.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean) return [];
  // Outward code is everything before the inward code (last 3 chars).
  const outward = clean.length > 3 ? clean.slice(0, -3) : clean;
  // Also strip trailing digits → "TS17" → "TS1" as a fallback
  const lessSpecific = outward.replace(/\d+$/, '');
  const candidates = [outward];
  if (lessSpecific && lessSpecific !== outward) candidates.push(outward.replace(/\d+$/, (m) => m.slice(0, -1)));
  if (lessSpecific && !candidates.includes(lessSpecific)) candidates.push(lessSpecific);
  return Array.from(new Set(candidates));
}

export async function getActiveZones(): Promise<DeliveryZoneView[]> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .is('archived_at', null)
    .order('display_order', { ascending: true });
  if (error || !data) return [];
  return data.map((z) => ({
    id: z.id,
    name: z.name,
    postcodes: z.postcodes,
    baseFeeGbp: Number(z.base_fee_gbp),
    minOrderGbp: Number(z.min_order_gbp),
    prepTimeMin: z.prep_time_min,
    prepTimeMax: z.prep_time_max,
    isQuoted: z.is_quoted,
    allowsCod: z.allows_cod,
  }));
}

/**
 * Match a postcode to the most-specific active zone. Returns null if no
 * zone covers it (customer is outside the delivery area).
 */
export async function matchZoneByPostcode(postcode: string): Promise<DeliveryZoneView | null> {
  if (!postcode) return null;
  const zones = await getActiveZones();
  for (const candidate of postcodeCandidates(postcode)) {
    const match = zones.find((z) => z.postcodes.includes(candidate));
    if (match) return match;
  }
  return null;
}
