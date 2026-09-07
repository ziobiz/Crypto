import type { TransactionFees } from '../constants/hq-policy';
import {
  computeOperatingFeeUsdt,
  HQ_CONFIG_KEYS,
  normalizeCustomerFeeShare,
  normalizeOrgSharePolicy,
  type HqOrgSharePolicy,
} from '../constants/hq-policy';
import {
  applyCurrencyAmount,
  defaultCurrencyAmountDisplayPolicy,
  normalizeCurrencyAmountDisplayPolicy,
  resolveCurrencyAmountRule,
  type HqCurrencyAmountDisplayPolicy,
} from '../lib/currency-amount';
import {
  computeFeeAmounts,
  fixedFeeSum,
  percentMultiplierSum,
} from '../lib/fee-component';
import { prisma } from '../lib/prisma';
import {
  getLocalMarketPremiumAnalysis,
  isLocalPremiumCurrency,
  localPremiumFeeUsdt,
  type LocalMarketPremiumAnalysis,
  type LocalPremiumCurrency,
} from './local-market-premium.service';
import { resolveFeesForAmount } from './transaction-fee.service';

type WalletFeeSource = {
  fxFeePercent?: unknown;
  gasFeeAmount: unknown;
  transferFeeAmount?: unknown;
  otherFeeAmount?: unknown;
  platformFeeAmount?: unknown;
  network?: unknown;
};

export type ResolvedTransactionFees = TransactionFees & {
  kimchiPremiumPercent?: number;
  kimchiPremiumFeeUsdt?: number;
  localPremiumPercent?: number;
  localPremiumFeeUsdt?: number;
  localPremiumCurrency?: LocalPremiumCurrency;
  baseOtherFeeUsdt?: number;
  fairExchangeRate?: number;
  domesticExchangeRate?: number;
  /** 운영수수료 % (배분 풀 · 플랫폼 수익) */
  operatingFeePercent?: number;
  /** 운영수수료 고정 USDT */
  operatingFeeFixedUsdt?: number;
};

export type UsdtFeeBreakdownDetail = {
  targetUsdt: number;
  grossUsdt: number;
  fxFeeUsdt: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
  baseOtherFeeUsdt: number;
  localPremiumFeeUsdt: number;
  localPremiumPercent: number;
  kimchiPremiumFeeUsdt: number;
  kimchiPremiumPercent: number;
  operatingFeeUsdt: number;
  netUsdt: number;
  requiredFiat: number;
  fairExchangeRate?: number;
  localPremiumCurrency?: LocalPremiumCurrency;
};

let cachedAmountPolicy: { at: number; policy: HqCurrencyAmountDisplayPolicy } | null = null;
const AMOUNT_POLICY_TTL_MS = 15_000;

export async function getCurrencyAmountDisplayPolicy(): Promise<HqCurrencyAmountDisplayPolicy> {
  if (cachedAmountPolicy && Date.now() - cachedAmountPolicy.at < AMOUNT_POLICY_TTL_MS) {
    return cachedAmountPolicy.policy;
  }
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.currencyAmountDisplay },
  });
  const policy = normalizeCurrencyAmountDisplayPolicy(
    (row?.value as Partial<HqCurrencyAmountDisplayPolicy> | null) ??
      defaultCurrencyAmountDisplayPolicy(),
  );
  cachedAmountPolicy = { at: Date.now(), policy };
  return policy;
}

export function clearCurrencyAmountDisplayPolicyCache() {
  cachedAmountPolicy = null;
}

/**
 * 법정화폐 표시 규칙 적용.
 * - 기본: 입금액 기준으로 도식 재계산
 * - preserveTargetNet: 「받을 USDT」역추산 — 입금을 올려 실수령 ≥ 목표 보장 (본사 손해 방지, 절상·상향)
 */
