/**
 * Customer-facing contact details — the kitchen phone, WhatsApp number,
 * and customer email shown in the footer, contact page, and on
 * "Outside delivery area" prompts. Admin-editable in
 * `/admin/settings#contact`.
 *
 * Falls back to deploy-time defaults so a fresh install still shows
 * working contact info before the owner has configured anything.
 */

import { unstable_cache } from 'next/cache';
import { getPublicClient } from '@/lib/supabase/public';

export const CONTACT_TAG = 'contact';

export interface ContactView {
  /** Customer-facing inbox. */
  email: string;
  /** International-format phone with the leading `+`. */
  phone: string;
  /** Bare WhatsApp number for wa.me links (no `+`, no spaces). */
  whatsapp: string;
  /** Human-readable phone for display in headers/footers. */
  whatsappDisplay: string;
}

function digits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

async function _getContact(): Promise<ContactView> {
  // Deploy-time defaults — kept inside the fetcher so siteConfig.ts
  // doesn't double as a "real value" file. Only used when the admin
  // hasn't set the equivalent fields yet.
  const fallbackEmail = 'hotnnicedelicacies@gmail.com';
  const fallbackPhone = '+44 7776 320068';

  try {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['contact_email', 'contact_phone']);
    const byKey = new Map((data ?? []).map((r) => [r.key, r.value]));
    const email = (byKey.get('contact_email') as string | undefined)?.trim() || fallbackEmail;
    const phone = (byKey.get('contact_phone') as string | undefined)?.trim() || fallbackPhone;
    const wa = digits(phone);
    return {
      email,
      phone,
      whatsapp: wa,
      whatsappDisplay: phone,
    };
  } catch (err) {
    console.error('[contact] threw:', err);
    const wa = digits(fallbackPhone);
    return {
      email: fallbackEmail,
      phone: fallbackPhone,
      whatsapp: wa,
      whatsappDisplay: fallbackPhone,
    };
  }
}

export const getContact = unstable_cache(_getContact, ['settings:contact'], {
  revalidate: 60,
  tags: [CONTACT_TAG],
});
