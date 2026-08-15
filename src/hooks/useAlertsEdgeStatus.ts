import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toDbAssetType } from '@/config/vocabularies';
import { inferDirection } from '@/hooks/usePatternEdge';
import { fetchBrokerCostParams } from '@/hooks/useBrokerCosts';

/** Minimum sample the edge filter requires before a cell can qualify. */
export const EDGE_MIN_SAMPLE = 100;

export type EdgeReason =
  | 'qualifies'
  | 'insufficient_sample'
  | 'no_edge_vs_chance'
  | 'not_validated'
  | 'negative_expectancy'
  | 'negative_after_costs'
  | 'unknown_asset';

export interface AlertEdgeStatus {
  qualifies: boolean;
  reason: EdgeReason;
  totalTrades: number;
  expectancyR: number;
  expectancyRNet: number;
  winRatePct: number;
  /** (win rate - random-walk baseline) in percentage points. */
  edgePoints: number | null;
  baselineWinRatePct: number | null;
  isValidated: boolean;
}

interface AlertLike {
  id: string;
  symbol: string;
  pattern: string;
  timeframe: string;
}

/**
 * Resolves the edge status of every configured alert so the list can explain
 * WHY an alert will or will not fire under the edge filter. Silence has to be
 * legible: an alert that can never fire must say so on its face.
 */
export function useAlertsEdgeStatus(alerts: AlertLike[]) {
  const [statuses, setStatuses] = useState<Record<string, AlertEdgeStatus>>({});
  const [loading, setLoading] = useState(false);

  const key = alerts.map((a) => `${a.id}:${a.symbol}:${a.pattern}:${a.timeframe}`).join('|');

  useEffect(() => {
    let cancelled = false;
    if (alerts.length === 0) { setStatuses({}); return; }

    (async () => {
      setLoading(true);
      try {
        // Cost is per-user: the same cell can carry an edge for a raw-spread
        // account and none for a wide-spread one.
        const brokerParams = await fetchBrokerCostParams();
        const symbols = Array.from(new Set(alerts.map((a) => a.symbol)));
        const { data: instRows } = await supabase
          .from('instruments')
          .select('symbol, asset_type')
          .in('symbol', symbols);

        const assetBySymbol = new Map<string, string | null>();
        (instRows ?? []).forEach((r: any) => {
          assetBySymbol.set(r.symbol, toDbAssetType(r.asset_type) ?? null);
        });

        // Cache identical pattern/timeframe/asset/direction cells across alerts.
        const cellCache = new Map<string, AlertEdgeStatus>();
        const next: Record<string, AlertEdgeStatus> = {};

        for (const a of alerts) {
          const at = assetBySymbol.get(a.symbol) ?? null;
          if (!at) {
            next[a.id] = {
              qualifies: false, reason: 'unknown_asset',
              totalTrades: 0, expectancyR: 0, expectancyRNet: 0, winRatePct: 0,
              edgePoints: null, baselineWinRatePct: null, isValidated: false,
            };
            continue;
          }
          const direction = inferDirection(a.pattern);
          const cellKey = `${a.pattern}|${a.timeframe}|${at}|${direction}`;
          let cell = cellCache.get(cellKey);
          if (!cell) {
            const { data } = await supabase.rpc('get_pattern_edge', {
              p_pattern_id: a.pattern,
              p_timeframe: a.timeframe,
              p_asset_type: at,
              p_direction: direction,
              ...brokerParams,
            });
            const row: any = Array.isArray(data) ? data[0] : data;
            const n = Number(row?.total_trades ?? 0);
            const gross = Number(row?.expectancy_r ?? 0);
            const net = Number(row?.expectancy_r_net ?? gross);
            const qualifies = Boolean(row?.qualifies);
            const edgePoints = row?.edge_points == null ? null : Number(row.edge_points);
            const isValidated = Boolean(row?.is_validated);
            const reason: EdgeReason = qualifies
              ? 'qualifies'
              : n < EDGE_MIN_SAMPLE
                ? 'insufficient_sample'
                : edgePoints == null || edgePoints <= 0
                  // Beating chance comes before expectancy: a close target can show
                  // positive expectancy with zero predictive skill.
                  ? 'no_edge_vs_chance'
                  : gross <= 0
                    ? 'negative_expectancy'
                    : net <= 0
                      ? 'negative_after_costs'
                      : 'not_validated';
            cell = {
              qualifies,
              reason,
              totalTrades: n,
              expectancyR: gross,
              expectancyRNet: net,
              winRatePct: Number(row?.win_rate_pct ?? 0),
              edgePoints,
              baselineWinRatePct: row?.baseline_win_rate_pct == null ? null : Number(row.baseline_win_rate_pct),
              isValidated,
            };
            cellCache.set(cellKey, cell);
          }
          next[a.id] = cell;
        }

        if (!cancelled) setStatuses(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const summary = useMemo(() => {
    const total = alerts.length;
    const qualifying = alerts.filter((a) => statuses[a.id]?.qualifies).length;
    return { total, qualifying, nonQualifying: total - qualifying };
  }, [alerts, statuses]);

  return { statuses, loading, summary };
}
