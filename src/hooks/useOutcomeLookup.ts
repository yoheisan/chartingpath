import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MIN_SAMPLE_SIZE } from '@/config/outcomeStats';

export interface OutcomeLookupRow {
  pattern_id: string;
  pattern_name: string;
  timeframe: string;
  asset_type: string;
  direction: string;
  total_trades: number;
  win_rate_pct: number;
  expectancy_r: number;
  trades_per_year: number;
  est_annualized_pct: number;
  avg_bars: number;
  avg_rr: number;
}

export interface OutcomeLookupFilters {
  /** undefined = all asset classes */
  assetType?: string;
  /** undefined = all timeframes */
  timeframe?: string;
}

/**
 * Public outcome lookup. Aggregation happens server-side in the existing
 * `get_edge_atlas_rankings_filtered` RPC — we never pull raw occurrences here.
 *
 * Deliberately has NO per-symbol filter: grouping at
 * pattern x timeframe x asset class x direction keeps the cell count ~93.
 * Slicing per instrument would manufacture winners by chance.
 */
export function useOutcomeLookup({ assetType, timeframe }: OutcomeLookupFilters) {
  return useQuery<OutcomeLookupRow[]>({
    queryKey: ['outcome-lookup', assetType ?? 'all', timeframe ?? 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_edge_atlas_rankings_filtered', {
        p_min_trades: MIN_SAMPLE_SIZE,
        p_sort_by: 'expectancy',
        p_limit: 100,
        ...(assetType ? { p_asset_type: assetType } : {}),
        ...(timeframe ? { p_timeframe: timeframe } : {}),
      });
      if (error) throw error;
      return (data ?? []) as OutcomeLookupRow[];
    },
    staleTime: 30 * 60 * 1000,
  });
}