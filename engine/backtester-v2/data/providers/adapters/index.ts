/**
 * Provider Adapters Index
 * 
 * Export all provider adapters and register them with the ProviderRegistry.
 * Import this file to ensure all providers are registered.
 */

import { ProviderRegistry } from "../../providerRegistry";
import { createYahooFinanceAdapter, YAHOO_CAPABILITIES } from "./YahooFinanceAdapter";
import { createEODHDAdapter, EODHD_CAPABILITIES } from "./EODHDAdapter";

// Register all built-in providers
export function registerBuiltInProviders(): void {
  ProviderRegistry.register('yahoo', createYahooFinanceAdapter, YAHOO_CAPABILITIES);
  ProviderRegistry.register('eodhd', createEODHDAdapter, EODHD_CAPABILITIES);
  
  console.log('[Providers] Registered built-in providers:', ProviderRegistry.listProviderIds().join(', '));
}

// Auto-register on import
registerBuiltInProviders();

// Re-export for direct use
export { createYahooFinanceAdapter, YAHOO_CAPABILITIES } from "./YahooFinanceAdapter";
export { createEODHDAdapter, EODHD_CAPABILITIES } from "./EODHDAdapter";
