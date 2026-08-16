import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EdgePoolCell {
  pattern_id: string;
  pattern_name: string | null;
  timeframe: string;
  asset_type: string;
  direction: string; // 'bullish' | 'bearish'
  total_trades: number;
  win_rate_pct: number;
  avg_rr: number;
  expectancy_r: number;
  est_cost_r: number;
  expectancy_r_net: number;
  edge_points: number;
  baseline_win_rate_pct: number;
  edge_points_train: number | null;
  edge_points_test: number | null;
  n_train: number | null;
  n_test: number | null;
  validated_at: string | null;
}

export interface PoolInstrument {
  symbol: string;
  asset_type: string;
  cells: number;
  best_edge_points: number;
  occurrences: number;
}

export interface PoolFilters {
  assetTypes: string[];
  timeframes: string[];
  direction: "bullish" | "bearish" | null;
  maxInstruments: number | null;
}

/** The validated edge pool — the universe a plan may trade from. */
export function useEdgePool() {
  const [cells, setCells] = useState<EdgePoolCell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_validated_edge_pool" as any, {});
      if (cancelled) return;
      if (error) console.error("[useEdgePool]", error);
      setCells(((data as any[]) ?? []) as EdgePoolCell[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { cells, loading, totalValidated: cells.length };
}

/** Resolves the filtered pool into the instruments it actually applies to. */
export function usePoolInstruments(filters: PoolFilters, enabled = true) {
  const [instruments, setInstruments] = useState<PoolInstrument[]>([]);
  const [summary, setSummary] = useState<{ cell_count: number; instrument_count: number; avg_edge_points: number | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const args = {
      p_asset_types: filters.assetTypes.length ? filters.assetTypes : null,
      p_timeframes: filters.timeframes.length ? filters.timeframes : null,
      p_direction: filters.direction,
    };
    const [{ data: sum }, { data: instr }] = await Promise.all([
      supabase.rpc("get_validated_pool_summary" as any, args),
      supabase.rpc("get_validated_pool_instruments" as any, {
        ...args,
        p_max: filters.maxInstruments,
      }),
    ]);
    setSummary(((sum as any[]) ?? [])[0] ?? null);
    setInstruments(((instr as any[]) ?? []) as PoolInstrument[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  useEffect(() => { load(); }, [load]);

  return { instruments, summary, loading, reload: load };
}
