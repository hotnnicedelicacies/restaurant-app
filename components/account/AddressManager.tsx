'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  addAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from '@/lib/account/addresses';

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

interface Draft {
  id?: string;
  label: string;
  recipientName: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  phone: string;
  isDefault: boolean;
}

const EMPTY: Draft = {
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
  const [draft, setDraft] = useState<Draft | null>(null);

  function openNew() {
    setDraft({ ...EMPTY, isDefault: addresses.length === 0 });
  }
  function openEdit(a: Address) {
    setDraft({
      id: a.id,
      label: a.label ?? '',
      recipientName: a.recipientName,
      line1: a.line1,
      line2: a.line2 ?? '',
      city: a.city,
      postcode: a.postcode,
      phone: a.phone ?? '',
      isDefault: a.isDefault,
    });
  }

  function handleSave() {
    if (!draft) return;
    start(async () => {
      const res = draft.id
        ? await updateAddress({ id: draft.id, ...draft })
        : await addAddress(draft);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(draft.id ? 'Address updated.' : 'Address saved.');
      setDraft(null);
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

  function handleSetDefault(id: string) {
    start(async () => {
      const res = await setDefaultAddress(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="address-grid">
        {addresses.map((a) => (
          <article
            key={a.id}
            className={`address-card${a.isDefault ? ' address-card--default' : ''}`}
          >
            {a.isDefault && <span className="address-card__default-badge">Default</span>}
            <div className="address-card__label">{a.label || 'Address'}</div>
            <p className="address-card__name">{a.recipientName}</p>
            <p className="address-card__lines">
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              <br />
              {a.city}
              <br />
              {a.postcode}
              {a.phone && (
                <>
                  <br />
                  {a.phone}
                </>
              )}
            </p>
            <div className="address-card__actions">
              <button
                type="button"
                onClick={() => openEdit(a)}
                disabled={pending}
                className="address-card__action"
              >
                Edit
              </button>
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => handleSetDefault(a.id)}
                  disabled={pending}
                  className="address-card__action"
                >
                  Set as default
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                disabled={pending}
                className="address-card__action address-card__action--danger"
              >
                Remove
              </button>
            </div>
          </article>
        ))}

        {/* Add tile */}
        <button type="button" onClick={openNew} className="address-card address-card--add">
          <span className="address-card--add__plus">+</span>
          Add a new address
        </button>
      </div>

      {draft && (
        <AddressModal
          draft={draft}
          pending={pending}
          onChange={(patch) => setDraft({ ...draft, ...patch })}
          onSave={handleSave}
          onCancel={() => setDraft(null)}
        />
      )}
    </>
  );
}

function AddressModal({
  draft,
  pending,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Draft;
  pending: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(45, 31, 24, 0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--color-cream)',
          border: '1px solid var(--color-rule)',
          borderRadius: 2,
          padding: 'clamp(24px, 4vw, 36px)',
          fontFamily: 'var(--font-serif)',
        }}
      >
        <header className="mb-5 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
          <h3 className="m-0 font-serif text-[22px] font-medium text-walnut [&_em]:font-normal [&_em]:italic">
            {draft.id ? <>Edit <em>address</em></> : <>Add an <em>address</em></>}
          </h3>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Label (optional)" value={draft.label} onChange={(v) => onChange({ label: v })} placeholder="Home, Mum's place…" />
          <Field label="Recipient name" value={draft.recipientName} onChange={(v) => onChange({ recipientName: v })} required />
          <Field
            label="Address line 1"
            value={draft.line1}
            onChange={(v) => onChange({ line1: v })}
            required
            className="sm:col-span-2"
          />
          <Field
            label="Address line 2 (optional)"
            value={draft.line2}
            onChange={(v) => onChange({ line2: v })}
            className="sm:col-span-2"
          />
          <Field label="City / town" value={draft.city} onChange={(v) => onChange({ city: v })} required />
          <Field
            label="Postcode"
            value={draft.postcode}
            onChange={(v) => onChange({ postcode: v.toUpperCase() })}
            placeholder="TS1 3AB"
            required
          />
          <Field
            label="Phone (optional)"
            value={draft.phone}
            onChange={(v) => onChange({ phone: v })}
            type="tel"
            className="sm:col-span-2"
          />
          {!draft.id && (
            <label className="col-span-full flex cursor-pointer items-center gap-2 font-serif text-[13.5px] italic text-ink-muted">
              <input
                type="checkbox"
                checked={draft.isDefault}
                onChange={(e) => onChange({ isDefault: e.target.checked })}
                className="h-[16px] w-[16px] accent-walnut"
              />
              Use as my default delivery address
            </label>
          )}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="cursor-pointer rounded-[2px] border border-walnut bg-transparent px-5 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="cursor-pointer rounded-[2px] bg-walnut px-5 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep disabled:opacity-60"
          >
            {pending ? 'Saving…' : draft.id ? 'Save changes' : 'Add address'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className="font-serif text-[12px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[15px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted"
      />
    </label>
  );
}
