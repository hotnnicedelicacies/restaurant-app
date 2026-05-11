import { getServiceClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';

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
}

export default async function AdminSettingsPage() {
  const supabase = getServiceClient();
  const { data } = await supabase.from('settings').select('key, value');
  const map = new Map((data ?? []).map((row) => [row.key, row.value]));

  const initial: SettingsBlob = {
    store_open: (map.get('store_open') as boolean | undefined) ?? true,
    cod_enabled: (map.get('cod_enabled') as boolean | undefined) ?? true,
    pickup_enabled: (map.get('pickup_enabled') as boolean | undefined) ?? false,
    closed_message: (map.get('closed_message') as string | undefined) ?? "We're closed for service right now — back tomorrow at noon.",
    contact_phone: (map.get('contact_phone') as string | undefined) ?? '+44 7776 320068',
    contact_email: (map.get('contact_email') as string | undefined) ?? 'hotnnicedelicacies@gmail.com',
    default_prep_time_min: (map.get('default_prep_time_min') as number | undefined) ?? 60,
    default_prep_time_max: (map.get('default_prep_time_max') as number | undefined) ?? 90,
    global_min_order_gbp: (map.get('global_min_order_gbp') as number | undefined) ?? 10,
  };

  return (
    <div>
      <header className="mb-6 border-b border-rule pb-4">
        <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-bronze-deep">Settings</p>
        <h1 className="m-0 font-serif text-[clamp(26px,3.4vw,32px)] font-medium leading-[1.04] tracking-[-0.005em] text-walnut">
          Store <em className="italic font-normal text-bronze-deep">settings.</em>
        </h1>
        <p className="m-0 mt-1 font-serif text-[13px] italic text-ink-muted">
          Opening hours, payment options, and global defaults.
        </p>
      </header>
      <SettingsForm initial={initial} />
    </div>
  );
}
