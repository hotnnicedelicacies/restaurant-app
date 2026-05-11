import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  /** Width in px. Defaults to 40 (heritage standard). */
  width?: number;
  /** When placed on a walnut/dark band, bumps opacity for visibility. */
  onDark?: boolean;
}

export default function Ornament({ className, width = 40, onDark }: Props) {
  return (
    <span
      aria-hidden
      className={cn('mx-auto block h-px', className)}
      style={{
        width,
        background: 'var(--color-bronze)',
        opacity: onDark ? 0.85 : 0.7,
      }}
    />
  );
}
