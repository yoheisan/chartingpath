import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ForwardRecord {
  issued: number;
  resolved: number;
  forwardWinRate: number | null;
  forwardExpectancy: number | null;
  backtestWinRate: number | null;
  backtestExpectancy: number | null;
  backtestSample: number;
  /** Below this, we show "record still building" rather than a percentage. */
  sufficientSample: boolean;
}

const MIN_RESOLVED = 30;

/**
 * Forward record of the edge-alert autopilot: every signal we issued, logged
 * automatically, compared with the backtested figures for the same cells.
 */
export function useForwardRecord(userId?: string) {
  const [record, setRecord] = useState<ForwardRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const { data: trades } = await supabase
          .from('paper_trades')
          .select('status, outcome_r, pattern_id, timeframe, asset_type, trade_type')
          .eq('user_id', userId)
          .eq('source', 'edge_alert_autopilot')
          .limit(1000);

        const rows = trades || [];
        const resolvedRows = rows.filter(
          r => r.status === 'closed' && r.outcome_r !== null && r.outcome_r !== undefined
        );

        const resolved = resolvedRows.length;
        const wins = resolvedRows.filter(r => Number(r.outcome_r) > 0).length;
        const sufficientSample = resolved >= MIN_RESOLVED;

        // Backtested figures for the same cells, weighted by their sample sizes.
        const cells = new Map<string, { pattern_id: string; timeframe: string; asset_type: string; direction: string }>();
        for (const r of rows) {
          if (!r.pattern_id || !r.timeframe || !r.asset_type) continue;
          const direction = r.trade_type === 'short' ? 'short' : 'long';
          cells.set(`${r.pattern_id}|${r.timeframe}|${r.asset_type}|${direction}`, {
            pattern_id: r.pattern_id,
            timeframe: r.timeframe,
            asset_type: r.asset_type,
            direction,
          });
        }

        let btN = 0, btWinWeighted = 0, btExpWeighted = 0;
        await Promise.all(
          [...cells.values()].slice(0, 25).map(async (c) => {
            const { data } = await supabase.rpc('get_pattern_edge', {
              p_pattern_id: c.pattern_id,
              p_timeframe: c.timeframe,
              p_asset_type: c.asset_type,
              p_direction: c.direction,
            });
            const row: any = Array.isArray(data) ? data[0] : data;
            const n = Number(row?.total_trades ?? 0);
            if (n <= 0) return;
            btN += n;
            btWinWeighted += Number(row?.win_rate_pct ?? 0) * n;
            btExpWeighted += Number(row?.expectancy_r ?? 0) * n;
          })
        );

        if (cancelled) return;
        setRecord({
          issued: rows.length,
          resolved,
          forwardWinRate: sufficientSample ? (wins / resolved) * 100 : null,
          forwardExpectancy: sufficientSample
            ? resolvedRows.reduce((s, r) => s + Number(r.outcome_r), 0) / resolved
            : null,
          backtestWinRate: btN > 0 ? btWinWeighted / btN : null,
          backtestExpectancy: btN > 0 ? btExpWeighted / btN : null,
          backtestSample: btN,
          sufficientSample,
        });
      } catch (err) {
        console.error('[useForwardRecord]', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [userId]);

  return { record, loading, minResolved: MIN_RESOLVED };
}