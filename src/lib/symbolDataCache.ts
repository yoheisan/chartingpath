import type { CompressedBar } from '@/types/VisualSpec';

/**
 * In-memory LRU cache for symbol OHLCV data.
 * Keeps the last N symbols in memory for instant chart switching.
 * Falls through to DB/API on cache miss.
 */
class SymbolDataLRUCache {
  private cache = new Map<string, { bars: CompressedBar[]; ts: number }>();
  private maxEntries: number;
  private maxAgeMs: number;

  constructor(maxEntries = 30, maxAgeMs = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.maxAgeMs = maxAgeMs;
  }

  /**
   * Get cached bars for a symbol:timeframe key.
   * Returns null if not cached or expired.
   */
  get(key: string): CompressedBar[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiry
    if (Date.now() - entry.ts > this.maxAgeMs) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.bars;
  }

  /**
   * Store bars in cache. Evicts oldest entry if at capacity.
   */
  set(key: string, bars: CompressedBar[]): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(key, { bars, ts: Date.now() });
  }

  /**
   * Check if key exists and is fresh
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats for debugging
   */
  get stats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Global singleton — shared across all dashboard components.
 * 30 entries × ~500 bars × ~50 bytes ≈ 750KB max memory footprint.
 */
export const symbolDataCache = new SymbolDataLRUCache(30, 5 * 60 * 1000);
