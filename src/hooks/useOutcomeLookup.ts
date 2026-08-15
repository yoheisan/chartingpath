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
  avg_bars: number;
  avg_rr: number;
  /**
   * (win_rate - 1/(1+avg_rr)) * 100. The random-walk null: a coin flip reaches
   * the target before the stop with probability ~1/(1+RR). Positive expectancy
   * on its own is geometry, not skill — this is the number that says otherwise.
   */
  edge_points: number | null;
  baseline_win_rate_pct: number | null;
  /** Passed out-of-sample validation (edge held in train AND test halves). */
  is_validated: boolean;
  validation_status: string;
  qualifies: boolean;
}

export type GeometrySource = 'pivot' | 'atr_fallback' | 'neckline_fallback' | 'unknown';

export interface OutcomeLookupFilters {
  /** undefined = all asset classes */
  assetType?: string;
  /** undefined = all timeframes */
  timeframe?: string;
  /**
   * undefined = every occurrence, regardless of how its stop/target were derived.
   * 'pivot' restricts to pattern-derived geometry; 'atr_fallback' to the generic
   * 2:1 ATR rule that fires when the detector cannot resolve enough pivots.
   */
  geometrySource?: GeometrySource;
}

/**
 * Public outcome lookup. Aggregation happens server-side in
 * `get_pattern_outcome_cells` — we never pull raw occurrences here.
 *
 * This RPC is used INSTEAD of `get_edge_atlas_rankings_filtered` because that one
 * hardcodes `WHERE expectancy_r > 0` (correct for Edge Atlas, which ranks the best
 * opportunities; wrong here, where the whole point is to show losing cells too).
 * Results are ordered by sample size, largest first — sorting by expectancy would
 * put winners on top and reintroduce the same bias by presentation.
 *
 * NOTE (latent bug elsewhere, not fixed here): the annualisation CASE inside
 * `get_edge_atlas_rankings_filtered` has no '15m' branch, so 15m rows fall through
 * to 252 bars/year and their est_annualized_pct is understated.
 *
 * Deliberately has NO per-symbol filter: grouping at
 * pattern x timeframe x asset class x direction. Slicing per instrument
 * would manufacture winners by chance.
 */
export function useOutcomeLookup({ assetType, timeframe, geometrySource }: OutcomeLookupFilters) {
  return useQuery<OutcomeLookupRow[]>({
    queryKey: ['outcome-lookup', assetType ?? 'all', timeframe ?? 'all', geometrySource ?? 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pattern_outcome_cells', {
        p_min_trades: MIN_SAMPLE_SIZE,
        // Must stay comfortably above the total cell count (355 today). The summary
        // line on /outcomes counts the RETURNED rows, so if this limit ever binds the
        // page will silently understate how many losing combinations exist.
        p_limit: 400,
        ...(assetType ? { p_asset_type: assetType } : {}),
        ...(timeframe ? { p_timeframe: timeframe } : {}),
        ...(geometrySource ? { p_geometry_source: geometrySource } : {}),
      });
      if (error) throw error;
      return (data ?? []) as OutcomeLookupRow[];
    },
    staleTime: 30 * 60 * 1000,
  });
}