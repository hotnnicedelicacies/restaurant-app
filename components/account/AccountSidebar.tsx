'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/lib/auth/actions';

const SECTIONS: { id: string; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'addresses', label: 'Saved addresses' },
  { id: 'profile', label: 'Profile' },
  { id: 'password', label: 'Password' },
  { id: 'close', label: 'Close account' },
];

export default function AccountSidebar() {
  const router = useRouter();
  const [active, setActive] = useState('orders');

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (e): e is HTMLElement => e !== null
    );
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -55% 0px', threshold: 0.01 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function jump(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <aside className="sticky top-[92px] flex flex-col gap-1">
      <p className="m-0 mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
        My account
      </p>
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => jump(s.id)}
            className={
              isActive
                ? 'border-l-2 border-bronze bg-cream-soft px-3.5 py-2.5 text-left font-serif text-[15px] font-medium text-walnut'
                : 'border-l-2 border-transparent px-3.5 py-2.5 text-left font-serif text-[15px] font-medium text-ink-muted transition-colors hover:bg-cream-soft hover:text-walnut'
            }
          >
            {s.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          await signOutAction();
          router.refresh();
        }}
        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[2px] border border-walnut bg-transparent px-4 py-2.5 font-serif text-[12.5px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] transition-colors hover:border-danger hover:bg-danger hover:text-cream"
      >
        Sign out →
      </button>
    </aside>
  );
}
