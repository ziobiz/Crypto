import type { HqCommissionRiskConfig, SymbolFeeCurrency, SymbolFeeTierRow } from '@/lib/api';

export const FEE_CURRENCIES: SymbolFeeCurrency[] = ['KRW', 'JPY', 'THB', 'CNY', 'USD'];

export function newTierId() {
  return `tier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultTierForCurrency(
  currency: SymbolFeeCurrency,
  risk: HqCommissionRiskConfig,
): SymbolFeeTierRow {
  return {
    id: newTierId(),
    currency,
    maxAmount: currency === 'KRW' ? 1_000_000 : currency === 'JPY' ? 100_000 : 10_000,
    fxFeeMode: risk.defaultFxFeeMode ?? 'percent',
    fxFeePercent: risk.defaultFxFeePercent,
    fxFeeUsdt: risk.defaultFxFeeUsdt ?? 0,
    gasFeeMode: risk.defaultGasFeeMode ?? 'fixed',
    gasFeePercent: risk.defaultGasFeePercent ?? 0,
    gasFeeUsdt: risk.defaultGasFeeUsdt,
    transferFeeMode: risk.defaultTransferFeeMode ?? 'fixed',
    transferFeePercent: risk.defaultTransferFeePercent ?? 0,
    transferFeeUsdt: risk.defaultTransferFeeUsdt,
    otherFeeMode: risk.defaultOtherFeeMode ?? 'fixed',
    otherFeePercent: risk.defaultOtherFeePercent ?? 0,
    otherFeeUsdt: risk.defaultOtherFeeUsdt,
  };
}

export function sortedTierIds(currency: SymbolFeeCurrency, tiers: SymbolFeeTierRow[]) {
  return tiers
    .filter((row) => row.currency === currency)
    .sort((a, b) => a.maxAmount - b.maxAmount)
    .map((row) => row.id);
}
