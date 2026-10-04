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

/** USDT 기준 1회 한도 검증 (고객 시뮬·LIVE·카드). 본사/운영자(프로필 없음)는 미적용 */
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
}): Promise<ResolvedUsdtRiskLimit | null> {
  if (input.enforce === false || !input.customerProfileId) {
    return null;
  }

  let limit = await resolveUsdtRiskLimitForCustomer(input.customerProfileId, {
    riskSource: input.riskSource ?? 'live',
  });
  const amount = Number(input.usdtAmount) || 0;

  if (amount <= 0) {
    throw new AppError(400, 'USDT 금액이 필요합니다', 'USDT_AMOUNT_REQUIRED');
  }

  /** 한도 설정(transactionLimits) ↔ 신청 금액 USDT 연동 */
  if ((input.riskSource ?? 'live') === 'live') {
    const cur = String(input.fiatCurrency || '')
      .trim()
      .toUpperCase() as SymbolFeeCurrency;
    const rate = Number(input.exchangeRate) || 0;
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
          const fiatBand = risk.transactionLimits[typeKey][cur];
          if (fiatBand.perTransactionMax > 0) {
            const maxFromHq = fiatBand.perTransactionMax / rate;
            if (limit.maxUsdt <= 0 || maxFromHq + 1e-9 < limit.maxUsdt) {
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

  if (limit.minUsdt > 0 && amount + 1e-9 < limit.minUsdt) {
    const rate = Number(input.exchangeRate) || 0;
    const cur = String(input.fiatCurrency || '').trim().toUpperCase();
    const countryHint = limit.limitCountry ? ` · ${limit.limitCountry}` : '';
    const body =
      rate > 0 && cur
        ? `1회 최소 한도 기준은 ${limit.minUsdt.toLocaleString()} USDT 상당입니다 (약 ${(
            Math.round(limit.minUsdt * rate)
          ).toLocaleString()} ${cur} · ${limit.code}${countryHint})`
        : `1회 최소 한도 기준은 ${limit.minUsdt.toLocaleString()} USDT 상당의 통화 금액입니다 (${limit.code}${countryHint})`;
    throw new AppError(400, body, 'USDT_RISK_MIN');
  }
  if (limit.maxUsdt > 0 && amount - 1e-9 > limit.maxUsdt) {
    const rate = Number(input.exchangeRate) || 0;
    const cur = String(input.fiatCurrency || '').trim().toUpperCase();
    const countryHint = limit.limitCountry ? ` · ${limit.limitCountry}` : '';
    const body =
      rate > 0 && cur
        ? `1회 최대 한도 기준은 ${limit.maxUsdt.toLocaleString()} USDT 상당입니다 (약 ${(
            Math.round(limit.maxUsdt * rate)
          ).toLocaleString()} ${cur} · ${limit.code}${countryHint})`
        : `1회 최대 한도 기준은 ${limit.maxUsdt.toLocaleString()} USDT 상당의 통화 금액입니다 (${limit.code}${countryHint})`;
    throw new AppError(400, body, 'USDT_RISK_MAX');
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
