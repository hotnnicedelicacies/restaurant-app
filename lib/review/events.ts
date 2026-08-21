import { getServiceClient } from '@/lib/supabase/server';
import type { ReviewSource } from './source';

export type ReviewEvent = 'view' | 'google_click' | 'feedback_submit';

/**
 * Cookieless analytics for the review page. One row per event, tagged
 * with the QR source. Deliberately records nothing else — no IP, no
 * user agent — so the page adds nothing to the cookie-banner surface.
 *
 * Best-effort: never throws. Callers wrap it in `after()` so the insert
 * runs once the response has been sent.
 */
export async function logReviewEvent(event: ReviewEvent, src: ReviewSource): Promise<void> {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from('review_events').insert({ event, src });
    if (error) console.error('[review] event insert failed:', error.message);
  } catch (err) {
    console.error('[review] event insert threw:', err);
  }
}
