'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProfile } from '@/lib/account/profile';

interface Props {
  initial: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notifyStatusChanges: boolean;
  };
}

export default function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState(initial);

  function patch<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    start(async () => {
      const res = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        notifyStatusChanges: form.notifyStatusChanges,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Profile saved.');
      router.refresh();
    });
  }

  return (
    <div className="rounded-[2px] border border-rule bg-cream p-6 sm:p-8">
      <header className="mb-5 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
        <h3 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
          Your <em>details</em>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">№ 01</span>
      </header>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" value={form.firstName} onChange={(v) => patch('firstName', v)} required />
        <Field label="Last name" value={form.lastName} onChange={(v) => patch('lastName', v)} />
        <Field label="Email" value={form.email} disabled type="email" />
        <Field label="Phone" value={form.phone} onChange={(v) => patch('phone', v)} type="tel" />
        <label className="col-span-full flex cursor-pointer items-start gap-2.5 font-serif text-[14px] italic leading-[1.5] text-ink-muted">
          <input
            type="checkbox"
            checked={form.notifyStatusChanges}
            onChange={(e) => patch('notifyStatusChanges', e.target.checked)}
            className="mt-0.5 h-[18px] w-[18px] accent-walnut"
          />
          <span>Email me when my orders change status (out for delivery, delivered, etc.)</span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-3 w-fit min-w-[200px] cursor-pointer rounded-[2px] bg-walnut px-5 py-[14px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-60 sm:col-span-2"
        >
          {pending ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        required={required}
        readOnly={!onChange && !disabled}
        className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[16px] text-walnut outline-none transition-colors focus:border-walnut disabled:opacity-60"
      />
    </div>
  );
}
