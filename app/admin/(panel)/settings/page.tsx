import { getServiceClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';
import { getHours, type WeekDay } from '@/lib/data/hours';
import { getContact } from '@/lib/data/contact';

interface HoursBlob {
  days: WeekDay[];
  open: string;
  close: string;
  sameDayCutoff: string;
}

interface SettingsBlob {
  store_open?: boolean;
  cod_enabled?: boolean;
  pickup_enabled?: boolean;
  closed_message?: string;
  contact_phone?: string;
  contact_email?: string;
  global_min_order_gbp?: number;
  hours?: HoursBlob;
}

export default async function AdminSettingsPage() {
  const supabase = getServiceClient();
  const { data } = await supabase.from('settings').select('key, value');
  const map = new Map((data ?? []).map((row) => [row.key, row.value]));

  // Pull DB-backed defaults from the fetchers so this page never shows a
  // hardcoded business value (siteConfig stays free of those).
  const [hoursFallback, contactFallback] = await Promise.all([getHours(), getContact()]);

  const initial: SettingsBlob = {
    store_open: (map.get('store_open') as boolean | undefined) ?? true,
    cod_enabled: (map.get('cod_enabled') as boolean | undefined) ?? true,
    pickup_enabled: (map.get('pickup_enabled') as boolean | undefined) ?? false,
    closed_message:
      (map.get('closed_message') as string | undefined) ??
      "We're closed for service right now — back tomorrow at noon.",
    contact_phone:
      (map.get('contact_phone') as string | undefined) ?? contactFallback.phone,
    contact_email:
      (map.get('contact_email') as string | undefined) ?? contactFallback.email,
    global_min_order_gbp: (map.get('global_min_order_gbp') as number | undefined) ?? 10,
    hours: (map.get('hours') as HoursBlob | undefined) ?? {
      days: [...hoursFallback.days] as WeekDay[],
      open: hoursFallback.open,
      close: hoursFallback.close,
      sameDayCutoff: hoursFallback.sameDayCutoff,
    },
  };

  return <SettingsForm initial={initial} />;
}
