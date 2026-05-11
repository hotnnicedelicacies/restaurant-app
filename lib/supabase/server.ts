import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Server-side Supabase client. Uses the anon key + the user's session cookie
 * so RLS policies still apply. Call inside Server Components, route handlers,
 * and server actions.
 *
 * For privileged operations that need to bypass RLS (e.g. creating an order
 * with profile_id while signed-in via a different mechanism, sending kitchen
 * notes etc.) use `getServiceClient()` below.
 */
export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies are read-only there.
            // The middleware refreshes them, so this is safe to ignore.
          }
        },
      },
    }
  );
}

/**
 * Service-role Supabase client. Bypasses RLS — never expose to the browser.
 * Use only for trusted server-side operations: sending kitchen notes,
 * processing Stripe webhooks, generating order refs, etc.
 */
import { createClient } from '@supabase/supabase-js';

export function getServiceClient() {
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is not set. Cannot create service client.');
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
