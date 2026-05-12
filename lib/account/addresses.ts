'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/lib/supabase/server';

const addressSchema = z.object({
  label: z.string().optional(),
  recipientName: z.string().min(1, 'Recipient name is required.'),
  line1: z.string().min(1, 'Street address is required.'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required.'),
  postcode: z.string().min(2, 'Postcode is required.'),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type AddAddressResult = { ok: true; id: string } | { ok: false; error: string };

export async function addAddress(input: unknown): Promise<AddAddressResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid address.' };
  }
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  // If marking default, unset any existing default first.
  if (parsed.data.isDefault) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('profile_id', user.id);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      profile_id: user.id,
      label: parsed.data.label?.trim() || null,
      recipient_name: parsed.data.recipientName.trim(),
      line1: parsed.data.line1.trim(),
      line2: parsed.data.line2?.trim() || null,
      city: parsed.data.city.trim(),
      postcode: parsed.data.postcode.trim().toUpperCase(),
      phone: parsed.data.phone?.trim() || null,
      is_default: parsed.data.isDefault ?? false,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/account');
  return { ok: true, id: data.id };
}

export async function deleteAddress(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const { error } = await supabase.from('addresses').delete().eq('id', id).eq('profile_id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/account');
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  // Unset existing default, then set the chosen one.
  await supabase.from('addresses').update({ is_default: false }).eq('profile_id', user.id);
  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('profile_id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/account');
  return { ok: true };
}

export async function updateAddress(input: unknown & { id: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid address.' };
  }
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You must be signed in.' };

  const { error } = await supabase
    .from('addresses')
    .update({
      label: parsed.data.label?.trim() || null,
      recipient_name: parsed.data.recipientName.trim(),
      line1: parsed.data.line1.trim(),
      line2: parsed.data.line2?.trim() || null,
      city: parsed.data.city.trim(),
      postcode: parsed.data.postcode.trim().toUpperCase(),
      phone: parsed.data.phone?.trim() || null,
    })
    .eq('id', input.id)
    .eq('profile_id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/account');
  return { ok: true };
}
