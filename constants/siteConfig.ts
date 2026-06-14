import { StaticImageData } from 'next/image';

/**
 * Public site configuration — brand-static values that don't change per
 * request and can safely live in the bundle. Anything dynamic or
 * admin-editable is read at runtime via a fetcher in `lib/data/*`:
 *
 *   - Contact details (phone/email/WhatsApp)  → `getContact()`
 *   - Trading hours + cutoff                  → `getHours()`
 *   - Delivery zones, fees, COD              → `getActiveZones()`
 *   - Transactional email config             → `getEmailConfig()`
 *   - Operations toggles + global min order  → `getOperations()`
 *
 * Do NOT add a hardcoded business value here as a "fallback" — every
 * fetcher carries its own deploy-time default so siteConfig stays free
 * of values that could drift from what the admin has set.
 */
export const siteConfig = {
  name: 'Hot N Nice Delicacies',
  shortName: 'Hot N Nice',
  tagline: 'Made with love, delivered hot to your door.',
  domain: 'hotnnicedelicacies.com',
  description:
    'A home kitchen in Middlesbrough cooking Italian classics and West African staples from scratch every morning — delivered hot to your door across Teesside.',

  social: {
    instagram: 'https://instagram.com/hotnnicedelicacies',
    facebook: 'https://facebook.com/hotnnicedelicacies',
    tiktok: '' as string,
  },

  foodHygiene: {
    rating: 5,
    ratingLabel: 'Very Good',
    authority: 'Food Standards Agency',
    listingUrl: 'https://ratings.food.gov.uk/business/1913815/hot-n-nice-delicacies',
  },

  /** Voice signature lines reused across UI. */
  voice: {
    tagline: 'Made with love, delivered hot to your door.',
    promise: 'No shortcuts. No frozen meals. Just dinner.',
    kitchenLocation: 'A home kitchen · Middlesbrough · Est. 2026',
  },

  /** Routes — single source of truth for internal links + sitemap generation. */
  routes: {
    home: '/',
    menu: '/menu',
    about: '/about',
    contact: '/contact',
    cart: '/cart',
    checkout: '/checkout',
    account: '/account',
    signIn: '/sign-in',
    signUp: '/sign-up',
    forgotPassword: '/forgot-password',
    track: (ref: string) => `/track/${ref}`,
    confirmation: (ref: string) => `/confirmation/${ref}`,
    receipt: (ref: string) => `/receipt/${ref}`,
    itemDetail: (slug: string) => `/menu/${slug}`,
    legal: {
      privacy: '/privacy',
      terms: '/terms',
      refund: '/refund-policy',
      cookies: '/cookie-notice',
    },
    admin: {
      root: '/admin',
      signIn: '/admin/sign-in',
      orders: '/admin/orders',
      menu: '/admin/menu',
      categories: '/admin/categories',
      zones: '/admin/zones',
      payments: '/admin/payments',
      settings: '/admin/settings',
      advanced: '/admin/settings/advanced',
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;

export type MealItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | StaticImageData;
  category: 'rice' | 'soup' | 'grill' | 'sides' | 'party' | string;
};

/** Cuisine + SEO copy fragments. `areaServed` is intentionally absent —
 *  consumers should pull active zone names from `getActiveZones()`
 *  instead of a stale constant. */
export const seoCopy = {
  cuisine: ['Italian', 'West African', 'British', 'International'],
  ogImageAlt: `${siteConfig.name} — Italian & West African home cooking, delivered hot across Teesside.`,
};
