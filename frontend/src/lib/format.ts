export function formatCurrency(amount: number, currency = 'USDT') {
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  }
  if (currency === 'USDT') {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} USDT`;
  }
  if (currency === 'USD' || currency === 'JPY' || currency === 'CNY' || currency === 'THB') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }
  return `${amount.toLocaleString()} ${currency}`;
}

/** 입력 필드용 천 단위 콤마 */
export function formatAmountInput(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString('en-US');
}

/** 콤마 포함 문자열 → 숫자 */
export function parseAmountInput(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}
