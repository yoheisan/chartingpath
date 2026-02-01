/**
 * Provider Registry
 * 
 * Central registry for all data providers. This makes it easy to:
 * 1. Add new providers without changing existing code
 * 2. Query available providers and their capabilities
 * 3. Select the best provider for a given use case
 * 4. Swap providers at runtime
 * 
 * To add a new provider:
 * 1. Create a class implementing DataProvider interface
 * 2. Call ProviderRegistry.register() with your provider factory
 */

import { 
  DataProvider, 
  ProviderCapabilities, 
  ProviderConfig, 
  ProviderFactory,
  InstrumentType,
  Timeframe,
  CostTier
} from "./providerInterface";

interface RegisteredProvider {
  factory: ProviderFactory;
  capabilities: ProviderCapabilities;
}

class ProviderRegistryClass {
  private providers = new Map<string, RegisteredProvider>();
  private activeInstances = new Map<string, DataProvider>();

  /**
   * Register a new provider
   */
  register(
    id: string, 
    factory: ProviderFactory, 
    capabilities: ProviderCapabilities
  ): void {
    if (this.providers.has(id)) {
      console.warn(`[ProviderRegistry] Overwriting existing provider: ${id}`);
    }
    this.providers.set(id, { factory, capabilities });
    console.log(`[ProviderRegistry] Registered provider: ${id}`);
  }

  /**
   * Unregister a provider
   */
  unregister(id: string): boolean {
    this.activeInstances.delete(id);
    return this.providers.delete(id);
  }

  /**
   * Get or create a provider instance
   */
  get(id: string, config: ProviderConfig): DataProvider {
    const registered = this.providers.get(id);
    if (!registered) {
      throw new Error(`Provider not found: ${id}. Available: ${this.listProviderIds().join(', ')}`);
    }

    // Check if we have a cached instance with same config
    const cacheKey = `${id}:${JSON.stringify(config)}`;
    let instance = this.activeInstances.get(cacheKey);
    
    if (!instance) {
      instance = registered.factory(config);
      this.activeInstances.set(cacheKey, instance);
    }

    return instance;
  }

  /**
   * List all registered provider IDs
   */
  listProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get capabilities for a specific provider
   */
  getCapabilities(id: string): ProviderCapabilities | null {
    return this.providers.get(id)?.capabilities ?? null;
  }

  /**
   * Get all provider capabilities
   */
  getAllCapabilities(): Map<string, ProviderCapabilities> {
    const result = new Map<string, ProviderCapabilities>();
    this.providers.forEach((p, id) => result.set(id, p.capabilities));
    return result;
  }

  /**
   * Find providers that support a specific instrument type
   */
  findByInstrument(type: InstrumentType): ProviderCapabilities[] {
    return Array.from(this.providers.values())
      .filter(p => p.capabilities.instruments.includes(type))
      .map(p => p.capabilities);
  }

  /**
   * Find providers that support a specific timeframe
   */
  findByTimeframe(timeframe: Timeframe): ProviderCapabilities[] {
    return Array.from(this.providers.values())
      .filter(p => p.capabilities.timeframes.includes(timeframe))
      .map(p => p.capabilities);
  }

  /**
   * Find providers by cost tier
   */
  findByCostTier(tier: CostTier): ProviderCapabilities[] {
    return Array.from(this.providers.values())
      .filter(p => p.capabilities.costTier === tier)
      .map(p => p.capabilities);
  }

  /**
   * Find the best provider for a given use case
   */
  findBest(criteria: {
    instrument?: InstrumentType;
    timeframe?: Timeframe;
    preferFree?: boolean;
    requireCommercialLicense?: boolean;
    requireOHLCV?: boolean;
  }): ProviderCapabilities | null {
    let candidates = Array.from(this.providers.values()).map(p => p.capabilities);

    // Filter by instrument
    if (criteria.instrument) {
      candidates = candidates.filter(c => c.instruments.includes(criteria.instrument!));
    }

    // Filter by timeframe
    if (criteria.timeframe) {
      candidates = candidates.filter(c => c.timeframes.includes(criteria.timeframe!));
    }

    // Filter by commercial license
    if (criteria.requireCommercialLicense) {
      candidates = candidates.filter(c => c.commercialLicenseOk);
    }

    // Filter by OHLCV support
    if (criteria.requireOHLCV) {
      candidates = candidates.filter(c => c.supportsOHLCV);
    }

    if (candidates.length === 0) return null;

    // Sort by preference
    candidates.sort((a, b) => {
      // Prefer free if requested
      if (criteria.preferFree) {
        const costOrder = { free: 0, freemium: 1, paid: 2, enterprise: 3 };
        const aCost = costOrder[a.costTier] ?? 9;
        const bCost = costOrder[b.costTier] ?? 9;
        if (aCost !== bCost) return aCost - bCost;
      }

      // Otherwise prefer more historical data
      return b.maxHistoricalDays - a.maxHistoricalDays;
    });

    return candidates[0];
  }

  /**
   * Clear all cached instances (useful for testing)
   */
  clearInstances(): void {
    this.activeInstances.clear();
  }
}

// Singleton instance
export const ProviderRegistry = new ProviderRegistryClass();
