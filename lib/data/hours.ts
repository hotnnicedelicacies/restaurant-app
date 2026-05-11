/**
 * Resolve the site's trading hours from the Supabase `settings` table,
 * falling back to the static siteConfig defaults when no override is set.
 *
 * Stored as a single `hours` key holding an object so the admin Settings
 * page can edit one record. Cached via unstable_cache and invalidated
 * by tag from admin actions.
 */

import { unstable_cache } from 'next/cache';
import { getPublicClient } from '@/lib/supabase/public';
import { siteConfig } from '@/constants/siteConfig';

export const HOURS_TAG = 'hours';

const DAY_ABBREV: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

export type WeekDay =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface HoursView {
  days: WeekDay[];
  open: string;
  close: string;
  sameDayCutoff: string;
  /** "Tue – Sun" */
  daysShort: string;
  /** "Tuesday – Sunday" */
  daysLong: string;
  /** "12 – 8pm" */
  timeShort: string;
  /** "12pm – 8pm" */
  timeLong: string;
  /** "Tue – Sun · 12 – 8pm" */
  displayShort: string;
  /** "Order by 10am for same-day delivery" */
  cutoffShort: string;
}

function formatHour(hhmm: string): { short: string; long: string } {
  const [hStr] = hhmm.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return { short: hhmm, long: hhmm };
  const suffix = h >= 12 ? 'pm' : 'am';
  const display = h % 12 === 0 ? 12 : h % 12;
  return { short: `${display}`, long: `${display}${suffix}` };
}

function buildView(input: {
  days: WeekDay[];
  open: string;
  close: string;
  sameDayCutoff: string;
}): HoursView {
  const days = input.days;
  const first = days[0];
  const last = days[days.length - 1];
  const daysShort = first === last
    ? DAY_ABBREV[first] ?? first
    : `${DAY_ABBREV[first] ?? first} – ${DAY_ABBREV[last] ?? last}`;
  const daysLong = first === last ? first : `${first} – ${last}`;
  const open = formatHour(input.open);
  const close = formatHour(input.close);
  const cutoff = formatHour(input.sameDayCutoff);
  const timeShort = `${open.short} – ${close.long}`;
  const timeLong = `${open.long} – ${close.long}`;
  return {
    days,
    open: input.open,
    close: input.close,
    sameDayCutoff: input.sameDayCutoff,
    daysShort,
    daysLong,
    timeShort,
    timeLong,
    displayShort: `${daysShort} · ${timeShort}`,
    cutoffShort: `Order by ${cutoff.long} for same-day delivery`,
  };
}

const FALLBACK = buildView({
  days: [...siteConfig.hours.days] as WeekDay[],
  open: siteConfig.hours.open,
  close: siteConfig.hours.close,
  sameDayCutoff: siteConfig.hours.sameDayCutoff,
});

async function _getHours(): Promise<HoursView> {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'hours')
      .maybeSingle();
    if (error || !data) return FALLBACK;
    const v = data.value as Partial<{
      days: WeekDay[];
      open: string;
      close: string;
      sameDayCutoff: string;
    }>;
    return buildView({
      days: Array.isArray(v.days) && v.days.length > 0 ? v.days : FALLBACK.days,
      open: typeof v.open === 'string' ? v.open : FALLBACK.open,
      close: typeof v.close === 'string' ? v.close : FALLBACK.close,
      sameDayCutoff: typeof v.sameDayCutoff === 'string' ? v.sameDayCutoff : FALLBACK.sameDayCutoff,
    });
  } catch (err) {
    console.error('[hours] getHours threw:', err);
    return FALLBACK;
  }
}

export const getHours = unstable_cache(_getHours, ['settings:hours'], {
  revalidate: 60,
  tags: [HOURS_TAG],
});
