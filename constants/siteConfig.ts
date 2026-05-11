import { StaticImageData } from 'next/image';

/**
 * Public site configuration — values that don't change per request and can
 * safely live in the bundle. Anything dynamic / admin-editable goes through
 * the Supabase settings table and is loaded server-side per request.
 */
export const siteConfig = {
  name: 'Hot N Nice Delicacies',
  shortName: 'Hot N Nice',
  tagline: 'Made with love, delivered hot to your door.',
  domain: 'hotnnicedelicacies.com',
  description:
    'A home kitchen in Middlesbrough cooking Italian classics and West African staples from scratch every morning — delivered hot to your door across Teesside.',

  contact: {
    email: 'hotnnicedelicacies@gmail.com',
    phone: '+44 7776 320068',
    whatsapp: '447776320068',
    whatsappDisplay: '+44 7776 320068',
  },

  delivery: {
    areas: ['Middlesbrough', 'Stockton-on-Tees', 'Redcar', 'Thornaby', 'Billingham'],
    minOrder: 10,
    pricing: {
      middlesbrough: 5,
      surroundingNote: 'Contact us for pricing',
    },
  },

  hours: {
    days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const,
    open: '12:00',
    close: '20:00',
    sameDayCutoff: '10:00',
    displayShort: 'Tue – Sun · 12 – 8pm',
    cutoffShort: 'Order by 10am for same-day delivery',
  },

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

  email: {
    fromDefault: 'Hot N Nice Delicacies <orders@hotnnicedelicacies.com>',
    notificationToDefault: 'hotnnicedelicacies@gmail.com',
    replyTo: 'hotnnicedelicacies@gmail.com',
  },

  /** Voice signature lines reused across UI. */
  voice: {
    tagline: 'Made with love, delivered hot to your door.',
    promise: 'No shortcuts. No frozen meals. Just dinner.',
    kitchenLocation: 'A home kitchen · Middlesbrough · Est. 2019',
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

/** Cuisine + delivery copy fragments used by JSON-LD generators and SEO. */
export const seoCopy = {
  cuisine: ['Italian', 'West African', 'British', 'International'],
  areaServed: siteConfig.delivery.areas,
  ogImageAlt: `${siteConfig.name} — Italian & West African home cooking, delivered hot across Teesside.`,
};
