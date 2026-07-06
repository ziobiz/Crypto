export function formatCurrency(amount: number, currency = 'KRW') {
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  }
  return `${amount.toLocaleString()} ${currency}`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}
