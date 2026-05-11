'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addKitchenNote } from '@/lib/admin/orderActions';
import { formatShortDate, formatTime } from '@/lib/utils';

interface Note {
  id: string;
  authorName: string;
  statusAtTime: string | null;
  body: string;
  visibleToCustomer: boolean;
  createdAt: string;
}

export default function KitchenNotesPanel({
  orderRef,
  notes,
}: {
  orderRef: string;
  notes: Note[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState('');
  const [visible, setVisible] = useState(false);

  function handleAdd() {
    if (!body.trim()) return;
    start(async () => {
      const res = await addKitchenNote({ ref: orderRef, body, visibleToCustomer: visible });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(visible ? 'Note added and emailed to customer.' : 'Internal note added.');
      setBody('');
      setVisible(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-[2px] border border-rule bg-cream-soft p-3">
        <textarea
          rows={2}
          placeholder="Add a note for the team or the customer…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="resize-none rounded-[2px] border border-rule bg-cream px-3 py-2 font-serif text-[13.5px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 font-serif text-[12.5px] italic text-ink-muted">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="h-[16px] w-[16px] accent-walnut"
            />
            Send to customer (email)
          </label>
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending || !body.trim()}
            className="rounded-[2px] border border-walnut bg-transparent px-4 py-1.5 font-serif text-[12px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] transition-colors hover:bg-walnut hover:text-cream disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {notes.length === 0 ? (
          <li className="font-serif text-[13.5px] italic text-ink-muted">No notes yet.</li>
        ) : (
          notes.map((n) => (
            <li key={n.id} className="border-l-[3px] border-bronze bg-cream-soft p-3">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-bronze-deep">
                <span>
                  {n.authorName} {n.statusAtTime && `· ${n.statusAtTime.replace(/_/g, ' ')}`}
                </span>
                <span>
                  {formatShortDate(n.createdAt)} · {formatTime(n.createdAt)}
                  {n.visibleToCustomer ? ' · sent to customer' : ' · internal'}
                </span>
              </div>
              <p className="m-0 font-serif text-[14px] italic leading-[1.5] text-walnut">"{n.body}"</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
