import Image, { StaticImageData } from 'next/image';
import HeritageButton from '@/components/ui/HeritageButton';
import { siteConfig } from '@/constants/siteConfig';
import { cn } from '@/lib/utils';

interface Props {
  image: string | StaticImageData;
  imageAlt: string;
  eyebrow?: string;
  /** Headline JSX — wrap the emphasised phrase in <em>…</em>. */
  headline: React.ReactNode;
  deck?: React.ReactNode;
  /** Top-right meta (e.g. issue number + day). */
  meta?: React.ReactNode;
  /** Optional CTA pair — defaults match the homepage. */
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  className?: string;
}

/**
 * Full-bleed food image hero with a walnut gradient overlay.
 * Text overlay anchored bottom-left: eyebrow → headline → deck → CTAs.
 * Designed for the homepage but reusable for category hero pages.
 */
export default function HeritageHero({
  image,
  imageAlt,
  eyebrow,
  headline,
  deck,
  meta,
  primaryCta = { label: "See today's menu", href: siteConfig.routes.menu },
  secondaryCta,
  className,
}: Props) {
  return (
    <section className={cn('relative h-[clamp(560px,78vh,780px)] overflow-hidden text-[--color-cream]', className)}>
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="100vw"
        priority
        placeholder={typeof image === 'string' ? undefined : 'blur'}
        className="object-cover brightness-[0.76] saturate-[1.04]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--color-walnut) 32%, transparent) 0%, color-mix(in srgb, var(--color-walnut) 14%, transparent) 22%, color-mix(in srgb, var(--color-walnut) 58%, transparent) 70%, color-mix(in srgb, var(--color-walnut) 94%, transparent) 100%)',
        }}
      />

      <div className="container relative flex h-full flex-col justify-between pt-7 pb-12">
        <div className="flex flex-col justify-between gap-1.5 sm:flex-row sm:items-start sm:gap-6">
          {eyebrow && (
            <span
              className="font-serif text-[13px] font-medium tracking-[0.22em] text-[--color-cream] [font-variant:small-caps]"
              style={{ textShadow: '0 1px 4px rgba(45, 31, 24, 0.45)' }}
            >
              {eyebrow}
            </span>
          )}
          {meta && (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-[--color-cream] sm:text-right"
              style={{ textShadow: '0 1px 4px rgba(45, 31, 24, 0.45)' }}
            >
              {meta}
            </span>
          )}
        </div>

        <div className="max-w-[720px]">
          <h1 className="m-0 mb-4 font-serif text-[clamp(40px,7vw,76px)] font-medium leading-[1.02] tracking-[-0.01em] text-[--color-cream] [&_em]:font-normal [&_em]:italic [&_em]:text-[--color-bronze]">
            {headline}
          </h1>
          {deck && (
            <p className="m-0 max-w-[580px] font-serif text-[clamp(16px,1.7vw,19px)] italic leading-[1.5] text-[#F1E5CDDB]">
              {deck}
            </p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <HeritageButton href={primaryCta.href} variant="primary">
              {primaryCta.label}
            </HeritageButton>
            {secondaryCta && (
              <a href={secondaryCta.href} className="link-underline italic text-[--color-cream]">
                {secondaryCta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
