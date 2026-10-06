/** ICOPAY 결제창 이동 전 티켓 복귀 정보 — session + local (탭/복귀 URL 누락 대비) */
export const ICOPAY_PENDING_RETURN_KEY = 'tinpass.icopay.pendingReturn';

export type IcopayPendingReturn = {
  ticketId: string;
  orderNo: string;
  at: number;
};

function writeStore(storage: Storage, payload: IcopayPendingReturn) {
  storage.setItem(ICOPAY_PENDING_RETURN_KEY, JSON.stringify(payload));
}

function readStore(storage: Storage, maxAgeMs: number): IcopayPendingReturn | null {
  try {
    const raw = storage.getItem(ICOPAY_PENDING_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IcopayPendingReturn;
    if (!parsed?.ticketId) return null;
    if (parsed.at && Date.now() - parsed.at > maxAgeMs) {
      storage.removeItem(ICOPAY_PENDING_RETURN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveIcopayPendingReturn(ticketId: string, orderNo: string) {
  if (typeof window === 'undefined') return;
  const payload: IcopayPendingReturn = {
    ticketId,
    orderNo: String(orderNo || '').replace(/\D/g, ''),
    at: Date.now(),
  };
  try {
    writeStore(sessionStorage, payload);
  } catch {
    /* ignore quota */
  }
  try {
    writeStore(localStorage, payload);
  } catch {
    /* ignore quota */
  }
}

export function readIcopayPendingReturn(maxAgeMs = 2 * 60 * 60 * 1000): IcopayPendingReturn | null {
  if (typeof window === 'undefined') return null;
  return readStore(sessionStorage, maxAgeMs) || readStore(localStorage, maxAgeMs);
}

export function clearIcopayPendingReturn() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ICOPAY_PENDING_RETURN_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(ICOPAY_PENDING_RETURN_KEY);
  } catch {
    /* ignore */
  }
}

export function pickIcopayOrderNoFromSearch(search: string | URLSearchParams): string {
  const p =
    typeof search === 'string'
      ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      : search;
  for (const [k, v] of p.entries()) {
    if (/^order[_-]?no$/i.test(k) || /^order[_-]?id$/i.test(k) || /^ordno$/i.test(k)) {
      const digits = String(v || '').replace(/\D/g, '');
      if (digits) return digits;
    }
  }
  return '';
}

export function isIcopayBrowserReturnQuery(search: string | URLSearchParams): boolean {
  const p =
    typeof search === 'string'
      ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      : search;
  if (pickIcopayOrderNoFromSearch(p)) return true;
  if (p.get('ticketId') || p.get('ticket_id')) return true;
  for (const [k] of p.entries()) {
    if (
      /paymentstatus/i.test(k) ||
      /returncode/i.test(k) ||
      /sessionid/i.test(k) ||
      k === 'icopaySandbox' ||
      k === 'outcome' ||
      k === 'elementpayReturn'
    ) {
      return true;
    }
  }
  return false;
}

/** 결제 복귀 대기 중이면 card-result 로 보낼 경로 (이미 해당 흐름이면 null) */
export function pendingIcopayReturnPath(pathname: string, search: string): string | null {
  const pending = readIcopayPendingReturn();
  if (!pending?.ticketId) return null;
  const path = pathname || '';
  if (path.includes('/dashboard/usdt/card-result')) return null;
  if (path.includes(`/dashboard/usdt/${pending.ticketId}`)) return null;
  const q = new URLSearchParams();
  if (pending.orderNo) q.set('orderNo', pending.orderNo);
  q.set('ticketId', pending.ticketId);
  /** 현재 URL에 PG가 붙인 상태값이 있으면 전달 */
  try {
    const incoming = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const status = incoming.get('paymentStatus') || incoming.get('status') || incoming.get('returncode');
    if (status) q.set('paymentStatus', status);
    const orderNo = pickIcopayOrderNoFromSearch(incoming);
    if (orderNo) q.set('orderNo', orderNo);
  } catch {
    /* ignore */
  }
  return `/dashboard/usdt/card-result?${q.toString()}`;
}
