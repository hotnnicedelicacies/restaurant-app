/**
 * Menu data access layer — Supabase only.
 *
 * No hardcoded fallback. All public reads are wrapped in unstable_cache so
 * Vercel's data cache serves the last good response; admin mutations call
 * revalidateTag('menu') to invalidate. If Supabase is genuinely unreachable
 * AND the cache is cold, callers receive an empty result and the page
 * renders an empty state — preferable to silently serving stale legacy data.
 */

import { unstable_cache } from 'next/cache';
import { getPublicClient } from '@/lib/supabase/public';
import { getStorageUrl } from '@/lib/supabase/storage';
import type { Database, VariantsBlob, AddonsBlob } from '@/lib/supabase/types';

export const MENU_TAG = 'menu';

export interface MenuCategoryView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
}

export interface MenuItemView {
  id: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  name: string;
  description: string;
  longDescription: string | null;
  priceGbp: number;
  image: string;
  galleryPaths: string[];
  isAvailable: boolean;
  isCodEligible: boolean;
  isFeatured: boolean;
  dietaryTags: string[];
  allergenTags: string[];
  badges: string[];
  variants: VariantsBlob;
  addons: AddonsBlob;
}

type DbItem = Database['public']['Tables']['menu_items']['Row'] & {
  category: Pick<Database['public']['Tables']['menu_categories']['Row'], 'name' | 'slug'> | null;
};

function dbToView(item: DbItem): MenuItemView {
  return {
    id: item.id,
    slug: item.slug,
    categorySlug: item.category?.slug ?? '',
    categoryName: item.category?.name ?? '',
    name: item.name,
    description: item.description,
    longDescription: item.long_description,
    priceGbp: Number(item.price_gbp),
    image: getStorageUrl(item.image_path),
    galleryPaths: item.gallery_paths.map((p) => getStorageUrl(p)),
    isAvailable: item.is_available_today,
    isCodEligible: item.is_cod_eligible,
    isFeatured: item.is_featured,
    dietaryTags: item.dietary_tags,
    allergenTags: item.allergen_tags,
    badges: item.badges,
    variants: item.variants,
    addons: item.addons,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Uncached implementations
// ─────────────────────────────────────────────────────────────────────

async function _getCategoriesWithItems(): Promise<{
  categories: MenuCategoryView[];
  itemsByCategory: Record<string, MenuItemView[]>;
}> {
  try {
    const supabase = getPublicClient();
    const [{ data: categories, error: catErr }, { data: items, error: itemsErr }] =
      await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('is_visible', true)
          .is('archived_at', null)
          .order('display_order', { ascending: true }),
        supabase
          .from('menu_items')
          .select('*, category:menu_categories!inner(name,slug)')
          .eq('is_hidden', false)
          .is('archived_at', null)
          .order('display_order', { ascending: true }),
      ]);

    if (catErr) console.error('[menu] categories query error:', catErr);
    if (itemsErr) console.error('[menu] items query error:', itemsErr);
    if (!categories) return { categories: [], itemsByCategory: {} };

    const cats: MenuCategoryView[] = categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      displayOrder: c.display_order,
    }));
    const byCat: Record<string, MenuItemView[]> = {};
    for (const c of cats) byCat[c.slug] = [];
    for (const it of (items ?? []) as unknown as DbItem[]) {
      const slug = it.category?.slug;
      if (slug && byCat[slug]) byCat[slug].push(dbToView(it));
    }
    return { categories: cats, itemsByCategory: byCat };
  } catch (err) {
    console.error('[menu] getCategoriesWithItems threw:', err);
    return { categories: [], itemsByCategory: {} };
  }
}

async function _getMenuItem(slug: string): Promise<MenuItemView | null> {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, category:menu_categories!inner(name,slug)')
      .eq('slug', slug)
      .eq('is_hidden', false)
      .is('archived_at', null)
      .maybeSingle();
    if (error) console.error('[menu] getMenuItem error:', error);
    return data ? dbToView(data as unknown as DbItem) : null;
  } catch (err) {
    console.error('[menu] getMenuItem threw:', err);
    return null;
  }
}

async function _getFeaturedItems(limit: number): Promise<MenuItemView[]> {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, category:menu_categories!inner(name,slug)')
      .eq('is_featured', true)
      .eq('is_hidden', false)
      .is('archived_at', null)
      .order('display_order', { ascending: true })
      .limit(limit);
    if (error) console.error('[menu] getFeaturedItems error:', error);
    return (data ?? []).map((d) => dbToView(d as unknown as DbItem));
  } catch (err) {
    console.error('[menu] getFeaturedItems threw:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────
// Cached public API
// `revalidate: 60` = serve the cached value for 60s, then revalidate in
// the background. If Supabase is briefly down the last-good response
// continues to serve. Admin mutations call revalidateTag(MENU_TAG).
// ─────────────────────────────────────────────────────────────────────

export const getCategoriesWithItems = unstable_cache(
  _getCategoriesWithItems,
  ['menu:categories-with-items'],
  { revalidate: 60, tags: [MENU_TAG] }
);

export const getMenuItem = unstable_cache(
  _getMenuItem,
  ['menu:item-by-slug'],
  { revalidate: 60, tags: [MENU_TAG] }
);

export const getFeaturedItems = unstable_cache(
  async (limit: number = 6) => _getFeaturedItems(limit),
  ['menu:featured'],
  { revalidate: 60, tags: [MENU_TAG] }
);
