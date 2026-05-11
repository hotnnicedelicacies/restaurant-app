'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import PasswordInput from '@/components/auth/PasswordInput';
import { resetPasswordAction } from '@/lib/auth/actions';

export default function ResetPasswordForm() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get('password') !== data.get('confirm')) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const result = await resetPasswordAction(data);
    if (result && 'ok' in result && !result.ok) {
      toast.error(result.error);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
          New password
        </label>
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
          Confirm new password
        </label>
        <PasswordInput name="confirm" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-1.5 w-full rounded-[2px] bg-walnut px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}
