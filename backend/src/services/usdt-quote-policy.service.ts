import { prisma } from '../lib/prisma';
import {
  HQ_CONFIG_KEYS,
  USDT_QUOTE_AUTO_DELAY_MINUTES,
  USDT_QUOTE_MANUAL_SLA_HOURS,
  defaultUsdtQuoteResponsePolicy,
  normalizeUsdtQuoteResponsePolicy,
  type HqUsdtQuoteResponsePolicy,
  type UsdtQuoteAutoDelayMinutes,
  type UsdtQuoteManualSlaHours,
} from '../constants/hq-policy';

async function getConfig<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row?.value) return fallback;
  return row.value as T;
}

async function putConfig<T>(key: string, value: T, description?: string): Promise<T> {
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value: value as object, description },
    update: { value: value as object, description },
  });
  return value;
}

export async function getUsdtQuoteResponsePolicy(): Promise<HqUsdtQuoteResponsePolicy> {
  const raw = await getConfig(HQ_CONFIG_KEYS.usdtQuoteResponse, defaultUsdtQuoteResponsePolicy());
  return normalizeUsdtQuoteResponsePolicy(raw);
}

export async function saveUsdtQuoteResponsePolicy(
  input: Partial<HqUsdtQuoteResponsePolicy>,
): Promise<HqUsdtQuoteResponsePolicy> {
  const next = normalizeUsdtQuoteResponsePolicy({
    ...(await getUsdtQuoteResponsePolicy()),
    ...input,
  });
  await putConfig(HQ_CONFIG_KEYS.usdtQuoteResponse, next, 'USDT 은행이체(고정·CURFEX) 견적 응답 정책');
  return next;
}

export type CustomerQuoteOverride = {
  usdtQuoteResponseMode?: string | null;
  usdtQuoteAutoDelayMinutes?: number | null;
  usdtQuoteManualSlaHours?: number | null;
};

function clampAutoDelay(n: number | null | undefined, fallback: UsdtQuoteAutoDelayMinutes): UsdtQuoteAutoDelayMinutes {
  const v = Number(n);
  if ((USDT_QUOTE_AUTO_DELAY_MINUTES as readonly number[]).includes(v)) {
    return v as UsdtQuoteAutoDelayMinutes;
  }
  return fallback;
}

function clampManualSla(n: number | null | undefined, fallback: UsdtQuoteManualSlaHours): UsdtQuoteManualSlaHours {
  const v = Number(n);
  if ((USDT_QUOTE_MANUAL_SLA_HOURS as readonly number[]).includes(v)) {
    return v as UsdtQuoteManualSlaHours;
  }
  return fallback;
}

/**
 * 고객 개별 견적 응답 + 본사 정책 합성.
 * FOLLOW_HQ(기본) → 본사 그대로.
 * AUTO/MANUAL → 해당 모드로 강제(대기/SLA는 고객값 없으면 본사값).
 * OFF → 견적 흐름 미사용(즉시 입금대기).
 */
export function resolveEffectiveQuotePolicy(
  hq: HqUsdtQuoteResponsePolicy,
  customer?: CustomerQuoteOverride | null,
): HqUsdtQuoteResponsePolicy {
  const mode = String(customer?.usdtQuoteResponseMode ?? 'FOLLOW_HQ').toUpperCase();
  if (mode === 'OFF') {
    return { ...hq, enabled: false };
  }
  if (mode === 'AUTO') {
    return {
      ...hq,
      enabled: true,
      mode: 'AUTO',
      autoDelayMinutes: clampAutoDelay(customer?.usdtQuoteAutoDelayMinutes, hq.autoDelayMinutes),
      manualSlaHours: hq.manualSlaHours,
    };
  }
  if (mode === 'MANUAL') {
    return {
      ...hq,
      enabled: true,
      mode: 'MANUAL',
      autoDelayMinutes: hq.autoDelayMinutes,
      manualSlaHours: clampManualSla(customer?.usdtQuoteManualSlaHours, hq.manualSlaHours),
    };
  }
  return hq;
}

export async function getEffectiveQuotePolicyForCustomer(
  customer?: CustomerQuoteOverride | null,
): Promise<HqUsdtQuoteResponsePolicy> {
  const hq = await getUsdtQuoteResponsePolicy();
  return resolveEffectiveQuotePolicy(hq, customer);
}

export function computeQuoteDueAt(
  policy: HqUsdtQuoteResponsePolicy,
  from: Date = new Date(),
): Date {
  if (policy.mode === 'MANUAL') {
    return new Date(from.getTime() + policy.manualSlaHours * 60 * 60 * 1000);
  }
  return new Date(from.getTime() + policy.autoDelayMinutes * 60 * 1000);
}
