import { NextResponse, after, type NextRequest } from 'next/server';
import { siteConfig } from '@/constants/siteConfig';
import { getGoogleReviewUrl } from '@/lib/review/google';
import { logReviewEvent } from '@/lib/review/events';
import { parseReviewSource } from '@/lib/review/source';

export const dynamic = 'force-dynamic';

/**
 * `/review/google?src=…` — logs a `google_click` event and 302s to the
 * Google review composer. Server-side so click tracking needs no client
 * JS and the Place ID never reaches the browser.
 *
 * Not configured yet (no GOOGLE_REVIEW_URL / GOOGLE_PLACE_ID)? Bounce
 * back to `/review`, which in that state shows only the private form.
 */
export async function GET(request: NextRequest) {
  const src = parseReviewSource(request.nextUrl.searchParams.get('src'));
  const target = getGoogleReviewUrl();

  if (!target) {
    const fallback = new URL(siteConfig.routes.review, request.url);
    fallback.searchParams.set('src', src);
    return NextResponse.redirect(fallback, 302);
  }

  after(() => logReviewEvent('google_click', src));

  return NextResponse.redirect(target, {
    status: 302,
    headers: { 'Cache-Control': 'no-store' },
  });
}
