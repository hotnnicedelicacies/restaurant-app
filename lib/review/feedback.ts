'use server';

import { after } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/supabase/server';
import { sendEmail, isEmailConfigured } from '@/lib/email/send';
import { getEmailConfig } from '@/lib/data/emailConfig';
import { absoluteUrl } from '@/lib/utils';
import { siteConfig } from '@/constants/siteConfig';
import { logReviewEvent } from './events';
import { parseReviewSource, REVIEW_SOURCE_LABELS, type ReviewSource } from './source';

export interface FeedbackFormValues {
  message: string;
  name: string;
  contact: string;
}

export type FeedbackState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string; values: FeedbackFormValues };

const FAILED = "Couldn't send just now — please try again, or WhatsApp us.";

const schema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Please write a message first.')
    .max(2000, 'Please keep it under 2,000 characters.'),
  name: z.string().trim().max(80, 'Name is too long.'),
  contact: z.string().trim().max(120, 'Contact detail is too long.'),
});

function str(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v : '';
}

/**
 * Private feedback from `/review`. Designed for `useActionState` so the
 * form still works with JavaScript disabled: the returned state is
 * rendered on the re-rendered page.
 *
 * The Supabase insert is the only awaited step. Email, the optional
 * webhook, and the analytics event run in `after()` — the row is safe
 * either way and the person holding their dinner gets an answer fast.
 */
export async function submitFeedback(
  _prev: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const values: FeedbackFormValues = {
    message: str(formData.get('message')),
    name: str(formData.get('name')),
    contact: str(formData.get('contact')),
  };
  const src = parseReviewSource(formData.get('src'));

  // Honeypot — bots fill hidden fields. Pretend success, store nothing.
  if (str(formData.get('website')).trim()) return { status: 'success' };

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return {
      status: 'error',
      error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.',
      values,
    };
  }
  const data = parsed.data;

  let id: string;
  try {
    const supabase = getServiceClient();
    const { data: row, error } = await supabase
      .from('feedback')
      .insert({
        src,
        message: data.message,
        name: data.name || null,
        contact: data.contact || null,
      })
      .select('id')
      .single();
    if (error || !row) {
      console.error('[feedback] insert failed:', error?.message);
      return { status: 'error', error: FAILED, values };
    }
    id = row.id;
  } catch (err) {
    console.error('[feedback] insert threw:', err);
    return { status: 'error', error: FAILED, values };
  }

  const payload: FeedbackPayload = { id, src, ...data };
  after(async () => {
    await Promise.all([
      logReviewEvent('feedback_submit', src),
      notifyKitchen(payload),
      postWebhook(payload),
    ]);
  });

  return { status: 'success' };
}

interface FeedbackPayload extends FeedbackFormValues {
  id: string;
  src: ReviewSource;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Email the kitchen inbox via Resend. Same channel as the contact form. */
async function notifyKitchen(p: FeedbackPayload): Promise<void> {
  try {
    if (!isEmailConfigured()) return;
    const cfg = await getEmailConfig();
    if (!cfg.notificationTo) return;

    const sourceLabel = REVIEW_SOURCE_LABELS[p.src];
    const from = p.name || 'A customer';
    const subject = `Private feedback · ${from}${p.contact ? ` · ${p.contact}` : ''}`;
    const adminUrl = absoluteUrl(siteConfig.routes.admin.feedback);

    const html = `
      <div style="font-family:'Cormorant Garamond','Times New Roman',Georgia,serif;color:#2D1F18;max-width:560px;margin:auto;">
        <p style="font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.18em;color:#7E5530;text-transform:uppercase;">
          Private feedback · via ${escapeHtml(sourceLabel)}
        </p>
        <h1 style="font-size:24px;margin:0 0 14px;">${escapeHtml(from)}</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;"><b>Reach them:</b> ${p.contact ? escapeHtml(p.contact) : '<i>no contact left</i>'}</p>
        <blockquote style="border-left:3px solid #A56F40;margin:0;padding:6px 14px;font-style:italic;font-size:16px;line-height:1.6;color:#4a3a2c;white-space:pre-wrap;">${escapeHtml(p.message)}</blockquote>
        <p style="font-size:13px;margin:18px 0 0;"><a href="${adminUrl}" style="color:#7E5530;">Open in the admin panel →</a></p>
      </div>
    `;
    const text = `Private feedback via ${sourceLabel}\n\nFrom: ${from}${p.contact ? ` · ${p.contact}` : ''}\n\n${p.message}\n\n${adminUrl}`;

    await sendEmail({
      to: cfg.notificationTo,
      subject,
      html,
      text,
      replyTo: looksLikeEmail(p.contact) ? p.contact : undefined,
    });
  } catch (err) {
    console.error('[feedback] kitchen email threw:', err);
  }
}

/** Optional extra channel (n8n / Make / Zapier → Telegram etc.). */
async function postWebhook(p: FeedbackPayload): Promise<void> {
  const url = process.env.FEEDBACK_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: p.id,
        created_at: new Date().toISOString(),
        src: p.src,
        source_label: REVIEW_SOURCE_LABELS[p.src],
        message: p.message,
        name: p.name || null,
        contact: p.contact || null,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('[feedback] webhook responded', res.status);
  } catch (err) {
    console.error('[feedback] webhook failed:', err);
  }
}
