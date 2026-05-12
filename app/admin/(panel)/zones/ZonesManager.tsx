'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { archiveZone, upsertZone } from '@/lib/admin/catalogActions';
import { formatGBP } from '@/lib/utils';

interface Zone {
  id: string;
  name: string;
  postcodes: string[];
  baseFeeGbp: number;
  minOrderGbp: number;
  prepTimeMin: number;
  prepTimeMax: number;
  isQuoted: boolean;
  allowsCod: boolean;
  isActive: boolean;
  displayOrder: number;
  monthlyOrders: number;
}

interface ZoneDraft {
  id?: string;
  name: string;
  postcodes: string[];
  baseFeeGbp: number;
  minOrderGbp: number;
  prepTimeMin: number;
  prepTimeMax: number;
  isQuoted: boolean;
  allowsCod: boolean;
  isActive: boolean;
  displayOrder: number;
}

const EMPTY: ZoneDraft = {
  name: '',
  postcodes: [],
  baseFeeGbp: 5,
  minOrderGbp: 10,
  prepTimeMin: 30,
  prepTimeMax: 45,
  isQuoted: false,
  allowsCod: true,
  isActive: true,
  displayOrder: 99,
};

export default function ZonesManager({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<ZoneDraft | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Zone | null>(null);

  function openNew() {
    setDraft({ ...EMPTY, displayOrder: zones.length + 1 });
  }
  function openEdit(z: Zone) {
    setDraft({
      id: z.id,
      name: z.name,
      postcodes: [...z.postcodes],
      baseFeeGbp: z.baseFeeGbp,
      minOrderGbp: z.minOrderGbp,
      prepTimeMin: z.prepTimeMin,
      prepTimeMax: z.prepTimeMax,
      isQuoted: z.isQuoted,
      allowsCod: z.allowsCod,
      isActive: z.isActive,
      displayOrder: z.displayOrder,
    });
  }

  function handleSave() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error('Zone name is required.');
      return;
    }
    start(async () => {
      const res = await upsertZone({ ...draft });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(draft.id ? 'Zone updated.' : 'Zone created.');
      setDraft(null);
      router.refresh();
    });
  }

  function handleArchive() {
    if (!archiveTarget) return;
    start(async () => {
      const res = await archiveZone(archiveTarget.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Zone archived.');
      setArchiveTarget(null);
      router.refresh();
    });
  }

  function toggleField(zone: Zone, field: 'allowsCod' | 'isActive') {
    start(async () => {
      const res = await upsertZone({ ...zone, [field]: !zone[field] });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  const activeCount = zones.filter((z) => z.isActive).length;

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">{activeCount} active zones · Teesside</div>
          <h1 className="admin-page-head__title">
            Delivery <em>zones</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <button
            type="button"
            onClick={openNew}
            className="receipt-btn receipt-btn--primary"
            style={{ cursor: 'pointer' }}
          >
            + Add zone
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '16px 20px',
          background: 'var(--color-cream)',
          borderLeft: '3px solid var(--color-bronze)',
          marginBottom: 24,
          borderRadius: '0 2px 2px 0',
        }}
      >
        <p className="t-body" style={{ margin: '0 0 4px' }}>
          <b style={{ fontWeight: 500, fontVariant: 'small-caps', letterSpacing: '0.08em' }}>
            How zones work.
          </b>
        </p>
        <p className="t-body-muted" style={{ margin: 0 }}>
          Each zone covers a list of postcode prefixes. At checkout we match the customer&apos;s postcode against an active zone and apply its fee. Postcodes outside any active zone trigger the &quot;outside our delivery area — message us on WhatsApp&quot; fallback.
        </p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Postcodes</th>
              <th style={{ textAlign: 'right' }}>Fee</th>
              <th style={{ textAlign: 'right' }}>Min order</th>
              <th>Prep time</th>
              <th style={{ textAlign: 'center' }}>COD ok</th>
              <th style={{ textAlign: 'center' }}>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {zones.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <p className="t-body-muted">No zones yet. Add one to start taking orders.</p>
                </td>
              </tr>
            ) : (
              zones.map((z) => (
                <tr key={z.id}>
                  <td>
                    <div className="admin-table__customer">
                      <b>{z.name}</b>
                      <em>
                        {z.monthlyOrders} order{z.monthlyOrders === 1 ? '' : 's'} this month
                        {z.isQuoted && ' · variable-quoted'}
                      </em>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {z.postcodes.length === 0 ? (
                        <em style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>none</em>
                      ) : (
                        z.postcodes.map((pc) => (
                          <span
                            key={pc}
                            className="chip"
                            style={{
                              padding: '3px 9px',
                              fontSize: 11,
                              background: 'var(--color-cream)',
                              borderRadius: 2,
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {pc}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {z.isQuoted ? (
                      <em style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>Quoted</em>
                    ) : (
                      <b style={{ fontWeight: 600 }}>{formatGBP(z.baseFeeGbp)}</b>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontStyle: 'italic', color: 'var(--color-ink-muted)' }}>
                    {formatGBP(z.minOrderGbp)}
                  </td>
                  <td>
                    <span className="t-mono">
                      {z.prepTimeMin}–{z.prepTimeMax} min
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="switch" style={{ cursor: pending ? 'wait' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={z.allowsCod}
                        disabled={pending}
                        onChange={() => toggleField(z, 'allowsCod')}
                      />
                      <span className="switch__track">
                        <span className="switch__thumb" />
                      </span>
                    </label>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="switch" style={{ cursor: pending ? 'wait' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={z.isActive}
                        disabled={pending}
                        onChange={() => toggleField(z, 'isActive')}
                      />
                      <span className="switch__track">
                        <span className="switch__thumb" />
                      </span>
                    </label>
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      onClick={() => openEdit(z)}
                      className="admin-table__action"
                      style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveTarget(z)}
                      disabled={pending}
                      className="admin-table__action menu-admin-table__action--danger"
                      style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit zone modal */}
      <ConfirmModal
        open={draft !== null}
        onCancel={() => setDraft(null)}
        onConfirm={handleSave}
        pending={pending}
        eyebrow="Delivery zone"
        title={
          draft?.id ? (
            <>
              Edit · <em>{draft.name || 'zone'}</em>
            </>
          ) : (
            <>
              Add a new <em>zone</em>
            </>
          )
        }
        body={
          <>Changes apply to new orders only — existing orders keep their original fee.</>
        }
        inputSlot={
          draft && (
            <ZoneForm
              draft={draft}
              onChange={(patch) => setDraft({ ...draft, ...patch })}
            />
          )
        }
        confirmLabel={pending ? 'Saving…' : draft?.id ? 'Save zone' : 'Create zone'}
      />

      {/* Archive modal */}
      <ConfirmModal
        open={archiveTarget !== null}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        pending={pending}
        tone="danger"
        eyebrow="Archive delivery zone"
        title={
          archiveTarget && (
            <>
              Archive <em>{archiveTarget.name}?</em>
            </>
          )
        }
        body={
          archiveTarget && (
            <>
              Customers in postcode{archiveTarget.postcodes.length === 1 ? '' : 's'}{' '}
              <b>{archiveTarget.postcodes.join(', ') || '—'}</b> will see the &quot;outside our delivery area&quot; fallback at checkout. The zone is kept in the database and can be restored later.
            </>
          )
        }
        confirmLabel="Yes, archive"
      />
    </>
  );
}

function ZoneForm({
  draft,
  onChange,
}: {
  draft: ZoneDraft;
  onChange: (patch: Partial<ZoneDraft>) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
      <div className="form-field">
        <label className="form-field__label" htmlFor="zone-name">
          Zone name
        </label>
        <input
          id="zone-name"
          className="form-field__input"
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Middlesbrough Central"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label className="form-field__label">
          Postcode prefixes <small>· press Enter to add</small>
        </label>
        <PostcodeChipInput
          values={draft.postcodes}
          onChange={(postcodes) => onChange({ postcodes })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-field">
          <label className="form-field__label" htmlFor="zone-fee">
            Delivery fee
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-ink-muted)',
                pointerEvents: 'none',
              }}
            >
              £
            </span>
            <input
              id="zone-fee"
              className="form-field__input"
              type="number"
              min="0"
              step="0.50"
              value={draft.baseFeeGbp}
              onChange={(e) => onChange({ baseFeeGbp: Number(e.target.value) })}
              disabled={draft.isQuoted}
              style={{ paddingLeft: 24 }}
            />
          </div>
        </div>
        <div className="form-field">
          <label className="form-field__label" htmlFor="zone-min">
            Minimum order
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-ink-muted)',
                pointerEvents: 'none',
              }}
            >
              £
            </span>
            <input
              id="zone-min"
              className="form-field__input"
              type="number"
              min="0"
              step="0.50"
              value={draft.minOrderGbp}
              onChange={(e) => onChange({ minOrderGbp: Number(e.target.value) })}
              style={{ paddingLeft: 24 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-field">
          <label className="form-field__label" htmlFor="zone-prep-min">
            Prep time min <small>· minutes</small>
          </label>
          <input
            id="zone-prep-min"
            className="form-field__input"
            type="number"
            min="0"
            step="5"
            value={draft.prepTimeMin}
            onChange={(e) => onChange({ prepTimeMin: Number(e.target.value) })}
          />
        </div>
        <div className="form-field">
          <label className="form-field__label" htmlFor="zone-prep-max">
            Prep time max <small>· minutes</small>
          </label>
          <input
            id="zone-prep-max"
            className="form-field__input"
            type="number"
            min="0"
            step="5"
            value={draft.prepTimeMax}
            onChange={(e) => onChange({ prepTimeMax: Number(e.target.value) })}
          />
        </div>
      </div>

      <CheckboxRow
        checked={draft.allowsCod}
        onChange={(v) => onChange({ allowsCod: v })}
        label={<b style={{ color: 'var(--color-walnut)', fontStyle: 'normal', fontWeight: 500 }}>Allow Cash on Delivery</b>}
        caption="in this zone — drivers will carry change."
      />
      <CheckboxRow
        checked={draft.isActive}
        onChange={(v) => onChange({ isActive: v })}
        label={<b style={{ color: 'var(--color-walnut)', fontStyle: 'normal', fontWeight: 500 }}>Zone is active</b>}
        caption="— customers in this postcode can place orders."
      />
      <CheckboxRow
        checked={draft.isQuoted}
        onChange={(v) => onChange({ isQuoted: v })}
        label={<b style={{ color: 'var(--color-walnut)', fontStyle: 'normal', fontWeight: 500 }}>Variable-quoted</b>}
        caption="— no fixed fee. Admin contacts the customer after order."
      />
    </div>
  );
}

function PostcodeChipInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const v = draft.trim().toUpperCase();
    if (!v) return;
    if (values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  }

  return (
    <div className="chip-input">
      {values.map((v) => (
        <span key={v} className="chip">
          {v}
          <button
            type="button"
            className="chip__remove"
            onClick={() => onChange(values.filter((x) => x !== v))}
            aria-label={`Remove ${v}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        className="chip-input__input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder="e.g., TS6"
        style={{ textTransform: 'uppercase' }}
      />
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  caption,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  caption: string;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontSize: 14,
        fontFamily: 'var(--font-serif)',
        cursor: 'pointer',
        paddingTop: 4,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--color-walnut)', marginTop: 3 }}
      />
      <span>
        {label} {caption}
      </span>
    </label>
  );
}
