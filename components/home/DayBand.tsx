import Link from 'next/link';
import { siteConfig } from '@/constants/siteConfig';

interface Props {
  /** "Tue – Sun" override (defaults to siteConfig). */
  daysShort?: string;
  /** "12 – 8pm" override. */
  hoursShort?: string;
  /** Cutoff suffix. */
  cutoff?: string;
  /** CTA label + href. */
  cta?: { label: string; href: string };
}

/**
 * Walnut strip between the hero and main content. Surfaces hours + cutoff +
 * a single CTA. Wired to admin settings (business_hours.*) in Phase 4.
 */
export default function DayBand({
  daysShort = 'Tue – Sun',
  hoursShort = '12 – 8pm',
  cutoff = 'Order by 10am for same-day delivery',
  cta = { label: "View today's menu", href: siteConfig.routes.menu },
}: Props) {
  return (
    <div className="border-y border-[rgba(241,229,205,0.22)] bg-walnut text-cream">
      <div className="container flex flex-wrap items-center justify-between gap-6 py-[18px]">
        <span className="font-serif text-[15px] italic text-[#F1E5CDEB]">
          <b className="mr-2 font-medium text-bronze not-italic tracking-[0.14em] [font-variant:small-caps]">
            {daysShort}
          </b>
          {hoursShort} · {cutoff}
        </span>
        <Link
          href={cta.href}
          className="rounded-[2px] bg-bronze px-5 py-[10px] font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] transition-colors hover:bg-cream hover:text-walnut"
        >
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
