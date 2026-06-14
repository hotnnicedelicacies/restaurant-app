'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Last-resort error boundary. Catches errors thrown *in the root layout
 * itself* (where `app/error.tsx` can't help because the layout is broken).
 *
 * Must include its own <html> + <body> because it REPLACES the root
 * layout. Tailwind classes won't apply here — keep the styles inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#F1E5CD',
          color: '#2D1F18',
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <main
          style={{
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            border: '1px solid rgba(45,31,24,0.18)',
            background: '#E8D9BC',
            padding: 'clamp(28px, 5vw, 48px)',
            borderRadius: 2,
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontFamily: 'Geist Mono, ui-monospace, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              color: '#7E5530',
            }}
          >
            Something broke
          </p>
          <h1 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 500, lineHeight: 1.1 }}>
            We&apos;ll be right back.
          </h1>
          <p
            style={{
              margin: '0 0 28px',
              fontStyle: 'italic',
              fontSize: 16,
              lineHeight: 1.55,
              color: '#4a3a2c',
            }}
          >
            The kitchen is being updated. Refresh in a moment and you&apos;ll be back at the table.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#2D1F18',
                color: '#F1E5CD',
                border: 0,
                padding: '14px 28px',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontWeight: 600,
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                fontVariant: 'small-caps',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                color: '#2D1F18',
                fontStyle: 'italic',
                textDecoration: 'underline',
                textUnderlineOffset: 4,
                fontSize: 15,
                alignSelf: 'center',
              }}
            >
              or go to the home page
            </Link>
          </div>
          {error?.digest && (
            <p
              style={{
                margin: '28px 0 0',
                fontFamily: 'Geist Mono, ui-monospace, monospace',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#7e6a55',
              }}
            >
              ref · {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
