'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border border-walnut bg-transparent px-5 py-2.5 font-serif text-[12px] font-semibold uppercase tracking-[0.16em] text-walnut [font-variant:small-caps] transition-colors hover:bg-walnut hover:text-cream"
    >
      Print or save as PDF
    </button>
  );
}
