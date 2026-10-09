import type { ExchangeRateSourceId, SymbolFeeCurrency } from '../constants/hq-policy';

export type ExchangeRateFetchResult = {
  rate: number;
  source: ExchangeRateSourceId;
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

function mid(bid: number, ask: number): number | null {
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) return null;
  return (bid + ask) / 2;
}

export type SettlementRateAsset = 'USDT' | 'USDC';

export async function fetchFromCoinGecko(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  const vs = currency.toLowerCase();
  const coinId = asset === 'USDC' ? 'usd-coin' : 'tether';
  const data = await fetchJson<Record<string, Record<string, number> | undefined>>(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vs}`,
  );
  const rate = data?.[coinId]?.[vs];
  if (!rate || rate <= 0) return null;
  return { rate, source: 'coingecko', fetchedAt: new Date() };
}

/** Binance USDCUSDT mid (1 USDC = N USDT) */
async function fetchUsdcUsdtMid(): Promise<number | null> {
  const usdc = await fetchJson<{ bidPrice: string; askPrice: string }>(
    'https://api.binance.com/api/v3/ticker/bookTicker?symbol=USDCUSDT',
  );
  if (!usdc) return null;
  return mid(Number(usdc.bidPrice), Number(usdc.askPrice));
}

/** USDT 기준가를 USDC 기준으로 환산 (× USDCUSDT) */
async function usdtRateToUsdc(
  usdt: ExchangeRateFetchResult | null,
): Promise<ExchangeRateFetchResult | null> {
  if (!usdt) return null;
  const usdcUsdt = await fetchUsdcUsdtMid();
  const factor = usdcUsdt && usdcUsdt > 0 ? usdcUsdt : 1;
  return {
    rate: usdt.rate * factor,
    source: usdt.source,
    fetchedAt: new Date(),
  };
}

/**
 * USD→법정통화 FX만 (1 USD당 fiat). 프리미엄 이론가 계산용.
 * 매입 기준가로는 쓰지 말 것 — USDT/USD 보정이 빠진 값이다.
 */
export async function fetchUsdFiatForex(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  if (currency === 'USD') {
    return { rate: 1, source: 'exchangerate_api', fetchedAt: new Date() };
  }
  const apiUrl = process.env.EXCHANGE_RATE_API_URL ?? 'https://api.exchangerate-api.com/v4/latest/USD';
  const data = await fetchJson<{ rates?: Record<string, number> }>(apiUrl);
  const rate = data?.rates?.[currency];
  if (!rate || rate <= 0) return null;
  return { rate, source: 'exchangerate_api', fetchedAt: new Date() };
}

/**
 * 매입용 1 스테이블당 법정통화.
 * FX(USD→fiat) × (USDT|USDC)/USD — $1 괴리 보정.
 */
export async function fetchFromExchangeRateApi(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  const [forex, stableUsd] = await Promise.all([
    fetchUsdFiatForex(currency),
    fetchFromCoinGecko('USD', asset),
  ]);
  if (!forex?.rate || forex.rate <= 0) return null;
  const stableUsdRate = stableUsd?.rate && stableUsd.rate > 0 ? stableUsd.rate : 1;
  const rate = forex.rate * stableUsdRate;
  if (!Number.isFinite(rate) || rate <= 0) return null;
  return { rate, source: 'exchangerate_api', fetchedAt: new Date() };
}

/** Binance Global — BTC/{fiat} ÷ BTC/(USDT|USDC) 호가 중간값 */
async function fetchBinanceComCross(
  currency: SymbolFeeCurrency,
  source: 'binance_cross' | 'binance_global',
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  const quote = asset === 'USDC' ? 'USDC' : 'USDT';
  if (currency === 'USD') {
    if (asset === 'USDC') {
      const cg = await fetchFromCoinGecko('USD', 'USDC');
      if (cg) return { ...cg, source };
      return { rate: 1, source, fetchedAt: new Date() };
    }
    const usdc = await fetchJson<{ bidPrice: string; askPrice: string }>(
      'https://api.binance.com/api/v3/ticker/bookTicker?symbol=USDCUSDT',
    );
    if (usdc) {
      const m = mid(Number(usdc.bidPrice), Number(usdc.askPrice));
      if (m) return { rate: m, source, fetchedAt: new Date() };
    }
    return { rate: 1, source, fetchedAt: new Date() };
  }

  const directSymbol = `${quote}${currency}`;
  const direct = await fetchJson<{ bidPrice: string; askPrice: string }>(
    `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${directSymbol}`,
  );
  if (direct) {
    const directMid = mid(Number(direct.bidPrice), Number(direct.askPrice));
    if (directMid) return { rate: directMid, source, fetchedAt: new Date() };
  }

  const symbol = `BTC${currency}`;
  const btcQuoteSymbol = `BTC${quote}`;
  const [fiatBook, quoteBook] = await Promise.all([
    fetchJson<{ bidPrice: string; askPrice: string }>(
      `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`,
    ),
    fetchJson<{ bidPrice: string; askPrice: string }>(
      `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${btcQuoteSymbol}`,
    ),
  ]);
  if (!fiatBook || !quoteBook) {
    if (asset === 'USDC') {
      return usdtRateToUsdc(await fetchBinanceComCross(currency, source, 'USDT'));
    }
    return null;
  }
  const fiatMid = mid(Number(fiatBook.bidPrice), Number(fiatBook.askPrice));
  const quoteMid = mid(Number(quoteBook.bidPrice), Number(quoteBook.askPrice));
  if (!fiatMid || !quoteMid) return null;
  return { rate: fiatMid / quoteMid, source, fetchedAt: new Date() };
}

/** Binance Global — BTC/{fiat} ÷ BTC/(USDT|USDC) 호가 중간값 (JPY 등) */
export async function fetchFromBinanceCross(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  return fetchBinanceComCross(currency, 'binance_cross', asset);
}

/** Binance Global (api.binance.com) — 직접 페어 또는 BTC 교차환산 */
export async function fetchFromBinanceGlobal(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  return fetchBinanceComCross(currency, 'binance_global', asset);
}

/** Binance Thailand — (USDT|USDC)/THB 호가 (api.binance.th) */
export async function fetchFromBinanceTh(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  if (currency !== 'THB') return null;
  const symbol = asset === 'USDC' ? 'USDCTHB' : 'USDTTHB';
  const book = await fetchJson<{ bidPrice: string; askPrice: string }>(
    `https://api.binance.th/api/v1/ticker/bookTicker?symbol=${symbol}`,
  );
  if (!book) {
    const price = await fetchJson<{ price: string }>(
      `https://api.binance.th/api/v1/ticker/price?symbol=${symbol}`,
    );
    const rate = Number(price?.price);
    if (rate > 0) return { rate, source: 'binance_th', fetchedAt: new Date() };
    if (asset === 'USDC') {
      return usdtRateToUsdc(await fetchFromBinanceTh(currency, 'USDT'));
    }
    return null;
  }
  const rate = mid(Number(book.bidPrice), Number(book.askPrice));
  if (!rate) {
    if (asset === 'USDC') return usdtRateToUsdc(await fetchFromBinanceTh(currency, 'USDT'));
    return null;
  }
  return { rate, source: 'binance_th', fetchedAt: new Date() };
}

