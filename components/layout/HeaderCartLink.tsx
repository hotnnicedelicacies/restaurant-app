'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart/store';
import { siteConfig } from '@/constants/siteConfig';
import { cn } from '@/lib/utils';

interface Props {
  /** Show against a dark walnut background (header) vs light (mobile sheet). */
  tone?: 'onDark' | 'onLight';
  /** Inline label next to the icon — used in the mobile nav. */
  withLabel?: boolean;
  onClick?: () => void;
}

export default function HeaderCartLink({ tone = 'onDark', withLabel = false, onClick }: Props) {
  const [mounted, setMounted] = useState(false);
  const count = useCart((s) => s.count());

  // Avoid hydration mismatch — count comes from localStorage so it's
  // client-only. Render the icon with no badge on first paint.
  useEffect(() => setMounted(true), []);

  const colors =
    tone === 'onDark'
      ? 'text-cream hover:text-bronze'
      : 'text-walnut hover:text-bronze-deep';
  const badgeColors =
    tone === 'onDark' ? 'bg-bronze text-walnut' : 'bg-walnut text-cream';

  return (
    <Link
      href={siteConfig.routes.cart}
      onClick={onClick}
      aria-label={`Basket${mounted && count > 0 ? ` · ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className={cn(
        'relative inline-flex items-center gap-2 rounded-[2px] px-2 py-1.5 transition-colors',
        colors
      )}
    >
      <ShoppingBag size={20} strokeWidth={1.5} />
      {withLabel && (
        <span className="font-serif text-[14px] font-medium tracking-[0.14em] [font-variant:small-caps]">
          Basket
        </span>
      )}
      {mounted && count > 0 && (
        <span
          className={cn(
            'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-mono text-[10px] font-semibold tabular-nums',
            badgeColors,
            withLabel ? '' : 'absolute -right-1.5 -top-1.5'
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
