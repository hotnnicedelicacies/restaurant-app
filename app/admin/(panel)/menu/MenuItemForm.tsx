'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

const DIETARY = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'halal', 'spicy'];
const ALLERGENS = ['gluten', 'dairy', 'eggs', 'soy', 'peanuts', 'tree-nuts', 'fish', 'shellfish', 'sesame', 'sulphites'];

export default function MenuItemForm({ categories, initial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<MenuItemFormData>(initial ?? { ...DEFAULT, categoryId: categories[0]?.id ?? '' });

  function patch(p: Partial<MenuItemFormData>) {
    setForm((f) => ({ ...f, ...p }));
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
      if (!initial?.id && res.data?.id) {
        router.push(`/admin/menu/${res.data.id}`);
      } else {
        router.refresh();
      }
    });
  }

  function handleArchive() {
    if (!initial?.id) return;
    if (!confirm('Archive this item? It will no longer appear on the menu.')) return;
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
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">
            {initial ? 'Edit menu item' : 'New menu item'}
          </div>
          <h1 className="admin-page-head__title">
            {initial ? <>Edit · <em>{form.name || 'Untitled'}</em></> : <>Add a <em>menu item</em></>}
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
            {pending ? 'Saving…' : initial ? 'Save changes' : 'Create item'}
          </button>
        </div>
      </div>

    <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card title={<>Basics</>} num="№ 01">
          <Row label="Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. Sunday jollof"
              className="form-field__input"
            />
          </Row>
          <Row label="Category">
            <select
              value={form.categoryId}
              onChange={(e) => patch({ categoryId: e.target.value })}
              className="form-field__input"
            >
              <option value="">— Select —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Row>
          <Row label="Short description (one line)">
            <input
              type="text"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Smoky party rice with crispy bottom"
              className="form-field__input"
            />
          </Row>
          <Row label="Long description (item page)">
            <textarea
              rows={4}
              value={form.longDescription ?? ''}
              onChange={(e) => patch({ longDescription: e.target.value })}
              placeholder="The full story — what's in it, how it's cooked, what makes it special."
              className="form-field__textarea"
            />
          </Row>
          <Row label="Image path (Supabase storage key)">
            <input
              type="text"
              value={form.imagePath ?? ''}
              onChange={(e) => patch({ imagePath: e.target.value || null })}
              placeholder="menu/jollof.jpg"
              className="form-field__input"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <p className="mt-1 font-mono text-[10px] italic text-ink-muted">
              Upload via the Supabase dashboard → menu-images bucket. Paste the path here (no leading slash).
            </p>
          </Row>
        </Card>

        <Card title={<>Variants</>} num="№ 02" subtitle="Choice groups like Size or Spice. Each option adds (or subtracts) from the base price.">
          <VariantsEditor variants={form.variants} onChange={(v) => patch({ variants: v })} />
        </Card>

        <Card title={<>Add-ons</>} num="№ 03" subtitle="Optional extras the customer can tick. Each adds to the price.">
          <AddonsEditor addons={form.addons} onChange={(a) => patch({ addons: a })} />
        </Card>

        <Card title={<>Tags &amp; badges</>} num="№ 04">
          <Row label="Dietary">
            <TagPicker
              options={DIETARY}
              selected={form.dietaryTags}
              onChange={(t) => patch({ dietaryTags: t })}
            />
          </Row>
          <Row label="Allergens">
            <TagPicker
              options={ALLERGENS}
              selected={form.allergenTags}
              onChange={(t) => patch({ allergenTags: t })}
            />
          </Row>
          <Row label="Editorial badges (free-form)">
            <input
              type="text"
              value={form.badges.join(', ')}
              onChange={(e) => patch({ badges: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="House favourite, Chef's pick"
              className="form-field__input"
            />
          </Row>
        </Card>
      </div>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 120, alignSelf: 'start' }}>
        <Card title={<>Publishing</>} num="№ 05">
          <Row label="Base price (£)">
            <input
              type="number"
              step="0.5"
              min="0"
              value={form.priceGbp}
              onChange={(e) => patch({ priceGbp: Number(e.target.value) })}
              className="form-field__input"
            />
          </Row>
          <Row label="Display order">
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) => patch({ displayOrder: Number(e.target.value) })}
              className="form-field__input"
            />
          </Row>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <Check label="Available today" value={form.isAvailableToday} onChange={(v) => patch({ isAvailableToday: v })} />
            <Check label="Cash on delivery eligible" value={form.isCodEligible} onChange={(v) => patch({ isCodEligible: v })} />
            <Check label="Featured on homepage" value={form.isFeatured} onChange={(v) => patch({ isFeatured: v })} />
            <Check label="Hidden (not shown publicly)" value={form.isHidden} onChange={(v) => patch({ isHidden: v })} />
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="receipt-btn receipt-btn--primary"
              style={{ cursor: pending ? 'wait' : 'pointer' }}
            >
              {pending ? 'Saving…' : initial ? 'Save changes' : 'Create item'}
            </button>
            {initial && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={pending}
                className="admin-danger__btn"
                style={{ cursor: pending ? 'wait' : 'pointer' }}
              >
                Archive item
              </button>
            )}
          </div>
        </Card>
      </aside>
    </div>
    </>
  );
}

