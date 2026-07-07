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

/** 희망 USDT → 카드 청구 금액 (기존 입금액 + 카드 수수료) */
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

/** 카드 결제 금액 → USDT (카드 수수료 차감 후 기존 수수료 도식 적용) */
export function splitCardCharge(cardChargeFiat: number, cardFeePercent: number) {
  const cardFeeFiat = round2((cardChargeFiat * cardFeePercent) / (100 + cardFeePercent));
  const fiatForConversion = round2(Math.max(0, cardChargeFiat - cardFeeFiat));
  return { cardFeeFiat, fiatForConversion };
}
