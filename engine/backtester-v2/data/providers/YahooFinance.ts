import { PriceProvider } from "../provider";
import { PriceFrame } from "../types";

export interface YahooFinanceConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export class YahooFinanceProvider implements PriceProvider {
  constructor(private config: YahooFinanceConfig) {}

  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    console.log(`[YahooFinance] Loading EOD data for ${symbols.length} symbols`);
    
    // Yahoo Finance works best with one symbol at a time
    if (symbols.length === 1) {
      return this.fetchSingleSymbol(symbols[0], start, end, '1d');
    }

    // For multiple symbols, fetch in parallel
    const frames = await Promise.all(
      symbols.map(symbol => this.fetchSingleSymbol(symbol, start, end, '1d'))
    );

    // Merge frames
    return this.mergeFrames(frames, symbols);
  }

  async loadIntraday(
    symbol: string, 
    start: string, 
    end: string, 
    interval: "1m" | "5m"
  ): Promise<PriceFrame> {
    console.log(`[YahooFinance] Loading intraday data for ${symbol} with ${interval} interval`);
    
    // Yahoo Finance intraday intervals: 1m, 2m, 5m, 15m, 30m, 60m, 90m
    const yahooInterval = interval === "1m" ? "1m" : "5m";
    return this.fetchSingleSymbol(symbol, start, end, yahooInterval);
  }

  async loadFX(
    pair: string, 
    start: string, 
    end: string, 
    interval: "1m" | "5m" | "1h" = "1h"
  ): Promise<PriceFrame> {
    console.log(`[YahooFinance] Loading FX data for ${pair}`);
    
    // Yahoo Finance uses format like EURUSD=X for forex pairs
    const yahooSymbol = pair.includes('=X') ? pair : `${pair}=X`;
    
    const yahooInterval = interval === "1m" ? "1m" : interval === "5m" ? "5m" : "1h";
    return this.fetchSingleSymbol(yahooSymbol, start, end, yahooInterval);
  }

  private async fetchSingleSymbol(
    symbol: string,
    start: string,
    end: string,
    interval: string
  ): Promise<PriceFrame> {
    try {
      const response = await fetch(
        `${this.config.supabaseUrl}/functions/v1/fetch-yahoo-finance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.supabaseKey}`,
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch from Yahoo Finance');
      }

      const data = await response.json();
      return data as PriceFrame;
    } catch (error) {
      console.error(`[YahooFinance] Error fetching ${symbol}:`, error);
      throw error;
    }
  }

  private mergeFrames(frames: PriceFrame[], symbols: string[]): PriceFrame {
    if (frames.length === 0) {
      throw new Error('No frames to merge');
    }

    // Find all unique dates across all frames
    const allDates = new Set<string>();
    frames.forEach(frame => {
      frame.index.forEach(date => allDates.add(date));
    });

    const sortedDates = Array.from(allDates).sort();

    // Create price maps for each symbol
    const priceMaps = frames.map(frame => {
      const map = new Map<string, number>();
      frame.index.forEach((date, idx) => {
        map.set(date, frame.data[idx][0]);
      });
      return map;
    });

    // Build merged data array
    const mergedData = sortedDates.map(date => {
      return priceMaps.map(priceMap => priceMap.get(date) || NaN);
    });

    return {
      index: sortedDates,
      columns: symbols,
      data: mergedData,
      meta: {
        provider: 'yahoo_finance',
        merged: true,
        symbolCount: symbols.length
      }
    };
  }
}
