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
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return response;

  const supabase = createServerClient(url, publishableKey, {
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

  // Resolve admin status once so we can enforce the customer / admin split.
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    isAdmin = Boolean(profile?.is_admin);
  }

  // Admin accounts have no customer-facing surface. If an admin lands on
  // /account, /cart, /checkout, /sign-in or /sign-up, bounce them into the
  // admin panel — admin and customer are mutually-exclusive product modes.
  const customerOnlyPath =
    path.startsWith('/account') ||
    path.startsWith('/cart') ||
    path.startsWith('/checkout') ||
    path === '/sign-in' ||
    path === '/sign-up';
  if (isAdmin && customerOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/orders';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Signed-in (non-admin) users shouldn't see the customer sign-in / sign-up
  if (user && !isAdmin && (path === '/sign-in' || path === '/sign-up')) {
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
    if (!isAdmin) {
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