/** Bybit BTC/(USDT|USDC) + Binance BTC/{fiat} 교차환산 */
export async function fetchFromBybitCross(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  if (currency === 'USD') {
    if (asset === 'USDC') {
      const cg = await fetchFromCoinGecko('USD', 'USDC');
      if (cg) return { ...cg, source: 'bybit_cross' };
      return { rate: 1, source: 'bybit_cross', fetchedAt: new Date() };
    }
    const bybitUsdt = await fetchJson<{ result?: { list?: Array<{ bid1Price: string; ask1Price: string }> } }>(
      'https://api.bybit.com/v5/market/tickers?category=spot&symbol=USDTUSD',
    );
    const row = bybitUsdt?.result?.list?.[0];
    if (row) {
      const m = mid(Number(row.bid1Price), Number(row.ask1Price));
      if (m) return { rate: m, source: 'bybit_cross', fetchedAt: new Date() };
    }
    return { rate: 1, source: 'bybit_cross', fetchedAt: new Date() };
  }
  const symbol = `BTC${currency}`;
  const bybitSymbol = asset === 'USDC' ? 'BTCUSDC' : 'BTCUSDT';
  const [fiatBook, bybitBtc] = await Promise.all([
    fetchJson<{ bidPrice: string; askPrice: string }>(
      `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`,
    ),
    fetchJson<{ result?: { list?: Array<{ bid1Price: string; ask1Price: string }> } }>(
      `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${bybitSymbol}`,
    ),
  ]);
  if (!fiatBook || !bybitBtc?.result?.list?.[0]) {
    if (asset === 'USDC') return usdtRateToUsdc(await fetchFromBybitCross(currency, 'USDT'));
    return null;
  }
  const fiatMid = mid(Number(fiatBook.bidPrice), Number(fiatBook.askPrice));
  const btcRow = bybitBtc.result.list[0];
  const quoteMid = mid(Number(btcRow.bid1Price), Number(btcRow.ask1Price));
  if (!fiatMid || !quoteMid) return null;
  return { rate: fiatMid / quoteMid, source: 'bybit_cross', fetchedAt: new Date() };
}

