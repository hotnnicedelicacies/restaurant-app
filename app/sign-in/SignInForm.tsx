'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import PasswordInput from '@/components/auth/PasswordInput';
import { siteConfig } from '@/constants/siteConfig';
import { signInAction } from '@/lib/auth/actions';

export default function SignInForm({ next }: { next?: string }) {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const result = await signInAction(data);
    if (result && 'ok' in result && !result.ok) {
      toast.error(result.error);
      setSubmitting(false);
    }
    // On success, server action redirects → component unmounts
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? siteConfig.routes.account} />

      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-[--color-walnut] [font-variant:small-caps]">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.co.uk"
          className="w-full rounded-[2px] border border-[--color-border] bg-transparent px-3.5 py-3 font-serif text-[16px] text-[--color-walnut] outline-none transition-colors focus:border-[--color-walnut] placeholder:italic placeholder:text-[--color-ink-muted]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-[--color-walnut] [font-variant:small-caps]">
          Password
        </label>
        <PasswordInput name="password" required autoComplete="current-password" placeholder="••••••••" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 font-serif text-[13.5px]">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" name="remember" defaultChecked className="h-[18px] w-[18px] accent-[--color-walnut]" />
          <span className="italic text-[--color-ink-muted]">Keep me signed in</span>
        </label>
        <Link href={siteConfig.routes.forgotPassword} className="link-underline italic">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1.5 w-full rounded-[2px] bg-[--color-walnut] px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-[--color-cream] [font-variant:small-caps] transition-colors hover:bg-[--color-bronze-deep] disabled:opacity-60"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
