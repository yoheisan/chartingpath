import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, TrendingUp, Loader2, Info } from 'lucide-react';

interface EdgeRanking {
  pattern_name: string;
  pattern_id: string;
  timeframe: string;
  total_trades: number;
  win_rate_pct: number;
  expectancy_r: number;
  trades_per_year: number;
  est_annualized_pct: number;
  avg_bars: number;
}

const BARS_PER_YEAR: Record<string, number> = {
  '1wk': 52,
  '1d': 252,
  '8h': 756,
  '4h': 1512,
  '1h': 6048,
};

const MEDAL_COLORS = [
  'text-yellow-400',
  'text-slate-400',
  'text-amber-600',
];

const CONFIDENCE_THRESHOLD = 200;

export const EdgeRankingsCard = () => {
  const [rankings, setRankings] = useState<EdgeRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        // Paginate through all resolved outcomes (Supabase default limit is 1000)
        const PAGE_SIZE = 1000;
        let allData: { pattern_id: string; pattern_name: string; timeframe: string; outcome: string; risk_reward_ratio: number; bars_to_outcome: number }[] = [];
        let page = 0;
        while (true) {
          const { data, error } = await supabase
            .from('historical_pattern_occurrences')
            .select('pattern_id, pattern_name, timeframe, outcome, risk_reward_ratio, bars_to_outcome')
            .in('outcome', ['hit_tp', 'hit_sl'])
            .not('bars_to_outcome', 'is', null)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

          if (error) break;
          if (!data || data.length === 0) break;
          allData = allData.concat(data as typeof allData);
          if (data.length < PAGE_SIZE) break;
          page++;
        }

        const data = allData;
        if (!data.length) return;

        // Aggregate per (pattern_id, timeframe)
        const groups: Record<string, {
          pattern_name: string;
          pattern_id: string;
          timeframe: string;
          total: number;
          wins: number;
          losses: number;
          sum_rr: number;
          sum_bars: number;
        }> = {};

        for (const row of data) {
          const key = `${row.pattern_id}|${row.timeframe}`;
          if (!groups[key]) {
            groups[key] = {
              pattern_name: row.pattern_name,
              pattern_id: row.pattern_id,
              timeframe: row.timeframe,
              total: 0, wins: 0, losses: 0, sum_rr: 0, sum_bars: 0,
            };
          }
          const g = groups[key];
          g.total += 1;
          if (row.outcome === 'hit_tp') g.wins += 1;
          else g.losses += 1;
          g.sum_rr += (row.risk_reward_ratio ?? 2);
          g.sum_bars += (row.bars_to_outcome ?? 0);
        }

        const ranked: EdgeRanking[] = Object.values(groups)
          .filter(g => g.total >= 50)
          .map(g => {
            const win_rate = g.wins / g.total;
            const loss_rate = g.losses / g.total;
            const avg_rr = g.sum_rr / g.total;
            const avg_bars = g.sum_bars / g.total;
            const expectancy_r = win_rate * avg_rr - loss_rate;
            const bpy = BARS_PER_YEAR[g.timeframe] ?? 252;
            const trades_per_year = bpy / Math.max(avg_bars, 1);
            const est_annualized_pct = trades_per_year * expectancy_r * 1.0; // 1% risk/trade

            return {
              pattern_name: g.pattern_name,
              pattern_id: g.pattern_id,
              timeframe: g.timeframe,
              total_trades: g.total,
              win_rate_pct: Math.round(win_rate * 1000) / 10,
              expectancy_r: Math.round(expectancy_r * 1000) / 1000,
              trades_per_year: Math.round(trades_per_year * 10) / 10,
              est_annualized_pct: Math.round(est_annualized_pct * 10) / 10,
              avg_bars: Math.round(avg_bars * 10) / 10,
            };
          })
          .filter(r => r.expectancy_r > 0)
          .sort((a, b) => b.est_annualized_pct - a.est_annualized_pct)
          .slice(0, 8);

        setRankings(ranked);
      } catch (e) {
        console.error('EdgeRankings fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Edge Rankings
          <span className="text-xs font-normal text-muted-foreground ml-1">
            — Estimated annualized return @ 1% risk/trade
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Computing edge rankings from historical data…</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border/50">
                    <th className="text-left pb-2 font-medium w-6">#</th>
                    <th className="text-left pb-2 font-medium">Pattern</th>
                    <th className="text-center pb-2 font-medium">TF</th>
                    <th className="text-right pb-2 font-medium">Win %</th>
                    <th className="text-right pb-2 font-medium">Expect. R</th>
                    <th className="text-right pb-2 font-medium">Trades/yr</th>
                    <th className="text-right pb-2 font-medium">Est. Annual</th>
                    <th className="text-right pb-2 font-medium">n</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {rankings.map((r, i) => {
                    const isLowSample = r.total_trades < CONFIDENCE_THRESHOLD;
                    return (
                      <tr key={`${r.pattern_id}-${r.timeframe}`} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2 pr-2">
                          <span className={`font-bold ${MEDAL_COLORS[i] ?? 'text-muted-foreground'}`}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="font-medium">{r.pattern_name}</span>
                        </td>
                        <td className="py-2 text-center">
                          <Badge variant="outline" className="text-sm font-mono px-1.5 py-0">
                            {r.timeframe}
                          </Badge>
                        </td>
                        <td className="py-2 text-right text-muted-foreground">{r.win_rate_pct}%</td>
                        <td className="py-2 text-right">
                          <span className="text-green-500 font-mono">{r.expectancy_r.toFixed(3)}R</span>
                        </td>
                        <td className="py-2 text-right text-muted-foreground">{r.trades_per_year.toFixed(0)}</td>
                        <td className="py-2 text-right">
                          <span className={`font-bold ${r.est_annualized_pct >= 20 ? 'text-green-500' : r.est_annualized_pct >= 5 ? 'text-primary' : 'text-muted-foreground'}`}>
                            +{r.est_annualized_pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span className={`text-xs ${isLowSample ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                            {isLowSample ? '⚠️ ' : ''}{r.total_trades.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/40 flex gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Est. Annual %</strong> = trades/year × expectancy R × 1% risk. Assumes free capital rotation and no correlation between instruments. ⚠️ = fewer than {CONFIDENCE_THRESHOLD} samples (lower confidence). Higher timeframes have stronger per-trade edge but trade far less frequently.
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
