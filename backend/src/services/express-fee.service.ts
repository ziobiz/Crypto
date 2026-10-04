import type { CustomerType } from '@prisma/client';
import {
  EXPRESS_TIERS,
  HQ_CONFIG_KEYS,
  type CustomerTypeLimitKey,
  type ExpressFeeMode,
  type ExpressTier,
  type ExpressTierOption,
  type HqExpressCustomerTypePolicy,
  type HqExpressPolicy,
  type MemberGrade,
  type MemberGradeExpressBenefit,
  type ResolvedExpressRates,
  type ResolvedExpressSelection,
  computeExpressFeeUsdt,
  defaultExpressCustomerTypePolicy,
  defaultExpressPolicy,
  expressDeadlineAt,
  expressMaxHours,
  normalizeExpressFeeMode,
  normalizeExpressPolicy,
  normalizeExpressTier,
  normalizeExpressCustomerTypePolicy,
  normalizeMemberGradeBenefit,
  isExpressTierEnabled,
  resolveExpressRatesWithMemberGrade,
} from '../constants/hq-policy';
import { prisma } from '../lib/prisma';
import { benefitForMemberGrade, getHqMemberGradePolicy } from './member-grade.service';

export async function getHqExpressPolicy(): Promise<HqExpressPolicy> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.expressFee },
  });
  return normalizeExpressPolicy(row?.value);
}

export async function saveHqExpressPolicy(policy: HqExpressPolicy): Promise<HqExpressPolicy> {
  const normalized = normalizeExpressPolicy(policy);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.expressFee },
    create: {
      key: HQ_CONFIG_KEYS.expressFee,
      value: normalized,
      description: 'EXPRESS 수수료 (개인/법인 · 고정/%)',
    },
    update: {
      value: normalized,
      description: 'EXPRESS 수수료 (개인/법인 · 고정/%)',
    },
  });
  return normalized;
}

function toTypeKey(customerType: CustomerType | string | null | undefined): CustomerTypeLimitKey {
  return String(customerType).toUpperCase() === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';
}

export type ExpressCustomerProfile = {
  customerType?: CustomerType | string | null;
  expressFeeMode?: string | null;
  expressFeeConfig?: unknown;
  memberGrade?: string | null;
};

/** 고객 유효 EXPRESS 정책 (FOLLOW_HQ / CUSTOM / DISABLED) */
export async function resolveExpressPolicyForCustomer(
  profile?: ExpressCustomerProfile | null,
): Promise<{
  mode: ExpressFeeMode;
  source: 'HQ' | 'CUSTOM' | 'DISABLED';
  policy: HqExpressCustomerTypePolicy;
  customerType: CustomerTypeLimitKey;
}> {
  const customerType = toTypeKey(profile?.customerType);
  const mode = normalizeExpressFeeMode(profile?.expressFeeMode);
  if (mode === 'DISABLED') {
    return {
      mode,
      source: 'DISABLED',
      policy: { ...defaultExpressCustomerTypePolicy(), enabled: false },
      customerType,
    };
  }
  if (mode === 'CUSTOM') {
    const custom = normalizeExpressCustomerTypePolicy(profile?.expressFeeConfig);
    return { mode, source: 'CUSTOM', policy: custom, customerType };
  }
  const hq = await getHqExpressPolicy();
  return {
    mode: 'FOLLOW_HQ',
    source: 'HQ',
    policy: hq[customerType] ?? defaultExpressCustomerTypePolicy(),
    customerType,
  };
}

function baseRatesForTier(
  policy: HqExpressCustomerTypePolicy,
  tier: ExpressTier,
): { feeUsdt: number | null; feePercent: number | null } {
  const cfg = policy.tiers[tier];
  const feeUsdt =
    cfg?.feeUsdt != null && Number.isFinite(cfg.feeUsdt) && cfg.feeUsdt >= 0
      ? Number(cfg.feeUsdt)
      : tier === 'BASIC'
        ? 0
        : null;
  const feePercent =
    cfg?.feePercent != null && Number.isFinite(cfg.feePercent) && cfg.feePercent >= 0
      ? Number(cfg.feePercent)
      : null;
  return { feeUsdt, feePercent };
}

/** 회원등급 혜택을 반영한 EXPRESS 옵션 (요율: 고정 + %) — 티어 관리(사용)만 노출 */
export function listAvailableExpressOptions(
  policy: HqExpressCustomerTypePolicy,
  benefit?: MemberGradeExpressBenefit | null,
): ExpressTierOption[] {
  if (!policy.enabled) return [];
  const gradeBenefit = benefit ?? normalizeMemberGradeBenefit(null);
  const options: ExpressTierOption[] = [];
  for (const tier of EXPRESS_TIERS) {
    if (!isExpressTierEnabled(policy.tiers[tier], tier)) continue;
    const base = baseRatesForTier(policy, tier);
    const rates = resolveExpressRatesWithMemberGrade(
      base.feeUsdt,
      base.feePercent,
      gradeBenefit,
      tier,
    );
    if (!rates) continue;
    options.push({
      tier,
      feeUsdt: rates.feeUsdt,
      feePercent: rates.feePercent,
      maxHours: expressMaxHours(tier),
    });
  }
  return options;
}

