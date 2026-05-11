import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware: refreshes the Supabase session cookie on every request and
 * gates protected routes.
 *
 * Route classes:
 *   /admin/*   → must be signed in AND `profiles.is_admin = true`
 *   /account/* → must be signed in
 *   /sign-in, /sign-up → redirect to /account if already signed in
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Skip if envs aren't configured yet (dev before Supabase is provisioned).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refreshes the session if it's near expiry
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Already signed-in users shouldn't see sign-in / sign-up
  if (user && (path === '/sign-in' || path === '/sign-up')) {
    const url = request.nextUrl.clone();
    url.pathname = '/account';
    return NextResponse.redirect(url);
  }

  // Account routes require sign-in
  if (path.startsWith('/account') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Admin routes require sign-in + is_admin
  if (path.startsWith('/admin') && path !== '/admin/sign-in') {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/sign-in';
      return NextResponse.redirect(url);
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/sign-in';
      url.searchParams.set('error', 'not_admin');
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files, API, Next internals
    '/((?!_next/static|_next/image|favicon.ico|logo.png|icon.svg|apple-icon|manifest|robots|sitemap|.*\\..*).*)',
  ],
};
