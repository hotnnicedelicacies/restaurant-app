import type { Metadata } from 'next';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PageHero from '@/components/layout/PageHero';
import CtaBand from '@/components/home/CtaBand';
import MenuBrowser from '@/components/menu/MenuBrowser';
import { getCategoriesWithItems } from '@/lib/data/menu';
import { getHours } from '@/lib/data/hours';
import { getActiveZones } from '@/lib/data/zones';
import { getContact } from '@/lib/data/contact';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl, formatGBP } from '@/lib/utils';

export const metadata: Metadata = {
  title: "Today's Menu",
  description: `Today's menu at ${siteConfig.name} — Italian classics & West African home cooking, made fresh and delivered hot across Teesside. Order by 10am for same-day delivery.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.menu) },
  openGraph: {
    title: `Today's Menu · ${siteConfig.name}`,
    description: 'Italian & West African home cooking — delivered hot across Teesside.',
    type: 'website',
    images: [absoluteUrl('/og-image.jpg')],
  },
};

const DIETARY_SCHEMA_MAP: Record<string, string> = {
  vegetarian: 'https://schema.org/VegetarianDiet',
  vegan: 'https://schema.org/VeganDiet',
  'gluten-free': 'https://schema.org/GlutenFreeDiet',
  'low-calorie': 'https://schema.org/LowCalorieDiet',
};

export default async function MenuPage() {
  const [{ categories, itemsByCategory }, hours, zones, contact] = await Promise.all([
    getCategoriesWithItems(),
    getHours(),
    getActiveZones(),
    getContact(),
  ]);
  // When zones haven't loaded yet (cold cache + DB down) we'd rather hide
  // the "from £X" line than surface a stale business value.
  const minDeliveryFee = zones.length > 0 ? Math.min(...zones.map((z) => z.baseFeeGbp)) : null;
  const cheapestZoneName = zones.find((z) => z.baseFeeGbp === minDeliveryFee)?.name ?? null;

  // JSON-LD: Menu schema (helps Google show the menu in search)
  const menuSchema = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `Today's Menu · ${siteConfig.name}`,
    inLanguage: 'en-GB',
    hasMenuSection: categories.map((cat) => ({
      '@type': 'MenuSection',
      name: cat.name,
      description: cat.description ?? undefined,
      hasMenuItem: (itemsByCategory[cat.slug] ?? []).map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: item.description,
        offers: {
          '@type': 'Offer',
          price: item.priceGbp.toFixed(2),
          priceCurrency: 'GBP',
          availability: item.isAvailable
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut',
        },
        suitableForDiet: item.dietaryTags
          .map((t) => DIETARY_SCHEMA_MAP[t.toLowerCase()])
          .filter(Boolean),
      })),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }} />
      <SiteHeader />
      <main>
        <PageHero
          compact
          eyebrow={`Today's Kitchen · ${hours.displayShort}`}
          title={<>Today&apos;s <em>Menu</em></>}
          sub={`Cooked this morning · ${hours.cutoffShort} to Teesside.`}
        />

        {categories.length === 0 ? (
          <section className="container py-[clamp(48px,8vw,96px)]">
            <div className="mx-auto max-w-[480px] text-center">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
                Kitchen closed
              </p>
              <h2 className="m-0 mb-3 font-serif text-[clamp(26px,3.4vw,36px)] font-medium text-walnut">
                No menu items <em className="italic font-normal">just now</em>.
              </h2>
              <p className="m-0 font-serif text-[16px] italic leading-[1.5] text-ink-muted">
                The kitchen is being set up. Check back shortly — or message us on{' '}
                <a href={`https://wa.me/${contact.whatsapp}`} className="link-underline">
                  WhatsApp
                </a>
                .
              </p>
            </div>
          </section>
        ) : (
          <MenuBrowser categories={categories} itemsByCategory={itemsByCategory} />
        )}

        <CtaBand
          eyebrow="Ready when you are"
          title={<>Tonight&apos;s dinner, <em>handled.</em></>}
          sub={
            minDeliveryFee !== null && cheapestZoneName
              ? `Delivery from ${formatGBP(minDeliveryFee)} within ${cheapestZoneName}. Place your order before ten.`
              : 'Place your order before ten.'
          }
          cta={{ label: 'Review your basket', href: siteConfig.routes.cart }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
