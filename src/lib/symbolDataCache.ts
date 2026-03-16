import type { CompressedBar } from '@/types/VisualSpec';

/**
 * In-memory LRU cache for symbol OHLCV data.
 * 
 * ACCUMULATING MODE (v2):
 * Instead of replacing bars on each write, new bars are merged into the
 * existing dataset:
 *   - New timestamps are appended
 *   - Existing timestamps are updated (latest OHLCV wins — handles forming candles)
 *   - Result is always sorted chronologically
 * 
 * This allows the chart to grow over time within a session while keeping
 * the memory footprint bounded by maxBarsPerKey.
 */
class SymbolDataLRUCache {
  private cache = new Map<string, { bars: CompressedBar[]; ts: number }>();
  private maxEntries: number;
  private maxAgeMs: number;
  private maxBarsPerKey: number;

  constructor(maxEntries = 30, maxAgeMs = 5 * 60 * 1000, maxBarsPerKey = 2000) {
    this.maxEntries = maxEntries;
    this.maxAgeMs = maxAgeMs;
    this.maxBarsPerKey = maxBarsPerKey;
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
   * Merge new bars into the cache for a given key.
   * - Existing candles are updated with the latest OHLCV values
   * - New candles are appended
   * - Result is sorted by timestamp and trimmed to maxBarsPerKey
   */
  set(key: string, incomingBars: CompressedBar[]): void {
    // Evict oldest if at capacity and this is a new key
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }

    const existing = this.cache.get(key);

    if (!existing || existing.bars.length === 0) {
      // No prior data — store directly (trim to cap)
      const trimmed = incomingBars.length > this.maxBarsPerKey
        ? incomingBars.slice(incomingBars.length - this.maxBarsPerKey)
        : incomingBars;
      this.cache.set(key, { bars: trimmed, ts: Date.now() });
      return;
    }

    // Merge: build a map keyed by timestamp, incoming wins on conflict
    const barMap = new Map<string, CompressedBar>();
    for (const bar of existing.bars) {
      barMap.set(bar.t, bar);
    }
    for (const bar of incomingBars) {
      barMap.set(bar.t, bar); // update existing or add new
    }

    // Sort chronologically
    let merged = Array.from(barMap.values()).sort((a, b) => {
      if (a.t < b.t) return -1;
      if (a.t > b.t) return 1;
      return 0;
    });

    // Trim to cap — keep the most recent bars
    if (merged.length > this.maxBarsPerKey) {
      merged = merged.slice(merged.length - this.maxBarsPerKey);
    }

    this.cache.set(key, { bars: merged, ts: Date.now() });
  }

  /**
   * Replace bars entirely (for initial load or symbol change).
   * Use this when you want to reset accumulated data.
   */
  replace(key: string, bars: CompressedBar[]): void {
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }

    const trimmed = bars.length > this.maxBarsPerKey
      ? bars.slice(bars.length - this.maxBarsPerKey)
      : bars;
    this.cache.set(key, { bars: trimmed, ts: Date.now() });
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
   * Get the number of bars stored for a key (without triggering expiry check)
   */
  barCount(key: string): number {
    const entry = this.cache.get(key);
    return entry?.bars.length ?? 0;
  }

  /**
   * Get cache stats for debugging
   */
  get stats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      keys: Array.from(this.cache.keys()),
      barCounts: Object.fromEntries(
        Array.from(this.cache.entries()).map(([k, v]) => [k, v.bars.length])
      ),
    };
  }
}

/**
 * Global singleton — shared across all dashboard components.
 * 30 entries × up to 2000 bars × ~50 bytes ≈ 3MB max memory footprint.
 * maxAge bumped to 30 minutes since bars now accumulate within a session.
 */
export const symbolDataCache = new SymbolDataLRUCache(30, 30 * 60 * 1000, 2000);
