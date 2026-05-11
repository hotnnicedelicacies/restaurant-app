'use client';

import { Search } from 'lucide-react';

interface Props {
  categories: { slug: string; name: string; count: number }[];
}

/**
 * Sticky toolbar below the menu page hero. Search input + horizontally
 * scrollable category jump nav. Search input is wired UI-only in v1 —
 * Phase 6 will hook it up to filter the list client-side or via a
 * Postgres full-text search query.
 */
export default function MenuToolbar({ categories }: Props) {
  return (
    <>
      <div className="sticky top-[68px] z-40 border-b border-rule bg-cream">
        <div className="container flex flex-wrap items-center gap-6 py-4">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              size={16}
            />
            <input
              type="search"
              placeholder="Search dishes — jollof, suya, lasagna…"
              aria-label="Search menu"
              className="w-full rounded-[2px] border border-rule bg-transparent py-[11px] pl-[38px] pr-3.5 font-serif text-[15px] text-walnut outline-none transition-colors focus:border-walnut placeholder:italic placeholder:text-ink-muted"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip active>All</Chip>
            <Chip>Vegetarian</Chip>
            <Chip>Gluten-free</Chip>
            <Chip>Spicy</Chip>
            <Chip>Pescatarian</Chip>
          </div>
        </div>
      </div>

      {/* Category jump nav */}
      <nav aria-label="Jump to category" className="sticky top-[133px] z-30 border-b border-rule bg-cream">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto py-3.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => (
              <a
                key={c.slug}
                href={`#${c.slug}`}
                className="whitespace-nowrap rounded-full px-3.5 py-1.5 font-serif text-[13px] font-medium tracking-[0.18em] text-ink-muted [font-variant:small-caps] transition-colors hover:text-walnut"
              >
                {c.name}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full border border-rule bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors hover:border-walnut ${
        active ? 'border-walnut bg-walnut text-cream' : 'text-walnut'
      }`}
    >
      {children}
    </button>
  );
}
