'use client';

export default function ExportPaymentsButton({
  dataset,
  rangeLabel,
}: {
  dataset: 'stripe' | 'cod' | 'refunds';
  rangeLabel: string;
}) {
  // Re-uses the admin export endpoint (orders dataset). The CSV contains
  // every order in scope; spreadsheet filters can split by payment_method.
  const href = `/api/admin/export?dataset=orders`;
  const filename = `hnn-payments-${dataset}-${rangeLabel.toLowerCase().replace(/\s+/g, '-')}.csv`;
  return (
    <a
      href={href}
      download={filename}
      className="receipt-btn"
      style={{ textDecoration: 'none', cursor: 'pointer' }}
    >
      Export CSV
    </a>
  );
}
