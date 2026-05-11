import { cn } from '@/lib/utils';

const VARIANTS = {
  default: 'bg-[--color-cream-soft] text-[--color-walnut] border-[--color-border]',
  received: 'bg-[--color-cream] text-[--color-walnut] border-[--color-walnut]',
  preparing: 'bg-[--color-bronze] text-[--color-walnut] border-[--color-bronze]',
  out: 'bg-[--color-bronze-deep] text-[--color-cream] border-[--color-bronze-deep]',
  delivered: 'bg-[--color-walnut] text-[--color-cream] border-[--color-walnut]',
  cancelled: 'bg-[--color-cream] text-[#8B2A1A] border-[rgba(139,42,26,0.4)]',
  refunded: 'bg-[--color-cream] text-[--color-ink-muted] border-[--color-border]',
  cod: 'bg-[--color-cream] text-[--color-walnut] border-[--color-walnut]',
  card: 'bg-[--color-cream-soft] text-[--color-ink-muted] border-[--color-border]',
  collected: 'bg-[#1e7d3f] text-[--color-cream] border-[#1e7d3f]',
  uncollected: 'bg-[--color-cream] text-[#8B2A1A] border-[rgba(139,42,26,0.4)]',
} as const;

export type PillVariant = keyof typeof VARIANTS;

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
}

export function Pill({ variant = 'default', className, ...rest }: Props) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-[2px] border px-[10px] py-[4px] font-mono text-[9px] uppercase tracking-[0.18em]',
        VARIANTS[variant],
        className
      )}
      {...rest}
    />
  );
}
