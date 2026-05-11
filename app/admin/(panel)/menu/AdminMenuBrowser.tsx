'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getStorageUrl } from '@/lib/supabase/storage';
import { formatGBP } from '@/lib/utils';
import MenuItemToggles from './MenuItemToggles';
import ArchiveMenuItemButton from './ArchiveMenuItemButton';

export interface AdminMenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  imagePath: string | null;
  priceGbp: number;
  isAvailable: boolean;
  isCodEligible: boolean;
  isFeatured: boolean;
  isHidden: boolean;
  badges: string[];
  dietaryTags: string[];
}

export interface AdminMenuCategory {
  id: string;
  name: string;
}

type Filter = 'all' | 'available' | 'soldout' | 'featured' | 'cod';

const FILTERS: { key: Filter; label: string; predicate: (i: AdminMenuItem) => boolean }[] = [
  { key: 'all', label: 'All', predicate: () => true },
  { key: 'available', label: 'Available today', predicate: (i) => i.isAvailable },
  { key: 'soldout', label: 'Sold out', predicate: (i) => !i.isAvailable },
  { key: 'featured', label: 'Featured on home', predicate: (i) => i.isFeatured },
  { key: 'cod', label: 'COD eligible', predicate: (i) => i.isCodEligible },
];

export default function AdminMenuBrowser({
  items,
  categories,
}: {
  items: AdminMenuItem[];
  categories: AdminMenuCategory[];
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const pred = FILTERS.find((f) => f.key === filter)?.predicate ?? (() => true);
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      if (!pred(i)) return false;
      if (!needle) return true;
      const hay = `${i.name} ${i.dietaryTags.join(' ')} ${i.badges.join(' ')}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, filter, q]);

  const itemsByCategory = useMemo(() => {
    const m = new Map<string, AdminMenuItem[]>();
    for (const c of categories) m.set(c.id, []);
    for (const it of filtered) {
      const arr = m.get(it.categoryId);
      if (arr) arr.push(it);
    }
    return m;
  }, [filtered, categories]);

  const counts: Record<Filter, number> = {
    all: items.length,
    available: items.filter((i) => i.isAvailable).length,
    soldout: items.filter((i) => !i.isAvailable).length,
    featured: items.filter((i) => i.isFeatured).length,
    cod: items.filter((i) => i.isCodEligible).length,
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <svg
            className="admin-toolbar__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, tag or badge…"
          />
        </div>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`admin-filter ${filter === f.key ? 'is-active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            {f.label} <span className="admin-filter__count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <p className="t-body-muted" style={{ margin: '24px 0 14px', fontSize: 13.5 }}>
        Tip · Toggle availability, COD eligibility and homepage feature inline. For prices, photos, variants or descriptions, click <em>Edit</em>.
      </p>

      {filtered.length === 0 && (
        <div className="admin-table-wrap" style={{ padding: 48, textAlign: 'center' }}>
          <p className="t-body-muted">
            Nothing matches. {q && <>Try clearing the search.</>}
          </p>
        </div>
      )}

      {categories.map((cat) => {
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
                    <th style={{ width: 160 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((it) => (
                    <tr key={it.id} style={!it.isAvailable ? { opacity: 0.65 } : undefined}>
                      <td>
                        {it.imagePath ? (
                          <Image
                            className="menu-admin-table__thumb"
                            src={getStorageUrl(it.imagePath)}
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
                          {!it.isAvailable && (
                            <span
                              className="pill pill--cancelled"
                              style={{ marginTop: 4, alignSelf: 'flex-start' }}
                            >
                              Sold out today
                            </span>
                          )}
                          {(it.badges.length > 0 || it.dietaryTags.length > 0) && (
                            <span className="menu-admin-table__meta">
                              {it.badges.length > 0 && <b>{it.badges[0]}</b>}
                              {it.dietaryTags.join(' · ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="is-right menu-admin-table__price">
                        {formatGBP(it.priceGbp)}
                      </td>
                      <MenuItemToggles
                        itemId={it.id}
                        available={it.isAvailable}
                        codEligible={it.isCodEligible}
                        featured={it.isFeatured}
                      />
                      <td className="menu-admin-table__actions">
                        <Link href={`/admin/menu/${it.id}`} className="menu-admin-table__action">
                          Edit
                        </Link>
                        <ArchiveMenuItemButton id={it.id} name={it.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </>
  );
}
