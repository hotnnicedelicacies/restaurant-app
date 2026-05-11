'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import PasswordInput from '@/components/auth/PasswordInput';
import { siteConfig } from '@/constants/siteConfig';
import { signUpAction } from '@/lib/auth/actions';

export default function SignUpForm({ next }: { next?: string }) {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const result = await signUpAction(data);
    if (result && 'ok' in result && !result.ok) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? siteConfig.routes.account} />

      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
          Full name
        </label>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Sarah Whitfield"
          className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.co.uk"
          className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
          Choose a password
          <small className="ml-1.5 font-serif text-[12px] italic tracking-normal text-ink-muted [font-variant:normal]">
            · at least 8 characters
          </small>
        </label>
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 font-serif text-[14px] italic leading-[1.5] text-ink-muted">
        <input type="checkbox" required className="mt-0.5 h-[18px] w-[18px] accent-walnut" />
        <span>
          I agree to the{' '}
          <Link href={siteConfig.routes.legal.terms} className="not-italic text-walnut border-b border-bronze-deep pb-px">
            Terms
          </Link>{' '}
          and{' '}
          <Link href={siteConfig.routes.legal.privacy} className="not-italic text-walnut border-b border-bronze-deep pb-px">
            Privacy Policy
          </Link>
          , and to receiving order-related emails from {siteConfig.name}.
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1.5 w-full rounded-[2px] bg-walnut px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-60"
      >
        {submitting ? 'Creating account…' : 'Create my account'}
      </button>
    </form>
  );
}
