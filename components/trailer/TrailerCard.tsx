import { getTrailer } from '@/lib/data/trailer';

/**
 * Compact "The trailer" card for the contact page — sits under the kitchen
 * hours card in the same cream-soft frame. Renders nothing when the trailer
 * is switched off in /admin/settings.
 */
export default async function TrailerCard({ className = '' }: { className?: string }) {
  const trailer = await getTrailer();
  if (!trailer.enabled) return null;

  return (
    <div className={`rounded-[2px] border border-rule bg-cream-soft p-6 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="m-0 font-serif text-[18px] font-medium tracking-[0.14em] text-bronze-deep [font-variant:small-caps]">
          The trailer
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">
          {trailer.postcode}
        </span>
      </div>
      <p className="m-0 font-serif text-[16px] leading-[1.5] text-walnut">
        {trailer.venue}
        <br />
        {trailer.area}
      </p>
      <p className="m-0 mt-2.5 font-serif text-[15px] italic leading-[1.5] text-ink-muted">
        {trailer.daysLong} · {trailer.timeLong}
      </p>
      {trailer.note && (
        <p className="m-0 mt-1 font-serif text-[14px] italic leading-[1.5] text-ink-muted">
          {trailer.note}
        </p>
      )}
      <p className="m-0 mt-4 border-t border-rule pt-3 font-serif text-[14px] italic text-ink-muted">
        Walk up and order at the hatch — no booking.{' '}
        <a
          href={trailer.mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="border-b border-bronze-deep pb-px italic text-bronze-deep transition-colors hover:border-walnut hover:text-walnut"
        >
          Open in Maps →
        </a>
      </p>
    </div>
  );
}
