/** Local calendar helpers for PG-style date quick filters */

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export type DateQuickKey = 'today' | 'thisMonth' | 'yesterday' | 'week1' | 'week2' | 'lastMonth';

export function rangeForQuick(key: DateQuickKey, now = new Date()): { from: string; to: string } {
  const today = startOfDay(now);
  if (key === 'today') {
    return { from: toYmd(today), to: toYmd(today) };
  }
  if (key === 'yesterday') {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { from: toYmd(y), to: toYmd(y) };
  }
  if (key === 'week1') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toYmd(from), to: toYmd(today) };
  }
  if (key === 'week2') {
    const from = new Date(today);
    from.setDate(from.getDate() - 13);
    return { from: toYmd(from), to: toYmd(today) };
  }
  if (key === 'thisMonth') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toYmd(from), to: toYmd(today) };
  }
  // lastMonth
  const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const to = new Date(today.getFullYear(), today.getMonth(), 0);
  return { from: toYmd(from), to: toYmd(to) };
}

/** Inclusive YMD range vs ISO timestamp */
export function inYmdRange(iso: string | null | undefined, from: string, to: string): boolean {
  if (!iso) return false;
  const ymd = toYmd(new Date(iso));
  if (from && ymd < from) return false;
  if (to && ymd > to) return false;
  return true;
}
