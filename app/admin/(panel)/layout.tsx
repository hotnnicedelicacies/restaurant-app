import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';
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

  // Profile data — display name + store-open status for the kitchen pill
  const svc = getServiceClient();
  const [{ data: profile }, { data: storeOpenRow }, { data: liveOrders }] = await Promise.all([
    svc.from('profiles').select('display_name').eq('id', user.id).single(),
    svc.from('settings').select('value').eq('key', 'store_open').maybeSingle(),
    svc
      .from('orders')
      .select('status', { count: 'exact', head: false })
      .in('status', ['received', 'preparing', 'on_its_way']),
  ]);
  const storeOpen = (storeOpenRow?.value as boolean | undefined) ?? true;
  const displayName = profile?.display_name ?? user.email ?? 'Admin';

  // Map { received: n, ... } so the nav can show a live order count
  const liveCount = (liveOrders ?? []).length;

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
                className={`kitchen-status ${storeOpen ? '' : 'kitchen-status--closed'}`}
                aria-label={storeOpen ? 'Kitchen open · accepting orders' : 'Kitchen closed'}
              >
                <span className="kitchen-status__dot" />
                <span>
                  {storeOpen ? 'Kitchen open · accepting orders' : 'Kitchen closed'}
                </span>
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
