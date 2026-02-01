/**
 * Yahoo Finance Provider Adapter
 * 
 * Wraps the existing YahooFinanceProvider to implement the new DataProvider interface.
 * This adapter pattern allows gradual migration without breaking existing code.
 */

import { 
  DataProvider, 
  ProviderCapabilities, 
  ProviderConfig 
} from "../../providerInterface";
import { PriceFrame, Bar } from "../../types";

const YAHOO_CAPABILITIES: ProviderCapabilities = {
  id: 'yahoo',
  name: 'Yahoo Finance',
  instruments: ['stock', 'etf', 'index', 'forex', 'crypto'],
  timeframes: ['1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'],
  maxHistoricalDays: 7300, // ~20 years daily
  maxIntradayDays: 30,
  costTier: 'free',
  rateLimit: 'Unofficial API - no guaranteed limits',
  supportsOHLCV: true,
  supportsRealtime: false,
  commercialLicenseOk: false, // Gray area - unofficial API
  notes: 'Best free option for stocks. Uses unofficial API via edge function proxy.'
};

export class YahooFinanceAdapter implements DataProvider {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(config: ProviderConfig) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Yahoo Finance adapter requires supabaseUrl and supabaseKey');
    }
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
  }

  getCapabilities(): ProviderCapabilities {
    return YAHOO_CAPABILITIES;
  }

  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    console.log(`[YahooAdapter] Loading EOD for ${symbols.length} symbols`);

    if (symbols.length === 1) {
      return this.fetchSingle(symbols[0], start, end, '1d');
    }

    // Parallel fetch for multiple symbols
    const frames = await Promise.all(
      symbols.map(s => this.fetchSingle(s, start, end, '1d'))
    );

    return this.mergeFrames(frames, symbols);
  }

  async loadIntraday(
    symbol: string,
    start: string,
    end: string,
    interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h'
  ): Promise<PriceFrame> {
    console.log(`[YahooAdapter] Loading intraday ${interval} for ${symbol}`);

    // Yahoo doesn't natively support 4h - we handle aggregation in edge function
    const yahooInterval = interval === '4h' ? '4h' : interval;
    return this.fetchSingle(symbol, start, end, yahooInterval);
  }

  async loadBars(
    symbol: string,
    start: string,
    end: string,
    interval: string
  ): Promise<Bar[]> {
    console.log(`[YahooAdapter] Loading OHLCV bars for ${symbol}`);

    const response = await this.fetchWithOHLCV(symbol, start, end, interval);
    return response.bars || [];
  }

  async loadFX(
    pair: string,
    start: string,
    end: string,
    interval: '1m' | '5m' | '1h' | '1d' = '1d'
  ): Promise<PriceFrame> {
    // Yahoo uses format like EURUSD=X
    const yahooSymbol = pair.includes('=X') ? pair : `${pair}=X`;
    return this.fetchSingle(yahooSymbol, start, end, interval);
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const startTime = Date.now();
    try {
      // Quick fetch of SPY to check connectivity
      await this.fetchSingle('SPY', '2024-01-01', '2024-01-05', '1d');
      return { ok: true, latencyMs: Date.now() - startTime };
    } catch (error) {
      return { 
        ok: false, 
        latencyMs: Date.now() - startTime, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async fetchSingle(
    symbol: string,
    start: string,
    end: string,
    interval: string
  ): Promise<PriceFrame> {
    const response = await fetch(
      `${this.supabaseUrl}/functions/v1/fetch-yahoo-finance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({
          symbol,
          startDate: start,
          endDate: end,
          interval
        })
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Yahoo Finance error: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  private async fetchWithOHLCV(
    symbol: string,
    start: string,
    end: string,
    interval: string
  ): Promise<PriceFrame & { bars?: Bar[] }> {
    const response = await fetch(
      `${this.supabaseUrl}/functions/v1/fetch-yahoo-finance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({
          symbol,
          startDate: start,
          endDate: end,
          interval,
          includeOhlc: true
        })
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Yahoo Finance error: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  private mergeFrames(frames: PriceFrame[], symbols: string[]): PriceFrame {
    if (frames.length === 0) {
      throw new Error('No frames to merge');
    }

    const allDates = new Set<string>();
    frames.forEach(f => f.index.forEach(d => allDates.add(d)));
    const sortedDates = Array.from(allDates).sort();

    const priceMaps = frames.map(f => {
      const map = new Map<string, number>();
      f.index.forEach((date, idx) => map.set(date, f.data[idx][0]));
      return map;
    });

    const mergedData = sortedDates.map(date =>
      priceMaps.map(pm => pm.get(date) ?? NaN)
    );

    return {
      index: sortedDates,
      columns: symbols,
      data: mergedData,
      meta: { provider: 'yahoo', merged: true }
    };
  }
}

// Factory function for registry
export function createYahooFinanceAdapter(config: ProviderConfig): DataProvider {
  return new YahooFinanceAdapter(config);
}

export { YAHOO_CAPABILITIES };
