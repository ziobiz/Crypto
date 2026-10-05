/** Public invoice brand: never expose TINPASS on filenames / UI labels. */
export function toPublicInvoiceNo(invoiceNo: string | null | undefined): string {
  let s = String(invoiceNo || '').trim();
  if (!s) return s;
  s = s.replace(/^TINPASSSIM\b/gi, 'TPDMSIM');
  s = s.replace(/^TINPASS\b/gi, 'TPDM');
  s = s.replace(/TINPASS/gi, 'TPDM');
  return s;
}

export function publicInvoicePdfFileName(invoiceNo: string | null | undefined): string {
  const base = toPublicInvoiceNo(invoiceNo) || 'invoice';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}
