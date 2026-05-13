'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/email/send';
import { getEmailConfig } from '@/lib/data/emailConfig';

const schema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('A valid email is required.'),
  phone: z.string().optional(),
  topic: z.string().min(1, 'Pick a topic.'),
  message: z.string().min(5, 'Message is too short.'),
  // Honeypot — bots fill hidden fields. If non-empty, reject silently as success.
  website: z.string().optional(),
});

export type ContactSubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Submit the public contact form. Emails the kitchen inbox via Resend.
 * The customer is set as Reply-To so admin can hit reply directly.
 */
export async function submitContact(input: unknown): Promise<ContactSubmitResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid submission.' };
  }
  const data = parsed.data;
  // Honeypot: pretend success without sending
  if (data.website && data.website.trim()) return { ok: true };

  const cfg = await getEmailConfig();
  const to = cfg.notificationTo;
  if (!to) return { ok: false, error: 'Contact inbox not configured.' };

  const subject = `Contact form · ${data.topic} · ${data.name}`;
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `
    <div style="font-family:'Cormorant Garamond','Times New Roman',Georgia,serif;color:#2D1F18;max-width:560px;margin:auto;">
      <p style="font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.18em;color:#7E5530;text-transform:uppercase;">
        New contact form submission
      </p>
      <h1 style="font-size:24px;margin:0 0 14px;">${escape(data.topic)}</h1>
      <p style="font-size:15px;line-height:1.55;margin:0 0 16px;"><b>From:</b> ${escape(data.name)} &lt;${escape(data.email)}&gt;${data.phone ? ` · ${escape(data.phone)}` : ''}</p>
      <blockquote style="border-left:3px solid #A56F40;margin:0;padding:6px 14px;font-style:italic;font-size:16px;line-height:1.6;color:#4a3a2c;white-space:pre-wrap;">${escape(data.message)}</blockquote>
    </div>
  `;
  const text = `${data.topic}\n\nFrom: ${data.name} <${data.email}>${data.phone ? ` · ${data.phone}` : ''}\n\n${data.message}`;

  await sendEmail({ to, subject, html, text, replyTo: data.email });
  return { ok: true };
}
