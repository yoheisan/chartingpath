import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  directionForPatternId,
  toDbAssetType,
  toLiveDirection,
} from '@/config/vocabularies';

export interface PatternEdge {
  patternId: string;
  totalTrades: number;
  winRatePct: number;
  expectancyR: number;
  /** Provisional estimated round-trip cost in R for this asset_type/timeframe. */
  estCostR: number;
  /** expectancyR - estCostR. Qualification is decided on THIS, not on gross. */
  expectancyRNet: number;
  avgRr: number;
  qualifies: boolean;
}

/**
 * Direction implied by a pattern id, in the LIVE vocabulary (long/short).
 * The edge function normalises long <-> bullish internally, but we go through
 * the shared vocabulary helpers so the mapping lives in exactly one place.
 * See src/config/vocabularies.ts and docs/VOCABULARY-CONTRACT.md.
 */
export function inferDirection(patternId: string): 'long' | 'short' {
  return toLiveDirection(directionForPatternId(patternId));
}

async function resolveAssetType(symbol: string): Promise<string | null> {
  if (!symbol) return null;
  const { data } = await supabase
    .from('instruments')
    .select('asset_type')
    .eq('symbol', symbol)
    .maybeSingle();
  // Normalise through the shared vocabulary: a singular value here silently
  // matches nothing in historical_pattern_occurrences.
  return toDbAssetType(data?.asset_type) ?? null;
}

/**
 * Looks up the measured edge for each selected pattern against the chosen
 * symbol + timeframe, BEFORE the user saves an alert.
 */
export function usePatternEdge(symbol: string, timeframe: string, patterns: string[]) {
  const [edges, setEdges] = useState<PatternEdge[]>([]);
  const [assetType, setAssetType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const key = `${symbol}|${timeframe}|${patterns.join(',')}`;

  useEffect(() => {
    let cancelled = false;
    if (!symbol || !timeframe || patterns.length === 0) {
      setEdges([]);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const at = await resolveAssetType(symbol);
        if (cancelled) return;
        setAssetType(at);
        if (!at) { setEdges([]); return; }

        const results = await Promise.all(
          patterns.slice(0, 12).map(async (p) => {
            const { data } = await supabase.rpc('get_pattern_edge', {
              p_pattern_id: p,
              p_timeframe: timeframe,
              p_asset_type: at,
              p_direction: inferDirection(p),
            });
            const row: any = Array.isArray(data) ? data[0] : data;
            const gross = Number(row?.expectancy_r ?? 0);
            const cost = Number(row?.est_cost_r ?? 0);
            return {
              patternId: p,
              totalTrades: Number(row?.total_trades ?? 0),
              winRatePct: Number(row?.win_rate_pct ?? 0),
              expectancyR: gross,
              estCostR: cost,
              expectancyRNet: Number(row?.expectancy_r_net ?? gross - cost),
              avgRr: Number(row?.avg_rr ?? 0),
              qualifies: Boolean(row?.qualifies),
            } as PatternEdge;
          })
        );
        if (!cancelled) setEdges(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { edges, assetType, loading };
}

/** Alerts fired vs detections suppressed for lack of edge, last 30 days. */
export function useAlertEdgeSummary(userId?: string) {
  const [fired, setFired] = useState(0);
  const [suppressed, setSuppressed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    const run = async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();

      const { data: alertRows } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', userId);
      const alertIds = (alertRows || []).map(a => a.id);

      let firedCount = 0;
      if (alertIds.length > 0) {
        const { count } = await supabase
          .from('alerts_log')
          .select('id', { count: 'exact', head: true })
          .in('alert_id', alertIds)
          .gte('triggered_at', since);
        firedCount = count ?? 0;
      }

      const { count: suppressedCount } = await supabase
        .from('alert_suppression_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('suppressed_at', since);

      if (cancelled) return;
      setFired(firedCount);
      setSuppressed(suppressedCount ?? 0);
      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [userId]);

  return { fired, suppressed, loading };
}

export interface SuspendedCell {
  patternId: string;
  timeframe: string;
  assetType: string;
  direction: string;
  suspendedAt: string | null;
  reason: string | null;
  forwardN: number;
  forwardExpectancyR: number | null;
}

/**
 * Combinations the kill switch has suspended because forward results contradicted
 * the backtest. Showing these is deliberate: it is the honest half of the pitch.
 */
export function useSuspendedCells() {
  const [cells, setCells] = useState<SuspendedCell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('cell_status')
        .select('pattern_id, timeframe, asset_type, direction, suspended_at, suspended_reason, forward_n, forward_expectancy_r')
        .eq('status', 'suspended')
        .order('suspended_at', { ascending: false })
        .limit(50);

      if (cancelled) return;
      setCells(
        (data ?? []).map((r) => ({
          patternId: r.pattern_id,
          timeframe: r.timeframe,
          assetType: r.asset_type,
          direction: r.direction,
          suspendedAt: r.suspended_at,
          reason: r.suspended_reason,
          forwardN: r.forward_n ?? 0,
          forwardExpectancyR: r.forward_expectancy_r === null ? null : Number(r.forward_expectancy_r),
        }))
      );
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { cells, loading };
}