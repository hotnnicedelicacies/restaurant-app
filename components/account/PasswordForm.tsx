'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { changePassword } from '@/lib/account/profile';

export default function PasswordForm() {
  const [pending, start] = useTransition();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    start(async () => {
      const res = await changePassword({ newPassword, confirmPassword });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Password updated.');
      setNewPassword('');
      setConfirmPassword('');
    });
  }

  return (
    <div className="rounded-[2px] border border-rule bg-cream p-6 sm:p-8">
      <header className="mb-5 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
        <h3 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
          Change <em>password</em>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">№ 02</span>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          id="new-password"
          label="New password"
          sublabel="· at least 8 characters"
          type={show ? 'text' : 'password'}
          value={newPassword}
          onChange={setNewPassword}
          minLength={8}
          autoComplete="new-password"
        />
        <Field
          id="confirm-password"
          label="Confirm new password"
          type={show ? 'text' : 'password'}
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={8}
          autoComplete="new-password"
        />
        <label className="flex cursor-pointer items-center gap-2.5 font-serif text-[13.5px] italic text-ink-muted">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="h-[16px] w-[16px] accent-walnut"
          />
          Show passwords
        </label>
        <p className="m-0 font-serif text-[13px] italic text-ink-muted">
          You&apos;ll stay signed in on this device after changing your password.
        </p>
        <button
          type="submit"
          disabled={pending || !newPassword || newPassword.length < 8}
          className="mt-1 w-fit min-w-[200px] cursor-pointer rounded-[2px] bg-walnut px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  sublabel,
  type,
  value,
  onChange,
  minLength,
  autoComplete,
}: {
  id: string;
  label: string;
  sublabel?: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
        {label}
        {sublabel && (
          <small className="ml-1.5 font-serif text-[12px] italic tracking-normal text-ink-muted [font-variant:normal]">
            {sublabel}
          </small>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={minLength}
        autoComplete={autoComplete}
        required
        className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut"
      />
    </div>
  );
}