export type ResolvedExpressSelectionWithGrade = ResolvedExpressSelection & {
  memberGrade: MemberGrade;
  memberGradeBenefit: MemberGradeExpressBenefit;
  rates: ResolvedExpressRates;
};

export async function resolveExpressSelectionForCustomer(
  profile: ExpressCustomerProfile | null | undefined,
  requestedTier?: string | null,
): Promise<ResolvedExpressSelectionWithGrade | null> {
  const resolved = await resolveExpressPolicyForCustomer(profile);
  const gradePolicy = await getHqMemberGradePolicy();
  const { grade, benefit } = benefitForMemberGrade(
    gradePolicy,
    profile?.memberGrade,
    resolved.customerType,
  );
  const options = listAvailableExpressOptions(resolved.policy, benefit);
  if (!options.length) return null;

  const requested = requestedTier ? normalizeExpressTier(requestedTier) : null;
  const picked =
    (requested && options.find((o) => o.tier === requested)) ||
    options.find((o) => o.tier === 'BASIC') ||
    options[options.length - 1]!;

  const rates: ResolvedExpressRates = {
    feeUsdt: picked.feeUsdt,
    feePercent: picked.feePercent,
  };

  return {
    enabled: true,
    tier: picked.tier,
    feeUsdt: picked.feeUsdt,
    feePercent: picked.feePercent,
    maxHours: picked.maxHours,
    source: resolved.source,
    customerType: resolved.customerType,
    options,
    policySnapshot: resolved.policy,
    memberGrade: grade,
    memberGradeBenefit: benefit,
    rates,
  };
}

/** 실제 소요 시간으로 달성한 EXPRESS 등급 (빠른 순) */
export function achievedExpressTier(elapsedMs: number): ExpressTier {
  const hours = Math.max(0, elapsedMs) / 3_600_000;
  for (const tier of EXPRESS_TIERS) {
    if (hours <= expressMaxHours(tier)) return tier;
  }
  return 'BASIC';
}

export function ratesForExpressTier(
  policy: HqExpressCustomerTypePolicy,
  benefit: MemberGradeExpressBenefit,
  tier: ExpressTier,
): ResolvedExpressRates | null {
  const base = baseRatesForTier(policy, tier);
  return resolveExpressRatesWithMemberGrade(base.feeUsdt, base.feePercent, benefit, tier);
}

export type ExpressSettlement = {
  promisedTier: ExpressTier;
  promisedFeeUsdt: number;
  actualTier: ExpressTier;
  settledFeeUsdt: number;
  slaMet: boolean;
  refundUsdt: number;
  elapsedHours: number;
};

export function settleExpressFee(input: {
  promisedTier: string | null | undefined;
  promisedFeeUsdt: number | null | undefined;
  policySnapshot: unknown;
  memberGradeBenefitSnapshot?: unknown;
  grossUsdt?: number | null;
  startedAt: Date;
  completedAt: Date;
}): ExpressSettlement | null {
  const promisedTier = normalizeExpressTier(input.promisedTier);
  if (!promisedTier && (input.promisedFeeUsdt == null || Number(input.promisedFeeUsdt) <= 0)) {
    return null;
  }
  const tier = promisedTier ?? 'BASIC';
  const policy = normalizeExpressCustomerTypePolicy(input.policySnapshot);
  const benefit = normalizeMemberGradeBenefit(input.memberGradeBenefitSnapshot);
  const gross = Math.max(0, Number(input.grossUsdt) || 0);
  const promisedFee =
    input.promisedFeeUsdt != null && Number.isFinite(Number(input.promisedFeeUsdt))
      ? Math.max(0, Number(input.promisedFeeUsdt))
      : (() => {
          const rates = ratesForExpressTier(policy, benefit, tier);
          return rates ? computeExpressFeeUsdt(rates, gross, benefit) : 0;
        })();
  const elapsedMs = Math.max(0, input.completedAt.getTime() - input.startedAt.getTime());
  const actualTier = achievedExpressTier(elapsedMs);
  const actualRates = ratesForExpressTier(policy, benefit, actualTier);
  const gradeActual = actualRates
    ? computeExpressFeeUsdt(actualRates, gross, benefit)
    : promisedFee;
  const slaMet =
    elapsedMs <= expressDeadlineAt(input.startedAt, tier).getTime() - input.startedAt.getTime();
  const effectiveSettled = slaMet ? promisedFee : Math.min(promisedFee, gradeActual);
  return {
    promisedTier: tier,
    promisedFeeUsdt: promisedFee,
    actualTier,
    settledFeeUsdt: effectiveSettled,
    slaMet,
    refundUsdt: Math.max(0, Number((promisedFee - effectiveSettled).toFixed(8))),
    elapsedHours: Number((elapsedMs / 3_600_000).toFixed(4)),
  };
}

export { expressDeadlineAt, defaultExpressPolicy, computeExpressFeeUsdt };
