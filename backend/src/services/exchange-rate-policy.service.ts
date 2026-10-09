import {
  EXCHANGE_RATE_SOURCES,
  HQ_CONFIG_KEYS,
  SYMBOL_FEE_CURRENCIES,
  type ExchangeRateSourceId,
  type HqExchangeRateSourcePolicy,
  type SymbolFeeCurrency,
} from '../constants/hq-policy';
import { prisma } from '../lib/prisma';
import {
  fetchBySource,
  fetchFromCoinGecko,
  type SettlementRateAsset,
} from './exchange-rate-sources';
import { getSettlementAsset } from './settlement-asset.service';

const FALLBACK_RATES: Record<SymbolFeeCurrency, number> = {
  KRW: 1380,
  USD: 1,
  EUR: 0.92,
  JPY: 150,
  THB: 35,
  CNY: 7.2,
};

export type HqExchangeRateSourcesByAsset = {
  USDT: HqExchangeRateSourcePolicy;
  USDC: HqExchangeRateSourcePolicy;
};

export type ExchangeRatePreviewRow = {
  currency: SymbolFeeCurrency;
  configuredSource: ExchangeRateSourceId;
  rate: number | null;
  actualSource: string;
  fetchedAt: string | null;
  error?: string;
  settlementAsset: SettlementRateAsset;
};

export function defaultExchangeRateSourcePolicy(): HqExchangeRateSourcePolicy {
  return {
    KRW: 'kr_domestic',
    JPY: 'binance_cross',
    THB: 'binance_th',
    CNY: 'exchangerate_api',
    USD: 'exchangerate_api',
    EUR: 'exchangerate_api',
  };
}

export function normalizeExchangeRateSourcePolicy(
  raw?: Partial<HqExchangeRateSourcePolicy> | null,
): HqExchangeRateSourcePolicy {
  const defaults = defaultExchangeRateSourcePolicy();
  const out = { ...defaults };
  if (!raw || typeof raw !== 'object') return out;
  for (const currency of SYMBOL_FEE_CURRENCIES) {
    const value = raw[currency];
    if (value && EXCHANGE_RATE_SOURCES.includes(value)) {
      out[currency] = value;
    }
  }
  return out;
}

function isFlatCurrencyPolicy(raw: unknown): raw is Partial<HqExchangeRateSourcePolicy> {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (obj.USDT != null || obj.USDC != null) return false;
  return SYMBOL_FEE_CURRENCIES.some((c) => obj[c] != null);
}

/** 구형식(통화→소스) → USDT/USDC 각각. 구데이터는 USDT에 두고 USDC는 동일 복사 */
export function normalizeExchangeRateSourcesByAsset(
  raw?: unknown,
): HqExchangeRateSourcesByAsset {
  const defaults = defaultExchangeRateSourcePolicy();
  if (!raw || typeof raw !== 'object') {
    return { USDT: { ...defaults }, USDC: { ...defaults } };
  }
  if (isFlatCurrencyPolicy(raw)) {
    const flat = normalizeExchangeRateSourcePolicy(raw);
    return { USDT: { ...flat }, USDC: { ...flat } };
  }
  const obj = raw as Partial<HqExchangeRateSourcesByAsset>;
  return {
    USDT: normalizeExchangeRateSourcePolicy(obj.USDT),
    USDC: normalizeExchangeRateSourcePolicy(obj.USDC ?? obj.USDT),
  };
}

export async function getExchangeRateSourcesByAsset(): Promise<HqExchangeRateSourcesByAsset> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.exchangeRateSources },
  });
  return normalizeExchangeRateSourcesByAsset(row?.value);
}

/** @deprecated 정산자산 기준 단일 맵 — getExchangeRateSourcesByAsset 권장 */
export async function getExchangeRateSourcePolicy(
  assetOverride?: SettlementRateAsset,
): Promise<HqExchangeRateSourcePolicy> {
  const byAsset = await getExchangeRateSourcesByAsset();
  const asset = assetOverride ?? (await getSettlementAsset());
  return byAsset[asset === 'USDC' ? 'USDC' : 'USDT'];
}

