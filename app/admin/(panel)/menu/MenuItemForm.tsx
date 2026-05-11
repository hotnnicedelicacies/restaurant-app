'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import {
  archiveMenuItem,
  upsertMenuItem,
  type MenuItemFormData,
} from '@/lib/admin/catalogActions';
import type { VariantsBlob, AddonsBlob } from '@/lib/supabase/types';

interface Props {
  categories: { id: string; name: string }[];
  initial: (MenuItemFormData & { id: string }) | null;
}

const DEFAULT: MenuItemFormData = {
  categoryId: '',
  name: '',
  description: '',
  longDescription: '',
  priceGbp: 10,
  imagePath: null,
  isAvailableToday: true,
  isCodEligible: true,
  isFeatured: false,
  isHidden: false,
  dietaryTags: [],
  allergenTags: [],
  badges: [],
  variants: { groups: [] },
  addons: { items: [] },
  displayOrder: 99,
};

export default function MenuItemForm({ categories, initial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<MenuItemFormData>(
    initial ?? { ...DEFAULT, categoryId: categories[0]?.id ?? '' }
  );
  const [dirty, setDirty] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  function patch(p: Partial<MenuItemFormData>) {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!form.categoryId) {
      toast.error('Pick a category.');
      return;
    }
    start(async () => {
      const res = await upsertMenuItem({ ...form, id: initial?.id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(initial ? 'Item saved.' : 'Item created.');
      setDirty(false);
      if (!initial?.id && res.data?.id) {
        router.push(`/admin/menu/${res.data.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function handleArchive() {
    if (!initial?.id) return;
    start(async () => {
      const res = await archiveMenuItem(initial.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Item archived.');
      router.push('/admin/menu');
    });
  }

  return (
    <>
      <a href="/admin/menu" className="admin-detail__back">
        ← Back to menu
      </a>

      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">
            {initial ? 'Editing existing item' : 'New item'}
          </div>
          <h1 className="admin-page-head__title">
            {initial ? (
              <>
                Edit · <em>{form.name || 'Untitled'}</em>
              </>
            ) : (
              <>
                Add a <em>menu item</em>
              </>
            )}
          </h1>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        style={{ maxWidth: 880 }}
      >
        {/* ─── 1. BASICS ─── */}
        <section className="form-section">
          <header className="form-section__head">
            <h2 className="form-section__title">
              Item <em>basics</em>
            </h2>
            <span className="form-section__num">№ 01</span>
          </header>

          <div className="form-grid">
            <div className="form-field full" style={{ gridColumn: '1 / -1' }}>
              <label className="form-field__label" htmlFor="m-name">
                Item name
              </label>
              <input
                id="m-name"
                className="form-field__input"
                type="text"
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="e.g. Jollof Rice with Plantain"
              />
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="m-category">
                Category
              </label>
              <select
                id="m-category"
                className="form-field__input"
                value={form.categoryId}
                onChange={(e) => patch({ categoryId: e.target.value })}
              >
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="m-price">
                Base price <small>· before variants &amp; add-ons</small>
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
                  id="m-price"
                  className="form-field__input"
                  type="number"
                  min="0"
                  step="0.50"
                  value={form.priceGbp}
                  onChange={(e) => patch({ priceGbp: Number(e.target.value) })}
                  style={{ paddingLeft: 24 }}
                />
              </div>
            </div>
            <div className="form-field full" style={{ gridColumn: '1 / -1' }}>
              <label className="form-field__label" htmlFor="m-desc">
                Short description <small>· shown on menu rows &amp; Today&apos;s Bill of Fare</small>
              </label>
              <textarea
                id="m-desc"
                className="form-field__textarea"
                style={{ minHeight: 60 }}
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Smoky party rice with crispy bottom"
              />
            </div>
            <div className="form-field full" style={{ gridColumn: '1 / -1' }}>
              <label className="form-field__label" htmlFor="m-long">
                Long description <small>· item detail page · optional</small>
              </label>
              <textarea
                id="m-long"
                className="form-field__textarea"
                style={{ minHeight: 100 }}
                value={form.longDescription ?? ''}
                onChange={(e) => patch({ longDescription: e.target.value })}
                placeholder="The full story — what's in it, how it's cooked, what makes it special."
              />
            </div>
            <div className="form-field full" style={{ gridColumn: '1 / -1' }}>
              <label className="form-field__label" htmlFor="m-image">
                Primary photo path <small>· Supabase Storage key</small>
              </label>
              <input
                id="m-image"
                className="form-field__input"
                type="text"
                value={form.imagePath ?? ''}
                onChange={(e) => patch({ imagePath: e.target.value || null })}
                placeholder="menu/jollof.jpg"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <p className="form-field__help">
                Upload via the Supabase dashboard → menu-images bucket, then paste the path here (no leading slash).
              </p>
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="m-order">
                Display order
              </label>
              <input
                id="m-order"
                className="form-field__input"
                type="number"
                value={form.displayOrder}
                onChange={(e) => patch({ displayOrder: Number(e.target.value) })}
              />
              <p className="form-field__help">Lower numbers appear first in their category.</p>
            </div>
          </div>
        </section>

        {/* ─── 2. AVAILABILITY ─── */}
        <section className="form-section">
          <header className="form-section__head">
            <h2 className="form-section__title">
              Availability &amp; <em>visibility</em>
            </h2>
            <span className="form-section__num">№ 02</span>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <SwitchTile
              label="Available today"
              caption="Show on customer menu. Toggle off when sold out."
              checked={form.isAvailableToday}
              onChange={(v) => patch({ isAvailableToday: v })}
            />
            <SwitchTile
              label="Cash-on-Delivery eligible"
              caption="Whether COD payment is allowed for this item."
              checked={form.isCodEligible}
              onChange={(v) => patch({ isCodEligible: v })}
            />
            <SwitchTile
              label="Featured on homepage"
              caption={'Appears in "Today\'s Bill of Fare". Pick 4–6 max.'}
              checked={form.isFeatured}
              onChange={(v) => patch({ isFeatured: v })}
            />
            <SwitchTile
              label="Hide from customers"
              caption="Soft-hide for items you're testing. Receipts still show."
              checked={form.isHidden}
              onChange={(v) => patch({ isHidden: v })}
            />
          </div>
        </section>

        {/* ─── 3. TAGS ─── */}
        <section className="form-section">
          <header className="form-section__head">
            <h2 className="form-section__title">
              Tags &amp; <em>badges</em>
            </h2>
            <span className="form-section__num">№ 03</span>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-field">
              <label className="form-field__label">
                Dietary tags <small>· shown as chips on menu rows</small>
              </label>
              <ChipInput
                values={form.dietaryTags}
                onChange={(v) => patch({ dietaryTags: v })}
                placeholder="Type and press Enter…"
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">
                Allergen tags <small>· for customer disclosure</small>
              </label>
              <ChipInput
                values={form.allergenTags}
                onChange={(v) => patch({ allergenTags: v })}
                placeholder="Add allergen and press Enter…"
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">
                Editorial badges <small>· bronze labels on the menu row</small>
              </label>
              <ChipInput
                values={form.badges}
                onChange={(v) => patch({ badges: v })}
                placeholder="Add a badge…"
                chipClass="chip chip--badge"
              />
            </div>
          </div>
        </section>

        {/* ─── 4. VARIANTS ─── */}
        <section className="form-section">
          <header className="form-section__head">
            <h2 className="form-section__title">
              Variant <em>groups</em>
            </h2>
            <span className="form-section__num">№ 04</span>
          </header>
          <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
            Customers choose one option per group at checkout. Use groups for choices like protein, size, or spice level — anything that <em>must</em> be selected. Use <b style={{ color: 'var(--color-walnut)', fontStyle: 'normal', fontVariant: 'small-caps', letterSpacing: '0.06em' }}>Add-ons</b> below for optional extras.
          </p>

          <VariantsEditor variants={form.variants} onChange={(v) => patch({ variants: v })} />
        </section>

        {/* ─── 5. ADD-ONS ─── */}
        <section className="form-section">
          <header className="form-section__head">
            <h2 className="form-section__title">
              Add-ons <em>(optional extras)</em>
            </h2>
            <span className="form-section__num">№ 05</span>
          </header>
          <p className="t-body-muted" style={{ margin: '0 0 18px' }}>
            Optional extras the customer can tick to add on. Use for "extra plantain", "side of moi moi", "boiled egg" — anything they pay extra for but isn&apos;t required.
          </p>

          <AddonsEditor addons={form.addons} onChange={(a) => patch({ addons: a })} />
        </section>

        {/* ─── 6. DANGER ─── */}
        {initial && (
          <div className="admin-danger">
            <h3 className="admin-danger__title">Archive this item</h3>
            <p className="admin-danger__body">
              Archived items disappear from the customer site but stay in our records (so past receipts still show them correctly). Reversible.
            </p>
            <div className="admin-danger__actions">
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                disabled={pending}
                className="admin-danger__btn"
                style={{ cursor: pending ? 'wait' : 'pointer' }}
              >
                Archive item
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Sticky save bar */}
      <div
        className="sticky-save-bar"
        style={dirty ? undefined : { transform: 'translateY(100%)' }}
      >
        <div className="container sticky-save-bar__inner">
          <span className="sticky-save-bar__left">
            <span className="unsaved-dot" />
            {dirty ? 'You have unsaved changes' : 'No changes'}
          </span>
          <div className="sticky-save-bar__right">
            <a href="/admin/menu" className="receipt-btn" style={{ textDecoration: 'none' }}>
              Discard
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || !dirty}
              className="receipt-btn receipt-btn--primary"
              style={{ cursor: pending ? 'wait' : !dirty ? 'not-allowed' : 'pointer', opacity: !dirty ? 0.55 : 1 }}
            >
              {pending ? 'Saving…' : initial ? 'Save changes' : 'Create item'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={archiveOpen}
        onCancel={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        pending={pending}
        tone="danger"
        eyebrow="Archive menu item"
        title={<>Archive <em>{form.name}?</em></>}
        body={
          <>
            The item disappears from the customer site immediately but stays linked to past orders and receipts. Restore from the menu list at any time.
          </>
        }
        confirmLabel="Yes, archive"
      />
    </>
  );
}

function SwitchTile({
  label,
  caption,
  checked,
  onChange,
}: {
  label: string;
  caption: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '14px 16px',
        background: 'var(--color-cream-soft)',
        borderRadius: 2,
        cursor: 'pointer',
      }}
    >
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch__track">
          <span className="switch__thumb" />
        </span>
      </span>
      <span className="switch-with-label__text">
        <b style={{ fontWeight: 500 }}>{label}</b>
        <br />
        <em>{caption}</em>
      </span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ChipInput — type-and-Enter or click × to remove
// ─────────────────────────────────────────────────────────────────────

function ChipInput({
  values,
  onChange,
  placeholder,
  chipClass = 'chip',
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  chipClass?: string;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const v = draft.trim();
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
        <span key={v} className={chipClass}>
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
        placeholder={placeholder}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// VariantsEditor — uses editor-group / option-row classes from design
// ─────────────────────────────────────────────────────────────────────

function VariantsEditor({
  variants,
  onChange,
}: {
  variants: VariantsBlob;
  onChange: (v: VariantsBlob) => void;
}) {
  function addGroup() {
    onChange({
      groups: [
        ...variants.groups,
        { name: 'New group', is_required: false, is_single_choice: true, options: [] },
      ],
    });
  }
  function patchGroup(idx: number, p: Partial<VariantsBlob['groups'][number]>) {
    const next = [...variants.groups];
    next[idx] = { ...next[idx], ...p };
    onChange({ groups: next });
  }
  function removeGroup(idx: number) {
    onChange({ groups: variants.groups.filter((_, i) => i !== idx) });
  }
  function addOption(gIdx: number) {
    patchGroup(gIdx, {
      options: [...variants.groups[gIdx].options, { label: '', price_delta_gbp: 0 }],
    });
  }
  function patchOption(
    gIdx: number,
    oIdx: number,
    p: Partial<VariantsBlob['groups'][number]['options'][number]>
  ) {
    const opts = [...variants.groups[gIdx].options];
    opts[oIdx] = { ...opts[oIdx], ...p };
    patchGroup(gIdx, { options: opts });
  }
  function removeOption(gIdx: number, oIdx: number) {
    patchGroup(gIdx, { options: variants.groups[gIdx].options.filter((_, i) => i !== oIdx) });
  }

  return (
    <>
      {variants.groups.length === 0 && (
        <p className="t-body-muted" style={{ marginBottom: 14 }}>
          No variants yet. Most items don&apos;t need any — add a group only if you&apos;re offering size choices, spice levels, or similar.
        </p>
      )}

      {variants.groups.map((g, gIdx) => (
        <div className="editor-group" key={gIdx}>
          <header className="editor-group__head">
            <div className="editor-group__title-row">
              <input
                type="text"
                className="editor-group__name"
                value={g.name}
                onChange={(e) => patchGroup(gIdx, { name: e.target.value })}
              />
              <div className="editor-group__settings">
                <label>
                  <input
                    type="checkbox"
                    checked={g.is_required}
                    onChange={(e) => patchGroup(gIdx, { is_required: e.target.checked })}
                  />{' '}
                  Required
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={g.is_single_choice ?? true}
                    onChange={(e) => patchGroup(gIdx, { is_single_choice: e.target.checked })}
                  />{' '}
                  Choose one
                </label>
              </div>
            </div>
            <button
              type="button"
              className="editor-group__remove"
              onClick={() => removeGroup(gIdx)}
            >
              Remove group
            </button>
          </header>

          <div className="option-rows">
            {g.options.map((o, oIdx) => (
              <div className="option-row" key={oIdx}>
                <span className="option-row__drag" aria-hidden>⋮⋮</span>
                <input
                  type="text"
                  className="option-row__input"
                  value={o.label}
                  onChange={(e) => patchOption(gIdx, oIdx, { label: e.target.value })}
                  placeholder="Option label"
                />
                <div className="option-row__money-wrap">
                  <span className="option-row__money-prefix">+£</span>
                  <input
                    type="number"
                    step="0.50"
                    className="option-row__input option-row__input--money"
                    value={o.price_delta_gbp}
                    onChange={(e) =>
                      patchOption(gIdx, oIdx, { price_delta_gbp: Number(e.target.value) })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="option-row__remove"
                  onClick={() => removeOption(gIdx, oIdx)}
                  aria-label="Remove option"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="editor-group__add-option"
            onClick={() => addOption(gIdx)}
          >
            + Add option
          </button>
        </div>
      ))}

      <button type="button" className="add-group-btn" onClick={addGroup}>
        + Add a new variant group
      </button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// AddonsEditor — single editor-group with option-row--with-desc rows
// ─────────────────────────────────────────────────────────────────────

function AddonsEditor({
  addons,
  onChange,
}: {
  addons: AddonsBlob;
  onChange: (a: AddonsBlob) => void;
}) {
  function add() {
    onChange({
      items: [...addons.items, { label: '', description: '', price_delta_gbp: 0 }],
    });
  }
  function patchItem(idx: number, p: Partial<AddonsBlob['items'][number]>) {
    const next = [...addons.items];
    next[idx] = { ...next[idx], ...p };
    onChange({ items: next });
  }
  function remove(idx: number) {
    onChange({ items: addons.items.filter((_, i) => i !== idx) });
  }

  return (
    <div className="editor-group">
      <div className="option-rows">
        {addons.items.length === 0 && (
          <p className="t-body-muted" style={{ margin: '0 0 12px' }}>
            No add-ons yet.
          </p>
        )}
        {addons.items.map((a, idx) => (
          <div className="option-row option-row--with-desc" key={idx}>
            <span className="option-row__drag" aria-hidden>⋮⋮</span>
            <input
              type="text"
              className="option-row__input"
              value={a.label}
              onChange={(e) => patchItem(idx, { label: e.target.value })}
              placeholder="Name"
            />
            <input
              type="text"
              className="option-row__input"
              value={a.description ?? ''}
              onChange={(e) => patchItem(idx, { description: e.target.value })}
              placeholder="Short description"
            />
            <div className="option-row__money-wrap">
              <span className="option-row__money-prefix">+£</span>
              <input
                type="number"
                step="0.50"
                className="option-row__input option-row__input--money"
                value={a.price_delta_gbp}
                onChange={(e) => patchItem(idx, { price_delta_gbp: Number(e.target.value) })}
              />
            </div>
            <button
              type="button"
              className="option-row__remove"
              onClick={() => remove(idx)}
              aria-label="Remove add-on"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="editor-group__add-option" onClick={add}>
        + Add an add-on
      </button>
    </div>
  );
}
