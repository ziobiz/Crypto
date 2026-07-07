import type { SymbolFeeCurrency } from '../constants/hq-policy';
import {
  fetchFromBinanceCross,
  fetchFromBinanceTh,
  fetchFromCoinGecko,
  fetchFromExchangeRateApi,
  fetchFromKrakenBook,
} from './exchange-rate-sources';
import {
  fetchDomesticUsdtKrw,
  kimchiPremiumFeeUsdt,
} from './kimchi-premium.service';

/** 국내 시세 프리미엄 적용 통화 (김프·태국 프리미엄·엔화 프리미엄) */
export const LOCAL_PREMIUM_CURRENCIES = ['KRW', 'THB', 'JPY'] as const;
export type LocalPremiumCurrency = (typeof LOCAL_PREMIUM_CURRENCIES)[number];

export type LocalMarketPremiumAnalysis = {
  currency: LocalPremiumCurrency;
  domesticRate: number;
  fairRate: number;
  premiumPercent: number;
  domesticSource: string;
  domesticLabel: string;
  usdFiatRate: number;
  usdtUsdRate: number;
  detailRates: Record<string, number | null>;
  fetchedAt: Date;
};

export function isLocalPremiumCurrency(value: string): value is LocalPremiumCurrency {
  return (LOCAL_PREMIUM_CURRENCIES as readonly string[]).includes(value);
}

export { kimchiPremiumFeeUsdt as localPremiumFeeUsdt };

async function fetchFairUsdtFiat(currency: SymbolFeeCurrency): Promise<{
  fairRate: number;
  usdFiatRate: number;
  usdtUsdRate: number;
}> {
  const [forex, usdtUsd] = await Promise.all([
    fetchFromExchangeRateApi(currency),
    fetchFromCoinGecko('USD'),
  ]);
  if (!forex?.rate) {
    throw new Error(`USD/${currency} 환율을 가져올 수 없습니다`);
  }
  const usdtUsdRate = usdtUsd?.rate && usdtUsd.rate > 0 ? usdtUsd.rate : 1;
  return {
    fairRate: forex.rate * usdtUsdRate,
    usdFiatRate: forex.rate,
    usdtUsdRate,
  };
}

async function fetchDomesticUsdtThb(): Promise<{
  rate: number;
  source: string;
  label: string;
  details: Record<string, number | null>;
}> {
  const th = await fetchFromBinanceTh('THB');
  if (!th?.rate) {
    throw new Error('Binance Thailand USDT/THB 시세를 가져올 수 없습니다');
  }
  return {
    rate: th.rate,
    source: 'binance_th',
    label: 'Binance Thailand USDT/THB',
    details: { binanceTh: th.rate },
  };
}

async function fetchDomesticUsdtJpy(): Promise<{
  rate: number;
  source: string;
  label: string;
  details: Record<string, number | null>;
}> {
  const binance = await fetchFromBinanceCross('JPY');
  if (binance?.rate) {
    return {
      rate: binance.rate,
      source: binance.source,
      label: 'Binance Global BTC/JPY ÷ BTC/USDT',
      details: { binanceGlobal: binance.rate },
    };
  }
  const kraken = await fetchFromKrakenBook('JPY');
  if (kraken?.rate) {
    return {
      rate: kraken.rate,
      source: kraken.source,
      label: 'Kraken USDT/JPY',
      details: { kraken: kraken.rate },
    };
  }
  throw new Error('일본 USDT/JPY 국내 시세를 가져올 수 없습니다');
}

async function fetchDomesticUsdtKrwWrapped(): Promise<{
  rate: number;
  source: string;
  label: string;
  details: Record<string, number | null>;
}> {
  const domestic = await fetchDomesticUsdtKrw();
  return {
    rate: domestic.rate,
    source: 'kr_domestic',
    label: 'Upbit·Bithumb 평균',
    details: { upbit: domestic.upbitRate, bithumb: domestic.bithumbRate },
  };
}

function calcPremiumPercent(domesticRate: number, fairRate: number): number {
  if (fairRate <= 0) return 0;
  return Number((((domesticRate / fairRate) - 1) * 100).toFixed(4));
}

/** 국내 시세 vs 환율 이론가 — 통화별 로컬 프리미엄 % */
export async function getLocalMarketPremiumAnalysis(
  currency: LocalPremiumCurrency,
): Promise<LocalMarketPremiumAnalysis> {
  const [domestic, fair] = await Promise.all([
    currency === 'KRW'
      ? fetchDomesticUsdtKrwWrapped()
      : currency === 'THB'
        ? fetchDomesticUsdtThb()
        : fetchDomesticUsdtJpy(),
    fetchFairUsdtFiat(currency),
  ]);

  return {
    currency,
    domesticRate: domestic.rate,
    fairRate: fair.fairRate,
    premiumPercent: calcPremiumPercent(domestic.rate, fair.fairRate),
    domesticSource: domestic.source,
    domesticLabel: domestic.label,
    usdFiatRate: fair.usdFiatRate,
    usdtUsdRate: fair.usdtUsdRate,
    detailRates: domestic.details,
    fetchedAt: new Date(),
  };
}

export async function getAllLocalMarketPremiums(): Promise<LocalMarketPremiumAnalysis[]> {
  const results = await Promise.allSettled(
    LOCAL_PREMIUM_CURRENCIES.map((c) => getLocalMarketPremiumAnalysis(c)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<LocalMarketPremiumAnalysis> => r.status === 'fulfilled')
    .map((r) => r.value);
}
