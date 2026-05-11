'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import {
  archiveCategory,
  createCategory,
  updateCategory,
} from '@/lib/admin/catalogActions';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isVisible: boolean;
  itemCount?: number;
}

interface CategoryDraft {
  id?: string;
  name: string;
  description: string;
  displayOrder: number;
}

export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);

  function openNew() {
    setDraft({ name: '', description: '', displayOrder: categories.length + 1 });
  }
  function openEdit(c: Category) {
    setDraft({ id: c.id, name: c.name, description: c.description ?? '', displayOrder: c.displayOrder });
  }

  function handleSave() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    start(async () => {
      const res = draft.id
        ? await updateCategory({
            id: draft.id,
            name: draft.name,
            description: draft.description,
            displayOrder: draft.displayOrder,
          })
        : await createCategory({
            name: draft.name,
            description: draft.description,
            displayOrder: draft.displayOrder,
          });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(draft.id ? 'Category saved.' : 'Category created.');
      setDraft(null);
      router.refresh();
    });
  }

  function handleToggle(id: string, isVisible: boolean) {
    start(async () => {
      const res = await updateCategory({ id, isVisible });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleArchive() {
    if (!archiveTarget) return;
    start(async () => {
      const res = await archiveCategory(archiveTarget.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Category archived.');
      setArchiveTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </div>
          <h1 className="admin-page-head__title">
            Menu <em>categories</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <button
            type="button"
            onClick={openNew}
            className="receipt-btn receipt-btn--primary"
            style={{ cursor: 'pointer' }}
          >
            + Add category
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
            How categories work.
          </b>
        </p>
        <p className="t-body-muted" style={{ margin: 0 }}>
          Categories group menu items on the customer menu page. Display order is what customers see. Items keep their category assignment when a category is renamed; archiving a category hides all its items from the customer site.
        </p>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Order</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Items</th>
              <th>Description</th>
              <th style={{ textAlign: 'center' }}>Visible</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <p className="t-body-muted">No categories yet — add one to get started.</p>
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="t-mono">{String(c.displayOrder).padStart(2, '0')}</span>
                  </td>
                  <td>
                    <b style={{ fontWeight: 500 }}>{c.name}</b>
                  </td>
                  <td>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-muted)' }}>
                      {c.slug}
                    </code>
                  </td>
                  <td>
                    {c.itemCount ?? 0} {(c.itemCount ?? 0) === 1 ? 'item' : 'items'}
                  </td>
                  <td className="admin-table__items">{c.description || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="switch" style={{ cursor: pending ? 'wait' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={c.isVisible}
                        disabled={pending}
                        onChange={(e) => handleToggle(c.id, e.target.checked)}
                      />
                      <span className="switch__track">
                        <span className="switch__thumb" />
                      </span>
                    </label>
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="admin-table__action"
                      style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveTarget(c)}
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

      {/* Add / Edit modal */}
      <ConfirmModal
        open={draft !== null}
        onCancel={() => setDraft(null)}
        onConfirm={handleSave}
        pending={pending}
        eyebrow={draft?.id ? 'Edit category' : 'New category'}
        title={
          draft?.id ? (
            <>
              Edit <em>{draft.name || 'category'}</em>
            </>
          ) : (
            <>
              Add a <em>category</em>
            </>
          )
        }
        body={
          draft?.id ? null : (
            <>
              Categories group menu items on the public menu page. The slug is auto-derived from the name.
            </>
          )
        }
        inputSlot={
          draft && (
            <>
              <label className="form-field__label" htmlFor="cat-name">
                Name
              </label>
              <input
                id="cat-name"
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Italian classics"
                className="form-field__input"
                autoFocus
              />
              <label className="form-field__label" htmlFor="cat-desc" style={{ marginTop: 14 }}>
                Description <small>· optional</small>
              </label>
              <input
                id="cat-desc"
                type="text"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Short one-liner shown under the section header"
                className="form-field__input"
              />
              <label className="form-field__label" htmlFor="cat-order" style={{ marginTop: 14 }}>
                Display order
              </label>
              <input
                id="cat-order"
                type="number"
                value={draft.displayOrder}
                onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) })}
                className="form-field__input"
              />
            </>
          )
        }
        confirmLabel={pending ? 'Saving…' : draft?.id ? 'Save changes' : 'Create category'}
      />

      {/* Archive modal */}
      <ConfirmModal
        open={archiveTarget !== null}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        pending={pending}
        tone="danger"
        eyebrow="Archive category"
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
              {archiveTarget.itemCount && archiveTarget.itemCount > 0 ? (
                <>
                  <b>{archiveTarget.itemCount}</b> item{archiveTarget.itemCount === 1 ? '' : 's'} in this category will be hidden from the customer menu. The items themselves are kept (linked to past orders) and can be moved to another category.
                </>
              ) : (
                <>This category is empty. Archiving removes it from the public menu and the admin lists.</>
              )}
            </>
          )
        }
        confirmLabel="Yes, archive"
      />
    </>
  );
}
