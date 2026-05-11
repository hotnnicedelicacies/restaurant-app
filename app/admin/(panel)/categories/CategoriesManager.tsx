'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { archiveCategory, createCategory, updateCategory } from '@/lib/admin/catalogActions';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isVisible: boolean;
}

export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function handleCreate() {
    if (!newName.trim()) return;
    start(async () => {
      const res = await createCategory({
        name: newName,
        description: newDesc,
        displayOrder: categories.length + 1,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Category created.');
      setNewName('');
      setNewDesc('');
      router.refresh();
    });
  }

  function handlePatch(
    id: string,
    patch: { name?: string; description?: string; displayOrder?: number; isVisible?: boolean }
  ) {
    start(async () => {
      const res = await updateCategory({ id, ...patch });
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  function handleArchive(id: string) {
    if (!confirm('Archive this category? Items in it will be hidden from the menu.')) return;
    start(async () => {
      const res = await archiveCategory(id);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success('Category archived.');
        router.refresh();
      }
    });
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-[2px] border border-rule bg-cream">
        <table className="w-full border-collapse">
          <thead className="bg-cream-soft">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-bronze-deep">
              <th className="px-4 py-3 font-normal">Order</th>
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Description</th>
              <th className="px-4 py-3 font-normal">Visible</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="font-serif text-[13.5px] text-walnut">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center italic text-ink-muted">
                  No categories yet. Add one on the right.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <CategoryRow key={c.id} category={c} onPatch={handlePatch} onArchive={handleArchive} pending={pending} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <aside className="rounded-[2px] border border-rule bg-cream p-5">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Add category</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Italian classics"
            className="rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
          />
          <textarea
            rows={2}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Optional short description"
            className="resize-none rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={pending || !newName.trim()}
            className="rounded-[2px] bg-walnut px-4 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Add category'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function CategoryRow({
  category,
  onPatch,
  onArchive,
  pending,
}: {
  category: Category;
  onPatch: (id: string, patch: { name?: string; description?: string; displayOrder?: number; isVisible?: boolean }) => void;
  onArchive: (id: string) => void;
  pending: boolean;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? '');
  const [order, setOrder] = useState(category.displayOrder);

  const isDirty = name !== category.name || description !== (category.description ?? '') || order !== category.displayOrder;

  return (
    <tr className="border-t border-rule align-top">
      <td className="px-3 py-2">
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="w-14 rounded-[2px] border border-rule bg-cream-soft px-2 py-1 font-mono text-[12px] text-walnut outline-none focus:border-walnut"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[2px] border border-rule bg-cream-soft px-2 py-1 font-serif text-[13.5px] text-walnut outline-none focus:border-walnut"
        />
        <div className="mt-0.5 font-mono text-[10px] text-ink-muted">/{category.slug}</div>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-[2px] border border-rule bg-cream-soft px-2 py-1 font-serif text-[13.5px] italic text-walnut outline-none focus:border-walnut placeholder:text-ink-muted"
          placeholder="Optional"
        />
      </td>
      <td className="px-3 py-2">
        <label className="flex cursor-pointer items-center gap-2 font-serif text-[12.5px] italic text-ink-muted">
          <input
            type="checkbox"
            checked={category.isVisible}
            onChange={(e) => onPatch(category.id, { isVisible: e.target.checked })}
            className="h-[16px] w-[16px] accent-walnut"
          />
          {category.isVisible ? 'Visible' : 'Hidden'}
        </label>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={() => onPatch(category.id, { name, description, displayOrder: order })}
              disabled={pending}
              className="rounded-[2px] bg-walnut px-3 py-1 font-serif text-[11px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep disabled:opacity-50"
            >
              Save
            </button>
          )}
          <button
            type="button"
            onClick={() => onArchive(category.id)}
            disabled={pending}
            className="rounded-[2px] border border-danger bg-transparent px-3 py-1 font-serif text-[11px] font-semibold uppercase tracking-[0.16em] text-danger [font-variant:small-caps] hover:bg-danger hover:text-cream disabled:opacity-50"
          >
            Archive
          </button>
        </div>
      </td>
    </tr>
  );
}
