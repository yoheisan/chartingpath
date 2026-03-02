import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { symbolDataCache } from '@/lib/symbolDataCache';
import { getChartDataLimits, type Timeframe } from '@/config/dataCoverageContract';

/**
 * Pre-warmed context available globally for copilot's first message.
 * Populated by useDashboardPrefetch on dashboard mount.
 */
export const prewarmedContext = {
  watchlistSymbols: [] as string[],
  activePatternCount: 0,
  ready: false,
};

/**
 * Prefetches watchlist symbols' OHLCV data and active patterns on dashboard mount.
 * This ensures instant chart switches for watchlisted instruments and
 * pre-warms the copilot context with portfolio + hit rate data.
 */
export function useDashboardPrefetch(userId?: string, currentTimeframe = '1d') {
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    const prefetch = async () => {
      try {
        // 1. Get watchlist symbols (user or default)
        let symbols: string[] = [];
        if (userId) {
          const { data } = await supabase
            .from('user_watchlist')
            .select('symbol')
            .eq('user_id', userId)
            .limit(20);
          symbols = (data || []).map(d => d.symbol);
        }

        // Fallback to popular defaults
        if (symbols.length === 0) {
          symbols = ['AAPL', 'MSFT', 'BTC-USD', 'EURUSD=X', 'TSLA', 'NVDA'];
        }

        // Store for copilot pre-warm
        prewarmedContext.watchlistSymbols = symbols;

        console.debug('[DashboardPrefetch] Prefetching', symbols.length, 'symbols');

        // 2. Staggered prefetch of OHLCV data for each symbol
        const { barLimit } = getChartDataLimits(currentTimeframe as Timeframe);
        
        for (let i = 0; i < symbols.length; i++) {
          const sym = symbols[i];
          const cacheKey = `${sym}:${currentTimeframe}`;

          // Skip if already cached
          if (symbolDataCache.get(cacheKey)) continue;

          // Stagger requests 100ms apart to avoid hammering DB
          setTimeout(async () => {
            try {
              const { data } = await supabase
                .from('historical_prices')
                .select('date, open, high, low, close, volume')
                .eq('symbol', sym)
                .eq('timeframe', currentTimeframe)
                .order('date', { ascending: true })
                .limit(barLimit);

              if (data && data.length > 0) {
                const bars = data.map(row => ({
                  t: row.date,
                  o: row.open,
                  h: row.high,
                  l: row.low,
                  c: row.close,
                  v: row.volume || 0,
                }));
                symbolDataCache.set(cacheKey, bars);
                console.debug('[DashboardPrefetch] Cached', sym, ':', bars.length, 'bars');
              }
            } catch (err) {
              // Silent failure — prefetch is opportunistic
              console.debug('[DashboardPrefetch] Failed to prefetch', sym);
            }
          }, i * 100);
        }

        // 3. Pre-warm copilot context: active patterns count
        if (userId) {
          setTimeout(async () => {
            try {
              const { count } = await supabase
                .from('live_pattern_detections')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active')
                .in('instrument', symbols);
              
              prewarmedContext.activePatternCount = count || 0;
              prewarmedContext.ready = true;
              console.debug('[DashboardPrefetch] Active patterns on watchlist:', count);
            } catch {}
          }, symbols.length * 100 + 200);
        } else {
          prewarmedContext.ready = true;
        }
      } catch (err) {
        console.debug('[DashboardPrefetch] Prefetch init error:', err);
      }
    };

    // Start prefetch after a short delay to not compete with initial render
    const timer = setTimeout(prefetch, 500);
    return () => clearTimeout(timer);
  }, [userId, currentTimeframe]);
}
