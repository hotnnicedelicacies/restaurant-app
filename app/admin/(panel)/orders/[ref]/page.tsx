import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderByRef } from '@/lib/data/orders';
import { getServiceClient } from '@/lib/supabase/server';
import { formatGBP, formatLongDate, formatTime } from '@/lib/utils';
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

const STAGES = ['received', 'preparing', 'on_its_way', 'delivered'] as const;

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

  const isCancelled = order.status === 'cancelled';
  const stageIdx = isCancelled ? -1 : STAGES.indexOf(order.status as typeof STAGES[number]);

  return (
    <div className="grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
      <div className="min-w-0">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
          <div>
            <Link href="/admin/orders" className="mb-2 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep hover:text-walnut">
              ← All orders
            </Link>
            <h1 className="m-0 font-serif text-[clamp(24px,3vw,30px)] font-medium leading-[1.04] text-walnut">
              Order <em className="font-normal italic text-bronze-deep">{order.ref}</em>
            </h1>
            <p className="m-0 mt-1 font-serif text-[13px] italic text-ink-muted">
              Placed {formatLongDate(order.createdAt)} at {formatTime(order.createdAt)}
            </p>
          </div>
          <span className={`rounded-[2px] border px-3 py-1 font-serif text-[12.5px] font-medium tracking-[0.04em] [font-variant:small-caps] ${
            isCancelled ? 'border-danger bg-danger/10 text-danger' : 'border-walnut bg-walnut/10 text-walnut'
          }`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </header>

        {/* Timeline + transition controls */}
        <section className="mb-5 rounded-[2px] border border-rule bg-cream p-5">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Lifecycle</h2>
          {!isCancelled && (
            <div className="relative mb-5 grid grid-cols-4 gap-2 pt-3">
              <div className="pointer-events-none absolute top-[18px] left-[12.5%] right-[12.5%] h-px bg-rule" aria-hidden />
              {STAGES.map((stage, i) => {
                const isDone = i < stageIdx;
                const isCurrent = i === stageIdx;
                return (
                  <div key={stage} className="relative z-10 text-center">
                    <div className={`mx-auto mb-1.5 flex h-[28px] w-[28px] items-center justify-center rounded-full font-serif text-[12.5px] italic ${
                      isCurrent
                        ? 'border border-walnut bg-walnut text-cream'
                        : isDone
                          ? 'border border-bronze bg-bronze text-walnut'
                          : 'border border-rule bg-cream-soft text-ink-muted'
                    }`}>
                      {i + 1}
                    </div>
                    <p className={`m-0 font-serif text-[11px] tracking-[0.06em] [font-variant:small-caps] ${i > stageIdx ? 'text-ink-muted' : 'text-walnut'}`}>
                      {STATUS_LABELS[stage]}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <OrderStatusControls
            orderRef={order.ref}
            currentStatus={order.status}
          />
        </section>

        {/* Items */}
        <section className="mb-5 rounded-[2px] border border-rule bg-cream p-5">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
            Items ({order.items.length})
          </h2>
          <table className="w-full border-collapse">
            <tbody className="font-serif text-[13.5px] text-walnut">
              {order.items.map((item) => {
                const variantParts = Object.values(item.variantsChosen ?? {}).map((v) => v.label);
                const addonsLine = (item.addonsChosen ?? []).map((a) => a.label).join(', ');
                const sub = [variantParts.join(' · '), addonsLine].filter(Boolean).join(' · ');
                return (
                  <tr key={item.id} className="border-t border-rule align-top">
                    <td className="py-2.5 pr-3">
                      <div className="font-medium">{item.name}</div>
                      {sub && <div className="text-[12px] italic text-ink-muted">{sub}</div>}
                      {item.specialInstructions && (
                        <div className="mt-1 border-l-2 border-rule pl-2.5 text-[12px] italic text-ink-muted">
                          "{item.specialInstructions}"
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[12px] text-ink-muted">× {item.quantity}</td>
                    <td className="py-2.5 pl-3 text-right tabular-nums font-medium">{formatGBP(item.lineTotalGbp)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="font-serif text-walnut">
              <tr className="border-t border-rule">
                <td className="py-2 pr-3">Subtotal</td>
                <td colSpan={2} className="py-2 pl-3 text-right tabular-nums">{formatGBP(order.subtotalGbp)}</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 italic text-ink-muted">Delivery</td>
                <td colSpan={2} className="py-2 pl-3 text-right tabular-nums italic text-ink-muted">{formatGBP(order.delivery.feeGbp)}</td>
              </tr>
              <tr className="border-t border-walnut">
                <td className="py-3 pr-3 text-[15px] font-semibold">Total</td>
                <td colSpan={2} className="py-3 pl-3 text-right text-[15px] font-semibold tabular-nums">{formatGBP(order.totalGbp)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Kitchen notes */}
        <section className="rounded-[2px] border border-rule bg-cream p-5">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">
            Kitchen notes
          </h2>
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
        </section>
      </div>

      {/* Sidebar */}
      <aside className="space-y-5 md:sticky md:top-[120px]">
        <section className="rounded-[2px] border border-rule bg-cream p-5">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Customer</h2>
          <p className="m-0 mb-1 font-serif text-[15px] font-medium text-walnut">
            {order.customer.firstName} {order.customer.lastName}
          </p>
          <p className="m-0 font-serif text-[13.5px] italic text-ink-muted">
            <a href={`mailto:${order.customer.email}`} className="link-underline">{order.customer.email}</a>
          </p>
          <p className="m-0 font-serif text-[13.5px] italic text-ink-muted">
            <a href={`tel:${order.customer.phone}`} className="link-underline">{order.customer.phone}</a>
          </p>
          <p className="mt-3 m-0 font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">Address</p>
          <p className="m-0 font-serif text-[13.5px] text-walnut">
            {order.delivery.line1}
            {order.delivery.line2 && <><br />{order.delivery.line2}</>}
            <br />{order.delivery.city} · {order.delivery.postcode}
          </p>
          <p className="mt-3 m-0 font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">Window</p>
          <p className="m-0 font-serif text-[13.5px] text-walnut">
            {formatLongDate(order.delivery.date)} · {order.delivery.windowStart.slice(0, 5)} – {order.delivery.windowEnd.slice(0, 5)}
          </p>
          {order.delivery.notes && (
            <>
              <p className="mt-3 m-0 font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">Delivery notes</p>
              <p className="m-0 font-serif text-[13.5px] italic text-walnut">"{order.delivery.notes}"</p>
            </>
          )}
        </section>

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
        />
      </aside>
    </div>
  );
}
