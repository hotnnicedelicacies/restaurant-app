import Link from 'next/link';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';
import { formatLongDate, formatTime } from '@/lib/utils';
import AdvancedSettingsForm from './AdvancedSettingsForm';
import { getDatasetSummaries } from '@/lib/admin/dataExport';

interface AdvancedBlob {
  email_from_name?: string;
  email_from?: string;
  email_reply_to?: string;
  email_signature?: string;
}

export default async function AdminAdvancedSettingsPage() {
  const supabase = getServerClient();
  const [{ data: { user } }, summaries] = await Promise.all([
    (await supabase).auth.getUser(),
    getDatasetSummaries(),
  ]);
  const svc = getServiceClient();
  const { data: settingsRows } = await svc.from('settings').select('key, value');
  const map = new Map((settingsRows ?? []).map((r) => [r.key, r.value]));

  const initial: AdvancedBlob = {
    email_from_name:
      (map.get('email_from_name') as string | undefined) ?? siteConfig.name,
    email_from:
      (map.get('email_from') as string | undefined) ??
      siteConfig.email.fromDefault.replace(/^.*<(.+)>.*$/, '$1'),
    email_reply_to:
      (map.get('email_reply_to') as string | undefined) ?? siteConfig.email.replyTo,
    email_signature:
      (map.get('email_signature') as string | undefined) ??
      [
        `${siteConfig.name} · ${siteConfig.tagline}`,
        `${siteConfig.contact.phone} · ${siteConfig.contact.email}`,
        siteConfig.delivery.areas.join(' · '),
      ].join('\n'),
  };

  const { data: profile } = user
    ? await svc.from('profiles').select('display_name').eq('id', user.id).single()
    : { data: null };

  return (
    <>
      <Link href="/admin/settings" className="admin-detail__back">
        ← Back to settings
      </Link>

      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">Settings · Advanced &amp; security</div>
          <h1 className="admin-page-head__title">
            Advanced &amp; <em>security</em>
          </h1>
        </div>
      </div>

      <div className="warning-banner">
        <svg
          className="warning-banner__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="warning-banner__content">
          <h3 className="warning-banner__title">Sensitive area</h3>
          <p className="warning-banner__body">
            Changes here affect site security, email delivery, and account access. Stripe API keys are configured in your hosting provider&apos;s environment variables — they are not editable from the admin panel by design.{' '}
            <em>If you&apos;re not sure, don&apos;t change it.</em>
          </p>
        </div>
      </div>

      <AdvancedSettingsForm
        initial={initial}
        adminName={profile?.display_name ?? user?.email ?? 'Admin'}
        adminEmail={user?.email ?? ''}
        datasets={summaries.map((s) => ({
          ...s,
          lastUpdatedDisplay: s.lastUpdated
            ? `${formatLongDate(s.lastUpdated)} · ${formatTime(s.lastUpdated)}`
            : '—',
        }))}
      />
    </>
  );
}
