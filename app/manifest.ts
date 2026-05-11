import type { MetadataRoute } from 'next';
import { siteConfig } from '@/constants/siteConfig';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4EBE2', // cream-soft
    theme_color: '#2D1F18',      // walnut
    lang: 'en-GB',
    dir: 'ltr',
    categories: ['food', 'lifestyle', 'shopping'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: "Today's menu",
        short_name: 'Menu',
        description: 'Browse what we’re cooking today.',
        url: '/menu',
      },
      {
        name: 'My orders',
        short_name: 'Orders',
        description: 'Track your most recent order.',
        url: '/account',
      },
    ],
  };
}
