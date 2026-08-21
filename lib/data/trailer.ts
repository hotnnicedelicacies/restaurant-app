/**
 * The food trailer — where it parks and which days it trades.
 *
 * Admin-editable under `/admin/settings#trailer` as a single `trailer`
 * settings row (same pattern as `hours`). Every customer surface that
 * mentions the trailer — the home band, the contact card, the About
 * page, the footer, and the FoodEstablishment JSON-LD — reads this.
 * Nothing about the trailer is hardcoded anywhere else.
 */

import { unstable_cache } from 'next/cache';
import { getPublicClient } from '@/lib/supabase/public';
import { formatHour, type WeekDay } from './hours';

export const TRAILER_TAG = 'trailer';

const ALL_DAYS: WeekDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_ABBREV: Record<WeekDay, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

/** Raw shape stored in `settings.trailer` and edited by the admin form. */
export interface TrailerBlob {
  /** Hide every trailer mention site-wide when false (e.g. off the road for winter). */
  enabled: boolean;
  /** "Front of Tesco Extra" */
  venue: string;
  /** "Coulby Newham, Middlesbrough" */
  area: string;
  /** "TS8 0TJ" */
  postcode: string;
  /** Optional override for the map link (Google Maps share link). Built from the address when empty. */
  mapsUrl: string;
  days: WeekDay[];
  /** "12:00" */
  open: string;
  /** "20:00" */
  close: string;
  /** Optional one-liner, e.g. "Closed bank holidays." */
  note: string;
}

export interface TrailerView extends TrailerBlob {
  /** "Front of Tesco Extra, Coulby Newham, Middlesbrough TS8 0TJ" */
  addressLine: string;
  /** "Mon, Tue, Thu, Fri & Sat" */
  daysShort: string;
  /** "Monday, Tuesday, Thursday, Friday & Saturday" */
  daysLong: string;
  /** "12pm – 8pm" */
  timeLong: string;
  /** Resolved map link — `mapsUrl` if set, else a Google Maps search for the address. */
  mapsHref: string;
}

// Deploy-time defaults — taken from the trailer's own signage. Kept inline
// (not in siteConfig) so the bundle stays free of "real value" business
// data; the admin's `settings.trailer` row is authoritative once saved.
export const TRAILER_DEFAULTS: TrailerBlob = {
  enabled: true,
  venue: 'Front of Tesco Extra',
  area: 'Coulby Newham, Middlesbrough',
  postcode: 'TS8 0TJ',
  mapsUrl: '',
  days: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
  open: '10:00',
  close: '18:00',
  note: '',
};

/** "Mon, Tue, Thu, Fri & Sat" — trailer days are rarely a contiguous run, so list them. */
function listDays(days: string[]): string {
  if (days.length === 0) return '';
  if (days.length === 1) return days[0];
  return `${days.slice(0, -1).join(', ')} & ${days[days.length - 1]}`;
}

function buildView(blob: TrailerBlob): TrailerView {
  const open = formatHour(blob.open);
  const close = formatHour(blob.close);
  const addressLine = [blob.venue, blob.area, blob.postcode].filter(Boolean).join(', ');
  const query = encodeURIComponent([blob.venue, blob.area, blob.postcode].filter(Boolean).join(', '));
  return {
    ...blob,
    addressLine,
    daysShort: listDays(blob.days.map((d) => DAY_ABBREV[d] ?? d)),
    daysLong: listDays(blob.days),
    timeLong: `${open.long} – ${close.long}`,
    mapsHref: blob.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${query}`,
  };
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v.trim() : fallback;
}

/** Merge a stored row with defaults, tolerating partial / malformed values. */
export function sanitizeTrailer(v: unknown): TrailerBlob {
  const raw = (v && typeof v === 'object' ? v : {}) as Partial<Record<keyof TrailerBlob, unknown>>;
  const daySet = new Set(
    Array.isArray(raw.days) ? raw.days.filter((d): d is WeekDay => ALL_DAYS.includes(d as WeekDay)) : []
  );
  return {
    enabled: raw.enabled === false ? false : TRAILER_DEFAULTS.enabled,
    venue: str(raw.venue, TRAILER_DEFAULTS.venue),
    area: str(raw.area, TRAILER_DEFAULTS.area),
    postcode: str(raw.postcode, TRAILER_DEFAULTS.postcode),
    mapsUrl: str(raw.mapsUrl, TRAILER_DEFAULTS.mapsUrl),
    // Keep week order regardless of how the admin ticked them.
    days: Array.isArray(raw.days) ? ALL_DAYS.filter((d) => daySet.has(d)) : TRAILER_DEFAULTS.days,
    open: str(raw.open, TRAILER_DEFAULTS.open) || TRAILER_DEFAULTS.open,
    close: str(raw.close, TRAILER_DEFAULTS.close) || TRAILER_DEFAULTS.close,
    note: str(raw.note, TRAILER_DEFAULTS.note),
  };
}

const FALLBACK = buildView(TRAILER_DEFAULTS);

async function _getTrailer(): Promise<TrailerView> {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'trailer')
      .maybeSingle();
    if (error || !data) return FALLBACK;
    return buildView(sanitizeTrailer(data.value));
  } catch (err) {
    console.error('[trailer] getTrailer threw:', err);
    return FALLBACK;
  }
}

export const getTrailer = unstable_cache(_getTrailer, ['settings:trailer'], {
  revalidate: 60,
  tags: [TRAILER_TAG],
});
