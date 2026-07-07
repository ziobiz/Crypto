import type { TransactionFees } from '../constants/hq-policy';
import {
  computeFeeAmounts,
  fixedFeeSum,
  percentMultiplierSum,
} from '../lib/fee-component';
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
  netUsdt: number;
  requiredFiat: number;
  fairExchangeRate?: number;
  localPremiumCurrency?: LocalPremiumCurrency;
};

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
  const netUsdt = Math.max(
    0,
    Number(
      (grossUsdt - amounts.fxFeeUsdt - amounts.gasFeeUsdt - amounts.transferFeeUsdt - otherTotal).toFixed(8),
    ),
  );
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
    netUsdt,
    requiredFiat: Number(fiatAmount.toFixed(2)),
    fairExchangeRate: fees.fairExchangeRate,
    localPremiumCurrency: fees.localPremiumCurrency,
  };
}

export function breakdownFromTarget(
  targetUsdt: number,
  exchangeRate: number,
  fees: ResolvedTransactionFees,
): UsdtFeeBreakdownDetail {
  const premiumPct = fees.localPremiumPercent ?? fees.kimchiPremiumPercent ?? 0;
  const pctSum = percentMultiplierSum(fees, premiumPct);
  const fixed = fixedFeeSum(fees);
  const denom = 1 - pctSum / 100;
  const grossUsdt = denom > 0 ? (targetUsdt + fixed) / denom : targetUsdt + fixed;
  return breakdownFromFiat(grossUsdt * exchangeRate, exchangeRate, {
    ...fees,
    baseOtherFeeUsdt: computeFeeAmounts(grossUsdt, fees).otherFeeUsdt,
  });
}

export async function resolveFeesForPurchase(
  wallet: WalletFeeSource,
  currency: string,
  fiatAmount: number,
  exchangeRate: number,
): Promise<ResolvedTransactionFees> {
  const base = await resolveFeesForAmount(wallet, currency, fiatAmount);
  if (!isLocalPremiumCurrency(currency)) return base;

  const premium = await getLocalMarketPremiumAnalysis(currency);
  const grossUsdt = fiatAmount > 0 && exchangeRate > 0 ? fiatAmount / exchangeRate : 0;
  return withLocalPremium(base, premium, grossUsdt);
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
