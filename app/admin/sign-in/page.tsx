import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';
import AdminSignInForm from './AdminSignInForm';

export const metadata: Metadata = {
  title: 'Admin sign-in',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function AdminSignInPage({ searchParams }: Props) {
  const sp = await searchParams;

  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (profile?.is_admin) {
      redirect(sp.next ?? '/admin/orders');
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-cream-soft px-6 py-12">
      <div className="w-full max-w-[440px] rounded-[2px] border border-rule bg-cream p-[clamp(28px,5vw,44px)]">
        <header className="mb-6 text-center">
          <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
            {siteConfig.shortName} · Admin
          </p>
          <h1 className="m-0 font-serif text-[clamp(26px,3.6vw,32px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut">
            Kitchen <em className="italic font-normal text-bronze-deep">command.</em>
          </h1>
          <p className="m-0 mt-2 font-serif text-[13.5px] italic leading-[1.5] text-ink-muted">
            Sign in to manage today's orders, menu, and settings.
          </p>
        </header>

        {sp.error === 'not_admin' && (
          <div className="mb-4 rounded-[2px] border border-danger/40 bg-danger/5 px-4 py-3 font-serif text-[13.5px] italic text-danger">
            That account is signed in but isn't an admin. Sign in with the kitchen account, or message Seyi if you need access.
          </div>
        )}

        <AdminSignInForm next={sp.next} />

        <p className="mt-6 text-center font-serif text-[12px] italic text-ink-muted">
          Looking for your account?{' '}
          <a href={siteConfig.routes.signIn} className="link-underline">
            Customer sign in
          </a>
        </p>
      </div>
    </div>
  );
}
