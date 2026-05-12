'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';

type Result = { ok: true } | { ok: false; error: string };

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  notifyStatusChanges: z.boolean().optional(),
});

export async function updateProfile(input: unknown): Promise<Result> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const displayName = [parsed.data.firstName.trim(), parsed.data.lastName?.trim()]
    .filter(Boolean)
    .join(' ');

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      phone: parsed.data.phone?.trim() || null,
      notify_status_changes: parsed.data.notifyStatusChanges ?? true,
    })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/account');
  return { ok: true };
}

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export async function changePassword(input: unknown): Promise<Result> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Close the customer's account. Anonymises the profile + nukes their saved
 * addresses; order history is preserved (UK tax record-keeping) but the
 * personally identifiable fields on those orders are anonymised too. Then
 * signs the user out.
 */
export async function closeAccount(): Promise<Result> {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const svc = getServiceClient();

  // Anonymise the profile row in place. We can't delete the row because
  // it's referenced by orders.profile_id; keep the FK live and scrub PII.
  await svc
    .from('profiles')
    .update({
      display_name: 'Closed account',
      phone: null,
      marketing_opt_in: false,
      notify_status_changes: false,
    })
    .eq('id', user.id);

  // Anonymise PII on historical orders. The line items + amounts stay
  // for tax records; name / email / phone / address get scrubbed.
  await svc
    .from('orders')
    .update({
      customer_first_name: 'Closed',
      customer_last_name: 'account',
      customer_email: 'closed@hotnnicedelicacies.com',
      customer_phone: '',
      delivery_line1: '—',
      delivery_line2: null,
    })
    .eq('profile_id', user.id);

  // Hard-delete addresses (no FK dependency).
  await svc.from('addresses').delete().eq('profile_id', user.id);

  // Delete the auth user — fully revokes any sessions.
  await svc.auth.admin.deleteUser(user.id);

  // Clear the local session cookie + redirect.
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(siteConfig.routes.home);
}

/**
 * After sign-in / sign-up, opportunistically link any orders placed
 * with this email but no profile_id (guest checkout) to this account.
 * Quietly succeeds; failure here shouldn't break the auth flow.
 */
export async function claimOrdersByEmail(email: string, userId: string): Promise<void> {
  try {
    const svc = getServiceClient();
    await svc
      .from('orders')
      .update({ profile_id: userId })
      .ilike('customer_email', email)
      .is('profile_id', null);
  } catch (err) {
    console.error('[claimOrdersByEmail]', err);
  }
}

/**
 * Claim a single order by ref — used by /confirmation/[ref] and /track/[ref]
 * when a guest signs in / signs up after placing an order. Only succeeds if
 * the order is currently unclaimed and the email on the order matches the
 * signed-in user's email.
 */
export async function claimOrder(ref: string): Promise<Result> {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: 'You must be signed in.' };

  const svc = getServiceClient();
  const { data: order } = await svc
    .from('orders')
    .select('id, profile_id, customer_email')
    .eq('ref', ref)
    .maybeSingle();

  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.profile_id) return { ok: false, error: 'This order is already linked to an account.' };
  if (order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: 'This order was placed with a different email.' };
  }

  const { error } = await svc
    .from('orders')
    .update({ profile_id: user.id })
    .eq('id', order.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/account');
  revalidatePath(`/confirmation/${ref}`);
  revalidatePath(`/track/${ref}`);
  return { ok: true };
}
