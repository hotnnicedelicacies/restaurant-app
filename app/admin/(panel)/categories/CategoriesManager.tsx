'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(name: string, description: string) {
    if (!name.trim()) return;
    start(async () => {
      const res = await createCategory({
        name,
        description,
        displayOrder: categories.length + 1,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Category created.');
      setShowCreate(false);
      router.refresh();
    });
  }

  function handlePatch(
    id: string,
    patch: { name?: string; description?: string; displayOrder?: number; isVisible?: boolean }
  ) {
    start(async () => {
      const res = await updateCategory({ id, ...patch });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleArchive(id: string) {
    if (!confirm('Archive this category? Items in it will be hidden from the menu.')) return;
    start(async () => {
      const res = await archiveCategory(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Category archived.');
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
            onClick={() => setShowCreate(true)}
            className="receipt-btn receipt-btn--primary"
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
          Categories group menu items on the customer menu page. Reorder is by display order. Items keep their category assignment when a category is renamed; archiving a category hides all its items from the customer site.
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
              categories.map((c) =>
                editingId === c.id ? (
                  <CategoryEditRow
                    key={c.id}
                    category={c}
                    pending={pending}
                    onSave={(patch) => {
                      handlePatch(c.id, patch);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    pending={pending}
                    onEdit={() => setEditingId(c.id)}
                    onToggleVisible={(v) => handlePatch(c.id, { isVisible: v })}
                    onArchive={() => handleArchive(c.id)}
                  />
                )
              )
            )}
            {showCreate && (
              <NewCategoryRow
                pending={pending}
                onSave={(name, description) => handleCreate(name, description)}
                onCancel={() => setShowCreate(false)}
              />
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CategoryRow({
  category,
  pending,
  onEdit,
  onToggleVisible,
  onArchive,
}: {
  category: Category;
  pending: boolean;
  onEdit: () => void;
  onToggleVisible: (v: boolean) => void;
  onArchive: () => void;
}) {
  return (
    <tr>
      <td>
        <span className="t-mono">{String(category.displayOrder).padStart(2, '0')}</span>
      </td>
      <td>
        <b style={{ fontWeight: 500 }}>{category.name}</b>
      </td>
      <td>
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-muted)' }}>
          {category.slug}
        </code>
      </td>
      <td>{category.itemCount ?? 0} items</td>
      <td className="admin-table__items">{category.description || '—'}</td>
      <td style={{ textAlign: 'center' }}>
        <label className="switch" style={{ cursor: pending ? 'wait' : 'pointer' }}>
          <input
            type="checkbox"
            checked={category.isVisible}
            disabled={pending}
            onChange={(e) => onToggleVisible(e.target.checked)}
          />
          <span className="switch__track">
            <span className="switch__thumb" />
          </span>
        </label>
      </td>
      <td className="admin-table__actions">
        <button
          type="button"
          onClick={onEdit}
          className="admin-table__action"
          style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onArchive}
          className="admin-table__action menu-admin-table__action--danger"
          style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
          disabled={pending}
        >
          Archive
        </button>
      </td>
    </tr>
  );
}

function CategoryEditRow({
  category,
  pending,
  onSave,
  onCancel,
}: {
  category: Category;
  pending: boolean;
  onSave: (patch: { name: string; description: string; displayOrder: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? '');
  const [order, setOrder] = useState(category.displayOrder);

  return (
    <tr style={{ background: 'var(--color-cream-soft)' }}>
      <td>
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          style={{
            width: 50,
            padding: '6px 8px',
            border: '1px solid var(--color-rule)',
            borderRadius: 2,
            background: 'var(--color-cream)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--color-walnut)',
          }}
        />
      </td>
      <td>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          style={EDIT_INPUT}
        />
      </td>
      <td>
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-muted)' }}>
          {category.slug}
        </code>
      </td>
      <td>—</td>
      <td>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          style={EDIT_INPUT}
        />
      </td>
      <td />
      <td className="admin-table__actions">
        <button
          type="button"
          onClick={() => onSave({ name, description, displayOrder: order })}
          disabled={pending || !name.trim()}
          className="receipt-btn receipt-btn--primary"
          style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="admin-table__action"
          style={{ background: 'transparent', border: 0, cursor: 'pointer', marginLeft: 10 }}
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}

function NewCategoryRow({
  pending,
  onSave,
  onCancel,
}: {
  pending: boolean;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <tr style={{ background: 'var(--color-cream-soft)' }}>
      <td>
        <span className="t-mono">NEW</span>
      </td>
      <td>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Italian classics"
          autoFocus
          style={EDIT_INPUT}
        />
      </td>
      <td>
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-muted)' }}>
          auto
        </code>
      </td>
      <td>—</td>
      <td>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional short description"
          style={EDIT_INPUT}
        />
      </td>
      <td />
      <td className="admin-table__actions">
        <button
          type="button"
          onClick={() => onSave(name, description)}
          disabled={pending || !name.trim()}
          className="receipt-btn receipt-btn--primary"
          style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="admin-table__action"
          style={{ background: 'transparent', border: 0, cursor: 'pointer', marginLeft: 10 }}
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}

const EDIT_INPUT: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid var(--color-rule)',
  borderRadius: 2,
  background: 'var(--color-cream)',
  fontFamily: 'var(--font-serif)',
  fontSize: 14,
  color: 'var(--color-walnut)',
};
