/**
 * Unified Data Service
 * 
 * This is the PRIMARY interface for fetching market data across the application.
 * It abstracts away provider details and handles:
 * - Provider selection based on instrument/timeframe
 * - Automatic fallback on failure
 * - Caching (future)
 * - Rate limiting (future)
 * 
 * Usage:
 *   const dataService = new DataService(config);
 *   const prices = await dataService.getEOD(['AAPL', 'MSFT'], '2023-01-01', '2024-01-01');
 */

import { ProviderRegistry } from "./providerRegistry";
import { DataProvider, ProviderConfig, InstrumentType, Timeframe } from "./providerInterface";
import { PriceFrame, Bar } from "./types";

// Ensure providers are registered
import "./providers/adapters";

export interface DataServiceConfig {
  /** Default provider to use */
  defaultProvider: string;
  
  /** Supabase URL for edge function providers */
  supabaseUrl: string;
  
  /** Supabase anon key */
  supabaseKey: string;
  
  /** API keys for paid providers */
  apiKeys?: {
    eodhd?: string;
    twelveData?: string;
    alphaVantage?: string;
    polygon?: string;
  };
  
  /** Whether to enable automatic fallback */
  enableFallback?: boolean;
  
  /** Fallback provider order */
  fallbackOrder?: string[];
}

export class DataService {
  private config: DataServiceConfig;
  private providerCache = new Map<string, DataProvider>();

  constructor(config: DataServiceConfig) {
    this.config = {
      enableFallback: true,
      fallbackOrder: ['yahoo', 'eodhd'],
      ...config
    };
  }

  /**
   * Get the active provider instance
   */
  getProvider(providerId?: string): DataProvider {
    const id = providerId || this.config.defaultProvider;
    
    if (this.providerCache.has(id)) {
      return this.providerCache.get(id)!;
    }

    const providerConfig = this.buildProviderConfig(id);
    const provider = ProviderRegistry.get(id, providerConfig);
    this.providerCache.set(id, provider);
    
    return provider;
  }

  /**
   * Get end-of-day prices for multiple symbols
   */
  async getEOD(
    symbols: string[], 
    start: string, 
    end: string,
    options?: { provider?: string }
  ): Promise<PriceFrame> {
    const providerId = options?.provider || this.config.defaultProvider;
    
    try {
      const provider = this.getProvider(providerId);
      return await provider.loadEOD(symbols, start, end);
    } catch (error) {
      console.error(`[DataService] ${providerId} failed:`, error);
      
      if (this.config.enableFallback) {
        return this.tryFallback('loadEOD', [symbols, start, end], providerId);
      }
      
      throw error;
    }
  }

  /**
   * Get intraday prices for a symbol
   */
  async getIntraday(
    symbol: string,
    start: string,
    end: string,
    interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h',
    options?: { provider?: string }
  ): Promise<PriceFrame> {
    const providerId = options?.provider || this.config.defaultProvider;
    
    try {
      const provider = this.getProvider(providerId);
      return await provider.loadIntraday(symbol, start, end, interval);
    } catch (error) {
      console.error(`[DataService] ${providerId} intraday failed:`, error);
      
      if (this.config.enableFallback) {
        return this.tryFallback('loadIntraday', [symbol, start, end, interval], providerId);
      }
      
      throw error;
    }
  }

  /**
   * Get OHLCV bars for charting/pattern detection
   */
  async getBars(
    symbol: string,
    start: string,
    end: string,
    interval: Timeframe,
    options?: { provider?: string }
  ): Promise<Bar[]> {
    const providerId = options?.provider || this.config.defaultProvider;
    const provider = this.getProvider(providerId);
    
    if (!provider.loadBars) {
      throw new Error(`Provider ${providerId} does not support OHLCV bars`);
    }
    
    return provider.loadBars(symbol, start, end, interval);
  }

  /**
   * Get FX pair data
   */
  async getFX(
    pair: string,
    start: string,
    end: string,
    interval: '1m' | '5m' | '1h' | '1d' = '1d',
    options?: { provider?: string }
  ): Promise<PriceFrame> {
    const providerId = options?.provider || this.config.defaultProvider;
    const provider = this.getProvider(providerId);
    
    if (!provider.loadFX) {
      throw new Error(`Provider ${providerId} does not support FX data`);
    }
    
    return provider.loadFX(pair, start, end, interval);
  }

  /**
   * Find the best provider for a specific use case
   */
  findBestProvider(criteria: {
    instrument?: InstrumentType;
    timeframe?: Timeframe;
    preferFree?: boolean;
    requireCommercialLicense?: boolean;
  }): string | null {
    const best = ProviderRegistry.findBest(criteria);
    return best?.id ?? null;
  }

  /**
   * List all available providers
   */
  listProviders(): string[] {
    return ProviderRegistry.listProviderIds();
  }

  /**
   * Get capabilities for a provider
   */
  getProviderCapabilities(providerId: string) {
    return ProviderRegistry.getCapabilities(providerId);
  }

  /**
   * Health check all providers
   */
  async healthCheckAll(): Promise<Record<string, { ok: boolean; latencyMs: number; error?: string }>> {
    const results: Record<string, { ok: boolean; latencyMs: number; error?: string }> = {};
    
    for (const id of this.listProviders()) {
      try {
        const provider = this.getProvider(id);
        if (provider.healthCheck) {
          results[id] = await provider.healthCheck();
        } else {
          results[id] = { ok: true, latencyMs: 0, error: 'No health check available' };
        }
      } catch (error) {
        results[id] = { 
          ok: false, 
          latencyMs: 0, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
    
    return results;
  }

  /**
   * Switch the default provider
   */
  setDefaultProvider(providerId: string): void {
    if (!ProviderRegistry.getCapabilities(providerId)) {
      throw new Error(`Unknown provider: ${providerId}`);
    }
    this.config.defaultProvider = providerId;
    console.log(`[DataService] Switched default provider to: ${providerId}`);
  }

  private buildProviderConfig(providerId: string): ProviderConfig {
    const base: ProviderConfig = {
      type: providerId,
      supabaseUrl: this.config.supabaseUrl,
      supabaseKey: this.config.supabaseKey,
    };

    // Add API keys if available
    switch (providerId) {
      case 'eodhd':
        base.apiKey = this.config.apiKeys?.eodhd;
        break;
      case 'twelveData':
        base.apiKey = this.config.apiKeys?.twelveData;
        break;
      case 'alphaVantage':
        base.apiKey = this.config.apiKeys?.alphaVantage;
        break;
      case 'polygon':
        base.apiKey = this.config.apiKeys?.polygon;
        break;
    }

    return base;
  }

  private async tryFallback(
    method: 'loadEOD' | 'loadIntraday',
    args: any[],
    failedProvider: string
  ): Promise<PriceFrame> {
    const fallbackOrder = this.config.fallbackOrder || [];
    
    for (const providerId of fallbackOrder) {
      if (providerId === failedProvider) continue;
      
      try {
        console.log(`[DataService] Trying fallback provider: ${providerId}`);
        const provider = this.getProvider(providerId);
        
        if (method === 'loadEOD') {
          return await provider.loadEOD(args[0], args[1], args[2]);
        } else {
          return await provider.loadIntraday(args[0], args[1], args[2], args[3]);
        }
      } catch (error) {
        console.warn(`[DataService] Fallback ${providerId} also failed:`, error);
      }
    }
    
    throw new Error(`All providers failed for ${method}`);
  }
}
