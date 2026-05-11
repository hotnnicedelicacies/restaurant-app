import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block private user/admin routes from indexing
        disallow: [
          '/admin',
          '/admin/',
          '/account',
          '/account/',
          '/cart',
          '/checkout',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/api/',
          '/confirmation/',
          '/track/',
          '/receipt/',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl(),
  };
}
