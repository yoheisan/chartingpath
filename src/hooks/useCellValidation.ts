import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CellValidation {
  pattern_id: string;
  timeframe: string;
  asset_type: string;
  direction: string;
  status: "validated" | "failed" | "insufficient_sample";
  edge_points_test: number | null;
  n_test: number | null;
  entry_mode?: string;
}

const key = (p: string, tf: string, a: string, d: string) =>
  `${p.toLowerCase()}|${tf}|${a}|${d}`;

const toDirection = (tradeType?: string | null) =>
  tradeType === "short" || tradeType === "sell" || tradeType === "bearish" ? "bearish" : "bullish";

/**
 * Validation status for every measured cell, so any trade row can state
 * plainly whether the combination it came from measured edge.
 */
export function useCellValidation(entryMode: "next_open" | "close" = "next_open") {
  const [rows, setRows] = useState<CellValidation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("cell_validation" as any)
        .select("pattern_id, timeframe, asset_type, direction, status, edge_points_test, n_test, entry_mode")
        // Validation is reported on the realistic execution assumption by default.
        .eq("entry_mode", entryMode)
        .order("test_end", { ascending: false })
        .limit(2000);
      if (cancelled) return;
      if (error) console.error("[useCellValidation]", error);
      setRows(((data as any[]) ?? []) as CellValidation[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [entryMode]);

  const map = useMemo(() => {
    const m = new Map<string, CellValidation>();
    for (const r of rows) {
      const k = key(r.pattern_id, r.timeframe, r.asset_type, r.direction);
      if (!m.has(k)) m.set(k, r); // rows arrive newest test_end first
    }
    return m;
  }, [rows]);

  const lookup = useMemo(() => (
    patternId?: string | null,
    timeframe?: string | null,
    assetType?: string | null,
    tradeTypeOrDirection?: string | null,
  ): CellValidation | null => {
    if (!patternId || !timeframe || !assetType) return null;
    return map.get(key(patternId, timeframe, assetType, toDirection(tradeTypeOrDirection))) ?? null;
  }, [map]);

  return { lookup, loading, cells: rows };
}
