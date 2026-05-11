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

  const refunded = props.refundAmountGbp ?? 0;

  return (
    <>
      {/* Payment */}
      <div className="form-section" style={{ marginTop: 20 }}>
        <header className="form-section__head">
          <h2 className="form-section__title">Payment</h2>
        </header>
        <p className="t-body">
          <span className={props.paymentMethod === 'card' ? 'pill pill--card' : 'pill pill--cod'} style={{ verticalAlign: 2 }}>
            {props.paymentMethod === 'card' ? 'Card' : 'COD'}
          </span>{' '}
          <b style={{ fontWeight: 500 }}>
            {props.paymentMethod === 'card'
              ? props.cardBrand
                ? `${props.cardBrand} ending ${props.cardLast4}`
                : 'Card payment'
              : 'Cash on delivery'}
          </b>
        </p>
        <p className="t-body-muted" style={{ marginTop: 4 }}>
          {props.paymentMethod === 'card'
            ? `${props.paymentStatus === 'paid' ? 'Charged' : props.paymentStatus} ${formatGBP(props.totalGbp)}`
            : props.codStatus === 'collected'
              ? `Collected ${formatGBP(props.totalGbp)}`
              : `Due on delivery · ${formatGBP(props.totalGbp)}`}
          {refunded > 0 && (
            <>
              <br />
              <em>Refunded: {formatGBP(refunded)}</em>
            </>
          )}
        </p>

        {canMarkCollected && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <span className="pill pill--uncollected">Cash not yet collected</span>
            <button
              type="button"
              onClick={handleMarkCollected}
              disabled={pending}
              className="status-btn status-btn--primary"
              style={{ flex: 1, cursor: pending ? 'wait' : 'pointer' }}
            >
              Mark cash as collected →
            </button>
          </div>
        )}

        {canRefund && !canMarkCollected && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <AlertDialog open={refundOpen} onOpenChange={setRefundOpen}>
              <AlertDialogTrigger asChild>
                <button type="button" className="receipt-btn" style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>
                  Issue refund
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2px] border border-rule bg-cream">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-walnut">Refund this order?</AlertDialogTitle>
                  <AlertDialogDescription className="font-serif text-[13.5px] italic text-ink-muted">
                    Leave amount blank for a full refund. Reason is internal — it's logged in the kitchen notes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-3">
                  <label className="form-field">
                    <span className="form-field__label">Amount (£)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={`Max ${formatGBP(props.totalGbp - refunded)}`}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="form-field__input"
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">Reason (internal)</span>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. wrong item delivered"
                      className="form-field__input"
                    />
                  </label>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pending}>Back</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleRefund();
                    }}
                    disabled={pending}
                  >
                    {pending ? 'Refunding…' : 'Issue refund'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Danger zone — cancel + refund */}
      {(canRefund || canCancel) && (
        <div className="admin-danger">
          <h3 className="admin-danger__title">Cancel or refund</h3>
          <p className="admin-danger__body">
            Cancel halts cooking and refunds in full via Stripe. Partial refund lets you choose the amount (for missing items, late delivery, etc.). Both notify the customer.
          </p>
          <div className="admin-danger__actions">
            {canRefund && (
              <button
                type="button"
                onClick={() => setRefundOpen(true)}
                disabled={pending}
                className="admin-danger__btn"
                style={{ cursor: pending ? 'wait' : 'pointer' }}
              >
                Issue partial refund
              </button>
            )}
            {canCancel && (
              <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    disabled={pending}
                    className="admin-danger__btn"
                    style={{ cursor: pending ? 'wait' : 'pointer' }}
                  >
                    Cancel{props.paymentMethod === 'card' && props.paymentStatus === 'paid' ? ' & full refund' : ''}
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
                  <label className="form-field">
                    <span className="form-field__label">Reason (shared with customer)</span>
                    <textarea
                      rows={2}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g. ingredients ran out"
                      className="form-field__textarea"
                    />
                  </label>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>Keep order</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleCancel();
                      }}
                      disabled={pending}
                    >
                      {pending ? 'Cancelling…' : 'Yes, cancel'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}

      {props.status === 'cancelled' && props.cancelledReason && (
        <div className="admin-danger" style={{ marginTop: 12 }}>
          <h3 className="admin-danger__title">Cancelled</h3>
          <p className="admin-danger__body">{props.cancelledReason}</p>
        </div>
      )}
    </>
  );
}
