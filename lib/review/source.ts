/**
 * Attribution sources for the `/review` landing page. Each QR sticker /
 * follow-up link carries `?src=<source>` so we can see which surface
 * gets scanned. Anything not in this list collapses to `site`.
 *
 * Mirrored by CHECK constraints on `feedback.src` and `review_events.src`
 * in `supabase/migrations/20260821000004_review_feedback.sql` — add new
 * sources in both places.
 */

export const REVIEW_SOURCES = ['truck', 'box', 'receipt', 'whatsapp', 'email', 'site'] as const;

export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const DEFAULT_REVIEW_SOURCE: ReviewSource = 'site';

export const REVIEW_SOURCE_LABELS: Record<ReviewSource, string> = {
  truck: 'Trailer sticker',
  box: 'Box sticker',
  receipt: 'Receipt',
  whatsapp: 'WhatsApp link',
  email: 'Email link',
  site: 'Website',
};

export function parseReviewSource(input: unknown): ReviewSource {
  if (typeof input !== 'string') return DEFAULT_REVIEW_SOURCE;
  const value = input.trim().toLowerCase();
  return (REVIEW_SOURCES as readonly string[]).includes(value)
    ? (value as ReviewSource)
    : DEFAULT_REVIEW_SOURCE;
}
