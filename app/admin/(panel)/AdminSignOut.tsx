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
      className="admin-header__signout cursor-pointer"
      style={{ background: 'transparent', border: 0, padding: 0, cursor: pending ? 'wait' : 'pointer' }}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