export function finalizeFiatBreakdown(
  currency: string,
  detail: UsdtFeeBreakdownDetail,
  exchangeRate: number,
  fees: ResolvedTransactionFees,
  policy: HqCurrencyAmountDisplayPolicy,
  options?: { preserveTargetNet?: boolean },
): UsdtFeeBreakdownDetail {
  const rule = resolveCurrencyAmountRule(policy, currency);
  const step = Number((10 ** -Math.max(0, rule.decimals)).toFixed(Math.max(0, rule.decimals)));
  let fiat = applyCurrencyAmount(detail.requiredFiat, currency, policy);

  if (!options?.preserveTargetNet) {
    if (Math.abs(fiat - detail.requiredFiat) < 1e-12) {
      return { ...detail, requiredFiat: fiat };
    }
    return breakdownFromFiat(fiat, exchangeRate, fees);
  }

  const want = detail.targetUsdt;
  let next = breakdownFromFiat(fiat, exchangeRate, fees);
  let guard = 0;
  while (want > 0 && next.netUsdt + 1e-10 < want && guard < 100_000) {
    fiat = Number((fiat + (step || 1)).toFixed(Math.max(0, rule.decimals)));
    next = breakdownFromFiat(fiat, exchangeRate, fees);
    guard += 1;
  }
  return {
    ...next,
    targetUsdt: want,
    requiredFiat: fiat,
  };
}

function withLocalPremium(
  base: TransactionFees,
  premium: LocalMarketPremiumAnalysis,
  grossUsdt: number,
): ResolvedTransactionFees {
  const amounts = computeFeeAmounts(grossUsdt, base);
  const premiumFee = localPremiumFeeUsdt(grossUsdt, premium.premiumPercent);
  return {
    ...base,
    baseOtherFeeUsdt: amounts.otherFeeUsdt,
    localPremiumPercent: premium.premiumPercent,
    localPremiumFeeUsdt: premiumFee,
    localPremiumCurrency: premium.currency,
    kimchiPremiumPercent: premium.premiumPercent,
    kimchiPremiumFeeUsdt: premiumFee,
    fairExchangeRate: premium.fairRate,
    domesticExchangeRate: premium.domesticRate,
  };
}

export function breakdownFromFiat(
  fiatAmount: number,
  exchangeRate: number,
  fees: ResolvedTransactionFees,
): UsdtFeeBreakdownDetail {
  const grossUsdt = exchangeRate > 0 ? fiatAmount / exchangeRate : 0;
  const amounts = computeFeeAmounts(grossUsdt, fees);
  const baseOther = fees.baseOtherFeeUsdt ?? amounts.otherFeeUsdt;
  const premiumPct = fees.localPremiumPercent ?? fees.kimchiPremiumPercent ?? 0;
  const premiumFee =
    fees.localPremiumFeeUsdt ??
    fees.kimchiPremiumFeeUsdt ??
    localPremiumFeeUsdt(grossUsdt, premiumPct);
  const otherTotal = baseOther + premiumFee;
  const operatingFeeUsdt = computeOperatingFeeUsdt(
    grossUsdt,
    fees.operatingFeePercent ?? 0,
    fees.operatingFeeFixedUsdt ?? 0,
  );
  const rawNet =
    grossUsdt -
    amounts.fxFeeUsdt -
    amounts.gasFeeUsdt -
    amounts.transferFeeUsdt -
    otherTotal -
    operatingFeeUsdt;
  const netUsdt = Math.max(0, Number(rawNet.toFixed(8)));
  return {
    targetUsdt: netUsdt,
    grossUsdt: Number(grossUsdt.toFixed(8)),
    fxFeeUsdt: amounts.fxFeeUsdt,
    gasFeeUsdt: amounts.gasFeeUsdt,
    transferFeeUsdt: amounts.transferFeeUsdt,
    otherFeeUsdt: Number(otherTotal.toFixed(8)),
    baseOtherFeeUsdt: baseOther,
    localPremiumFeeUsdt: premiumFee,
    localPremiumPercent: premiumPct,
    kimchiPremiumFeeUsdt: premiumFee,
    kimchiPremiumPercent: premiumPct,
    operatingFeeUsdt,
    netUsdt,
    requiredFiat: Number(fiatAmount),
    fairExchangeRate: fees.fairExchangeRate,
    localPremiumCurrency: fees.localPremiumCurrency,
  };
}

/** 입금액으로 환산한 실수령이 0 이하(고정 수수료 > 환산액)인지 */
export function isDepositBelowFees(detail: UsdtFeeBreakdownDetail): boolean {
  if (!(detail.grossUsdt > 0)) return false;
  return detail.netUsdt <= 1e-8;
}

/** 실수령 최소 USDT를 맞추기 위한 입금 하한(통화 절상 반영) */
export function minFiatForNetUsdt(
  minNetUsdt: number,
  exchangeRate: number,
  fees: ResolvedTransactionFees,
  currency: string,
  policy: HqCurrencyAmountDisplayPolicy,
): number {
  const want = Math.max(minNetUsdt, 0.01);
  const base = breakdownFromTarget(want, exchangeRate, fees);
  return finalizeFiatBreakdown(currency, base, exchangeRate, fees, policy, {
    preserveTargetNet: true,
  }).requiredFiat;
}

function finiteNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function breakdownFromTarget(
  targetUsdt: number,
  exchangeRate: number,
  fees: ResolvedTransactionFees,
): UsdtFeeBreakdownDetail {
  const want = finiteNum(targetUsdt);
  const rate = finiteNum(exchangeRate);
  const premiumPct = finiteNum(fees.localPremiumPercent ?? fees.kimchiPremiumPercent ?? 0);
  const opPct = finiteNum(fees.operatingFeePercent);
  const opFixed = finiteNum(fees.operatingFeeFixedUsdt);
  const pctSum = finiteNum(percentMultiplierSum(fees, premiumPct) + opPct);
  const fixed = finiteNum(fixedFeeSum(fees) + opFixed);
  const denom = 1 - pctSum / 100;
  if (!(denom > 0.0001) || !(rate > 0) || want <= 0) {
    return breakdownFromFiat(0, rate, {
      ...fees,
      localPremiumPercent: premiumPct,
      kimchiPremiumPercent: premiumPct,
    });
  }
  const grossUsdt = (want + fixed) / denom;
  const fiat = finiteNum(grossUsdt * rate);
  const detail = breakdownFromFiat(fiat, rate, {
    ...fees,
    localPremiumPercent: premiumPct,
    kimchiPremiumPercent: premiumPct,
    baseOtherFeeUsdt: computeFeeAmounts(grossUsdt, fees).otherFeeUsdt,
  });
  return {
    ...detail,
    targetUsdt: want,
    netUsdt: finiteNum(detail.netUsdt),
    requiredFiat: finiteNum(detail.requiredFiat),
    grossUsdt: finiteNum(detail.grossUsdt),
  };
}

async function loadOperatingFeeRates(feeShareRaw?: unknown): Promise<{
  operatingFeePercent: number;
  operatingFeeFixedUsdt: number;
}> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.orgShare },
  });
  const policy = normalizeOrgSharePolicy((row?.value as HqOrgSharePolicy | null) ?? null);
  const share = normalizeCustomerFeeShare(feeShareRaw ?? null, policy);
  return {
    operatingFeePercent: share.usdtOperatingFeePercent,
    operatingFeeFixedUsdt: share.usdtOperatingFeeUsdt,
  };
}

export function withOperatingFeeRates(
  fees: ResolvedTransactionFees,
  rates: { operatingFeePercent: number; operatingFeeFixedUsdt: number },
): ResolvedTransactionFees {
  return {
    ...fees,
    operatingFeePercent: rates.operatingFeePercent,
    operatingFeeFixedUsdt: rates.operatingFeeFixedUsdt,
  };
}

export async function resolveFeesForPurchase(
  wallet: WalletFeeSource,
  currency: string,
  fiatAmount: number,
  exchangeRate: number,
  options?: {
    feePolicy?: import('./transaction-fee.service').FeePolicyScope;
    feeShare?: unknown;
  },
): Promise<ResolvedTransactionFees> {
  const base = await resolveFeesForAmount(wallet, currency, fiatAmount, options);
  const op = await loadOperatingFeeRates(options?.feeShare);
  let fees: ResolvedTransactionFees = withOperatingFeeRates(base, op);
  if (!isLocalPremiumCurrency(currency)) return fees;

  try {
    const premium = await getLocalMarketPremiumAnalysis(currency);
    const grossUsdt = fiatAmount > 0 && exchangeRate > 0 ? fiatAmount / exchangeRate : 0;
    return withOperatingFeeRates(withLocalPremium(base, premium, grossUsdt), op);
  } catch {
    return fees;
  }
}

export async function getLocalPremiumContext(currency: LocalPremiumCurrency) {
  return getLocalMarketPremiumAnalysis(currency);
}

export async function getKimchiContextForKrw() {
  return getLocalMarketPremiumAnalysis('KRW');
}

export function applyLocalPremiumToBaseFees(
  base: TransactionFees,
  premium: LocalMarketPremiumAnalysis,
  grossUsdt: number,
): ResolvedTransactionFees {
  return withLocalPremium(base, premium, grossUsdt);
}

export function applyKimchiToBaseFees(
  base: TransactionFees,
  premium: LocalMarketPremiumAnalysis,
  grossUsdt: number,
): ResolvedTransactionFees {
  return withLocalPremium(base, premium, grossUsdt);
}
