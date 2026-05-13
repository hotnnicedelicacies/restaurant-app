import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Cormorant_Garamond } from 'next/font/google';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';
import { getHours } from '@/lib/data/hours';
import { getActiveZones } from '@/lib/data/zones';
import { getContact } from '@/lib/data/contact';
import { Toaster } from 'sonner';
import CookieBanner from '@/components/CookieBanner';
import './globals.css';

// --- Fonts ---
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
  // Used by next/font for the size-adjusted CSS fallback shown during swap.
  // Matches the design stack (Times New Roman first, then Georgia).
  fallback: ['Times New Roman', 'Georgia', 'serif'],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

// --- Viewport ---
export const viewport: Viewport = {
  themeColor: '#2D1F18', // walnut
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

// --- Metadata (site-wide defaults; pages override individually) ---
export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  generator: 'Next.js',
  keywords: [
    'home-cooked meals Middlesbrough',
    'food delivery Middlesbrough',
    'jollof rice delivery UK',
    'suya Middlesbrough',
    'African food delivery UK',
    'meal delivery Stockton-on-Tees',
    'meal delivery Teesside',
    'Italian food delivery Middlesbrough',
    'plantain lasagna Middlesbrough',
    'Hot N Nice Delicacies',
    '5 star food hygiene Middlesbrough',
  ],
  category: 'food',
  alternates: {
    canonical: absoluteUrl(),
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: absoluteUrl(),
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      {
        url: absoluteUrl('/og-image.jpg'),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Italian & West African home cooking, delivered hot across Teesside.`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [absoluteUrl('/og-image.jpg')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: { telephone: true, email: true, address: false },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-icon.png',
  },
};

// --- JSON-LD: FoodEstablishment (rendered once site-wide) ---
function buildRestaurantSchema(
  hours: { days: string[]; open: string; close: string },
  areaServedNames: string[],
  contact: { phone: string; email: string },
) {
  return {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  '@id': absoluteUrl('#business'),
  name: siteConfig.name,
  description: siteConfig.description,
  url: absoluteUrl(),
  telephone: contact.phone,
  email: contact.email,
  image: absoluteUrl('/og-image.jpg'),
  logo: absoluteUrl('/logo.png'),
  priceRange: '££',
  servesCuisine: ['Italian', 'West African', 'British', 'International'],
  hasMenu: absoluteUrl('/menu'),
  paymentAccepted: 'Credit Card, Debit Card, Cash',
  currenciesAccepted: 'GBP',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Middlesbrough',
    addressRegion: 'North Yorkshire',
    addressCountry: 'GB',
  },
  areaServed: areaServedNames.map((area) => ({
    '@type': 'City',
    name: area,
  })),
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: hours.days,
    opens: hours.open,
    closes: hours.close,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: siteConfig.foodHygiene.rating,
    bestRating: 5,
    ratingCount: 1,
    reviewCount: 1,
    description: `${siteConfig.foodHygiene.ratingLabel} · ${siteConfig.foodHygiene.authority}`,
  },
  sameAs: [siteConfig.social.instagram, siteConfig.social.facebook].filter(Boolean),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [hours, zones, contact] = await Promise.all([
    getHours(),
    getActiveZones(),
    getContact(),
  ]);
  // Empty list = render no `areaServed`. Schema spec allows omission and a
  // wrong/stale list is worse for SEO than absence.
  const areaServed: string[] = zones.map((z) => z.name);
  const restaurantSchema = buildRestaurantSchema(
    { days: hours.days, open: hours.open, close: hours.close },
    areaServed,
    contact,
  );
  return (
    <html
      lang="en-GB"
      className={`${cormorant.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
        {children}
        <CookieBanner />
        <Toaster position="bottom-right" theme="light" richColors closeButton />
      </body>
    </html>
  );
}
