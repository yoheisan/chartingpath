import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LivePriceData {
  price: number;
  lastConfirmedAt: string; // ISO timestamp
}

/**
 * Fetches live prices + staleness timestamps for a list of symbols.
 * Refreshes every `intervalMs` (default 30s).
 */
export function useLivePrices(symbols: string[], intervalMs = 30_000) {
  const [prices, setPrices] = useState<Record<string, LivePriceData>>({});

  useEffect(() => {
    if (symbols.length === 0) return;

    const uniqueSymbols = [...new Set(symbols)];

    const fetchPrices = async () => {
      const results: Record<string, LivePriceData> = {};
      for (const sym of uniqueSymbols) {
        const { data } = await supabase
          .from('live_pattern_detections')
          .select('current_price, last_confirmed_at')
          .eq('instrument', sym)
          .not('current_price', 'is', null)
          .order('last_confirmed_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.current_price) {
          results[sym] = {
            price: Number(data.current_price),
            lastConfirmedAt: data.last_confirmed_at ?? new Date().toISOString(),
          };
        }
      }
      setPrices(results);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, intervalMs);
    return () => clearInterval(interval);
  }, [symbols.join(','), intervalMs]);

  return prices;
}
