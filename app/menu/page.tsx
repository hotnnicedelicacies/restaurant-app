import type { Metadata } from 'next';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PageHero from '@/components/layout/PageHero';
import CtaBand from '@/components/home/CtaBand';
import FareRow, { type FareRowItem } from '@/components/menu/FareRow';
import MenuToolbar from '@/components/menu/MenuToolbar';
import { getCategoriesWithItems } from '@/lib/data/menu';
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

function toFareRowItem(item: import('@/lib/data/menu').MenuItemView, index: number): FareRowItem {
  const num = String(index + 1).padStart(2, '0');
  return {
    slug: item.slug,
    numLabel: `№ ${num} · ${item.categoryName}`,
    name: item.name,
    description: item.description,
    price: item.priceGbp,
    image: item.image,
    imageAlt: item.name,
    tags: [...item.dietaryTags, ...item.allergenTags],
    badges: item.badges,
    available: item.isAvailable,
  };
}

const DIETARY_SCHEMA_MAP: Record<string, string> = {
  vegetarian: 'https://schema.org/VegetarianDiet',
  vegan: 'https://schema.org/VeganDiet',
  'gluten-free': 'https://schema.org/GlutenFreeDiet',
  'low-calorie': 'https://schema.org/LowCalorieDiet',
};

export default async function MenuPage() {
  const { categories, itemsByCategory } = await getCategoriesWithItems();

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

  let counter = 0;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }} />
      <SiteHeader />
      <main>
        <PageHero
          eyebrow={`Vol. 01 · Today's Kitchen · ${siteConfig.hours.displayShort}`}
          title={<>Today's <em>Menu</em></>}
          sub="Cooked this morning · Order by 10am for same-day delivery to Teesside."
        />

        <MenuToolbar
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            count: (itemsByCategory[c.slug] ?? []).length,
          }))}
        />

        <section className="py-[clamp(40px,6vw,72px)]">
          <div className="container">
            <p className="mb-4 mt-1 max-w-prose font-serif text-[14px] italic text-[--color-ink-muted]">
              Tip · Tap any dish to customise it before adding to your order. Sold-out items appear greyed out and can't be added today.
            </p>

            {categories.map((cat) => {
              const items = itemsByCategory[cat.slug] ?? [];
              if (items.length === 0) return null;
              return (
                <article id={cat.slug} key={cat.slug} className="mb-[clamp(48px,6vw,72px)] scroll-mt-[140px] last:mb-0">
                  <header className="mb-6 flex items-baseline justify-between gap-4 border-b border-[--color-walnut] pb-3.5">
                    <h2 className="m-0 font-serif text-[clamp(24px,3vw,32px)] font-medium tracking-[-0.005em] text-[--color-walnut]">
                      {cat.name}
                    </h2>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[--color-bronze-deep]">
                      {String(items.length).padStart(2, '0')} dishes
                    </span>
                  </header>

                  <div className="mx-auto max-w-[880px]">
                    {items.map((it, j) => (
                      <FareRow
                        key={it.slug}
                        item={toFareRowItem(it, counter++)}
                        divider={j < items.length - 1}
                      />
                    ))}
                  </div>
                </article>
              );
            })}

            {categories.length === 0 && (
              <div className="mx-auto max-w-[480px] py-[clamp(48px,8vw,96px)] text-center">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-bronze-deep]">
                  Kitchen closed
                </p>
                <h2 className="m-0 mb-3 font-serif text-[clamp(26px,3.4vw,36px)] font-medium text-[--color-walnut]">
                  No menu items <em className="italic font-normal">just now</em>.
                </h2>
                <p className="m-0 font-serif text-[16px] italic leading-[1.5] text-[--color-ink-muted]">
                  The kitchen is being set up. Check back shortly — or message us on{' '}
                  <a href={`https://wa.me/${siteConfig.contact.whatsapp}`} className="link-underline">
                    WhatsApp
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </section>

        <CtaBand
          eyebrow="Ready when you are"
          title={<>Tonight's dinner, <em>handled.</em></>}
          sub={`Delivery from ${formatGBP(siteConfig.delivery.pricing.middlesbrough)} within Middlesbrough. Place your order before ten.`}
          cta={{ label: 'Review your basket', href: siteConfig.routes.cart }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
