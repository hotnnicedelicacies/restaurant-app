/**
 * Menu data access layer.
 *
 * Tries Supabase first. If Supabase env vars aren't configured, the
 * `menu_items` table doesn't exist, or the query errors out, falls back
 * to the legacy hardcoded data in `constants/meals.ts` so the site keeps
 * working during initial provisioning.
 *
 * Once admin has menu CRUD in Phase 6, the fallback becomes a no-op.
 */

import { getServerClient } from '@/lib/supabase/server';
import { getStorageUrl } from '@/lib/supabase/storage';
import type { Database, VariantsBlob, AddonsBlob } from '@/lib/supabase/types';
import { meals as legacyMeals } from '@/constants/meals';
import type { StaticImageData } from 'next/image';

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
  /** Either a Supabase Storage path/URL or a StaticImageData for legacy assets. */
  image: string | StaticImageData;
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

function isSupabaseConfigured() {
  // Accept either the new (publishable) or legacy (anon) key name so this
  // works on the live env and any older preview deploys.
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

// --- Fallback data adapters from constants/meals.ts -----------------------

type LegacyMeal = (typeof legacyMeals)[number];

const LEGACY_CATEGORY_ORDER = [
  'rice',
  'pasta',
  'grill',
  'soup',
  'swallow',
  'sides',
  'snacks',
  'breakfast',
] as const;

const LEGACY_CATEGORY_NAMES: Record<string, string> = {
  rice: 'Rice',
  pasta: 'Pasta',
  grill: 'Grill',
  soup: 'Soup',
  swallow: 'Swallow',
  sides: 'Sides',
  snacks: 'Snacks & Party',
  breakfast: 'Breakfast',
};

const LEGACY_FEATURED_SLUGS = [
  'jollof-rice-with-protein-and-plantain',
  'plantain-lasagna',
  'roasted-tilapia-fish',
  'suya',
  'edikaikong',
  'small-chops',
];

const LEGACY_SIGNATURES: Record<string, string[]> = {
  'jollof-rice-with-protein-and-plantain': ['Signature'],
  'plantain-lasagna': ['House signature'],
  'suya-burger': ['Fusion'],
};

function legacyToView(meal: LegacyMeal): MenuItemView {
  return {
    id: meal.id,
    slug: meal.id,
    categorySlug: meal.category,
    categoryName: LEGACY_CATEGORY_NAMES[meal.category] ?? meal.category,
    name: meal.name,
    description: meal.description,
    longDescription: null,
    priceGbp: meal.price,
    image: meal.image,
    galleryPaths: [],
    isAvailable: true,
    isCodEligible: true,
    isFeatured: LEGACY_FEATURED_SLUGS.includes(meal.id),
    dietaryTags: [],
    allergenTags: [],
    badges: LEGACY_SIGNATURES[meal.id] ?? [],
    variants: { groups: [] },
    addons: { items: [] },
  };
}

function legacyCategories(): MenuCategoryView[] {
  const seen = new Set<string>();
  return legacyMeals
    .map((m) => m.category)
    .filter((c) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    })
    .sort(
      (a, b) =>
        LEGACY_CATEGORY_ORDER.indexOf(a as (typeof LEGACY_CATEGORY_ORDER)[number]) -
        LEGACY_CATEGORY_ORDER.indexOf(b as (typeof LEGACY_CATEGORY_ORDER)[number])
    )
    .map((slug, i) => ({
      id: slug,
      slug,
      name: LEGACY_CATEGORY_NAMES[slug] ?? slug,
      description: null,
      displayOrder: i,
    }));
}

// --- Supabase adapters ----------------------------------------------------

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

// --- Public API -----------------------------------------------------------

export async function getCategoriesWithItems(): Promise<{
  categories: MenuCategoryView[];
  itemsByCategory: Record<string, MenuItemView[]>;
}> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await getServerClient();
      const { data: categories } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_visible', true)
        .is('archived_at', null)
        .order('display_order', { ascending: true });

      const { data: items } = await supabase
        .from('menu_items')
        .select('*, category:menu_categories!inner(name,slug)')
        .eq('is_hidden', false)
        .is('archived_at', null)
        .order('display_order', { ascending: true });

      if (categories && items) {
        const cats: MenuCategoryView[] = categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          displayOrder: c.display_order,
        }));
        const byCat: Record<string, MenuItemView[]> = {};
        for (const c of cats) byCat[c.slug] = [];
        for (const it of items as unknown as DbItem[]) {
          const slug = it.category?.slug;
          if (slug && byCat[slug]) byCat[slug].push(dbToView(it));
        }
        return { categories: cats, itemsByCategory: byCat };
      }
    } catch (err) {
      console.warn('[menu] Supabase fetch failed, falling back to legacy data:', err);
    }
  }

  // Fallback: legacy hardcoded data
  const categories = legacyCategories();
  const byCat: Record<string, MenuItemView[]> = {};
  for (const c of categories) byCat[c.slug] = [];
  for (const m of legacyMeals) {
    if (byCat[m.category]) byCat[m.category].push(legacyToView(m));
  }
  return { categories, itemsByCategory: byCat };
}

export async function getMenuItem(slug: string): Promise<MenuItemView | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await getServerClient();
      const { data } = await supabase
        .from('menu_items')
        .select('*, category:menu_categories!inner(name,slug)')
        .eq('slug', slug)
        .eq('is_hidden', false)
        .is('archived_at', null)
        .maybeSingle();
      if (data) return dbToView(data as unknown as DbItem);
    } catch (err) {
      console.warn('[menu] Supabase getMenuItem failed:', err);
    }
  }

  const legacy = legacyMeals.find((m) => m.id === slug);
  return legacy ? legacyToView(legacy) : null;
}

export async function getFeaturedItems(limit = 6): Promise<MenuItemView[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await getServerClient();
      const { data } = await supabase
        .from('menu_items')
        .select('*, category:menu_categories!inner(name,slug)')
        .eq('is_featured', true)
        .eq('is_hidden', false)
        .is('archived_at', null)
        .order('display_order', { ascending: true })
        .limit(limit);
      if (data) return (data as unknown as DbItem[]).map(dbToView);
    } catch (err) {
      console.warn('[menu] Supabase getFeaturedItems failed:', err);
    }
  }

  return LEGACY_FEATURED_SLUGS.slice(0, limit)
    .map((id) => legacyMeals.find((m) => m.id === id))
    .filter((m): m is LegacyMeal => Boolean(m))
    .map(legacyToView);
}
