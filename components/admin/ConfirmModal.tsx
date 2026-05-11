'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export interface ConfirmModalProps {
  /** Controls visibility. */
  open: boolean;
  /** Called when the user dismisses (overlay click, Escape, Cancel). */
  onCancel: () => void;
  /** Called when the user confirms. */
  onConfirm: () => void;
  /** Small label above the title. */
  eyebrow?: ReactNode;
  /** Stress the eyebrow as a destructive action. */
  tone?: 'default' | 'danger';
  /** Title. JSX allowed for italic emphasis. */
  title: ReactNode;
  /** Body copy. */
  body?: ReactNode;
  /** Optional key/value detail block. */
  detail?: { label: string; value: ReactNode }[];
  /** Optional inline input (e.g. refund amount). */
  inputSlot?: ReactNode;
  /** Confirm button label. */
  confirmLabel?: string;
  /** Disable buttons while a server action is in flight. */
  pending?: boolean;
}

export default function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  eyebrow = 'Confirm action',
  tone = 'default',
  title,
  body,
  detail,
  inputSlot,
  confirmLabel = 'Confirm',
  pending,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Esc to dismiss; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel, pending]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === overlayRef.current && !pending) onCancel();
      }}
    >
      <div className="modal-card">
        <div className={`modal-eyebrow${tone === 'danger' ? ' modal-eyebrow--danger' : ''}`}>
          {eyebrow}
        </div>
        <h2 className="modal-title" id="confirm-modal-title">
          {title}
        </h2>
        {body && <div className="modal-body">{body}</div>}
        {detail && detail.length > 0 && (
          <div className="modal-detail" style={{ display: 'block' }}>
            <dl>
              {detail.map((d, i) => (
                <span key={i} style={{ display: 'contents' }}>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </span>
              ))}
            </dl>
          </div>
        )}
        {inputSlot && <div className="modal-input-row" style={{ display: 'block' }}>{inputSlot}</div>}
        <div className="modal-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="modal-btn"
            style={{ cursor: pending ? 'wait' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`modal-btn${tone === 'danger' ? ' modal-btn--danger' : ' modal-btn--primary'}`}
            style={{ cursor: pending ? 'wait' : 'pointer' }}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
