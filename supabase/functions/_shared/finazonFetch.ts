/**
 * Finazon Data Fetcher
 * Primary replacement for EODHD for stocks and FX intraday.
 * Native 4H/8H bars. Commercial redistribution explicitly permitted.
 * Requires: FINAZON_API_KEY env var in Supabase dashboard.
 */

export interface OHLCBar {
  date: string; open: number; high: number; low: number; close: number; volume: number;
}

const TF_TO_FINAZON_INTERVAL: Record<string, string> = {
  '1h': '1h', '4h': '4h', '8h': '8h', '1d': '1d', '1wk': '1w',
};

function getFinazonDataset(symbol: string): string | null {
  if (symbol.includes('=X')) return 'forex';
  if (symbol.includes('-USD') && !symbol.includes('=')) return null;
  if (symbol.includes('=F')) return null;
  if (symbol.startsWith('^')) return null;
  return 'us_stocks_essential';
}

function toFinazonTicker(symbol: string, dataset: string): string {
  if (dataset === 'forex') {
    const pair = symbol.replace('=X', '');
    return `${pair.slice(0, 3)}/${pair.slice(3)}`;
  }
  return symbol;
}

export async function fetchFinazonData(
  symbol: string, timeframe: string, fromTimestamp?: number, apiKey?: string,
): Promise<OHLCBar[]> {
  const KEY = apiKey || Deno.env.get('FINAZON_API_KEY');
  if (!KEY) return [];
  const dataset = getFinazonDataset(symbol);
  if (!dataset) return [];
  const interval = TF_TO_FINAZON_INTERVAL[timeframe];
  if (!interval) return [];
  const ticker = toFinazonTicker(symbol, dataset);
  const endUnix = Math.floor(Date.now() / 1000);
  const startUnix = fromTimestamp
    ? Math.floor(fromTimestamp / 1000)
    : endUnix - (['1d', '1w'].includes(interval) ? 365 * 20 : 730) * 86400;
  const allBars: OHLCBar[] = [];
  let page = 0;
  try {
    while (page < 30) {
      const params = new URLSearchParams({
        dataset, ticker, interval,
        start_at: String(startUnix), end_at: String(endUnix),
        order: 'asc', page: String(page), page_size: '1000',
      });
      const res = await fetch(
        `https://api.finazon.io/latest/time_series?${params}`,
        { headers: { Authorization: `apikey ${KEY}` } },
      );
      if (!res.ok) { console.warn(`[Finazon] HTTP ${res.status} for ${ticker}@${interval}`); break; }
      const rows: any[] = (await res.json())?.data ?? [];
      if (!rows.length) break;
      for (const r of rows) {
        if (!Number.isFinite(r.c) || r.c <= 0) continue;
        allBars.push({
          date: new Date(r.t * 1000).toISOString(),
          open: Number(r.o), high: Number(r.h), low: Number(r.l),
          close: Number(r.c), volume: Number(r.v ?? 0),
        });
      }
      if (rows.length < 1000) break;
      page++;
      await new Promise(res => setTimeout(res, 150));
    }
  } catch (err) {
    console.warn(`[Finazon] fetch error for ${symbol}@${interval}:`, err);
  }
  return allBars;
}
