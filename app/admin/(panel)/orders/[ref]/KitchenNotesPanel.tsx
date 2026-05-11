'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { addKitchenNote } from '@/lib/admin/orderActions';
import { formatTime } from '@/lib/utils';

interface Note {
  id: string;
  authorName: string;
  statusAtTime: string | null;
  body: string;
  visibleToCustomer: boolean;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  received: 'Received',
  preparing: 'Preparing',
  on_its_way: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

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
  const [visible, setVisible] = useState(true);

  function handleAdd() {
    if (!body.trim()) return;
    start(async () => {
      const res = await addKitchenNote({ ref: orderRef, body, visibleToCustomer: visible });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(visible ? 'Note posted and emailed.' : 'Internal note added.');
      setBody('');
      router.refresh();
    });
  }

  const customerVisible = notes.filter((n) => n.visibleToCustomer);

  return (
    <>
      <div className="kitchen-notes" style={{ marginTop: 20 }}>
        <h3 className="kitchen-notes__title">
          Notes from the kitchen{' '}
          <small style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontVariant: 'normal', letterSpacing: 0, color: 'var(--color-ink-muted)', fontWeight: 400 }}>
            · visible on the customer's track-order page
          </small>
        </h3>
        <ul className="kitchen-notes__list">
          {customerVisible.length === 0 ? (
            <li className="kitchen-notes__entry">
              <p className="kitchen-notes__entry-text" style={{ fontStyle: 'italic', color: 'var(--color-ink-muted)' }}>
                No customer-visible notes yet.
              </p>
            </li>
          ) : (
            customerVisible.map((n) => (
              <li className="kitchen-notes__entry" key={n.id}>
                <div className="kitchen-notes__entry-meta">
                  <span>
                    {n.authorName} · {formatTime(n.createdAt)}
                  </span>
                  <span>Status: {n.statusAtTime ? STATUS_LABEL[n.statusAtTime] ?? n.statusAtTime : '—'}</span>
                </div>
                <p className="kitchen-notes__entry-text">"{n.body}"</p>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="kitchen-note-form">
        <h3 className="kitchen-note-form__title">Add a note</h3>
        <p className="kitchen-note-form__sub">
          A line to the customer. Posted to their tracking page and (optionally) emailed to them.
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="e.g., Driver is two streets away…"
        />
        <div className="kitchen-note-form__row">
          <label
            className="auth-form__checkbox"
            style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              style={{ accentColor: 'var(--color-walnut)' }}
            />
            <span>Also email this to the customer</span>
          </label>
          <button
            type="button"
            className="kitchen-note-form__send"
            onClick={handleAdd}
            disabled={pending || !body.trim()}
            style={{ cursor: pending || !body.trim() ? 'not-allowed' : 'pointer' }}
          >
            {pending ? 'Posting…' : 'Post note'}
          </button>
        </div>
      </div>
    </>
  );
}
