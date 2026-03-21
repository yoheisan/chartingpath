import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  instrument: string;
  strategyName: string;
  metric: number;
  metricLabel: string;
}

export const LeaderboardSidebar: React.FC = () => {
  const [topByExpectancy, setTopByExpectancy] = useState<LeaderboardEntry[]>([]);
  const [topByWinRate, setTopByWinRate] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // Top by win rate (min 30 trades)
        const { data: winRateData } = await supabase
          .from('backtest_runs')
          .select('id, instrument, strategy_name, win_rate, total_trades')
          .eq('is_community_shared', true)
          .gte('total_trades', 30)
          .not('win_rate', 'is', null)
          .order('win_rate', { ascending: false })
          .limit(5);

        // Top by profit factor (proxy for expectancy)
        const { data: expectancyData } = await supabase
          .from('backtest_runs')
          .select('id, instrument, strategy_name, profit_factor, total_trades')
          .eq('is_community_shared', true)
          .gte('total_trades', 10)
          .not('profit_factor', 'is', null)
          .order('profit_factor', { ascending: false })
          .limit(5);

        setTopByWinRate(
          (winRateData || []).map(d => ({
            id: d.id,
            instrument: d.instrument,
            strategyName: d.strategy_name,
            metric: d.win_rate!,
            metricLabel: `${d.win_rate!.toFixed(1)}% WR`,
          }))
        );

        setTopByExpectancy(
          (expectancyData || []).map(d => ({
            id: d.id,
            instrument: d.instrument,
            strategyName: d.strategy_name,
            metric: d.profit_factor!,
            metricLabel: `${d.profit_factor!.toFixed(2)} PF`,
          }))
        );
      } catch (err) {
        console.error('[LeaderboardSidebar]', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Top Edges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = topByExpectancy.length > 0 || topByWinRate.length > 0;

  if (!hasData) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Top Edges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            Share your first backtest to appear here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {topByExpectancy.length > 0 && (
        <LeaderboardSection
          title="Highest Profit Factor"
          icon={<TrendingUp className="w-4 h-4 text-[hsl(var(--bullish))]" />}
          entries={topByExpectancy}
        />
      )}
      {topByWinRate.length > 0 && (
        <LeaderboardSection
          title="Best Win Rate"
          icon={<Trophy className="w-4 h-4 text-primary" />}
          entries={topByWinRate}
        />
      )}
    </div>
  );
};

function LeaderboardSection({ title, icon, entries }: { title: string; icon: React.ReactNode; entries: LeaderboardEntry[] }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="space-y-1.5">
          {entries.map((entry, i) => {
            const symbol = entry.instrument.replace('=X', '').replace('=F', '').replace('-USD', '');
            return (
              <div key={entry.id} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    i === 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {i + 1}
                  </span>
                  <span className="font-medium truncate">{symbol}</span>
                </div>
                <Badge variant="secondary" className="text-sm font-mono shrink-0">
                  {entry.metricLabel}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
