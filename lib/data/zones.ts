import { unstable_cache } from 'next/cache';
import { getPublicClient } from '@/lib/supabase/public';

export const ZONES_TAG = 'zones';

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
 *   "TS17"    → "TS17" (bare outward, no inward code)
 *
 * Returns an ordered list of candidates to try, most-specific first.
 */
export function postcodeCandidates(input: string): string[] {
  const clean = input.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean) return [];
  // UK postcodes are 5–7 chars (outward 2–4 + inward exactly 3). Anything
  // shorter is a bare outward code being typed (e.g. "TS17") — treat the
  // whole input as the outward. Otherwise strip the trailing 3-char inward.
  const outward = clean.length >= 5 ? clean.slice(0, -3) : clean;
  // Also strip trailing digits → "TS17" → "TS1" as a fallback
  const lessSpecific = outward.replace(/\d+$/, '');
  const candidates = [outward];
  if (lessSpecific && lessSpecific !== outward) candidates.push(outward.replace(/\d+$/, (m) => m.slice(0, -1)));
  if (lessSpecific && !candidates.includes(lessSpecific)) candidates.push(lessSpecific);
  return Array.from(new Set(candidates));
}

async function _getActiveZones(): Promise<DeliveryZoneView[]> {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .is('archived_at', null)
      .order('display_order', { ascending: true });
    if (error) console.error('[zones] query error:', error);
    if (!data) return [];
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
  } catch (err) {
    console.error('[zones] getActiveZones threw:', err);
    return [];
  }
}

/**
 * Wrapped in unstable_cache so the last-good response keeps serving even
 * if Supabase is briefly unreachable. Admin zone mutations should call
 * revalidateTag(ZONES_TAG) to invalidate.
 */
export const getActiveZones = unstable_cache(
  _getActiveZones,
  ['zones:active'],
  { revalidate: 60, tags: [ZONES_TAG] }
);

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
