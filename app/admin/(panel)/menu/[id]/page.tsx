import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServiceClient } from '@/lib/supabase/server';
import MenuItemForm from '../MenuItemForm';
import type { VariantsBlob, AddonsBlob } from '@/lib/supabase/types';

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServiceClient();

  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from('menu_items').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('menu_categories')
      .select('id, name')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
  ]);

  if (!item) notFound();

  return (
    <div>
      <header className="mb-6 border-b border-rule pb-4">
        <Link href="/admin/menu" className="mb-2 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep hover:text-walnut">
          ← All menu items
        </Link>
        <h1 className="m-0 font-serif text-[clamp(24px,3vw,30px)] font-medium leading-[1.04] text-walnut">
          Edit · <em className="italic font-normal text-bronze-deep">{item.name}</em>
        </h1>
      </header>

      <MenuItemForm
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: item.id,
          categoryId: item.category_id,
          name: item.name,
          description: item.description,
          longDescription: item.long_description ?? '',
          priceGbp: Number(item.price_gbp),
          imagePath: item.image_path,
          isAvailableToday: item.is_available_today,
          isCodEligible: item.is_cod_eligible,
          isFeatured: item.is_featured,
          isHidden: item.is_hidden,
          dietaryTags: item.dietary_tags,
          allergenTags: item.allergen_tags,
          badges: item.badges,
          variants: item.variants as VariantsBlob,
          addons: item.addons as AddonsBlob,
          displayOrder: item.display_order,
        }}
      />
    </div>
  );
}
