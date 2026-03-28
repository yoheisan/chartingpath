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
      // Fetch 7 days for extended clean window bonus evaluation
      const lookahead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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
    staleTime: 300_000,
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
): {
  score: number;
  eventCount: number;
  highCount: number;
  nearestEvent: string | null;
  timingWindow: {
    daysUntilNextHighImpact: number | null;
    isExtendedClean: boolean;
    bonus: number;
  };
} {
  const currencies = getAffectedCurrencies(symbol, assetType);
  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  // Find events whose country maps to one of the instrument's currencies
  const relevantEvents = events.filter(ev => {
    const eventCurrencies = COUNTRY_TO_CURRENCY[ev.country_code] || [];
    return currencies.some(c => eventCurrencies.includes(c));
  });

  // Split into 3-day window (standard penalties) and full 7-day window (bonus eval)
  const eventsIn3Days = relevantEvents.filter(ev => {
    const dt = new Date(ev.scheduled_time).getTime() - now;
    return dt >= 0 && dt <= THREE_DAYS_MS;
  });

  const highCount3d = eventsIn3Days.filter(e => e.impact_level === 'high').length;
  const mediumCount3d = eventsIn3Days.filter(e => e.impact_level === 'medium').length;

  // Standard penalties (unchanged)
  const penalty = Math.min(1, highCount3d * 0.15 + mediumCount3d * 0.06);
  let score = Math.max(0, 1 - penalty);

  // Extended clean window bonus (7-day lookahead)
  const highImpactAll = relevantEvents.filter(e => e.impact_level === 'high');
  const highCountAll = highImpactAll.length;

  // Find days until next high-impact event
  let daysUntilNextHighImpact: number | null = null;
  if (highImpactAll.length > 0) {
    const sortedHigh = [...highImpactAll].sort(
      (a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
    );
    daysUntilNextHighImpact = Math.round(
      (new Date(sortedHigh[0].scheduled_time).getTime() - now) / (1000 * 60 * 60 * 24) * 10
    ) / 10;
  }

  let extendedBonus = 0;
  if (relevantEvents.length === 0) {
    extendedBonus = 0.12; // +3/25 — completely clear 7 days
  } else if (highCountAll === 0) {
    extendedBonus = 0.08; // +2/25 — no high-impact in 7 days
  }

  // Apply bonus after deductions, cap at 1.0
  score = Math.min(1, score + extendedBonus);

  const isExtendedClean = highCountAll === 0;

  return {
    score,
    eventCount: eventsIn3Days.length,
    highCount: highCount3d,
    nearestEvent: relevantEvents[0]?.event_name || null,
    timingWindow: {
      daysUntilNextHighImpact,
      isExtendedClean,
      bonus: extendedBonus === 0.12 ? 3 : extendedBonus === 0.08 ? 2 : 0,
    },
  };
}
