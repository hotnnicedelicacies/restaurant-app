import type { Metadata } from 'next';
import { siteConfig } from '@/constants/siteConfig';
import { getCategoriesWithItems } from '@/lib/data/menu';

export const metadata: Metadata = {
  title: 'Our Menu',
  description:
    'Browse our full menu of freshly made home-cooked meals — pasta, grills, rice dishes, soups, and more. Delivered hot to your door in Middlesbrough and surrounding areas.',
};

export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  const { categories, itemsByCategory } = await getCategoriesWithItems();

  const menuSchema = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${siteConfig.name} Menu`,
    description: 'Full menu of freshly made home-cooked meals available for delivery.',
    url: `https://${siteConfig.domain}/menu`,
    hasMenuSection: categories.map((c) => ({
      '@type': 'MenuSection',
      name: c.name,
      hasMenuItem: (itemsByCategory[c.slug] ?? []).map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: item.description,
        offers: {
          '@type': 'Offer',
          price: item.priceGbp.toFixed(2),
          priceCurrency: 'GBP',
          availability: item.isAvailable
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      })),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />
      {children}
    </>
  );
}
