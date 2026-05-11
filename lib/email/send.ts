import { Resend } from 'resend';
import { siteConfig } from '@/constants/siteConfig';

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
  /** Reply-to address (defaults to siteConfig). */
  replyTo?: string;
}

/**
 * Send an email via Resend. Swallows errors and logs; do NOT block order
 * creation on email delivery — webhook will retry.
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs) {
  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: process.env.ORDER_FROM_EMAIL || siteConfig.email.fromDefault,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo: replyTo || siteConfig.email.replyTo,
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
