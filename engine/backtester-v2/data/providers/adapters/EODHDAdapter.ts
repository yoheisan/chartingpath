/**
 * EODHD Provider Adapter
 * 
 * Wraps EODHD API to implement the DataProvider interface.
 * EODHD is a paid provider with excellent data quality for stocks and ETFs.
 */

import { 
  DataProvider, 
  ProviderCapabilities, 
  ProviderConfig 
} from "../../providerInterface";
import { PriceFrame, Bar } from "../../types";

const EODHD_CAPABILITIES: ProviderCapabilities = {
  id: 'eodhd',
  name: 'EODHD (End of Day Historical Data)',
  instruments: ['stock', 'etf', 'forex', 'crypto', 'commodity', 'index'],
  timeframes: ['1d', '1wk', '1mo'],
  maxHistoricalDays: 10950, // ~30 years
  maxIntradayDays: 0, // No intraday in base plan
  costTier: 'paid',
  rateLimit: '100,000 requests/day',
  supportsOHLCV: true,
  supportsRealtime: false,
  commercialLicenseOk: true, // Explicitly allows commercial use
  notes: 'Premium quality EOD data. Explicit commercial license. Best for stocks/ETFs.'
};

export class EODHDAdapter implements DataProvider {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('EODHD adapter requires apiKey');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://eodhistoricaldata.com/api';
    this.maxRetries = config.maxRetries || 3;
  }

  getCapabilities(): ProviderCapabilities {
    return EODHD_CAPABILITIES;
  }

  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    console.log(`[EODHDAdapter] Loading EOD for ${symbols.length} symbols`);

    const seriesMap: Record<string, { date: string; adjClose: number }[]> = {};

    for (const symbol of symbols) {
      const url = `${this.baseUrl}/eod/${encodeURIComponent(symbol)}?from=${start}&to=${end}&adjusted=true&order=a&api_token=${this.apiKey}`;
      const response = await this.fetchWithRetry(url);
      const data = await response.json();

      seriesMap[symbol] = (data || []).map((r: any) => ({
        date: r.date,
        adjClose: Number(r.adjusted_close ?? r.close)
      }));
    }

    return this.mapToFrame(symbols, seriesMap);
  }

  async loadIntraday(
    _symbol: string,
    _start: string,
    _end: string,
    _interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h'
  ): Promise<PriceFrame> {
    throw new Error('EODHD does not support intraday data in base plan. Use Yahoo Finance or Twelve Data instead.');
  }

  async loadBars(
    symbol: string,
    start: string,
    end: string,
    _interval: string
  ): Promise<Bar[]> {
    console.log(`[EODHDAdapter] Loading OHLCV bars for ${symbol}`);

    const url = `${this.baseUrl}/eod/${encodeURIComponent(symbol)}?from=${start}&to=${end}&adjusted=true&order=a&api_token=${this.apiKey}`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();

    return (data || []).map((r: any) => ({
      t: r.date,
      o: Number(r.open),
      h: Number(r.high),
      l: Number(r.low),
      c: Number(r.adjusted_close ?? r.close),
      v: Number(r.volume || 0)
    }));
  }

  async loadFX(
    pair: string,
    start: string,
    end: string,
    _interval: '1m' | '5m' | '1h' | '1d' = '1d'
  ): Promise<PriceFrame> {
    // EODHD uses format like EURUSD.FOREX
    const eodSymbol = pair.includes('.') ? pair : `${pair}.FOREX`;
    return this.loadEOD([eodSymbol], start, end);
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const startTime = Date.now();
    try {
      const url = `${this.baseUrl}/eod/AAPL.US?from=2024-01-01&to=2024-01-05&api_token=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`[EODHDAdapter] Retry ${i + 1}/${this.maxRetries}: ${lastError.message}`);
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private mapToFrame(
    symbols: string[],
    seriesMap: Record<string, { date: string; adjClose: number }[]>
  ): PriceFrame {
    const allDates = new Set<string>();
    symbols.forEach(s => seriesMap[s]?.forEach(r => allDates.add(r.date)));
    const sortedDates = Array.from(allDates).sort();

    const data = sortedDates.map(d =>
      symbols.map(s => {
        const row = seriesMap[s]?.find(r => r.date === d);
        return row ? row.adjClose : NaN;
      })
    );

    return {
      index: sortedDates,
      columns: symbols,
      data,
      meta: { provider: 'eodhd' }
    };
  }
}

// Factory function for registry
export function createEODHDAdapter(config: ProviderConfig): DataProvider {
  return new EODHDAdapter(config);
}

export { EODHD_CAPABILITIES };
