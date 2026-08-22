/**
 * One-page layout for the printable menu sheet.
 *
 * Satori (next/og) lays out flexbox but will not shrink content to fit a
 * page, so we decide density up front: try the most generous type tier,
 * estimate how tall every block will be, pack blocks into columns, and
 * step down a tier until everything fits. If even the tightest tier
 * overflows, the tail is omitted and reported so the preview can warn.
 *
 * Pure and synchronous — no React, no I/O — so it can be unit-tested and
 * reused by the preview page for its "fits / N omitted" status.
 */

export interface SheetItem {
  name: string;
  description: string;
  price: number;
}

export interface SheetCategory {
  name: string;
  items: SheetItem[];
}

export interface Tier {
  key: 'L' | 'ML' | 'M' | 'S' | 'XS';
  columns: 1 | 2;
  /** Category heading font size (px on the 2480-wide canvas). */
  head: number;
  name: number;
  desc: number;
  /** Vertical gap after each item. */
  gapItem: number;
  /** Vertical gap after each category block. */
  gapCategory: number;
}

/** Generous → tight. Sizes are px on the A4 @ 300 dpi canvas (2480 × 3508). */
export const TIERS: Tier[] = [
  { key: 'L', columns: 1, head: 40, name: 52, desc: 34, gapItem: 30, gapCategory: 64 },
  // Two columns at near-L type: fills the page for menus of ~15–25 dishes
  // instead of jumping straight to M and leaving the bottom third empty.
  { key: 'ML', columns: 2, head: 38, name: 48, desc: 32, gapItem: 28, gapCategory: 60 },
  { key: 'M', columns: 2, head: 34, name: 42, desc: 29, gapItem: 24, gapCategory: 52 },
  { key: 'S', columns: 2, head: 30, name: 36, desc: 26, gapItem: 18, gapCategory: 44 },
  { key: 'XS', columns: 2, head: 28, name: 32, desc: 23, gapItem: 14, gapCategory: 36 },
];

export interface SheetBlock {
  category: string;
  /** True when this block continues a category that started in the previous column. */
  continued: boolean;
  items: SheetItem[];
}

export interface SheetColumn {
  blocks: SheetBlock[];
}

export interface SheetLayout {
  tier: Tier;
  columns: SheetColumn[];
  total: number;
  placed: number;
  omitted: number;
}

export interface LayoutOptions {
  descriptions: boolean;
  /** Height available for the body (below masthead, above footer). */
  bodyHeight: number;
  /** Width available for the body. */
  bodyWidth: number;
  columnGap: number;
}

// Average glyph advance as a fraction of font size. Measured from renders:
// Cormorant 500 runs ≈0.40em, the italic ≈0.38em. Kept a little pessimistic
// so estimates round up — an under-estimate would overflow the page
// silently, an over-estimate only costs some whitespace.
const NAME_EM = 0.44;
const DESC_EM = 0.41;
const NAME_LH = 1.22;
const DESC_LH = 1.32;
/** Room reserved on the name line for the right-aligned price ("£12.50" + gap). */
const PRICE_CHARS = 8;

export function priceLabel(n: number): string {
  return `£${n.toFixed(2)}`;
}

function linesFor(text: string, charsPerLine: number): number {
  if (!text) return 0;
  // Word-wrap estimate: walk words and count line breaks.
  let lines = 1;
  let used = 0;
  for (const word of text.trim().split(/\s+/)) {
    const w = word.length;
    if (used === 0) {
      used = w;
    } else if (used + 1 + w <= charsPerLine) {
      used += 1 + w;
    } else {
      lines += 1;
      used = w;
    }
  }
  return lines;
}

function itemHeight(item: SheetItem, tier: Tier, colWidth: number, descriptions: boolean): number {
  const nameChars = Math.max(8, Math.floor(colWidth / (tier.name * NAME_EM)) - PRICE_CHARS);
  const nameLines = linesFor(item.name, nameChars);
  let h = nameLines * tier.name * NAME_LH;
  if (descriptions && item.description) {
    const descChars = Math.max(10, Math.floor(colWidth / (tier.desc * DESC_EM)));
    h += 6 + linesFor(item.description, descChars) * tier.desc * DESC_LH;
  }
  return h + tier.gapItem;
}

