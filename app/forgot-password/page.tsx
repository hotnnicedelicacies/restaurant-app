import type { Metadata } from 'next';
import Link from 'next/link';
import AuthCard from '@/components/auth/AuthCard';
import ForgotPasswordForm from './ForgotPasswordForm';
import { siteConfig } from '@/constants/siteConfig';
import { absoluteUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Reset password',
  description: `Reset your ${siteConfig.name} account password.`,
  alternates: { canonical: absoluteUrl(siteConfig.routes.forgotPassword) },
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      topLabel="Reset password"
      eyebrow="Forgot your password"
      title={<>Reset your <em>password</em></>}
      sub="Enter the email you signed up with — we'll send you a link to set a new password."
    >
      <ForgotPasswordForm />

      <div className="mt-7 border-t border-[--color-border] pt-5 text-center">
        <Link
          href={siteConfig.routes.signIn}
          className="pb-px font-serif text-[13.5px] italic text-[--color-ink-muted] border-b border-[--color-border]"
        >
          ← Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
