import { siteConfig } from '@/constants/siteConfig';

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  cta: { label: string; href: string };
  /** Show the channel links row (WhatsApp / Call / Email). Default `true`. */
  showChannels?: boolean;
}

/**
 * Pre-footer dark walnut CTA band. Centered with an eyebrow, italic-
 * emphasised title, supporting sub, primary CTA, and optional contact-
 * channel links beneath.
 */
export default function CtaBand({ eyebrow, title, sub, cta, showChannels = true }: Props) {
  return (
    <section className="bg-[--color-walnut] py-[clamp(64px,9vw,112px)] text-center text-[--color-cream]">
      <div className="container">
        {eyebrow && (
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-bronze]">
            {eyebrow}
          </p>
        )}
        <h2 className="m-0 mx-auto mb-3 max-w-[800px] font-serif text-[clamp(32px,5vw,56px)] font-medium leading-[1.04] tracking-[-0.005em] text-[--color-cream] [&_em]:font-normal [&_em]:italic [&_em]:text-[--color-bronze]">
          {title}
        </h2>
        {sub && (
          <p className="m-0 mx-auto mb-8 max-w-[580px] font-serif text-[17px] italic leading-[1.5] text-[#F1E5CD8C]">
            {sub}
          </p>
        )}
        <a
          href={cta.href}
          className="inline-block rounded-[2px] bg-[--color-bronze] px-8 py-4 font-serif text-[15px] font-semibold uppercase tracking-[0.16em] text-[--color-walnut] [font-variant:small-caps] transition-colors hover:bg-[--color-cream] hover:text-[--color-walnut]"
        >
          {cta.label}
        </a>

        {showChannels && (
          <div className="mt-8 flex flex-wrap justify-center gap-6 font-serif text-[14px] italic text-[#F1E5CDB3]">
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-[rgba(241,229,205,0.3)] pb-px text-[#F1E5CDD9] transition-colors hover:border-[--color-bronze] hover:text-[--color-bronze]"
            >
              WhatsApp · {siteConfig.contact.whatsappDisplay}
            </a>
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="border-b border-[rgba(241,229,205,0.3)] pb-px text-[#F1E5CDD9] transition-colors hover:border-[--color-bronze] hover:text-[--color-bronze]"
            >
              Call · {siteConfig.contact.phone}
            </a>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="border-b border-[rgba(241,229,205,0.3)] pb-px text-[#F1E5CDD9] transition-colors hover:border-[--color-bronze] hover:text-[--color-bronze]"
            >
              Email
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
