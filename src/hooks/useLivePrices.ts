import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches live prices for a list of symbols from live_pattern_detections.
 * Refreshes every `intervalMs` (default 30s).
 */
export function useLivePrices(symbols: string[], intervalMs = 30_000) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (symbols.length === 0) return;

    const uniqueSymbols = [...new Set(symbols)];

    const fetchPrices = async () => {
      const results: Record<string, number> = {};
      for (const sym of uniqueSymbols) {
        const { data } = await supabase
          .from('live_pattern_detections')
          .select('current_price')
          .eq('instrument', sym)
          .order('first_detected_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.current_price) results[sym] = Number(data.current_price);
      }
      setPrices(results);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, intervalMs);
    return () => clearInterval(interval);
  }, [symbols.join(','), intervalMs]);

  return prices;
}
