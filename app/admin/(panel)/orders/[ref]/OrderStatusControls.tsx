'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { updateOrderStatus } from '@/lib/admin/orderActions';

type Status = 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';
type Advanceable = Exclude<Status, 'cancelled'>;

const STAGES: { value: Advanceable; label: string; numeral: string; shortcut: string }[] = [
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
  customerName,
}: {
  orderRef: string;
  currentStatus: Status;
  customerName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<Advanceable | null>(null);
  const currentIdx = STAGES.findIndex((s) => s.value === currentStatus);

  function confirmJump() {
    if (!target) return;
    start(async () => {
      const res = await updateOrderStatus({ ref: orderRef, next: target });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Moved to ${STAGES.find((s) => s.value === target)?.label}.`);
      setTarget(null);
      router.refresh();
    });
  }

  // Keyboard shortcuts — press R/P/O/D to queue a transition (still
  // routes through the confirmation modal).
  useEffect(() => {
    if (currentStatus === 'cancelled') return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const match = STAGES.find((s) => s.shortcut.toLowerCase() === key);
      if (!match) return;
      const idx = STAGES.findIndex((s) => s.value === match.value);
      if (idx === currentIdx) return;
      e.preventDefault();
      setTarget(match.value);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [currentStatus, currentIdx]);

  const isCancelled = currentStatus === 'cancelled';
  const targetLabel = target ? STAGES.find((s) => s.value === target)?.label : '';
  const isRollback = target && STAGES.findIndex((s) => s.value === target) < currentIdx;

  return (
    <>
      <div className="status-control">
        <header className="status-control__head">
          <h2 className="status-control__title">Status</h2>
          <span className="t-mono">Auto-emails customer</span>
        </header>

        <div className="status-control__current">
          <span className="status-control__current-label">Now</span>
          <span className={STATUS_PILL[currentStatus]}>
            {isCancelled ? 'Cancelled' : STAGES.find((s) => s.value === currentStatus)?.label}
          </span>
        </div>

        <div className="status-control__buttons">
          {STAGES.map((s, i) => {
            const isCurrent = i === currentIdx;
            const isPast = i < currentIdx;
            const isNext = i === currentIdx + 1;
            const disabled = pending || isCurrent || isCancelled;
            return (
              <button
                key={s.value}
                type="button"
                className={`status-btn${isNext && !isCancelled ? ' status-btn--primary' : ''}`}
                onClick={() => !disabled && setTarget(s.value)}
                disabled={disabled}
                style={isCurrent ? { opacity: 0.6, cursor: 'default' } : { cursor: disabled ? 'wait' : 'pointer' }}
              >
                <span>
                  <span className="status-btn__icon">{s.numeral}</span> {s.label}
                  {isCurrent && (
                    <em style={{ fontStyle: 'italic', color: 'var(--color-ink-muted)', marginLeft: 6 }}>
                      · current
                    </em>
                  )}
                  {isPast && (
                    <em style={{ fontStyle: 'italic', color: 'var(--color-ink-muted)', marginLeft: 6 }}>
                      · done
                    </em>
                  )}
                </span>
                <span className="status-btn__shortcut">{s.shortcut}</span>
              </button>
            );
          })}
        </div>

        {!isCancelled && (
          <p className="t-body-muted" style={{ textAlign: 'center', marginTop: 14, fontSize: 12.5 }}>
            <b style={{ color: 'var(--color-walnut)', fontStyle: 'normal', fontVariant: 'small-caps', letterSpacing: '0.06em' }}>
              Tip:
            </b>{' '}
            press the letter shortcut to queue a status change.
          </p>
        )}
      </div>

      <ConfirmModal
        open={target !== null}
        onCancel={() => setTarget(null)}
        onConfirm={confirmJump}
        pending={pending}
        eyebrow={isRollback ? 'Roll status back' : `Advance to ${targetLabel}`}
        title={
          isRollback ? (
            <>
              Roll status back to <em>{targetLabel}?</em>
            </>
          ) : target === 'delivered' ? (
            <>
              Mark order as <em>delivered?</em>
            </>
          ) : (
            <>
              Move order to <em>{targetLabel}?</em>
            </>
          )
        }
        body={
          isRollback ? (
            <>
              The kitchen log will record this rollback. <b>{customerName}</b> will <b>not</b> be notified.
            </>
          ) : target === 'delivered' ? (
            <>
              This emails <b>{customerName}</b> a delivery confirmation and locks the status. There's no undo.
            </>
          ) : (
            <>
              This auto-emails <b>{customerName}</b> a status update.
            </>
          )
        }
        detail={[
          { label: 'Order', value: orderRef },
          { label: 'New status', value: targetLabel },
          { label: 'Customer email', value: isRollback ? 'not sent' : 'will be sent' },
        ]}
        confirmLabel={isRollback ? 'Yes, roll back' : target === 'delivered' ? 'Yes, mark delivered' : `Move to ${targetLabel}`}
      />
    </>
  );
}
