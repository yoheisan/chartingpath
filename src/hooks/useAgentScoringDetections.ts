import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssetClassFilter } from '@/components/agent-backtest/TradeOpportunityTable';

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
}

export function useAgentScoringDetections(
  assetClassFilter: AssetClassFilter,
  timeframeFilter: TimeframeFilter
) {
  return useQuery({
    queryKey: ['agent-scoring-detections', assetClassFilter, timeframeFilter],
    queryFn: async () => {
      let query = supabase
        .from('live_pattern_detections')
        .select(
          'id, instrument, pattern_name, pattern_id, direction, timeframe, asset_type, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, status, historical_performance, trend_alignment, first_detected_at'
        )
        .eq('status', 'active')
        .order('first_detected_at', { ascending: false });

      // Asset class filter
      if (assetClassFilter !== 'all') {
        const types = ASSET_TYPE_MAP[assetClassFilter] || [assetClassFilter];
        query = query.in('asset_type', types);
      }

      // Timeframe filter
      if (timeframeFilter !== 'all') {
        query = query.eq('timeframe', timeframeFilter);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data || []) as LiveDetectionRow[];
    },
    staleTime: 60_000, // 1 min
    refetchInterval: 120_000, // 2 min
  });
}
