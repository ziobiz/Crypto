import type { MembershipPriceCurrency } from '../constants/hq-policy';
import { isMembershipCryptoPriceCurrency } from '../constants/hq-policy';
import { fetchUsdtFiatRate } from './exchange-rate.service';

/**
 * 멤버십 판매가: HQ 입력은 항상 USD.
 * USD:USDT:USDC = 1:1:1, EURC는 EUR 시세(fiat per 1 USDT≈USD)로 환산.
 */
export type MembershipPriceQuote = {
  priceUsd: number;
  chargeCurrency: MembershipPriceCurrency;
  chargeAmount: number;
  equivalents: {
    USD: number;
    USDT: number;
    USDC: number;
    EURC: number;
  };
  /** 1 USD → EURC 수량 (≈ EUR per USDT) */
  usdToEurcRate: number;
  rateSource: string;
};

export async function getUsdToEurcRate(): Promise<{ rate: number; source: string }> {
  try {
    const { rate, source } = await fetchUsdtFiatRate('EUR');
    if (rate > 0) return { rate, source };
  } catch {
    /* fallback */
  }
  return { rate: 0.92, source: 'fallback' };
}

export async function quoteMembershipPrice(
  priceUsd: number,
  chargeCurrency: MembershipPriceCurrency,
): Promise<MembershipPriceQuote> {
  const usd = Math.max(0, Number(priceUsd) || 0);
  const { rate: usdToEurcRate, source } = await getUsdToEurcRate();
  const eurc = Number((usd * usdToEurcRate).toFixed(6));
  const equivalents = {
    USD: Number(usd.toFixed(6)),
    USDT: Number(usd.toFixed(6)),
    USDC: Number(usd.toFixed(6)),
    EURC: eurc,
  };

  let chargeAmount = usd;
  const cur = chargeCurrency;
  if (cur === 'USDT' || cur === 'USDC' || cur === 'USD') {
    chargeAmount = usd;
  } else if (cur === 'EURC' || cur === 'EUR') {
    chargeAmount = eurc;
  } else {
    /** 기타 법정통화: fiat per 1 USDT */
    try {
      const fiat = await fetchUsdtFiatRate(
        cur as 'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR',
      );
      chargeAmount = Number((usd * fiat.rate).toFixed(2));
    } catch {
      chargeAmount = usd;
    }
  }

  return {
    priceUsd: usd,
    chargeCurrency: cur,
    chargeAmount,
    equivalents,
    usdToEurcRate,
    rateSource: source,
  };
}

export function resolveCryptoAssetFromCurrency(
  currency: string,
): string | null {
  return isMembershipCryptoPriceCurrency(currency) ? currency : null;
}
