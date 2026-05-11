import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { siteConfig } from '@/constants/siteConfig';

/**
 * Email-confirmation callback. Supabase redirects here after the user clicks
 * the link in the sign-up confirmation email or the password-reset email.
 *
 *   /auth/callback?code=...&next=/account
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? siteConfig.routes.account;

  if (code) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If we got here, the link was invalid or expired
  return NextResponse.redirect(`${origin}${siteConfig.routes.signIn}?error=invalid_link`);
}
