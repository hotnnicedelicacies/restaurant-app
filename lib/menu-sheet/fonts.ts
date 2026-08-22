/**
 * Fonts for the server-rendered menu sheet.
 *
 * next/og (Satori) needs raw font data (TTF/OTF/WOFF1 — not WOFF2). Rather
 * than vendoring font files into the repo, we fetch the site's own faces
 * — Cormorant Garamond and Geist Mono — from Google Fonts at render time.
 * With a non-browser user-agent Google serves static TTF instances. The
 * bytes are cached by Next's fetch cache for 30 days and memoised per
 * server instance, so the network cost is paid roughly once per deploy.
 */

const CSS_URL =
  'https://fonts.googleapis.com/css?family=Cormorant+Garamond:500,600,400i,500i|Geist+Mono:400,500';
// An unrecognised UA makes Google fall back to plain TTF files.
const USER_AGENT = 'HotNNiceMenuSheet/1.0 (+https://hotnnicedelicacies.com)';
const REVALIDATE = 60 * 60 * 24 * 30;

export interface SheetFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600;
  style: 'normal' | 'italic';
}

let memo: Promise<SheetFont[]> | null = null;

function isSatoriReadable(buf: ArrayBuffer): boolean {
  const b = new Uint8Array(buf.slice(0, 4));
  const tag = String.fromCharCode(b[0], b[1], b[2], b[3]);
  const ttf = b[0] === 0 && b[1] === 1 && b[2] === 0 && b[3] === 0;
  return ttf || tag === 'OTTO' || tag === 'true' || tag === 'wOFF'; // wOF2 is not supported
}

async function fetchFonts(): Promise<SheetFont[]> {
  const cssRes = await fetch(CSS_URL, {
    headers: { 'user-agent': USER_AGENT },
    cache: 'force-cache',
    next: { revalidate: REVALIDATE },
  });
  if (!cssRes.ok) throw new Error(`Google Fonts CSS request failed: ${cssRes.status}`);
  const css = await cssRes.text();

  const faces: { name: string; weight: SheetFont['weight']; style: SheetFont['style']; url: string }[] = [];
  for (const block of css.matchAll(/@font-face\s*{([^}]+)}/g)) {
    const body = block[1];
    const name = body.match(/font-family:\s*'([^']+)'/)?.[1];
    const style = body.match(/font-style:\s*(normal|italic)/)?.[1] as SheetFont['style'] | undefined;
    const weight = Number(body.match(/font-weight:\s*(\d+)/)?.[1]) as SheetFont['weight'];
    const url = body.match(/url\((https:[^)]+)\)/)?.[1];
    if (name && style && weight && url) faces.push({ name, weight, style, url });
  }
  if (faces.length === 0) throw new Error('Google Fonts CSS contained no @font-face rules');

  return Promise.all(
    faces.map(async (f) => {
      const res = await fetch(f.url, {
        headers: { 'user-agent': USER_AGENT },
        cache: 'force-cache',
        next: { revalidate: REVALIDATE },
      });
      if (!res.ok) throw new Error(`Font download failed (${f.name} ${f.weight} ${f.style}): ${res.status}`);
      const data = await res.arrayBuffer();
      if (!isSatoriReadable(data)) {
        throw new Error(`Google served an unsupported font format for ${f.name} (expected TTF/OTF/WOFF)`);
      }
      return { name: f.name, weight: f.weight, style: f.style, data };
    })
  );
}

export function loadSheetFonts(): Promise<SheetFont[]> {
  if (!memo) {
    memo = fetchFonts().catch((err) => {
      memo = null; // don't poison the memo with a transient network failure
      throw err;
    });
  }
  return memo;
}
