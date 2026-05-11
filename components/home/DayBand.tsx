import Link from 'next/link';
import { siteConfig } from '@/constants/siteConfig';
import { getHours } from '@/lib/data/hours';

interface Props {
  /** CTA label + href. Defaults to "View today's menu". */
  cta?: { label: string; href: string };
}

/**
 * Walnut strip between the hero and main content. Surfaces trading hours
 * + the cutoff + a single CTA. Hours are pulled from admin settings via
 * getHours() so editing them in /admin/settings flows through everywhere.
 */
export default async function DayBand({
  cta = { label: "View today's menu", href: siteConfig.routes.menu },
}: Props) {
  const hours = await getHours();
  return (
    <div className="border-y border-[rgba(241,229,205,0.22)] bg-walnut text-cream">
      <div className="container flex flex-wrap items-center justify-between gap-6 py-[18px]">
        <span className="font-serif text-[15px] italic text-[#F1E5CDEB]">
          <b className="mr-2 font-medium text-bronze not-italic tracking-[0.14em] [font-variant:small-caps]">
            {hours.daysShort}
          </b>
          {hours.timeShort} · {hours.cutoffShort}
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
