import { CustomerType } from '@prisma/client';
import {
  DEFAULT_INDIVIDUAL_USDT_RISK_LIMIT_TIERS,
  isRiskEnabledForCustomerType,
  normalizeUsdtRiskLimitBand,
  normalizeUsdtRiskLimitCode,
  resolveUsdtRiskLimitTiersForCustomerType,
  type CustomerTypeLimitKey,
  type SymbolFeeCurrency,
  type UsdtRiskLimitBand,
  type UsdtRiskLimitCode,
} from '../constants/hq-policy';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  applyIndividualLiveRiskBand,
  resolveCustomerIndividualLimitContext,
} from './individual-limit.service';
import {
  getCommissionRiskConfig,
  getSimulatorCommissionRiskConfig,
} from './transaction-fee.service';

export type ResolvedUsdtRiskLimit = UsdtRiskLimitBand & {
  code: UsdtRiskLimitCode;
  /** 개인 LIVE 한도 산정 국가 (있으면) */
  limitCountry?: string | null;
  limitCountrySource?: string | null;
};

export type UsdtRiskLimitSource = 'live' | 'simulator';

function typeKeyOf(customerType?: CustomerType | null): CustomerTypeLimitKey {
  return customerType === CustomerType.CORPORATE ? 'CORPORATE' : 'INDIVIDUAL';
}

export async function resolveUsdtRiskLimitForCustomer(
  customerProfileId?: string | null,
  options?: { riskSource?: UsdtRiskLimitSource },
): Promise<ResolvedUsdtRiskLimit> {
  const riskSource = options?.riskSource ?? 'live';
  const risk =
    riskSource === 'simulator'
      ? await getSimulatorCommissionRiskConfig()
      : await getCommissionRiskConfig();

  if (!customerProfileId) {
    const tiers = resolveUsdtRiskLimitTiersForCustomerType(risk, 'CORPORATE');
    return { code: 'MR', ...tiers.MR };
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: {
      customerType: true,
      usdtRiskLimitCode: true,
      usdtLimitMinUsdt: true,
      usdtLimitMaxUsdt: true,
    },
  });

  const typeKey = typeKeyOf(profile?.customerType);
  const tiers = resolveUsdtRiskLimitTiersForCustomerType(risk, typeKey);

  const code = normalizeUsdtRiskLimitCode(profile?.usdtRiskLimitCode);
  if (code === 'ML') {
    return {
      code: 'ML',
      ...normalizeUsdtRiskLimitBand({
        minUsdt: profile?.usdtLimitMinUsdt ?? 0,
        maxUsdt: profile?.usdtLimitMaxUsdt ?? 0,
      }),
    };
  }

  const liveBand = tiers[code];

  /** 개인 LIVE: 국가 상한으로 티어 상한을 한 번 더 클램프 */
  if (riskSource === 'live' && profile?.customerType === CustomerType.INDIVIDUAL) {
    const ctx = await resolveCustomerIndividualLimitContext(customerProfileId);
    if (ctx) {
      const adjusted = applyIndividualLiveRiskBand({
        code,
        liveMinUsdt: liveBand.minUsdt,
        liveMaxUsdt: liveBand.maxUsdt,
        countryBand: ctx.band,
      });
      return {
        code,
        ...adjusted,
        limitCountry: ctx.country,
        limitCountrySource: ctx.source,
      };
    }
    const fallback =
      DEFAULT_INDIVIDUAL_USDT_RISK_LIMIT_TIERS[code] ??
      DEFAULT_INDIVIDUAL_USDT_RISK_LIMIT_TIERS.MR;
    return { code, ...fallback, limitCountry: null, limitCountrySource: null };
  }

  return { code, ...liveBand };
}

/** 최소 한도: 경계값 포함 (amount >= min). 부동소수 오차만 허용 */
const LIMIT_EPS_USDT = 1e-6;

function throwUsdtRiskMin(
  limit: ResolvedUsdtRiskLimit,
  minUsdt: number,
  rate: number,
  cur: string,
  codeOverride?: string | null,
): never {
  const code = codeOverride || limit.code;
  const countryHint =
    codeOverride === 'CARD' ? '' : limit.limitCountry ? ` · ${limit.limitCountry}` : '';
  const fiatApprox = rate > 0 && cur ? Math.round(minUsdt * rate) : 0;
  const body =
    fiatApprox > 0
      ? `1회 최소 한도 기준은 ${minUsdt.toLocaleString()} USDT 상당입니다 (약 ${fiatApprox.toLocaleString()} ${cur} · ${code}${countryHint})`
      : `1회 최소 한도 기준은 ${minUsdt.toLocaleString()} USDT 상당의 통화 금액입니다 (${code}${countryHint})`;
  throw new AppError(400, body, 'USDT_RISK_MIN', {
    minUsdt,
    fiatApprox,
    currency: cur,
    limitCode: code,
    country: countryHint,
  });
}

