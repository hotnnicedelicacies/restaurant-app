'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/lib/auth/actions';

export default function AdminSignOut() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          await signOutAction();
          router.push('/admin/sign-in');
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-[2px] border border-walnut bg-transparent px-3 py-1.5 font-serif text-[11.5px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] transition-colors hover:bg-walnut hover:text-cream disabled:opacity-60"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