export async function saveExchangeRateSourcesByAsset(
  policy: HqExchangeRateSourcesByAsset,
): Promise<HqExchangeRateSourcesByAsset> {
  const normalized = normalizeExchangeRateSourcesByAsset(policy);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.exchangeRateSources },
    create: {
      key: HQ_CONFIG_KEYS.exchangeRateSources,
      value: normalized as object,
      description: '통화별 USDT/USDC 기준가 소스',
    },
    update: {
      value: normalized as object,
      description: '통화별 USDT/USDC 기준가 소스',
    },
  });
  return normalized;
}

/** 레거시: 단일 맵 저장 시 정산자산 쪽만 갱신하고 반대편은 유지 */
export async function saveExchangeRateSourcePolicy(
  policy: HqExchangeRateSourcePolicy,
  assetOverride?: SettlementRateAsset,
): Promise<HqExchangeRateSourcePolicy> {
  const asset = assetOverride ?? (await getSettlementAsset());
  const current = await getExchangeRateSourcesByAsset();
  const next: HqExchangeRateSourcesByAsset = {
    ...current,
    [asset === 'USDC' ? 'USDC' : 'USDT']: normalizeExchangeRateSourcePolicy(policy),
  };
  await saveExchangeRateSourcesByAsset(next);
  return next[asset === 'USDC' ? 'USDC' : 'USDT'];
}

export async function fetchUsdtFiatRateWithPolicy(
  currency: SymbolFeeCurrency,
  sourceOverride?: ExchangeRateSourceId,
  assetOverride?: SettlementRateAsset,
): Promise<{ rate: number; source: string; fetchedAt: Date; settlementAsset: SettlementRateAsset }> {
  const asset: SettlementRateAsset =
    assetOverride ?? (await getSettlementAsset());
  const byAsset = await getExchangeRateSourcesByAsset();
  const policy = byAsset[asset === 'USDC' ? 'USDC' : 'USDT'];
  const primary = sourceOverride ?? policy[currency] ?? 'coingecko';

  const primaryResult = await fetchBySource(currency, primary, asset);
  if (primaryResult) {
    return {
      rate: primaryResult.rate,
      source: primaryResult.source,
      fetchedAt: primaryResult.fetchedAt,
      settlementAsset: asset,
    };
  }

  if (primary !== 'coingecko') {
    const cg = await fetchFromCoinGecko(currency, asset);
    if (cg) {
      return {
        rate: cg.rate,
        source: `${cg.source}_fallback`,
        fetchedAt: cg.fetchedAt,
        settlementAsset: asset,
      };
    }
  }

  return {
    rate: FALLBACK_RATES[currency],
    source: 'fallback',
    fetchedAt: new Date(),
    settlementAsset: asset,
  };
}

async function previewForAsset(asset: SettlementRateAsset): Promise<ExchangeRatePreviewRow[]> {
  const byAsset = await getExchangeRateSourcesByAsset();
  const policy = byAsset[asset];
  return Promise.all(
    SYMBOL_FEE_CURRENCIES.map(async (currency) => {
      try {
        const result = await fetchUsdtFiatRateWithPolicy(currency, undefined, asset);
        return {
          currency,
          configuredSource: policy[currency],
          rate: result.rate,
          actualSource: result.source,
          fetchedAt: result.fetchedAt.toISOString(),
          settlementAsset: asset,
        };
      } catch (e) {
        return {
          currency,
          configuredSource: policy[currency],
          rate: null,
          actualSource: 'error',
          fetchedAt: null,
          error: e instanceof Error ? e.message : 'fetch failed',
          settlementAsset: asset,
        };
      }
    }),
  );
}

/** 정산자산 기준 미리보기 (하위호환) */
export async function getExchangeRatePolicyPreview(): Promise<ExchangeRatePreviewRow[]> {
  const asset = await getSettlementAsset();
  return previewForAsset(asset);
}

/** HQ: USDT·USDC 기준가 미리보기 동시 */
export async function getExchangeRatePolicyPreviewByAsset(): Promise<{
  USDT: ExchangeRatePreviewRow[];
  USDC: ExchangeRatePreviewRow[];
}> {
  const [USDT, USDC] = await Promise.all([previewForAsset('USDT'), previewForAsset('USDC')]);
  return { USDT, USDC };
}
