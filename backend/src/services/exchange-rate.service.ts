import { CurrencyCode } from '@prisma/client';
import { AppError } from '../lib/errors';
import type { TransactionFees } from '../constants/hq-policy';

export type FiatCurrency = 'KRW' | 'USD' | 'JPY';

interface ExchangeRateResult {
  rate: number;
  source: string;
  fetchedAt: Date;
}

const FALLBACK_RATES: Record<FiatCurrency, number> = {
  KRW: 1380,
  USD: 1,
  JPY: 150,
};

/** fiat per 1 USDT */
export async function fetchUsdtFiatRate(currency: FiatCurrency): Promise<ExchangeRateResult> {
  const apiUrl = process.env.EXCHANGE_RATE_API_URL;

  if (apiUrl) {
    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = (await res.json()) as { rates?: Record<string, number> };
        const rates = data.rates;
        if (rates) {
          if (currency === 'USD') {
            return { rate: 1, source: 'external_api', fetchedAt: new Date() };
          }
          const fiatPerUsd = rates[currency];
          if (fiatPerUsd) {
            return { rate: fiatPerUsd, source: 'external_api', fetchedAt: new Date() };
          }
        }
      }
    } catch {
      // fallback
    }
  }

  return {
    rate: FALLBACK_RATES[currency],
    source: 'fallback',
    fetchedAt: new Date(),
  };
}

export async function fetchUsdtKrwRate(): Promise<ExchangeRateResult> {
  return fetchUsdtFiatRate('KRW');
}

export async function getAllExchangeRatesDisplay(): Promise<{
  rates: Record<FiatCurrency, { rate: number; label: string }>;
  source: string;
  fetchedAt: string;
  disclaimer: string;
}> {
  const currencies: FiatCurrency[] = ['KRW', 'USD', 'JPY'];
  const results = await Promise.all(currencies.map((c) => fetchUsdtFiatRate(c)));
  const source = results[0]?.source ?? 'fallback';
  const fetchedAt = results[0]?.fetchedAt.toISOString() ?? new Date().toISOString();

  return {
    rates: {
      KRW: { rate: results[0]!.rate, label: 'KRW' },
      USD: { rate: results[1]!.rate, label: 'USD' },
      JPY: { rate: results[2]!.rate, label: 'JPY' },
    },
    source,
    fetchedAt,
    disclaimer: '참고 시세이며, 실제 거래 시점의 환율·가스비에 따라 수령 USDT가 달라질 수 있습니다.',
  };
}

export async function getExchangeRateDisplay(currency: FiatCurrency = 'KRW') {
  const { rate, source, fetchedAt } = await fetchUsdtFiatRate(currency);
  const krwRate =
    currency === 'KRW' ? rate : (await fetchUsdtFiatRate('KRW')).rate;
  return {
    currency,
    usdtFiatRate: rate,
    usdtKrwRate: krwRate,
    source,
    fetchedAt: fetchedAt.toISOString(),
    disclaimer: '참고 시세이며, 실제 거래 시점의 환율과 다를 수 있습니다.',
  };
}

export function calculateExpectedUsdt(
  fiatAmount: number,
  exchangeRate: number,
  fees: TransactionFees,
): number {
  if (exchangeRate <= 0) {
    throw new AppError(400, 'Invalid exchange rate', 'INVALID_RATE');
  }
  const grossUsdt = fiatAmount / exchangeRate;
  const fxFee = (grossUsdt * fees.fxFeePercent) / 100;
  const net = grossUsdt - fxFee - fees.gasFeeUsdt - fees.transferFeeUsdt - fees.otherFeeUsdt;
  return Math.max(0, Number(net.toFixed(8)));
}

/** 가스비 변동에 따른 예상 수령 범위 (±20% 가스비) */
export function calculateExpectedUsdtRange(
  fiatAmount: number,
  exchangeRate: number,
  fees: TransactionFees,
): { expected: number; min: number; max: number } {
  const expected = calculateExpectedUsdt(fiatAmount, exchangeRate, fees);
  const gasVariance = fees.gasFeeUsdt * 0.2;
  const min = Math.max(0, Number((expected - gasVariance).toFixed(8)));
  const max = Math.max(0, Number((expected + gasVariance).toFixed(8)));
  return { expected, min, max };
}

export function toPrismaCurrency(currency: string): CurrencyCode {
  const upper = currency.toUpperCase();
  if (upper === 'KRW' || upper === 'USD' || upper === 'JPY' || upper === 'USDT') {
    return upper as CurrencyCode;
  }
  throw new AppError(400, 'Unsupported currency', 'VALIDATION');
}
