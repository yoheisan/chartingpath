/**
 * Supabase DB-First Data Provider
 * 
 * Reads from the `historical_prices` table first (EODHD-seeded data).
 * Falls back to the Yahoo Finance edge function only when the DB
 * has insufficient data (< 10 bars).
 */

import {
  DataProvider,
  ProviderCapabilities,
  ProviderConfig
} from "../../providerInterface";
import { PriceFrame, Bar } from "../../types";

const MIN_BARS_THRESHOLD = 10;

const DB_FIRST_CAPABILITIES: ProviderCapabilities = {
  id: 'supabase-db',
  name: 'Supabase DB (EODHD cache)',
  instruments: ['stock', 'etf', 'index', 'forex', 'crypto', 'commodity'],
  timeframes: ['1h', '4h', '8h', '1d', '1wk'],
  maxHistoricalDays: 1825, // 5 years
  maxIntradayDays: 730,
  costTier: 'free',
  rateLimit: 'No external rate limit — reads from local DB',
  supportsOHLCV: true,
  supportsRealtime: false,
  commercialLicenseOk: true,
  notes: 'Reads EODHD-seeded data from historical_prices table. Falls back to Yahoo API when DB has no data.'
};

export class SupabaseDBFirstAdapter implements DataProvider {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(config: ProviderConfig) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('SupabaseDBFirst adapter requires supabaseUrl and supabaseKey');
    }
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
  }

  getCapabilities(): ProviderCapabilities {
    return DB_FIRST_CAPABILITIES;
  }

  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    console.log(`[DBFirst] Loading EOD for ${symbols.join(', ')} (${start} → ${end})`);

    // Try DB first for each symbol
    const frames: PriceFrame[] = [];
    const missingSymbols: string[] = [];

    for (const symbol of symbols) {
      const dbFrame = await this.fetchFromDB(symbol, start, end, '1d');
      if (dbFrame && dbFrame.index.length >= MIN_BARS_THRESHOLD) {
        console.log(`[DBFirst] DB hit: ${symbol} → ${dbFrame.index.length} bars`);
        frames.push(dbFrame);
      } else {
    console.log(`[DBFirst] DB miss: ${symbol} (${dbFrame?.index.length ?? 0} bars), will try EODHD`);
        missingSymbols.push(symbol);
      }
    }

    // Fetch missing symbols from EODHD first, then Yahoo as last resort
    for (const symbol of missingSymbols) {
      try {
        const apiFrame = await this.fetchFromEODHD(symbol, start, end, '1d');
        if (apiFrame && apiFrame.index.length >= MIN_BARS_THRESHOLD) {
          frames.push(apiFrame);
          console.log(`[DBFirst] EODHD fallback: ${symbol} → ${apiFrame.index.length} bars`);
          continue;
        }
      } catch (err) {
        console.warn(`[DBFirst] EODHD fallback failed for ${symbol}:`, err);
      }
      try {
        const apiFrame = await this.fetchFromYahoo(symbol, start, end, '1d');
        frames.push(apiFrame);
        console.log(`[DBFirst] Yahoo last-resort: ${symbol} → ${apiFrame.index.length} bars`);
      } catch (err) {
        console.warn(`[DBFirst] Yahoo fallback failed for ${symbol}:`, err);
        // Push empty frame so merge doesn't break
        frames.push({ index: [], columns: [symbol], data: [], meta: { provider: 'none' } });
      }
    }

    if (frames.length === 1) return frames[0];
    return this.mergeFrames(frames, symbols);
  }

  async loadIntraday(
    symbol: string,
    start: string,
    end: string,
    interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '8h'
  ): Promise<PriceFrame> {
    console.log(`[DBFirst] Loading intraday ${interval} for ${symbol}`);

    // Map interval to DB timeframe format
    const dbTimeframe = interval;
    const dbFrame = await this.fetchFromDB(symbol, start, end, dbTimeframe);

    if (dbFrame && dbFrame.index.length >= MIN_BARS_THRESHOLD) {
      console.log(`[DBFirst] DB hit (intraday): ${symbol} → ${dbFrame.index.length} bars`);
      return dbFrame;
    }

    console.log(`[DBFirst] DB miss (intraday): ${symbol}, falling back to EODHD`);
    try {
      const eodhdFrame = await this.fetchFromEODHD(symbol, start, end, interval);
      if (eodhdFrame && eodhdFrame.index.length >= MIN_BARS_THRESHOLD) {
        return eodhdFrame;
      }
    } catch (err) {
      console.warn(`[DBFirst] EODHD intraday fallback failed for ${symbol}:`, err);
    }
    console.log(`[DBFirst] EODHD miss (intraday): ${symbol}, last-resort Yahoo`);
    return this.fetchFromYahoo(symbol, start, end, interval);
  }

  async loadBars(
    symbol: string,
    start: string,
    end: string,
    interval: string
  ): Promise<Bar[]> {
    console.log(`[DBFirst] Loading OHLCV bars for ${symbol}`);

    const dbBars = await this.fetchBarsFromDB(symbol, start, end, interval);
    if (dbBars.length >= MIN_BARS_THRESHOLD) {
      console.log(`[DBFirst] DB bars hit: ${symbol} → ${dbBars.length} bars`);
      return dbBars;
    }

    console.log(`[DBFirst] DB bars miss: ${symbol}, falling back to EODHD`);
    try {
      const eodhdBars = await this.fetchBarsFromEODHD(symbol, start, end, interval);
      if (eodhdBars.length >= MIN_BARS_THRESHOLD) {
        return eodhdBars;
      }
    } catch (err) {
      console.warn(`[DBFirst] EODHD bars fallback failed for ${symbol}:`, err);
    }
    console.log(`[DBFirst] EODHD bars miss: ${symbol}, last-resort Yahoo`);
    return this.fetchBarsFromYahoo(symbol, start, end, interval);
  }

  async loadFX(
    pair: string,
    start: string,
    end: string,
    interval: '1m' | '5m' | '1h' | '1d' = '1d'
  ): Promise<PriceFrame> {
    // FX pairs in DB may be stored as EURUSD, EUR-USD, etc.
    const dbFrame = await this.fetchFromDB(pair, start, end, interval);
    if (dbFrame && dbFrame.index.length >= MIN_BARS_THRESHOLD) {
      return dbFrame;
    }

    // Fallback: EODHD first, then Yahoo as last resort
    try {
      const eodhdFrame = await this.fetchFromEODHD(pair, start, end, interval);
      if (eodhdFrame && eodhdFrame.index.length >= MIN_BARS_THRESHOLD) {
        return eodhdFrame;
      }
    } catch (err) {
      console.warn(`[DBFirst] EODHD FX fallback failed for ${pair}:`, err);
    }
    const yahooSymbol = pair.includes('=X') ? pair : `${pair}=X`;
    return this.fetchFromYahoo(yahooSymbol, start, end, interval);
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const t = Date.now();
    try {
      const resp = await fetch(
        `${this.supabaseUrl}/rest/v1/historical_prices?select=symbol&limit=1`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          }
        }
      );
      return { ok: resp.ok, latencyMs: Date.now() - t };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - t, error: String(err) };
    }
  }

  // ─── Private: DB fetch ───────────────────────────────────────────────

  private async fetchFromDB(
    symbol: string,
    start: string,
    end: string,
    timeframe: string
  ): Promise<PriceFrame | null> {
    try {
      const url = new URL(`${this.supabaseUrl}/rest/v1/historical_prices`);
      url.searchParams.set('select', 'date,open,high,low,close,volume');
      url.searchParams.set('symbol', `eq.${symbol}`);
      url.searchParams.set('timeframe', `eq.${timeframe}`);
      url.searchParams.set('date', `gte.${start}`);
      // Use a second filter for end date
      url.searchParams.append('date', `lte.${end}`);
      url.searchParams.set('order', 'date.asc');
      url.searchParams.set('limit', '5000');

      const resp = await fetch(url.toString(), {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) return null;

      const rows: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number | null }> = await resp.json();
      if (!rows || rows.length === 0) return null;

      return {
        index: rows.map(r => r.date),
        columns: [symbol],
        data: rows.map(r => [r.close]),
        meta: { provider: 'supabase-db', bars: rows.length }
      };
    } catch (err) {
      console.warn(`[DBFirst] DB query error for ${symbol}:`, err);
      return null;
    }
  }

  private async fetchBarsFromDB(
    symbol: string,
    start: string,
    end: string,
    timeframe: string
  ): Promise<Bar[]> {
    try {
      const url = new URL(`${this.supabaseUrl}/rest/v1/historical_prices`);
      url.searchParams.set('select', 'date,open,high,low,close,volume');
      url.searchParams.set('symbol', `eq.${symbol}`);
      url.searchParams.set('timeframe', `eq.${timeframe}`);
      url.searchParams.set('date', `gte.${start}`);
      url.searchParams.append('date', `lte.${end}`);
      url.searchParams.set('order', 'date.asc');
      url.searchParams.set('limit', '5000');

      const resp = await fetch(url.toString(), {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) return [];

      const rows: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number | null }> = await resp.json();
      return rows.map(r => ({
        t: r.date,
        o: r.open,
        h: r.high,
        l: r.low,
        c: r.close,
        v: r.volume ?? 0
      }));
    } catch {
      return [];
    }
  }

  // ─── Private: Yahoo fallback ─────────────────────────────────────────

  private async fetchFromYahoo(
    symbol: string,
    start: string,
    end: string,
    interval: string
  ): Promise<PriceFrame> {
    const resp = await fetch(
      `${this.supabaseUrl}/functions/v1/fetch-yahoo-finance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({ symbol, startDate: start, endDate: end, interval })
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(`Yahoo Finance error: ${err.error || resp.statusText}`);
    }

    return resp.json();
  }

  private async fetchBarsFromYahoo(
    symbol: string,
    start: string,
    end: string,
    interval: string
  ): Promise<Bar[]> {
    const resp = await fetch(
      `${this.supabaseUrl}/functions/v1/fetch-yahoo-finance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({ symbol, startDate: start, endDate: end, interval, includeOhlc: true })
      }
    );

    if (!resp.ok) {
      throw new Error(`Yahoo Finance error for bars: ${resp.statusText}`);
    }

    const data = await resp.json();
    return data.bars || [];
  }

  // ─── Private: merge ──────────────────────────────────────────────────

  private mergeFrames(frames: PriceFrame[], symbols: string[]): PriceFrame {
    const allDates = new Set<string>();
    frames.forEach(f => f.index.forEach(d => allDates.add(d)));
    const sorted = Array.from(allDates).sort();

    const maps = frames.map(f => {
      const m = new Map<string, number>();
      f.index.forEach((d, i) => m.set(d, f.data[i][0]));
      return m;
    });

    return {
      index: sorted,
      columns: symbols,
      data: sorted.map(d => maps.map(m => m.get(d) ?? NaN)),
      meta: { provider: 'supabase-db+yahoo', merged: true }
    };
  }
}

export function createSupabaseDBFirstAdapter(config: ProviderConfig): DataProvider {
  return new SupabaseDBFirstAdapter(config);
}

export { DB_FIRST_CAPABILITIES };
