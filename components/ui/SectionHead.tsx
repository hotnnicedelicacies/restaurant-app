import { cn } from '@/lib/utils';
import Ornament from './Ornament';

interface Props {
  eyebrow?: string;
  /** Title — JSX so callers can use `<em>` for italic emphasis. */
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** If section is on a walnut band, recolours the eyebrow + ornament. */
  onDark?: boolean;
  /** Show the bronze ornament beneath the head. Default `true`. */
  ornament?: boolean;
  className?: string;
}

/**
 * Centered editorial section header.
 *   eyebrow (mono, all-caps, bronze)
 *   title   (display serif, italic emphasis allowed)
 *   sub     (italic muted)
 *   ornament (bronze rule)
 */
export default function SectionHead({
  eyebrow,
  title,
  sub,
  onDark,
  ornament = true,
  className,
}: Props) {
  return (
    <header className={cn('text-center', className)}>
      {eyebrow && (
        <p
          className={cn(
            'mb-3 font-mono text-[10px] uppercase tracking-[0.22em]',
            onDark ? 'text-bronze' : 'text-bronze-deep'
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'm-0 font-serif text-[clamp(28px,4vw,42px)] font-medium leading-[1.04] tracking-[-0.005em] [&_em]:font-normal [&_em]:italic',
          onDark ? 'text-cream' : 'text-walnut'
        )}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={cn(
            'm-0 mt-1.5 font-serif text-[15px] italic',
            onDark ? 'text-[#F1E5CDB3]' : 'text-ink-muted'
          )}
        >
          {sub}
        </p>
      )}
      {ornament && <Ornament className="mt-4" onDark={onDark} />}
    </header>
  );
}
