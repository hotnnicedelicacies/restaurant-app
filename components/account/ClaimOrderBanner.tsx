'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { claimOrder } from '@/lib/account/profile';
import { siteConfig } from '@/constants/siteConfig';

interface Props {
  /** Order ref to link. */
  orderRef: string;
  /** Whether the viewer is signed in. */
  signedIn: boolean;
  /** When true, the order has already been linked to a profile — render nothing. */
  alreadyClaimed: boolean;
}

/**
 * "Save this order to your account" CTA shown on /confirmation/[ref] and
 * /track/[ref] when a guest placed the order. After they sign in / up, the
 * sign-in action quietly back-links any orders with matching email; this
 * card is for the explicit "I'm already signed in but this order was placed
 * as a guest with my email" path.
 */
export default function ClaimOrderBanner({ orderRef, signedIn, alreadyClaimed }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (alreadyClaimed) return null;

  function handleClaim() {
    start(async () => {
      const res = await claimOrder(orderRef);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Order linked to your account.');
      router.refresh();
    });
  }

  return (
    <div
      style={{
        margin: '24px auto 0',
        maxWidth: 760,
        padding: '20px 24px',
        background: 'var(--color-cream-soft)',
        border: '1px solid var(--color-rule)',
        borderLeft: '3px solid var(--color-bronze)',
        borderRadius: '0 2px 2px 0',
        fontFamily: 'var(--font-serif)',
      }}
    >
      <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-bronze-deep">
        Save this to your account
      </p>
      {signedIn ? (
        <>
          <p className="m-0 mb-3 font-serif text-[15px] leading-[1.5] text-walnut">
            We can link this order to your account so you can see it in <b className="font-medium">Your orders</b> any time.
          </p>
          <button
            type="button"
            onClick={handleClaim}
            disabled={pending}
            className="cursor-pointer rounded-[2px] border border-walnut bg-transparent px-4 py-2 font-serif text-[12px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] transition-colors hover:bg-walnut hover:text-cream disabled:opacity-60"
          >
            {pending ? 'Linking…' : 'Link to my account'}
          </button>
        </>
      ) : (
        <>
          <p className="m-0 mb-3 font-serif text-[15px] leading-[1.5] text-walnut">
            Create an account or sign in with the same email and we&apos;ll keep this order, its receipt, and a one-tap reorder in your account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`${siteConfig.routes.signUp}?next=${encodeURIComponent(`/confirmation/${orderRef}`)}`}
              className="rounded-[2px] bg-walnut px-4 py-2 font-serif text-[12px] font-semibold uppercase tracking-[0.16em] text-cream no-underline [font-variant:small-caps] transition-colors hover:bg-bronze-deep"
            >
              Create account
            </Link>
            <Link
              href={`${siteConfig.routes.signIn}?next=${encodeURIComponent(`/confirmation/${orderRef}`)}`}
              className="rounded-[2px] border border-walnut bg-transparent px-4 py-2 font-serif text-[12px] font-semibold uppercase tracking-[0.16em] text-walnut no-underline [font-variant:small-caps] transition-colors hover:bg-walnut hover:text-cream"
            >
              Sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
