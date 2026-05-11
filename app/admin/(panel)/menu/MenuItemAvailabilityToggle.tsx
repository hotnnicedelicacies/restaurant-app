'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleItemAvailability } from '@/lib/admin/catalogActions';

export default function MenuItemAvailabilityToggle({ id, available }: { id: string; available: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <label className="flex cursor-pointer items-center gap-2 font-serif text-[12.5px] italic text-ink-muted">
      <input
        type="checkbox"
        checked={available}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            const res = await toggleItemAvailability(id, e.target.checked);
            if (!res.ok) toast.error(res.error);
            else router.refresh();
          })
        }
        className="h-[16px] w-[16px] accent-walnut"
      />
      {available ? 'Yes' : 'No'}
    </label>
  );
}
