/**
 * Everything the menu sheet prints, assembled from the same fetchers the
 * customer site uses — menu, hours, contact, trailer — so the sheet can
 * never disagree with the website. Nothing here is hardcoded business data.
 */

import { siteConfig } from '@/constants/siteConfig';
import { formatLongDate } from '@/lib/utils';
import { getCategoriesWithItems } from '@/lib/data/menu';
import { getHours } from '@/lib/data/hours';
import { getContact } from '@/lib/data/contact';
import { getTrailer } from '@/lib/data/trailer';
import type { SheetCategory } from './layout';

export type SheetScope = 'today' | 'all';

export interface SheetOptions {
  scope: SheetScope;
  descriptions: boolean;
}

export interface SheetMeta {
  /** "Today's Bill of Fare · Saturday 22 August 2026" */
  eyebrow: string;
  /** Italic line under the masthead. */
  sub: string;
  /** Footer columns: label + lines. `stars` draws a row of bronze stars above the lines. */
  footer: { label: string; lines: string[]; stars?: number }[];
  /** Shown when the sheet is truncated. */
  moreAt: string;
  /** File name for downloads. */
  fileName: string;
}

export function parseSheetOptions(sp: { scope?: string; desc?: string }): SheetOptions {
  return {
    scope: sp.scope === 'all' ? 'all' : 'today',
    descriptions: sp.desc !== '0',
  };
}

export async function buildSheetData(
  scope: SheetScope
): Promise<{ categories: SheetCategory[]; meta: SheetMeta }> {
  const [{ categories, itemsByCategory }, hours, contact, trailer] = await Promise.all([
    getCategoriesWithItems(),
    getHours(),
    getContact(),
    getTrailer(),
  ]);

  const sheetCategories: SheetCategory[] = categories
    .map((cat) => ({
      name: cat.name,
      items: (itemsByCategory[cat.slug] ?? [])
        .filter((item) => (scope === 'today' ? item.isAvailable : true))
        .map((item) => ({ name: item.name, description: item.description, price: item.priceGbp })),
    }))
    .filter((cat) => cat.items.length > 0);

  const today = new Date();
  const website = `www.${siteConfig.domain}`;
  const isoDate = today.toISOString().slice(0, 10);

  const findUs = trailer.enabled
    ? [
        `${trailer.venue}, ${trailer.area.split(',')[0]} ${trailer.postcode}`,
        `${trailer.daysShort} · ${trailer.timeLong}`,
      ]
    : ['Delivered across Teesside', `${hours.daysShort} · ${hours.timeLong}`];

  const meta: SheetMeta = {
    eyebrow:
      scope === 'today'
        ? `Today's Bill of Fare · ${formatLongDate(today)}`
        : `Bill of Fare · ${today.getFullYear()}`,
    sub:
      scope === 'today'
        ? `Cooked this morning · ${hours.cutoffShort}`
        : `Italian classics & West African home cooking · ${hours.cutoffShort}`,
    footer: [
      { label: 'Order', lines: [`WhatsApp ${contact.whatsappDisplay}`, website] },
      { label: trailer.enabled ? 'The trailer' : 'Delivery', lines: findUs },
      {
        label: 'Our word',
        // The star glyph isn't in Cormorant, so the sheet draws stars as SVG.
        stars: siteConfig.foodHygiene.rating,
        lines: [
          `Food Hygiene Rating · ${siteConfig.foodHygiene.authority}`,
          'Halal · Cooked from scratch · No frozen meals',
        ],
      },
    ],
    moreAt: `full menu at ${website}`,
    fileName: `hot-n-nice-menu-${scope}-${isoDate}.png`,
  };

  return { categories: sheetCategories, meta };
}
