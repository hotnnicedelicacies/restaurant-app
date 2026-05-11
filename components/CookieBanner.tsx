'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/constants/siteConfig';

/**
 * GDPR / PECR cookie banner. Stores acceptance in localStorage under
 * `hnn_consent` so we don't re-prompt. We currently use only strictly-necessary
 * cookies (cart, auth, csrf, Stripe), so this is informational — accept-only.
 * If we add optional cookies later, gate them behind a real consent management
 * UI (Accept / Reject / Manage) before setting them.
 */
const STORAGE_KEY = 'hnn_consent';
const STORAGE_VALUE = 'v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== STORAGE_VALUE) {
        // Defer mount slightly so it animates in after page load
        const id = window.setTimeout(() => setVisible(true), 400);
        return () => window.clearTimeout(id);
      }
    } catch {
      // localStorage may be unavailable (private mode, etc.) — silently skip
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, STORAGE_VALUE);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-[560px] rounded-[4px] bg-[--color-walnut] p-5 text-[--color-cream] shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-6"
      style={{ animation: 'cookieIn 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div
        className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[--color-bronze]"
        aria-hidden
      >
        A note about cookies
      </div>
      <h2 className="m-0 mb-1.5 font-serif text-[17px] font-medium leading-tight text-[--color-cream]">
        We use a few <em className="not-italic text-[--color-bronze] italic">essential</em> cookies.
      </h2>
      <p className="m-0 mb-4 font-serif text-[14px] italic leading-[1.55] text-[#F1E5CDD2]">
        Just what's needed to remember your basket, keep you signed in, and process payments safely.{' '}
        <b className="font-medium text-[--color-cream] not-italic">
          No tracking. No advertising. No analytics
        </b>{' '}
        — see our{' '}
        <Link
          href={siteConfig.routes.legal.cookies}
          className="text-[--color-bronze] underline decoration-[--color-bronze] underline-offset-[3px]"
        >
          Cookie Notice
        </Link>{' '}
        for details.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={siteConfig.routes.legal.cookies}
          className="flex-1 rounded-[2px] border border-[rgba(241,229,205,0.22)] bg-transparent px-4 py-[11px] text-center font-serif text-[13px] font-semibold uppercase tracking-[0.14em] text-[--color-cream] [font-variant:small-caps] transition-colors hover:bg-[rgba(241,229,205,0.12)]"
        >
          Read the notice
        </Link>
        <button
          type="button"
          onClick={accept}
          className="flex-1 rounded-[2px] border-0 bg-[--color-bronze] px-4 py-[11px] font-serif text-[13px] font-semibold uppercase tracking-[0.14em] text-[--color-walnut] [font-variant:small-caps] transition-colors hover:bg-[--color-cream]"
        >
          Got it
        </button>
      </div>

      <style jsx>{`
        @keyframes cookieIn {
          from {
            transform: translateY(140%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
