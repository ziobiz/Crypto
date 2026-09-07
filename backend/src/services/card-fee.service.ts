import {
  applyCurrencyAmount,
  DEFAULT_CURRENCY_AMOUNT_DISPLAY,
  type HqCurrencyAmountDisplayPolicy,
} from '../lib/currency-amount';

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
  currency = 'JPY',
  policy: HqCurrencyAmountDisplayPolicy = DEFAULT_CURRENCY_AMOUNT_DISPLAY,
): CardFeeQuote {
  const fiatForConversion = breakdown.requiredFiat;
  const cardFeeFiat = applyCurrencyAmount(
    (fiatForConversion * cardFeePercent) / 100,
    currency,
    policy,
  );
  const cardChargeFiat = applyCurrencyAmount(
    fiatForConversion + cardFeeFiat,
    currency,
    policy,
  );
  return {
    cardFeePercent,
    cardFeeFiat,
    cardChargeFiat,
    fiatForConversion,
    breakdown,
  };
}

/** 카드 결제 금액 → USDT (카드 수수료 차감 후 기존 수수료 도식 적용) */
export function splitCardCharge(
  cardChargeFiat: number,
  cardFeePercent: number,
  currency = 'JPY',
  policy: HqCurrencyAmountDisplayPolicy = DEFAULT_CURRENCY_AMOUNT_DISPLAY,
) {
  const cardFeeFiat = applyCurrencyAmount(
    (cardChargeFiat * cardFeePercent) / (100 + cardFeePercent),
    currency,
    policy,
  );
  const fiatForConversion = applyCurrencyAmount(
    Math.max(0, cardChargeFiat - cardFeeFiat),
    currency,
    policy,
  );
  return { cardFeeFiat, fiatForConversion };
}
