import { PriceProvider } from "../provider";
import { PriceFrame } from "../types";

export class TwelveDataProvider implements PriceProvider {
  constructor(private apiKey: string, private base = "https://api.twelvedata.com") {}

  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    // Use time_series daily adjusted, merged client-side
    const seriesMap: Record<string, { date:string, close:number }[]> = {};
    for (const s of symbols) {
      const url = `${this.base}/time_series?symbol=${encodeURIComponent(s)}&interval=1day&start_date=${start}&end_date=${end}&adjusted=true&dp=8&apikey=${this.apiKey}&format=JSON&order=ASC`;
      const res = await this.fetchWithRetry(url);
      const json = await res.json();
      if (json.status === "error") throw new Error(json.message || "TwelveData error");
      const values = json.values || json.data || [];
      seriesMap[s] = values.map((r: any) => ({ date: r.datetime, close: Number(r.close) }));
    }
    const dates = Array.from(new Set(symbols.flatMap(s => seriesMap[s].map(r => r.date)))).sort();
    const cols = symbols.slice();
    const data = dates.map(d => cols.map(s => {
      const row = seriesMap[s].find(r => r.date === d);
      return row ? row.close : NaN;
    }));
    return { index: dates, columns: cols, data, meta: { provider: "TwelveData", interval: "1day" } };
  }

  async loadIntraday(symbol: string, start: string, end: string, interval: "1m"|"5m"): Promise<PriceFrame> {
    const url = `${this.base}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval === "1m" ? "1min" : "5min"}&start_date=${start}&end_date=${end}&adjusted=true&dp=8&apikey=${this.apiKey}&format=JSON&order=ASC`;
    const res = await this.fetchWithRetry(url);
    const json = await res.json();
    if (json.status === "error") throw new Error(json.message || "TwelveData error");
    const values = json.values || json.data || [];
    const index = values.map((r: any) => r.datetime);
    const columns = [symbol];
    const data = values.map((r: any) => [Number(r.close)]);
    return { index, columns, data, meta: { provider: "TwelveData", interval } };
  }

  async fetchWithRetry(url: string, tries = 3, backoffMs = 500): Promise<Response> {
    let err: any;
    for (let i = 0; i < tries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (e) {
        err = e;
        await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
      }
    }
    throw err;
  }
}