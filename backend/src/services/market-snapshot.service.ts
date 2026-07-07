import { CurrencyCode } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { fetchUsdtFiatRateWithPolicy } from './exchange-rate-policy.service';
import {
  CHART_FIAT_CURRENCIES,
  type ChartFiatCurrency,
  fetchAllExchangeMarketStats,
} from './exchange-market-stats.service';

const SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000;
let collectorTimer: ReturnType<typeof setInterval> | null = null;
let collecting = false;

export async function collectMarketSnapshots(): Promise<void> {
  if (collecting) return;
  collecting = true;
  try {
    const [marketRows, policyRates] = await Promise.all([
      fetchAllExchangeMarketStats(),
      Promise.all(
        CHART_FIAT_CURRENCIES.map(async (currency) => {
          const result = await fetchUsdtFiatRateWithPolicy(currency as ChartFiatCurrency);
          return { currency, ...result };
        }),
      ),
    ]);

    const capturedAt = new Date();
    const marketByCurrency = new Map(marketRows.map((r) => [r.currency, r]));

    for (const currency of CHART_FIAT_CURRENCIES) {
      const market = marketByCurrency.get(currency);
      const policy = policyRates.find((r) => r.currency === currency);
      const rate = market?.rate ?? policy?.rate ?? 0;
      const source = market?.source ?? policy?.source ?? 'fallback';
      if (rate <= 0) continue;

      await prisma.exchangeRateSnapshot.create({
        data: {
          currency: currency as CurrencyCode,
          rate,
          source,
          capturedAt,
        },
      });

      await prisma.exchangeMarketSnapshot.create({
        data: {
          currency: currency as CurrencyCode,
          rate,
          volume24hUsdt: market?.volume24hUsdt ?? null,
          volume24hQuote: market?.volume24hQuote ?? null,
          changePercent24h: market?.changePercent24h ?? null,
          source,
          capturedAt,
        },
      });
    }
  } finally {
    collecting = false;
  }
}

export function startMarketSnapshotCollector(): void {
  if (collectorTimer) return;
  void collectMarketSnapshots().catch((e) => console.error('[market-snapshot]', e));
  collectorTimer = setInterval(() => {
    void collectMarketSnapshots().catch((e) => console.error('[market-snapshot]', e));
  }, SNAPSHOT_INTERVAL_MS);
}

export async function ensureMarketSnapshots(): Promise<void> {
  const count = await prisma.exchangeRateSnapshot.count();
  if (count === 0) {
    await collectMarketSnapshots();
  }
}

export async function getLatestMarketSnapshots(): Promise<
  Record<
    ChartFiatCurrency,
    {
      rate: number;
      volume24hUsdt: number | null;
      volume24hQuote: number | null;
      changePercent24h: number | null;
      source: string;
      capturedAt: string;
    } | null
  >
> {
  const out = {} as Record<
    ChartFiatCurrency,
    {
      rate: number;
      volume24hUsdt: number | null;
      volume24hQuote: number | null;
      changePercent24h: number | null;
      source: string;
      capturedAt: string;
    } | null
  >;

  for (const currency of CHART_FIAT_CURRENCIES) {
    const row = await prisma.exchangeMarketSnapshot.findFirst({
      where: { currency: currency as CurrencyCode },
      orderBy: { capturedAt: 'desc' },
    });
    out[currency] = row
      ? {
          rate: Number(row.rate),
          volume24hUsdt: row.volume24hUsdt != null ? Number(row.volume24hUsdt) : null,
          volume24hQuote: row.volume24hQuote != null ? Number(row.volume24hQuote) : null,
          changePercent24h:
            row.changePercent24h != null ? Number(row.changePercent24h) : null,
          source: row.source,
          capturedAt: row.capturedAt.toISOString(),
        }
      : null;
  }
  return out;
}

export async function getRateSeries(
  currency: ChartFiatCurrency,
  from: Date,
): Promise<Array<{ date: string; rate: number }>> {
  const rows = await prisma.exchangeRateSnapshot.findMany({
    where: { currency: currency as CurrencyCode, capturedAt: { gte: from } },
    orderBy: { capturedAt: 'asc' },
    select: { rate: true, capturedAt: true },
  });

  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    const key = row.capturedAt.toISOString().slice(0, 10);
    const prev = buckets.get(key) ?? { sum: 0, count: 0 };
    prev.sum += Number(row.rate);
    prev.count += 1;
    buckets.set(key, prev);
  }

  return [...buckets.entries()].map(([date, { sum, count }]) => ({
    date,
    rate: sum / count,
  }));
}
