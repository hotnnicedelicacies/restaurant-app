import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import HeritageHero from '@/components/home/HeritageHero';
import DayBand from '@/components/home/DayBand';
import BillOfFare from '@/components/menu/BillOfFare';
import HygieneSection from '@/components/home/HygieneSection';
import KitchenStory from '@/components/home/KitchenStory';
import HowItWorks from '@/components/home/HowItWorks';
import DeliveryAreas from '@/components/home/DeliveryAreas';
import CtaBand from '@/components/home/CtaBand';
import { siteConfig } from '@/constants/siteConfig';
import { formatLongDate, absoluteUrl } from '@/lib/utils';
import { meals } from '@/constants/meals';
import { type FareRowItem } from '@/components/menu/FareRow';

import heroImg from '@/assets/hero-food.jpg';
import storyImg from '@/assets/meals/jollof-rice-with-protein-of-choice-and-plantain.jpeg';

/**
 * --- Featured items for the "Today's Bill of Fare" homepage section ---
 * In Phase 3 this becomes a Supabase query (`is_featured = true`); for now
 * we pick six iconic items by slug from the hardcoded menu data.
 */
const FEATURED_SLUGS = [
  'jollof-rice-with-protein-and-plantain',
  'plantain-lasagna',
  'roasted-tilapia-fish',
  'suya',
  'edikaikong',
  'small-chops',
];

function getFeaturedItems(): FareRowItem[] {
  return FEATURED_SLUGS.map((slug, i) => {
    const meal = meals.find((m) => m.id === slug);
    if (!meal) return null;
    const categoryLabel = meal.category.charAt(0).toUpperCase() + meal.category.slice(1);
    const num = String(i + 1).padStart(2, '0');
    const badges = slug === 'jollof-rice-with-protein-and-plantain' ? ['Signature'] : slug === 'plantain-lasagna' ? ['House signature'] : [];
    return {
      slug: meal.id,
      numLabel: `№ ${num} · ${categoryLabel}`,
      name: meal.name,
      description: meal.description,
      price: meal.price,
      image: meal.image,
      imageAlt: meal.name,
      badges,
      available: true,
    } satisfies FareRowItem;
  }).filter(Boolean) as FareRowItem[];
}

// ===== SEO (page-level overrides) =====
export const metadata = {
  alternates: { canonical: absoluteUrl(siteConfig.routes.home) },
};

// JSON-LD: WebSite + Menu — extends the FoodEstablishment in root layout
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: absoluteUrl(),
  name: siteConfig.name,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${absoluteUrl(siteConfig.routes.menu)}?q={search_term}`,
    'query-input': 'required name=search_term',
  },
};

export default function HomePage() {
  const featured = getFeaturedItems();
  const today = formatLongDate(new Date());

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <SiteHeader />

      <main id="main">
        <HeritageHero
          image={heroImg}
          imageAlt="A spread of Hot N Nice home-cooked dishes including jollof rice, plantain lasagna, suya skewers and soups"
          eyebrow={siteConfig.voice.kitchenLocation}
          meta={`№ 11 · ${today} · Tue – Sun`}
          headline={
            <>
              Italian &amp; West African,
              <br />
              cooked from scratch, <em>delivered hot.</em>
            </>
          }
          deck="No shortcuts. No frozen meals. A five-star kitchen on its feet from ten o'clock every morning — bringing dinner to your door across Teesside."
          primaryCta={{ label: "See today's menu", href: siteConfig.routes.menu }}
          secondaryCta={{
            label: 'or message us on WhatsApp',
            href: `https://wa.me/${siteConfig.contact.whatsapp}`,
          }}
        />

        <DayBand />

        <BillOfFare items={featured} />

        <HygieneSection />

        <KitchenStory
          image={storyImg}
          imageAlt="Jollof rice plated from the kitchen"
          eyebrow="From the kitchen"
          title={<>A small kitchen, <em>cooking honestly.</em></>}
          body={
            <>
              <p>
                We're a family kitchen in Middlesbrough, cooking <b>Italian classics and West African staples</b> from scratch every morning. Our pots go on by ten o'clock — and what you see on the menu today is what we have prepared today.
              </p>
              <p>
                No shortcuts. <em>No frozen meals.</em> Just dinner, made with care, and delivered hot to your door across Teesside.
              </p>
            </>
          }
        />

        <HowItWorks />

        <DeliveryAreas />

        <CtaBand
          eyebrow="Ready when you are"
          title={<>Tonight's dinner, <em>handled.</em></>}
          sub="Place your order before ten and we'll have it at your door hot, between twelve and eight."
          cta={{ label: 'Place your order', href: siteConfig.routes.menu }}
        />
      </main>

      <SiteFooter />
    </>
  );
}
