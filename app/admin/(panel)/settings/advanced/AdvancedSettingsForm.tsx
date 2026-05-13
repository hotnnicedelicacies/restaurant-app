'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import SettingsSidebar from '@/components/admin/SettingsSidebar';
import { updateSetting } from '@/lib/admin/catalogActions';
import type { DatasetSummary } from '@/lib/admin/dataExport';

interface AdvancedBlob {
  email_from_name?: string;
  email_from?: string;
  email_reply_to?: string;
  email_signature?: string;
}

interface DatasetRow extends DatasetSummary {
  lastUpdatedDisplay: string;
}

export default function AdvancedSettingsForm({
  initial,
  adminName,
  adminEmail,
  datasets,
}: {
  initial: AdvancedBlob;
  adminName: string;
  adminEmail: string;
  datasets: DatasetRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<AdvancedBlob>(initial);
  const [dirty, setDirty] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);

  function patch(p: Partial<AdvancedBlob>) {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
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
      setDirty(false);
      router.refresh();
    });
  }

  function pauseStore() {
    start(async () => {
      const res = await updateSetting('store_open', false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('New orders are paused.');
      setPauseOpen(false);
      router.refresh();
    });
  }

  return (
    <>
    <div className="settings-layout">
      <SettingsSidebar
        title="Advanced"
        items={[
          { href: '#email', sectionId: 'email', label: 'Transactional email' },
          { href: '#account', sectionId: 'account', label: 'Admin account' },
          { href: '#data', sectionId: 'data', label: 'Data & export' },
          { href: '#danger', sectionId: 'danger', label: 'Danger zone', tone: 'danger' },
        ]}
      />

      <div className="settings-main">
        {/* EMAIL */}
        <section id="email" className="form-section">
          <header className="form-section__head">
            <h2 className="form-section__title">
              Transactional <em>email</em>
            </h2>
            <span className="form-section__num">№ 01</span>
          </header>
          <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
            Resend configuration for order confirmations, status updates, and receipts. Changing the from-address requires re-verifying DNS records in your Resend dashboard.
          </p>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-field__label" htmlFor="email-from-name">
                From name
              </label>
              <input
                id="email-from-name"
                className="form-field__input"
                type="text"
                value={form.email_from_name ?? ''}
                onChange={(e) => patch({ email_from_name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="email-from">
                From address
              </label>
              <input
                id="email-from"
                className="form-field__input"
                type="email"
                value={form.email_from ?? ''}
                onChange={(e) => patch({ email_from: e.target.value })}
              />
            </div>
            <div className="form-field full" style={{ gridColumn: '1 / -1' }}>
              <label className="form-field__label" htmlFor="email-reply">
                Reply-to address
              </label>
              <input
                id="email-reply"
                className="form-field__input"
                type="email"
                value={form.email_reply_to ?? ''}
                onChange={(e) => patch({ email_reply_to: e.target.value })}
              />
            </div>
            <div className="form-field full" style={{ gridColumn: '1 / -1' }}>
              <label className="form-field__label" htmlFor="email-sig">
                Email signature / footer
              </label>
              <textarea
                id="email-sig"
                className="form-field__textarea"
                style={{ minHeight: 80 }}
                value={form.email_signature ?? ''}
                onChange={(e) => patch({ email_signature: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* ADMIN ACCOUNT */}
        <section id="account" className="form-section">
          <header className="form-section__head">
            <h2 className="form-section__title">
              Admin <em>account</em>
            </h2>
            <span className="form-section__num">№ 02</span>
          </header>
          <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
            Your account credentials. Email changes are made through Supabase Auth — head to your account&apos;s sign-in flow to update the email or password.
          </p>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-field__label" htmlFor="acct-name">
                Display name
              </label>
              <input id="acct-name" className="form-field__input" type="text" value={adminName} disabled />
              <p className="form-field__help">Edit via Supabase &gt; Auth &gt; Users.</p>
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="acct-email">
                Admin email
              </label>
              <input id="acct-email" className="form-field__input" type="email" value={adminEmail} disabled />
              <p className="form-field__help">Used for login + critical alerts.</p>
            </div>
          </div>
        </section>

        {/* DATA & EXPORT */}
        <section id="data" className="form-section">
          <header className="form-section__head">
            <h2 className="form-section__title">
              Data &amp; <em>export</em>
            </h2>
            <span className="form-section__num">№ 03</span>
          </header>
          <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
            Export your data at any time. Orders, customers and invoices are retained indefinitely (UK tax records); other data is removable on request.
          </p>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Rows</th>
                  <th>Last updated</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => (
                  <tr key={d.key}>
                    <td>
                      <b style={{ fontWeight: 500 }}>{d.label}</b>
                      <br />
                      <em style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                        {d.description}
                      </em>
                    </td>
                    <td>{d.rows.toLocaleString('en-GB')}</td>
                    <td>{d.lastUpdatedDisplay}</td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href={`/api/admin/export?dataset=${d.key}`}
                        className="receipt-btn"
                        style={{ padding: '8px 14px', fontSize: 12, textDecoration: 'none' }}
                      >
                        Export {d.format.toUpperCase()}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* DANGER ZONE */}
        <section
          id="danger"
          className="form-section"
          style={{ borderColor: 'rgba(139, 42, 26, 0.3)' }}
        >
          <header
            className="form-section__head"
            style={{ borderBottomColor: 'rgba(139, 42, 26, 0.25)' }}
          >
            <h2 className="form-section__title" style={{ color: '#8B2A1A' }}>
              Danger <em>zone</em>
            </h2>
            <span className="form-section__num" style={{ color: '#8B2A1A' }}>
              Permanent
            </span>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DangerCard
              title="Pause the site"
              body="Show a 'Closed for orders' message on every page. Existing orders continue normally — only new orders are blocked. Reverse this from /admin/settings."
              cta="Pause new orders"
              onClick={() => setPauseOpen(true)}
            />
            <DangerCard
              title="Transfer admin ownership"
              body="Make another email the primary admin. Manual process for v1 — message Seyi(seyispecial17@gmail.com) to action this with confirmation from both addresses."
              cta="Start transfer →"
              onClick={() => setTransferOpen(true)}
            />
            <DangerCard
              title="Delete all customer data"
              body="Remove all customer accounts, addresses, and personally identifiable data. Order records are anonymised but retained for legal / tax purposes. No undo."
              cta="Delete customer data"
              onClick={() => setPurgeOpen(true)}
            />
          </div>
        </section>
      </div>
    </div>

      {/* Sticky save bar — lives outside .settings-layout so it spans the
          full width of the admin panel instead of falling into a grid cell. */}
      <div
        className="sticky-save-bar"
        style={dirty ? undefined : { transform: 'translateY(100%)' }}
      >
        <div className="sticky-save-bar__inner">
          <span className="sticky-save-bar__left">
            <span className="unsaved-dot" />
            You have unsaved changes
          </span>
          <div className="sticky-save-bar__right">
            <button
              type="button"
              onClick={() => {
                setForm(initial);
                setDirty(false);
              }}
              className="receipt-btn"
              style={{ cursor: 'pointer' }}
            >
              Discard
            </button>
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
      </div>

      <ConfirmModal
        open={pauseOpen}
        onCancel={() => setPauseOpen(false)}
        onConfirm={pauseStore}
        pending={pending}
        tone="danger"
        eyebrow="Pause the kitchen"
        title={<>Pause <em>new orders?</em></>}
        body={
          <>
            The public menu becomes read-only and checkout is blocked. Existing orders continue as normal. You can re-open from <b>Settings → Operational toggles</b>.
          </>
        }
        confirmLabel="Yes, pause"
      />

      <ConfirmModal
        open={transferOpen}
        onCancel={() => setTransferOpen(false)}
        onConfirm={() => {
          toast.info('Ownership transfer is a manual process for v1 — message Seyi(seyispecial17@gmail.com) to action.');
          setTransferOpen(false);
        }}
        eyebrow="Transfer ownership"
        title={<>Start admin <em>transfer</em></>}
        body={
          <>
            For v1, ownership transfer requires manual action (confirmation from both the old and new addresses, a 24-hour cooling-off period, and database migration). Please coordinate with the engineering contact directly.
          </>
        }
        confirmLabel="Acknowledged"
      />

      <ConfirmModal
        open={purgeOpen}
        onCancel={() => setPurgeOpen(false)}
        onConfirm={() => {
          toast.info('Customer-data purge is a manual SQL operation. Coordinate with engineering.');
          setPurgeOpen(false);
        }}
        tone="danger"
        eyebrow="Permanent · No undo"
        title={<>Delete <em>all customer data?</em></>}
        body={
          <>
            This removes every customer account, address, and piece of PII. Order records are anonymised (line items + amounts retained) for UK tax record-keeping. <b>This is irreversible.</b> Coordinate with engineering — there&apos;s no in-app button for this in v1 by design.
          </>
        }
        confirmLabel="Acknowledged"
      />
    </>
  );
}

function DangerCard({
  title,
  body,
  cta,
  onClick,
}: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        padding: '16px 20px',
        background: 'rgba(139, 42, 26, 0.04)',
        border: '1px solid rgba(139, 42, 26, 0.2)',
        borderRadius: 2,
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 500,
          fontSize: 15,
          margin: '0 0 4px',
        }}
      >
        {title}
      </h3>
      <p className="t-body-muted" style={{ margin: '0 0 12px', fontSize: 13.5 }}>
        {body}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="admin-danger__btn"
        style={{ cursor: 'pointer' }}
      >
        {cta}
      </button>
    </div>
  );
}
