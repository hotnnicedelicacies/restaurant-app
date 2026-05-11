'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateOrderStatus } from '@/lib/admin/orderActions';

type Status = 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';

const NEXT_STATUS: Record<Status, { value: 'preparing' | 'on_its_way' | 'delivered'; label: string } | null> = {
  received: { value: 'preparing', label: 'Start cooking →' },
  preparing: { value: 'on_its_way', label: 'Out for delivery →' },
  on_its_way: { value: 'delivered', label: 'Mark delivered →' },
  delivered: null,
  cancelled: null,
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
  const [note, setNote] = useState('');
  const [visible, setVisible] = useState(true);
  const next = NEXT_STATUS[currentStatus];

  if (!next) {
    return (
      <p className="m-0 font-serif text-[13.5px] italic text-ink-muted">
        {currentStatus === 'cancelled'
          ? 'This order is cancelled. No further transitions possible.'
          : 'Order completed. No further transitions possible.'}
      </p>
    );
  }

  function handleAdvance() {
    start(async () => {
      const res = await updateOrderStatus({
        ref: orderRef,
        next: next!.value,
        noteBody: note.trim() || undefined,
        noteVisibleToCustomer: visible,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Moved to ${next!.label.replace(' →', '')}.`);
      setNote('');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        placeholder={`Optional note for the customer (e.g. "Your jollof is on the pass — leaving in 5 min")`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[13.5px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 font-serif text-[12.5px] italic text-ink-muted">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-[16px] w-[16px] accent-walnut"
          />
          Email this note to the customer
        </label>
        <button
          type="button"
          onClick={handleAdvance}
          disabled={pending}
          className="rounded-[2px] bg-walnut px-5 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-60"
        >
          {pending ? 'Updating…' : next.label}
        </button>
      </div>
    </div>
  );
}
