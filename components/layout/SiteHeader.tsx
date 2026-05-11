'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { siteConfig } from '@/constants/siteConfig';
import { cn } from '@/lib/utils';

type Nav = { label: string; href: string };

const PUBLIC_NAV: Nav[] = [
  { label: 'Home', href: siteConfig.routes.home },
  { label: 'Menu', href: siteConfig.routes.menu },
  { label: 'About', href: siteConfig.routes.about },
  { label: 'Contact', href: siteConfig.routes.contact },
];

interface Props {
  /** Optional override — e.g. when signed in, show "My account" instead of one nav item. */
  navItems?: Nav[];
  /** CTA on the right. Defaults to "Order now". */
  cta?: { label: string; href: string };
  /** "isActive" detection — defaults to exact pathname match. */
  activePath?: string;
}

export default function SiteHeader({
  navItems = PUBLIC_NAV,
  cta = { label: 'Order now', href: siteConfig.routes.menu },
  activePath,
}: Props) {
  const pathname = usePathname();
  const current = activePath ?? pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(241,229,205,0.22)] bg-[--color-walnut] text-[--color-cream]">
      <div className="container flex h-[68px] items-center justify-between gap-6">
        <Link
          href={siteConfig.routes.home}
          className="flex items-center"
          aria-label={`${siteConfig.name} — home`}
        >
          <Image
            src="/logo.png"
            alt={siteConfig.name}
            width={140}
            height={140}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Primary"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === '/' ? current === '/' : current.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'font-serif text-[14px] font-medium tracking-[0.14em] text-[--color-cream] transition-colors hover:text-[--color-bronze] [font-variant:small-caps]',
                  isActive && 'text-[--color-bronze]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href={cta.href}
          className="hidden rounded-[2px] bg-[--color-bronze] px-[18px] py-[10px] font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-[--color-walnut] [font-variant:small-caps] transition-colors hover:bg-[--color-cream] hover:text-[--color-walnut] md:inline-block"
        >
          {cta.label}
        </Link>

        {/* Mobile burger */}
        <button
          className="inline-flex h-8 w-8 items-center justify-center text-[--color-cream] md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            key="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[rgba(241,229,205,0.18)] bg-[--color-walnut] md:hidden"
            aria-label="Primary mobile"
          >
            <div className="container flex flex-col gap-3 py-4">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/' ? current === '/' : current.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'py-2 font-serif text-[16px] font-medium tracking-[0.12em] text-[--color-cream] transition-colors hover:text-[--color-bronze] [font-variant:small-caps]',
                      isActive && 'text-[--color-bronze]'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href={cta.href}
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-[2px] bg-[--color-bronze] px-5 py-3 text-center font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-[--color-walnut] [font-variant:small-caps]"
              >
                {cta.label}
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
