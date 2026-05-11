'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  toggleItemAvailability,
  toggleItemCodEligible,
  toggleItemFeatured,
} from '@/lib/admin/catalogActions';

export default function MenuItemToggles({
  itemId,
  available,
  codEligible,
  featured,
}: {
  itemId: string;
  available: boolean;
  codEligible: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState({ available, codEligible, featured });

  function flip<K extends keyof typeof state>(key: K, fn: (id: string, value: boolean) => Promise<{ ok: boolean; error?: string }>) {
    const next = !state[key];
    setState((s) => ({ ...s, [key]: next }));
    start(async () => {
      const res = await fn(itemId, next);
      if (!res.ok) {
        setState((s) => ({ ...s, [key]: !next })); // revert
        toast.error(res.error ?? 'Failed to update.');
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <td className="is-center">
        <label className="switch" style={{ cursor: pending ? 'wait' : 'pointer' }}>
          <input
            type="checkbox"
            checked={state.available}
            disabled={pending}
            onChange={() => flip('available', toggleItemAvailability)}
          />
          <span className="switch__track">
            <span className="switch__thumb" />
          </span>
        </label>
      </td>
      <td className="is-center">
        <label className="switch" style={{ cursor: pending ? 'wait' : 'pointer' }}>
          <input
            type="checkbox"
            checked={state.codEligible}
            disabled={pending}
            onChange={() => flip('codEligible', toggleItemCodEligible)}
          />
          <span className="switch__track">
            <span className="switch__thumb" />
          </span>
        </label>
      </td>
      <td className="is-center">
        <label className="switch" style={{ cursor: pending ? 'wait' : 'pointer' }}>
          <input
            type="checkbox"
            checked={state.featured}
            disabled={pending}
            onChange={() => flip('featured', toggleItemFeatured)}
          />
          <span className="switch__track">
            <span className="switch__thumb" />
          </span>
        </label>
      </td>
    </>
  );
}
