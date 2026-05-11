import type { Metadata } from 'next';
import AuthCard from '@/components/auth/AuthCard';
import ResetPasswordForm from './ResetPasswordForm';
import { siteConfig } from '@/constants/siteConfig';

export const metadata: Metadata = {
  title: 'Set a new password',
  robots: { index: false, follow: false },
};

/**
 * Reached via the password-reset email link. Supabase auto-signs the user
 * in (recovery flow) before they land here; we just collect the new password.
 */
export default function ResetPasswordPage() {
  return (
    <AuthCard
      topLabel="Set new password"
      eyebrow="Almost done"
      title={<>Set a new <em>password</em></>}
      sub={`At least 8 characters. You'll be signed in to your ${siteConfig.name} account once you save.`}
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
