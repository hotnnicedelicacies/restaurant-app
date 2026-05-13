/**
 * Resolve the kitchen's operational toggles from the Supabase `settings`
 * table — admin's "Pause new orders" switch and the global cash-on-delivery
 * gate. Both flags are *authoritative*: every customer-facing surface that
 * shows the order CTA, and the server-side `createOrder`, must read them.
 *
 * Cached via unstable_cache; admin mutations call
 * `revalidateTag(OPERATIONS_TAG, 'default')` from `updateSetting`.
 */

import { unstable_cache } from 'next/cache';
import { getPublicClient } from '@/lib/supabase/public';

export const OPERATIONS_TAG = 'operations';

export interface OperationsView {
  /** Owner toggle: when false, /menu and /checkout show "kitchen closed" and `createOrder` rejects. */
  storeOpen: boolean;
  /** Global cash-on-delivery switch; ANDed with zone + per-meal flags at checkout. */
  codEnabled: boolean;
  /** Whether self-serve customer pickup is offered. Not yet wired into checkout. */
  pickupEnabled: boolean;
  /** Optional message shown to customers when the store is paused. */
  closedMessage: string | null;
  /** Global floor for every order, in £. ANDed with the zone's `min_order_gbp` (the higher wins). */
  globalMinOrderGbp: number | null;
  /** Default kitchen prep window in minutes — falls through to a zone's prep time when no zone-specific value is set. */
  defaultPrepTimeMin: number | null;
  defaultPrepTimeMax: number | null;
}

const FALLBACK: OperationsView = {
  // Fail-open on cold-cache + DB-down so the kitchen doesn't appear closed
  // due to infrastructure. Pausing the store is an active admin action;
  // the absence of a row should not silently pause the business.
  storeOpen: true,
  codEnabled: true,
  pickupEnabled: false,
  closedMessage: null,
  globalMinOrderGbp: null,
  defaultPrepTimeMin: null,
  defaultPrepTimeMax: null,
};

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

async function _getOperations(): Promise<OperationsView> {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'store_open',
        'cod_enabled',
        'pickup_enabled',
        'closed_message',
        'global_min_order_gbp',
        'default_prep_time_min',
        'default_prep_time_max',
      ]);
    if (error || !data) return FALLBACK;
    const byKey = new Map(data.map((r) => [r.key, r.value]));
    return {
      storeOpen: byKey.get('store_open') === false ? false : FALLBACK.storeOpen,
      codEnabled: byKey.get('cod_enabled') === false ? false : FALLBACK.codEnabled,
      pickupEnabled: byKey.get('pickup_enabled') === true,
      closedMessage:
        typeof byKey.get('closed_message') === 'string'
          ? (byKey.get('closed_message') as string)
          : FALLBACK.closedMessage,
      globalMinOrderGbp: num(byKey.get('global_min_order_gbp')),
      defaultPrepTimeMin: num(byKey.get('default_prep_time_min')),
      defaultPrepTimeMax: num(byKey.get('default_prep_time_max')),
    };
  } catch (err) {
    console.error('[operations] getOperations threw:', err);
    return FALLBACK;
  }
}

export const getOperations = unstable_cache(_getOperations, ['settings:operations'], {
  revalidate: 60,
  tags: [OPERATIONS_TAG],
});
