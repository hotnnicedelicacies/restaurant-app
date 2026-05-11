import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/constants/siteConfig';
import { formatGBP } from '@/lib/utils';

export interface FareRowItem {
  slug: string;
  /** e.g. "01 · Rice · House signature" or just "01 · Rice". */
  numLabel?: string;
  name: React.ReactNode;
  description: string;
  price: number;
  image: string | StaticImageData;
  imageAlt?: string;
  /** Dietary + allergen chips. */
  tags?: string[];
  /** Editorial badges (Signature, Fusion, House signature). */
  badges?: string[];
  /** When false → renders the "Sold out today" overlay + grays the row. */
  available?: boolean;
}

interface Props {
  item: FareRowItem;
  /** Anchor href — defaults to /menu/[slug]. */
  href?: string;
  /** When false, suppresses the divider — used for the last row. */
  divider?: boolean;
}

/**
 * Heritage menu row: 140px image · numbered category eyebrow + name + italic
 * description + chip tags · price + "Add to order →".
 * Mobile (<640px) collapses to 96px image + stacked text + inline price row.
 */
export default function FareRow({ item, href, divider = true }: Props) {
  const target = href ?? siteConfig.routes.itemDetail(item.slug);
  const isOut = item.available === false;

  return (
    <article
      className={`grid items-start gap-4 sm:grid-cols-[140px_1fr] sm:gap-6 py-5 sm:py-6 ${divider ? 'border-b border-dashed border-[--color-border] last:border-b-0' : ''}`}
    >
      {/* Image */}
      <div className="relative h-24 w-24 sm:h-[140px] sm:w-[140px]">
        <Image
          src={item.image}
          alt={item.imageAlt ?? typeof item.name === 'string' ? (item.imageAlt ?? (item.name as string)) : 'Menu item photo'}
          fill
          sizes="(min-width: 640px) 140px, 96px"
          className={`rounded-[2px] object-cover ${isOut ? 'opacity-50' : ''}`}
        />
        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(45,31,24,0.78)] text-center font-serif text-[12px] italic text-[--color-cream] sm:text-[14px]">
            Sold out today
          </div>
        )}
      </div>

      {/* Content: name+desc on the left, price+CTA on the right (desktop) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:gap-6">
        <div className="flex flex-col gap-1.5">
          {item.numLabel && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[--color-bronze-deep]">
              {item.numLabel}
              {item.badges && item.badges.length > 0 && (
                <>
                  {' · '}
                  <b className="font-medium text-[--color-bronze-deep]">{item.badges.join(' · ')}</b>
                </>
              )}
            </span>
          )}
          <h3 className="m-0 max-w-prose font-serif text-[18px] font-medium leading-[1.1] tracking-[-0.005em] text-[--color-walnut] sm:text-[22px] [&_em]:font-normal [&_em]:italic">
            {item.name}
          </h3>
          <p className="m-0 mt-0.5 max-w-[60ch] font-serif text-[13.5px] italic leading-[1.5] text-[--color-ink-muted] sm:text-[15px]">
            {item.description}
          </p>
          {item.tags && item.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[2px] border border-[--color-border] px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.16em] text-[--color-ink-muted]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right rail: price + CTA */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2.5 sm:pt-7">
          <span className="whitespace-nowrap font-serif text-[18px] font-semibold text-[--color-walnut] sm:text-[22px]">
            {formatGBP(item.price)}
          </span>
          {isOut ? (
            <span className="cursor-not-allowed pb-px font-serif text-[13px] italic text-[--color-ink-muted] opacity-50">
              Sold out
            </span>
          ) : (
            <Link
              href={target}
              className="border-b border-[--color-bronze-deep] pb-px font-serif text-[13px] italic text-[--color-bronze-deep] transition-colors hover:border-[--color-walnut] hover:text-[--color-walnut]"
            >
              Add to order →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
