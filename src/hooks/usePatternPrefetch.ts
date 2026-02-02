import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/utils/withTimeout';

/**
 * Pattern details response from get-live-pattern-details
 */
interface PatternDetailsResponse {
  success: boolean;
  pattern?: any;
  error?: string;
}

/**
 * Cache entry for prefetched pattern details
 */
interface PrefetchCacheEntry {
  pattern: any;
  timestamp: number;
}

// Global cache shared across component instances
const prefetchCache = new Map<string, PrefetchCacheEntry>();
const pendingRequests = new Map<string, Promise<any>>();

// Cache TTL: 5 minutes (patterns don't change frequently)
const CACHE_TTL_MS = 5 * 60 * 1000;

// Prefetch timeout: shorter than full load since this is opportunistic
const PREFETCH_TIMEOUT_MS = 15_000;

// Debounce delay: wait 150ms before prefetching to avoid rapid hover spam
const HOVER_DEBOUNCE_MS = 150;

/**
 * Hook for intelligent pattern data prefetching
 * 
 * Reduces perceived chart loading time by:
 * 1. Preloading pattern details when user hovers over table rows
 * 2. Caching results for instant access when they click
 * 3. Deduplicating concurrent requests for the same pattern
 */
export function usePatternPrefetch() {
  const hoverTimeoutRef = useRef<number | null>(null);
  const lastHoveredIdRef = useRef<string | null>(null);

  /**
   * Check if we have cached data for a pattern
   */
  const getCached = useCallback((dbId: string): any | null => {
    const entry = prefetchCache.get(dbId);
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      prefetchCache.delete(dbId);
      return null;
    }
    
    return entry.pattern;
  }, []);

  /**
   * Prefetch pattern details (non-blocking, fire-and-forget)
   */
  const prefetch = useCallback(async (dbId: string): Promise<void> => {
    if (!dbId) return;

    // Already cached and fresh?
    if (getCached(dbId)) {
      console.debug('[usePatternPrefetch] Cache hit', { dbId });
      return;
    }

    // Already fetching?
    if (pendingRequests.has(dbId)) {
      console.debug('[usePatternPrefetch] Request already pending', { dbId });
      return;
    }

    console.debug('[usePatternPrefetch] Starting prefetch', { dbId });

    const fetchPromise = (async () => {
      try {
        const res = await withTimeout(
          supabase.functions.invoke<PatternDetailsResponse>('get-live-pattern-details', {
            body: { id: dbId },
          }),
          PREFETCH_TIMEOUT_MS,
          'prefetch-pattern-details'
        );

        if (res.error) throw res.error;
        if (!res.data?.success || !res.data.pattern) {
          throw new Error(res.data?.error || 'Failed to prefetch pattern');
        }

        // Store in cache
        prefetchCache.set(dbId, {
          pattern: res.data.pattern,
          timestamp: Date.now(),
        });

        console.debug('[usePatternPrefetch] Prefetch complete', { dbId });
      } catch (err: any) {
        // Silent failure - prefetch is opportunistic
        console.debug('[usePatternPrefetch] Prefetch failed (non-blocking)', { 
          dbId, 
          error: err?.message 
        });
      } finally {
        pendingRequests.delete(dbId);
      }
    })();

    pendingRequests.set(dbId, fetchPromise);
  }, [getCached]);

  /**
   * Handle row hover - debounced prefetch trigger
   */
  const onRowHover = useCallback((dbId: string | undefined) => {
    if (!dbId) return;

    // Clear any pending hover timeout
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
    }

    // Skip if we just hovered the same row
    if (lastHoveredIdRef.current === dbId && getCached(dbId)) {
      return;
    }

    lastHoveredIdRef.current = dbId;

    // Debounce: wait before starting prefetch to avoid rapid hover spam
    hoverTimeoutRef.current = window.setTimeout(() => {
      prefetch(dbId);
    }, HOVER_DEBOUNCE_MS);
  }, [getCached, prefetch]);

  /**
   * Clear hover timeout (e.g., on mouse leave)
   */
  const cancelPrefetch = useCallback(() => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  /**
   * Get cached pattern and mark it as used (for analytics)
   */
  const getAndConsume = useCallback((dbId: string): any | null => {
    const cached = getCached(dbId);
    if (cached) {
      console.debug('[usePatternPrefetch] Cache used on open', { dbId });
    }
    return cached;
  }, [getCached]);

  /**
   * Preload multiple patterns (e.g., visible rows)
   * Lower priority than hover prefetch
   */
  const prefetchBatch = useCallback((dbIds: string[]) => {
    // Filter to only those not cached
    const toFetch = dbIds.filter(id => id && !getCached(id) && !pendingRequests.has(id));
    
    if (toFetch.length === 0) return;

    console.debug('[usePatternPrefetch] Batch prefetch', { count: toFetch.length });

    // Stagger requests to avoid overwhelming the edge function
    toFetch.forEach((dbId, index) => {
      setTimeout(() => {
        prefetch(dbId);
      }, index * 200); // 200ms between each request
    });
  }, [getCached, prefetch]);

  return {
    /** Trigger prefetch on row hover (debounced) */
    onRowHover,
    /** Cancel pending prefetch (on mouse leave) */
    cancelPrefetch,
    /** Get cached data and consume (for opening chart) */
    getAndConsume,
    /** Check if pattern is cached */
    isCached: (dbId: string) => !!getCached(dbId),
    /** Prefetch multiple patterns in batch (staggered) */
    prefetchBatch,
    /** Direct cache check */
    getCached,
  };
}

/**
 * Clear the global prefetch cache (e.g., on asset type change)
 */
export function clearPrefetchCache(): void {
  prefetchCache.clear();
  console.debug('[usePatternPrefetch] Cache cleared');
}
