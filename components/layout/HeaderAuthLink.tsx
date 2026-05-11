'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { siteConfig } from '@/constants/siteConfig';
import { cn } from '@/lib/utils';

interface Props {
  /** Show against a dark walnut background (header) vs light surface (sheet). */
  tone?: 'onDark' | 'onLight';
  /** Inline label next to the icon — used in mobile nav. */
  withLabel?: boolean;
  onClick?: () => void;
}

export default function HeaderAuthLink({ tone = 'onDark', withLabel = false, onClick }: Props) {
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
      setMounted(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const colors =
    tone === 'onDark'
      ? 'text-cream hover:text-bronze'
      : 'text-walnut hover:text-bronze-deep';

  const href = mounted && signedIn ? siteConfig.routes.account : siteConfig.routes.signIn;
  const label = mounted && signedIn ? 'Account' : 'Sign in';

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-2 rounded-[2px] px-2 py-1.5 font-serif text-[13px] font-medium tracking-[0.14em] transition-colors [font-variant:small-caps]',
        colors
      )}
    >
      <User size={18} strokeWidth={1.5} />
      {withLabel && <span>{label}</span>}
      {!withLabel && <span className="hidden lg:inline">{label}</span>}
    </Link>
  );
}
