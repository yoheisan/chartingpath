/**
 * Provider Adapters Index
 * 
 * Export all provider adapters and register them with the ProviderRegistry.
 * Import this file to ensure all providers are registered.
 */

import { ProviderRegistry } from "../../providerRegistry";
import { createYahooFinanceAdapter, YAHOO_CAPABILITIES } from "./YahooFinanceAdapter";
import { createEODHDAdapter, EODHD_CAPABILITIES } from "./EODHDAdapter";
import { createSupabaseDBFirstAdapter, DB_FIRST_CAPABILITIES } from "./SupabaseDBFirstAdapter";

// Register all built-in providers
export function registerBuiltInProviders(): void {
  ProviderRegistry.register('supabase-db', createSupabaseDBFirstAdapter, DB_FIRST_CAPABILITIES);
  ProviderRegistry.register('yahoo', createYahooFinanceAdapter, YAHOO_CAPABILITIES);
  ProviderRegistry.register('eodhd', createEODHDAdapter, EODHD_CAPABILITIES);
  
  console.log('[Providers] Registered built-in providers:', ProviderRegistry.listProviderIds().join(', '));
}

// Auto-register on import
registerBuiltInProviders();

// Re-export for direct use
export { createYahooFinanceAdapter, YAHOO_CAPABILITIES } from "./YahooFinanceAdapter";
export { createEODHDAdapter, EODHD_CAPABILITIES } from "./EODHDAdapter";
export { createSupabaseDBFirstAdapter, DB_FIRST_CAPABILITIES } from "./SupabaseDBFirstAdapter";
