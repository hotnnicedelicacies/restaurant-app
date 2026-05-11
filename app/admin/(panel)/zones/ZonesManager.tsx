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
}

const EMPTY: Omit<Zone, 'id'> = {
  name: '',
  postcodes: [],
  baseFeeGbp: 5,
  minOrderGbp: 10,
  prepTimeMin: 60,
  prepTimeMax: 90,
  isQuoted: false,
  allowsCod: true,
  isActive: true,
  displayOrder: 99,
};

export default function ZonesManager({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<Zone | (Omit<Zone, 'id'> & { id?: string }) | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Zone | null>(null);

  function handleSave() {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error('Name required.');
      return;
    }
    start(async () => {
      const res = await upsertZone({ ...editing });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(editing.id ? 'Zone updated.' : 'Zone created.');
      setEditing(null);
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

  function toggleZoneField(zone: Zone, field: 'allowsCod' | 'isActive') {
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
          <h1 className="admin-page-head__title">Delivery <em>zones</em></h1>
        </div>
        <div className="admin-page-head__actions">
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY })}
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
          Each zone covers a list of postcode prefixes. At checkout we match the customer's postcode against an active zone and apply its fee. Postcodes outside any active zone trigger the "outside our delivery area — message us on WhatsApp" fallback.
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
                      {z.isQuoted && <em>Variable-quoted</em>}
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
                            style={{
                              padding: '3px 9px',
                              fontSize: 11,
                              background: 'var(--color-cream)',
                              border: '1px solid var(--color-rule)',
                              borderRadius: 2,
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: '0.04em',
                              color: 'var(--color-walnut)',
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
                        onChange={() => toggleZoneField(z, 'allowsCod')}
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
                        onChange={() => toggleZoneField(z, 'isActive')}
                      />
                      <span className="switch__track">
                        <span className="switch__thumb" />
                      </span>
                    </label>
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      onClick={() => setEditing(z)}
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

      {editing && (
        <ZoneEditModal
          zone={editing}
          pending={pending}
          onChange={(patch) => setEditing({ ...editing, ...patch })}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <ConfirmModal
        open={archiveTarget !== null}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        pending={pending}
        tone="danger"
        eyebrow="Archive delivery zone"
        title={archiveTarget && <>Archive <em>{archiveTarget.name}?</em></>}
        body={
          <>
            Customers in those postcode prefixes will see the "outside our delivery area" fallback at checkout. The zone is kept in the database and can be restored later.
          </>
        }
        confirmLabel="Yes, archive"
      />
    </>
  );
}

function ZoneEditModal({
  zone,
  pending,
  onChange,
  onSave,
  onCancel,
}: {
  zone: Omit<Zone, 'id'> & { id?: string };
  pending: boolean;
  onChange: (patch: Partial<Zone>) => void;
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
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="form-section" style={{ width: '100%', maxWidth: 560 }}>
        <header className="form-section__head">
          <h2 className="form-section__title">
            {zone.id ? <>Edit <em>zone</em></> : <>New <em>zone</em></>}
          </h2>
          <span className="form-section__num">{zone.id ? 'Edit' : 'New'}</span>
        </header>

        <div className="form-grid">
          <label className="form-field full">
            <span className="form-field__label">Zone name</span>
            <input
              type="text"
              className="form-field__input"
              value={zone.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Middlesbrough Central"
            />
          </label>
          <label className="form-field full">
            <span className="form-field__label">Postcode prefixes <small>· comma-separated</small></span>
            <input
              type="text"
              className="form-field__input"
              value={zone.postcodes.join(', ')}
              onChange={(e) =>
                onChange({
                  postcodes: e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
                })
              }
              placeholder="TS1, TS2, TS3"
              style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Base fee (£)</span>
            <input
              type="number"
              step="0.5"
              min="0"
              className="form-field__input"
              value={zone.baseFeeGbp}
              onChange={(e) => onChange({ baseFeeGbp: Number(e.target.value) })}
              disabled={zone.isQuoted}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Min order (£)</span>
            <input
              type="number"
              step="1"
              min="0"
              className="form-field__input"
              value={zone.minOrderGbp}
              onChange={(e) => onChange({ minOrderGbp: Number(e.target.value) })}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Prep min (mins)</span>
            <input
              type="number"
              className="form-field__input"
              value={zone.prepTimeMin}
              onChange={(e) => onChange({ prepTimeMin: Number(e.target.value) })}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Prep max (mins)</span>
            <input
              type="number"
              className="form-field__input"
              value={zone.prepTimeMax}
              onChange={(e) => onChange({ prepTimeMax: Number(e.target.value) })}
            />
          </label>
          <label className="form-field full">
            <span className="form-field__label">Display order</span>
            <input
              type="number"
              className="form-field__input"
              value={zone.displayOrder}
              onChange={(e) => onChange({ displayOrder: Number(e.target.value) })}
            />
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <FlagToggle label="Active (shown at checkout)" checked={zone.isActive} onChange={(v) => onChange({ isActive: v })} />
          <FlagToggle label="Allows cash on delivery" checked={zone.allowsCod} onChange={(v) => onChange({ allowsCod: v })} />
          <FlagToggle label="Variable-quoted (no auto fee)" checked={zone.isQuoted} onChange={(v) => onChange({ isQuoted: v })} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="receipt-btn"
            style={{ cursor: pending ? 'wait' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="receipt-btn receipt-btn--primary"
            style={{ cursor: pending ? 'wait' : 'pointer' }}
          >
            {pending ? 'Saving…' : zone.id ? 'Save zone' : 'Create zone'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FlagToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 14px',
        border: '1px solid var(--color-rule)',
        borderRadius: 2,
        background: 'var(--color-cream-soft)',
        cursor: 'pointer',
        fontFamily: 'var(--font-serif)',
        fontSize: 14,
        color: 'var(--color-walnut)',
      }}
    >
      <span>{label}</span>
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch__track">
          <span className="switch__thumb" />
        </span>
      </span>
    </label>
  );
}
