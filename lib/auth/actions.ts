'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/utils';
import { siteConfig } from '@/constants/siteConfig';
import { claimOrdersByEmail } from '@/lib/account/profile';
import { sendEmail } from '@/lib/email/send';
import { welcomeEmail } from '@/lib/email/templates';
import { getHours } from '@/lib/data/hours';
import { getContact } from '@/lib/data/contact';

type ActionResult = { ok: true } | { ok: false; error: string };

/** Sign up via email + password. Auto-creates a profile row. */
export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? siteConfig.routes.account);

  if (!name || !email || password.length < 8) {
    return { ok: false, error: 'Please fill in all fields. Password must be at least 8 characters.' };
  }

  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
      data: { display_name: name },
    },
  });
  if (error) return { ok: false, error: error.message };

  // Best-effort: send our own welcome email + back-link any guest orders
  // placed earlier with this email. Both swallow errors so they never
  // block the auth flow.
  if (data.user) {
    await claimOrdersByEmail(email, data.user.id);
    try {
      const [hours, contact] = await Promise.all([getHours(), getContact()]);
      const welcome = welcomeEmail(name, hours.cutoffShort, {
        contactEmail: contact.email,
        contactWhatsapp: contact.whatsapp,
      });
      await sendEmail({
        to: email,
        subject: welcome.subject,
        html: welcome.html,
        text: welcome.text,
      });
    } catch (e) {
      console.error('[signUpAction] welcome email failed:', e);
    }
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

/** Sign in via email + password. */
export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? siteConfig.routes.account);

  if (!email || !password) {
    return { ok: false, error: 'Please enter your email and password.' };
  }

  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  // Back-link any guest orders placed with this email. Quiet on failure.
  if (data.user) await claimOrdersByEmail(email, data.user.id);

  revalidatePath('/', 'layout');

  // If the form posted a specific `next` target (e.g. /admin/orders from
  // the admin sign-in form), honour it. Otherwise route admins to the
  // admin panel and everyone else to /account.
  const formProvidedNext = formData.get('next');
  if (formProvidedNext) redirect(next);

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();
    if (profile?.is_admin) redirect(siteConfig.routes.admin.orders);
  }
  redirect(siteConfig.routes.account);
}

/** Sign out — used by the account dashboard. */
export async function signOutAction() {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(siteConfig.routes.home);
}

/** Request a password reset email. */
export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { ok: false, error: 'Please enter your email.' };

  const supabase = await getServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl('/auth/reset-password'),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Apply a new password after clicking the reset link. */
export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  const supabase = await getServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  redirect(siteConfig.routes.account);
}
