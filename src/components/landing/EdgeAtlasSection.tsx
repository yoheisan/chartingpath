import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, TrendingUp, FlaskConical, ArrowRight, Info, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

const CONFIDENCE_THRESHOLD = 200;

// Map pattern_id to screener pattern filter value
const PATTERN_ID_TO_SCREENER: Record<string, string> = {
  'bullish-flag': 'bullish-flag',
  'bearish-flag': 'bearish-flag',
  'double-bottom': 'double-bottom',
  'double-top': 'double-top',
  'triple-bottom': 'triple-bottom',
  'triple-top': 'triple-top',
  'ascending-triangle': 'ascending-triangle',
  'descending-triangle': 'descending-triangle',
  'symmetrical-triangle': 'symmetrical-triangle',
  'head-and-shoulders': 'head-and-shoulders',
  'inverse-head-and-shoulders': 'inverse-head-and-shoulders',
  'rising-wedge': 'rising-wedge',
  'falling-wedge': 'falling-wedge',
  'cup-and-handle': 'cup-and-handle',
  'inverse-cup-and-handle': 'inverse-cup-and-handle',
  'donchian-breakout-long': 'donchian-breakout-long',
  'donchian-breakout-short': 'donchian-breakout-short',
};

const TF_LABEL: Record<string, string> = {
  '1wk': '1W',
  '1d': '1D',
  '8h': '8H',
  '4h': '4H',
  '1h': '1H',
};

export function EdgeAtlasSection() {
  const [rankings, setRankings] = useState<EdgeRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
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

          if (error || !data || data.length === 0) break;
          allData = allData.concat(data as typeof allData);
          if (data.length < PAGE_SIZE) break;
          page++;
        }

        if (!allData.length) return;

        const groups: Record<string, {
          pattern_name: string; pattern_id: string; timeframe: string;
          total: number; wins: number; losses: number; sum_rr: number; sum_bars: number;
        }> = {};

        for (const row of allData) {
          const key = `${row.pattern_id}|${row.timeframe}`;
          if (!groups[key]) {
            groups[key] = { pattern_name: row.pattern_name, pattern_id: row.pattern_id, timeframe: row.timeframe, total: 0, wins: 0, losses: 0, sum_rr: 0, sum_bars: 0 };
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
            const est_annualized_pct = trades_per_year * expectancy_r * 1.0;
            return {
              pattern_name: g.pattern_name, pattern_id: g.pattern_id, timeframe: g.timeframe,
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
        console.error('EdgeAtlas fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const handleFindSignals = (r: EdgeRanking) => {
    const screenerId = PATTERN_ID_TO_SCREENER[r.pattern_id] || r.pattern_id;
    navigate(`/patterns/live?pattern=${encodeURIComponent(screenerId)}&timeframe=${r.timeframe}`);
  };

  const handleBacktest = (r: EdgeRanking) => {
    navigate(`/pattern-lab?pattern=${encodeURIComponent(r.pattern_id)}&timeframe=${r.timeframe}&mode=validate`);
  };

  const RANK_ICONS = ['🥇', '🥈', '🥉'];

  return (
    <section className="py-14 px-6 bg-background border-t border-border/40">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Edge Atlas</span>
            </div>
            <h2 className="text-2xl font-bold">Patterns with Proven Edge</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Ranked by estimated annualized return from historical data. Start here — not with guesswork.
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                  <Info className="h-3.5 w-3.5" />
                  How is this calculated?
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Est. Annual % = trades/year × expectancy R × 1% risk per trade. Based on all resolved historical detections. ⚠️ = fewer than {CONFIDENCE_THRESHOLD} samples.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-4 w-12 ml-auto" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-10 text-center text-muted-foreground">
            Not enough historical data yet to rank patterns.
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
            {rankings.map((r, i) => {
              const isLowSample = r.total_trades < CONFIDENCE_THRESHOLD;
              const isTop3 = i < 3;
              return (
                <div
                  key={`${r.pattern_id}-${r.timeframe}`}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors ${isTop3 ? 'bg-card/50' : ''}`}
                >
                  {/* Rank + Pattern */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-lg w-7 shrink-0 text-center">
                      {i < 3 ? RANK_ICONS[i] : <span className="text-sm text-muted-foreground font-medium">{i + 1}</span>}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{r.pattern_name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 shrink-0">
                          {TF_LABEL[r.timeframe] || r.timeframe}
                        </Badge>
                        {isLowSample && (
                          <span className="text-[10px] text-yellow-500">⚠️ low sample</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>Win: <span className={`font-medium ${r.win_rate_pct >= 55 ? 'text-green-500' : r.win_rate_pct >= 45 ? 'text-foreground' : 'text-muted-foreground'}`}>{r.win_rate_pct}%</span></span>
                        <span>Expect: <span className="font-mono text-green-500">{r.expectancy_r.toFixed(3)}R</span></span>
                        <span className="hidden sm:inline">{r.trades_per_year.toFixed(0)} trades/yr</span>
                        <span className="text-muted-foreground/60">n={r.total_trades.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Est Annual */}
                  <div className="shrink-0 text-right sm:text-left sm:w-20">
                    <div className={`text-lg font-bold ${r.est_annualized_pct >= 20 ? 'text-green-500' : r.est_annualized_pct >= 8 ? 'text-primary' : 'text-muted-foreground'}`}>
                      +{r.est_annualized_pct.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">est. annual</div>
                  </div>

                  {/* CTAs */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => handleFindSignals(r)}
                    >
                      <Zap className="h-3 w-3" />
                      Active Signals
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => handleBacktest(r)}
                    >
                      <FlaskConical className="h-3 w-3" />
                      Backtest
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && rankings.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Use <strong>Active Signals</strong> to see what's tradable now · Use <strong>Backtest</strong> to validate on a specific instrument and export a script
          </p>
        )}
      </div>
    </section>
  );
}
