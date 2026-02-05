import { useState, useEffect, useCallback, useRef } from 'react';
import { hasPersistentBrowserStorage } from '@/utils/safeStorage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseMarketDataCacheOptions<T> {
  /** Unique key for this cache entry */
  cacheKey: string;
  /** How long (ms) before data is considered stale (default: 60s) */
  staleTime?: number;
  /** How long (ms) before cached data is completely expired (default: 5min) */
  maxAge?: number;
  /** Function to fetch fresh data */
  fetchFn: () => Promise<T>;
  /** Whether to auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

const CACHE_PREFIX = 'cp-market-cache:';

function getCache<T>(key: string): CacheEntry<T> | null {
  if (!hasPersistentBrowserStorage()) return null;
  
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  if (!hasPersistentBrowserStorage()) return;
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (err) {
    console.warn('[MarketDataCache] Failed to save:', err);
  }
}

/**
 * Stale-while-revalidate caching hook for market data.
 * Shows cached data immediately, then refreshes in background if stale.
 */
export function useMarketDataCache<T>({
  cacheKey,
  staleTime = 60_000, // 1 minute
  maxAge = 300_000, // 5 minutes
  fetchFn,
  autoFetch = true,
}: UseMarketDataCacheOptions<T>) {
  const [data, setData] = useState<T | null>(() => {
    const cached = getCache<T>(cacheKey);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  });
  
  const [loading, setLoading] = useState(false);
  const [isStale, setIsStale] = useState(() => {
    const cached = getCache<T>(cacheKey);
    if (!cached) return true;
    return Date.now() - cached.timestamp > staleTime;
  });
  
  const fetchInProgress = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (fetchInProgress.current && !force) return;
    
    const cached = getCache<T>(cacheKey);
    const now = Date.now();
    
    // If not stale and not forcing, skip fetch
    if (!force && cached && now - cached.timestamp < staleTime) {
      setData(cached.data);
      setIsStale(false);
      return;
    }
    
    fetchInProgress.current = true;
    setLoading(true);
    
    try {
      const freshData = await fetchFn();
      setData(freshData);
      setCache(cacheKey, freshData);
      setIsStale(false);
    } catch (err) {
      console.error(`[MarketDataCache:${cacheKey}] Fetch error:`, err);
      // Keep stale data on error
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [cacheKey, staleTime, fetchFn]);

  // Initial mount: show cached immediately, background refresh if stale
  useEffect(() => {
    if (!autoFetch) return;
    
    const cached = getCache<T>(cacheKey);
    const now = Date.now();
    
    if (cached) {
      // Show cached data immediately
      if (now - cached.timestamp < maxAge) {
        setData(cached.data);
      }
      
      // Background refresh if stale
      if (now - cached.timestamp > staleTime) {
        setIsStale(true);
        refresh();
      }
    } else {
      // No cache, must fetch
      refresh();
    }
  }, [cacheKey, autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    isStale,
    refresh: () => refresh(true),
  };
}

/**
 * Clear all market data caches
 */
export function clearMarketDataCache(): void {
  if (!hasPersistentBrowserStorage()) return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
