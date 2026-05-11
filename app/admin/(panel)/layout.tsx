import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';
import AdminSignOut from './AdminSignOut';

export const metadata: Metadata = {
  title: { default: 'Admin · Hot N Nice', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/zones', label: 'Zones' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/settings', label: 'Settings' },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/sign-in');

  return (
    <div className="min-h-screen bg-cream-soft text-walnut">
      <header className="sticky top-0 z-30 border-b border-rule bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-3.5">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex flex-col leading-tight">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-bronze-deep">Admin</span>
              <span className="font-serif text-[18px] font-medium text-walnut">{siteConfig.shortName}</span>
            </Link>
            <nav className="hidden gap-1 md:flex">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-[2px] px-3 py-2 font-serif text-[13.5px] font-medium tracking-[0.06em] text-walnut transition-colors hover:bg-cream-soft hover:text-bronze-deep"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-serif text-[12.5px] italic text-ink-muted sm:inline">
              {user.email}
            </span>
            <Link
              href="/"
              className="hidden font-serif text-[12px] uppercase tracking-[0.16em] text-walnut hover:text-bronze-deep sm:inline-block [font-variant:small-caps]"
            >
              View site →
            </Link>
            <AdminSignOut />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-rule bg-cream-soft px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-[2px] px-3 py-1.5 font-serif text-[13px] text-walnut hover:bg-cream"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">{children}</main>
    </div>
  );
}
