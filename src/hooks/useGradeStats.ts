import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Measured outcome statistics per quality grade, computed live from
 * historical_pattern_occurrences (2024-01-01 onward).
 *
 * The grade letters are NOT a validated quality ordering — see
 * src/utils/PatternQualityScorer.ts. Always show the measured expectancy
 * next to a letter, never the letter alone as a quality signal.
 */
export interface GradeStat {
  grade: string;
  occurrences: number;
  resolved: number;
  winRate: number | null;
  avgRr: number | null;
  /** null when resolved < MIN_GRADE_SAMPLE — do not fabricate a figure */
  expectancyR: number | null;
  insufficientSample: boolean;
}

/** Sample floor below which no expectancy figure may be presented. */
export const MIN_GRADE_SAMPLE = 100;

export function useGradeStats() {
  const [stats, setStats] = useState<GradeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase.rpc('get_grade_outcome_stats', {});
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setStats([]);
      } else {
        const rows = (data ?? []) as Array<{
          grade: string;
          occurrences: number;
          resolved: number;
          win_rate: number | null;
          avg_rr: number | null;
          expectancy_r: number | null;
        }>;
        setStats(
          rows
            .map((r) => {
              const resolved = Number(r.resolved ?? 0);
              const insufficient = resolved < MIN_GRADE_SAMPLE;
              return {
                grade: r.grade,
                occurrences: Number(r.occurrences ?? 0),
                resolved,
                winRate: r.win_rate != null ? Number(r.win_rate) : null,
                avgRr: r.avg_rr != null ? Number(r.avg_rr) : null,
                expectancyR: insufficient || r.expectancy_r == null ? null : Number(r.expectancy_r),
                insufficientSample: insufficient,
              } satisfies GradeStat;
            })
            // Sort by sample size, never by letter — the letter is not an ordering.
            .sort((a, b) => b.occurrences - a.occurrences),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, error };
}

/** Grade counts for a specific selection, used to explain empty results. */
export async function fetchGradeCountsForSelection(
  symbols: string[],
  patterns: string[],
  timeframe: string,
): Promise<Array<{ grade: string; occurrences: number }>> {
  const { data, error } = await supabase.rpc('get_grade_counts_for_selection', {
    p_symbols: symbols,
    p_patterns: patterns,
    p_timeframe: timeframe,
  });
  if (error) return [];
  return ((data ?? []) as Array<{ grade: string; occurrences: number }>).map((r) => ({
    grade: r.grade,
    occurrences: Number(r.occurrences ?? 0),
  }));
}
