'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden mb-4 bg-[#0A0A0A] text-white px-5 py-2.5 text-sm font-medium"
    >
      Imprimir
    </button>
  )
}
