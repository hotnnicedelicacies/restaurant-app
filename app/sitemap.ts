import type { MetadataRoute } from 'next';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';

/**
 * Static sitemap entries. Dynamic entries (per menu item / category) are
 * appended in Phase 3 once menu items are DB-backed — they'll be fetched
 * here and merged into the array.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const r = siteConfig.routes;

  return [
    { url: absoluteUrl(r.home), lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteUrl(r.menu), lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: absoluteUrl(r.about), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl(r.contact), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl(r.legal.privacy), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl(r.legal.terms), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl(r.legal.refund), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl(r.legal.cookies), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
