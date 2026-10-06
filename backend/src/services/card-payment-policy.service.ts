import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  CARD_FEE_BRANDS,
  DEFAULT_CARD_PAYMENT_CONFIG,
  DEFAULT_ICOPAY_CONFIG,
  HQ_CONFIG_KEYS,
  defaultCardFeeByBrand,
  resolveCardFeePercent,
  type CardFeeBrand,
  type CardFeeByBrand,
  type HqCardPaymentConfig,
  type HqIcopayConfig,
  type SymbolFeeCurrency,
} from '../constants/hq-policy';
import { isMaskedIcopaySecret, maskIcopaySecret, normalizeIcopayConfig } from './icopay.service';

export { resolveCardFeePercent };

async function getConfig<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row?.value) return fallback;
  return { ...fallback, ...(row.value as object) } as T;
}

function normalizeBrandFees(
  raw: Partial<CardFeeByBrand> | undefined,
  fallbackPercent: number,
): CardFeeByBrand {
  const base = defaultCardFeeByBrand(fallbackPercent);
  const out = { ...base };
  for (const brand of CARD_FEE_BRANDS) {
    const v = raw?.[brand];
    if (v != null && Number.isFinite(Number(v))) {
      out[brand] = Math.max(0, Number(v));
    }
  }
  return out;
}

export function normalizeCardPaymentConfig(raw: Partial<HqCardPaymentConfig>): HqCardPaymentConfig {
  const base = DEFAULT_CARD_PAYMENT_CONFIG();
  const cardFeePercent = Math.max(0, Number(raw.cardFeePercent ?? base.cardFeePercent) || 0);
  const cardFeeMode = raw.cardFeeMode === 'BY_BRAND' ? 'BY_BRAND' : 'UNIFORM';
  let cardFeeByBrand = normalizeBrandFees(raw.cardFeeByBrand, cardFeePercent);
  if (cardFeeMode === 'UNIFORM') {
    cardFeeByBrand = defaultCardFeeByBrand(cardFeePercent);
  }
  return {
    enabled: raw.enabled === true,
    cardFeeMode,
    cardFeePercent,
    cardFeeByBrand,
    limits: { ...base.limits, ...(raw.limits ?? {}) },
  };
}

export async function getCardPaymentConfig(): Promise<HqCardPaymentConfig> {
  return normalizeCardPaymentConfig(
    await getConfig(HQ_CONFIG_KEYS.cardPayment, DEFAULT_CARD_PAYMENT_CONFIG()),
  );
}

export async function getIcopayConfig(): Promise<HqIcopayConfig> {
  return normalizeIcopayConfig(
    await getConfig(HQ_CONFIG_KEYS.icopay, DEFAULT_ICOPAY_CONFIG()),
  );
}

export async function getIcopayConfigMasked(): Promise<HqIcopayConfig> {
  return maskIcopaySecret(await getIcopayConfig());
}

export async function saveCardPaymentConfig(config: HqCardPaymentConfig): Promise<HqCardPaymentConfig> {
  const normalized = normalizeCardPaymentConfig(config);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.cardPayment },
    create: {
      key: HQ_CONFIG_KEYS.cardPayment,
      value: normalized as object,
      description: '카드 결제 정책 · 카드수수료',
    },
    update: { value: normalized as object },
  });
  return normalized;
}

function pickIcopaySecret(incoming: string | undefined, current: string): string {
  const v = String(incoming ?? '').trim();
  if (v && !isMaskedIcopaySecret(v)) return v;
  return String(current ?? '').trim();
}

export async function saveIcopayConfig(
  incoming: Partial<HqIcopayConfig>,
  existingSecret?: string,
): Promise<HqIcopayConfig> {
  const current = await getIcopayConfig();
  const brokerSecretLive = pickIcopaySecret(incoming.brokerSecretLive, current.brokerSecretLive ?? '');
  const brokerSecretSandbox = pickIcopaySecret(
    incoming.brokerSecretSandbox,
    current.brokerSecretSandbox ?? '',
  );
  const bracketSecret = pickIcopaySecret(
    incoming.bracketSecret,
    existingSecret ?? current.bracketSecret,
  );
  const normalized = normalizeIcopayConfig({
    ...current,
    ...incoming,
    brokerSecretLive,
    brokerSecretSandbox,
    bracketSecret,
  });
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.icopay },
    create: {
      key: HQ_CONFIG_KEYS.icopay,
      value: normalized as object,
      description: 'ICOPAY 연동',
    },
    update: { value: normalized as object },
  });
  return maskIcopaySecret(normalized);
}

/**
 * 카드 1회 한도 — 리스크관리 「카드결제」 탭(개인/법인·통화).
 * 0 = 해당 방향 제한 없음. 구 결제관리 card.limits 는 사용하지 않음.
 */
export async function validateCardChargeAmount(
  currency: SymbolFeeCurrency,
  cardChargeFiat: number,
  customerType?: string | null,
): Promise<void> {
  const { getCommissionRiskConfig } = await import('./transaction-fee.service');
  const risk = await getCommissionRiskConfig();
  const typeKey = customerType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';
  const band =
    risk.methodTransactionLimits?.CARD?.[typeKey]?.[currency] ?? {
      perTransactionMin: 0,
      perTransactionMax: 0,
    };
  if (band.perTransactionMin > 0 && cardChargeFiat < band.perTransactionMin) {
    throw new AppError(
      400,
      `Card payment minimum is ${band.perTransactionMin} ${currency}`,
      'CARD_MIN_LIMIT',
    );
  }
  if (band.perTransactionMax > 0 && cardChargeFiat > band.perTransactionMax) {
    throw new AppError(
      400,
      `Card payment maximum is ${band.perTransactionMax} ${currency}`,
      'CARD_MAX_LIMIT',
    );
  }
}

export async function assertCardPaymentAvailable(): Promise<{
  card: HqCardPaymentConfig;
  icopay: HqIcopayConfig;
}> {
  const [card, icopay] = await Promise.all([getCardPaymentConfig(), getIcopayConfig()]);
  if (!card.enabled) {
    throw new AppError(503, 'Card payment is disabled', 'CARD_DISABLED');
  }
  const compId = String(icopay.compId || icopay.mid || '').trim();
  if (!icopay.enabled || !compId || !icopay.bracketSecret) {
    throw new AppError(503, 'ICOPAY is not configured', 'ICOPAY_NOT_CONFIGURED');
  }
  return { card, icopay };
}

export function isCardFeeBrand(value: string): value is CardFeeBrand {
  return (CARD_FEE_BRANDS as readonly string[]).includes(value);
}