/** Heading text + ornament rule + spacing beneath. */
function headHeight(tier: Tier): number {
  return tier.head * 1.3 + 34;
}

/**
 * Estimated height of the whole menu in one column at this tier — used to
 * balance multi-column layouts so the columns end at similar heights.
 */
function totalHeight(categories: SheetCategory[], tier: Tier, colWidth: number, descriptions: boolean): number {
  let h = 0;
  for (const c of categories) {
    if (c.items.length === 0) continue;
    h += headHeight(tier) + tier.gapCategory;
    for (const item of c.items) h += itemHeight(item, tier, colWidth, descriptions);
  }
  return h;
}

function packTier(
  categories: SheetCategory[],
  tier: Tier,
  opts: LayoutOptions,
  /** Height budget per column; the last column always gets the full body height. */
  budgets: number[]
): SheetLayout {
  const colWidth = (opts.bodyWidth - opts.columnGap * (tier.columns - 1)) / tier.columns;
  const columns: SheetColumn[] = Array.from({ length: tier.columns }, () => ({ blocks: [] }));
  let col = 0;
  let used = 0;
  let placed = 0;
  const total = categories.reduce((n, c) => n + c.items.length, 0);
  const budget = () => budgets[col];

  const nextColumn = (): boolean => {
    if (col + 1 >= tier.columns) return false;
    col += 1;
    used = 0;
    return true;
  };

  outer: for (const category of categories) {
    if (category.items.length === 0) continue;
    let idx = 0;
    let continued = false;
    while (idx < category.items.length) {
      // A heading must be followed by at least one item in the same column.
      const first = itemHeight(category.items[idx], tier, colWidth, opts.descriptions);
      if (used + headHeight(tier) + first > budget()) {
        if (used === 0 || !nextColumn()) break outer; // nothing fits even in a fresh column → stop
        continue;
      }
      const block: SheetBlock = { category: category.name, continued, items: [] };
      used += headHeight(tier);
      while (idx < category.items.length) {
        const h = itemHeight(category.items[idx], tier, colWidth, opts.descriptions);
        if (used + h > budget()) break;
        block.items.push(category.items[idx]);
        used += h;
        idx += 1;
        placed += 1;
      }
      columns[col].blocks.push(block);
      if (idx < category.items.length) {
        // Column full mid-category → continue in the next column.
        if (!nextColumn()) break outer;
        continued = true;
      } else {
        used += tier.gapCategory;
      }
    }
  }

  return { tier, columns, total, placed, omitted: total - placed };
}

function tryTier(categories: SheetCategory[], tier: Tier, opts: LayoutOptions): SheetLayout {
  const full = Array.from({ length: tier.columns }, () => opts.bodyHeight);
  if (tier.columns === 1) return packTier(categories, tier, opts, full);

  // Balanced first: give every column but the last an equal share of the
  // estimated total (plus a little slack for block boundaries), so a menu
  // that fits doesn't pile up in column one and leave column two half empty.
  const colWidth = (opts.bodyWidth - opts.columnGap * (tier.columns - 1)) / tier.columns;
  const share = totalHeight(categories, tier, colWidth, opts.descriptions) / tier.columns;
  const balanced = full.map((h, i) =>
    i === tier.columns - 1 ? h : Math.min(h, share + headHeight(tier) + tier.gapCategory)
  );
  const attempt = packTier(categories, tier, opts, balanced);
  if (attempt.omitted === 0) return attempt;
  // Balancing left something off the page — fall back to greedy fill.
  return packTier(categories, tier, opts, full);
}

/** Pick the most generous tier that fits everything; otherwise the tightest, truncated. */
export function layoutSheet(categories: SheetCategory[], opts: LayoutOptions): SheetLayout {
  let last: SheetLayout | null = null;
  for (const tier of TIERS) {
    last = tryTier(categories, tier, opts);
    if (last.omitted === 0) return last;
  }
  return last as SheetLayout;
}
