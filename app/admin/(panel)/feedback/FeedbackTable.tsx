'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { setFeedbackHandled } from '@/lib/admin/feedbackActions';
import { REVIEW_SOURCE_LABELS, type ReviewSource } from '@/lib/review/source';
import { formatShortDate, formatTime } from '@/lib/utils';

export interface FeedbackRow {
  id: string;
  createdAt: string;
  src: ReviewSource;
  message: string;
  name: string | null;
  contact: string | null;
  handled: boolean;
  handledAt: string | null;
}

const EMPTY_COPY: Record<'open' | 'handled' | 'all', string> = {
  open: 'Nothing waiting. Every message has been handled.',
  handled: 'No handled messages yet.',
  all: 'No feedback yet. It will appear here the moment someone sends a message from the review page.',
};

function contactHref(contact: string): string | null {
  const trimmed = contact.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.replace(/\D/g, '').length >= 10) return `tel:${digits}`;
  return null;
}

export default function FeedbackTable({
  rows,
  view,
}: {
  rows: FeedbackRow[];
  view: 'open' | 'handled' | 'all';
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<FeedbackRow | null>(null);

  function confirm() {
    if (!target) return;
    const next = !target.handled;
    start(async () => {
      const res = await setFeedbackHandled(target.id, next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(next ? 'Marked as handled.' : 'Reopened.');
      setTarget(null);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="admin-table-wrap" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <p className="t-body-muted" style={{ margin: 0 }}>
          {EMPTY_COPY[view]}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>From</th>
              <th>Message</th>
              <th>Via</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const href = r.contact ? contactHref(r.contact) : null;
              return (
                <tr key={r.id}>
                  <td>
                    <div className="admin-table__ref">{formatShortDate(r.createdAt)}</div>
                    <div className="admin-table__time">{formatTime(r.createdAt)}</div>
                  </td>
                  <td>
                    <div className="admin-table__customer">
                      <b>{r.name || 'Anonymous'}</b>
                      {r.contact ? (
                        <span>
                          {href ? (
                            <a href={href} className="link-underline">
                              {r.contact}
                            </a>
                          ) : (
                            r.contact
                          )}
                        </span>
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>no contact left</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div
                      className="admin-table__items"
                      style={{ whiteSpace: 'pre-wrap', maxWidth: 440, lineHeight: 1.5 }}
                    >
                      {r.message}
                    </div>
                  </td>
                  <td>
                    <span className="pill pill--card">{REVIEW_SOURCE_LABELS[r.src]}</span>
                  </td>
                  <td>
                    {r.handled ? (
                      <span className="pill pill--delivered" title={r.handledAt ? `Handled ${formatShortDate(r.handledAt)}` : undefined}>
                        Handled
                      </span>
                    ) : (
                      <span className="pill pill--received">Open</span>
                    )}
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="admin-table__action"
                      onClick={() => setTarget(r)}
                      disabled={pending}
                    >
                      {r.handled ? 'Reopen' : 'Mark handled'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={target !== null}
        onCancel={() => setTarget(null)}
        onConfirm={confirm}
        pending={pending}
        eyebrow={target?.handled ? 'Reopen feedback' : 'Mark as handled'}
        title={
          target?.handled ? (
            <>
              Put this back in the <em>open</em> list?
            </>
          ) : (
            <>
              Has this been <em>dealt with?</em>
            </>
          )
        }
        body={
          target?.handled ? (
            <>It will count towards the open badge again until someone marks it handled.</>
          ) : (
            <>
              Mark it handled once you&apos;ve replied or decided nothing needs doing. You can
              always reopen it.
            </>
          )
        }
        detail={
          target
            ? [
                { label: 'From', value: target.name || 'Anonymous' },
                { label: 'Received', value: `${formatShortDate(target.createdAt)} · ${formatTime(target.createdAt)}` },
                { label: 'Via', value: REVIEW_SOURCE_LABELS[target.src] },
              ]
            : undefined
        }
        confirmLabel={target?.handled ? 'Reopen' : 'Yes, handled'}
      />
    </>
  );
}
