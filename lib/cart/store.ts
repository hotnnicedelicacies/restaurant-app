'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Cart line item — snapshot of the menu item + customer choices.
 * One line per unique (menuItemId + variants + addons + notes) combo;
 * incrementing quantity stays on the same line.
 */
export interface CartLine {
  /** Stable random id for React keys; not the menu item id. */
  id: string;
  menuItemId: string;
  slug: string;
  name: string;
  basePriceGbp: number;
  /** Resolved unit price with variant + addon deltas applied. */
  unitPriceGbp: number;
  quantity: number;
  variantsChosen: Record<string, { label: string; deltaGbp: number }>;
  addonsChosen: { label: string; deltaGbp: number }[];
  specialInstructions?: string;
  /** Either a URL (Supabase Storage) or a static asset path. */
  imageSrc: string;
}

interface CartState {
  lines: CartLine[];
  /** Add a new line. If an identical line exists (same item + identical
   * variants/addons/notes), bumps its quantity instead. */
  add: (line: Omit<CartLine, 'id'> & { id?: string }) => void;
  /** Update an existing line's quantity. Removes when qty ≤ 0. */
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Totals (computed). */
  subtotal: () => number;
  count: () => number;
}

const sameLine = (a: Omit<CartLine, 'id'>, b: CartLine) =>
  a.menuItemId === b.menuItemId &&
  a.specialInstructions === b.specialInstructions &&
  JSON.stringify(a.variantsChosen) === JSON.stringify(b.variantsChosen) &&
  JSON.stringify(a.addonsChosen) === JSON.stringify(b.addonsChosen);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) => {
        const incoming = { ...line, id: line.id ?? cryptoRandomId() };
        set((s) => {
          const existing = s.lines.find((l) => sameLine(incoming, l));
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.id === existing.id ? { ...l, quantity: l.quantity + line.quantity } : l
              ),
            };
          }
          return { lines: [...s.lines, incoming as CartLine] };
        });
      },
      setQuantity: (id, quantity) =>
        set((s) => ({
          lines: quantity <= 0
            ? s.lines.filter((l) => l.id !== id)
            : s.lines.map((l) => (l.id === id ? { ...l, quantity } : l)),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
      subtotal: () => get().lines.reduce((s, l) => s + l.unitPriceGbp * l.quantity, 0),
      count: () => get().lines.reduce((s, l) => s + l.quantity, 0),
    }),
    {
      name: 'hnn_cart',
      storage: createJSONStorage(() => localStorage),
      // v2: bumped after the menu data source moved from legacy slugs to
      // Supabase UUIDs. Older persisted carts stored slugs in `menuItemId`,
      // which broke checkout once the DB went live. Returning undefined
      // here wipes the stored state so the cart starts empty.
      version: 2,
      migrate: () => undefined,
    }
  )
);

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
