import type { Metadata } from 'next';
import Image from 'next/image';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PageHero from '@/components/layout/PageHero';
import HygieneSection from '@/components/home/HygieneSection';
import CtaBand from '@/components/home/CtaBand';
import SectionHead from '@/components/ui/SectionHead';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl, romanLower } from '@/lib/utils';
import portraitImg from '@/assets/meals/jollof-rice-with-protein-of-choice-and-plantain.jpeg';

export const metadata: Metadata = {
  title: 'About',
  description: `${siteConfig.name} — a family kitchen in Middlesbrough cooking Italian classics and West African home staples from scratch every morning, since 2019.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.about) },
  openGraph: {
    title: `About ${siteConfig.name}`,
    description: `A small family kitchen in Middlesbrough — no shortcuts, no frozen meals, just dinner.`,
    type: 'website',
    images: [absoluteUrl('/og-image.jpg')],
  },
};

const PILLARS = [
  {
    title: <>Cooked the <em>same day</em></>,
    body:
      "Pots go on at ten. What's on the menu today is what's in the kitchen today. We don't pre-cook a week's worth and call it fresh.",
  },
  {
    title: <>No <em>frozen</em> meals</>,
    body:
      'Nothing is portioned in advance and held in a freezer. If you can taste it, it was simmering this morning. Ingredients come in fresh.',
  },
  {
    title: <>A <em>clean</em> kitchen</>,
    body:
      'Five-star Food Hygiene Rating from the Food Standards Agency, independently inspected. Every kitchen deserves nothing less.',
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Our Story · Middlesbrough · Est. 2019"
          title={<>A home kitchen, <em>cooking honestly.</em></>}
          sub="Italian classics & West African home cooking, made fresh, brought to your door."
        />

        {/* Intro with portrait + quote */}
        <section className="py-[clamp(56px,8vw,96px)]">
          <div className="container">
            <div className="mx-auto grid max-w-[1180px] items-center gap-[clamp(40px,6vw,80px)] md:grid-cols-2">
              <div className="relative">
                <Image
                  src={portraitImg}
                  alt="Jollof rice plated from the kitchen"
                  width={900}
                  height={1125}
                  className="aspect-[4/5] w-full rounded-[2px] object-cover"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-4 -right-4 left-4 top-4 -z-10 rounded-[2px] border border-[--color-bronze] opacity-40"
                />
              </div>
              <div className="flex flex-col gap-4">
                <span className="t-mono">A note from the kitchen</span>
                <h2 className="t-display-l">
                  We are <em>a small family kitchen</em> in Middlesbrough.
                </h2>
                <p className="t-body-l">
                  Two stoves, one oven, three pairs of hands. Every dish on the menu is one we cook at
                  home, the way we cook it at home. The recipes came with us from Lagos and learned new
                  tricks in Teesside.
                </p>
                <blockquote className="m-0 mt-3 border-l-2 border-[--color-bronze] pl-6 font-serif text-[clamp(20px,2.4vw,26px)] italic leading-[1.4] text-[--color-walnut]">
                  "The shortcut is the thing we don't take. Frozen would be faster. Cheaper too. But it
                  wouldn't be honest, and it wouldn't taste like ours."
                </blockquote>
                <span className="pl-6 font-serif text-[13px] font-medium tracking-[0.14em] text-[--color-bronze-deep] [font-variant:small-caps]">
                  — Anike, head of the kitchen
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Long prose */}
        <section className="bg-[--color-cream-soft] py-[clamp(56px,8vw,96px)]">
          <div className="container">
            <SectionHead
              eyebrow="How we got here"
              title={<>Cooked in <em>Lagos.</em> Plated in <em>Middlesbrough.</em></>}
              className="mb-10"
            />
            <article className="mx-auto max-w-[680px] font-serif text-[18px] leading-[1.65] text-[--color-walnut] [&_em]:italic [&_p]:m-0 [&_p+p]:mt-4 [&_b]:font-medium">
              <p className="[&::first-letter]:float-left [&::first-letter]:pr-2.5 [&::first-letter]:pt-1 [&::first-letter]:text-[3.6em] [&::first-letter]:font-medium [&::first-letter]:leading-[0.9] [&::first-letter]:text-[--color-bronze-deep]">
                We started cooking for the neighbours in 2019. One pot of jollof on a Sunday afternoon,
                ferried across the street in a tupperware. Then two pots. Then five. Then a friend
                asked, half-jokingly, whether we could do delivery.
              </p>
              <p>
                What we knew about delivery in those days you could fit on the back of a takeaway menu.
                What we knew about cooking, we knew from twenty-odd years of weeknight dinners. So we
                cooked the way we always had — start in the morning, peppers on a low heat, rice steamed
                slowly so the smoke gets into every grain — and we sent it out hot.
              </p>
              <p>
                Six years on, the kitchen is still small. The pots are still on by ten. The recipes have
                grown to include the Italian classics our youngest grew up asking for —{' '}
                <em>lasagna</em>, <em>spaghetti bolognaise</em> — and a few experiments that turned into
                permanent fixtures, like the <b>plantain lasagna</b> that nobody believed in until they
                tried it.
              </p>
              <p>
                We've earned a five-star food hygiene rating from the Food Standards Agency, which we
                are quietly proud of and very rigorous about. We deliver across Teesside, Tuesday
                through Sunday, between twelve and eight. Order by ten in the morning and we'll have it
                at your door before dinner cools.
              </p>
              <p>That, more or less, is the whole story. The rest is in the pots.</p>
            </article>
          </div>
        </section>

        {/* Three house rules */}
        <section className="py-[clamp(56px,8vw,96px)]">
          <div className="container">
            <SectionHead
              eyebrow={`What we mean by "honest food"`}
              title={<>Three <em>house rules</em></>}
              className="mb-10"
            />
            <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
              {PILLARS.map((p, i) => (
                <article key={i}>
                  <div className="mb-3 font-serif text-[48px] italic font-normal leading-none text-[--color-bronze]">
                    {romanLower(i + 1)}.
                  </div>
                  <h3 className="m-0 mb-2 font-serif text-[22px] font-medium text-[--color-walnut] [&_em]:font-normal [&_em]:italic">
                    {p.title}
                  </h3>
                  <p className="m-0 font-serif text-[15.5px] italic leading-[1.55] text-[--color-ink-muted]">
                    {p.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <HygieneSection />

        <CtaBand
          eyebrow="Come for dinner"
          title={<>See what's <em>cooking today.</em></>}
          sub="Browse today's bill of fare and place an order before ten for same-day delivery."
          cta={{ label: "View today's menu", href: siteConfig.routes.menu }}
          showChannels={false}
        />
      </main>
      <SiteFooter />
    </>
  );
}
