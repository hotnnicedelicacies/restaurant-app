/**
 * Where "Write a Google review" sends people.
 *
 * `GOOGLE_REVIEW_URL` (the Business Profile share link) takes precedence;
 * otherwise we build the composer URL from `GOOGLE_PLACE_ID`. When neither
 * is set the page hides the Google card entirely — the profile is an
 * owner task that lands after launch, and the QR stickers are printed once.
 */
export function getGoogleReviewUrl(): string | null {
  const explicit = process.env.GOOGLE_REVIEW_URL?.trim();
  if (explicit) return explicit;
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
  }
  return null;
}

export function isGoogleReviewConfigured(): boolean {
  return getGoogleReviewUrl() !== null;
}
