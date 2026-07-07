import type { SymbolFeeCurrency } from '../constants/hq-policy';

export type ChartFiatCurrency = 'KRW' | 'JPY' | 'THB' | 'CNY';

export const CHART_FIAT_CURRENCIES: ChartFiatCurrency[] = ['KRW', 'JPY', 'THB', 'CNY'];

export type ExchangeMarketStats = {
  currency: ChartFiatCurrency;
  rate: number;
  volume24hUsdt: number | null;
  volume24hQuote: number | null;
  changePercent24h: number | null;
  source: string;
  fetchedAt: Date;
};

const FETCH_TIMEOUT_MS = 8000;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchKrwUpbit(): Promise<ExchangeMarketStats | null> {
  const data = await fetchJson<
    Array<{
      trade_price: number;
      acc_trade_volume_24h: number;
      acc_trade_price_24h: number;
      signed_change_rate: number;
    }>
  >('https://api.upbit.com/v1/ticker?markets=KRW-USDT');
  const row = data?.[0];
  if (!row?.trade_price) return null;
  return {
    currency: 'KRW',
    rate: row.trade_price,
    volume24hUsdt: row.acc_trade_volume_24h ?? null,
    volume24hQuote: row.acc_trade_price_24h ?? null,
    changePercent24h: Number.isFinite(row.signed_change_rate)
      ? row.signed_change_rate * 100
      : null,
    source: 'upbit',
    fetchedAt: new Date(),
  };
}

async function fetchBinance24h(
  currency: ChartFiatCurrency,
  symbol: string,
  source: string,
): Promise<ExchangeMarketStats | null> {
  const data = await fetchJson<{
    lastPrice: string;
    volume: string;
    quoteVolume: string;
    priceChangePercent: string;
  }>(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
  if (!data?.lastPrice) return null;
  const rate = Number(data.lastPrice);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return {
    currency,
    rate,
    volume24hUsdt: Number(data.volume) || null,
    volume24hQuote: Number(data.quoteVolume) || null,
    changePercent24h: Number(data.priceChangePercent) || null,
    source,
    fetchedAt: new Date(),
  };
}

async function fetchThbBinanceTh(): Promise<ExchangeMarketStats | null> {
  const data = await fetchJson<{
    lastPrice: string;
    volume: string;
    quoteVolume: string;
    priceChangePercent: string;
  }>('https://api.binance.th/api/v1/ticker/24hr?symbol=USDTTHB');
  if (!data?.lastPrice) {
    return fetchBinance24h('THB', 'USDTTHB', 'binance_global');
  }
  const rate = Number(data.lastPrice);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return {
    currency: 'THB',
    rate,
    volume24hUsdt: Number(data.volume) || null,
    volume24hQuote: Number(data.quoteVolume) || null,
    changePercent24h: Number(data.priceChangePercent) || null,
    source: 'binance_th',
    fetchedAt: new Date(),
  };
}

async function fetchCnyOkx(): Promise<ExchangeMarketStats | null> {
  const data = await fetchJson<{
    code: string;
    data?: Array<{
      last: string;
      open24h: string;
      vol24h: string;
      volCcy24h: string;
    }>;
  }>('https://www.okx.com/api/v5/market/ticker?instId=USDT-CNY');
  const row = data?.code === '0' ? data.data?.[0] : undefined;
  if (!row?.last) {
    return fetchBinance24h('CNY', 'USDTCNY', 'binance_global');
  }
  const rate = Number(row.last);
  const open = Number(row.open24h);
  const changePercent =
    Number.isFinite(open) && open > 0 ? ((rate - open) / open) * 100 : null;
  return {
    currency: 'CNY',
    rate,
    volume24hUsdt: Number(row.vol24h) || null,
    volume24hQuote: Number(row.volCcy24h) || null,
    changePercent24h: changePercent,
    source: 'okx',
    fetchedAt: new Date(),
  };
}

export async function fetchExchangeMarketStats(
  currency: ChartFiatCurrency,
): Promise<ExchangeMarketStats | null> {
  switch (currency) {
    case 'KRW':
      return fetchKrwUpbit();
    case 'JPY':
      return fetchBinance24h('JPY', 'USDTJPY', 'binance_global');
    case 'THB':
      return fetchThbBinanceTh();
    case 'CNY':
      return fetchCnyOkx();
    default:
      return null;
  }
}

export async function fetchAllExchangeMarketStats(): Promise<ExchangeMarketStats[]> {
  const results = await Promise.all(CHART_FIAT_CURRENCIES.map((c) => fetchExchangeMarketStats(c)));
  return results.filter((r): r is ExchangeMarketStats => r !== null);
}
