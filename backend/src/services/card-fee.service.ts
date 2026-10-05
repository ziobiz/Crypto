function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type CardFeeQuote = {
  cardFeePercent: number;
  cardFeeFiat: number;
  cardChargeFiat: number;
  fiatForConversion: number;
  breakdown: {
    requiredFiat: number;
    netUsdt: number;
    grossUsdt: number;
    fxFeeUsdt: number;
    gasFeeUsdt: number;
    transferFeeUsdt: number;
    otherFeeUsdt: number;
  };
};

/** 시볼 requiredFiat 위에 카드 수수료 % 가산 → ICOPAY 청구 총액 */
export function quoteCardFromTarget(
  breakdown: CardFeeQuote['breakdown'],
  cardFeePercent: number,
): CardFeeQuote {
  const fiatForConversion = breakdown.requiredFiat;
  const cardFeeFiat = round2((fiatForConversion * cardFeePercent) / 100);
  const cardChargeFiat = round2(fiatForConversion + cardFeeFiat);
  return {
    cardFeePercent,
    cardFeeFiat,
    cardChargeFiat,
    fiatForConversion,
    breakdown,
  };
}

/** 카드 결제 총액 → 순수 구매 재원 (카드 수수료 역산) */
export function splitCardCharge(cardChargeFiat: number, cardFeePercent: number) {
  const cardFeeFiat = round2((cardChargeFiat * cardFeePercent) / (100 + cardFeePercent));
  const fiatForConversion = round2(Math.max(0, cardChargeFiat - cardFeeFiat));
  return { cardFeeFiat, fiatForConversion };
}
