export const FIAT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const;
export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];

export const FIAT_CURRENCY_LABELS: Record<FiatCurrency, string> = {
  KRW: 'KRW',
  JPY: 'JPY',
  THB: 'THB',
  CNY: 'CNY',
  USD: 'USD',
  EUR: 'EUR',
};

export type DepositPaymentRail = 'ACH' | 'SEPA' | 'LOCAL';

export function depositPaymentRail(currency: string): DepositPaymentRail {
  if (currency === 'USD') return 'ACH';
  if (currency === 'EUR') return 'SEPA';
  return 'LOCAL';
}

export function fiatCurrencyLabel(currency: string): string {
  return FIAT_CURRENCY_LABELS[currency as FiatCurrency] ?? currency;
}
