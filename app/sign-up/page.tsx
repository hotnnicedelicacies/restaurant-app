import type { Metadata } from 'next';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import SignUpForm from './SignUpForm';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Create account',
  description: `Create a ${siteConfig.name} account — saved address, order history, one-tap reorder.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.signUp) },
  robots: { index: false, follow: false },
};

interface SearchParams {
  next?: string;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  return (
    <AuthCard
      topLabel="Create your account"
      eyebrow="An account · one-tap reorder"
      title={<>Create an <em>account</em></>}
      sub="Saved address, order history, reorder in a tap. Takes about thirty seconds."
    >
      <SignUpForm next={sp.next} />

      <div className="relative my-7 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-rule" />
        <span className="relative inline-block bg-cream px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          Already have one
        </span>
      </div>
      <p className="m-0 text-center font-serif text-[14px] italic text-ink-muted">
        Sign in to your account —{' '}
        <Link href={siteConfig.routes.signIn} className="link-underline">
          Sign in →
        </Link>
      </p>
    </AuthCard>
  );
}
