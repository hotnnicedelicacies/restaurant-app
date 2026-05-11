import { getServiceClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';
import { siteConfig } from '@/constants/siteConfig';
import type { WeekDay } from '@/lib/data/hours';

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
  default_prep_time_min?: number;
  default_prep_time_max?: number;
  global_min_order_gbp?: number;
  hours?: HoursBlob;
}

export default async function AdminSettingsPage() {
  const supabase = getServiceClient();
  const { data } = await supabase.from('settings').select('key, value');
  const map = new Map((data ?? []).map((row) => [row.key, row.value]));

  const initial: SettingsBlob = {
    store_open: (map.get('store_open') as boolean | undefined) ?? true,
    cod_enabled: (map.get('cod_enabled') as boolean | undefined) ?? true,
    pickup_enabled: (map.get('pickup_enabled') as boolean | undefined) ?? false,
    closed_message:
      (map.get('closed_message') as string | undefined) ??
      "We're closed for service right now — back tomorrow at noon.",
    contact_phone:
      (map.get('contact_phone') as string | undefined) ?? siteConfig.contact.phone,
    contact_email:
      (map.get('contact_email') as string | undefined) ?? siteConfig.contact.email,
    default_prep_time_min: (map.get('default_prep_time_min') as number | undefined) ?? 60,
    default_prep_time_max: (map.get('default_prep_time_max') as number | undefined) ?? 90,
    global_min_order_gbp: (map.get('global_min_order_gbp') as number | undefined) ?? 10,
    hours: (map.get('hours') as HoursBlob | undefined) ?? {
      days: [...siteConfig.hours.days] as WeekDay[],
      open: siteConfig.hours.open,
      close: siteConfig.hours.close,
      sameDayCutoff: siteConfig.hours.sameDayCutoff,
    },
  };

  return <SettingsForm initial={initial} />;
}
