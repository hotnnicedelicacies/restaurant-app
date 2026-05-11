import Link from 'next/link';
import Image from 'next/image';
import { getServiceClient } from '@/lib/supabase/server';
import { getStorageUrl } from '@/lib/supabase/storage';
import { formatGBP } from '@/lib/utils';
import MenuItemToggles from './MenuItemToggles';

export default async function AdminMenuPage() {
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

  const itemsByCategory = new Map<string, typeof items>();
  for (const c of categories ?? []) itemsByCategory.set(c.id, []);
  for (const it of items ?? []) {
    const arr = itemsByCategory.get(it.category_id);
    if (arr) arr.push(it);
  }

  const totals = {
    all: items?.length ?? 0,
    available: items?.filter((i) => i.is_available_today).length ?? 0,
    soldOut: items?.filter((i) => !i.is_available_today).length ?? 0,
    featured: items?.filter((i) => i.is_featured).length ?? 0,
    cod: items?.filter((i) => i.is_cod_eligible).length ?? 0,
  };

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">
            {totals.all} items across {categories?.length ?? 0} categories
          </div>
          <h1 className="admin-page-head__title">
            The <em>menu</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <Link href="/admin/categories" className="receipt-btn" style={{ textDecoration: 'none' }}>
            Manage categories
          </Link>
          <Link
            href="/admin/menu/new"
            className="receipt-btn receipt-btn--primary"
            style={{ textDecoration: 'none' }}
          >
            + Add menu item
          </Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <button className="admin-filter is-active" type="button">
          All <span className="admin-filter__count">{totals.all}</span>
        </button>
        <button className="admin-filter" type="button">
          Available today <span className="admin-filter__count">{totals.available}</span>
        </button>
        <button className="admin-filter" type="button">
          Sold out <span className="admin-filter__count">{totals.soldOut}</span>
        </button>
        <button className="admin-filter" type="button">
          Featured on home <span className="admin-filter__count">{totals.featured}</span>
        </button>
        <button className="admin-filter" type="button">
          COD eligible <span className="admin-filter__count">{totals.cod}</span>
        </button>
      </div>

      <p className="t-body-muted" style={{ margin: '24px 0 14px', fontSize: 13.5 }}>
        Tip · Toggle availability, COD eligibility and homepage feature inline. For prices, photos,
        variants or descriptions, click <em>Edit</em>.
      </p>

      {(categories ?? []).map((cat) => {
        const catItems = itemsByCategory.get(cat.id) ?? [];
        if (catItems.length === 0) return null;
        return (
          <section className="menu-admin-section" key={cat.id}>
            <header className="menu-admin-section__head">
              <h2 className="menu-admin-section__title">{cat.name}</h2>
              <span className="menu-admin-section__count">
                {String(catItems.length).padStart(2, '0')} item{catItems.length === 1 ? '' : 's'}
              </span>
            </header>
            <div className="admin-table-wrap">
              <table className="menu-admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Photo</th>
                    <th>Name</th>
                    <th className="is-right" style={{ width: 80 }}>
                      Price
                    </th>
                    <th className="is-center" style={{ width: 110 }}>
                      Available
                    </th>
                    <th className="is-center" style={{ width: 90 }}>
                      COD ok
                    </th>
                    <th className="is-center" style={{ width: 100 }}>
                      Featured
                    </th>
                    <th style={{ width: 130 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((it) => {
                    const meta = [
                      ...(it.badges ?? []),
                      ...(it.dietary_tags ?? []),
                    ];
                    return (
                      <tr key={it.id}>
                        <td>
                          {it.image_path ? (
                            <Image
                              className="menu-admin-table__thumb"
                              src={getStorageUrl(it.image_path)}
                              alt={it.name}
                              width={44}
                              height={44}
                            />
                          ) : (
                            <div
                              className="menu-admin-table__thumb"
                              style={{ background: 'var(--color-cream-soft)' }}
                            />
                          )}
                        </td>
                        <td>
                          <div className="menu-admin-table__name-cell">
                            <span className="menu-admin-table__name">{it.name}</span>
                            {meta.length > 0 && (
                              <span className="menu-admin-table__meta">
                                {(it.badges ?? []).length > 0 && (
                                  <b>{(it.badges ?? [])[0]}</b>
                                )}
                                {(it.dietary_tags ?? []).join(' · ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="is-right menu-admin-table__price">
                          {formatGBP(Number(it.price_gbp))}
                        </td>
                        <MenuItemToggles
                          itemId={it.id}
                          available={it.is_available_today}
                          codEligible={it.is_cod_eligible}
                          featured={it.is_featured}
                        />
                        <td className="menu-admin-table__actions">
                          <Link href={`/admin/menu/${it.id}`} className="menu-admin-table__action">
                            Edit
                          </Link>
                          <Link
                            href={`/admin/menu/${it.id}?archive=1`}
                            className="menu-admin-table__action menu-admin-table__action--danger"
                          >
                            Archive
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {totals.all === 0 && (
        <div className="admin-table-wrap" style={{ padding: 48, textAlign: 'center' }}>
          <p className="t-body-muted">
            No menu items yet.{' '}
            <Link href="/admin/menu/new" className="link-underline">
              Create your first one →
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
