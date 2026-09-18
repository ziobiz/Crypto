import {
  normalizeUsdtRiskLimitBand,
  normalizeUsdtRiskLimitCode,
  type UsdtRiskLimitBand,
  type UsdtRiskLimitCode,
} from '../constants/hq-policy';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { getCommissionRiskConfig } from './transaction-fee.service';

export type ResolvedUsdtRiskLimit = UsdtRiskLimitBand & {
  code: UsdtRiskLimitCode;
};

export async function resolveUsdtRiskLimitForCustomer(
  customerProfileId?: string | null,
): Promise<ResolvedUsdtRiskLimit> {
  const risk = await getCommissionRiskConfig();
  const tiers = risk.usdtRiskLimitTiers!;

  if (!customerProfileId) {
    const band = tiers.MR;
    return { code: 'MR', ...band };
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: {
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

  return { code, ...tiers[code] };
}

/** USDT 기준 1회 한도 검증 (고객 시뮬·LIVE·카드). 본사/운영자(프로필 없음)는 미적용 */
export async function validateUsdtRiskLimitAmount(input: {
  customerProfileId?: string | null;
  /** 희망 수령 또는 환산 기준 USDT */
  usdtAmount: number;
  /** false면 한도 미적용 (본사 시뮬 등) */
  enforce?: boolean;
  /** 고객 안내용: 법정화폐 환산 표시 */
  fiatCurrency?: string | null;
  exchangeRate?: number | null;
}): Promise<ResolvedUsdtRiskLimit | null> {
  if (input.enforce === false || !input.customerProfileId) {
    return null;
  }

  const limit = await resolveUsdtRiskLimitForCustomer(input.customerProfileId);
  const amount = Number(input.usdtAmount) || 0;

  if (amount <= 0) {
    throw new AppError(400, 'USDT 금액이 필요합니다', 'USDT_AMOUNT_REQUIRED');
  }

  if (limit.minUsdt > 0 && amount + 1e-9 < limit.minUsdt) {
    const rate = Number(input.exchangeRate) || 0;
    const cur = String(input.fiatCurrency || '').trim().toUpperCase();
    const body =
      rate > 0 && cur
        ? `1회 최소 한도 기준은 ${limit.minUsdt.toLocaleString()} USDT 상당입니다 (약 ${(
            Math.round(limit.minUsdt * rate)
          ).toLocaleString()} ${cur} · ${limit.code})`
        : `1회 최소 한도 기준은 ${limit.minUsdt.toLocaleString()} USDT 상당의 통화 금액입니다 (${limit.code})`;
    throw new AppError(400, body, 'USDT_RISK_MIN');
  }
  if (limit.maxUsdt > 0 && amount - 1e-9 > limit.maxUsdt) {
    const rate = Number(input.exchangeRate) || 0;
    const cur = String(input.fiatCurrency || '').trim().toUpperCase();
    const body =
      rate > 0 && cur
        ? `1회 최대 한도 기준은 ${limit.maxUsdt.toLocaleString()} USDT 상당입니다 (약 ${(
            Math.round(limit.maxUsdt * rate)
          ).toLocaleString()} ${cur} · ${limit.code})`
        : `1회 최대 한도 기준은 ${limit.maxUsdt.toLocaleString()} USDT 상당의 통화 금액입니다 (${limit.code})`;
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
