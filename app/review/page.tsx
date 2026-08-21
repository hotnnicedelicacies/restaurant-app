import type { Metadata } from 'next';
import Link from 'next/link';
import { after } from 'next/server';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PageHero from '@/components/layout/PageHero';
import FeedbackForm from '@/components/review/FeedbackForm';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';
import { getContact } from '@/lib/data/contact';
import { getGoogleReviewUrl } from '@/lib/review/google';
import { logReviewEvent } from '@/lib/review/events';
import { parseReviewSource } from '@/lib/review/source';

// Reads `?src=` and writes a view event — always dynamic.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leave a review',
  description: `Thank you for eating with ${siteConfig.name}. Leave a Google review, or tell the kitchen privately.`,
  // Utility page reached from QR codes — don't let it compete in search.
  robots: { index: false, follow: true },
  openGraph: {
    title: `Leave a review — ${siteConfig.name}`,
    description: 'A small kitchen runs on word of mouth. Two ways to share yours.',
    type: 'website',
    url: absoluteUrl(siteConfig.routes.review),
    images: [absoluteUrl('/og-image.jpg')],
  },
};

const CARD_CLS = 'rounded-[2px] border border-rule bg-cream p-6 sm:p-8';
const CARD_HEAD_CLS = 'mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5';
const CARD_TITLE_CLS =
  'm-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut [&_em]:font-normal [&_em]:italic';
const CARD_NO_CLS = 'font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep';
const CARD_BODY_CLS = 'm-0 mb-5 font-serif text-[16px] leading-[1.55] text-ink-muted';

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  const sp = await searchParams;
  const src = parseReviewSource(sp.src);
  const contact = await getContact();
  const googleConfigured = getGoogleReviewUrl() !== null;

  // Cookieless page-view event, written after the response is sent.
  after(() => logReviewEvent('view', src));

  const googleHref = `${siteConfig.routes.reviewGoogle}?src=${src}`;

  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          compact
          eyebrow="№ — The Reader's Column"
          title={
            <>
              Thank you for <em>eating with us.</em>
            </>
          }
          sub="A small kitchen runs on word of mouth. Two ways to share yours —"
        />

        <section className="py-[clamp(36px,6vw,72px)]">
          <div className="container">
            <div
              className={
                googleConfigured
                  ? 'mx-auto grid max-w-[980px] items-start gap-6 md:grid-cols-2 md:gap-8'
                  : 'mx-auto grid max-w-[620px] gap-6'
              }
            >
              {googleConfigured && (
                <article className={CARD_CLS}>
                  <header className={CARD_HEAD_CLS}>
                    <h2 className={CARD_TITLE_CLS}>
                      Leave a review on <em>Google</em>
                    </h2>
                    <span className={CARD_NO_CLS}>№ 01</span>
                  </header>
                  <p className={CARD_BODY_CLS}>
                    Takes about a minute, and it&apos;s how other people across Teesside find us.
                  </p>
                  {/*
                    Plain <a>, deliberately not next/link: Link prefetches
                    in-viewport hrefs, which would hit the redirect route and
                    log a phantom google_click on every page view.
                  */}
                  <a
                    href={googleHref}
                    rel="nofollow"
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[2px] bg-bronze px-[22px] py-[13px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-walnut transition-colors [font-variant:small-caps] hover:bg-bronze-deep hover:text-cream active:translate-y-[1px] sm:w-auto"
                  >
                    Write a Google review
                  </a>
                </article>
              )}

              <article className={CARD_CLS}>
                <header className={CARD_HEAD_CLS}>
                  <h2 className={CARD_TITLE_CLS}>
                    Tell the kitchen <em>privately</em>
                  </h2>
                  <span className={CARD_NO_CLS}>{googleConfigured ? '№ 02' : '№ 01'}</span>
                </header>
                <p className={CARD_BODY_CLS}>
                  Goes straight to us — nowhere public. If something wasn&apos;t right with your order,
                  this is the fastest way to have it put right.
                </p>
                <FeedbackForm
                  src={src}
                  whatsappNumber={contact.whatsapp}
                  whatsappDisplay={contact.whatsappDisplay}
                />
              </article>
            </div>

            <div className="mx-auto mt-9 flex max-w-[980px] flex-col items-center gap-2.5 text-center">
              <Link
                href={siteConfig.routes.menu}
                className="link-underline font-serif text-[15px] italic text-walnut"
              >
                Back to today&apos;s menu
              </Link>
              <p className="m-0 font-serif text-[13px] italic text-ink-muted">
                We only use these details to reply about your order — see our{' '}
                <a href={siteConfig.routes.legal.privacy} className="link-underline">
                  privacy policy
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
