export type TransactionFees = {
  fxFeePercent: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
};

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

export function calculateExpectedUsdt(
  fiatAmount: number,
  exchangeRate: number,
  fees: TransactionFees,
): number {
  if (exchangeRate <= 0) return 0;
  const grossUsdt = fiatAmount / exchangeRate;
  const fxFee = (grossUsdt * fees.fxFeePercent) / 100;
  const net = grossUsdt - fxFee - fees.gasFeeUsdt - fees.transferFeeUsdt - fees.otherFeeUsdt;
  return Math.max(0, Number(net.toFixed(8)));
}

export function calculateExpectedUsdtRange(
  fiatAmount: number,
  exchangeRate: number,
  fees: TransactionFees,
): { expected: number; min: number; max: number } {
  const expected = calculateExpectedUsdt(fiatAmount, exchangeRate, fees);
  const gasVariance = fees.gasFeeUsdt * 0.2;
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
  const fixed = fees.gasFeeUsdt + fees.transferFeeUsdt + fees.otherFeeUsdt;
  const fxMult = 1 - fees.fxFeePercent / 100;
  const grossUsdt = fxMult > 0 ? (targetUsdt + fixed) / fxMult : targetUsdt + fixed;
  const fxFeeUsdt = (grossUsdt * fees.fxFeePercent) / 100;
  return {
    targetUsdt,
    grossUsdt: Number(grossUsdt.toFixed(8)),
    fxFeeUsdt: Number(fxFeeUsdt.toFixed(8)),
    gasFeeUsdt: fees.gasFeeUsdt,
    transferFeeUsdt: fees.transferFeeUsdt,
    otherFeeUsdt: fees.otherFeeUsdt,
    netUsdt: Number(targetUsdt.toFixed(8)),
    requiredFiat: Number((grossUsdt * exchangeRate).toFixed(2)),
  };
}
