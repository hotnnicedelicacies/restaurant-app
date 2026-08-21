import Image from 'next/image';
import HeritageButton from '@/components/ui/HeritageButton';
import { siteConfig } from '@/constants/siteConfig';
import { getTrailer } from '@/lib/data/trailer';
import { getContact } from '@/lib/data/contact';
import trailerImg from '@/assets/trailer/trailer-side.jpg';

const RULE_ON_DARK = 'rgba(241,229,205,0.22)';

/**
 * Home-page walnut band: "Or come to the trailer." Photo of the real
 * trailer on the left, a short listing on the right — where, when, how —
 * pulled from the admin-editable `trailer` setting. Renders nothing when
 * the trailer is switched off in /admin/settings.
 */
export default async function TrailerSection() {
  const [trailer, contact] = await Promise.all([getTrailer(), getContact()]);
  if (!trailer.enabled) return null;

  const facts: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Where',
      value: (
        <>
          {trailer.venue}
          <br />
          {trailer.area} {trailer.postcode}
        </>
      ),
    },
    {
      label: 'When',
      value: (
        <>
          {trailer.daysShort}
          <br />
          {trailer.timeLong}
        </>
      ),
    },
    {
      label: 'How',
      value: 'Walk up and order at the hatch — no booking.',
    },
  ];

  return (
    <section
      className="bg-walnut py-[clamp(56px,8vw,96px)] text-cream"
      style={{ borderTop: `1px solid ${RULE_ON_DARK}`, borderBottom: `1px solid ${RULE_ON_DARK}` }}
    >
      <div className="container">
        <div className="mx-auto grid max-w-[1140px] items-center gap-[clamp(40px,5vw,72px)] md:grid-cols-[1.15fr_1fr]">
          <figure className="relative isolate m-0">
            <Image
              src={trailerImg}
              alt={`The ${siteConfig.shortName} trailer with both hatches open — ${trailer.venue}, ${trailer.area}`}
              placeholder="blur"
              sizes="(min-width: 1200px) 610px, (min-width: 768px) 52vw, 100vw"
              className="aspect-[16/10] w-full rounded-[2px] object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-4 -left-4 right-4 top-4 -z-10 rounded-[2px] border border-bronze opacity-60"
            />
            <figcaption className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-bronze">
              {trailer.venue} · {trailer.area}
            </figcaption>
          </figure>

          <div className="flex flex-col gap-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bronze">
              Find us · {trailer.area.split(',')[0]}
            </span>
            <h2 className="m-0 font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.05] tracking-[-0.005em] text-cream [&_em]:font-normal [&_em]:italic [&_em]:text-bronze">
              Or come to <em>the trailer.</em>
            </h2>
            <p className="m-0 font-serif text-[17px] leading-[1.6] text-[#F1E5CDD2]">
              The same pots, served hot through the hatch — halal, cooked that morning, no booking
              needed. If you&apos;re passing {trailer.area.split(',')[0]}, come and say hello.
            </p>

            <dl className="m-0 mt-1" style={{ borderTop: `1px solid ${RULE_ON_DARK}` }}>
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="grid grid-cols-[76px_1fr] gap-4 py-3.5"
                  style={{ borderBottom: `1px solid ${RULE_ON_DARK}` }}
                >
                  {/* Functional row keys — cream tint (≈8:1), not bronze (3.5:1, decorative only on walnut). */}
                  <dt className="pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F1E5CDB3]">
                    {f.label}
                  </dt>
                  <dd className="m-0 font-serif text-[16px] leading-[1.5] text-cream">{f.value}</dd>
                </div>
              ))}
            </dl>

            {trailer.note && (
              <p className="m-0 font-serif text-[14px] italic leading-[1.5] text-[#F1E5CDB3]">
                {trailer.note}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-4">
              <HeritageButton
                href={trailer.mapsHref}
                variant="ghostOnDark"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Maps
              </HeritageButton>
              <a
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline link-underline--on-dark"
              >
                or message us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
