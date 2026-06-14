'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Admin-scoped error boundary. Keeps the same chunk-reload heuristic the
 * customer boundary uses for deploys, but the copy is kitchen-direct
 * rather than guest-friendly. Sits inside `(panel)/layout.tsx` so the
 * admin chrome remains.
 */
export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin-error-boundary]', error);

    const msg = `${error?.message ?? ''} ${error?.name ?? ''}`.toLowerCase();
    const isChunkError =
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('importing a module script failed') ||
      msg.includes('chunkloaderror');

    if (isChunkError && typeof window !== 'undefined') {
      const KEY = 'hnn-admin:chunk-reload';
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 96 }}>
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding: 32,
          background: 'var(--color-cream)',
          border: '1px solid var(--color-rule)',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <p
          className="t-mono"
          style={{
            margin: '0 0 12px',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            color: '#8B2A1A',
          }}
        >
          Admin error
        </p>
        <h1
          style={{
            margin: '0 0 12px',
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            fontWeight: 500,
          }}
        >
          Something went wrong loading this view.
        </h1>
        <p style={{ margin: '0 0 24px', fontStyle: 'italic', color: 'var(--color-ink-muted)' }}>
          A fresh deploy may still be propagating. Try again — if it persists, the dev console will
          have the trace.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined')
                sessionStorage.removeItem('hnn-admin:chunk-reload');
              reset();
            }}
            className="receipt-btn receipt-btn--primary"
            style={{ cursor: 'pointer' }}
          >
            Try again
          </button>
          <Link
            href="/admin/orders"
            className="link-underline italic"
            style={{ alignSelf: 'center' }}
          >
            or go to orders
          </Link>
        </div>
        {error?.digest && (
          <p
            className="t-mono"
            style={{
              margin: '24px 0 0',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--color-ink-muted)',
            }}
          >
            ref · {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
