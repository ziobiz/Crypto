import type { FeeMode, TransactionFees } from '@/lib/api';

export type FeeComponentKey = 'fx' | 'gas' | 'transfer' | 'other';

const FEE_KEYS: FeeComponentKey[] = ['fx', 'gas', 'transfer', 'other'];

export function feeModeField(key: FeeComponentKey): keyof TransactionFees {
  return `${key}FeeMode` as keyof TransactionFees;
}

export function feePercentField(key: FeeComponentKey): keyof TransactionFees {
  return `${key}FeePercent` as keyof TransactionFees;
}

export function feeFixedField(key: FeeComponentKey): keyof TransactionFees {
  return `${key}FeeUsdt` as keyof TransactionFees;
}

export function normalizeFeeMode(value: unknown, fallback: FeeMode): FeeMode {
  return value === 'percent' || value === 'fixed' ? value : fallback;
}

export function computeFeeUsdt(
  grossUsdt: number,
  mode: FeeMode,
  percent: number,
  fixedUsdt: number,
): number {
  if (mode === 'percent') {
    return Number(((grossUsdt * percent) / 100).toFixed(8));
  }
  return Number(fixedUsdt.toFixed(8));
}

export function formatFeeRateLabel(mode: FeeMode, percent: number, fixedUsdt: number): string {
  return mode === 'percent' ? `${percent}%` : `${fixedUsdt} USDT`;
}

export function readFeeComponent(fees: Partial<TransactionFees>, key: FeeComponentKey) {
  const mode = (fees[feeModeField(key)] as FeeMode | undefined) ??
    (key === 'fx' ? 'percent' : 'fixed');
  const percent = Number(fees[feePercentField(key)]) || 0;
  const fixedUsdt = Number(fees[feeFixedField(key)]) || 0;
  return { mode, percent, fixedUsdt };
}

export function formatFeeComponentLabel(fees: Partial<TransactionFees>, key: FeeComponentKey): string {
  const { mode, percent, fixedUsdt } = readFeeComponent(fees, key);
  return formatFeeRateLabel(mode, percent, fixedUsdt);
}

export function percentMultiplierSum(fees: Partial<TransactionFees>, extraPercent = 0): number {
  let sum = extraPercent;
  for (const key of FEE_KEYS) {
    const { mode, percent } = readFeeComponent(fees, key);
    if (mode === 'percent') sum += percent;
  }
  return sum;
}

export function fixedFeeSum(fees: Partial<TransactionFees>): number {
  let sum = 0;
  for (const key of FEE_KEYS) {
    const { mode, fixedUsdt } = readFeeComponent(fees, key);
    if (mode === 'fixed') sum += fixedUsdt;
  }
  return sum;
}
