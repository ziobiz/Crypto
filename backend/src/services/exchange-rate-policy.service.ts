import {
  EXCHANGE_RATE_SOURCES,
  HQ_CONFIG_KEYS,
  SYMBOL_FEE_CURRENCIES,
  type ExchangeRateSourceId,
  type HqExchangeRateSourcePolicy,
  type SymbolFeeCurrency,
} from '../constants/hq-policy';
import { prisma } from '../lib/prisma';
import { fetchBySource, fetchFromCoinGecko } from './exchange-rate-sources';

const FALLBACK_RATES: Record<SymbolFeeCurrency, number> = {
  KRW: 1380,
  USD: 1,
  JPY: 150,
  THB: 35,
  CNY: 7.2,
};

export function defaultExchangeRateSourcePolicy(): HqExchangeRateSourcePolicy {
  return {
    KRW: 'kr_domestic',
    JPY: 'binance_cross',
    THB: 'binance_th',
    CNY: 'exchangerate_api',
    USD: 'exchangerate_api',
  };
}

export function normalizeExchangeRateSourcePolicy(
  raw?: Partial<HqExchangeRateSourcePolicy>,
): HqExchangeRateSourcePolicy {
  const defaults = defaultExchangeRateSourcePolicy();
  const out = { ...defaults };
  for (const currency of SYMBOL_FEE_CURRENCIES) {
    const value = raw?.[currency];
    if (value && EXCHANGE_RATE_SOURCES.includes(value)) {
      out[currency] = value;
    }
  }
  return out;
}

export async function getExchangeRateSourcePolicy(): Promise<HqExchangeRateSourcePolicy> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.exchangeRateSources },
  });
  return normalizeExchangeRateSourcePolicy(row?.value as Partial<HqExchangeRateSourcePolicy>);
}

export async function saveExchangeRateSourcePolicy(
  policy: HqExchangeRateSourcePolicy,
): Promise<HqExchangeRateSourcePolicy> {
  const normalized = normalizeExchangeRateSourcePolicy(policy);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.exchangeRateSources },
    create: {
      key: HQ_CONFIG_KEYS.exchangeRateSources,
      value: normalized as object,
      description: '통화별 USDT 기준가 소스',
    },
    update: { value: normalized as object },
  });
  return normalized;
}

export async function fetchUsdtFiatRateWithPolicy(
  currency: SymbolFeeCurrency,
  sourceOverride?: ExchangeRateSourceId,
): Promise<{ rate: number; source: string; fetchedAt: Date }> {
  const policy = await getExchangeRateSourcePolicy();
  const primary = sourceOverride ?? policy[currency] ?? 'coingecko';

  const primaryResult = await fetchBySource(currency, primary);
  if (primaryResult) {
    return {
      rate: primaryResult.rate,
      source: primaryResult.source,
      fetchedAt: primaryResult.fetchedAt,
    };
  }

  if (primary !== 'coingecko') {
    const cg = await fetchFromCoinGecko(currency);
    if (cg) {
      return { rate: cg.rate, source: `${cg.source}_fallback`, fetchedAt: cg.fetchedAt };
    }
  }

  return {
    rate: FALLBACK_RATES[currency],
    source: 'fallback',
    fetchedAt: new Date(),
  };
}

export async function getExchangeRatePolicyPreview(): Promise<
  Array<{
    currency: SymbolFeeCurrency;
    configuredSource: ExchangeRateSourceId;
    rate: number | null;
    actualSource: string;
    fetchedAt: string | null;
    error?: string;
  }>
> {
  const policy = await getExchangeRateSourcePolicy();
  const rows = await Promise.all(
    SYMBOL_FEE_CURRENCIES.map(async (currency) => {
      try {
        const result = await fetchUsdtFiatRateWithPolicy(currency);
        return {
          currency,
          configuredSource: policy[currency],
          rate: result.rate,
          actualSource: result.source,
          fetchedAt: result.fetchedAt.toISOString(),
        };
      } catch (e) {
        return {
          currency,
          configuredSource: policy[currency],
          rate: null,
          actualSource: 'error',
          fetchedAt: null,
          error: e instanceof Error ? e.message : 'fetch failed',
        };
      }
    }),
  );
  return rows;
}
