import { siteConfig } from '@/constants/siteConfig';

/**
 * Pronounced 5-star FSA hygiene section. Cream-soft band with top/bottom
 * rules, large bronze stars, headline, sub, and a framed "Verify" CTA.
 * Reused on Home and About.
 */
export default function HygieneSection() {
  const stars = Array.from({ length: siteConfig.foodHygiene.rating }).map(() => '★').join(' ');
  return (
    <section className="relative border-y border-[--color-border] bg-[--color-cream-soft] py-[clamp(56px,8vw,96px)]">
      <span
        className="absolute left-1/2 top-4 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-[rgba(45,31,24,0.35)]"
        aria-hidden
      >
        Independently rated
      </span>
      <div className="container mx-auto max-w-[560px] text-center">
        <div
          className="mb-5 inline-flex gap-2.5 text-[clamp(24px,3.5vw,32px)] leading-none text-[--color-bronze]"
          aria-label={`${siteConfig.foodHygiene.rating} star food hygiene rating`}
        >
          {stars.split(' ').map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[--color-bronze-deep]">
          {siteConfig.foodHygiene.authority}
        </p>
        <h2 className="m-0 mb-3 font-serif text-[clamp(26px,3.6vw,38px)] font-medium leading-[1.08] tracking-[-0.005em] text-[--color-walnut]">
          Five-Star{' '}
          <em className="font-normal italic text-[--color-bronze-deep]">Food Hygiene</em> Rating
        </h2>
        <p className="m-0 mb-7 font-serif text-[16px] italic leading-[1.5] text-[--color-ink-muted]">
          Independently inspected and verified by the UK Food Standards Agency — published publicly, refreshed on every visit.
        </p>
        <a
          href={siteConfig.foodHygiene.listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[2px] border border-[--color-bronze-deep] px-6 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-[--color-bronze-deep] [font-variant:small-caps] transition-colors hover:bg-[--color-bronze-deep] hover:text-[--color-cream]"
        >
          Verify on food.gov.uk →
        </a>
      </div>
    </section>
  );
}
