import { PriceProvider } from "../provider";
import { PriceFrame } from "../types";

function mapEodToFrame(symbols: string[], seriesMap: Record<string, { date:string, adjClose:number }[]>): PriceFrame {
  const allDates = Array.from(new Set(symbols.flatMap(s => seriesMap[s].map(r => r.date)))).sort();
  const cols = symbols.slice();
  const data = allDates.map(d => cols.map(s => {
    const row = seriesMap[s].find(r => r.date === d);
    return row ? row.adjClose : NaN; // engine will align/forward-fill if needed
  }));
  return { index: allDates, columns: cols, data, meta: { provider: "EODHD" } };
}

export class EODHDProvider implements PriceProvider {
  constructor(private apiKey: string, private base = "https://eodhistoricaldata.com/api") {}

  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    // NOTE: EODHD format: /eod/{SYMBOL}.EXCHANGE?from=YYYY-MM-DD&to=YYYY-MM-DD&adjusted=true&api_token=KEY&order=a
    // Assume symbols already include exchange suffix if needed (e.g., SPY.US, AAPL.US)
    const seriesMap: Record<string, { date:string, adjClose:number }[]> = {};
    for (const s of symbols) {
      const url = `${this.base}/eod/${encodeURIComponent(s)}?from=${start}&to=${end}&adjusted=true&order=a&api_token=${this.apiKey}`;
      const res = await this.fetchWithRetry(url);
      const json = await res.json();
      seriesMap[s] = (json || []).map((r: any) => ({ date: r.date, adjClose: Number(r.adjusted_close ?? r.close) }));
    }
    return mapEodToFrame(symbols, seriesMap);
  }

  async loadIntraday(_symbol: string, _start: string, _end: string, _interval: "1m"|"5m"): Promise<PriceFrame> {
    throw new Error("EODHDProvider.loadIntraday not supported in this stub — use TwelveDataProvider for intraday");
  }

  async fetchWithRetry(url: string, tries = 3, backoffMs = 500): Promise<Response> {
    let lastErr: any;
    for (let i = 0; i < tries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (e) {
        lastErr = e;
        await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
      }
    }
    throw lastErr;
  }
}