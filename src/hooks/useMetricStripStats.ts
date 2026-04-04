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
      const [instrumentsRes, patternsRes, expectancyRes] = await Promise.all([
        supabase
          .from('instruments')
          .select('symbol', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('historical_pattern_occurrences')
          .select('pattern_id', { count: 'exact', head: true }),
        supabase.rpc('get_edge_atlas_rankings_filtered', {
          p_min_trades: 20,
          p_limit: 200,
        }),
      ]);

      // Compute avg expectancy from rankings
      const rows = expectancyRes.data as Array<{ expectancy_r: number }> | null;
      const positiveRows = rows?.filter((r) => r.expectancy_r > 0) ?? [];
      const avgExp = positiveRows.length > 0
        ? positiveRows.reduce((sum, r) => sum + Number(r.expectancy_r), 0) / positiveRows.length
        : 0.25;

      // Distinct pattern count from rankings
      const distinctPatterns = rows
        ? new Set(rows.map((r) => (r as any).pattern_id)).size
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
