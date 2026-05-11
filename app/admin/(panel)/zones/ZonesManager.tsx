'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

  function handleArchive(id: string) {
    if (!confirm('Archive this zone? It will no longer be selectable at checkout.')) return;
    start(async () => {
      const res = await archiveZone(id);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success('Zone archived.');
        router.refresh();
      }
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
      <div className="overflow-hidden rounded-[2px] border border-rule bg-cream">
        <table className="w-full border-collapse">
          <thead className="bg-cream-soft">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-bronze-deep">
              <th className="px-4 py-3 font-normal">Order</th>
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Postcodes</th>
              <th className="px-4 py-3 font-normal">Fee · Min</th>
              <th className="px-4 py-3 font-normal">Prep</th>
              <th className="px-4 py-3 font-normal">Flags</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="font-serif text-[13.5px] text-walnut">
            {zones.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center italic text-ink-muted">
                  No zones yet. Add one on the right.
                </td>
              </tr>
            ) : (
              zones.map((z) => (
                <tr key={z.id} className="border-t border-rule align-top">
                  <td className="px-3 py-3 font-mono text-[12px] text-ink-muted">{z.displayOrder}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{z.name}</div>
                    {!z.isActive && <div className="text-[11px] italic text-danger">Inactive</div>}
                  </td>
                  <td className="px-3 py-3 font-mono text-[12px] text-walnut">
                    {z.postcodes.length === 0 ? <em className="text-ink-muted">none</em> : z.postcodes.join(', ')}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {z.isQuoted ? <em className="text-ink-muted">Quoted</em> : formatGBP(z.baseFeeGbp)}
                    <div className="text-[11.5px] italic text-ink-muted">Min · {formatGBP(z.minOrderGbp)}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[12px] text-ink-muted">
                    {z.prepTimeMin}–{z.prepTimeMax} min
                  </td>
                  <td className="px-3 py-3 text-[11.5px]">
                    {z.allowsCod ? <span className="text-walnut">COD ok</span> : <span className="text-ink-muted">No COD</span>}
                    {z.isQuoted && <div className="text-bronze-deep">Quoted</div>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(z)}
                        className="rounded-[2px] border border-walnut bg-transparent px-3 py-1 font-serif text-[11px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchive(z.id)}
                        disabled={pending}
                        className="rounded-[2px] border border-danger bg-transparent px-3 py-1 font-serif text-[11px] font-semibold uppercase tracking-[0.16em] text-danger [font-variant:small-caps] hover:bg-danger hover:text-cream disabled:opacity-50"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <aside className="rounded-[2px] border border-rule bg-cream p-5">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
          {editing?.id ? 'Edit zone' : editing ? 'New zone' : 'Zone editor'}
        </h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY })}
            className="w-full rounded-[2px] bg-walnut px-4 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep"
          >
            New zone
          </button>
        ) : (
          <ZoneForm
            zone={editing}
            pending={pending}
            onChange={(patch) => setEditing({ ...editing, ...patch })}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </aside>
    </div>
  );
}

function ZoneForm({
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
    <div className="flex flex-col gap-3">
      <Field label="Name">
        <input
          type="text"
          value={zone.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Middlesbrough core"
          className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
        />
      </Field>

      <Field label="Postcode prefixes (comma-separated)">
        <input
          type="text"
          value={zone.postcodes.join(', ')}
          onChange={(e) => onChange({ postcodes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          placeholder="TS1, TS2, TS3"
          className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Base fee (£)">
          <input
            type="number"
            step="0.5"
            min="0"
            value={zone.baseFeeGbp}
            onChange={(e) => onChange({ baseFeeGbp: Number(e.target.value) })}
            disabled={zone.isQuoted}
            className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut disabled:opacity-50"
          />
        </Field>
        <Field label="Min order (£)">
          <input
            type="number"
            step="1"
            min="0"
            value={zone.minOrderGbp}
            onChange={(e) => onChange({ minOrderGbp: Number(e.target.value) })}
            className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prep min (mins)">
          <input
            type="number"
            min="0"
            value={zone.prepTimeMin}
            onChange={(e) => onChange({ prepTimeMin: Number(e.target.value) })}
            className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
          />
        </Field>
        <Field label="Prep max (mins)">
          <input
            type="number"
            min="0"
            value={zone.prepTimeMax}
            onChange={(e) => onChange({ prepTimeMax: Number(e.target.value) })}
            className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
          />
        </Field>
      </div>

      <Field label="Display order">
        <input
          type="number"
          value={zone.displayOrder}
          onChange={(e) => onChange({ displayOrder: Number(e.target.value) })}
          className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
        />
      </Field>

      <div className="flex flex-col gap-2 rounded-[2px] border border-rule bg-cream-soft p-3 font-serif text-[13px] italic text-ink-muted">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={zone.isActive} onChange={(e) => onChange({ isActive: e.target.checked })} className="h-[16px] w-[16px] accent-walnut" />
          Active (shown at checkout)
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={zone.allowsCod} onChange={(e) => onChange({ allowsCod: e.target.checked })} className="h-[16px] w-[16px] accent-walnut" />
          Allows cash on delivery
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={zone.isQuoted} onChange={(e) => onChange({ isQuoted: e.target.checked })} className="h-[16px] w-[16px] accent-walnut" />
          Variable-quoted (no auto fee; admin contacts customer)
        </label>
      </div>

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="flex-1 rounded-[2px] bg-walnut px-4 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save zone'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-[2px] border border-walnut bg-transparent px-4 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 font-serif text-[12px] font-medium tracking-[0.06em] text-walnut [font-variant:small-caps]">
      {label}
      {children}
    </label>
  );
}
