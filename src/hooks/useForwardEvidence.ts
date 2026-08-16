import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ForwardCellRow {
  pattern_id: string;
  timeframe: string;
  asset_type: string;
  direction: string;
  validation_status: string;
  predicted_edge_points: number | null;
  n_forward: number;
  n_wins: number;
  realised_win_rate: number | null;
  avg_rr: number | null;
  realised_edge_points: number | null;
  avg_r: number | null;
}

export interface SplitRow {
  bucket: string;
  n_trades: number;
  n_wins: number;
  avg_r: number | null;
  total_r: number | null;
}

/**
 * Forward evidence: what the validated cells predicted versus what actually
 * happened once we traded them. Suspect rows are excluded server-side.
 */
export function useForwardEvidence(userId?: string) {
  const [cells, setCells] = useState<ForwardCellRow[]>([]);
  const [split, setSplit] = useState<SplitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [a, b] = await Promise.all([
        supabase.rpc("get_forward_vs_predicted" as any, { p_user_id: userId }),
        supabase.rpc("get_forward_validated_split" as any, { p_user_id: userId }),
      ]);
      if (cancelled) return;
      if (a.error) console.error("[useForwardEvidence] cells", a.error);
      if (b.error) console.error("[useForwardEvidence] split", b.error);
      setCells(((a.data as any[]) ?? []) as ForwardCellRow[]);
      setSplit(((b.data as any[]) ?? []) as SplitRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { cells, split, loading };
}
