/**
 * Transactional email configuration — Resend "from" / reply-to / signature
 * the owner edits at `/admin/settings/advanced`. The actual send routine
 * in `lib/email/send.ts` reads these so changes take effect without
 * redeploying.
 *
 * Falls back to the safest deploy-time defaults when the admin hasn't
 * configured anything yet, so the kitchen can still receive order alerts
 * on a fresh install.
 */

import { unstable_cache } from 'next/cache';
import { getPublicClient } from '@/lib/supabase/public';

export const EMAIL_CONFIG_TAG = 'email_config';

export interface EmailConfigView {
  /** Display name used before the from-address — e.g. "Hot N Nice Delicacies". */
  fromName: string;
  /** Bare from-address (no display name) — e.g. "orders@hotnnicedelicacies.com". */
  fromAddress: string;
  /** Resend "from" header in the `"Name" <addr>` shape, ready to pass to the SDK. */
  fromHeader: string;
  /** Reply-to address shown to customers when they hit "Reply" on an order email. */
  replyTo: string;
  /** Optional signature appended at the foot of customer-facing emails. */
  signature: string | null;
  /** Where new-order alerts go — falls back to `fromAddress` if no env override is set. */
  notificationTo: string;
}

function buildFromHeader(name: string, addr: string): string {
  // Bare addresses are technically valid but Resend renders nicer with a
  // display name. Quote the name to defend against commas/periods.
  return name.trim() ? `${name.trim()} <${addr.trim()}>` : addr.trim();
}

async function _getEmailConfig(): Promise<EmailConfigView> {
  // Hardcoded deploy-time defaults — kept inside the fetcher so the
  // siteConfig file can stay free of business email values.
  const fallbackName = 'Hot N Nice Delicacies';
  const fallbackAddr = 'orders@hotnnicedelicacies.com';
  const fallbackReply = 'hotnnicedelicacies@gmail.com';
  const envFrom = process.env.ORDER_FROM_EMAIL?.trim();
  const envNotify = process.env.ORDER_NOTIFICATION_EMAIL?.trim();

  try {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['email_from_name', 'email_from', 'email_reply_to', 'email_signature']);
    const byKey = new Map((data ?? []).map((r) => [r.key, r.value]));
    const name = (byKey.get('email_from_name') as string | undefined)?.trim() || fallbackName;
    // Admin can paste a raw address. If they paste a `"Name" <addr>` header by mistake,
    // strip back to just the address — buildFromHeader composes the name half.
    const rawFrom = (byKey.get('email_from') as string | undefined)?.trim() || '';
    const addrMatch = rawFrom.match(/<([^>]+)>/);
    const fromAddress = (addrMatch ? addrMatch[1] : rawFrom) || envFrom || fallbackAddr;
    const replyTo = (byKey.get('email_reply_to') as string | undefined)?.trim() || fallbackReply;
    const sigRaw = byKey.get('email_signature');
    const signature = typeof sigRaw === 'string' && sigRaw.trim() ? sigRaw : null;
    return {
      fromName: name,
      fromAddress,
      fromHeader: buildFromHeader(name, fromAddress),
      replyTo,
      signature,
      notificationTo: envNotify || fromAddress,
    };
  } catch (err) {
    console.error('[emailConfig] threw:', err);
    return {
      fromName: fallbackName,
      fromAddress: envFrom || fallbackAddr,
      fromHeader: buildFromHeader(fallbackName, envFrom || fallbackAddr),
      replyTo: fallbackReply,
      signature: null,
      notificationTo: envNotify || envFrom || fallbackAddr,
    };
  }
}

export const getEmailConfig = unstable_cache(_getEmailConfig, ['settings:email_config'], {
  revalidate: 60,
  tags: [EMAIL_CONFIG_TAG],
});
