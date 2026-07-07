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

export async function fetchFromCoinGecko(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  const vs = currency.toLowerCase();
  const data = await fetchJson<{ tether?: Record<string, number> }>(
    `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=${vs}`,
  );
  const rate = data?.tether?.[vs];
  if (!rate || rate <= 0) return null;
  return { rate, source: 'coingecko', fetchedAt: new Date() };
}

export async function fetchFromExchangeRateApi(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  if (currency === 'USD') {
    return { rate: 1, source: 'exchangerate_api', fetchedAt: new Date() };
  }
  const apiUrl = process.env.EXCHANGE_RATE_API_URL ?? 'https://api.exchangerate-api.com/v4/latest/USD';
  const data = await fetchJson<{ rates?: Record<string, number> }>(apiUrl);
  const rate = data?.rates?.[currency];
  if (!rate || rate <= 0) return null;
  return { rate, source: 'exchangerate_api', fetchedAt: new Date() };
}

/** Binance Global — BTC/{fiat} ÷ BTC/USDT 호가 중간값 */
async function fetchBinanceComCross(
  currency: SymbolFeeCurrency,
  source: 'binance_cross' | 'binance_global',
): Promise<ExchangeRateFetchResult | null> {
  if (currency === 'USD') {
    const usdc = await fetchJson<{ bidPrice: string; askPrice: string }>(
      'https://api.binance.com/api/v3/ticker/bookTicker?symbol=USDCUSDT',
    );
    if (usdc) {
      const m = mid(Number(usdc.bidPrice), Number(usdc.askPrice));
      if (m) return { rate: m, source, fetchedAt: new Date() };
    }
    return { rate: 1, source, fetchedAt: new Date() };
  }

  const directSymbol = `USDT${currency}`;
  const direct = await fetchJson<{ bidPrice: string; askPrice: string }>(
    `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${directSymbol}`,
  );
  if (direct) {
    const directMid = mid(Number(direct.bidPrice), Number(direct.askPrice));
    if (directMid) return { rate: directMid, source, fetchedAt: new Date() };
  }

  const symbol = `BTC${currency}`;
  const [fiatBook, usdtBook] = await Promise.all([
    fetchJson<{ bidPrice: string; askPrice: string }>(
      `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`,
    ),
    fetchJson<{ bidPrice: string; askPrice: string }>(
      'https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT',
    ),
  ]);
  if (!fiatBook || !usdtBook) return null;
  const fiatMid = mid(Number(fiatBook.bidPrice), Number(fiatBook.askPrice));
  const usdtMid = mid(Number(usdtBook.bidPrice), Number(usdtBook.askPrice));
  if (!fiatMid || !usdtMid) return null;
  return { rate: fiatMid / usdtMid, source, fetchedAt: new Date() };
}

/** Binance Global — BTC/{fiat} ÷ BTC/USDT 호가 중간값 (JPY 등) */
export async function fetchFromBinanceCross(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  return fetchBinanceComCross(currency, 'binance_cross');
}

/** Binance Global (api.binance.com) — USDT 직접 페어 또는 BTC 교차환산 */
export async function fetchFromBinanceGlobal(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  return fetchBinanceComCross(currency, 'binance_global');
}

/** Binance Thailand — USDT/THB 호가 (api.binance.th) */
export async function fetchFromBinanceTh(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  if (currency !== 'THB') return null;
  const book = await fetchJson<{ bidPrice: string; askPrice: string }>(
    'https://api.binance.th/api/v1/ticker/bookTicker?symbol=USDTTHB',
  );
  if (!book) {
    const price = await fetchJson<{ price: string }>(
      'https://api.binance.th/api/v1/ticker/price?symbol=USDTTHB',
    );
    const rate = Number(price?.price);
    if (rate > 0) return { rate, source: 'binance_th', fetchedAt: new Date() };
    return null;
  }
  const rate = mid(Number(book.bidPrice), Number(book.askPrice));
  if (!rate) return null;
  return { rate, source: 'binance_th', fetchedAt: new Date() };
}

/** Bybit BTC/USDT + Binance BTC/{fiat} 교차환산 */
export async function fetchFromBybitCross(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  if (currency === 'USD') {
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
  const [fiatBook, bybitBtc] = await Promise.all([
    fetchJson<{ bidPrice: string; askPrice: string }>(
      `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`,
    ),
    fetchJson<{ result?: { list?: Array<{ bid1Price: string; ask1Price: string }> } }>(
      'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT',
    ),
  ]);
  if (!fiatBook || !bybitBtc?.result?.list?.[0]) return null;
  const fiatMid = mid(Number(fiatBook.bidPrice), Number(fiatBook.askPrice));
  const btcRow = bybitBtc.result.list[0];
  const usdtMid = mid(Number(btcRow.bid1Price), Number(btcRow.ask1Price));
  if (!fiatMid || !usdtMid) return null;
  return { rate: fiatMid / usdtMid, source: 'bybit_cross', fetchedAt: new Date() };
}

const KRAKEN_USDT_PAIRS: Partial<Record<SymbolFeeCurrency, string>> = {
  JPY: 'USDTJPY',
  USD: 'USDTUSD',
};

/** Kraken — USDT/{fiat} 호가 (지원 페어만) */
export async function fetchFromKrakenBook(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  const pair = KRAKEN_USDT_PAIRS[currency];
  if (!pair) return null;
  const data = await fetchJson<{ result?: Record<string, { b: string[]; a: string[]; c: string[] }> }>(
    `https://api.kraken.com/0/public/Ticker?pair=${pair}`,
  );
  const entry = data?.result ? Object.values(data.result)[0] : undefined;
  if (!entry) return null;
  const bid = Number(entry.b?.[0]);
  const ask = Number(entry.a?.[0]);
  const last = Number(entry.c?.[0]);
  const rate = mid(bid, ask) ?? (last > 0 ? last : null);
  if (!rate) return null;
  return { rate, source: 'kraken_book', fetchedAt: new Date() };
}

/** Upbit — KRW-USDT 현재가 (한국 원화) */
export async function fetchFromUpbit(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  if (currency !== 'KRW') return null;
  const data = await fetchJson<Array<{ trade_price: number }>>(
    'https://api.upbit.com/v1/ticker?markets=KRW-USDT',
  );
  const rate = data?.[0]?.trade_price;
  if (!rate || rate <= 0) return null;
  return { rate, source: 'upbit', fetchedAt: new Date() };
}

/** 업비트·빗썸 평균 — 국내 USDT/KRW (김프 포함) */
export async function fetchFromKrDomestic(currency: SymbolFeeCurrency): Promise<ExchangeRateFetchResult | null> {
  if (currency !== 'KRW') return null;
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
): Promise<ExchangeRateFetchResult | null> {
  switch (source) {
    case 'coingecko':
      return fetchFromCoinGecko(currency);
    case 'exchangerate_api':
      return fetchFromExchangeRateApi(currency);
    case 'binance_cross':
      return fetchFromBinanceCross(currency);
    case 'binance_global':
      return fetchFromBinanceGlobal(currency);
    case 'binance_th':
      return fetchFromBinanceTh(currency);
    case 'bybit_cross':
      return fetchFromBybitCross(currency);
    case 'kraken_book':
      return fetchFromKrakenBook(currency);
    case 'upbit':
      return fetchFromUpbit(currency);
    case 'kr_domestic':
      return fetchFromKrDomestic(currency);
    default:
      return null;
  }
}
