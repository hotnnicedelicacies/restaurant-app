'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addAddress, deleteAddress } from '@/lib/account/addresses';

interface Address {
  id: string;
  label: string | null;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  postcode: string;
  phone: string | null;
  isDefault: boolean;
}

const EMPTY = {
  label: '',
  recipientName: '',
  line1: '',
  line2: '',
  city: 'Middlesbrough',
  postcode: '',
  phone: '',
  isDefault: false,
};

export default function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(addresses.length === 0);
  const [form, setForm] = useState(EMPTY);

  function patch<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    start(async () => {
      const res = await addAddress(form);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Address saved.');
      setForm(EMPTY);
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Remove this saved address?')) return;
    start(async () => {
      const res = await deleteAddress(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Address removed.');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {addresses.length === 0 ? null : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-4 rounded-[2px] border border-rule bg-cream p-4"
            >
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <h4 className="m-0 font-serif text-[16px] font-medium text-walnut">
                    {a.label || 'Home'}
                  </h4>
                  {a.isDefault && (
                    <span className="rounded-[2px] border border-bronze bg-bronze/10 px-1.5 py-[1px] font-mono text-[9px] uppercase tracking-[0.18em] text-bronze-deep">
                      Default
                    </span>
                  )}
                </div>
                <p className="m-0 mt-1 font-serif text-[14px] leading-[1.5] text-walnut">
                  {a.recipientName}
                  <br />
                  {a.line1}
                  {a.line2 && <>, {a.line2}</>}
                  <br />
                  {a.city} · {a.postcode}
                </p>
                {a.phone && (
                  <p className="m-0 mt-1 font-serif text-[13px] italic text-ink-muted">{a.phone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                disabled={pending}
                className="self-start rounded-[2px] border border-danger bg-transparent px-3 py-1 font-serif text-[11px] font-semibold uppercase tracking-[0.16em] text-danger [font-variant:small-caps] hover:bg-danger hover:text-cream disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="rounded-[2px] border border-rule bg-cream p-6 sm:p-8">
          <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
            <h3 className="m-0 font-serif text-[18px] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
              Add an <em>address</em>
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-serif text-[12px] italic text-ink-muted hover:text-walnut"
            >
              Cancel
            </button>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Label (optional)">
              <input
                type="text"
                value={form.label}
                onChange={(e) => patch('label', e.target.value)}
                placeholder="Home, Mum's place…"
                className={FIELD_CLS}
              />
            </Field>
            <Field label="Recipient name">
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) => patch('recipientName', e.target.value)}
                placeholder="Full name"
                className={FIELD_CLS}
              />
            </Field>
            <Field label="Address line 1" className="sm:col-span-2">
              <input
                type="text"
                value={form.line1}
                onChange={(e) => patch('line1', e.target.value)}
                placeholder="House number and street"
                className={FIELD_CLS}
              />
            </Field>
            <Field label="Address line 2 (optional)" className="sm:col-span-2">
              <input
                type="text"
                value={form.line2}
                onChange={(e) => patch('line2', e.target.value)}
                placeholder="Flat, building, etc."
                className={FIELD_CLS}
              />
            </Field>
            <Field label="City / town">
              <input
                type="text"
                value={form.city}
                onChange={(e) => patch('city', e.target.value)}
                className={FIELD_CLS}
              />
            </Field>
            <Field label="Postcode">
              <input
                type="text"
                value={form.postcode}
                onChange={(e) => patch('postcode', e.target.value.toUpperCase())}
                placeholder="TS1 3AB"
                className={FIELD_CLS}
              />
            </Field>
            <Field label="Phone (optional)" className="sm:col-span-2">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => patch('phone', e.target.value)}
                placeholder="In case the driver needs to call"
                className={FIELD_CLS}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 font-serif text-[13.5px] italic text-ink-muted sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => patch('isDefault', e.target.checked)}
                className="h-[16px] w-[16px] accent-walnut"
              />
              Use as my default delivery address
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="mt-5 rounded-[2px] bg-walnut px-5 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save address'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-[2px] border border-walnut bg-transparent px-5 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
        >
          + Add another address
        </button>
      )}
    </div>
  );
}

const FIELD_CLS =
  'w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[15px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted';

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className="font-serif text-[12px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
        {label}
      </span>
      {children}
    </label>
  );
}
