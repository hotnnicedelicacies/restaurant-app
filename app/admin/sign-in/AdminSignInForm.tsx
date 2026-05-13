'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/auth/PasswordInput';
import { signInAction } from '@/lib/auth/actions';

export default function AdminSignInForm({ next }: { next?: string }) {
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const res = await signInAction(data);
    if (res && 'ok' in res && !res.ok) {
      toast.error(res.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? '/admin/orders'} />

      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin.email@example.com"
          className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
          Password
        </label>
        <PasswordInput name="password" required autoComplete="current-password" placeholder="••••••••" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1.5 w-full rounded-[2px] bg-walnut px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-60"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
