import { supabase } from "@/integrations/supabase/client";
import { PriceFrame } from "../../engine/backtester-v2/data/types";

export class SupabaseMarketDataProvider {
  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    console.log(`Loading EOD data for symbols: ${symbols.join(', ')} from ${start} to ${end}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-market-data', {
      body: {
        symbols,
        start,
        end,
        type: 'eod'
      }
    });

    if (error) {
      console.error('Market data fetch error:', error);
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from market data service');
    }

    console.log(`Received price frame with ${data.index?.length || 0} dates`);
    return data as PriceFrame;
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