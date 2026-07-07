import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  DEFAULT_CARD_PAYMENT_CONFIG,
  DEFAULT_ICOPAY_CONFIG,
  HQ_CONFIG_KEYS,
  type HqCardPaymentConfig,
  type HqIcopayConfig,
  type SymbolFeeCurrency,
} from '../constants/hq-policy';
import { maskIcopaySecret, normalizeIcopayConfig } from './icopay.service';

async function getConfig<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row?.value) return fallback;
  return { ...fallback, ...(row.value as object) } as T;
}

function normalizeCardPaymentConfig(raw: Partial<HqCardPaymentConfig>): HqCardPaymentConfig {
  const base = DEFAULT_CARD_PAYMENT_CONFIG();
  return {
    enabled: raw.enabled === true,
    cardFeePercent: Number(raw.cardFeePercent ?? base.cardFeePercent),
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
      description: '카드 결제 정책',
    },
    update: { value: normalized as object },
  });
  return normalized;
}

export async function saveIcopayConfig(
  incoming: Partial<HqIcopayConfig>,
  existingSecret?: string,
): Promise<HqIcopayConfig> {
  const current = await getIcopayConfig();
  const bracketSecret =
    incoming.bracketSecret && incoming.bracketSecret !== '********'
      ? incoming.bracketSecret
      : existingSecret ?? current.bracketSecret;
  const normalized = normalizeIcopayConfig({ ...current, ...incoming, bracketSecret });
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

export function validateCardChargeAmount(
  config: HqCardPaymentConfig,
  currency: SymbolFeeCurrency,
  cardChargeFiat: number,
): void {
  const limits = config.limits[currency] ?? { min: 0, max: 0 };
  if (limits.min > 0 && cardChargeFiat < limits.min) {
    throw new AppError(
      400,
      `Card payment minimum is ${limits.min} ${currency}`,
      'CARD_MIN_LIMIT',
    );
  }
  if (limits.max > 0 && cardChargeFiat > limits.max) {
    throw new AppError(
      400,
      `Card payment maximum is ${limits.max} ${currency}`,
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
    throw new AppError(503, 'Card payment is not enabled', 'CARD_DISABLED');
  }
  if (!icopay.enabled || !icopay.mid || !icopay.bracketSecret) {
    throw new AppError(503, 'ICOPAY is not configured', 'ICOPAY_NOT_CONFIGURED');
  }
  return { card, icopay };
}
