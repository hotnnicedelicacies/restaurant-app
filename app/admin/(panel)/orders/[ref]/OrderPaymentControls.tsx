'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { adminCancelOrder, markCodCollected, refundOrder } from '@/lib/admin/orderActions';
import { formatGBP } from '@/lib/utils';

interface Props {
  orderRef: string;
  paymentMethod: 'card' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';
  codStatus: 'uncollected' | 'collected' | null;
  cardBrand: string | null;
  cardLast4: string | null;
  totalGbp: number;
  refundAmountGbp: number | null;
  status: 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';
  cancelledReason: string | null;
}

export default function OrderPaymentControls(props: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const canRefund =
    props.paymentMethod === 'card' &&
    (props.paymentStatus === 'paid' || props.paymentStatus === 'partially_refunded');
  const canMarkCollected = props.paymentMethod === 'cod' && props.codStatus !== 'collected' && props.status !== 'cancelled';
  const canCancel = props.status !== 'cancelled' && props.status !== 'delivered';

  function handleMarkCollected() {
    start(async () => {
      const res = await markCodCollected(props.orderRef);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Marked as collected.');
      router.refresh();
    });
  }

  function handleRefund() {
    const amount = refundAmount.trim() ? Number(refundAmount) : undefined;
    if (refundAmount.trim() && (isNaN(amount!) || amount! <= 0)) {
      toast.error('Refund amount must be a positive number.');
      return;
    }
    start(async () => {
      const res = await refundOrder({
        ref: props.orderRef,
        amountGbp: amount,
        reason: refundReason.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Refund issued.');
      setRefundOpen(false);
      setRefundAmount('');
      setRefundReason('');
      router.refresh();
    });
  }

  function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason.');
      return;
    }
    start(async () => {
      const res = await adminCancelOrder(props.orderRef, cancelReason.trim());
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Order cancelled.');
      setCancelOpen(false);
      setCancelReason('');
      router.refresh();
    });
  }

  return (
    <section className="rounded-[2px] border border-rule bg-cream p-5">
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Payment</h2>

      <p className="m-0 mb-1 font-serif text-[15px] font-medium text-walnut">
        {props.paymentMethod === 'card'
          ? props.cardBrand
            ? `${props.cardBrand} ending ${props.cardLast4}`
            : 'Card'
          : 'Cash on delivery'}
      </p>
      <p className="m-0 font-serif text-[13.5px] italic text-ink-muted">
        Total · <b className="not-italic font-medium text-walnut tabular-nums">{formatGBP(props.totalGbp)}</b>
      </p>
      <p className="m-0 mt-1 font-serif text-[12.5px] italic text-ink-muted">
        Status ·{' '}
        {props.paymentMethod === 'card'
          ? props.paymentStatus
          : props.codStatus === 'collected'
            ? 'Collected'
            : 'Uncollected'}
        {props.refundAmountGbp && props.refundAmountGbp > 0 && (
          <> · Refunded {formatGBP(props.refundAmountGbp)}</>
        )}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {canMarkCollected && (
          <button
            type="button"
            onClick={handleMarkCollected}
            disabled={pending}
            className="rounded-[2px] bg-walnut px-4 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep disabled:opacity-60"
          >
            Mark cash collected
          </button>
        )}

        {canRefund && (
          <AlertDialog open={refundOpen} onOpenChange={setRefundOpen}>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="rounded-[2px] border border-walnut bg-transparent px-4 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
              >
                Issue refund
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2px] border border-rule bg-cream">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-walnut">Refund this order?</AlertDialogTitle>
                <AlertDialogDescription className="font-serif text-[13.5px] italic text-ink-muted">
                  Leave amount blank for a full refund. Reason is internal — it’s logged in the kitchen notes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 font-serif text-[12.5px] tracking-[0.04em] text-walnut">
                  Amount (£)
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={`Max ${formatGBP(props.totalGbp - (props.refundAmountGbp ?? 0))}`}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut"
                  />
                </label>
                <label className="flex flex-col gap-1 font-serif text-[12.5px] tracking-[0.04em] text-walnut">
                  Reason (internal)
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. wrong item delivered"
                    className="rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
                  />
                </label>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={pending}
                  className="rounded-[2px] border border-walnut bg-transparent font-serif font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
                >
                  Back
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleRefund();
                  }}
                  disabled={pending}
                  className="rounded-[2px] bg-danger font-serif font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-danger/90"
                >
                  {pending ? 'Refunding…' : 'Issue refund'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canCancel && (
          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="rounded-[2px] border border-danger bg-transparent px-4 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-danger [font-variant:small-caps] hover:bg-danger hover:text-cream"
              >
                Cancel order
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2px] border border-rule bg-cream">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-walnut">Cancel this order?</AlertDialogTitle>
                <AlertDialogDescription className="font-serif text-[13.5px] italic text-ink-muted">
                  {props.paymentMethod === 'card' && props.paymentStatus === 'paid'
                    ? 'A full refund will be issued and the customer will be emailed.'
                    : 'The customer will be emailed.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label className="flex flex-col gap-1 font-serif text-[12.5px] tracking-[0.04em] text-walnut">
                Reason (shared with customer)
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. ingredients ran out"
                  className="rounded-[2px] border border-rule bg-cream-soft px-3 py-2 font-serif text-[14px] text-walnut outline-none focus:border-walnut placeholder:italic placeholder:text-ink-muted"
                />
              </label>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={pending}
                  className="rounded-[2px] border border-walnut bg-transparent font-serif font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
                >
                  Keep order
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleCancel();
                  }}
                  disabled={pending}
                  className="rounded-[2px] bg-danger font-serif font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-danger/90"
                >
                  {pending ? 'Cancelling…' : 'Yes, cancel'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {props.status === 'cancelled' && props.cancelledReason && (
          <p className="m-0 mt-2 rounded-[2px] border border-danger/40 bg-danger/5 p-3 font-serif text-[12.5px] italic text-danger">
            Cancelled · {props.cancelledReason}
          </p>
        )}
      </div>
    </section>
  );
}
