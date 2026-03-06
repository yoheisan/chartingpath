import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UpcomingEconomicEvent {
  id: string;
  event_name: string;
  country_code: string;
  impact_level: string;
  scheduled_time: string;
}

/**
 * Fetches economic events within the next 3 days for timing agent context.
 */
export function useUpcomingEconomicEvents() {
  return useQuery({
    queryKey: ['upcoming-economic-events'],
    queryFn: async () => {
      const now = new Date();
      const lookahead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('economic_events')
        .select('id, event_name, country_code, impact_level, scheduled_time')
        .gte('scheduled_time', now.toISOString())
        .lte('scheduled_time', lookahead.toISOString())
        .in('impact_level', ['high', 'medium'])
        .order('scheduled_time', { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data || []) as UpcomingEconomicEvent[];
    },
    staleTime: 300_000, // 5 min
    refetchInterval: 600_000,
  });
}

// Maps instrument symbols to affected currency codes for event matching
const SYMBOL_CURRENCY_MAP: Record<string, string[]> = {};

// FX pairs: both currencies affected
function getCurrenciesFromFXSymbol(symbol: string): string[] {
  const clean = symbol.replace('=X', '').replace('/', '');
  if (clean.length === 6) {
    return [clean.slice(0, 3), clean.slice(3, 6)];
  }
  return [];
}

// Map country codes to their currencies
const COUNTRY_TO_CURRENCY: Record<string, string[]> = {
  US: ['USD'],
  GB: ['GBP'],
  EU: ['EUR'],
  JP: ['JPY'],
  AU: ['AUD'],
  CA: ['CAD'],
  NZ: ['NZD'],
  CH: ['CHF'],
  CN: ['CNY', 'CNH'],
  HK: ['HKD'],
  SG: ['SGD'],
  KR: ['KRW'],
  IN: ['INR'],
  BR: ['BRL'],
  MX: ['MXN'],
  ZA: ['ZAR'],
  TR: ['TRY'],
  SE: ['SEK'],
  NO: ['NOK'],
  DK: ['DKK'],
  PL: ['PLN'],
  TH: ['THB'],
};

/**
 * Returns affected currencies for a given instrument.
 */
export function getAffectedCurrencies(symbol: string, assetType: string): string[] {
  if (['forex', 'fx'].includes(assetType)) {
    return getCurrenciesFromFXSymbol(symbol);
  }
  // USD-denominated by default for stocks/crypto/commodities
  if (['crypto', 'cryptocurrency'].includes(assetType)) return ['USD'];
  if (['stock', 'stocks'].includes(assetType)) return ['USD'];
  if (['commodity', 'commodities'].includes(assetType)) return ['USD'];
  return ['USD'];
}

/**
 * Compute a timing penalty (0-1) based on upcoming economic events.
 * 0 = many high-impact events (bad timing), 1 = clear calendar (good timing)
 */
export function computeTimingFromEvents(
  symbol: string,
  assetType: string,
  events: UpcomingEconomicEvent[]
): { score: number; eventCount: number; highCount: number; nearestEvent: string | null } {
  const currencies = getAffectedCurrencies(symbol, assetType);
  
  // Find events whose country maps to one of the instrument's currencies
  const relevantEvents = events.filter(ev => {
    const eventCurrencies = COUNTRY_TO_CURRENCY[ev.country_code] || [];
    return currencies.some(c => eventCurrencies.includes(c));
  });

  const highCount = relevantEvents.filter(e => e.impact_level === 'high').length;
  const mediumCount = relevantEvents.filter(e => e.impact_level === 'medium').length;

  // Penalty: each high-impact = -0.15, each medium = -0.06
  const penalty = Math.min(1, highCount * 0.15 + mediumCount * 0.06);
  const score = Math.max(0, 1 - penalty);

  return {
    score,
    eventCount: relevantEvents.length,
    highCount,
    nearestEvent: relevantEvents[0]?.event_name || null,
  };
}
