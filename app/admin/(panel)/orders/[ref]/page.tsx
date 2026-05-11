import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getOrderByRef } from '@/lib/data/orders';
import { getServiceClient } from '@/lib/supabase/server';
import { getStorageUrl } from '@/lib/supabase/storage';
import { formatGBP, formatLongDate, formatTime } from '@/lib/utils';
import { siteConfig } from '@/constants/siteConfig';
import OrderStatusControls from './OrderStatusControls';
import KitchenNotesPanel from './KitchenNotesPanel';
import OrderPaymentControls from './OrderPaymentControls';

const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  preparing: 'Preparing',
  on_its_way: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_PILL: Record<string, string> = {
  received: 'pill pill--received',
  preparing: 'pill pill--preparing',
  on_its_way: 'pill pill--out',
  delivered: 'pill pill--delivered',
  cancelled: 'pill pill--cancelled',
};

export default async function AdminOrderDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const order = await getOrderByRef(ref);
  if (!order) notFound();

  const supabase = getServiceClient();
  const { data: notes } = await supabase
    .from('kitchen_notes')
    .select('id, author_name, status_at_time, body, visible_to_customer, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <Link href="/admin/orders" className="admin-detail__back">
        ← Back to today's orders
      </Link>

      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">
            № {order.ref} · Placed {formatTime(order.createdAt)} · {formatLongDate(order.createdAt)}
          </div>
          <h1 className="admin-page-head__title">
            {order.customer.firstName} <em>{order.customer.lastName}</em>
          </h1>
          <p className="t-body-muted" style={{ marginTop: 4 }}>
            {order.items.length} item{order.items.length === 1 ? '' : 's'} ·{' '}
            {formatGBP(order.totalGbp)} ·{' '}
            <span className={order.paymentMethod === 'card' ? 'pill pill--card' : 'pill pill--cod'} style={{ verticalAlign: 2 }}>
              {order.paymentMethod === 'card'
                ? `Card${order.cardBrand ? ` · ${order.cardBrand} ${order.cardLast4 ?? ''}` : ''}`
                : 'Cash on delivery'}
            </span>{' '}
            <span className={STATUS_PILL[order.status] ?? 'pill'} style={{ verticalAlign: 2 }}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </p>
        </div>
        <div className="admin-page-head__actions">
          <Link href={siteConfig.routes.receipt(order.ref)} className="receipt-btn" style={{ textDecoration: 'none' }} target="_blank">
            Print receipt
          </Link>
          <Link
            href={siteConfig.routes.track(order.ref)}
            className="receipt-btn receipt-btn--primary"
            style={{ textDecoration: 'none' }}
            target="_blank"
          >
            View customer status →
          </Link>
        </div>
      </div>

      <div className="admin-detail">
        {/* LEFT: order content */}
        <div>
          {/* Customer + delivery */}
          <div className="form-section">
            <header className="form-section__head">
              <h2 className="form-section__title">Customer &amp; <em>delivery</em></h2>
              <span className="form-section__num">№ 01</span>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              <div>
                <div className="t-mono" style={{ marginBottom: 6 }}>Customer</div>
                <p className="t-body" style={{ fontWeight: 500, margin: '0 0 4px' }}>
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                <p className="t-body-muted">
                  <a href={`tel:${order.customer.phone}`} style={{ color: 'var(--color-walnut)', borderBottom: '1px solid var(--color-rule)' }}>
                    {order.customer.phone}
                  </a>
                  <br />
                  <a href={`mailto:${order.customer.email}`} style={{ color: 'var(--color-walnut)', borderBottom: '1px solid var(--color-rule)' }}>
                    {order.customer.email}
                  </a>
                </p>
              </div>
              <div>
                <div className="t-mono" style={{ marginBottom: 6 }}>Delivering to</div>
                <p className="t-body" style={{ fontWeight: 500, margin: '0 0 4px' }}>
                  {order.delivery.line1}
                  {order.delivery.line2 && <>, {order.delivery.line2}</>}
                </p>
                <p className="t-body-muted">
                  {order.delivery.city} ·{' '}
                  <b style={{ color: 'var(--color-walnut)', fontVariant: 'small-caps', letterSpacing: '0.08em' }}>
                    {order.delivery.postcode}
                  </b>
                  <br />
                  <em>Fee:</em> {formatGBP(order.delivery.feeGbp)} · <em>Window:</em>{' '}
                  {order.delivery.windowStart.slice(0, 5)} – {order.delivery.windowEnd.slice(0, 5)}
                </p>
                {order.delivery.notes && (
                  <p className="t-body-muted" style={{ marginTop: 8, paddingLeft: 10, borderLeft: '2px solid var(--color-rule)' }}>
                    "{order.delivery.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="form-section" style={{ marginTop: 20 }}>
            <header className="form-section__head">
              <h2 className="form-section__title">What they <em>ordered</em></h2>
              <span className="form-section__num">{order.items.length} items</span>
            </header>

            <div className="summary__items" style={{ margin: 0, padding: 0, border: 0 }}>
              {order.items.map((item) => {
                const variantParts = Object.values(item.variantsChosen ?? {}).map((v) => v.label);
                const addonsLine = (item.addonsChosen ?? []).map((a) => a.label).join(', ');
                return (
                  <div className="summary__item" key={item.id}>
                    {item.imagePath ? (
                      <Image src={getStorageUrl(item.imagePath)} alt={item.name} width={64} height={64} />
                    ) : (
                      <div style={{ width: 64, height: 64, background: 'var(--color-cream-soft)', borderRadius: 2 }} />
                    )}
                    <div className="summary__item-text">
                      <h3 className="summary__item-name">{item.name}</h3>
                      {(variantParts.length > 0 || addonsLine) && (
                        <p className="summary__item-meta">
                          {variantParts.map((p, i) => (
                            <span key={p}>
                              {i > 0 && ' · '}
                              <b style={{ color: 'var(--color-walnut)', fontWeight: 500 }}>{p}</b>
                            </span>
                          ))}
                          {addonsLine && (
                            <>
                              {' · '}
                              <b style={{ color: 'var(--color-walnut)', fontWeight: 500 }}>{addonsLine}</b>
                            </>
                          )}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="summary__item-meta" style={{ marginTop: 6, paddingLeft: 10, borderLeft: '2px solid var(--color-rule)' }}>
                          "{item.specialInstructions}"
                        </p>
                      )}
                      <span className="summary__item-qty">× {item.quantity}</span>
                    </div>
                    <span className="summary__item-price">{formatGBP(item.lineTotalGbp)}</span>
                  </div>
                );
              })}
            </div>

            <div className="summary__totals" style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--color-rule)' }}>
              <div className="summary__row"><span>Subtotal</span><span>{formatGBP(order.subtotalGbp)}</span></div>
              <div className="summary__row summary__row--muted"><span>Delivery</span><span>{formatGBP(order.delivery.feeGbp)}</span></div>
              <div className="summary__row summary__row--grand"><span>Total</span><span>{formatGBP(order.totalGbp)}</span></div>
            </div>
          </div>

          {/* Kitchen notes */}
          <KitchenNotesPanel
            orderRef={order.ref}
            notes={(notes ?? []).map((n) => ({
              id: n.id,
              authorName: n.author_name,
              statusAtTime: n.status_at_time,
              body: n.body,
              visibleToCustomer: n.visible_to_customer,
              createdAt: n.created_at,
            }))}
          />
        </div>

        {/* RIGHT: status + payment + danger */}
        <aside>
          <OrderStatusControls
            orderRef={order.ref}
            currentStatus={order.status}
            customerName={`${order.customer.firstName} ${order.customer.lastName}`}
          />

          <OrderPaymentControls
            orderRef={order.ref}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
            codStatus={order.codStatus}
            cardBrand={order.cardBrand}
            cardLast4={order.cardLast4}
            totalGbp={order.totalGbp}
            refundAmountGbp={order.refundAmountGbp}
            status={order.status}
            cancelledReason={order.cancelledReason}
            customerName={`${order.customer.firstName} ${order.customer.lastName}`}
          />
        </aside>
      </div>
    </>
  );
}
