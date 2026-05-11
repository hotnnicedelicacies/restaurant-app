'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateOrderStatus } from '@/lib/admin/orderActions';

type Status = 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';

const STAGES: { value: Exclude<Status, 'cancelled'>; label: string; numeral: string; shortcut: string }[] = [
  { value: 'received', label: 'Received', numeral: 'i.', shortcut: 'R' },
  { value: 'preparing', label: 'Preparing', numeral: 'ii.', shortcut: 'P' },
  { value: 'on_its_way', label: 'On its way', numeral: 'iii.', shortcut: 'O' },
  { value: 'delivered', label: 'Delivered', numeral: 'iv.', shortcut: 'D' },
];

const STATUS_PILL: Record<Status, string> = {
  received: 'pill pill--received',
  preparing: 'pill pill--preparing',
  on_its_way: 'pill pill--out',
  delivered: 'pill pill--delivered',
  cancelled: 'pill pill--cancelled',
};

export default function OrderStatusControls({
  orderRef,
  currentStatus,
}: {
  orderRef: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const currentIdx = STAGES.findIndex((s) => s.value === currentStatus);

  function jumpTo(next: Exclude<Status, 'cancelled'>) {
    if (currentStatus === 'cancelled') return;
    start(async () => {
      const res = await updateOrderStatus({ ref: orderRef, next });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Moved to ${STAGES.find((s) => s.value === next)?.label}.`);
      router.refresh();
    });
  }

  return (
    <div className="status-control">
      <header className="status-control__head">
        <h2 className="status-control__title">Status</h2>
        <span className="t-mono">Auto-emails customer</span>
      </header>

      <div className="status-control__current">
        <span className="status-control__current-label">Now</span>
        <span className={STATUS_PILL[currentStatus]}>
          {STAGES.find((s) => s.value === currentStatus)?.label ?? 'Cancelled'}
        </span>
      </div>

      <div className="status-control__buttons">
        {STAGES.map((s, i) => {
          const isCurrent = i === currentIdx;
          const isPast = i < currentIdx;
          const nextStep = i === currentIdx + 1;
          const disabled = pending || isCurrent || currentStatus === 'cancelled';
          const isPrimary = nextStep && currentStatus !== 'cancelled';
          return (
            <button
              key={s.value}
              type="button"
              className={`status-btn${isPrimary ? ' status-btn--primary' : ''}`}
              onClick={() => !disabled && jumpTo(s.value)}
              disabled={disabled}
              style={isCurrent ? { opacity: 0.6, cursor: 'default' } : { cursor: disabled ? 'wait' : 'pointer' }}
            >
              <span>
                <span className="status-btn__icon">{s.numeral}</span> {s.label}
                {isCurrent && (
                  <em style={{ fontStyle: 'italic', color: 'var(--color-ink-muted)', marginLeft: 6 }}>· current</em>
                )}
                {isPast && (
                  <em style={{ fontStyle: 'italic', color: 'var(--color-ink-muted)', marginLeft: 6 }}>· done</em>
                )}
              </span>
              <span className="status-btn__shortcut">{s.shortcut}</span>
            </button>
          );
        })}
      </div>

      <p className="t-body-muted" style={{ textAlign: 'center', marginTop: 14, fontSize: 12.5 }}>
        <b style={{ color: 'var(--color-walnut)', fontStyle: 'normal', fontVariant: 'small-caps', letterSpacing: '0.06em' }}>
          Tip:
        </b>{' '}
        click the next step to advance. Customer is auto-emailed.
      </p>
    </div>
  );
}