const KRAKEN_PAIRS: Record<SettlementRateAsset, Partial<Record<SymbolFeeCurrency, string>>> = {
  USDT: { JPY: 'USDTJPY', USD: 'USDTUSD' },
  USDC: { JPY: 'USDCJPY', USD: 'USDCUSD' },
};

/** Kraken — (USDT|USDC)/{fiat} 호가 (지원 페어만) */
export async function fetchFromKrakenBook(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  const pair = KRAKEN_PAIRS[asset][currency];
  if (!pair) {
    if (asset === 'USDC') return usdtRateToUsdc(await fetchFromKrakenBook(currency, 'USDT'));
    return null;
  }
  const data = await fetchJson<{ result?: Record<string, { b: string[]; a: string[]; c: string[] }> }>(
    `https://api.kraken.com/0/public/Ticker?pair=${pair}`,
  );
  const entry = data?.result ? Object.values(data.result)[0] : undefined;
  if (!entry) {
    if (asset === 'USDC') return usdtRateToUsdc(await fetchFromKrakenBook(currency, 'USDT'));
    return null;
  }
  const bid = Number(entry.b?.[0]);
  const ask = Number(entry.a?.[0]);
  const last = Number(entry.c?.[0]);
  const rate = mid(bid, ask) ?? (last > 0 ? last : null);
  if (!rate) return null;
  return { rate, source: 'kraken_book', fetchedAt: new Date() };
}

/** Upbit — KRW-USDT / KRW-USDC 현재가 */
export async function fetchFromUpbit(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  if (currency !== 'KRW') return null;
  const market = asset === 'USDC' ? 'KRW-USDC' : 'KRW-USDT';
  const data = await fetchJson<Array<{ trade_price: number }>>(
    `https://api.upbit.com/v1/ticker?markets=${market}`,
  );
  const rate = data?.[0]?.trade_price;
  if (!rate || rate <= 0) {
    if (asset === 'USDC') return usdtRateToUsdc(await fetchFromUpbit(currency, 'USDT'));
    return null;
  }
  return { rate, source: 'upbit', fetchedAt: new Date() };
}

/** 업비트·빗썸 평균 — 국내 스테이블/KRW (김프 포함). USDC는 Upbit KRW-USDC 우선 */
export async function fetchFromKrDomestic(
  currency: SymbolFeeCurrency,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  if (currency !== 'KRW') return null;
  if (asset === 'USDC') {
    return fetchFromUpbit(currency, 'USDC');
  }
  const { fetchDomesticUsdtKrw } = await import('./kimchi-premium.service');
  try {
    const { rate } = await fetchDomesticUsdtKrw();
    return { rate, source: 'kr_domestic', fetchedAt: new Date() };
  } catch {
    return null;
  }
}

export async function fetchBySource(
  currency: SymbolFeeCurrency,
  source: ExchangeRateSourceId,
  asset: SettlementRateAsset = 'USDT',
): Promise<ExchangeRateFetchResult | null> {
  switch (source) {
    case 'coingecko':
      return fetchFromCoinGecko(currency, asset);
    case 'exchangerate_api':
      return fetchFromExchangeRateApi(currency, asset);
    case 'binance_cross':
      return fetchFromBinanceCross(currency, asset);
    case 'binance_global':
      return fetchFromBinanceGlobal(currency, asset);
    case 'binance_th':
      return fetchFromBinanceTh(currency, asset);
    case 'bybit_cross':
      return fetchFromBybitCross(currency, asset);
    case 'kraken_book':
      return fetchFromKrakenBook(currency, asset);
    case 'upbit':
      return fetchFromUpbit(currency, asset);
    case 'kr_domestic':
      return fetchFromKrDomestic(currency, asset);
    default:
      return null;
  }
}
