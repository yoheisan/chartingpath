/**
 * Market Data Provider Adapter (Frontend)
 * 
 * This is the frontend-facing adapter that uses the new DataService.
 * It maintains backward compatibility while leveraging the modular provider system.
 */

import { DataService, DataServiceConfig, PriceFrame } from "../../engine/backtester-v2/data";

const SUPABASE_URL = "https://dgznlsckoamseqcpzfqm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8";

/**
 * Market Data Provider using the new modular DataService
 * 
 * Switching providers is now as simple as:
 *   marketDataProvider.setProvider('eodhd');
 * 
 * Or for a specific request:
 *   await marketDataProvider.loadEOD(['AAPL'], start, end, { provider: 'eodhd' });
 */
export class MarketDataProvider {
  private dataService: DataService;

  constructor(config?: Partial<DataServiceConfig>) {
    this.dataService = new DataService({
      defaultProvider: 'yahoo',
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY,
      enableFallback: true,
      fallbackOrder: ['yahoo', 'eodhd'],
      ...config
    });
  }

  /**
   * Set the active data provider
   */
  setProvider(provider: 'yahoo' | 'eodhd' | 'twelveData' | 'alphaVantage' | 'polygon'): void {
    this.dataService.setDefaultProvider(provider);
  }

  /**
   * Get the current default provider
   */
  getCurrentProvider(): string {
    return this.dataService.listProviders()[0] || 'yahoo';
  }

  /**
   * List all available providers
   */
  listAvailableProviders(): string[] {
    return this.dataService.listProviders();
  }

  /**
   * Get capabilities for a provider
   */
  getProviderCapabilities(providerId: string) {
    return this.dataService.getProviderCapabilities(providerId);
  }

  /**
   * Load end-of-day data
   */
  async loadEOD(
    symbols: string[], 
    start: string, 
    end: string,
    options?: { provider?: string }
  ): Promise<PriceFrame> {
    console.log(`[MarketDataProvider] Loading EOD for ${symbols.join(', ')}`);
    return this.dataService.getEOD(symbols, start, end, options);
  }

  /**
   * Load intraday data
   */
  async loadIntraday(
    symbol: string, 
    start: string, 
    end: string, 
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h",
    options?: { provider?: string }
  ): Promise<PriceFrame> {
    console.log(`[MarketDataProvider] Loading intraday ${interval} for ${symbol}`);
    return this.dataService.getIntraday(symbol, start, end, interval, options);
  }

  /**
   * Load FX data
   */
  async loadFX(
    pair: string, 
    start: string, 
    end: string, 
    interval: "1m" | "5m" | "1h" | "1d" = "1h",
    options?: { provider?: string }
  ): Promise<PriceFrame> {
    console.log(`[MarketDataProvider] Loading FX for ${pair}`);
    return this.dataService.getFX(pair, start, end, interval, options);
  }

  /**
   * Health check all providers
   */
  async healthCheck(): Promise<Record<string, { ok: boolean; latencyMs: number; error?: string }>> {
    return this.dataService.healthCheckAll();
  }

  /**
   * Find best provider for a use case
   */
  findBestProvider(criteria: {
    instrument?: 'stock' | 'etf' | 'forex' | 'crypto' | 'index';
    timeframe?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1wk' | '1mo';
    preferFree?: boolean;
    requireCommercialLicense?: boolean;
  }): string | null {
    return this.dataService.findBestProvider(criteria);
  }
}

// Legacy class name for backward compatibility
export class SupabaseMarketDataProvider extends MarketDataProvider {
  constructor(userPlan?: 'free' | 'starter' | 'pro' | 'elite') {
    super();
    // User plan could influence default provider selection
    if (userPlan === 'pro' || userPlan === 'elite') {
      // Pro/elite users might prefer paid providers
      console.log(`[MarketDataProvider] User plan: ${userPlan}`);
    }
  }
}

// Singleton instance for easy import
export const marketDataProvider = new MarketDataProvider();
