'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import {
  adminCancelOrder,
  markCodCollected,
  refundOrder,
  syncStripePayment,
} from '@/lib/admin/orderActions';
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
  customerName: string;
}

export default function OrderPaymentControls(props: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [collectOpen, setCollectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [syncOpen, setSyncOpen] = useState(false);

  const canRefund =
    props.paymentMethod === 'card' &&
    (props.paymentStatus === 'paid' || props.paymentStatus === 'partially_refunded');
  const canMarkCollected =
    props.paymentMethod === 'cod' && props.codStatus !== 'collected' && props.status !== 'cancelled';
  const canCancel = props.status !== 'cancelled' && props.status !== 'delivered';
  const canSync =
    props.paymentMethod === 'card' &&
    (props.paymentStatus === 'pending' || props.paymentStatus === 'failed');

  function handleMarkCollected() {
    start(async () => {
      const res = await markCodCollected(props.orderRef);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Marked as collected.');
      setCollectOpen(false);
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

  function handleSync() {
    start(async () => {
      const res = await syncStripePayment(props.orderRef);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Stripe says: ${res.data?.paymentStatus}.`);
      setSyncOpen(false);
      router.refresh();
    });
  }

  const refunded = props.refundAmountGbp ?? 0;
  const remainingRefundable = props.totalGbp - refunded;

  return (
    <>
      {/* Payment summary */}
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

        {canSync && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              background: 'var(--color-cream-soft)',
              borderLeft: '3px solid var(--color-bronze)',
              borderRadius: '0 2px 2px 0',
            }}
          >
            <p className="t-body-muted" style={{ margin: '0 0 8px' }}>
              Status shows <b style={{ color: 'var(--color-walnut)', fontWeight: 500 }}>{props.paymentStatus}</b> but Stripe may have collected the payment. Re-sync to check.
            </p>
            <button
              type="button"
              onClick={() => setSyncOpen(true)}
              className="receipt-btn"
              style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}
            >
              Sync with Stripe
            </button>
          </div>
        )}
      </div>

      {/* COD reconciliation card — only when payment_method is COD */}
      {props.paymentMethod === 'cod' && (
        <div
          className="form-section"
          style={{
            marginTop: 20,
            background: 'var(--color-cream-soft)',
            borderColor: 'var(--color-bronze)',
          }}
        >
          <header className="form-section__head" style={{ borderBottomColor: 'rgba(165, 111, 64, 0.3)' }}>
            <h2 className="form-section__title">
              COD <em>reconciliation</em>
            </h2>
          </header>
          <p className="t-body-muted">
            After delivery, confirm here that the driver received the cash. Cash collection is tracked separately from order status so you have a clean record.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {props.codStatus === 'collected' ? (
              <span className="pill pill--collected">Cash collected</span>
            ) : props.status === 'cancelled' ? (
              <span className="pill pill--cancelled">Order cancelled</span>
            ) : (
              <>
                <span className="pill pill--uncollected">Cash not yet collected</span>
                <button
                  type="button"
                  onClick={() => setCollectOpen(true)}
                  className="status-btn status-btn--primary"
                  style={{ flex: 1, cursor: 'pointer' }}
                  disabled={pending}
                >
                  Mark cash as collected →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Danger zone */}
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
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                disabled={pending}
                className="admin-danger__btn"
                style={{ cursor: pending ? 'wait' : 'pointer' }}
              >
                Cancel{props.paymentMethod === 'card' && props.paymentStatus === 'paid' ? ' & full refund' : ''}
              </button>
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

      {/* ===== Modals ===== */}

      <ConfirmModal
        open={collectOpen}
        onCancel={() => setCollectOpen(false)}
        onConfirm={handleMarkCollected}
        pending={pending}
        eyebrow="COD reconciliation"
        title={<>Mark cash as <em>collected?</em></>}
        body={
          <>
            This locks the cash amount as received from the driver. Payment status flips to <b>paid</b>.
          </>
        }
        detail={[
          { label: 'Order', value: props.orderRef },
          { label: 'Amount', value: formatGBP(props.totalGbp) },
        ]}
        confirmLabel="Yes, mark collected"
      />

      <ConfirmModal
        open={syncOpen}
        onCancel={() => setSyncOpen(false)}
        onConfirm={handleSync}
        pending={pending}
        eyebrow="Stripe re-sync"
        title={<>Re-sync with <em>Stripe?</em></>}
        body={
          <>
            We'll fetch the latest PaymentIntent from Stripe and update this order's payment status. Safe to run multiple times — used when a webhook is missed in dev or transient network issues.
          </>
        }
        confirmLabel="Sync now"
      />

      <ConfirmModal
        open={refundOpen}
        onCancel={() => setRefundOpen(false)}
        onConfirm={handleRefund}
        pending={pending}
        tone="danger"
        eyebrow="Refund this order"
        title={<>Issue a <em>refund?</em></>}
        body={
          <>
            Leave the amount blank for a full refund (max <b>{formatGBP(remainingRefundable)}</b>). Reason is internal — it's logged in the kitchen notes.
          </>
        }
        inputSlot={
          <>
            <label className="form-field__label" htmlFor="refund-amt">
              Refund amount
            </label>
            <input
              id="refund-amt"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingRefundable}
              placeholder={`Max ${formatGBP(remainingRefundable)}`}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="form-field__input"
            />
            <label
              className="form-field__label"
              htmlFor="refund-reason"
              style={{ marginTop: 14 }}
            >
              Reason (internal)
            </label>
            <input
              id="refund-reason"
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. wrong item delivered"
              className="form-field__input"
            />
          </>
        }
        confirmLabel={pending ? 'Refunding…' : 'Issue refund'}
      />

      <ConfirmModal
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        pending={pending}
        tone="danger"
        eyebrow="Cancel order"
        title={<>Cancel order <em>{props.orderRef}?</em></>}
        body={
          props.paymentMethod === 'card' && props.paymentStatus === 'paid' ? (
            <>
              A full refund will be issued via Stripe and <b>{props.customerName}</b> will be emailed. There's no undo.
            </>
          ) : (
            <>
              The kitchen log records the cancellation and <b>{props.customerName}</b> is emailed.
            </>
          )
        }
        inputSlot={
          <>
            <label className="form-field__label" htmlFor="cancel-reason">
              Reason (shared with customer)
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. ingredients ran out"
              className="form-field__textarea"
            />
          </>
        }
        confirmLabel={pending ? 'Cancelling…' : 'Yes, cancel'}
      />
    </>
  );
}
