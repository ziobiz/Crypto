import type { FeeMode, TransactionFees } from '../constants/hq-policy';

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

export function readFeeComponent(fees: TransactionFees, key: FeeComponentKey) {
  const mode = fees[feeModeField(key)] as FeeMode;
  const percent = Number(fees[feePercentField(key)]) || 0;
  const fixedUsdt = Number(fees[feeFixedField(key)]) || 0;
  return { mode, percent, fixedUsdt };
}

export function computeFeeAmounts(
  grossUsdt: number,
  fees: TransactionFees,
): Record<`${FeeComponentKey}FeeUsdt`, number> {
  const out = {} as Record<`${FeeComponentKey}FeeUsdt`, number>;
  for (const key of FEE_KEYS) {
    const { mode, percent, fixedUsdt } = readFeeComponent(fees, key);
    out[`${key}FeeUsdt`] = computeFeeUsdt(grossUsdt, mode, percent, fixedUsdt);
  }
  return out;
}

export function percentMultiplierSum(fees: TransactionFees, extraPercent = 0): number {
  let sum = extraPercent;
  for (const key of FEE_KEYS) {
    const { mode, percent } = readFeeComponent(fees, key);
    if (mode === 'percent') sum += percent;
  }
  return sum;
}

export function fixedFeeSum(fees: TransactionFees): number {
  let sum = 0;
  for (const key of FEE_KEYS) {
    const { mode, fixedUsdt } = readFeeComponent(fees, key);
    if (mode === 'fixed') sum += fixedUsdt;
  }
  return sum;
}

function legacyFeeModes(raw: Partial<TransactionFees>): Pick<
  TransactionFees,
  'fxFeeMode' | 'gasFeeMode' | 'transferFeeMode' | 'otherFeeMode'
> {
  return {
    fxFeeMode: normalizeFeeMode(
      raw.fxFeeMode,
      raw.fxFeeUsdt && raw.fxFeeUsdt > 0 ? 'fixed' : 'percent',
    ),
    gasFeeMode: normalizeFeeMode(
      raw.gasFeeMode,
      raw.gasFeePercent && raw.gasFeePercent > 0 ? 'percent' : 'fixed',
    ),
    transferFeeMode: normalizeFeeMode(
      raw.transferFeeMode,
      raw.transferFeePercent && raw.transferFeePercent > 0 ? 'percent' : 'fixed',
    ),
    otherFeeMode: normalizeFeeMode(
      raw.otherFeeMode,
      raw.otherFeePercent && raw.otherFeePercent > 0 ? 'percent' : 'fixed',
    ),
  };
}

export function buildFeeSnapshotFields(
  fees: TransactionFees,
  amounts: Record<`${FeeComponentKey}FeeUsdt`, number>,
) {
  const policy = normalizeTransactionFees(fees);
  return {
    feePolicySnapshot: policy,
    fxFeePercentSnapshot: policy.fxFeeMode === 'percent' ? policy.fxFeePercent : 0,
    gasFeeSnapshot: amounts.gasFeeUsdt,
    transferFeeSnapshot: amounts.transferFeeUsdt,
    otherFeeSnapshot: amounts.otherFeeUsdt,
    platformFeeSnapshot: 0,
  };
}

export function normalizeTransactionFees(raw?: Partial<TransactionFees>): TransactionFees {
  const defaults = {
    fxFeePercent: 0.5,
    fxFeeUsdt: 0,
    gasFeePercent: 0,
    gasFeeUsdt: 1,
    transferFeePercent: 0,
    transferFeeUsdt: 3,
    otherFeePercent: 0,
    otherFeeUsdt: 2,
  };
  const modes = legacyFeeModes(raw ?? {});

  return {
    fxFeeMode: modes.fxFeeMode,
    fxFeePercent: Math.min(100, Math.max(0, Number(raw?.fxFeePercent ?? defaults.fxFeePercent) || 0)),
    fxFeeUsdt: Math.max(0, Number(raw?.fxFeeUsdt ?? defaults.fxFeeUsdt) || 0),
    gasFeeMode: modes.gasFeeMode,
    gasFeePercent: Math.min(100, Math.max(0, Number(raw?.gasFeePercent ?? defaults.gasFeePercent) || 0)),
    gasFeeUsdt: Math.max(0, Number(raw?.gasFeeUsdt ?? defaults.gasFeeUsdt) || 0),
    transferFeeMode: modes.transferFeeMode,
    transferFeePercent: Math.min(100, Math.max(0, Number(raw?.transferFeePercent ?? defaults.transferFeePercent) || 0)),
    transferFeeUsdt: Math.max(0, Number(raw?.transferFeeUsdt ?? defaults.transferFeeUsdt) || 0),
    otherFeeMode: modes.otherFeeMode,
    otherFeePercent: Math.min(100, Math.max(0, Number(raw?.otherFeePercent ?? defaults.otherFeePercent) || 0)),
    otherFeeUsdt: Math.max(0, Number(raw?.otherFeeUsdt ?? defaults.otherFeeUsdt) || 0),
  };
}
