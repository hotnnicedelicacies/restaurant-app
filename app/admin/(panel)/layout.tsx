import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';
import { getHours } from '@/lib/data/hours';
import AdminNavLink from './AdminNavLink';
import AdminSignOut from './AdminSignOut';

export const metadata: Metadata = {
  title: { default: 'Admin · Hot N Nice', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/zones', label: 'Delivery zones' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/settings', label: 'Settings' },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/sign-in');

  // Profile data + a derived "kitchen open" state from the configured
  // trading hours. The pill is a notification, not a control — admin
  // pauses the store via /admin/settings (store_open flag).
  const svc = getServiceClient();
  const [{ data: profile }, { data: storeOpenRow }, { data: liveOrders }, hours] = await Promise.all([
    svc.from('profiles').select('display_name').eq('id', user.id).single(),
    svc.from('settings').select('value').eq('key', 'store_open').maybeSingle(),
    svc
      .from('orders')
      .select('status')
      .in('status', ['received', 'preparing', 'on_its_way']),
    getHours(),
  ]);

  const displayName = profile?.display_name ?? user.email ?? 'Admin';
  const liveCount = (liveOrders ?? []).length;

  // Compute whether the kitchen is currently within trading hours.
  // (The store_open setting is a hard manual override on top.)
  const now = new Date();
  const today = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);
  const openMin = openH * 60 + (openM || 0);
  const closeMin = closeH * 60 + (closeM || 0);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isTradingDay = hours.days.includes(today as (typeof hours.days)[number]);
  const isWithinHours = isTradingDay && nowMin >= openMin && nowMin < closeMin;
  const storeOpenOverride = (storeOpenRow?.value as boolean | undefined) ?? true;
  const kitchenOpen = isWithinHours && storeOpenOverride;
  const kitchenLabel = !storeOpenOverride
    ? 'Kitchen paused · /settings'
    : !isTradingDay
      ? `Closed today · opens ${hours.daysShort.split('–')[0].trim()}`
      : !isWithinHours
        ? nowMin < openMin
          ? `Opens at ${hours.open}`
          : `Closed for the night · ${hours.timeShort}`
        : 'Kitchen open · accepting orders';

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="container">
          <div className="admin-header__row">
            <Link href="/admin" className="admin-header__brand">
              <Image src="/logo.png" alt={siteConfig.name} width={36} height={36} />
              <div className="admin-header__brand-text">
                <span className="admin-header__brand-name">{siteConfig.shortName}</span>
                <span className="admin-header__brand-badge">Kitchen control · Admin</span>
              </div>
            </Link>

            <div className="admin-header__center">
              <span
                className={`kitchen-status ${kitchenOpen ? '' : 'kitchen-status--closed'}`}
                aria-label={kitchenLabel}
                style={{ cursor: 'default' }}
              >
                <span className="kitchen-status__dot" />
                <span>{kitchenLabel}</span>
              </span>
            </div>

            <div className="admin-header__right">
              <span className="admin-header__user">{displayName}</span>
              <AdminSignOut />
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="container">
            <div className="admin-nav__inner">
              {NAV.map((n) => (
                <AdminNavLink
                  key={n.href}
                  href={n.href}
                  count={n.href === '/admin/orders' && liveCount > 0 ? liveCount : undefined}
                >
                  {n.label}
                </AdminNavLink>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="admin-content">
        <div className="container">{children}</div>
      </main>

      <footer
        style={{
          background: 'var(--color-walnut)',
          color: 'rgba(241, 229, 205, 0.55)',
          padding: '16px 0',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        <div className="container">
          {siteConfig.shortName} Admin · v1.0 · Signed in as{' '}
          <b style={{ color: 'rgba(241, 229, 205, 0.85)', fontWeight: 500 }}>{displayName}</b> ·{' '}
          <a
            href="/"
            style={{
              color: 'rgba(241, 229, 205, 0.7)',
              borderBottom: '1px solid rgba(241, 229, 205, 0.25)',
              paddingBottom: 1,
            }}
          >
            View customer site →
          </a>
        </div>
      </footer>
    </div>
  );
}
