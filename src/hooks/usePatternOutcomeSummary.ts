import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MIN_SAMPLE_SIZE } from '@/config/outcomeStats';

export interface PatternOutcomeSummary {
  patternId: string;
  totalTrades: number;
  winRatePct: number;
  expectancyR: number;
  avgRr: number;
  meetsFloor: boolean;
}

/**
 * Outcome summary for a single pattern, aggregated across every
 * timeframe / asset class / direction cell returned by
 * `get_pattern_outcome_cells`.
 *
 * We deliberately request p_min_trades: 1 and apply the n >= 30 floor
 * ourselves, so a pattern with a real-but-thin sample renders as
 * "insufficient sample" rather than silently disappearing.
 */
export function usePatternOutcomeSummary(patternId?: string | null) {
  return useQuery<PatternOutcomeSummary | null>({
    queryKey: ['pattern-outcome-summary', patternId ?? 'none'],
    enabled: !!patternId,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pattern_outcome_cells', {
        p_min_trades: 1,
        p_limit: 1000,
      });
      if (error) throw error;

      const cells = ((data ?? []) as Array<{
        pattern_id: string;
        total_trades: number;
        win_rate_pct: number;
        expectancy_r: number;
        avg_rr: number;
      }>).filter((c) => c.pattern_id === patternId);

      if (cells.length === 0) return null;

      const totalTrades = cells.reduce((s, c) => s + Number(c.total_trades || 0), 0);
      if (totalTrades === 0) return null;

      const weighted = (pick: (c: typeof cells[number]) => number) =>
        cells.reduce((s, c) => s + Number(pick(c) || 0) * Number(c.total_trades || 0), 0) / totalTrades;

      return {
        patternId: patternId as string,
        totalTrades,
        winRatePct: weighted((c) => c.win_rate_pct),
        expectancyR: weighted((c) => c.expectancy_r),
        avgRr: weighted((c) => c.avg_rr),
        meetsFloor: totalTrades >= MIN_SAMPLE_SIZE,
      };
    },
  });
}