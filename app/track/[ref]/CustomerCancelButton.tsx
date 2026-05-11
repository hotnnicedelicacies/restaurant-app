'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { customerCancelOrder } from '@/lib/orders/cancel';

interface Props {
  orderRef: string;
  paymentMethod: 'card' | 'cod';
}

export default function CustomerCancelButton({ orderRef, paymentMethod }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await customerCancelOrder(orderRef);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border border-danger bg-transparent px-[22px] py-[13px] font-serif text-[14px] font-semibold uppercase tracking-[0.16em] text-danger [font-variant:small-caps] transition-colors hover:bg-danger hover:text-cream active:translate-y-[1px]"
        >
          Cancel this order
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[2px] border border-rule bg-cream">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-[22px] font-medium text-walnut">
            Cancel order <em className="font-normal italic">{orderRef}</em>?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-serif text-[15px] italic leading-[1.5] text-ink-muted">
            {paymentMethod === 'card'
              ? 'We haven’t started cooking yet, so you can cancel for an immediate full refund. Refunds typically arrive in 5–10 business days.'
              : 'We haven’t started cooking yet — no money has been taken, so cancelling here just lets the kitchen know.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="rounded-[2px] border border-danger bg-cream-soft px-3 py-2 font-serif text-[13px] text-danger">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={pending}
            className="rounded-[2px] border border-walnut bg-transparent font-serif font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] hover:bg-walnut hover:text-cream"
          >
            Keep order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={pending}
            className="rounded-[2px] bg-danger font-serif font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] hover:bg-danger/90"
          >
            {pending ? 'Cancelling…' : 'Yes, cancel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
