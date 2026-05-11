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
    <MenuItemForm
      categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
      initial={null}
    />
  );
}
