import { Resend } from 'resend';
import { getEmailConfig } from '@/lib/data/emailConfig';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  /** Optional plain-text fallback. */
  text?: string;
  /** Override the admin-configured reply-to for this one send (e.g. contact-form replies). */
  replyTo?: string;
}

/**
 * Send an email via Resend. Reads the from-address, name, and reply-to
 * from admin's `/admin/settings/advanced` — never from siteConfig — so
 * the owner can edit them at runtime without redeploying.
 *
 * Swallows errors and logs; do NOT block order creation on email
 * delivery — webhook will retry.
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs) {
  try {
    const [resend, cfg] = await Promise.all([
      Promise.resolve(getResend()),
      getEmailConfig(),
    ]);
    const result = await resend.emails.send({
      from: cfg.fromHeader,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo: replyTo || cfg.replyTo,
    });
    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'send failed';
    console.error('[email] send error:', msg);
    return { ok: false, error: msg };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
