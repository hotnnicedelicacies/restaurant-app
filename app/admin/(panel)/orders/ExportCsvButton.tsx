'use client';

import { type OrderRow } from './AdminOrdersTable';

const HEADERS = [
  'Ref',
  'Placed at',
  'Customer',
  'Phone',
  'Postcode',
  'Items',
  'Payment method',
  'Payment status',
  'COD status',
  'Order status',
  'Total (GBP)',
];

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function ExportCsvButton({
  rows,
  rangeLabel,
}: {
  rows: OrderRow[];
  rangeLabel: string;
}) {
  function handleExport() {
    const csv = [
      HEADERS.join(','),
      ...rows.map((r) =>
        [
          r.ref,
          new Date(r.createdAt).toISOString(),
          r.customerName,
          r.customerPhone,
          r.deliveryPostcode,
          r.itemsLine,
          r.paymentMethod,
          r.paymentStatus,
          r.codStatus ?? '',
          r.status,
          r.totalGbp.toFixed(2),
        ].map(csvCell).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `hnn-orders-${rangeLabel.toLowerCase().replace(/\s+/g, '-')}-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="receipt-btn"
      style={{ cursor: rows.length === 0 ? 'not-allowed' : 'pointer', opacity: rows.length === 0 ? 0.5 : 1 }}
    >
      Export CSV
    </button>
  );
}
