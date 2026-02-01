/**
 * Data Module Public API
 * 
 * This is the main entry point for the data module.
 * Import from here to get access to all data-related functionality.
 */

// Core types
export type { PriceFrame, Bar, ISODate, BacktestResult } from "./types";

// Provider interface and types
export type { 
  DataProvider, 
  ProviderCapabilities, 
  ProviderConfig,
  ProviderFactory,
  InstrumentType,
  Timeframe,
  CostTier
} from "./providerInterface";

// Provider registry
export { ProviderRegistry } from "./providerRegistry";

// Data service (primary interface)
export { DataService } from "./dataService";
export type { DataServiceConfig } from "./dataService";

// Provider adapters (for direct use if needed)
export { 
  createYahooFinanceAdapter, 
  YAHOO_CAPABILITIES 
} from "./providers/adapters/YahooFinanceAdapter";

export { 
  createEODHDAdapter, 
  EODHD_CAPABILITIES 
} from "./providers/adapters/EODHDAdapter";

// Legacy exports for backward compatibility
export type { PriceProvider, CacheStore } from "./provider";
export { keyOf } from "./provider";
