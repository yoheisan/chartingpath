import { PriceProvider } from "./provider";
import { DukascopyProvider } from "./providers/Dukascopy";
import { EODHDProvider } from "./providers/EODHD";
import { TwelveDataProvider } from "./providers/Twelve";
import { MockProvider } from "./providers/MockProvider";
import { YahooFinanceProvider, YahooFinanceConfig } from "./providers/YahooFinance";

export type ProviderType = "yahoo" | "dukascopy" | "eodhd" | "twelve" | "alphavantage" | "finnhub" | "mock";

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

/**
 * Provider Factory - Creates data providers based on configuration
 * 
 * Provider Tiers:
 * - Free Tier: Yahoo Finance (unlimited), Dukascopy (forex only)
 * - Paid Tier: Alpha Vantage, EODHD, Twelve Data, Finnhub
 * 
 * Recommended Usage:
 * - Starter/Free Users: Yahoo Finance (stocks), Dukascopy (forex)
 * - Pro Users: Alpha Vantage or Twelve Data
 * - Elite Users: EODHD or Finnhub (premium data)
 */
export function createProvider(config: ProviderConfig): PriceProvider {
  switch (config.type) {
    case "yahoo":
      // Yahoo Finance - Free, unlimited, best for stocks
      if (!config.supabaseUrl || !config.supabaseKey) {
        throw new Error("Yahoo Finance provider requires Supabase configuration");
      }
      return new YahooFinanceProvider({
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey
      });
      
    case "dukascopy":
      // Dukascopy - Free, forex only, high quality tick data
      const dataDir = process.env.DUKASCOPY_DATA_DIR || "./data/dukascopy";
      return new DukascopyProvider(dataDir);
      
    case "eodhd":
      // EODHD - Paid, reliable, good for stocks and ETFs
      if (!config.apiKey) throw new Error("EODHD requires API key");
      return new EODHDProvider(config.apiKey);
      
    case "twelve":
      // Twelve Data - Paid, good balance of features
      if (!config.apiKey) throw new Error("TwelveData requires API key");
      return new TwelveDataProvider(config.apiKey);
      
    case "alphavantage":
      // Alpha Vantage - Free tier available (500 calls/day), good for stocks
      // Note: Implementation pending
      throw new Error("Alpha Vantage provider not yet implemented");
      
    case "finnhub":
      // Finnhub - Free tier available (60 calls/min), real-time data
      // Note: Implementation pending
      throw new Error("Finnhub provider not yet implemented");
      
    case "mock":
      // Mock provider for testing
      return new MockProvider({});
      
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}

/**
 * Get recommended provider based on instrument type and user plan
 */
export function getRecommendedProvider(
  instrumentType: 'stock' | 'forex' | 'crypto' | 'etf',
  userPlan: 'free' | 'starter' | 'pro' | 'elite'
): ProviderType {
  // Free/Starter users - use free providers
  if (userPlan === 'free' || userPlan === 'starter') {
    return instrumentType === 'forex' ? 'dukascopy' : 'yahoo';
  }
  
  // Pro users - use Alpha Vantage or Twelve Data
  if (userPlan === 'pro') {
    return 'twelve';
  }
  
  // Elite users - use premium providers
  return instrumentType === 'forex' ? 'dukascopy' : 'eodhd';
}

/**
 * Provider capabilities matrix
 */
export const PROVIDER_CAPABILITIES = {
  yahoo: {
    instruments: ['stock', 'etf', 'index', 'forex', 'crypto'],
    timeframes: ['1m', '2m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'],
    historicalDays: 7300, // ~20 years daily
    intradayDays: 30, // 30 days intraday
    cost: 'free',
    rateLimit: 'unlimited',
    notes: 'Best free option for stocks, ETFs, and forex'
  },
  dukascopy: {
    instruments: ['forex'],
    timeframes: ['tick', '1m', '1h', '1d'],
    historicalDays: 5475, // ~15 years
    intradayDays: 0,
    cost: 'free',
    rateLimit: 'unlimited',
    notes: 'Excellent free forex data, tick-level precision'
  },
  twelve: {
    instruments: ['stock', 'etf', 'forex', 'crypto', 'index'],
    timeframes: ['1min', '5min', '15min', '30min', '1h', '4h', '1d', '1wk', '1mo'],
    historicalDays: 5000,
    intradayDays: 365,
    cost: 'paid',
    rateLimit: '800/day (free), 8000/day (paid)',
    notes: 'Good balance, free tier available'
  },
  eodhd: {
    instruments: ['stock', 'etf', 'forex', 'crypto', 'commodity'],
    timeframes: ['1d', '1wk', '1mo'],
    historicalDays: 10950, // ~30 years
    intradayDays: 0,
    cost: 'paid',
    rateLimit: '100,000/day',
    notes: 'Premium quality, excellent for stocks and ETFs'
  }
};
