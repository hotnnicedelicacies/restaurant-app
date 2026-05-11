import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'onDark' | 'ghostOnDark';
type Size = 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-bronze text-walnut hover:bg-bronze-deep hover:text-cream',
  ghost:
    'bg-transparent text-walnut border border-walnut hover:bg-walnut hover:text-cream',
  onDark:
    'bg-bronze text-walnut hover:bg-cream hover:text-walnut',
  ghostOnDark:
    'bg-transparent text-cream border border-cream hover:bg-cream hover:text-walnut',
};

const SIZES: Record<Size, string> = {
  md: 'px-[22px] py-[13px] text-[14px]',
  lg: 'px-8 py-4 text-[15px]',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};
type AsLink = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: never;
  type?: never;
  disabled?: never;
};
type AsButton = CommonProps & {
  href?: undefined;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  target?: never;
  rel?: never;
};

type Props = AsLink | AsButton;

/**
 * Brand-styled CTA. Use:
 *   <HeritageButton href="/menu">Order now</HeritageButton>
 *   <HeritageButton variant="ghost" onClick={...}>Cancel</HeritageButton>
 */
export default function HeritageButton(props: Props) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const cls = cn(
    'inline-flex items-center justify-center gap-2 rounded-[2px] font-serif font-semibold uppercase tracking-[0.16em] [font-variant:small-caps] transition-colors whitespace-nowrap active:translate-y-[1px]',
    VARIANTS[variant],
    SIZES[size],
    className
  );

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} target={props.target} rel={props.rel} className={cls}>
        {children}
      </Link>
    );
  }
  const { onClick, type = 'button', disabled } = props as AsButton;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
