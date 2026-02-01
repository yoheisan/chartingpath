/**
 * Provider Interface & Capabilities
 * 
 * This file defines the contract that ALL data providers must implement.
 * When adding a new provider, implement this interface and register it
 * in the ProviderRegistry.
 */

import { PriceFrame, Bar } from "./types";

// ============================================================================
// PROVIDER CAPABILITIES - What each provider can do
// ============================================================================

export type InstrumentType = 'stock' | 'etf' | 'forex' | 'crypto' | 'index' | 'commodity' | 'futures';
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1wk' | '1mo';
export type CostTier = 'free' | 'freemium' | 'paid' | 'enterprise';

export interface ProviderCapabilities {
  /** Unique provider identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Supported instrument types */
  instruments: InstrumentType[];
  
  /** Supported timeframes */
  timeframes: Timeframe[];
  
  /** Maximum historical days available */
  maxHistoricalDays: number;
  
  /** Maximum intraday history (days) */
  maxIntradayDays: number;
  
  /** Cost tier */
  costTier: CostTier;
  
  /** Rate limit description */
  rateLimit: string;
  
  /** Whether OHLCV bars are available (not just close prices) */
  supportsOHLCV: boolean;
  
  /** Whether real-time/streaming data is available */
  supportsRealtime: boolean;
  
  /** Whether this provider is suitable for commercial redistribution */
  commercialLicenseOk: boolean;
  
  /** Additional notes about the provider */
  notes?: string;
}

// ============================================================================
// PROVIDER INTERFACE - What each provider must implement
// ============================================================================

export interface DataProvider {
  /** Get provider capabilities */
  getCapabilities(): ProviderCapabilities;
  
  /** 
   * Load end-of-day close prices for multiple symbols
   * Returns a PriceFrame with close prices only
   */
  loadEOD(symbols: string[], start: string, end: string): Promise<PriceFrame>;
  
  /**
   * Load intraday close prices for a single symbol
   * @throws if timeframe not supported
   */
  loadIntraday(
    symbol: string, 
    start: string, 
    end: string, 
    interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h'
  ): Promise<PriceFrame>;
  
  /**
   * Load OHLCV bars (optional - not all providers support this)
   * Returns full bar data for charting/pattern detection
   */
  loadBars?(
    symbol: string, 
    start: string, 
    end: string, 
    interval: Timeframe
  ): Promise<Bar[]>;
  
  /**
   * Load FX pair data (optional - not all providers support forex)
   */
  loadFX?(
    pair: string, 
    start: string, 
    end: string, 
    interval?: '1m' | '5m' | '1h' | '1d'
  ): Promise<PriceFrame>;
  
  /**
   * Health check - verify API connectivity
   */
  healthCheck?(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}

// ============================================================================
// PROVIDER CONFIG - How providers are configured
// ============================================================================

export interface ProviderConfig {
  /** Provider type identifier */
  type: string;
  
  /** API key if required */
  apiKey?: string;
  
  /** Supabase URL for edge function providers */
  supabaseUrl?: string;
  
  /** Supabase anon key for edge function providers */
  supabaseKey?: string;
  
  /** Custom base URL override */
  baseUrl?: string;
  
  /** Request timeout in ms */
  timeoutMs?: number;
  
  /** Max retries on failure */
  maxRetries?: number;
  
  /** Additional provider-specific config */
  extra?: Record<string, unknown>;
}

// ============================================================================
// PROVIDER FACTORY TYPE
// ============================================================================

export type ProviderFactory = (config: ProviderConfig) => DataProvider;
