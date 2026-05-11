import { getServiceClient } from '@/lib/supabase/server';
import CategoriesManager from './CategoriesManager';

export default async function AdminCategoriesPage() {
  const supabase = getServiceClient();
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id, name, slug, description, display_order, is_visible, archived_at')
    .is('archived_at', null)
    .order('display_order', { ascending: true });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
        <div>
          <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Catalog</p>
          <h1 className="m-0 font-serif text-[clamp(26px,3.4vw,32px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut">
            Menu <em className="italic font-normal text-bronze-deep">categories.</em>
          </h1>
          <p className="m-0 mt-1 font-serif text-[13px] italic text-ink-muted">
            How items are grouped on the public menu.
          </p>
        </div>
      </header>

      <CategoriesManager
        categories={(categories ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          displayOrder: c.display_order,
          isVisible: c.is_visible,
        }))}
      />
    </div>
  );
}
