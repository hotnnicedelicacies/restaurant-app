'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { closeAccount } from '@/lib/account/profile';

export default function CloseAccountCard({ hasOpenOrders }: { hasOpenOrders: boolean }) {
  const [pending, start] = useTransition();
  const [confirmText, setConfirmText] = useState('');
  const [open, setOpen] = useState(false);

  function handleClose() {
    if (confirmText.trim().toLowerCase() !== 'close my account') {
      toast.error('Type "close my account" to confirm.');
      return;
    }
    start(async () => {
      const res = await closeAccount();
      // closeAccount redirects on success; we'll only get here on error.
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div
      className="rounded-[2px] border bg-cream p-6 sm:p-8"
      style={{ borderColor: 'rgba(139, 42, 26, 0.3)' }}
    >
      <header className="mb-5 flex items-baseline justify-between gap-3 border-b pb-3.5" style={{ borderColor: 'rgba(139, 42, 26, 0.25)' }}>
        <h3 className="m-0 font-serif text-[clamp(20px,2.4vw,24px)] font-medium text-danger [&_em]:font-normal [&_em]:italic">
          Close <em>account</em>
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-danger">Permanent</span>
      </header>
      <p className="m-0 mb-4 font-serif text-[15px] leading-[1.55] text-walnut">
        Closing your account removes your saved addresses, your profile details, and your sign-in.{' '}
        <b className="font-medium">Past orders are kept anonymised</b> for UK tax record-keeping but
        no longer linked to your email.
      </p>
      <p className="m-0 mb-5 font-serif text-[14px] italic leading-[1.55] text-ink-muted">
        This is not reversible. If you change your mind, you&apos;ll need to sign up from scratch.
      </p>

      {hasOpenOrders && (
        <div
          className="mb-4 rounded-[2px] border border-danger/40 bg-danger/5 px-4 py-3 font-serif text-[14px] leading-[1.55] text-danger"
          role="status"
        >
          <b className="font-medium">You&apos;ve got an order in progress.</b> We need your delivery details to finish it — once it&apos;s delivered (or you cancel it on the order page), you can close your account here.
        </div>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={hasOpenOrders}
          className="cursor-pointer rounded-[2px] border border-danger bg-transparent px-5 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-danger [font-variant:small-caps] transition-colors hover:bg-danger hover:text-cream disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-danger"
        >
          Close my account
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="font-serif text-[13px] font-medium tracking-[0.14em] text-walnut [font-variant:small-caps]">
            Type <em className="italic font-normal">close my account</em> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="close my account"
            className="w-full rounded-[2px] border border-rule bg-transparent px-3.5 py-3 font-serif text-[15px] text-walnut outline-none transition-colors focus:border-danger placeholder:italic placeholder:text-ink-muted"
          />
          <div className="mt-1 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={pending || confirmText.trim().toLowerCase() !== 'close my account'}
              className="cursor-pointer rounded-[2px] bg-danger px-5 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-cream [font-variant:small-caps] transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? 'Closing…' : 'Yes, close my account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText('');
              }}
              disabled={pending}
              className="cursor-pointer rounded-[2px] border border-walnut bg-transparent px-5 py-3 font-serif text-[13px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] transition-colors hover:bg-walnut hover:text-cream"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
