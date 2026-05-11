import { NextResponse } from 'next/server';
import { matchZoneByPostcode } from '@/lib/data/zones';

/**
 * GET /api/zones/check?postcode=TS1+3AB
 *
 * Public endpoint — called from the checkout form to look up the matching
 * delivery zone (fee, min order, COD eligibility) when the customer types
 * their postcode.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get('postcode') ?? '';
  if (!postcode.trim()) {
    return NextResponse.json({ ok: false, error: 'postcode required' }, { status: 400 });
  }
  const zone = await matchZoneByPostcode(postcode);
  if (!zone) return NextResponse.json({ ok: true, matched: false });
  return NextResponse.json({
    ok: true,
    matched: true,
    zone: {
      id: zone.id,
      name: zone.name,
      baseFeeGbp: zone.baseFeeGbp,
      minOrderGbp: zone.minOrderGbp,
      prepTimeMin: zone.prepTimeMin,
      prepTimeMax: zone.prepTimeMax,
      isQuoted: zone.isQuoted,
      allowsCod: zone.allowsCod,
    },
  });
}
