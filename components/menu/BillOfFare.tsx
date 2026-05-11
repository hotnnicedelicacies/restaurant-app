import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import HeritageButton from '@/components/ui/HeritageButton';
import FareRow, { FareRowItem } from './FareRow';
import { siteConfig } from '@/constants/siteConfig';

interface Props {
  items: FareRowItem[];
  eyebrow?: string;
  title?: React.ReactNode;
  sub?: React.ReactNode;
  /** Optional "See the full menu" footer link. Pass `null` to suppress. */
  footerLink?: { label: string; href: string } | null;
}

/**
 * "Today's Bill of Fare" section — used on the homepage to surface 4-6
 * featured items. Wraps a list of <FareRow> with a centered editorial
 * section header and an optional "see full menu" footer link.
 */
export default function BillOfFare({
  items,
  eyebrow = `Vol. 01 · Today's Bill of Fare`,
  title = <>Today's <em>Bill of Fare</em></>,
  sub = 'Cooked this morning · Delivered hot',
  footerLink = { label: 'See the full menu', href: siteConfig.routes.menu },
}: Props) {
  return (
    <section className="py-[clamp(56px,8vw,96px)]">
      <div className="container">
        <SectionHead eyebrow={eyebrow} title={title} sub={sub} className="mb-10" />

        <div className="mx-auto max-w-[880px]">
          {items.map((item, i) => (
            <FareRow key={item.slug} item={item} divider={i < items.length - 1} />
          ))}
        </div>

        {footerLink && (
          <div className="mt-10 text-center">
            <HeritageButton href={footerLink.href} variant="ghost">
              {footerLink.label}
            </HeritageButton>
          </div>
        )}
      </div>
    </section>
  );
}
