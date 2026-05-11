import { cn } from '@/lib/utils';

const VARIANTS = {
  default: 'bg-cream-soft text-walnut border-rule',
  received: 'bg-cream text-walnut border-walnut',
  preparing: 'bg-bronze text-walnut border-bronze',
  out: 'bg-bronze-deep text-cream border-bronze-deep',
  delivered: 'bg-walnut text-cream border-walnut',
  cancelled: 'bg-cream text-[#8B2A1A] border-[rgba(139,42,26,0.4)]',
  refunded: 'bg-cream text-ink-muted border-rule',
  cod: 'bg-cream text-walnut border-walnut',
  card: 'bg-cream-soft text-ink-muted border-rule',
  collected: 'bg-[#1e7d3f] text-cream border-[#1e7d3f]',
  uncollected: 'bg-cream text-[#8B2A1A] border-[rgba(139,42,26,0.4)]',
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
