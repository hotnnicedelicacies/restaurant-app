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
 * "Across Teesside" delivery-areas card. Renders the active zones from
 * the admin-controlled `delivery_zones` table — names and the cheapest
 * base fee. If zones haven't loaded (cold cache + DB down) the card
 * renders an honest "we'll publish our zones shortly" state instead of
 * a stale business value.
 */
export default async function DeliveryAreas({ unwrapped }: Props) {
  const zones = await getActiveZones();
  const areas = zones.map((z) => z.name);
  const minFee = zones.length > 0 ? Math.min(...zones.map((z) => z.baseFeeGbp)) : null;
  const cheapestZone = minFee !== null ? zones.find((z) => z.baseFeeGbp === minFee) : undefined;

  const card = (
    <div className="mx-auto max-w-[720px] rounded-[2px] border border-rule bg-cream p-8 text-center sm:p-10">
      {areas.length > 0 ? (
        <p className="m-0 mb-6 font-serif text-[17px] italic leading-[1.5] text-ink-muted">
          {areas.map((area, i) => (
            <span key={area}>
              {area}
              {i < areas.length - 1 && <span className="mx-2 text-bronze">·</span>}
            </span>
          ))}
        </p>
      ) : (
        <p className="m-0 mb-6 font-serif text-[17px] italic leading-[1.5] text-ink-muted">
          Delivery zones are being published — check back shortly.
        </p>
      )}
      {minFee !== null && cheapestZone && (
        <p className="m-0 mb-1.5 font-serif text-[17px] font-medium text-walnut">
          Delivery from {formatGBP(minFee)} within {cheapestZone.name}.
        </p>
      )}
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
