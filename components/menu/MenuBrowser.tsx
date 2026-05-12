'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import FareRow, { type FareRowItem } from './FareRow';
import type { MenuCategoryView, MenuItemView } from '@/lib/data/menu';

interface Props {
  categories: MenuCategoryView[];
  itemsByCategory: Record<string, MenuItemView[]>;
}

function toFareRowItem(item: MenuItemView, index: number): FareRowItem {
  const num = String(index + 1).padStart(2, '0');
  return {
    slug: item.slug,
    numLabel: `№ ${num} · ${item.categoryName}`,
    name: item.name,
    description: item.description,
    price: item.priceGbp,
    image: item.image,
    imageAlt: item.name,
    // Tag chips on a fare row are informational only (design renders <span>);
    // the clickable filters live in the toolbar at the top. Including
    // allergens here is purely visual disclosure.
    tags: [...item.dietaryTags, ...item.allergenTags],
    badges: item.badges,
    available: item.isAvailable,
  };
}

export default function MenuBrowser({ categories, itemsByCategory }: Props) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  // Mobile: tags hidden behind a "Filters" toggle so they don't eat the viewport.
  const [tagsOpen, setTagsOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Collect the unique tag universe so filters surface only what's actually
  // on today's menu rather than a static list.
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const cat of categories) {
      for (const item of itemsByCategory[cat.slug] ?? []) {
        for (const t of item.dietaryTags) set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [categories, itemsByCategory]);

  // Apply search + tag filter. Both narrow the result set.
  const filteredByCat = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: Record<string, MenuItemView[]> = {};
    for (const cat of categories) {
      const items = (itemsByCategory[cat.slug] ?? []).filter((it) => {
        if (activeTag && !it.dietaryTags.includes(activeTag)) return false;
        if (q) {
          const hay = `${it.name} ${it.description} ${it.categoryName}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      out[cat.slug] = items;
    }
    return out;
  }, [categories, itemsByCategory, query, activeTag]);

  const totalShown = useMemo(
    () => Object.values(filteredByCat).reduce((s, items) => s + items.length, 0),
    [filteredByCat]
  );

  // Scroll-spy: highlight the current category in the jump nav as the
  // matching section enters the top of the viewport.
  useEffect(() => {
    const visibleSlugs = categories.filter((c) => (filteredByCat[c.slug] ?? []).length > 0).map((c) => c.slug);
    if (visibleSlugs.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveCategory(visible[0].target.id);
      },
      { rootMargin: '-150px 0px -60% 0px', threshold: 0.01 }
    );
    for (const slug of visibleSlugs) {
      const el = sectionRefs.current[slug];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [categories, filteredByCat]);

  const jumpToCategory = (slug: string) => {
    const el = sectionRefs.current[slug];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  let counter = 0;

  return (
    <>
      {/* Search + tags. Non-sticky on mobile so it scrolls away;
          sticky on desktop where there's room. */}
      <div className="border-b border-rule bg-cream md:sticky md:top-[68px] md:z-40">
        <div className="container py-3 md:py-4">
          {/* Row 1: search + filter toggle (mobile) */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                size={16}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes…"
                aria-label="Search menu"
                className="w-full rounded-[2px] border border-rule bg-transparent py-2.5 pl-[38px] pr-3 font-serif text-[14.5px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted"
              />
            </div>

            {availableTags.length > 0 && (
              <button
                type="button"
                onClick={() => setTagsOpen((v) => !v)}
                aria-expanded={tagsOpen}
                aria-controls="menu-filters"
                className={`relative inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors md:hidden ${
                  activeTag || tagsOpen
                    ? 'border-walnut bg-walnut text-cream'
                    : 'border-rule bg-cream text-walnut hover:border-walnut'
                }`}
              >
                {tagsOpen ? <X size={14} /> : <SlidersHorizontal size={14} />}
                Filters
                {activeTag && !tagsOpen && (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-bronze px-1 font-mono text-[9px] font-semibold text-walnut">
                    1
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Row 2: tag chips. Hidden on mobile until expanded; always shown on desktop. */}
          {availableTags.length > 0 && (
            <div
              id="menu-filters"
              className={`${tagsOpen ? 'flex' : 'hidden'} mt-3 flex-wrap items-center gap-2 md:flex`}
            >
              <Chip active={activeTag === null} onClick={() => setActiveTag(null)}>
                All
              </Chip>
              {availableTags.map((t) => (
                <Chip
                  key={t}
                  active={activeTag === t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                >
                  {t}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category jump nav — single sticky strip on mobile (under header). */}
      <nav
        aria-label="Jump to category"
        className="sticky top-[68px] z-30 border-b border-rule bg-cream md:top-[133px]"
      >
        <div className="container">
          <div className="flex gap-1 overflow-x-auto py-2 md:py-3.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => {
              const count = (filteredByCat[c.slug] ?? []).length;
              if (count === 0) return null;
              const isActive = activeCategory === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => jumpToCategory(c.slug)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 font-serif text-[12.5px] font-medium tracking-[0.16em] [font-variant:small-caps] transition-colors md:px-3.5 md:text-[13px] md:tracking-[0.18em] ${
                    isActive
                      ? 'bg-walnut text-cream'
                      : 'text-ink-muted hover:text-walnut'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Items */}
      <section className="py-[clamp(40px,6vw,72px)]">
        <div className="container">
          <p className="mb-4 mt-1 max-w-prose font-serif text-[14px] italic text-ink-muted">
            Tip · Tap any dish to customise it before adding to your order. Sold-out items appear greyed out and can't be added today.
          </p>

          {totalShown === 0 && (categories.length > 0) && (
            <div className="mx-auto max-w-[480px] py-[clamp(48px,8vw,96px)] text-center">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
                Nothing matched
              </p>
              <h2 className="m-0 mb-3 font-serif text-[clamp(22px,3vw,28px)] font-medium text-walnut">
                Nothing matches <em className="italic font-normal">that.</em>
              </h2>
              <p className="m-0 font-serif text-[15px] italic leading-[1.5] text-ink-muted">
                Try clearing the search or the tag filter to see the full menu.
              </p>
            </div>
          )}

          {categories.map((cat) => {
            const items = filteredByCat[cat.slug] ?? [];
            if (items.length === 0) return null;
            return (
              <article
                ref={(el) => {
                  sectionRefs.current[cat.slug] = el;
                }}
                id={cat.slug}
                key={cat.slug}
                className="mb-[clamp(48px,6vw,72px)] scroll-mt-[120px] last:mb-0 md:scroll-mt-[180px]"
              >
                <header className="mb-6 flex items-baseline justify-between gap-4 border-b border-walnut pb-3.5">
                  <h2 className="m-0 font-serif text-[clamp(24px,3vw,32px)] font-medium tracking-[-0.005em] text-walnut">
                    {cat.name}
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bronze-deep">
                    {String(items.length).padStart(2, '0')} dish{items.length === 1 ? '' : 'es'}
                  </span>
                </header>

                <div className="mx-auto max-w-[880px]">
                  {items.map((it, j) => (
                    <FareRow
                      key={it.slug}
                      item={toFareRowItem(it, counter++)}
                      divider={j < items.length - 1}
                    />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors hover:border-walnut ${
        active ? 'border-walnut bg-walnut text-cream' : 'border-rule text-walnut'
      }`}
    >
      {children}
    </button>
  );
}
