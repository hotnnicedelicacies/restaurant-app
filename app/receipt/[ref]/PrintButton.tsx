'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="receipt-btn receipt-btn--primary"
    >
      Print or save as PDF
    </button>
  );
}
