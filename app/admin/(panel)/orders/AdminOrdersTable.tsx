'use client';

import { useRouter } from 'next/navigation';
import { formatGBP, formatTime } from '@/lib/utils';

export interface OrderRow {
  ref: string;
  status: 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';
  paymentMethod: 'card' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';
  codStatus: 'uncollected' | 'collected' | null;
  customerName: string;
  customerPhone: string;
  deliveryPostcode: string;
  totalGbp: number;
  createdAt: string;
  itemsLine: string;
}

const STATUS_LABELS: Record<OrderRow['status'], string> = {
  received: 'Received',
  preparing: 'Preparing',
  on_its_way: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_PILL: Record<OrderRow['status'], string> = {
  received: 'pill pill--received',
  preparing: 'pill pill--preparing',
  on_its_way: 'pill pill--out',
  delivered: 'pill pill--delivered',
  cancelled: 'pill pill--cancelled',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AdminOrdersTable({ rows }: { rows: OrderRow[] }) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="admin-table-wrap" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <p className="t-body-muted">No orders match those filters.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>№ / Time</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const cancelled = o.status === 'cancelled';
            return (
              <tr
                key={o.ref}
                onClick={() => router.push(`/admin/orders/${o.ref}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/admin/orders/${o.ref}`);
                  }
                }}
                role="link"
                tabIndex={0}
                style={cancelled ? { opacity: 0.6 } : undefined}
              >
                <td>
                  <div className="admin-table__ref">{o.ref}</div>
                  <div className="admin-table__time">
                    {formatTime(o.createdAt)} · {timeAgo(o.createdAt)}
                  </div>
                </td>
                <td>
                  <div className="admin-table__customer">
                    <b>{o.customerName}</b>
                    <em>
                      {o.deliveryPostcode} · {o.customerPhone}
                    </em>
                  </div>
                </td>
                <td>
                  <div className="admin-table__items">{o.itemsLine || '—'}</div>
                </td>
                <td>
                  <span className={`pill ${o.paymentMethod === 'card' ? 'pill--card' : 'pill--cod'}`}>
                    {o.paymentMethod === 'card' ? 'Card' : 'COD'}
                  </span>
                </td>
                <td
                  className="admin-table__total"
                  style={cancelled ? { textDecoration: 'line-through' } : undefined}
                >
                  {formatGBP(o.totalGbp)}
                </td>
                <td>
                  <span className={STATUS_PILL[o.status]}>{STATUS_LABELS[o.status]}</span>
                </td>
                <td className="admin-table__actions">
                  <a
                    href={`/admin/orders/${o.ref}`}
                    className="admin-table__action"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open →
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
