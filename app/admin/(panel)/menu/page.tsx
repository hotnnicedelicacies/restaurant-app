import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import AdminMenuBrowser, { type AdminMenuItem, type AdminMenuCategory } from './AdminMenuBrowser';

interface SearchParams {
  q?: string;
  filter?: 'all' | 'available' | 'soldout' | 'featured' | 'cod';
}

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await searchParams; // not used server-side; filter happens client-side
  const supabase = getServiceClient();

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from('menu_items')
      .select(
        'id, name, slug, image_path, price_gbp, category_id, is_available_today, is_hidden, is_featured, is_cod_eligible, display_order, badges, dietary_tags, allergen_tags, archived_at'
      )
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('menu_categories')
      .select('id, name, slug, display_order, archived_at')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
  ]);

  const cats: AdminMenuCategory[] = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const rows: AdminMenuItem[] = (items ?? []).map((i) => ({
    id: i.id,
    categoryId: i.category_id,
    name: i.name,
    slug: i.slug,
    imagePath: i.image_path,
    priceGbp: Number(i.price_gbp),
    isAvailable: i.is_available_today,
    isCodEligible: i.is_cod_eligible,
    isFeatured: i.is_featured,
    isHidden: i.is_hidden,
    badges: i.badges ?? [],
    dietaryTags: i.dietary_tags ?? [],
  }));

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">
            {rows.length} items across {cats.length} categories
          </div>
          <h1 className="admin-page-head__title">
            The <em>menu</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <Link
            href="/admin/categories"
            className="receipt-btn"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            Manage categories
          </Link>
          <Link
            href="/admin/menu/new"
            className="receipt-btn receipt-btn--primary"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            + Add menu item
          </Link>
        </div>
      </div>

      <AdminMenuBrowser items={rows} categories={cats} />
    </>
  );
}
