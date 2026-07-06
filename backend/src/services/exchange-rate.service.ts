import { AppError } from '../lib/errors';

interface ExchangeRateResult {
  rate: number;
  source: string;
  fetchedAt: Date;
}

/** KRW per 1 USDT — 외부 API 실패 시 fallback 고정값 */
export async function fetchUsdtKrwRate(): Promise<ExchangeRateResult> {
  const apiUrl = process.env.EXCHANGE_RATE_API_URL;

  if (apiUrl) {
    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = (await res.json()) as { rates?: { KRW?: number } };
        const usdToKrw = data.rates?.KRW;
        if (usdToKrw) {
          return {
            rate: usdToKrw,
            source: 'external_api',
            fetchedAt: new Date(),
          };
        }
      }
    } catch {
      // fallback below
    }
  }

  return {
    rate: 1380,
    source: 'fallback',
    fetchedAt: new Date(),
  };
}

export async function getExchangeRateDisplay(): Promise<{
  usdtKrwRate: number;
  source: string;
  fetchedAt: string;
  disclaimer: string;
}> {
  const { rate, source, fetchedAt } = await fetchUsdtKrwRate();
  return {
    usdtKrwRate: rate,
    source,
    fetchedAt: fetchedAt.toISOString(),
    disclaimer: '참고 시세이며, 실제 거래 시점의 환율과 다를 수 있습니다.',
  };
}

export function calculateExpectedUsdt(
  fiatAmount: number,
  exchangeRate: number,
  gasFee: number,
  platformFee: number,
): number {
  if (exchangeRate <= 0) {
    throw new AppError(400, 'Invalid exchange rate', 'INVALID_RATE');
  }
  const grossUsdt = fiatAmount / exchangeRate;
  const net = grossUsdt - gasFee - platformFee;
  return Math.max(0, Number(net.toFixed(8)));
}
