import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';

interface Props {
  eyebrow: string;
  /** Title with optional <em>…</em> emphasis. */
  title: React.ReactNode;
  /** "Last updated: 11 May 2026 · UK GDPR · Data Protection Act 2018" */
  updatedLine: string;
  /** Small tag chips beneath the hero (e.g., "Template — for lawyer review"). */
  tags?: { label: string; warning?: boolean }[];
  children: React.ReactNode;
}

export default function LegalLayout({ eyebrow, title, updatedLine, tags, children }: Props) {
  return (
    <>
      <SiteHeader />

      <section className="border-b border-[rgba(241,229,205,0.22)] bg-walnut py-[clamp(56px,7vw,96px)] text-cream">
        <div className="container">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze">
            {eyebrow}
          </div>
          <h1 className="m-0 mb-3 font-serif text-[clamp(38px,5.5vw,60px)] font-medium leading-[1.02] tracking-[-0.005em] text-cream [&_em]:font-normal [&_em]:italic [&_em]:text-bronze">
            {title}
          </h1>
          <p className="m-0 font-serif text-[14px] italic text-[#F1E5CDB8]">{updatedLine}</p>
        </div>
      </section>

      <main className="mx-auto max-w-[720px] px-6 py-[clamp(48px,6vw,80px)]">
        {tags && tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`rounded-[2px] border px-[9px] py-1 font-mono text-[9px] uppercase tracking-[0.2em] ${
                  tag.warning
                    ? 'border-[rgba(139,42,26,0.4)] text-[#8B2A1A]'
                    : 'border-rule text-ink-muted'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
        <article className="legal-content">{children}</article>
      </main>

      <SiteFooter />
    </>
  );
}
