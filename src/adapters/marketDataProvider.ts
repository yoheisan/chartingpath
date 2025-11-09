import { supabase } from "@/integrations/supabase/client";
import { PriceFrame } from "../../engine/backtester-v2/data/types";
import { createProvider, getRecommendedProvider, PROVIDER_CAPABILITIES } from "../../engine/backtester-v2/data/providerFactory";

const SUPABASE_URL = "https://dgznlsckoamseqcpzfqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8";

/**
 * Multi-Provider Market Data Service
 * 
 * Supports multiple data providers with automatic fallback:
 * 1. Yahoo Finance (default) - Free, unlimited, best for stocks
 * 2. Dukascopy - Free, excellent for forex
 * 3. Alpha Vantage, EODHD, Twelve Data - Premium options
 * 
 * Provider selection is automatic based on:
 * - Instrument type (stock, forex, crypto)
 * - User subscription plan
 * - Data requirements
 */
export class SupabaseMarketDataProvider {
  private currentProvider: string = 'yahoo';
  private userPlan: 'free' | 'starter' | 'pro' | 'elite' = 'starter';

  constructor(userPlan?: 'free' | 'starter' | 'pro' | 'elite') {
    if (userPlan) {
      this.userPlan = userPlan;
    }
  }

  /**
   * Set the active data provider
   */
  setProvider(provider: 'yahoo' | 'dukascopy' | 'eodhd' | 'twelve' | 'alphavantage' | 'finnhub') {
    this.currentProvider = provider;
    console.log(`[DataProvider] Switched to ${provider}`);
  }

  /**
   * Get provider based on instrument type and user plan
   */
  private getProviderForInstrument(symbol: string): string {
    // Auto-detect instrument type from symbol
    let instrumentType: 'stock' | 'forex' | 'crypto' | 'etf' = 'stock';
    
    if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP') || symbol.includes('JPY')) {
      instrumentType = 'forex';
    } else if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USDT')) {
      instrumentType = 'crypto';
    } else if (symbol.includes('SPY') || symbol.includes('QQQ') || symbol.includes('IWM')) {
      instrumentType = 'etf';
    }

    // Get recommended provider
    const recommended = getRecommendedProvider(instrumentType, this.userPlan);
    
    console.log(`[DataProvider] Recommended provider for ${symbol} (${instrumentType}): ${recommended}`);
    
    return recommended;
  }

  /**
   * Load end-of-day data with automatic provider selection
   */
  async loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame> {
    console.log(`[DataProvider] Loading EOD data for ${symbols.join(', ')}`);
    
    // Determine best provider for first symbol (assume all same type)
    const providerType = this.currentProvider === 'yahoo' 
      ? this.getProviderForInstrument(symbols[0])
      : this.currentProvider;

    try {
      const provider = createProvider({
        type: providerType as any,
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY
      });

      const data = await provider.loadEOD(symbols, start, end);
      console.log(`[DataProvider] Successfully loaded ${data.index.length} days of data via ${providerType}`);
      return data;
      
    } catch (error) {
      console.error(`[DataProvider] Error with ${providerType}, trying fallback:`, error);
      
      // Fallback to Yahoo Finance if primary fails
      if (providerType !== 'yahoo') {
        try {
          console.log('[DataProvider] Falling back to Yahoo Finance');
          const yahooProvider = createProvider({
            type: 'yahoo',
            supabaseUrl: SUPABASE_URL,
            supabaseKey: SUPABASE_ANON_KEY
          });
          return await yahooProvider.loadEOD(symbols, start, end);
        } catch (yahooError) {
          console.error('[DataProvider] Yahoo Finance fallback failed:', yahooError);
        }
      }
      
      // No fallback - throw error so users know data fetch failed
      throw new Error(`Failed to fetch real market data for ${symbols.join(', ')}. Please try again or contact support.`);
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