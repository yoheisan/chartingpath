import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetricStripStats {
  instrumentCount: number;
  patternCount: number;
  /** Resolved outcomes with execution_status = 'valid' only. */
  validResolvedOutcomes: number;
  /** Cells that passed out-of-sample validation under next-bar-open entry. */
  validatedCells: number;
}

/**
 * Single server-side query. Client-side `count: 'exact'` over
 * historical_pattern_occurrences was timing out, which resolved to null and
 * rendered the strip as zeros — a statistics site advertising 0 rows of data.
 */
export function useMetricStripStats() {
  return useQuery<MetricStripStats | null>({
    queryKey: ['metric-strip-stats-v2'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_metric_strip_stats');
      if (error) {
        console.error('[useMetricStripStats] failed', error);
        return null;
      }
      const row = Array.isArray(data) ? (data[0] as any) : (data as any);
      if (!row) return null;
      return {
        instrumentCount: Number(row.instrument_count ?? 0),
        patternCount: Number(row.pattern_count ?? 0),
        validResolvedOutcomes: Number(row.valid_resolved_outcomes ?? 0),
        validatedCells: Number(row.validated_cells ?? 0),
      };
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
