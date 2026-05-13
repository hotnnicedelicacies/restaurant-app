import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import CustomiseForm from '@/components/item/CustomiseForm';
import SectionHead from '@/components/ui/SectionHead';
import FareRow, { type FareRowItem } from '@/components/menu/FareRow';
import { getMenuItem, getCategoriesWithItems } from '@/lib/data/menu';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl, formatGBP } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getMenuItem(slug);
  if (!item) return { title: 'Not found' };
  return {
    title: item.name,
    description: item.longDescription ?? item.description,
    alternates: { canonical: absoluteUrl(siteConfig.routes.itemDetail(item.slug)) },
    openGraph: {
      title: `${item.name} · ${siteConfig.name}`,
      description: item.description,
      type: 'website',
      images: [absoluteUrl('/og-image.jpg')],
    },
  };
}

export default async function ItemDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getMenuItem(slug);
  if (!item) notFound();

  // Related items: same category, exclude self, max 3
  const { itemsByCategory } = await getCategoriesWithItems();
  const related = (itemsByCategory[item.categorySlug] ?? [])
    .filter((i) => i.slug !== item.slug)
    .slice(0, 3);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: item.name,
    description: item.description,
    image: typeof item.image === 'string' ? item.image : undefined,
    offers: {
      '@type': 'Offer',
      price: item.priceGbp.toFixed(2),
      priceCurrency: 'GBP',
      availability: item.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <SiteHeader />
      <main>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="border-b border-rule bg-cream-soft">
          <div className="container flex flex-wrap items-center gap-2.5 py-3.5 font-serif text-[13px]">
            <Link href={siteConfig.routes.home} className="italic text-ink-muted transition-colors hover:text-walnut">
              Home
            </Link>
            <span className="text-bronze">·</span>
            <Link href={siteConfig.routes.menu} className="italic text-ink-muted transition-colors hover:text-walnut">
              Menu
            </Link>
            <span className="text-bronze">·</span>
            <Link
              href={`${siteConfig.routes.menu}#${item.categorySlug}`}
              className="italic text-ink-muted transition-colors hover:text-walnut"
            >
              {item.categoryName}
            </Link>
            <span className="text-bronze">·</span>
            <span className="font-medium tracking-[0.08em] text-walnut [font-variant:small-caps]">
              {item.name}
            </span>
          </div>
        </nav>

        {/* Detail */}
        <section className="pb-[clamp(48px,7vw,88px)] pt-[clamp(40px,6vw,64px)]">
          <div className="container">
            <div className="grid items-start gap-[clamp(32px,5vw,64px)] md:grid-cols-[1.05fr_1fr]">
              {/* LEFT: photo with offset bronze frame */}
              <div className="relative">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={900}
                  height={1125}
                  className="aspect-[4/5] w-full rounded-[2px] object-cover sm:aspect-[4/5]"
                  priority
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-4 -right-4 left-4 top-4 -z-10 hidden rounded-[2px] border border-bronze opacity-[0.35] md:block"
                />
              </div>

              {/* RIGHT: info + customise */}
              <div className="flex flex-col gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
                  {item.categoryName}
                  {item.badges.length > 0 && ` · ${item.badges.join(' · ')}`}
                </span>
                <h1 className="m-0 font-serif text-[clamp(32px,4.5vw,48px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut [&_em]:font-normal [&_em]:italic">
                  {item.name}
                </h1>
                <p className="m-0 max-w-[56ch] font-serif text-[17px] italic leading-[1.6] text-ink-muted">
                  {item.longDescription ?? item.description}
                </p>

                {(item.dietaryTags.length > 0 || item.allergenTags.length > 0 || !item.isAvailable) && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.dietaryTags.map((tag) => (
                      <span key={tag} className="rounded-[2px] border border-rule px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-walnut">
                        {tag}
                      </span>
                    ))}
                    {item.allergenTags.map((tag) => (
                      <span key={tag} className="rounded-[2px] border border-rule px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-walnut">
                        {tag}
                      </span>
                    ))}
                    {item.isAvailable ? (
                      <span className="rounded-[2px] border border-rule px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-walnut">
                        Available today
                      </span>
                    ) : (
                      <span className="rounded-[2px] border border-[rgba(139,42,26,0.4)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#8B2A1A]">
                        Sold out today
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-1 flex items-baseline gap-3 border-y border-rule py-4">
                  <span className="font-serif text-[32px] font-semibold tracking-[-0.005em] text-walnut">
                    {formatGBP(item.priceGbp)}
                  </span>
                  <span className="font-serif text-[13px] italic text-ink-muted">
                    Base price · before add-ons
                  </span>
                </div>

                <CustomiseForm
                  item={{
                    id: item.id,
                    slug: item.slug,
                    name: item.name,
                    basePriceGbp: item.priceGbp,
                    image: typeof item.image === 'string' ? item.image : (item.image as { src: string }).src,
                    variants: item.variants,
                    addons: item.addons,
                    isAvailable: item.isAvailable,
                    isCodEligible: item.isCodEligible,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Related items */}
        {related.length > 0 && (
          <section className="bg-cream-soft py-[clamp(56px,8vw,96px)]">
            <div className="container">
              <SectionHead eyebrow="Pair it with" title={<>You might also <em>like</em></>} className="mb-10" />
              <div className="mx-auto grid max-w-[1000px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <article key={r.slug} className="flex flex-col gap-2.5">
                    <Link href={siteConfig.routes.itemDetail(r.slug)} className="block">
                      <Image
                        src={r.image}
                        alt={r.name}
                        width={400}
                        height={400}
                        className="aspect-square w-full rounded-[2px] object-cover"
                      />
                    </Link>
                    <h3 className="m-0 font-serif text-[17px] font-medium text-walnut">{r.name}</h3>
                    <div className="mt-0.5 flex items-center justify-between gap-3">
                      <span className="font-serif text-[15px] font-semibold text-walnut">
                        {formatGBP(r.priceGbp)}
                      </span>
                      <Link
                        href={siteConfig.routes.itemDetail(r.slug)}
                        className="border-b border-bronze-deep pb-px font-serif text-[13px] italic text-bronze-deep"
                      >
                        Add to order →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
