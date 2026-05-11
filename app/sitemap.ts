import type { MetadataRoute } from 'next';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';
import { getServiceClient } from '@/lib/supabase/server';

/**
 * Sitemap. Static editorial pages + dynamic menu items so search engines can
 * crawl every dish page. Falls back to static-only if Supabase envs aren't
 * set (e.g. preview builds before provisioning).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const r = siteConfig.routes;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl(r.home), lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteUrl(r.menu), lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: absoluteUrl(r.about), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl(r.contact), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl(r.legal.privacy), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl(r.legal.terms), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl(r.legal.refund), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl(r.legal.cookies), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  if (!process.env.SUPABASE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return staticEntries;
  }

  try {
    const supabase = getServiceClient();
    const { data: items } = await supabase
      .from('menu_items')
      .select('slug, updated_at')
      .is('archived_at', null)
      .eq('is_hidden', false);

    const dynamic: MetadataRoute.Sitemap = (items ?? []).map((it) => ({
      url: absoluteUrl(r.itemDetail(it.slug)),
      lastModified: new Date(it.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticEntries, ...dynamic];
  } catch {
    return staticEntries;
  }
}
