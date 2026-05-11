import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Class name merger — Tailwind-aware. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a GBP amount: 64 → "£64.00"; 64.5 → "£64.50". */
export function formatGBP(amount: number, opts: { showZero?: boolean } = {}) {
  if (!amount && !opts.showZero) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a price delta: 0 → ""; 2 → "+£2.00"; -1 → "−£1.00". */
export function formatPriceDelta(delta: number) {
  if (!delta) return '';
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${formatGBP(Math.abs(delta))}`;
}

/** Format a date as "Monday 11 May 2026". */
export function formatLongDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/** Format a date short: "Mon 11 May". */
export function formatShortDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
}

/** Format a time: "12:34pm". */
export function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(d)
    .toLowerCase()
    .replace(' ', '');
}

/** Build a Roman-numeral string for small numbers (used in editorial step numbers). */
export function romanLower(n: number) {
  const map: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ];
  let out = '';
  let rem = n;
  for (const [v, s] of map) while (rem >= v) (out += s), (rem -= v);
  return out;
}

/** Get the canonical absolute URL for a path on the live site. */
export function absoluteUrl(path = ''): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotnnicedelicacies.com';
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
