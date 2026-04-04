import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MetricStripStats {
  instrumentCount: number;
  patternCount: number;
  avgExpectancy: number;
}

export function useMetricStripStats() {
  return useQuery<MetricStripStats>({
    queryKey: ['metric-strip-stats'],
    queryFn: async () => {
      const [instrumentsRes, expectancyRes] = await Promise.all([
        supabase
          .from('instruments')
          .select('symbol', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.rpc('get_edge_atlas_rankings_filtered', {
          p_asset_type: undefined,
          p_timeframe: undefined,
          p_pattern_name: undefined,
          p_direction: undefined,
          p_min_trades: 20,
          p_min_win_rate: undefined,
          p_min_annualized_pct: undefined,
          p_min_expectancy: undefined,
          p_fx_symbols: undefined,
          p_sort_by: 'expectancy',
          p_limit: 200,
        }),
      ]);

      // Compute avg expectancy from rankings
      const rows = expectancyRes.data as Array<{ expectancy_r: number; pattern_id: string }> | null;
      const positiveRows = rows?.filter((r) => r.expectancy_r > 0) ?? [];
      const avgExp = positiveRows.length > 0
        ? positiveRows.reduce((sum, r) => sum + Number(r.expectancy_r), 0) / positiveRows.length
        : 0;

      // Distinct pattern count from rankings
      const distinctPatterns = rows && rows.length > 0
        ? new Set(rows.map((r) => r.pattern_id)).size
        : 17;

      return {
        instrumentCount: instrumentsRes.count ?? 800,
        patternCount: distinctPatterns,
        avgExpectancy: Math.round(avgExp * 100) / 100,
      };
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
