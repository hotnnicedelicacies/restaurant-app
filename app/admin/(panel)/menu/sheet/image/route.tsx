import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { parseSheetOptions } from '@/lib/menu-sheet/data';
import { renderMenuSheet } from '@/lib/menu-sheet/render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Full-size A4 rasterisation takes several seconds; allow headroom on Vercel.
export const maxDuration = 60;

/**
 * GET /admin/menu/sheet/image?scope=today|all&desc=1|0&download=1&scale=0.5
 * A4 PNG of the menu — 300 dpi (2480 × 3508) for downloads, `scale` for the
 * on-screen preview. Admin only (middleware + requireAdmin).
 */
export async function GET(request: NextRequest) {
  await requireAdmin();
  const sp = request.nextUrl.searchParams;
  const options = parseSheetOptions({
    scope: sp.get('scope') ?? undefined,
    desc: sp.get('desc') ?? undefined,
  });
  const scale = Number(sp.get('scale') ?? '1');
  return renderMenuSheet(options, {
    download: sp.get('download') === '1',
    scale: Number.isFinite(scale) ? scale : 1,
  });
}