function throwUsdtRiskMax(
  limit: ResolvedUsdtRiskLimit,
  maxUsdt: number,
  rate: number,
  cur: string,
  codeOverride?: string | null,
): never {
  const code = codeOverride || limit.code;
  const countryHint =
    codeOverride === 'CARD' ? '' : limit.limitCountry ? ` · ${limit.limitCountry}` : '';
  const fiatApprox = rate > 0 && cur ? Math.round(maxUsdt * rate) : 0;
  const body =
    fiatApprox > 0
      ? `1회 최대 한도 기준은 ${maxUsdt.toLocaleString()} USDT 상당입니다 (약 ${fiatApprox.toLocaleString()} ${cur} · ${code}${countryHint})`
      : `1회 최대 한도 기준은 ${maxUsdt.toLocaleString()} USDT 상당의 통화 금액입니다 (${code}${countryHint})`;
  throw new AppError(400, body, 'USDT_RISK_MAX', {
    maxUsdt,
    fiatApprox,
    currency: cur,
    limitCode: code,
    country: countryHint,
  });
}

/**
 * 크립토 리스크 티어 1회 한도 (리스크 활성 + 이체/송금만).
 * FIAT 한도(한도 설정)는 validateCustomerTransactionAmount 가 담당 — 여기서 중복 검사하지 않음.
 * 카드는 티어 미적용(한도 설정의 카드 FIAT만).
 */
export async function validateUsdtRiskLimitAmount(input: {
  customerProfileId?: string | null;
  /** 희망 수령 또는 환산 기준 USDT/USDC */
  usdtAmount: number;
  /** false면 한도 미적용 (본사 시뮬 등) */
  enforce?: boolean;
  /** live=실제 매입, simulator=시뮬레이터 전용 한도표 */
  riskSource?: UsdtRiskLimitSource;
  /** 고객 안내용: 법정화폐 환산 표시 */
  fiatCurrency?: string | null;
  exchangeRate?: number | null;
  fiatAmount?: number | null;
  paymentMethod?: 'BANK_TRANSFER' | 'REMITTANCE' | 'CARD' | string | null;
}): Promise<ResolvedUsdtRiskLimit | null> {
  if (input.enforce === false || !input.customerProfileId) {
    return null;
  }

  /** 카드: 크립토 티어 미적용 */
  if (input.paymentMethod === 'CARD') {
    return null;
  }

  const riskSource = input.riskSource ?? 'live';
  const risk =
    riskSource === 'simulator'
      ? await getSimulatorCommissionRiskConfig()
      : await getCommissionRiskConfig();

  const profile = await prisma.customerProfile.findUnique({
    where: { id: input.customerProfileId },
    select: { customerType: true },
  });
  const typeKey = typeKeyOf(profile?.customerType);

  /** 해당 고객유형 리스크 비활성 → 티어·건수 미적용 (FIAT 한도 설정은 별도 경로) */
  if (!isRiskEnabledForCustomerType(risk, typeKey)) {
    return null;
  }

  const limit = await resolveUsdtRiskLimitForCustomer(input.customerProfileId, {
    riskSource,
  });
  const amount = Number(input.usdtAmount) || 0;

  if (amount <= 0) {
    throw new AppError(400, 'USDT 금액이 필요합니다', 'USDT_AMOUNT_REQUIRED');
  }

  const cur = String(input.fiatCurrency || '')
    .trim()
    .toUpperCase() as SymbolFeeCurrency;
  const rate = Number(input.exchangeRate) || 0;

  if (limit.minUsdt > 0 && amount + LIMIT_EPS_USDT < limit.minUsdt) {
    throwUsdtRiskMin(limit, limit.minUsdt, rate, cur);
  }
  if (limit.maxUsdt > 0 && amount - LIMIT_EPS_USDT > limit.maxUsdt) {
    throwUsdtRiskMax(limit, limit.maxUsdt, rate, cur);
  }
  return limit;
}

export function fiatRangeFromUsdt(
  usdt: number,
  rate: number,
  pct: number,
): { low: number; mid: number; high: number } {
  const mid = usdt * rate;
  const delta = mid * (pct / 100);
  return { low: Math.max(0, mid - delta), mid, high: mid + delta };
}

export function usdtRangeFromFiat(
  fiat: number,
  rate: number,
  pct: number,
): { low: number; mid: number; high: number } {
  const mid = rate > 0 ? fiat / rate : 0;
  const delta = mid * (pct / 100);
  return { low: Math.max(0, mid - delta), mid, high: mid + delta };
}
