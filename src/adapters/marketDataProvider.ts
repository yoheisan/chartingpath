import { supabase } from "@/integrations/supabase/client";
import { PriceFrame } from "../../engine/backtester-v2/data/types";
import { MockProvider } from "../../engine/backtester-v2/data/providers/MockProvider";

export class SupabaseMarketDataProvider {
  private mockProvider: MockProvider | null = null;

  private generateMockData(symbols: string[], start: string, end: string): PriceFrame {
    console.log('Generating mock data for symbols:', symbols);
    
    // Generate realistic price data for common instruments
    const dates: string[] = [];
    const data: number[][] = [];
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Generate daily data
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push(currentDate.toISOString().split('T')[0]);
      
      // Generate prices for each symbol with realistic variations
      const prices = symbols.map((symbol, idx) => {
        const basePrice = symbol.includes('USD') ? 1.1000 : 100.0;
        const trend = i * 0.0001; // Slight upward trend
        const volatility = (Math.random() - 0.5) * 0.02; // 2% daily volatility
        return basePrice + trend + (basePrice * volatility);
      });
      
      data.push(prices);
    }
    
    return {
      index: dates,
      columns: symbols,
      data: data,
      meta: { provider: 'mock', note: 'Fallback synthetic data' }
    };
  }

  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    console.log(`Loading EOD data for symbols: ${symbols.join(', ')} from ${start} to ${end}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-data', {
        body: {
          symbols,
          start,
          end,
          type: 'eod'
        }
      });

      if (error) {
        console.warn('Market data fetch error, falling back to mock data:', error);
        return this.generateMockData(symbols, start, end);
      }

      if (!data || !data.index || data.index.length === 0) {
        console.warn('No data returned from market data service, using mock data');
        return this.generateMockData(symbols, start, end);
      }

      console.log(`Received price frame with ${data.index?.length || 0} dates`);
      return data as PriceFrame;
    } catch (err) {
      console.warn('Failed to fetch market data, using mock data:', err);
      return this.generateMockData(symbols, start, end);
    }
  }

  async loadIntraday(symbol: string, start: string, end: string, interval: "1m"|"5m"): Promise<PriceFrame> {
    // For now, EODHD doesn't support intraday in our setup
    throw new Error("Intraday data not supported with EODHD provider");
  }

  async loadFX(pair: string, start: string, end: string, interval: "1m"|"5m"|"1h" = "1h"): Promise<PriceFrame> {
    // FX pairs would need different handling
    return this.loadEOD([pair], start, end);
  }
}

export const marketDataProvider = new SupabaseMarketDataProvider();