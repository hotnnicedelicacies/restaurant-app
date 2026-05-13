import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PageHero from '@/components/layout/PageHero';
import { getServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';
import { formatLongDate } from '@/lib/utils';
import AccountSidebar from '@/components/account/AccountSidebar';
import AddressManager from '@/components/account/AddressManager';
import ProfileForm from '@/components/account/ProfileForm';
import PasswordForm from '@/components/account/PasswordForm';
import CloseAccountCard from '@/components/account/CloseAccountCard';
import OrderHistory, { type OrderHistoryRow } from '@/components/account/OrderHistory';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

// PI status and order data change behind the scenes — never cache.
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(siteConfig.routes.signIn);

  const [{ data: profile }, { data: addressRows }, { data: orderRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, ref, status, payment_status, total_gbp, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const addresses = (addressRows ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    recipientName: a.recipient_name,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    postcode: a.postcode,
    phone: a.phone,
    isDefault: a.is_default,
  }));

  // Aggregate items per order in one round-trip so we can render the
  // "Jollof Rice with Plantain · Plantain Lasagna · Suya × 2" summary line.
  const orderIds = (orderRows ?? []).map((o) => o.id);
  const itemsByOrder: Record<string, string[]> = {};
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id, name, quantity')
      .in('order_id', orderIds);
    for (const it of items ?? []) {
      const arr = itemsByOrder[it.order_id] ?? (itemsByOrder[it.order_id] = []);
      arr.push(it.quantity > 1 ? `${it.name} × ${it.quantity}` : it.name);
    }
  }

  const orders: OrderHistoryRow[] = (orderRows ?? []).map((o) => ({
    ref: o.ref,
    status: o.status,
    paymentStatus: o.payment_status,
    totalGbp: Number(o.total_gbp),
    createdAt: o.created_at,
    itemsLine: (itemsByOrder[o.id] ?? []).join(' · ') || '—',
  }));

  const memberSince = user.created_at ? formatLongDate(user.created_at) : '';
  const [first = '', last = ''] = (profile?.display_name ?? '').split(' ', 2);
  const friendlyFirst = first || 'friend';

  return (
    <>
      <SiteHeader
        navItems={[
          { label: 'Home', href: siteConfig.routes.home },
          { label: 'Menu', href: siteConfig.routes.menu },
          { label: 'About', href: siteConfig.routes.about },
          { label: 'My account', href: siteConfig.routes.account },
        ]}
      />
      <main>
        <PageHero
          eyebrow={`Member since ${memberSince} · Middlesbrough`}
          title={<>Welcome back, <em>{friendlyFirst}.</em></>}
          sub="Your orders, saved addresses, and account settings — all in one place."
        />

        <section className="container py-[clamp(28px,4vw,48px)] pb-[clamp(56px,7vw,96px)]">
          <div className="grid items-start gap-[clamp(28px,4vw,56px)] md:grid-cols-[240px_1fr]">
            <AccountSidebar />

            <div className="flex flex-col gap-[clamp(40px,5vw,64px)]">
              <AccountSection
                id="orders"
                title={<>Your <em>orders</em></>}
                count={`${orders.length} order${orders.length === 1 ? '' : 's'}`}
              >
                <OrderHistory orders={orders} />
              </AccountSection>

              <AccountSection
                id="addresses"
                title={<>Saved <em>addresses</em></>}
                count={`${addresses.length} saved`}
              >
                <AddressManager addresses={addresses} />
              </AccountSection>

              <AccountSection id="profile" title={<>Profile &amp; <em>details</em></>}>
                <ProfileForm
                  initial={{
                    firstName: first,
                    lastName: last,
                    email: user.email ?? '',
                    phone: profile?.phone ?? '',
                    notifyStatusChanges: profile?.notify_status_changes ?? true,
                  }}
                />
              </AccountSection>

              <AccountSection id="password" title={<>Password &amp; <em>security</em></>}>
                <PasswordForm />
              </AccountSection>

              <AccountSection id="close" title={<>Close <em>account</em></>}>
                <CloseAccountCard
                  hasOpenOrders={orders.some((o) =>
                    ['received', 'preparing', 'on_its_way'].includes(o.status)
                  )}
                />
              </AccountSection>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function AccountSection({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: React.ReactNode;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[92px]">
      <header className="mb-6 flex items-baseline justify-between gap-4 border-b border-walnut pb-3.5">
        <h2 className="m-0 font-serif text-[clamp(24px,3.2vw,32px)] font-medium tracking-[-0.005em] text-walnut [&_em]:font-normal [&_em]:italic">
          {title}
        </h2>
        {count && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">
            {count}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}
