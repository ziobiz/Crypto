import { CustomerType } from '@prisma/client';
import {
  DEFAULT_USDT_RISK_LIMIT_TIERS,
  SYMBOL_FEE_CURRENCIES,
  normalizeUsdtRiskLimitBand,
  normalizeUsdtRiskLimitCode,
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

export async function resolveUsdtRiskLimitForCustomer(
  customerProfileId?: string | null,
  options?: { riskSource?: UsdtRiskLimitSource },
): Promise<ResolvedUsdtRiskLimit> {
  const riskSource = options?.riskSource ?? 'live';
  const risk =
    riskSource === 'simulator'
      ? await getSimulatorCommissionRiskConfig()
      : await getCommissionRiskConfig();
  const tiers = risk.usdtRiskLimitTiers!;

  if (!customerProfileId) {
    const band = tiers.MR;
    return { code: 'MR', ...band };
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

  /** 개인 LIVE: 법인용으로 올린 MR min(1만 등)을 쓰지 않고 국가·통화 기준(≤1만 USD) 적용 */
  if (
    riskSource === 'live' &&
    profile?.customerType === CustomerType.INDIVIDUAL
  ) {
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
    /** 컨텍스트 실패 시에도 코드 기본값으로 안전하게 */
    const fallback = DEFAULT_USDT_RISK_LIMIT_TIERS[code] ?? DEFAULT_USDT_RISK_LIMIT_TIERS.MR;
    return { code, ...fallback, limitCountry: null, limitCountrySource: null };
  }

  return { code, ...liveBand };
}

/** 최소 한도: 경계값 포함 (amount >= min). 부동소수 오차만 허용 */
const LIMIT_EPS_USDT = 1e-6;
const LIMIT_EPS_FIAT = 1e-6;

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
 * USDT·법정화폐 1회 한도 검증 (고객 시뮬·LIVE·카드). 본사/운영자(프로필 없음)는 미적용.
 * 최소 한도는 경계값 포함(>=). HQ 법정화폐 최소는 fiatAmount 가 있으면 법정화폐로 직접 비교한다
 * (USDT 환산 후 net 비교로 100,000 JPY 가 100,001 부터만 통과하던 문제 방지).
 */
export async function validateUsdtRiskLimitAmount(input: {
  customerProfileId?: string | null;
  /** 희망 수령 또는 환산 기준 USDT */
  usdtAmount: number;
  /** false면 한도 미적용 (본사 시뮬 등) */
  enforce?: boolean;
  /** live=실제 매입, simulator=시뮬레이터 전용 한도표 */
  riskSource?: UsdtRiskLimitSource;
  /** 고객 안내용: 법정화폐 환산 표시 */
  fiatCurrency?: string | null;
  exchangeRate?: number | null;
  /**
   * 신청·견적 법정화폐 금액. 있으면 HQ perTransactionMin/Max 를 이 금액으로 포함 비교.
   * (입금액·requiredFiat·카드 환전 재원 등)
   */
  fiatAmount?: number | null;
  /** 이체/송금/카드 — HQ 법정화폐 한도 선택 */
  paymentMethod?: 'BANK_TRANSFER' | 'REMITTANCE' | 'CARD' | string | null;
}): Promise<ResolvedUsdtRiskLimit | null> {
  if (input.enforce === false || !input.customerProfileId) {
    return null;
  }

  let limit = await resolveUsdtRiskLimitForCustomer(input.customerProfileId, {
    riskSource: input.riskSource ?? 'live',
  });
  const amount = Number(input.usdtAmount) || 0;
  const fiatAmount = Number(input.fiatAmount);
  const hasFiat = Number.isFinite(fiatAmount) && fiatAmount > 0;

  if (amount <= 0) {
    throw new AppError(400, 'USDT 금액이 필요합니다', 'USDT_AMOUNT_REQUIRED');
  }

  const cur = String(input.fiatCurrency || '')
    .trim()
    .toUpperCase() as SymbolFeeCurrency;
  const rate = Number(input.exchangeRate) || 0;

  /** HQ 법정화폐 한도 — 금액이 있으면 법정화폐로 포함 비교 (환산 USDT 재비교 안 함) */
  if ((input.riskSource ?? 'live') === 'live') {
    if (rate > 0 && (SYMBOL_FEE_CURRENCIES as readonly string[]).includes(cur)) {
      const profile = await prisma.customerProfile.findUnique({
        where: { id: input.customerProfileId },
        select: { customerType: true },
      });
      if (profile) {
        const risk = await getCommissionRiskConfig();
        if (risk.riskEnabled) {
          const typeKey =
            profile.customerType === CustomerType.CORPORATE ? 'CORPORATE' : 'INDIVIDUAL';
          const method =
            input.paymentMethod === 'CARD'
              ? 'CARD'
              : input.paymentMethod === 'REMITTANCE'
                ? 'REMITTANCE'
                : 'BANK_TRANSFER';
          const fiatBand =
            (risk.methodTransactionLimits?.[method] ?? risk.transactionLimits)[typeKey][cur];

          if (hasFiat) {
            const codeOverride = method === 'CARD' ? 'CARD' : null;
            if (
              fiatBand.perTransactionMin > 0 &&
              fiatAmount + LIMIT_EPS_FIAT < fiatBand.perTransactionMin
            ) {
              const minUsdt = fiatBand.perTransactionMin / rate;
              throwUsdtRiskMin(limit, minUsdt, rate, cur, codeOverride);
            }
            if (
              fiatBand.perTransactionMax > 0 &&
              fiatAmount - LIMIT_EPS_FIAT > fiatBand.perTransactionMax
            ) {
              const maxUsdt = fiatBand.perTransactionMax / rate;
              throwUsdtRiskMax(limit, maxUsdt, rate, cur, codeOverride);
            }
          } else {
            /** fiat 미전달 시(레거시) 환산 USDT로 포함 비교 — 호출측에서 fiatAmount 전달 권장 */
            if (fiatBand.perTransactionMax > 0) {
              const maxFromHq = fiatBand.perTransactionMax / rate;
              if (limit.maxUsdt <= 0 || maxFromHq + LIMIT_EPS_USDT < limit.maxUsdt) {
                limit = { ...limit, maxUsdt: maxFromHq };
              }
            }
            if (fiatBand.perTransactionMin > 0) {
              const minFromHq = fiatBand.perTransactionMin / rate;
              if (minFromHq > limit.minUsdt) {
                limit = { ...limit, minUsdt: minFromHq };
              }
            }
          }
        }
      }
    }
  }

  /**
   * 카드결제는 리스크관리「카드」탭 법정화폐 한도만 적용.
   * USDT 티어(MR 등)는 이체·송금에만 추가 적용 — 카드 최소(예: 60,000 JPY)가
   * 티어 환산(예: 약 100,000 JPY)에 가로막히지 않도록 한다.
   */
  if (input.paymentMethod === 'CARD') {
    return limit;
  }

  /** USDT 리스크 티어 한도 — 경계 포함 (>= min, <= max) */
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
