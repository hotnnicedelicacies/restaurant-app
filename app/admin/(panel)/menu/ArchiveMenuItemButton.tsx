'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { archiveMenuItem } from '@/lib/admin/catalogActions';

export default function ArchiveMenuItemButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  function handleArchive() {
    start(async () => {
      const res = await archiveMenuItem(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Item archived.');
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="menu-admin-table__action menu-admin-table__action--danger"
        style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
      >
        Archive
      </button>
      <ConfirmModal
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={handleArchive}
        pending={pending}
        tone="danger"
        eyebrow="Archive menu item"
        title={
          <>
            Archive <em>{name}?</em>
          </>
        }
        body={
          <>
            Archived items disappear from the customer menu immediately. They&apos;re kept in the
            database (linked to past orders) and can be restored from the admin.
          </>
        }
        confirmLabel="Yes, archive"
      />
    </>
  );
}
