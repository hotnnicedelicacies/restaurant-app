import Link from 'next/link';
import Image from 'next/image';
import { getServiceClient } from '@/lib/supabase/server';
import { getStorageUrl } from '@/lib/supabase/storage';
import { formatGBP } from '@/lib/utils';
import MenuItemAvailabilityToggle from './MenuItemAvailabilityToggle';

export default async function AdminMenuPage() {
  const supabase = getServiceClient();

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from('menu_items')
      .select('id, name, slug, image_path, price_gbp, category_id, is_available_today, is_hidden, is_featured, display_order, archived_at')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('menu_categories')
      .select('id, name, slug')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
  ]);

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-4">
        <div>
          <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Catalog</p>
          <h1 className="m-0 font-serif text-[clamp(26px,3.4vw,32px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut">
            Menu <em className="italic font-normal text-bronze-deep">items.</em>
          </h1>
          <p className="m-0 mt-1 font-serif text-[13px] italic text-ink-muted">
            Cooked today, hidden, or featured — manage the whole bill of fare from here.
          </p>
        </div>
        <Link
          href="/admin/menu/new"
          className="rounded-[2px] bg-walnut px-5 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-bronze-deep"
        >
          + New item
        </Link>
      </header>

      <div className="overflow-hidden rounded-[2px] border border-rule bg-cream">
        <table className="w-full border-collapse">
          <thead className="bg-cream-soft">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-bronze-deep">
              <th className="px-4 py-3 font-normal">Item</th>
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Price</th>
              <th className="px-4 py-3 font-normal">Available today</th>
              <th className="px-4 py-3 font-normal">Flags</th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="font-serif text-[13.5px] text-walnut">
            {(items ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center italic text-ink-muted">
                  No items yet. <Link href="/admin/menu/new" className="link-underline">Create your first one →</Link>
                </td>
              </tr>
            ) : (
              items!.map((it) => (
                <tr key={it.id} className="border-t border-rule align-middle">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/menu/${it.id}`} className="flex items-center gap-3 hover:text-bronze-deep">
                      {it.image_path ? (
                        <Image
                          src={getStorageUrl(it.image_path)}
                          alt={it.name}
                          width={56}
                          height={56}
                          className="aspect-square w-12 rounded-[2px] object-cover"
                        />
                      ) : (
                        <div className="aspect-square w-12 rounded-[2px] bg-cream-soft" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium">{it.name}</div>
                        <div className="font-mono text-[10px] text-ink-muted">/{it.slug}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 font-serif text-[13px] italic text-ink-muted">
                    {categoryMap.get(it.category_id) ?? 'Uncategorised'}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums font-medium">{formatGBP(Number(it.price_gbp))}</td>
                  <td className="px-3 py-2.5">
                    <MenuItemAvailabilityToggle id={it.id} available={it.is_available_today} />
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px]">
                    {it.is_featured && <span className="mr-2 rounded-[2px] border border-bronze bg-bronze/10 px-1.5 py-0.5 text-bronze-deep">Featured</span>}
                    {it.is_hidden && <span className="rounded-[2px] border border-danger bg-danger/10 px-1.5 py-0.5 text-danger">Hidden</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/admin/menu/${it.id}`}
                      className="rounded-[2px] border border-walnut bg-transparent px-3 py-1 font-serif text-[11px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
