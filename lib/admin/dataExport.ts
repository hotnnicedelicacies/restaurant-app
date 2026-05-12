'use server';

import { getServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';

export interface DatasetSummary {
  key: 'orders' | 'customers' | 'menu' | 'kitchen_notes';
  label: string;
  description: string;
  rows: number;
  lastUpdated: string | null;
  format: 'csv' | 'json';
}

export async function getDatasetSummaries(): Promise<DatasetSummary[]> {
  await requireAdmin();
  const supabase = getServiceClient();

  const [orders, customers, menu, notes] = await Promise.all([
    supabase
      .from('orders')
      .select('updated_at', { count: 'exact', head: false })
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('profiles')
      .select('updated_at', { count: 'exact', head: false })
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('menu_items')
      .select('updated_at', { count: 'exact', head: false })
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('kitchen_notes')
      .select('created_at', { count: 'exact', head: false })
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  return [
    {
      key: 'orders',
      label: 'Orders',
      description: 'All orders + line items, with statuses',
      rows: orders.count ?? 0,
      lastUpdated: (orders.data?.[0]?.updated_at as string | undefined) ?? null,
      format: 'csv',
    },
    {
      key: 'customers',
      label: 'Customers',
      description: 'Account holders + addresses',
      rows: customers.count ?? 0,
      lastUpdated: (customers.data?.[0]?.updated_at as string | undefined) ?? null,
      format: 'csv',
    },
    {
      key: 'menu',
      label: 'Menu',
      description: 'All items, categories, variants, addons',
      rows: menu.count ?? 0,
      lastUpdated: (menu.data?.[0]?.updated_at as string | undefined) ?? null,
      format: 'json',
    },
    {
      key: 'kitchen_notes',
      label: 'Kitchen notes',
      description: 'Status change log + customer-facing notes',
      rows: notes.count ?? 0,
      lastUpdated: (notes.data?.[0]?.created_at as string | undefined) ?? null,
      format: 'csv',
    },
  ];
}