function Card({
  title,
  subtitle,
  num,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  num?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <header className="form-section__head">
        <h2 className="form-section__title">{title}</h2>
        {num && <span className="form-section__num">{num}</span>}
      </header>
      {subtitle && (
        <p className="t-body-muted" style={{ margin: '0 0 16px' }}>
          {subtitle}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      {children}
    </div>
  );
}

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[16px] w-[16px] accent-walnut"
      />
      {label}
    </label>
  );
}

function TagPicker({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((t) => {
        const isOn = selected.includes(t);
        return (
          <button
            type="button"
            key={t}
            onClick={() => onChange(isOn ? selected.filter((x) => x !== t) : [...selected, t])}
            className={`rounded-[2px] border px-3 py-1 font-serif text-[12.5px] tracking-[0.04em] transition-colors ${
              isOn ? 'border-walnut bg-walnut text-cream' : 'border-rule bg-cream-soft text-walnut hover:border-walnut'
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Variants editor
// ─────────────────────────────────────────────────────────────────────

function VariantsEditor({ variants, onChange }: { variants: VariantsBlob; onChange: (v: VariantsBlob) => void }) {
  function addGroup() {
    onChange({
      groups: [
        ...variants.groups,
        { name: 'New group', is_required: false, is_single_choice: true, options: [] },
      ],
    });
  }
  function patchGroup(idx: number, patch: Partial<VariantsBlob['groups'][number]>) {
    const next = [...variants.groups];
    next[idx] = { ...next[idx], ...patch };
    onChange({ groups: next });
  }
  function removeGroup(idx: number) {
    onChange({ groups: variants.groups.filter((_, i) => i !== idx) });
  }
  function addOption(gIdx: number) {
    patchGroup(gIdx, { options: [...variants.groups[gIdx].options, { label: '', price_delta_gbp: 0 }] });
  }
  function patchOption(gIdx: number, oIdx: number, patch: Partial<VariantsBlob['groups'][number]['options'][number]>) {
    const opts = [...variants.groups[gIdx].options];
    opts[oIdx] = { ...opts[oIdx], ...patch };
    patchGroup(gIdx, { options: opts });
  }
  function removeOption(gIdx: number, oIdx: number) {
    patchGroup(gIdx, { options: variants.groups[gIdx].options.filter((_, i) => i !== oIdx) });
  }

  return (
    <div className="flex flex-col gap-4">
      {variants.groups.length === 0 && (
        <p className="m-0 font-serif text-[13px] italic text-ink-muted">
          No variants yet. Most items don't need any — add a group only if you're offering size choices, spice levels, or similar.
        </p>
      )}
      {variants.groups.map((g, gIdx) => (
        <div key={gIdx} className="rounded-[2px] border border-rule bg-cream-soft p-3">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input
              type="text"
              value={g.name}
              onChange={(e) => patchGroup(gIdx, { name: e.target.value })}
              placeholder="Group name (e.g. Size)"
              className="rounded-[2px] border border-rule bg-cream px-2 py-1.5 font-serif text-[14px] font-medium text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
            />
            <label className="flex items-center gap-2 font-serif text-[12px] italic text-ink-muted">
              <input
                type="checkbox"
                checked={g.is_required}
                onChange={(e) => patchGroup(gIdx, { is_required: e.target.checked })}
                className="h-[16px] w-[16px] accent-walnut"
              />
              Required
            </label>
            <label className="flex items-center gap-2 font-serif text-[12px] italic text-ink-muted">
              <input
                type="checkbox"
                checked={g.is_single_choice ?? true}
                onChange={(e) => patchGroup(gIdx, { is_single_choice: e.target.checked })}
                className="h-[16px] w-[16px] accent-walnut"
              />
              Single choice
            </label>
            <button
              type="button"
              onClick={() => removeGroup(gIdx)}
              className="rounded-[2px] border border-danger bg-transparent px-2 py-1 font-serif text-[10.5px] font-semibold uppercase tracking-[0.14em] text-danger [font-variant:small-caps] hover:bg-danger hover:text-cream"
            >
              Remove
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {g.options.map((o, oIdx) => (
              <div key={oIdx} className="grid grid-cols-[1fr_120px_auto] items-center gap-2">
                <input
                  type="text"
                  value={o.label}
                  onChange={(e) => patchOption(gIdx, oIdx, { label: e.target.value })}
                  placeholder="Option label"
                  className="rounded-[2px] border border-rule bg-cream px-2 py-1.5 font-serif text-[13.5px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
                />
                <input
                  type="number"
                  step="0.5"
                  value={o.price_delta_gbp}
                  onChange={(e) => patchOption(gIdx, oIdx, { price_delta_gbp: Number(e.target.value) })}
                  className="rounded-[2px] border border-rule bg-cream px-2 py-1.5 font-mono text-[13px] text-walnut outline-none focus:border-walnut"
                />
                <button
                  type="button"
                  onClick={() => removeOption(gIdx, oIdx)}
                  className="rounded-[2px] border border-danger bg-transparent px-2 py-1 font-serif text-[10.5px] font-semibold uppercase tracking-[0.14em] text-danger [font-variant:small-caps] hover:bg-danger hover:text-cream"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(gIdx)}
              className="self-start rounded-[2px] border border-walnut bg-transparent px-3 py-1 font-serif text-[11px] font-semibold uppercase tracking-[0.14em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
            >
              + Option
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addGroup}
        className="self-start rounded-[2px] bg-walnut px-4 py-2 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep"
      >
        + Variant group
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Addons editor
// ─────────────────────────────────────────────────────────────────────

function AddonsEditor({ addons, onChange }: { addons: AddonsBlob; onChange: (a: AddonsBlob) => void }) {
  function add() {
    onChange({ items: [...addons.items, { label: '', description: '', price_delta_gbp: 0 }] });
  }
  function patch(idx: number, p: Partial<AddonsBlob['items'][number]>) {
    const next = [...addons.items];
    next[idx] = { ...next[idx], ...p };
    onChange({ items: next });
  }
  function remove(idx: number) {
    onChange({ items: addons.items.filter((_, i) => i !== idx) });
  }
  return (
    <div className="flex flex-col gap-2">
      {addons.items.length === 0 && (
        <p className="m-0 font-serif text-[13px] italic text-ink-muted">
          No add-ons. Use these for sides, drinks, or extras that customers can tick on.
        </p>
      )}
      {addons.items.map((a, idx) => (
        <div key={idx} className="grid grid-cols-1 gap-2 rounded-[2px] border border-rule bg-cream-soft p-2 sm:grid-cols-[1fr_1.4fr_120px_auto]">
          <input
            type="text"
            value={a.label}
            onChange={(e) => patch(idx, { label: e.target.value })}
            placeholder="Label (e.g. Plantain)"
            className="rounded-[2px] border border-rule bg-cream px-2 py-1.5 font-serif text-[13.5px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
          />
          <input
            type="text"
            value={a.description ?? ''}
            onChange={(e) => patch(idx, { description: e.target.value })}
            placeholder="Short description (optional)"
            className="rounded-[2px] border border-rule bg-cream px-2 py-1.5 font-serif text-[13px] italic text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
          />
          <input
            type="number"
            step="0.5"
            value={a.price_delta_gbp}
            onChange={(e) => patch(idx, { price_delta_gbp: Number(e.target.value) })}
            className="rounded-[2px] border border-rule bg-cream px-2 py-1.5 font-mono text-[13px] text-walnut outline-none focus:border-walnut"
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="rounded-[2px] border border-danger bg-transparent px-2 py-1 font-serif text-[10.5px] font-semibold uppercase tracking-[0.14em] text-danger [font-variant:small-caps] hover:bg-danger hover:text-cream"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start rounded-[2px] bg-walnut px-4 py-2 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep"
      >
        + Add-on
      </button>
    </div>
  );
}
