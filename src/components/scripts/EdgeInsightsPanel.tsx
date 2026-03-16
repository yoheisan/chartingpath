import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Zap, XCircle } from "lucide-react";

interface PatternStat {
  pattern_id: string | null;
  pattern_name: string | null;
  timeframe: string | null;
  total_trades: number | null;
  wins: number | null;
  losses: number | null;
  win_rate_pct: number | null;
  expectancy_r: number | null;
  avg_rr: number | null;
  avg_bars: number | null;
}

// Aggregated stats per pattern_id
export interface PatternEdge {
  pattern_id: string;
  pattern_name: string;
  total_trades: number;
  win_rate_pct: number;
  expectancy_r: number;
  avg_rr: number;
  hasEdge: boolean;
  sufficient: boolean; // n >= 10
}

interface EdgeInsightsPanelProps {
  symbol: string;
  onSelectWinners: (patternIds: string[]) => void;
  onDeselectLosers: (patternIds: string[]) => void;
}

export function EdgeInsightsPanel({ symbol, onSelectWinners, onDeselectLosers }: EdgeInsightsPanelProps) {
  const [stats, setStats] = useState<PatternStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    supabase
      .from('instrument_pattern_stats_mv')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .order('total_trades', { ascending: false })
      .then(({ data }) => {
        setStats(data || []);
        setLoading(false);
      });
  }, [symbol]);

  const aggregated = useMemo<PatternEdge[]>(() => {
    const map = new Map<string, { trades: number; wins: number; losses: number; rrSum: number }>();
    for (const s of stats) {
      if (!s.pattern_id || !s.pattern_name) continue;
      const existing = map.get(s.pattern_id) || { trades: 0, wins: 0, losses: 0, rrSum: 0 };
      existing.trades += s.total_trades || 0;
      existing.wins += s.wins || 0;
      existing.losses += s.losses || 0;
      existing.rrSum += (s.avg_rr || 0) * (s.total_trades || 0);
      map.set(s.pattern_id, existing);
    }

    const result: PatternEdge[] = [];
    for (const [pid, agg] of map) {
      const name = stats.find(s => s.pattern_id === pid)?.pattern_name || pid;
      const wr = agg.trades > 0 ? agg.wins / agg.trades : 0;
      const avgRr = agg.trades > 0 ? agg.rrSum / agg.trades : 0;
      const exp = wr * avgRr - (1 - wr);
      result.push({
        pattern_id: pid,
        pattern_name: name,
        total_trades: agg.trades,
        win_rate_pct: Math.round(wr * 1000) / 10,
        expectancy_r: Math.round(exp * 1000) / 1000,
        avg_rr: Math.round(avgRr * 100) / 100,
        hasEdge: exp > 0,
        sufficient: agg.trades >= 10,
      });
    }
    return result.sort((a, b) => b.expectancy_r - a.expectancy_r);
  }, [stats]);

  const winners = useMemo(() => aggregated.filter(p => p.hasEdge && p.sufficient).map(p => p.pattern_id), [aggregated]);
  const losers = useMemo(() => aggregated.filter(p => !p.hasEdge && p.sufficient).map(p => p.pattern_id), [aggregated]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (aggregated.length === 0) {
    return (
      <Card className="border-muted">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No historical data for <span className="font-mono font-semibold">{symbol}</span></p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Edge Insights — {symbol.toUpperCase()}
        </CardTitle>
        <CardDescription className="text-xs">
          Historical pattern performance on this instrument
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick actions */}
        <div className="flex gap-2">
          {winners.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => onSelectWinners(winners)}
            >
              <TrendingUp className="h-3 w-3" />
              Select Winners ({winners.length})
            </Button>
          )}
          {losers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => onDeselectLosers(losers)}
            >
              <XCircle className="h-3 w-3" />
              Deselect Losers ({losers.length})
            </Button>
          )}
        </div>

        {/* Pattern list */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {aggregated.map(p => (
            <div
              key={p.pattern_id}
              className={`flex items-center justify-between px-2 py-1.5 rounded text-sm ${
                p.hasEdge && p.sufficient
                  ? 'bg-emerald-500/5'
                  : !p.hasEdge && p.sufficient
                  ? 'bg-destructive/5'
                  : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {p.hasEdge ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive shrink-0" />
                )}
                <span className="truncate">{p.pattern_name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 ${
                    p.hasEdge ? 'text-emerald-600 border-emerald-500/30' : 'text-destructive border-destructive/30'
                  }`}
                >
                  {p.win_rate_pct}% WR
                </Badge>
                <span className={`text-xs font-mono ${p.expectancy_r > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {p.expectancy_r > 0 ? '+' : ''}{p.expectancy_r}R
                </span>
                <span className="text-[10px] text-muted-foreground">
                  n={p.total_trades}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to get edge data for badge overlays
export function useEdgeData(symbol: string | null): Map<string, PatternEdge> {
  const [stats, setStats] = useState<PatternStat[]>([]);

  useEffect(() => {
    if (!symbol) { setStats([]); return; }
    supabase
      .from('instrument_pattern_stats_mv')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .then(({ data }) => setStats(data || []));
  }, [symbol]);

  return useMemo(() => {
    const map = new Map<string, { trades: number; wins: number; losses: number; rrSum: number; name: string }>();
    for (const s of stats) {
      if (!s.pattern_id || !s.pattern_name) continue;
      const existing = map.get(s.pattern_id) || { trades: 0, wins: 0, losses: 0, rrSum: 0, name: s.pattern_name };
      existing.trades += s.total_trades || 0;
      existing.wins += s.wins || 0;
      existing.losses += s.losses || 0;
      existing.rrSum += (s.avg_rr || 0) * (s.total_trades || 0);
      map.set(s.pattern_id, existing);
    }

    const result = new Map<string, PatternEdge>();
    for (const [pid, agg] of map) {
      const wr = agg.trades > 0 ? agg.wins / agg.trades : 0;
      const avgRr = agg.trades > 0 ? agg.rrSum / agg.trades : 0;
      const exp = wr * avgRr - (1 - wr);
      result.set(pid, {
        pattern_id: pid,
        pattern_name: agg.name,
        total_trades: agg.trades,
        win_rate_pct: Math.round(wr * 1000) / 10,
        expectancy_r: Math.round(exp * 1000) / 1000,
        avg_rr: Math.round(avgRr * 100) / 100,
        hasEdge: exp > 0,
        sufficient: agg.trades >= 10,
      });
    }
    return result;
  }, [stats]);
}
