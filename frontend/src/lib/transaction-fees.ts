import type { TransactionFees } from '@/lib/api';
import {
  computeFeeUsdt,
  readFeeComponent,
  fixedFeeSum,
  percentMultiplierSum,
} from '@/lib/fee-component';

export type { TransactionFees };

export type UsdtFeeBreakdown = {
  targetUsdt: number;
  grossUsdt: number;
  fxFeeUsdt: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
  netUsdt: number;
  requiredFiat: number;
};

function feeAmount(grossUsdt: number, fees: TransactionFees, key: 'fx' | 'gas' | 'transfer' | 'other') {
  const { mode, percent, fixedUsdt } = readFeeComponent(fees, key);
  return computeFeeUsdt(grossUsdt, mode, percent, fixedUsdt);
}

export function calculateExpectedUsdt(
  fiatAmount: number,
  exchangeRate: number,
  fees: TransactionFees,
): number {
  if (exchangeRate <= 0) return 0;
  const grossUsdt = fiatAmount / exchangeRate;
  const net =
    grossUsdt -
    feeAmount(grossUsdt, fees, 'fx') -
    feeAmount(grossUsdt, fees, 'gas') -
    feeAmount(grossUsdt, fees, 'transfer') -
    feeAmount(grossUsdt, fees, 'other');
  return Math.max(0, Number(net.toFixed(8)));
}

export function calculateExpectedUsdtRange(
  fiatAmount: number,
  exchangeRate: number,
  fees: TransactionFees,
): { expected: number; min: number; max: number } {
  const expected = calculateExpectedUsdt(fiatAmount, exchangeRate, fees);
  const grossUsdt = fiatAmount / exchangeRate;
  const gasVariance = feeAmount(grossUsdt, fees, 'gas') * 0.2;
  return {
    expected,
    min: Math.max(0, Number((expected - gasVariance).toFixed(8))),
    max: Math.max(0, Number((expected + gasVariance).toFixed(8))),
  };
}

export function calculateFromTargetUsdt(
  targetUsdt: number,
  exchangeRate: number,
  fees: TransactionFees,
): UsdtFeeBreakdown {
  const pctSum = percentMultiplierSum(fees);
  const fixed = fixedFeeSum(fees);
  const denom = 1 - pctSum / 100;
  const grossUsdt = denom > 0 ? (targetUsdt + fixed) / denom : targetUsdt + fixed;
  const fxFeeUsdt = feeAmount(grossUsdt, fees, 'fx');
  const gasFeeUsdt = feeAmount(grossUsdt, fees, 'gas');
  const transferFeeUsdt = feeAmount(grossUsdt, fees, 'transfer');
  const otherFeeUsdt = feeAmount(grossUsdt, fees, 'other');
  return {
    targetUsdt,
    grossUsdt: Number(grossUsdt.toFixed(8)),
    fxFeeUsdt,
    gasFeeUsdt,
    transferFeeUsdt,
    otherFeeUsdt,
    netUsdt: Number(targetUsdt.toFixed(8)),
    requiredFiat: Number((grossUsdt * exchangeRate).toFixed(2)),
  };
}
