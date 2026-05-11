'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useCart, type CartLine } from '@/lib/cart/store';
import type { VariantsBlob, AddonsBlob } from '@/lib/supabase/types';
import { formatGBP, formatPriceDelta } from '@/lib/utils';
import { siteConfig } from '@/constants/siteConfig';

interface Item {
  id: string;
  slug: string;
  name: string;
  basePriceGbp: number;
  image: string;
  variants: VariantsBlob;
  addons: AddonsBlob;
  isAvailable: boolean;
}

/**
 * The customise + add-to-cart form on /menu/[slug]. Renders the variants
 * jsonb as required radio groups and the addons jsonb as optional
 * checkboxes. Computes a live total. Adds a CartLine to the zustand cart
 * store on submit.
 */
export default function CustomiseForm({ item }: { item: Item }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingLineId = searchParams.get('edit');
  const addToCart = useCart((s) => s.add);
  const removeFromCart = useCart((s) => s.remove);
  const cartLines = useCart((s) => s.lines);
  const cartCount = useCart((s) => s.count());

  // Defaults: first option per required group
  const [variantSelections, setVariantSelections] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    item.variants.groups.forEach((g) => {
      if (g.is_required && g.options.length > 0) init[g.name] = 0;
    });
    return init;
  });
  const [addonSelections, setAddonSelections] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);

  // If arrived via "Edit options" on the cart, pre-fill from that line.
  // Done in useEffect so we only run after mount (zustand-persist hydrates
  // from localStorage on the client only).
  const [prefilledFromLineId, setPrefilledFromLineId] = useState<string | null>(null);
  useEffect(() => {
    if (!editingLineId || prefilledFromLineId === editingLineId) return;
    const line = cartLines.find((l) => l.id === editingLineId);
    if (!line || line.menuItemId !== item.id) return;

    const variants: Record<string, number> = {};
    for (const [groupName, choice] of Object.entries(line.variantsChosen)) {
      const g = item.variants.groups.find((x) => x.name === groupName);
      if (!g) continue;
      const idx = g.options.findIndex((o) => o.label === choice.label);
      if (idx >= 0) variants[groupName] = idx;
    }
    const addons = new Set<number>();
    for (const chosen of line.addonsChosen) {
      const idx = item.addons.items.findIndex((a) => a.label === chosen.label);
      if (idx >= 0) addons.add(idx);
    }
    setVariantSelections(variants);
    setAddonSelections(addons);
    setNotes(line.specialInstructions ?? '');
    setQty(line.quantity);
    setPrefilledFromLineId(editingLineId);
  }, [editingLineId, prefilledFromLineId, cartLines, item.id, item.variants.groups, item.addons.items]);

  const unitPrice = useMemo(() => {
    let total = item.basePriceGbp;
    for (const [groupName, idx] of Object.entries(variantSelections)) {
      const g = item.variants.groups.find((x) => x.name === groupName);
      if (g && g.options[idx]) total += g.options[idx].price_delta_gbp;
    }
    for (const idx of addonSelections) {
      const a = item.addons.items[idx];
      if (a) total += a.price_delta_gbp;
    }
    return total;
  }, [item, variantSelections, addonSelections]);

  const lineTotal = unitPrice * qty;

  const onAdd = () => {
    if (!item.isAvailable) {
      toast.error('Sold out today — try another dish.');
      return;
    }

    // Validate required variants
    for (const g of item.variants.groups) {
      if (g.is_required && variantSelections[g.name] === undefined) {
        toast.error(`Please choose a ${g.name.toLowerCase()}.`);
        return;
      }
    }

    const variantsChosen: CartLine['variantsChosen'] = {};
    for (const [groupName, idx] of Object.entries(variantSelections)) {
      const g = item.variants.groups.find((x) => x.name === groupName);
      if (g && g.options[idx]) {
        variantsChosen[groupName] = {
          label: g.options[idx].label,
          deltaGbp: g.options[idx].price_delta_gbp,
        };
      }
    }

    const addonsChosen: CartLine['addonsChosen'] = Array.from(addonSelections).map((i) => ({
      label: item.addons.items[i].label,
      deltaGbp: item.addons.items[i].price_delta_gbp,
    }));

    // Editing an existing cart line → drop the old one and add the new
    // version so variants/addons/notes/qty are all replaced cleanly.
    if (editingLineId) {
      removeFromCart(editingLineId);
    }

    addToCart({
      menuItemId: item.id,
      slug: item.slug,
      name: item.name,
      basePriceGbp: item.basePriceGbp,
      unitPriceGbp: unitPrice,
      quantity: qty,
      variantsChosen,
      addonsChosen,
      specialInstructions: notes.trim() || undefined,
      imageSrc: item.image,
    });

    if (editingLineId) {
      toast.success(`${item.name} updated.`);
      router.push(siteConfig.routes.cart);
      return;
    }

    toast.success(`${qty} × ${item.name} added to your basket`, {
      action: { label: 'View basket', onClick: () => router.push(siteConfig.routes.cart) },
    });

    setQty(1);
    setNotes('');
    setAddonSelections(new Set());
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd();
      }}
      className="mt-2 flex flex-col gap-6"
    >
      {/* Variant groups */}
      {item.variants.groups.map((group) => (
        <fieldset key={group.name} className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-1 flex items-baseline gap-2.5 font-serif text-[14px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
            {group.name}
            <small className="font-serif text-[12.5px] italic tracking-normal text-ink-muted [font-variant:normal]">
              · {group.is_required ? 'required, choose one' : 'optional'}
            </small>
          </legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
            {group.options.map((opt, i) => {
              const selected = variantSelections[group.name] === i;
              return (
                <label key={opt.label} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name={group.name}
                    value={i}
                    checked={selected}
                    onChange={() => setVariantSelections((s) => ({ ...s, [group.name]: i }))}
                    className="pointer-events-none absolute opacity-0"
                  />
                  <span
                    className={`flex items-center justify-between gap-3 rounded-[2px] border bg-cream px-3.5 py-3 font-serif text-[15px] text-walnut transition-colors ${
                      selected
                        ? 'border-walnut bg-cream-soft shadow-[inset_0_0_0_1px_var(--color-walnut)]'
                        : 'border-rule hover:border-walnut'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <small className="font-serif text-[13px] italic text-ink-muted">
                      {opt.price_delta_gbp === 0 ? 'included' : formatPriceDelta(opt.price_delta_gbp)}
                    </small>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/* Addons */}
      {item.addons.items.length > 0 && (
        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-1 flex items-baseline gap-2.5 font-serif text-[14px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
            Add-ons
            <small className="font-serif text-[12.5px] italic tracking-normal text-ink-muted [font-variant:normal]">
              · optional
            </small>
          </legend>
          <div className="flex flex-col border-t border-rule">
            {item.addons.items.map((addon, i) => {
              const checked = addonSelections.has(i);
              return (
                <label
                  key={addon.label}
                  className="flex cursor-pointer items-center justify-between gap-3 border-b border-rule py-3"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setAddonSelections((s) => {
                          const next = new Set(s);
                          if (e.target.checked) next.add(i);
                          else next.delete(i);
                          return next;
                        })
                      }
                      className="h-[18px] w-[18px] accent-walnut"
                    />
                    <span>
                      <span className="font-serif text-[15px] text-walnut">{addon.label}</span>
                      {addon.description && (
                        <>
                          <br />
                          <span className="font-serif text-[13px] italic text-ink-muted">
                            {addon.description}
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                  <span className="whitespace-nowrap font-serif text-[14px] font-medium text-bronze-deep">
                    {formatPriceDelta(addon.price_delta_gbp) || formatGBP(0, { showZero: true })}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Special instructions */}
      <div className="flex flex-col gap-2.5">
        <label className="font-serif text-[14px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
          Special instructions
          <small className="ml-1.5 font-serif text-[12.5px] italic tracking-normal text-ink-muted [font-variant:normal]">
            · optional
          </small>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Less spicy, no onions, allergies we should know about…"
          maxLength={500}
          rows={3}
          className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[15px] italic leading-[1.55] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted"
        />
      </div>

      {/* Qty stepper + Add to order */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-6">
        <div className="inline-flex items-center rounded-[2px] border border-rule" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="h-[44px] w-[44px] cursor-pointer font-serif text-[20px] text-walnut transition-colors hover:bg-cream-soft disabled:cursor-not-allowed disabled:text-ink-muted"
          >
            −
          </button>
          <span aria-live="polite" className="w-[44px] text-center font-serif text-[16px] font-medium text-walnut">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="h-[44px] w-[44px] cursor-pointer font-serif text-[20px] text-walnut transition-colors hover:bg-cream-soft"
          >
            +
          </button>
        </div>
        <button
          type="submit"
          disabled={!item.isAvailable}
          className="inline-flex flex-1 items-center justify-between gap-3 rounded-[2px] border-0 bg-walnut px-6 py-[13px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-bronze-deep disabled:opacity-50 disabled:hover:bg-walnut"
        >
          <span>{editingLineId ? 'Update basket' : 'Add to order'}</span>
          <span className="font-serif text-[16px] font-semibold tracking-[0.02em] [font-variant:normal]">
            {formatGBP(lineTotal, { showZero: true })}
          </span>
        </button>
      </div>

      <p className="m-0 mt-1 text-center font-serif text-[13.5px] italic text-ink-muted">
        {cartCount > 0
          ? `${cartCount} item${cartCount === 1 ? '' : 's'} already in your basket — checkout from the cart when you're ready.`
          : 'Add to your order to keep browsing — checkout from the cart when you\'re ready.'}
      </p>
    </form>
  );
}
