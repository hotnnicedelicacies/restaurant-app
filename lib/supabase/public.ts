import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Cookie-less Supabase client for reading public data (menu, zones, etc.)
 * inside cached server fetchers.
 *
 * Why a separate client? `getServerClient()` reads/writes cookies for auth
 * — that ties it to a request scope, which collides with `unstable_cache`
 * (which expects pure-ish input → output). The publishable anon key is
 * enough for public reads governed by RLS.
 */
let _client: SupabaseClient<Database> | null = null;

export function getPublicClient(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase env not set. NEXT_PUBLIC_SUPABASE_URL + ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or _ANON_KEY) are required.'
    );
  }
  _client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
