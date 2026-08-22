import Link from 'next/link';
import { buildSheetData, parseSheetOptions, type SheetScope } from '@/lib/menu-sheet/data';
import { layoutSheet } from '@/lib/menu-sheet/layout';
import { BODY_H, BODY_W, COLUMN_GAP, SHEET_H, SHEET_W } from '@/lib/menu-sheet/MenuSheet';

export const dynamic = 'force-dynamic';

const IMAGE_ROUTE = '/admin/menu/sheet/image';

function href(scope: SheetScope, descriptions: boolean, extra = ''): string {
  return `?scope=${scope}&desc=${descriptions ? 1 : 0}${extra}`;
}

export default async function AdminMenuSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; desc?: string }>;
}) {
  const options = parseSheetOptions(await searchParams);
  const { categories, meta } = await buildSheetData(options.scope);
  const layout = layoutSheet(categories, {
    descriptions: options.descriptions,
    bodyHeight: BODY_H,
    bodyWidth: BODY_W,
    columnGap: COLUMN_GAP,
  });

  // Half-scale preview renders ~4× faster; the download link is full 300 dpi.
  const imageSrc = `${IMAGE_ROUTE}${href(options.scope, options.descriptions, '&scale=0.5')}`;
  const downloadSrc = `${IMAGE_ROUTE}${href(options.scope, options.descriptions, '&download=1')}`;

  return (
    <>
      <div className="admin-page-head">
        <div className="admin-page-head__text">
          <div className="admin-page-head__eyebrow">Menu · Export</div>
          <h1 className="admin-page-head__title">
            Printable <em>menu sheet</em>
          </h1>
        </div>
        <div className="admin-page-head__actions">
          <Link href="/admin/menu" className="receipt-btn" style={{ textDecoration: 'none' }}>
            ← Back to menu
          </Link>
          <a
            href={downloadSrc}
            download={meta.fileName}
            className="receipt-btn receipt-btn--primary"
            style={{ textDecoration: 'none' }}
          >
            Download PNG
          </a>
        </div>
      </div>

      <p className="t-body-muted" style={{ margin: '0 0 18px', maxWidth: 720 }}>
        One A4 page at print quality (2480 × 3508 px). Prices, hours, the trailer and contact
        details come straight from the live menu and settings, so the sheet always matches the
        website. Print it, or send the PNG on WhatsApp.
      </p>

      <div className="admin-toolbar">
        <span className="t-mono" style={{ marginRight: 6 }}>Items</span>
        {(
          [
            ['today', 'Available today'],
            ['all', 'Whole catalogue'],
          ] as [SheetScope, string][]
        ).map(([scope, label]) => (
          <Link
            key={scope}
            href={href(scope, options.descriptions)}
            className={`admin-filter ${options.scope === scope ? 'is-active' : ''}`}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            {label}
          </Link>
        ))}
        <span className="t-mono" style={{ marginLeft: 18, marginRight: 6 }}>Descriptions</span>
        {[
          [true, 'On'],
          [false, 'Off'],
        ].map(([on, label]) => (
          <Link
            key={String(on)}
            href={href(options.scope, on as boolean)}
            className={`admin-filter ${options.descriptions === on ? 'is-active' : ''}`}
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            {label as string}
          </Link>
        ))}
        <span className="t-body-muted" style={{ marginLeft: 'auto' }}>
          {layout.total} {layout.total === 1 ? 'dish' : 'dishes'} · {categories.length}{' '}
          {categories.length === 1 ? 'category' : 'categories'} ·{' '}
          {layout.tier.columns === 1 ? 'one column' : 'two columns'}
        </span>
      </div>

      {layout.total === 0 && (
        <div className="warning-banner">
          <div className="warning-banner__content">
            <h3 className="warning-banner__title">Nothing to print</h3>
            <p className="warning-banner__body">
              {options.scope === 'today'
                ? 'No dishes are marked available today. Switch to the whole catalogue, or mark some dishes available on the menu page.'
                : 'The menu has no visible dishes yet.'}
            </p>
          </div>
        </div>
      )}

      {layout.omitted > 0 && (
        <div className="warning-banner">
          <div className="warning-banner__content">
            <h3 className="warning-banner__title">
              {layout.omitted} {layout.omitted === 1 ? 'dish does' : 'dishes do'} not fit on one page
            </h3>
            <p className="warning-banner__body">
              The sheet prints the first {layout.placed} and a line pointing to the website for the
              rest.{' '}
              {options.descriptions ? (
                <>
                  Turning <b>descriptions off</b> fits more dishes.
                </>
              ) : (
                <>Hide some dishes on the menu page to fit everything.</>
              )}
            </p>
          </div>
        </div>
      )}

      {layout.total > 0 && (
        <div
          style={{
            background: 'var(--color-cream-soft)',
            border: '1px solid var(--color-rule)',
            borderRadius: 2,
            padding: 24,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic PNG from our own route; next/image adds nothing here */}
          <img
            src={imageSrc}
            alt="Preview of the printable menu sheet"
            width={SHEET_W}
            height={SHEET_H}
            style={{
              width: '100%',
              maxWidth: 760,
              height: 'auto',
              boxShadow: '0 18px 40px rgba(45, 31, 24, 0.18)',
              background: 'var(--color-cream)',
            }}
          />
        </div>
      )}
    </>
  );
}
