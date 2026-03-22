import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calcWinRate, calcAvgR, type PaperTrade, type SessionLog } from '@/hooks/useTradeReport';

interface Props {
  trades: PaperTrade[];
  sessions: SessionLog[];
}

interface PlatformAvgs {
  winRate: number;
  avgR: number;
  consistency: number;
  userCount: number;
}

export function PeerComparison({ trades, sessions }: Props) {
  const [platformAvgs, setPlatformAvgs] = useState<PlatformAvgs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Get aggregated platform stats (no PII)
      const { data: allTrades, count } = await supabase
        .from('paper_trades')
        .select('outcome_r, user_id', { count: 'exact' })
        .eq('status', 'closed')
        .not('outcome_r', 'is', null)
        .limit(1000);

      if (!allTrades || !count) { setLoading(false); return; }

      // Count unique users
      const users = new Set(allTrades.map(t => t.user_id));
      if (users.size < 100) { setLoading(false); return; }

      const wins = allTrades.filter(t => (t.outcome_r ?? 0) > 0).length;
      const avgR = allTrades.reduce((s, t) => s + (t.outcome_r ?? 0), 0) / allTrades.length;

      // Get session consistency
      const { data: allSessions } = await supabase
        .from('session_logs')
        .select('ai_pnl_r, human_pnl_r')
        .limit(1000);

      const profSessions = (allSessions || []).filter(s => ((s.ai_pnl_r ?? 0) + (s.human_pnl_r ?? 0)) > 0).length;
      const totalSessions = (allSessions || []).length;

      setPlatformAvgs({
        winRate: Math.round((wins / allTrades.length) * 100),
        avgR: parseFloat(avgR.toFixed(2)),
        consistency: totalSessions > 0 ? Math.round((profSessions / totalSessions) * 100) : 0,
        userCount: users.size,
      });
      setLoading(false);
    };
    load();
  }, []);

  const myStats = useMemo(() => {
    const wr = calcWinRate(trades);
    const avgR = calcAvgR(trades);
    const profSessions = sessions.filter(s => ((s.ai_pnl_r ?? 0) + (s.human_pnl_r ?? 0)) > 0).length;
    const consistency = sessions.length > 0 ? Math.round((profSessions / sessions.length) * 100) : 0;
    return { wr, avgR, consistency };
  }, [trades, sessions]);

  if (loading) return null;
  if (!platformAvgs) return null; // fewer than 100 users — hide section entirely

  const comparisons = [
    {
      label: 'Win rate',
      yours: `${myStats.wr}%`,
      platform: `${platformAvgs.winRate}%`,
      percentile: myStats.wr > platformAvgs.winRate ? Math.min(99, Math.round(50 + (myStats.wr - platformAvgs.winRate) * 2)) : Math.max(1, Math.round(50 - (platformAvgs.winRate - myStats.wr) * 2)),
    },
    {
      label: 'Avg R per trade',
      yours: `${myStats.avgR >= 0 ? '+' : ''}${myStats.avgR.toFixed(1)}R`,
      platform: `${platformAvgs.avgR >= 0 ? '+' : ''}${platformAvgs.avgR.toFixed(1)}R`,
      percentile: myStats.avgR > platformAvgs.avgR ? Math.min(99, Math.round(50 + (myStats.avgR - platformAvgs.avgR) * 20)) : Math.max(1, Math.round(50 - (platformAvgs.avgR - myStats.avgR) * 20)),
    },
    {
      label: 'Plan consistency',
      yours: `${myStats.consistency}%`,
      platform: `${platformAvgs.consistency}%`,
      percentile: myStats.consistency > platformAvgs.consistency ? Math.min(99, Math.round(50 + (myStats.consistency - platformAvgs.consistency))) : Math.max(1, Math.round(50 - (platformAvgs.consistency - myStats.consistency))),
    },
  ];

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">How you compare</h2>
      <p className="text-xs text-muted-foreground mb-5">
        Anonymous aggregate data from all ChartingPath paper traders.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        {comparisons.map(c => (
          <div key={c.label} className="border border-border/30 rounded-lg p-4 text-center">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-3">{c.label}</p>
            <div className="flex items-center justify-center gap-4 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">You</p>
                <p className="text-lg font-mono font-bold text-foreground">{c.yours}</p>
              </div>
              <span className="text-muted-foreground/40">vs</span>
              <div>
                <p className="text-xs text-muted-foreground">Platform</p>
                <p className="text-lg font-mono font-bold text-muted-foreground">{c.platform}</p>
              </div>
            </div>
            <p className={`text-xs font-medium ${c.percentile >= 50 ? 'text-[hsl(var(--bullish))]' : 'text-muted-foreground'}`}>
              Better than {c.percentile}% of traders
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
