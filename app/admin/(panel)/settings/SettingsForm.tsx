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
      for (const [key, value] of Object.entries(form)) {
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

  const hours: HoursBlob = form.hours ?? {
    days: [],
    open: '12:00',
    close: '20:00',
    sameDayCutoff: '10:00',
  };
  const openSet = new Set<WeekDay>(hours.days);

  function setDayOpen(day: WeekDay, isOpen: boolean) {
    const next = new Set(openSet);
    if (isOpen) next.add(day);
    else next.delete(day);
    patch({ hours: { ...hours, days: ALL_DAYS.filter((d) => next.has(d)) } });
  }

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">Kitchen settings</div>
          <h1 className="admin-page-head__title">
            Site &amp; <em>kitchen</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="receipt-btn receipt-btn--primary"
            style={{ cursor: pending ? 'wait' : 'pointer' }}
          >
            {pending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <p className="settings-sidebar__title">Settings</p>
          <a href="#hours" className="settings-sidebar__link is-active">
            Hours &amp; cutoff
          </a>
          <a href="#contact" className="settings-sidebar__link">
            Contact
          </a>
          <a href="#flags" className="settings-sidebar__link">
            Operational toggles
          </a>
          <a href="#operations" className="settings-sidebar__link">
            Operations
          </a>
          <a
            href="/admin/settings/advanced"
            className="settings-sidebar__link"
            style={{ marginTop: 16, borderTop: '1px solid var(--color-rule)', paddingTop: 18, color: 'var(--color-bronze-deep)' }}
          >
            Advanced &amp; security →
          </a>
        </aside>

        <div className="settings-main">
          {/* HOURS */}
          <section id="hours" className="form-section">
            <header className="form-section__head">
              <h2 className="form-section__title">
                Hours &amp; <em>cutoff</em>
              </h2>
              <span className="form-section__num">№ 01</span>
            </header>
            <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
              When the kitchen accepts orders, and the cutoff time for same-day delivery. Used everywhere across the customer site.
            </p>

            <div>
              {ALL_DAYS.map((day) => {
                const isOpen = openSet.has(day);
                return (
                  <div key={day} className={`day-row${isOpen ? '' : ' is-closed'}`}>
                    <span className="day-row__name">{day}</span>
                    <label className="switch" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={(e) => setDayOpen(day, e.target.checked)}
                      />
                      <span className="switch__track">
                        <span className="switch__thumb" />
                      </span>
                    </label>
                    {isOpen ? (
                      <div className="day-row__times">
                        <input
                          type="time"
                          className="day-row__time"
                          value={hours.open}
                          onChange={(e) => patch({ hours: { ...hours, open: e.target.value } })}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          className="day-row__time"
                          value={hours.close}
                          onChange={(e) => patch({ hours: { ...hours, close: e.target.value } })}
                        />
                      </div>
                    ) : (
                      <span className="day-row__closed-label">Closed</span>
                    )}
                    <span />
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-rule)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-field">
                <label className="form-field__label" htmlFor="cutoff">
                  Same-day cutoff time
                </label>
                <input
                  id="cutoff"
                  className="form-field__input"
                  type="time"
                  value={hours.sameDayCutoff}
                  onChange={(e) => patch({ hours: { ...hours, sameDayCutoff: e.target.value } })}
                />
                <span className="form-field__help">
                  Orders after this time are delivered the next available day.
                </span>
              </div>
              <div className="form-field">
                <label className="form-field__label" htmlFor="prep">
                  Default prep <small>· minutes</small>
                </label>
                <input
                  id="prep"
                  className="form-field__input"
                  type="number"
                  value={form.default_prep_time_min ?? 60}
                  onChange={(e) => patch({ default_prep_time_min: Number(e.target.value) })}
                  min={0}
                  step={5}
                />
                <span className="form-field__help">
                  Used at checkout when no zone-specific time is set.
                </span>
              </div>
            </div>

            <div className="form-field" style={{ marginTop: 16 }}>
              <label className="form-field__label" htmlFor="closed-msg">
                Closed-store message <small>· shown when the store is paused</small>
              </label>
              <textarea
                id="closed-msg"
                className="form-field__textarea"
                placeholder="e.g., Closed for Easter — back Tue 22 April."
                style={{ minHeight: 60 }}
                value={form.closed_message ?? ''}
                onChange={(e) => patch({ closed_message: e.target.value })}
              />
            </div>
          </section>

          {/* CONTACT */}
          <section id="contact" className="form-section">
            <header className="form-section__head">
              <h2 className="form-section__title">
                Contact <em>details</em>
              </h2>
              <span className="form-section__num">№ 02</span>
            </header>
            <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
              Used in the header, footer, contact page, order emails, and receipts.
            </p>

            <div className="form-grid">
              <div className="form-field">
                <label className="form-field__label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  className="form-field__input"
                  type="tel"
                  value={form.contact_phone ?? ''}
                  onChange={(e) => patch({ contact_phone: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-field__label" htmlFor="email">
                  Public email
                </label>
                <input
                  id="email"
                  className="form-field__input"
                  type="email"
                  value={form.contact_email ?? ''}
                  onChange={(e) => patch({ contact_email: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* FLAGS */}
          <section id="flags" className="form-section">
            <header className="form-section__head">
              <h2 className="form-section__title">
                Operational <em>toggles</em>
              </h2>
              <span className="form-section__num">№ 03</span>
            </header>
            <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
              Quick switches to pause the kitchen, gate payment methods, etc.
            </p>

            <RowToggle
              label="Store is open"
              description="When off, the menu is read-only and checkout is blocked."
              checked={form.store_open ?? true}
              onChange={(v) => patch({ store_open: v })}
            />
            <RowToggle
              label="Cash on delivery"
              description="Customers can choose to pay the driver in cash."
              checked={form.cod_enabled ?? true}
              onChange={(v) => patch({ cod_enabled: v })}
            />
            <RowToggle
              label="Pickup"
              description="Customers can opt to collect from the kitchen (not yet wired)."
              checked={form.pickup_enabled ?? false}
              onChange={(v) => patch({ pickup_enabled: v })}
              disabled
            />
          </section>

          {/* OPERATIONS */}
          <section id="operations" className="form-section">
            <header className="form-section__head">
              <h2 className="form-section__title">
                Operational <em>defaults</em>
              </h2>
              <span className="form-section__num">№ 04</span>
            </header>
            <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
              Defaults used when a zone doesn&apos;t override.
            </p>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-field__label" htmlFor="prep-max">
                  Default prep max <small>· minutes</small>
                </label>
                <input
                  id="prep-max"
                  className="form-field__input"
                  type="number"
                  value={form.default_prep_time_max ?? 90}
                  onChange={(e) => patch({ default_prep_time_max: Number(e.target.value) })}
                />
              </div>
              <div className="form-field">
                <label className="form-field__label" htmlFor="min-order">
                  Global min order <small>· £</small>
                </label>
                <input
                  id="min-order"
                  className="form-field__input"
                  type="number"
                  step={1}
                  value={form.global_min_order_gbp ?? 10}
                  onChange={(e) => patch({ global_min_order_gbp: Number(e.target.value) })}
                />
              </div>
            </div>
          </section>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="receipt-btn receipt-btn--primary"
              style={{ cursor: pending ? 'wait' : 'pointer' }}
            >
              {pending ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function RowToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--color-rule)',
        cursor: 'pointer',
      }}
    >
      <div>
        <div className="t-body" style={{ fontWeight: 500, margin: 0 }}>
          {label}
        </div>
        <div className="t-body-muted" style={{ margin: 0 }}>
          {description}
        </div>
      </div>
      <span className="switch">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch__track">
          <span className="switch__thumb" />
        </span>
      </span>
    </label>
  );
}
