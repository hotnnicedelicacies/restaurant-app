import { getServiceClient } from '@/lib/supabase/server';
import MenuItemForm from '../MenuItemForm';

export default async function NewMenuItemPage() {
  const supabase = getServiceClient();
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id, name')
    .is('archived_at', null)
    .order('display_order', { ascending: true });

  return (
    <div>
      <header className="mb-6 border-b border-rule pb-4">
        <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Menu · new item</p>
        <h1 className="m-0 font-serif text-[clamp(24px,3vw,30px)] font-medium leading-[1.04] text-walnut">
          Add to the <em className="italic font-normal text-bronze-deep">bill of fare.</em>
        </h1>
      </header>
      <MenuItemForm
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        initial={null}
      />
    </div>
  );
}
