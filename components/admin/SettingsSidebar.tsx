'use client';

import { useEffect, useState } from 'react';

/**
 * Sidebar for /admin/settings + /admin/settings/advanced.
 *
 * Highlights the entry whose section is currently in view using an
 * IntersectionObserver, so scrolling the main column updates the
 * active state in the sidebar without a click. Clicking an entry
 * still works (native anchor scrolling).
 */
export interface SidebarItem {
  href: string;
  label: string;
  /** Optional — present for in-page anchors only (e.g. `#email`). */
  sectionId?: string;
  /** Force a "danger" styling for the last entry. */
  tone?: 'danger' | 'subtle';
  /** Visual separator (used for the link out to /advanced). */
  separated?: boolean;
}

export default function SettingsSidebar({
  title,
  items,
}: {
  title: string;
  items: SidebarItem[];
}) {
  const inPageItems = items.filter((i) => i.sectionId);
  const initialId = inPageItems[0]?.sectionId ?? null;
  const [activeId, setActiveId] = useState<string | null>(initialId);

  useEffect(() => {
    const ids = inPageItems.map((i) => i.sectionId!) as string[];
    if (ids.length === 0) return;
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    // Track each section's intersection state so we can pick the *first*
    // visible one as we scroll — a single observer doesn't return that
    // ordering on its own.
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible.set(e.target.id, e.isIntersecting);
        }
        const firstVisible = ids.find((id) => visible.get(id));
        if (firstVisible) setActiveId(firstVisible);
      },
      {
        // Trigger when a section is between 25% from the top and 60%
        // from the bottom of the viewport — feels natural while reading.
        rootMargin: '-20% 0px -55% 0px',
        threshold: 0,
      },
    );
    for (const n of nodes) observer.observe(n);
    return () => observer.disconnect();
  }, [inPageItems]);

  return (
    <aside className="settings-sidebar">
      <p className="settings-sidebar__title">{title}</p>
      {items.map((item) => {
        const isActive = !!item.sectionId && item.sectionId === activeId;
        const className = [
          'settings-sidebar__link',
          isActive ? 'is-active' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const style: React.CSSProperties = {};
        if (item.tone === 'danger') style.color = '#8B2A1A';
        if (item.separated) {
          style.marginTop = 16;
          style.borderTop = '1px solid var(--color-rule)';
          style.paddingTop = 18;
          style.color = 'var(--color-bronze-deep)';
        }
        return (
          <a key={item.href} href={item.href} className={className} style={style}>
            {item.label}
          </a>
        );
      })}
    </aside>
  );
}
