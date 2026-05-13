import Link from 'next/link';
import SectionHead from '@/components/ui/SectionHead';
import { siteConfig } from '@/constants/siteConfig';
import { formatGBP } from '@/lib/utils';
import { getActiveZones } from '@/lib/data/zones';

interface Props {
  /** Render in a cream-soft section block (default), or transparent for callers that wrap themselves. */
  unwrapped?: boolean;
}

/**
 * "Across Teesside" delivery-areas card. Renders the active zones from the
 * admin-controlled `delivery_zones` table — names and the cheapest base fee.
 * Falls back to siteConfig only if the DB is unreachable and the cache is
 * cold, so the page never shows an empty card.
 */
export default async function DeliveryAreas({ unwrapped }: Props) {
  const zones = await getActiveZones();

  const areas = zones.length > 0 ? zones.map((z) => z.name) : siteConfig.delivery.areas;
  const minFee =
    zones.length > 0
      ? Math.min(...zones.map((z) => z.baseFeeGbp))
      : siteConfig.delivery.pricing.middlesbrough;
  const cheapestZone = zones.find((z) => z.baseFeeGbp === minFee);

  const card = (
    <div className="mx-auto max-w-[720px] rounded-[2px] border border-rule bg-cream p-8 text-center sm:p-10">
      <p className="m-0 mb-6 font-serif text-[17px] italic leading-[1.5] text-ink-muted">
        {areas.map((area, i) => (
          <span key={area}>
            {area}
            {i < areas.length - 1 && <span className="mx-2 text-bronze">·</span>}
          </span>
        ))}
      </p>
      <p className="m-0 mb-1.5 font-serif text-[17px] font-medium text-walnut">
        Delivery from {formatGBP(minFee)}
        {cheapestZone ? ` within ${cheapestZone.name}` : ' within Middlesbrough'}.
      </p>
      <p className="m-0 font-serif text-[14px] italic text-ink-muted">
        Final price depends on your postcode — checked at checkout.{' '}
        <Link href={siteConfig.routes.contact} className="border-b border-bronze-deep pb-px italic text-bronze-deep">
          Outside these areas? Get in touch.
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
