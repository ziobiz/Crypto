import { CurrencyCode } from '@prisma/client';
import { AppError } from '../lib/errors';
import type { SymbolFeeCurrency, TransactionFees } from '../constants/hq-policy';
import {
  computeFeeAmounts,
  fixedFeeSum,
  normalizeTransactionFees,
  percentMultiplierSum,
} from '../lib/fee-component';
import { fetchUsdtFiatRateWithPolicy } from './exchange-rate-policy.service';

/** 고객 매입 통화 (fiat per 1 USDT) */
export type FiatCurrency = SymbolFeeCurrency;

export const SUPPORTED_FIAT_CURRENCIES: FiatCurrency[] = ['KRW', 'JPY', 'THB', 'CNY', 'USD'];

/** fiat per 1 USDT — 본사정책 통화별 기준가 소스 적용 */
export async function fetchUsdtFiatRate(currency: FiatCurrency) {
  return fetchUsdtFiatRateWithPolicy(currency);
}

export async function fetchUsdtKrwRate() {
  return fetchUsdtFiatRate('KRW');
}

export async function getAllExchangeRatesDisplay(): Promise<{
  rates: Record<'KRW' | 'JPY' | 'THB' | 'CNY', { rate: number; label: string; source: string }>;
  source: string;
  fetchedAt: string;
  disclaimer: string;
}> {
  const displayCurrencies = ['KRW', 'JPY', 'THB', 'CNY'] as const;
  const results = await Promise.all(displayCurrencies.map((c) => fetchUsdtFiatRate(c)));
  const primarySource = results.find((r) => r.source !== 'fallback')?.source ?? 'fallback';
  const fetchedAt = results[0]?.fetchedAt.toISOString() ?? new Date().toISOString();

  return {
    rates: {
      KRW: { rate: results[0]!.rate, label: 'KRW', source: results[0]!.source },
      JPY: { rate: results[1]!.rate, label: 'JPY', source: results[1]!.source },
      THB: { rate: results[2]!.rate, label: 'THB', source: results[2]!.source },
      CNY: { rate: results[3]!.rate, label: 'CNY', source: results[3]!.source },
    },
    source: primarySource,
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
  feesInput: TransactionFees,
): number {
  if (exchangeRate <= 0) {
    throw new AppError(400, 'Invalid exchange rate', 'INVALID_RATE');
  }
  const fees = normalizeTransactionFees(feesInput);
  const grossUsdt = fiatAmount / exchangeRate;
  const amounts = computeFeeAmounts(grossUsdt, fees);
  const net =
    grossUsdt -
    amounts.fxFeeUsdt -
    amounts.gasFeeUsdt -
    amounts.transferFeeUsdt -
    amounts.otherFeeUsdt;
  return Math.max(0, Number(net.toFixed(8)));
}

/** 가스비 변동에 따른 예상 수령 범위 (±20% 가스비) */
export function calculateExpectedUsdtRange(
  fiatAmount: number,
  exchangeRate: number,
  feesInput: TransactionFees,
): { expected: number; min: number; max: number } {
  const fees = normalizeTransactionFees(feesInput);
  const expected = calculateExpectedUsdt(fiatAmount, exchangeRate, fees);
  const grossUsdt = fiatAmount / exchangeRate;
  const gasAmount = computeFeeAmounts(grossUsdt, fees).gasFeeUsdt;
  const gasVariance = gasAmount * 0.2;
  const min = Math.max(0, Number((expected - gasVariance).toFixed(8)));
  const max = Math.max(0, Number((expected + gasVariance).toFixed(8)));
  return { expected, min, max };
}

export type UsdtFeeBreakdown = {
  targetUsdt: number;
  grossUsdt: number;
  fxFeeUsdt: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
  netUsdt: number;
  requiredFiat: number;
};

/** 희망 수령 USDT → 필요 법정화폐·수수료 도식 */
export function calculateFromTargetUsdt(
  targetUsdt: number,
  exchangeRate: number,
  feesInput: TransactionFees,
): UsdtFeeBreakdown {
  if (exchangeRate <= 0 || targetUsdt <= 0) {
    throw new AppError(400, 'Invalid amount or rate', 'VALIDATION');
  }
  const fees = normalizeTransactionFees(feesInput);
  const pctSum = percentMultiplierSum(fees);
  const fixed = fixedFeeSum(fees);
  const denom = 1 - pctSum / 100;
  const grossUsdt = denom > 0 ? (targetUsdt + fixed) / denom : targetUsdt + fixed;
  const amounts = computeFeeAmounts(grossUsdt, fees);
  const requiredFiat = grossUsdt * exchangeRate;
  return {
    targetUsdt,
    grossUsdt: Number(grossUsdt.toFixed(8)),
    fxFeeUsdt: amounts.fxFeeUsdt,
    gasFeeUsdt: amounts.gasFeeUsdt,
    transferFeeUsdt: amounts.transferFeeUsdt,
    otherFeeUsdt: amounts.otherFeeUsdt,
    netUsdt: Number(targetUsdt.toFixed(8)),
    requiredFiat: Number(requiredFiat.toFixed(2)),
  };
}

export function toPrismaCurrency(currency: string): CurrencyCode {
  const upper = currency.toUpperCase();
  if (
    upper === 'KRW' ||
    upper === 'USD' ||
    upper === 'JPY' ||
    upper === 'THB' ||
    upper === 'CNY' ||
    upper === 'USDT'
  ) {
    return upper as CurrencyCode;
  }
  throw new AppError(400, `Unsupported currency: ${currency}`, 'VALIDATION');
}
