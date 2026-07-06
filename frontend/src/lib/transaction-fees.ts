export type TransactionFees = {
  fxFeePercent: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
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
