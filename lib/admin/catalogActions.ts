'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { MENU_TAG } from '@/lib/data/menu';
import { ZONES_TAG } from '@/lib/data/zones';
import { HOURS_TAG } from '@/lib/data/hours';
import { getServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import type { VariantsBlob, AddonsBlob } from '@/lib/supabase/types';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────

export async function createCategory(args: {
  name: string;
  description?: string;
  displayOrder?: number;
}): Promise<Result<{ id: string }>> {
  await requireAdmin();
  if (!args.name.trim()) return { ok: false, error: 'Name is required.' };
  const slug = slugify(args.name);

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('menu_categories')
    .insert({
      name: args.name.trim(),
      slug,
      description: args.description?.trim() || null,
      display_order: args.displayOrder ?? 0,
      is_visible: true,
      archived_at: null,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/categories');
  revalidatePath('/menu');
  revalidateTag(MENU_TAG, 'default');
  return { ok: true, data: { id: data.id } };
}

export async function updateCategory(args: {
  id: string;
  name?: string;
  description?: string;
  displayOrder?: number;
  isVisible?: boolean;
}): Promise<Result> {
  await requireAdmin();
  const supabase = getServiceClient();
  const patch: {
    name?: string;
    slug?: string;
    description?: string | null;
    display_order?: number;
    is_visible?: boolean;
  } = {};
  if (args.name !== undefined) {
    patch.name = args.name.trim();
    patch.slug = slugify(args.name);
  }
  if (args.description !== undefined) patch.description = args.description.trim() || null;
  if (args.displayOrder !== undefined) patch.display_order = args.displayOrder;
  if (args.isVisible !== undefined) patch.is_visible = args.isVisible;

  const { error } = await supabase.from('menu_categories').update(patch).eq('id', args.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/categories');
  revalidatePath('/menu');
  revalidateTag(MENU_TAG, 'default');
  return { ok: true };
}

export async function archiveCategory(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('menu_categories')
    .update({ archived_at: new Date().toISOString(), is_visible: false })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/categories');
  revalidatePath('/menu');
  revalidateTag(MENU_TAG, 'default');
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Zones
// ─────────────────────────────────────────────────────────────────────

export async function upsertZone(args: {
  id?: string;
  name: string;
  postcodes: string[];
  baseFeeGbp: number;
  minOrderGbp: number;
  prepTimeMin: number;
  prepTimeMax: number;
  isQuoted: boolean;
  allowsCod: boolean;
  isActive: boolean;
  displayOrder: number;
}): Promise<Result<{ id: string }>> {
  await requireAdmin();
  if (!args.name.trim()) return { ok: false, error: 'Name is required.' };
  const supabase = getServiceClient();
  const payload = {
    name: args.name.trim(),
    postcodes: args.postcodes.map((p) => p.trim().toUpperCase()).filter(Boolean),
    base_fee_gbp: args.baseFeeGbp,
    min_order_gbp: args.minOrderGbp,
    prep_time_min: args.prepTimeMin,
    prep_time_max: args.prepTimeMax,
    is_quoted: args.isQuoted,
    allows_cod: args.allowsCod,
    is_active: args.isActive,
    display_order: args.displayOrder,
    archived_at: null,
  };

  if (args.id) {
    const { error } = await supabase.from('delivery_zones').update(payload).eq('id', args.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin/zones');
    revalidatePath('/checkout');
    revalidateTag(ZONES_TAG, 'default');
    return { ok: true, data: { id: args.id } };
  }

  const { data, error } = await supabase.from('delivery_zones').insert(payload).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/zones');
  revalidatePath('/checkout');
    revalidateTag(ZONES_TAG, 'default');
  return { ok: true, data: { id: data.id } };
}

export async function archiveZone(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('delivery_zones')
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/zones');
  revalidateTag(ZONES_TAG, 'default');
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Menu items
// ─────────────────────────────────────────────────────────────────────

export interface MenuItemFormData {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  longDescription?: string;
  priceGbp: number;
  imagePath?: string | null;
  isAvailableToday: boolean;
  isCodEligible: boolean;
  isFeatured: boolean;
  isHidden: boolean;
  dietaryTags: string[];
  allergenTags: string[];
  badges: string[];
  variants: VariantsBlob;
  addons: AddonsBlob;
  displayOrder: number;
}

export async function upsertMenuItem(args: MenuItemFormData): Promise<Result<{ id: string }>> {
  await requireAdmin();
  if (!args.name.trim()) return { ok: false, error: 'Name is required.' };
  if (!args.categoryId) return { ok: false, error: 'Category is required.' };
  if (args.priceGbp < 0) return { ok: false, error: 'Price must be ≥ £0.' };

  const supabase = getServiceClient();
  const payload = {
    category_id: args.categoryId,
    name: args.name.trim(),
    slug: slugify(args.name),
    description: args.description.trim(),
    long_description: args.longDescription?.trim() || null,
    price_gbp: args.priceGbp,
    image_path: args.imagePath ?? null,
    gallery_paths: [],
    is_available_today: args.isAvailableToday,
    is_cod_eligible: args.isCodEligible,
    is_featured: args.isFeatured,
    is_hidden: args.isHidden,
    dietary_tags: args.dietaryTags,
    allergen_tags: args.allergenTags,
    badges: args.badges,
    variants: args.variants,
    addons: args.addons,
    display_order: args.displayOrder,
    archived_at: null,
  };

  if (args.id) {
    const { error } = await supabase.from('menu_items').update(payload).eq('id', args.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin/menu');
    revalidatePath('/menu');
  revalidateTag(MENU_TAG, 'default');
    revalidatePath(`/menu/${payload.slug}`);
    return { ok: true, data: { id: args.id } };
  }

  const { data, error } = await supabase.from('menu_items').insert(payload).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/menu');
  revalidatePath('/menu');
  revalidateTag(MENU_TAG, 'default');
  return { ok: true, data: { id: data.id } };
}

export async function archiveMenuItem(id: string): Promise<Result> {
  await requireAdmin();
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('menu_items')
    .update({ archived_at: new Date().toISOString(), is_hidden: true })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/menu');
  revalidatePath('/menu');
  revalidateTag(MENU_TAG, 'default');
  return { ok: true };
}

export async function toggleItemAvailability(id: string, available: boolean): Promise<Result> {
  await requireAdmin();
  const supabase = getServiceClient();
  const { error } = await supabase.from('menu_items').update({ is_available_today: available }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/menu');
  revalidatePath('/menu');
  revalidateTag(MENU_TAG, 'default');
  return { ok: true };
}

export async function toggleItemCodEligible(id: string, eligible: boolean): Promise<Result> {
  await requireAdmin();
  const supabase = getServiceClient();
  const { error } = await supabase.from('menu_items').update({ is_cod_eligible: eligible }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/menu');
  revalidateTag(MENU_TAG, 'default');
  return { ok: true };
}

export async function toggleItemFeatured(id: string, featured: boolean): Promise<Result> {
  await requireAdmin();
  const supabase = getServiceClient();
  const { error } = await supabase.from('menu_items').update({ is_featured: featured }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/menu');
  revalidatePath('/');
  revalidateTag(MENU_TAG, 'default');
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────

export async function updateSetting(key: string, value: unknown): Promise<Result> {
  await requireAdmin();
  const supabase = getServiceClient();
  const { error } = await supabase.from('settings').upsert({ key, value });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  // Hours appears on most public pages via getHours(); bust its cache so
  // edits take effect immediately instead of waiting on the 60s revalidate.
  if (key === 'hours') revalidateTag(HOURS_TAG, 'default');
  return { ok: true };
}
