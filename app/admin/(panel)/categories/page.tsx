import { getServiceClient } from '@/lib/supabase/server';
import CategoriesManager from './CategoriesManager';

export default async function AdminCategoriesPage() {
  const supabase = getServiceClient();
  const [{ data: categories }, { data: itemCounts }] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('id, name, slug, description, display_order, is_visible, archived_at')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('menu_items')
      .select('category_id')
      .is('archived_at', null),
  ]);

  const counts: Record<string, number> = {};
  for (const it of itemCounts ?? []) {
    counts[it.category_id] = (counts[it.category_id] ?? 0) + 1;
  }

  return (
    <CategoriesManager
      categories={(categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        displayOrder: c.display_order,
        isVisible: c.is_visible,
        itemCount: counts[c.id] ?? 0,
      }))}
    />
  );
}
