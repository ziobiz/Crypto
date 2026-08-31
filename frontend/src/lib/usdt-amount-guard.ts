export type UsdtAmountReference = {
  expectedUsdtAmount: number;
  expectedUsdtMin?: number | null;
  expectedUsdtMax?: number | null;
  targetUsdtAmount?: number | null;
};

export type UsdtAmountVariance = {
  requiresConfirm: boolean;
  referenceAmount: number;
  minAllowed: number;
  maxAllowed: number;
  actualAmount: number;
  diffAmount: number;
  diffPercent: number;
};

export const USDT_AMOUNT_DEFAULT_TOLERANCE = 0.05;

export function evaluateUsdtAmountVariance(
  ref: UsdtAmountReference,
  actualAmount: number,
): UsdtAmountVariance {
  const expected = Number(ref.expectedUsdtAmount);
  const target =
    ref.targetUsdtAmount != null && Number.isFinite(Number(ref.targetUsdtAmount))
      ? Number(ref.targetUsdtAmount)
      : null;

  let minAllowed: number;
  let maxAllowed: number;
  let referenceAmount: number;

  if (
    ref.expectedUsdtMin != null &&
    ref.expectedUsdtMax != null &&
    Number.isFinite(Number(ref.expectedUsdtMin)) &&
    Number.isFinite(Number(ref.expectedUsdtMax))
  ) {
    minAllowed = Number(ref.expectedUsdtMin);
    maxAllowed = Number(ref.expectedUsdtMax);
    referenceAmount = target ?? expected;
  } else {
    const base = target ?? expected;
    const band = base * USDT_AMOUNT_DEFAULT_TOLERANCE;
    minAllowed = base - band;
    maxAllowed = base + band;
    referenceAmount = base;
  }

  const diffAmount = actualAmount - referenceAmount;
  const diffPercent = referenceAmount > 0 ? (diffAmount / referenceAmount) * 100 : 0;
  const requiresConfirm = actualAmount < minAllowed || actualAmount > maxAllowed;

  return {
    requiresConfirm,
    referenceAmount,
    minAllowed,
    maxAllowed,
    actualAmount,
    diffAmount,
    diffPercent,
  };
}

export function usdtAmountRefFromTicket(ticket: {
  expectedUsdtAmount: number;
  expectedUsdtMin?: number | null;
  expectedUsdtMax?: number | null;
  targetUsdtAmount?: number | null;
}): UsdtAmountReference {
  return {
    expectedUsdtAmount: ticket.expectedUsdtAmount,
    expectedUsdtMin: ticket.expectedUsdtMin,
    expectedUsdtMax: ticket.expectedUsdtMax,
    targetUsdtAmount: ticket.targetUsdtAmount,
  };
}
