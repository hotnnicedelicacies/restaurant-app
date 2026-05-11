'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateSetting } from '@/lib/admin/catalogActions';

type WeekDay =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface HoursBlob {
  days: WeekDay[];
  open: string;
  close: string;
  sameDayCutoff: string;
}

interface SettingsBlob {
  store_open?: boolean;
  cod_enabled?: boolean;
  pickup_enabled?: boolean;
  closed_message?: string;
  contact_phone?: string;
  contact_email?: string;
  default_prep_time_min?: number;
  default_prep_time_max?: number;
  global_min_order_gbp?: number;
  hours?: HoursBlob;
}

const ALL_DAYS: WeekDay[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

export default function SettingsForm({ initial }: { initial: SettingsBlob }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<SettingsBlob>(initial);

  function patch(p: Partial<SettingsBlob>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function handleSave() {
    start(async () => {
      const entries = Object.entries(form);
      for (const [key, value] of entries) {
        const res = await updateSetting(key, value);
        if (!res.ok) {
          toast.error(`Failed to save ${key}: ${res.error}`);
          return;
        }
      }
      toast.success('Settings saved.');
      router.refresh();
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card title="Service" subtitle="Pause the kitchen, toggle payment methods.">
        <Toggle
          label="Store is open"
          description="When off, the menu is read-only and checkout is blocked."
          checked={form.store_open ?? true}
          onChange={(v) => patch({ store_open: v })}
        />
        <Toggle
          label="Cash on delivery"
          description="Customers can choose to pay the driver in cash."
          checked={form.cod_enabled ?? true}
          onChange={(v) => patch({ cod_enabled: v })}
        />
        <Toggle
          label="Pickup"
          description="Customers can opt to collect from the kitchen (not yet wired)."
          checked={form.pickup_enabled ?? false}
          onChange={(v) => patch({ pickup_enabled: v })}
        />

        <Field label="Closed-store message">
          <textarea
            rows={3}
            value={form.closed_message ?? ''}
            onChange={(e) => patch({ closed_message: e.target.value })}
            placeholder="Shown to customers when the store is closed."
            className="w-full resize-none rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] italic text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
          />
        </Field>
      </Card>

      <Card title="Contact" subtitle="What's shown on receipts, emails, the footer.">
        <Field label="Phone">
          <input
            type="text"
            value={form.contact_phone ?? ''}
            onChange={(e) => patch({ contact_phone: e.target.value })}
            className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.contact_email ?? ''}
            onChange={(e) => patch({ contact_email: e.target.value })}
            className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
          />
        </Field>
      </Card>

      <Card title="Hours" subtitle="Trading days, opening / closing, and same-day cutoff. These power the homepage band, footer, contact page, terms, and the FoodEstablishment JSON-LD.">
        <div>
          <p className="m-0 mb-2 font-serif text-[12px] tracking-[0.08em] text-walnut [font-variant:small-caps]">Open days</p>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((d) => {
              const isOn = (form.hours?.days ?? []).includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const current = new Set(form.hours?.days ?? []);
                    if (isOn) current.delete(d); else current.add(d);
                    const next: WeekDay[] = ALL_DAYS.filter((x) => current.has(x));
                    patch({ hours: { ...(form.hours ?? { open: '12:00', close: '20:00', sameDayCutoff: '10:00', days: [] }), days: next } });
                  }}
                  className={`rounded-[2px] border px-3 py-1.5 font-serif text-[12.5px] tracking-[0.04em] transition-colors ${
                    isOn ? 'border-walnut bg-walnut text-cream' : 'border-rule bg-cream-soft text-walnut hover:border-walnut'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className="m-0 mt-2 font-serif text-[12px] italic text-ink-muted">
            Pick the days the kitchen actually trades. Days you leave off show as "Closed" on the public pages.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Opens">
            <input
              type="time"
              value={form.hours?.open ?? '12:00'}
              onChange={(e) => patch({ hours: { ...(form.hours ?? { days: [], close: '20:00', sameDayCutoff: '10:00' }) as HoursBlob, open: e.target.value } })}
              className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
            />
          </Field>
          <Field label="Closes">
            <input
              type="time"
              value={form.hours?.close ?? '20:00'}
              onChange={(e) => patch({ hours: { ...(form.hours ?? { days: [], open: '12:00', sameDayCutoff: '10:00' }) as HoursBlob, close: e.target.value } })}
              className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
            />
          </Field>
          <Field label="Same-day cutoff">
            <input
              type="time"
              value={form.hours?.sameDayCutoff ?? '10:00'}
              onChange={(e) => patch({ hours: { ...(form.hours ?? { days: [], open: '12:00', close: '20:00' }) as HoursBlob, sameDayCutoff: e.target.value } })}
              className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
            />
          </Field>
        </div>
      </Card>

      <Card title="Operations" subtitle="Defaults used when a zone doesn't override.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Default prep min (mins)">
            <input
              type="number"
              value={form.default_prep_time_min ?? 60}
              onChange={(e) => patch({ default_prep_time_min: Number(e.target.value) })}
              className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
            />
          </Field>
          <Field label="Default prep max (mins)">
            <input
              type="number"
              value={form.default_prep_time_max ?? 90}
              onChange={(e) => patch({ default_prep_time_max: Number(e.target.value) })}
              className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
            />
          </Field>
        </div>
        <Field label="Global min order (£)">
          <input
            type="number"
            step="1"
            value={form.global_min_order_gbp ?? 10}
            onChange={(e) => patch({ global_min_order_gbp: Number(e.target.value) })}
            className="w-full rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
          />
        </Field>
      </Card>

      <div className="lg:col-span-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-[2px] bg-walnut px-6 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2px] border border-rule bg-cream p-5">
      <h2 className="m-0 font-serif text-[18px] font-medium text-walnut">{title}</h2>
      <p className="m-0 mb-4 font-serif text-[13px] italic text-ink-muted">{subtitle}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 font-serif text-[11.5px] font-medium tracking-[0.08em] text-walnut [font-variant:small-caps]">
      {label}
      {children}
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[2px] border border-rule bg-cream-soft p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[18px] w-[18px] accent-walnut"
      />
      <div>
        <div className="font-serif text-[14px] font-medium text-walnut">{label}</div>
        <div className="font-serif text-[12.5px] italic text-ink-muted">{description}</div>
      </div>
    </label>
  );
}
