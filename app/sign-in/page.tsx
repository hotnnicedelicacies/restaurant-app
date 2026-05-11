import type { Metadata } from 'next';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import SignInForm from './SignInForm';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Sign in',
  description: `Sign in to your ${siteConfig.name} account.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.signIn) },
  robots: { index: false, follow: false },
};

interface SearchParams {
  next?: string;
  error?: string;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  return (
    <AuthCard
      topLabel="Sign in"
      eyebrow="Welcome back"
      title={<>Sign <em>in</em></>}
      sub="Pick up where you left off — your saved address and past orders are waiting."
    >
      {sp.error === 'invalid_link' && (
        <div className="mb-4 rounded-[2px] border border-[rgba(139,42,26,0.3)] bg-[rgba(139,42,26,0.08)] px-4 py-3 font-serif text-[13.5px] italic text-[#8B2A1A]">
          That link is invalid or has expired. Sign in below, or use{' '}
          <Link href={siteConfig.routes.forgotPassword} className="link-underline">
            Forgot password
          </Link>{' '}
          to start over.
        </div>
      )}

      <SignInForm next={sp.next} />

      <div className="relative my-7 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-[--color-border]" />
        <span className="relative inline-block bg-[--color-cream] px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-ink-muted]">
          New here
        </span>
      </div>
      <p className="m-0 text-center font-serif text-[14px] italic text-[--color-ink-muted]">
        No account yet?{' '}
        <Link href={siteConfig.routes.signUp} className="link-underline">
          Create one →
        </Link>
      </p>
    </AuthCard>
  );
}
