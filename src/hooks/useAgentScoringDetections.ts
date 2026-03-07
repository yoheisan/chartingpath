import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssetClassFilter } from '@/components/agent-backtest/TradeOpportunityTable';
import { SubFilters } from '@/hooks/useAgentScoringSettings';
import { classifyFXPair } from '@/utils/fxPairCategories';
import { CRYPTO_MAJORS } from '@/components/agent-backtest/InstrumentSubFilters';

export type TimeframeFilter = 'all' | '1h' | '4h' | '1d' | '1wk';

const ASSET_TYPE_MAP: Record<string, string[]> = {
  stocks: ['stock', 'stocks'],
  crypto: ['crypto', 'cryptocurrency'],
  forex: ['forex', 'fx'],
  commodities: ['commodity', 'commodities'],
};

export interface LiveDetectionRow {
  id: string;
  instrument: string;
  pattern_name: string;
  pattern_id: string;
  direction: string;
  timeframe: string;
  asset_type: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  quality_score: string | null;
  status: string;
  historical_performance: any;
  trend_alignment: string | null;
  first_detected_at: string;
  exchange?: string | null;
}

function extractCryptoBase(symbol: string): string {
  return symbol.replace(/-USD$/, '').replace(/USD$/, '').replace(/=X$/, '');
}

export function useAgentScoringDetections(
  assetClassFilter: AssetClassFilter,
  timeframeFilter: TimeframeFilter,
  subFilters?: SubFilters
) {
  return useQuery({
    queryKey: ['agent-scoring-detections', assetClassFilter, timeframeFilter, subFilters],
    queryFn: async () => {
      let query = supabase
        .from('live_pattern_detections')
        .select(
          'id, instrument, pattern_name, pattern_id, direction, timeframe, asset_type, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, status, historical_performance, trend_alignment, first_detected_at, exchange'
        )
        .eq('status', 'active')
        .order('first_detected_at', { ascending: false });

      if (assetClassFilter !== 'all') {
        const types = ASSET_TYPE_MAP[assetClassFilter] || [assetClassFilter];
        query = query.in('asset_type', types);
      }

      if (timeframeFilter !== 'all') {
        query = query.eq('timeframe', timeframeFilter);
      }

      // Stock exchange filter at DB level
      if (assetClassFilter === 'stocks' && subFilters?.stockExchanges && subFilters.stockExchanges.length > 0) {
        query = query.in('exchange', subFilters.stockExchanges);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;

      let rows = (data || []) as LiveDetectionRow[];

      // Client-side FX category filter
      if (assetClassFilter === 'forex' && subFilters?.fxCategory && subFilters.fxCategory !== 'all') {
        rows = rows.filter(r => classifyFXPair(r.instrument) === subFilters.fxCategory);
      }

      // Client-side crypto category filter
      if (assetClassFilter === 'crypto' && subFilters?.cryptoCategory && subFilters.cryptoCategory !== 'all') {
        rows = rows.filter(r => {
          const base = extractCryptoBase(r.instrument);
          const isMajor = CRYPTO_MAJORS.has(base);
          return subFilters.cryptoCategory === 'major' ? isMajor : !isMajor;
        });
      }

      return rows;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export interface AgentScoreRow {
  detection_id: string;
  analyst_raw: number;
  risk_raw: number;
  timing_raw: number;
  portfolio_raw: number;
  analyst_details: any;
  risk_details: any;
  timing_details: any;
  is_proven: boolean;
  sample_size: number;
  win_rate: number;
  expectancy_r: number;
  scored_at: string;
}

export function useAgentScores() {
  return useQuery({
    queryKey: ['agent_scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_scores')
        .select('detection_id, analyst_raw, risk_raw, timing_raw, portfolio_raw, analyst_details, risk_details, timing_details, is_proven, sample_size, win_rate, expectancy_r, scored_at');
      if (error) throw error;
      return (data ?? []) as AgentScoreRow[];
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
