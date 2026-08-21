'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';

type Result = { ok: true } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mark a private-feedback row handled (or reopen it). */
export async function setFeedbackHandled(id: string, handled: boolean): Promise<Result> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return { ok: false, error: 'Invalid feedback id.' };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('feedback')
    .update({ handled, handled_at: handled ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/feedback');
  revalidatePath('/admin', 'layout'); // nav badge count
  return { ok: true };
}
