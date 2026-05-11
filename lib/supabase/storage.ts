/**
 * Supabase Storage helpers.
 *
 * Bucket: `menu-images` (public). Path convention: `meals/<slug>.<ext>` for
 * primary photos, `meals/<slug>-g{N}.<ext>` for gallery photos.
 *
 * If you migrate to Cloudflare R2 (or another S3-compatible store) later,
 * only this file needs to change — `getStorageUrl()` is the single point
 * of construction that the rest of the app calls.
 */

export const STORAGE_BUCKET = 'menu-images';

function isStaticAsset(path: string): boolean {
  // Static (next/image-imported) assets from /assets are objects with a
  // `src` property after import — they're handled by Next/Image directly,
  // not via Supabase Storage.
  return path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/');
}

/**
 * Convert a storage path (e.g. `meals/jollof.png`) into a fully-qualified
 * public URL. Returns the input unchanged if it's already an absolute URL
 * or a static-asset path.
 */
export function getStorageUrl(path: string | null | undefined, bucket = STORAGE_BUCKET): string {
  if (!path) return '';
  if (isStaticAsset(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Build a transformed image URL with Supabase's built-in transformations.
 * Width/height/quality/format. Useful for menu thumbnails.
 *
 *   getTransformedUrl('meals/jollof.png', { width: 400, quality: 80 })
 */
export function getTransformedUrl(
  path: string | null | undefined,
  options: { width?: number; height?: number; quality?: number; format?: 'origin' | 'webp' } = {},
  bucket = STORAGE_BUCKET
): string {
  if (!path) return '';
  if (isStaticAsset(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  const params = new URLSearchParams();
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.quality) params.set('quality', String(options.quality));
  if (options.format) params.set('format', options.format);
  const qs = params.toString();
  return `${base}/storage/v1/render/image/public/${bucket}/${path}${qs ? `?${qs}` : ''}`;
}
