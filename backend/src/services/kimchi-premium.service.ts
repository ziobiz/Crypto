import { fetchFromCoinGecko, fetchFromExchangeRateApi } from './exchange-rate-sources';

export type KimchiPremiumAnalysis = {
  domesticRate: number;
  fairRate: number;
  premiumPercent: number;
  upbitRate: number | null;
  bithumbRate: number | null;
  usdKrwRate: number;
  usdtUsdRate: number;
  fetchedAt: Date;
};

const FETCH_TIMEOUT_MS = 8000;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchUpbitUsdtKrw(): Promise<number | null> {
  const data = await fetchJson<Array<{ trade_price: number }>>(
    'https://api.upbit.com/v1/ticker?markets=KRW-USDT',
  );
  const rate = data?.[0]?.trade_price;
  return rate && rate > 0 ? rate : null;
}

export async function fetchBithumbUsdtKrw(): Promise<number | null> {
  const data = await fetchJson<{ data?: { closing_price: string } }>(
    'https://api.bithumb.com/public/ticker/USDT_KRW',
  );
  const rate = Number(data?.data?.closing_price);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

/** 업비트·빗썸 평균 — 국내 USDT/KRW 기준가 (김프 포함 시세) */
export async function fetchDomesticUsdtKrw(): Promise<{
  rate: number;
  upbitRate: number | null;
  bithumbRate: number | null;
}> {
  const [upbit, bithumb] = await Promise.all([fetchUpbitUsdtKrw(), fetchBithumbUsdtKrw()]);
  const rates = [upbit, bithumb].filter((r): r is number => r != null && r > 0);
  if (!rates.length) {
    throw new Error('국내 거래소(업비트·빗썸) USDT 시세를 가져올 수 없습니다');
  }
  const rate = rates.reduce((a, b) => a + b, 0) / rates.length;
  return { rate, upbitRate: upbit, bithumbRate: bithumb };
}

/** 환율(USD/KRW) × USDT/USD — 김프 제외 이론가 */
export async function fetchFairUsdtKrw(): Promise<{ fairRate: number; usdKrwRate: number; usdtUsdRate: number }> {
  const [forex, usdtUsd] = await Promise.all([
    fetchFromExchangeRateApi('KRW'),
    fetchFromCoinGecko('USD'),
  ]);
  if (!forex?.rate) {
    throw new Error('원·달러 환율을 가져올 수 없습니다');
  }
  const usdtUsdRate = usdtUsd?.rate && usdtUsd.rate > 0 ? usdtUsd.rate : 1;
  const fairRate = forex.rate * usdtUsdRate;
  return { fairRate, usdKrwRate: forex.rate, usdtUsdRate };
}

/** 김치 프리미엄 % = (국내 USDT/KRW ÷ 이론가 − 1) × 100 */
export async function getKimchiPremiumAnalysis(): Promise<KimchiPremiumAnalysis> {
  const [domestic, fair] = await Promise.all([fetchDomesticUsdtKrw(), fetchFairUsdtKrw()]);
  const premiumPercent =
    fair.fairRate > 0
      ? Number((((domestic.rate / fair.fairRate) - 1) * 100).toFixed(4))
      : 0;

  return {
    domesticRate: domestic.rate,
    fairRate: fair.fairRate,
    premiumPercent,
    upbitRate: domestic.upbitRate,
    bithumbRate: domestic.bithumbRate,
    usdKrwRate: fair.usdKrwRate,
    usdtUsdRate: fair.usdtUsdRate,
    fetchedAt: new Date(),
  };
}

/** gross USDT 대비 김프 기타수수료 (USDT) */
export function kimchiPremiumFeeUsdt(grossUsdt: number, premiumPercent: number): number {
  if (grossUsdt <= 0 || premiumPercent <= 0) return 0;
  return Number((grossUsdt * (premiumPercent / 100)).toFixed(8));
}
