import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { siteConfig } from '@/constants/siteConfig';
import { formatGBP } from '@/lib/utils';

interface Props {
  /** Render in a cream-soft section block (default), or transparent for callers that wrap themselves. */
  unwrapped?: boolean;
}

/**
 * "Across Teesside" delivery-areas card. Lists the postcodes from siteConfig
 * + a base fee + a contact-for-quote line for surrounding areas. Wired to
 * admin's delivery_zones in Phase 3+.
 */
export default function DeliveryAreas({ unwrapped }: Props) {
  const card = (
    <div className="mx-auto max-w-[720px] rounded-[2px] border border-rule bg-cream p-8 text-center sm:p-10">
      <p className="m-0 mb-6 font-serif text-[17px] italic leading-[1.5] text-ink-muted">
        {siteConfig.delivery.areas.map((area, i) => (
          <span key={area}>
            {area}
            {i < siteConfig.delivery.areas.length - 1 && (
              <span className="mx-2 text-bronze">·</span>
            )}
          </span>
        ))}
      </p>
      <p className="m-0 mb-1.5 font-serif text-[17px] font-medium text-walnut">
        Delivery from {formatGBP(siteConfig.delivery.pricing.middlesbrough)} within Middlesbrough.
      </p>
      <p className="m-0 font-serif text-[14px] italic text-ink-muted">
        Surrounding areas — final price depends on your postcode.{' '}
        <Link href={siteConfig.routes.contact} className="border-b border-bronze-deep pb-px italic text-bronze-deep">
          Get in touch for a quote.
        </Link>
      </p>
    </div>
  );

  if (unwrapped) return card;

  return (
    <section className="bg-cream-soft py-[clamp(56px,8vw,96px)]">
      <div className="container">
        <SectionHead
          eyebrow="Delivery"
          title={<>Across <em>Teesside</em></>}
          className="mb-10"
        />
        {card}
      </div>
    </section>
  );
}
