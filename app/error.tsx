'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/constants/siteConfig';

/**
 * Segment-level error boundary. Catches anything that throws inside the
 * customer route tree, with the root layout (header/footer/fonts) still
 * intact. Next 16 hands us the thrown Error plus a `reset` callback that
 * remounts the segment.
 *
 * Special-case: deploys ship a fresh JS bundle and routinely 404 the old
 * chunks the user already has loaded. When that error lands we force a
 * single hard reload to fetch the new bundle — gated by sessionStorage so
 * a genuinely broken page doesn't reload-loop the browser.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the browser console — Sentry/Vercel can hook this later.
    console.error('[error-boundary]', error);

    const msg = `${error?.message ?? ''} ${error?.name ?? ''}`.toLowerCase();
    const isChunkError =
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('importing a module script failed') ||
      msg.includes("can't find variable: __webpack_require__") ||
      msg.includes('chunkloaderror');

    if (isChunkError && typeof window !== 'undefined') {
      const KEY = 'hnn:chunk-reload';
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <main className="bg-cream">
      <section className="container py-[clamp(72px,12vw,128px)]">
        <div className="border-rule bg-cream-soft mx-auto max-w-[560px] rounded-[2px] border p-[clamp(28px,5vw,48px)] text-center">
          <p className="text-bronze-deep m-0 mb-3 font-mono text-[10px] tracking-[0.22em] uppercase">
            Something broke
          </p>
          <h1 className="text-walnut m-0 mb-3 font-serif text-[clamp(28px,4vw,40px)] leading-[1.1] font-medium">
            We <em className="font-normal italic">spilled the pot</em>.
          </h1>
          <p className="text-ink-muted m-0 mb-7 font-serif text-[16px] leading-[1.55] italic">
            Something went wrong loading this page. It might be a fresh deployment finishing up —
            give it a moment, then try again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') sessionStorage.removeItem('hnn:chunk-reload');
                reset();
              }}
              className="bg-walnut text-cream hover:bg-bronze-deep inline-block rounded-[2px] px-7 py-3.5 font-serif text-[14px] font-semibold tracking-[0.16em] uppercase transition-colors [font-variant:small-caps]"
            >
              Try again
            </button>
            <Link href={siteConfig.routes.home} className="link-underline text-walnut italic">
              or go to the home page
            </Link>
          </div>
          {error?.digest && (
            <p className="text-ink-muted mt-7 font-mono text-[10px] tracking-[0.18em] uppercase">
              ref · {error.digest}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
