interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  /**
   * Compact mode — used on content-heavy pages (e.g. /menu) so the
   * masthead doesn't dominate the mobile viewport. Tighter padding,
   * smaller title.
   */
  compact?: boolean;
}

/**
 * Walnut band shown at the top of non-home pages (Menu, About, Contact,
 * Legal, Account etc.). Smaller than the homepage hero — text only, no
 * background image.
 */
export default function PageHero({ eyebrow, title, sub, compact = false }: Props) {
  return (
    <section className={compact ? 'page-hero page-hero--compact' : 'page-hero'}>
      <div className="container">
        {eyebrow && <div className="page-hero__eyebrow">{eyebrow}</div>}
        <h1 className="page-hero__title">{title}</h1>
        {sub && <p className="page-hero__sub">{sub}</p>}
      </div>
    </section>
  );
}
