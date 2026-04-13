/**
 * Binance Public API Data Fetcher
 * Free, no API key required. Best source for crypto intraday (1h, 4h, 8h).
 * Also supports daily/weekly for crypto symbols.
 */

export interface OHLCBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BINANCE_KLINES = 'https://api.binance.com/api/v3/klines';

const TF_TO_BINANCE_INTERVAL: Record<string, string> = {
  '1h': '1h',
  '4h': '4h',
  '8h': '8h',
  '1d': '1d',
  '1wk': '1w',
  '1mo': '1M',
};

/**
 * Convert Yahoo-style crypto symbol (BTC-USD) → Binance pair (BTCUSDT).
 */
function toBinancePair(symbol: string): string {
  if (symbol.endsWith('USDT') && !symbol.includes('-')) return symbol;
  return symbol
    .replace(/-USD$/, 'USDT')
    .replace(/-USDT$/, 'USDT')
    .toUpperCase();
}

/**
 * Returns true if the symbol looks like a crypto pair we can fetch from Binance.
 */
export function isBinanceCrypto(symbol: string): boolean {
  return (symbol.includes('-USD') || symbol.endsWith('USDT')) && !symbol.includes('=');
}

/**
 * Fetch OHLCV bars from Binance public klines API.
 * Paginates automatically (max 1000 per request, up to 10 pages = 10,000 bars).
 */
export async function fetchBinanceData(
  symbol: string,
  timeframe: string,
  fromTimestamp?: number,
): Promise<OHLCBar[]> {
  const interval = TF_TO_BINANCE_INTERVAL[timeframe];
  if (!interval) return [];

  if (!isBinanceCrypto(symbol)) return [];

  const pair = toBinancePair(symbol);
  const endMs = Date.now();
  const startMs = fromTimestamp
    ?? endMs - (['1d', '1w', '1M'].includes(interval) ? 365 * 5 : 730) * 86400000;

  const allBars: OHLCBar[] = [];
  let currentStart = startMs;
  const MAX_PER_REQUEST = 1000;
  const MAX_PAGES = 10;

  try {
    for (let page = 0; page < MAX_PAGES && currentStart < endMs; page++) {
      const url = `${BINANCE_KLINES}?symbol=${pair}&interval=${interval}&startTime=${currentStart}&endTime=${endMs}&limit=${MAX_PER_REQUEST}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Binance] HTTP ${res.status} for ${pair}@${interval}: ${errText}`);
        // 400 = unknown pair, return empty gracefully
        if (res.status === 400) return [];
        break;
      }

      const klines = await res.json();
      if (!Array.isArray(klines) || klines.length === 0) break;

      for (const k of klines) {
        const close = parseFloat(k[4]);
        if (!Number.isFinite(close) || close <= 0) continue;
        allBars.push({
          date: new Date(k[0]).toISOString(),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close,
          volume: parseFloat(k[5]),
        });
      }

      // Advance past last candle
      currentStart = klines[klines.length - 1][0] + 1;
      if (klines.length < MAX_PER_REQUEST) break;

      // Small delay between pages to be polite
      if (page < MAX_PAGES - 1) await new Promise(r => setTimeout(r, 100));
    }
  } catch (err) {
    console.warn(`[Binance] fetch error for ${symbol}@${interval}:`, err);
  }

  return allBars;
}
