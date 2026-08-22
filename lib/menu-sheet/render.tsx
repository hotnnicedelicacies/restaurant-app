import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { buildSheetData, type SheetOptions } from './data';
import { layoutSheet } from './layout';
import { loadSheetFonts } from './fonts';
import MenuSheet, { BODY_H, BODY_W, COLUMN_GAP, SHEET_H, SHEET_W } from './MenuSheet';

let logoMemo: Promise<string> | null = null;

/** Small copy of the logo (assets/logo-sheet.png) as a data: URI for Satori. */
function loadLogo(): Promise<string> {
  if (!logoMemo) {
    logoMemo = readFile(join(process.cwd(), 'assets', 'logo-sheet.png')).then(
      (buf) => `data:image/png;base64,${buf.toString('base64')}`
    );
  }
  return logoMemo;
}

/**
 * Render the A4 menu sheet as a PNG response. Auth is the caller's job —
 * the admin route handler checks `is_admin` before calling this.
 */
export async function renderMenuSheet(
  options: SheetOptions,
  {
    download = false,
    // Rasterising 8.7 megapixels takes ~5–8 s; the preview uses half scale
    // (150 dpi, ~4× faster). Downloads always get the full 300 dpi sheet.
    scale = 1,
  }: { download?: boolean; scale?: number } = {}
): Promise<ImageResponse> {
  const [{ categories, meta }, fonts, logoSrc] = await Promise.all([
    buildSheetData(options.scope),
    loadSheetFonts(),
    loadLogo(),
  ]);
  const layout = layoutSheet(categories, {
    descriptions: options.descriptions,
    bodyHeight: BODY_H,
    bodyWidth: BODY_W,
    columnGap: COLUMN_GAP,
  });

  const s = download ? 1 : Math.min(1, Math.max(0.25, scale));
  return new ImageResponse(
    (
      <MenuSheet
        layout={layout}
        meta={meta}
        descriptions={options.descriptions}
        logoSrc={logoSrc}
        scale={s}
      />
    ),
    {
      width: Math.round(SHEET_W * s),
      height: Math.round(SHEET_H * s),
      fonts,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': download ? `attachment; filename="${meta.fileName}"` : 'inline',
        'X-Menu-Sheet': `tier=${layout.tier.key}; placed=${layout.placed}; omitted=${layout.omitted}`,
      },
    }
  );
}
