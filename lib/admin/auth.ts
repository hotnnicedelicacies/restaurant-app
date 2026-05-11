import { redirect } from 'next/navigation';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';

/**
 * Used inside server actions and admin route handlers to enforce that the
 * caller is an admin. Returns the user record on success; redirects on fail.
 * The middleware already gates routes, but server actions need their own
 * defense in depth since they can be invoked from anywhere.
 */
export async function requireAdmin() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/sign-in');

  // Use service client to bypass RLS for the is_admin check
  const svc = getServiceClient();
  const { data: profile } = await svc
    .from('profiles')
    .select('is_admin, display_name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/admin/sign-in?error=not_admin');
  return { id: user.id, email: user.email ?? '', displayName: profile.display_name ?? user.email ?? 'Admin' };
}
