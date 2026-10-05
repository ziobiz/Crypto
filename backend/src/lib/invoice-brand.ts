/** Public invoice brand: never expose TINPASS on filenames / labels. */
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

/** Rewrite upstream Content-Disposition filename=... to public brand. */
export function rewriteInvoiceContentDisposition(disp: string | null): string | null {
  if (!disp) return disp;
  return disp.replace(/filename\*?=(?:UTF-8''|")?([^";]+)"?/gi, (full, name: string) => {
    const cleaned = decodeURIComponent(String(name).replace(/["']/g, ''));
    const pub = publicInvoicePdfFileName(cleaned);
    return `filename="${pub}"`;
  });
}
