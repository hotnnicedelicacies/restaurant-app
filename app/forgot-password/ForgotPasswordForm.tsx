'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { forgotPasswordAction } from '@/lib/auth/actions';

export default function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') ?? '');
    setSubmitting(true);
    const result = await forgotPasswordAction(data);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
    } else {
      setSentTo(email);
    }
  };

  if (sentTo) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 inline-flex h-[76px] w-[76px] items-center justify-center rounded-full border border-[--color-bronze]">
          <span className="font-serif text-[36px] italic font-normal leading-none text-[--color-bronze-deep]">✓</span>
        </div>
        <h2 className="m-0 mb-2 font-serif text-[clamp(24px,3vw,32px)] font-medium text-[--color-walnut] [&_em]:italic [&_em]:font-normal">
          Check your <em>inbox</em>
        </h2>
        <p className="m-0 font-serif text-[17px] italic text-[--color-ink-muted]">
          We've sent a reset link to{' '}
          <span className="not-italic text-[--color-walnut]">{sentTo}</span>. It expires in 30 minutes.
        </p>
        <p className="mt-4 font-serif text-[13.5px] italic text-[--color-ink-muted]">
          Didn't get it? Check spam, or{' '}
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="bg-transparent p-0 italic underline decoration-[--color-bronze-deep] underline-offset-[3px]"
          >
            try a different email
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

      <button
        type="submit"
        disabled={submitting}
        className="mt-1.5 w-full rounded-[2px] bg-[--color-walnut] px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-[--color-cream] [font-variant:small-caps] transition-colors hover:bg-[--color-bronze-deep] disabled:opacity-60"
      >
        {submitting ? 'Sending link…' : 'Send reset link'}
      </button>
    </form>
  );
}
