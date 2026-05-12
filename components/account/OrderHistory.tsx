import Link from 'next/link';
import { formatGBP, formatLongDate } from '@/lib/utils';
import { siteConfig } from '@/constants/siteConfig';
import HeritageButton from '@/components/ui/HeritageButton';

export interface OrderHistoryRow {
  ref: string;
  status: 'received' | 'preparing' | 'on_its_way' | 'delivered' | 'cancelled';
  totalGbp: number;
  createdAt: string;
  itemsLine: string;
  paymentStatus: string;
}

const STATUS_LABELS: Record<OrderHistoryRow['status'], string> = {
  received: 'Received',
  preparing: 'Preparing',
  on_its_way: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_CLASS: Record<OrderHistoryRow['status'], string> = {
  received: 'is-progress',
  preparing: 'is-progress',
  on_its_way: 'is-progress',
  delivered: 'is-delivered',
  cancelled: 'is-cancelled',
};

export default function OrderHistory({ orders }: { orders: OrderHistoryRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-[480px] py-[clamp(48px,8vw,96px)] text-center">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
          No orders yet
        </p>
        <h3 className="m-0 mb-3 font-serif text-[clamp(26px,3.4vw,36px)] font-medium tracking-[-0.005em] text-walnut [&_em]:font-normal [&_em]:italic">
          You haven&apos;t ordered <em>yet</em>.
        </h3>
        <p className="m-0 mb-7 font-serif text-[16px] italic leading-[1.5] text-ink-muted">
          Browse today&apos;s bill of fare — order by 10am for same-day delivery.
        </p>
        <HeritageButton href={siteConfig.routes.menu} variant="primary">
          See today&apos;s menu
        </HeritageButton>
      </div>
    );
  }

  return (
    <div className="order-history">
      {orders.map((o) => {
        const isCancelled = o.status === 'cancelled';
        return (
          <article key={o.ref} className="order-row">
            <div
              className="order-row__thumb"
              style={{
                background: 'var(--color-cream-soft)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 11,
                color: 'var(--color-ink-muted)',
              }}
            >
              № {o.ref.split('-')[1]}
            </div>
            <div className="order-row__body">
              <div className="order-row__top">
                <span className="order-row__ref">{o.ref}</span>
                <span className="order-row__date">{formatLongDate(o.createdAt)}</span>
                <span className={`order-row__status ${STATUS_CLASS[o.status]}`}>
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <p className="order-row__items">{o.itemsLine}</p>
              {isCancelled && (
                <p className="order-row__items">
                  <em>Cancelled — refund issued if card paid.</em>
                </p>
              )}
            </div>
            <div className="order-row__right">
              <span
                className="order-row__price"
                style={isCancelled ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}
              >
                {formatGBP(o.totalGbp)}
              </span>
              <div className="order-row__actions">
                <Link
                  href={siteConfig.routes.track(o.ref)}
                  className="order-row__action"
                >
                  Track
                </Link>
                <Link
                  href={siteConfig.routes.receipt(o.ref)}
                  className="order-row__action"
                >
                  Receipt
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
