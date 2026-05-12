import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Dataset = 'orders' | 'customers' | 'menu' | 'kitchen_notes';

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvCell(r[h])).join(','));
  }
  return lines.join('\n');
}

export async function GET(request: Request) {
  // Auth: must be signed in + admin
  const userClient = await getServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const svc = getServiceClient();
  const { data: profile } = await svc
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const dataset = url.searchParams.get('dataset') as Dataset | null;
  if (!dataset) return new NextResponse('Missing dataset', { status: 400 });

  const ts = new Date().toISOString().slice(0, 10);

  if (dataset === 'orders') {
    const { data } = await svc
      .from('orders')
      .select('ref, status, payment_method, payment_status, cod_status, customer_first_name, customer_last_name, customer_email, customer_phone, delivery_line1, delivery_line2, delivery_city, delivery_postcode, delivery_date, delivery_window_start, delivery_window_end, subtotal_gbp, total_gbp, refund_amount_gbp, cancelled_at, cancelled_reason, created_at')
      .order('created_at', { ascending: false });
    const csv = toCsv((data ?? []) as Record<string, unknown>[]);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hnn-orders-${ts}.csv"`,
      },
    });
  }

  if (dataset === 'customers') {
    const { data } = await svc
      .from('profiles')
      .select('id, display_name, phone, is_admin, marketing_opt_in, notify_status_changes, created_at, updated_at')
      .order('created_at', { ascending: false });
    const csv = toCsv((data ?? []) as Record<string, unknown>[]);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hnn-customers-${ts}.csv"`,
      },
    });
  }

  if (dataset === 'menu') {
    const [{ data: items }, { data: cats }] = await Promise.all([
      svc.from('menu_items').select('*').order('display_order', { ascending: true }),
      svc.from('menu_categories').select('*').order('display_order', { ascending: true }),
    ]);
    const blob = { categories: cats ?? [], items: items ?? [], exported_at: new Date().toISOString() };
    return new NextResponse(JSON.stringify(blob, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="hnn-menu-${ts}.json"`,
      },
    });
  }

  if (dataset === 'kitchen_notes') {
    const { data } = await svc
      .from('kitchen_notes')
      .select('id, order_id, author_name, status_at_time, body, visible_to_customer, emailed, created_at')
      .order('created_at', { ascending: false });
    const csv = toCsv((data ?? []) as Record<string, unknown>[]);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hnn-kitchen-notes-${ts}.csv"`,
      },
    });
  }

  return new NextResponse('Unknown dataset', { status: 400 });
}
