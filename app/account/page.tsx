import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PageHero from '@/components/layout/PageHero';
import HeritageButton from '@/components/ui/HeritageButton';
import { getServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';
import { formatLongDate } from '@/lib/utils';
import { signOutAction } from '@/lib/auth/actions';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(siteConfig.routes.signIn);

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const memberSince = user.created_at ? formatLongDate(user.created_at) : '';

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
          title={<>Welcome back, <em>{profile?.display_name?.split(' ')[0] ?? 'friend'}.</em></>}
          sub="Your orders, saved addresses, and profile — all in one place."
        />

        <section className="container py-[clamp(28px,4vw,48px)] pb-[clamp(56px,7vw,96px)]">
          <div className="grid items-start gap-[clamp(28px,4vw,56px)] md:grid-cols-[240px_1fr]">
            {/* SIDEBAR */}
            <aside className="sticky top-[92px] flex flex-col gap-1">
              <p className="m-0 mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
                My account
              </p>
              <Link
                href="#orders"
                className="border-l-2 border-bronze bg-cream-soft px-3.5 py-2.5 font-serif text-[15px] font-medium text-walnut"
              >
                Orders
              </Link>
              <Link
                href="#addresses"
                className="border-l-2 border-transparent px-3.5 py-2.5 font-serif text-[15px] font-medium text-ink-muted transition-colors hover:bg-cream-soft hover:text-walnut"
              >
                Saved addresses
              </Link>
              <Link
                href="#profile"
                className="border-l-2 border-transparent px-3.5 py-2.5 font-serif text-[15px] font-medium text-ink-muted transition-colors hover:bg-cream-soft hover:text-walnut"
              >
                Profile &amp; password
              </Link>
              <form action={signOutAction} className="mt-3 border-t border-rule pt-4">
                <button
                  type="submit"
                  className="px-3.5 font-serif text-[14px] italic text-ink-muted transition-colors hover:text-[#8B2A1A]"
                >
                  Sign out
                </button>
              </form>
            </aside>

            {/* MAIN */}
            <div className="flex flex-col gap-[clamp(40px,5vw,64px)]">
              <AccountSection id="orders" title={<>Your <em>orders</em></>} count="0 orders">
                <EmptyState
                  eyebrow="No orders yet"
                  title={<>You haven't ordered <em>yet</em>.</>}
                  body="Browse today's bill of fare — order by 10am for same-day delivery."
                  cta={{ label: "See today's menu", href: siteConfig.routes.menu }}
                />
              </AccountSection>

              <AccountSection id="addresses" title={<>Saved <em>addresses</em></>} count="0 saved">
                <EmptyState
                  eyebrow="No saved addresses"
                  title={<>Save your <em>first address</em> at checkout.</>}
                  body="On your first order we'll offer to save the delivery address so reorders are one tap."
                  cta={{ label: 'Add an address now', href: '#profile' }}
                />
              </AccountSection>

              <AccountSection id="profile" title={<>Profile &amp; <em>password</em></>}>
                <ProfileForm profile={profile} email={user.email ?? ''} />
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

function EmptyState({
  eyebrow,
  title,
  body,
  cta,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="mx-auto max-w-[480px] py-[clamp(48px,8vw,96px)] text-center">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
        {eyebrow}
      </p>
      <h3 className="m-0 mb-3 font-serif text-[clamp(26px,3.4vw,36px)] font-medium tracking-[-0.005em] text-walnut [&_em]:font-normal [&_em]:italic">
        {title}
      </h3>
      <p className="m-0 mb-7 font-serif text-[16px] italic leading-[1.5] text-ink-muted">
        {body}
      </p>
      <HeritageButton href={cta.href} variant="primary">
        {cta.label}
      </HeritageButton>
    </div>
  );
}

function ProfileForm({
  profile,
  email,
}: {
  profile: { display_name: string | null; phone: string | null; notify_status_changes: boolean } | null;
  email: string;
}) {
  const [first = '', last = ''] = (profile?.display_name ?? '').split(' ', 2);
  return (
    <div className="rounded-[2px] border border-rule bg-cream p-6 sm:p-8">
      <header className="mb-5 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
        <h3 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
          Your <em>details</em>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">№ 01</span>
      </header>

      {/* TODO Phase 3: wire this form to a server action that updates `profiles` */}
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProfileField label="First name" defaultValue={first} name="first" />
        <ProfileField label="Last name" defaultValue={last} name="last" />
        <ProfileField label="Email" defaultValue={email} name="email" type="email" disabled />
        <ProfileField label="Phone" defaultValue={profile?.phone ?? ''} name="phone" type="tel" />
        <label className="col-span-full flex cursor-pointer items-start gap-2.5 font-serif text-[14px] italic leading-[1.5] text-ink-muted">
          <input
            type="checkbox"
            name="notify_status_changes"
            defaultChecked={profile?.notify_status_changes ?? true}
            className="mt-0.5 h-[18px] w-[18px] accent-walnut"
          />
          <span>Email me when my orders change status (out for delivery, delivered, etc.)</span>
        </label>
        <button
          type="submit"
          disabled
          className="mt-3 w-fit min-w-[200px] cursor-not-allowed rounded-[2px] bg-walnut px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] opacity-60 sm:col-span-2"
          title="Saving profiles will be wired in Phase 3"
        >
          Save profile
        </button>
      </form>
    </div>
  );
}

function ProfileField({
  label,
  name,
  type = 'text',
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut disabled:opacity-60"
      />
    </div>
  );
}
