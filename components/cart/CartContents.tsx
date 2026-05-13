'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart, type CartLine } from '@/lib/cart/store';
import HeritageButton from '@/components/ui/HeritageButton';
import { siteConfig } from '@/constants/siteConfig';
import { formatGBP } from '@/lib/utils';
import { useEffect, useState } from 'react';

/**
 * @param minDeliveryFee  Cheapest base fee across the admin-controlled
 *                        `delivery_zones` table — used for the "from £X"
 *                        indicator before the customer enters a postcode
 *                        at checkout. Null when zones haven't loaded
 *                        (cold cache + DB down) so we render "—" instead
 *                        of a stale business value.
 */
export default function CartContents({ minDeliveryFee }: { minDeliveryFee: number | null }) {
  // Avoid hydration mismatch: zustand-persist reads from localStorage on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lines = useCart((s) => s.lines);
  const subtotal = useCart((s) => s.subtotal());
  const count = useCart((s) => s.count());
  const setQty = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  if (!mounted) {
    return (
      <div className="h-[400px] animate-pulse rounded-[2px] bg-cream-soft" aria-label="Loading basket" />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[480px] py-[clamp(48px,8vw,96px)] text-center">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
          Your basket
        </p>
        <h2 className="m-0 mb-3 font-serif text-[clamp(26px,3.4vw,36px)] font-medium text-walnut">
          Nothing in your <em className="font-normal italic">basket</em> yet.
        </h2>
        <p className="m-0 mb-7 font-serif text-[16px] italic leading-[1.5] text-ink-muted">
          Browse today's bill of fare — order by 10am for same-day delivery.
        </p>
        <HeritageButton href={siteConfig.routes.menu} variant="primary">
          See today's menu →
        </HeritageButton>
      </div>
    );
  }

  // Pre-checkout, we don't know the customer's postcode yet, so we show a
  // "from £X" indicator using the cheapest active zone (passed in from the
  // server component). The exact fee is bound at checkout once the
  // postcode → zone match runs.
  const deliveryFeeFrom = minDeliveryFee;
  const total = subtotal + (deliveryFeeFrom ?? 0);

  return (
    <div className="grid items-start gap-[clamp(32px,5vw,64px)] md:grid-cols-[1.4fr_1fr]">
      {/* LEFT: line items */}
      <main className="min-w-0">
        <header className="mb-7">
          <div className="t-mono mb-2">
            Vol. 01 · {count} item{count === 1 ? '' : 's'} · Today
          </div>
          <h1 className="t-display-l">
            Your <em>order</em>
          </h1>
          <p className="t-body-l mt-2">
            Review the kitchen's notes, adjust as you like, then proceed to checkout.
          </p>
        </header>

        <div className="flex flex-col">
          {lines.map((line, i) => (
            <CartRow
              key={line.id}
              line={line}
              divider={i < lines.length - 1}
              onQtyChange={(q) => setQty(line.id, q)}
              onRemove={() => remove(line.id)}
            />
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-4 border-t border-rule pt-6">
          <HeritageButton href={siteConfig.routes.menu} variant="ghost">
            ← Add more from the menu
          </HeritageButton>
        </div>
      </main>

      {/* RIGHT: summary */}
      <aside className="sticky top-[92px]">
        <div className="rounded-[2px] border border-rule bg-cream p-6">
          <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-rule pb-3.5">
            <h2 className="m-0 font-serif text-[22px] font-medium tracking-[-0.005em] text-walnut">
              Order <em className="italic font-normal">summary</em>
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bronze-deep">
              {count} item{count === 1 ? '' : 's'}
            </span>
          </header>

          <div className="mb-4 flex flex-col gap-2">
            <SummaryRow label="Subtotal" value={formatGBP(subtotal)} />
            <SummaryRow
              label={
                <span>
                  Delivery <em className="italic text-ink-muted">· from</em>
                </span>
              }
              value={deliveryFeeFrom !== null ? formatGBP(deliveryFeeFrom) : '—'}
              muted
            />
            <SummaryRow label="Estimated total" value={formatGBP(total)} grand />
            <p className="m-0 -mt-1 text-right font-serif text-[12px] italic text-ink-muted">
              Final delivery fee confirmed by postcode at checkout.
            </p>
          </div>

          <Link
            href={siteConfig.routes.checkout}
            className="block w-full rounded-[2px] border-0 bg-walnut px-5 py-4 text-center font-serif text-[15px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep"
          >
            Proceed to checkout
          </Link>

          <div className="mt-4 text-center font-serif text-[12px] italic leading-[1.5] text-ink-muted">
            <b className="block font-medium not-italic tracking-[0.12em] text-bronze-deep [font-variant:small-caps]">
              Secure checkout
            </b>
            Card payment via Stripe · 5★ FSA hygiene
            <br />
            No frozen meals — cooked this morning
          </div>
        </div>
      </aside>
    </div>
  );
}

function CartRow({
  line,
  divider,
  onQtyChange,
  onRemove,
}: {
  line: CartLine;
  divider: boolean;
  onQtyChange: (q: number) => void;
  onRemove: () => void;
}) {
  const lineTotal = line.unitPriceGbp * line.quantity;
  const variantParts: string[] = [];
  for (const [k, v] of Object.entries(line.variantsChosen)) {
    variantParts.push(`${k}: ${v.label}`);
  }
  const addonsLine = line.addonsChosen.map((a) => a.label).join(', ');

  return (
    <article className={`grid grid-cols-[88px_1fr] gap-[14px] py-5 ${divider ? 'border-b border-rule' : ''} sm:grid-cols-[120px_1fr] sm:gap-5 sm:py-6`}>
      <Image
        src={line.imageSrc}
        alt={line.name}
        width={240}
        height={240}
        className="aspect-square w-full rounded-[2px] object-cover"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h3 className="m-0 font-serif text-[17px] font-medium tracking-[-0.005em] text-walnut sm:text-[20px]">
            {line.name}
          </h3>
          <span className="whitespace-nowrap font-serif text-[16px] font-semibold text-walnut sm:text-[18px]">
            {formatGBP(lineTotal)}
          </span>
        </div>

        {variantParts.length > 0 || addonsLine ? (
          <p className="m-0 font-serif text-[14px] italic leading-[1.45] text-ink-muted">
            {variantParts.map((p, i) => (
              <span key={p}>
                {i > 0 && <span className="text-bronze"> · </span>}
                <b className="font-medium not-italic text-walnut">{p.split(': ')[0]}:</b>{' '}
                {p.split(': ')[1]}
              </span>
            ))}
            {addonsLine && (
              <>
                <span className="text-bronze"> · </span>
                <b className="font-medium not-italic text-walnut">Add-ons:</b> {addonsLine}
              </>
            )}
          </p>
        ) : null}

        {line.specialInstructions && (
          <p className="m-0 mt-1 border-l-2 border-rule pl-3 font-serif text-[13px] italic leading-[1.5] text-ink-muted">
            "{line.specialInstructions}"
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="inline-flex items-center rounded-[2px] border border-rule" role="group" aria-label="Quantity">
              <button
                type="button"
                onClick={() => onQtyChange(line.quantity - 1)}
                aria-label={`Decrease quantity of ${line.name}`}
                className="h-9 w-9 cursor-pointer font-serif text-[18px] text-walnut transition-colors hover:bg-cream-soft"
              >
                −
              </button>
              <span className="w-9 text-center font-serif text-[15px] font-medium text-walnut">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => onQtyChange(line.quantity + 1)}
                aria-label={`Increase quantity of ${line.name}`}
                className="h-9 w-9 cursor-pointer font-serif text-[18px] text-walnut transition-colors hover:bg-cream-soft"
              >
                +
              </button>
            </div>
            <Link
              href={`${siteConfig.routes.itemDetail(line.slug)}?edit=${line.id}`}
              className="border-b border-bronze-deep pb-px font-serif text-[13px] italic text-bronze-deep transition-colors hover:border-walnut hover:text-walnut"
            >
              Edit options
            </Link>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="border-0 border-b border-transparent bg-transparent pb-px font-serif text-[13px] italic text-ink-muted transition-colors hover:border-[#8B2A1A] hover:text-[#8B2A1A]"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  grand,
}: {
  label: React.ReactNode;
  value: string;
  muted?: boolean;
  grand?: boolean;
}) {
  return (
    <div
      className={`flex justify-between font-serif text-[15px] text-walnut ${
        muted ? 'italic text-ink-muted' : ''
      } ${grand ? 'mt-1.5 border-t border-rule pt-3 text-[20px] font-semibold not-italic text-walnut' : ''}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
