/** 시세 카드가 THB·CNY를 정수로 반올림하지 않도록 통화별 소수 자릿수 */
export function fiatRateFractionDigits(currency: string): number {
  switch (currency) {
    case 'KRW':
      return 2;
    case 'JPY':
      return 2;
    case 'THB':
      return 3;
    case 'CNY':
      return 4;
    case 'USD':
    case 'EUR':
      return 4;
    default:
      return 2;
  }
}

export function formatFiatRate(currency: string, rate: number): string {
  return rate.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fiatRateFractionDigits(currency),
  });
}
