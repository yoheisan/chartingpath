import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PaperTrade, PaperPortfolio } from '@/hooks/usePaperTrading';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Clock, Award, BarChart3, Activity, CalendarDays } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from 'recharts';
import { useForwardPerformance } from '@/hooks/useForwardPerformance';
import { useTranslation } from 'react-i18next';

interface PerformanceTabProps {
  closedTrades: PaperTrade[];
  portfolio: PaperPortfolio | null;
  userId?: string;
}

function extractPattern(notes: string | null): string {
  const match = notes?.match(/\[pattern:([^\]]+)\]/);
  return match?.[1]?.replace(/_/g, ' ') ?? 'Unknown';
}

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(224 44% 7%)',
    border: '1px solid hsl(215 25% 15%)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'hsl(210 40% 98%)',
  },
};

export function PerformanceTab({ closedTrades, portfolio, userId }: PerformanceTabProps) {
  const { t } = useTranslation();
  const { data: forwardData } = useForwardPerformance(userId);

  const stats = useMemo(() => {
    if (closedTrades.length === 0) return null;

    const totalTrades = closedTrades.length;
    const tpTrades = closedTrades.filter(t => t.close_reason?.includes('Take profit') || ((t.pnl ?? 0) > 0 && !t.override_reason && !t.close_reason?.includes('Timed out')));
    const slTrades = closedTrades.filter(t => t.close_reason?.includes('Stop loss') || ((t.pnl ?? 0) < 0 && !t.override_reason && !t.close_reason?.includes('Timed out')));
    const nonTimeouts = closedTrades.filter(t => !t.close_reason?.includes('Timed out'));
    const winRate = nonTimeouts.length > 0 ? (tpTrades.length / nonTimeouts.length) * 100 : 0;
    const avgR = closedTrades.reduce((sum, t) => sum + (t.outcome_r ?? 0), 0) / totalTrades;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

    const bestTrade = closedTrades.reduce((best, t) => (t.outcome_r ?? -Infinity) > (best.outcome_r ?? -Infinity) ? t : best, closedTrades[0]);
    const worstTrade = closedTrades.reduce((worst, t) => (t.outcome_r ?? Infinity) < (worst.outcome_r ?? Infinity) ? t : worst, closedTrades[0]);

    const avgHoldHours = closedTrades
      .filter(t => t.closed_at && t.created_at)
      .reduce((sum, t) => {
        const hours = (new Date(t.closed_at!).getTime() - new Date(t.created_at).getTime()) / 3600000;
        return sum + hours;
      }, 0) / Math.max(1, closedTrades.filter(t => t.closed_at).length);

    return { totalTrades, winRate, avgR, totalPnl, bestTrade, worstTrade, avgHoldHours };
  }, [closedTrades]);

  const todayStats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todays = closedTrades.filter(t => {
      const closedAt = t.closed_at ? new Date(t.closed_at).getTime() : 0;
      return closedAt >= startOfDay;
    });
    const pnl = todays.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const wins = todays.filter(t => (t.pnl ?? 0) > 0).length;
    const losses = todays.filter(t => (t.pnl ?? 0) < 0).length;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const sharePct = totalPnl !== 0 ? (pnl / Math.abs(totalPnl)) * 100 : 0;
    return { count: todays.length, pnl, wins, losses, sharePct, trades: todays };
  }, [closedTrades]);

  const equityCurve = useMemo(() => {
    const sorted = [...closedTrades].sort((a, b) => new Date(a.closed_at ?? a.created_at).getTime() - new Date(b.closed_at ?? b.created_at).getTime());
    let cumPnl = 0;
    return sorted.map(t => {
      cumPnl += t.pnl ?? 0;
      return {
        date: t.closed_at ? new Date(t.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        pnl: Math.round(cumPnl * 100) / 100,
      };
    });
  }, [closedTrades]);

  const patternStats = useMemo(() => {
    const grouped: Record<string, { wins: number; losses: number; total: number }> = {};
    for (const t of closedTrades) {
      const p = extractPattern(t.notes);
      if (!grouped[p]) grouped[p] = { wins: 0, losses: 0, total: 0 };
      grouped[p].total++;
      if ((t.pnl ?? 0) > 0) grouped[p].wins++;
      else grouped[p].losses++;
    }
    return Object.entries(grouped)
      .filter(([, s]) => s.total >= 3)
      .map(([name, s]) => ({
        name: name.length > 15 ? name.slice(0, 15) + '…' : name,
        winRate: Math.round((s.wins / s.total) * 100),
        lossRate: Math.round((s.losses / s.total) * 100),
        total: s.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [closedTrades]);

  const rDistribution = useMemo(() => {
    const buckets = [
      { label: '<-1R', min: -Infinity, max: -1, count: 0 },
      { label: '-1R', min: -1, max: -0.5, count: 0 },
      { label: '-0.5 to 0R', min: -0.5, max: 0, count: 0 },
      { label: '0 to +1R', min: 0, max: 1, count: 0 },
      { label: '+1 to +2R', min: 1, max: 2, count: 0 },
      { label: '>+2R', min: 2, max: Infinity, count: 0 },
    ];
    for (const t of closedTrades) {
      const r = t.outcome_r ?? 0;
      for (const b of buckets) {
        if (r >= b.min && r < b.max) { b.count++; break; }
      }
    }
    return buckets;
  }, [closedTrades]);

  if (!stats || closedTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{t('paperTrading.noPerformanceData')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('paperTrading.noPerformanceDataDesc')}</p>
        </div>
      </div>
    );
  }

  const equityFinalPositive = (equityCurve[equityCurve.length - 1]?.pnl ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{t('paperTrading.todayTitle', 'Today')}</h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {todayStats.count} {todayStats.count === 1 ? t('paperTrading.tradeClosed', 'trade closed') : t('paperTrading.tradesClosed', 'trades closed')}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('paperTrading.todayPnl', "Today's P&L")}</div>
              <div className={cn('text-xl font-bold tabular-nums', todayStats.pnl > 0 ? 'text-emerald-500' : todayStats.pnl < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                {todayStats.pnl >= 0 ? '+' : ''}${todayStats.pnl.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('paperTrading.shareOfTotal', 'Share of total')}</div>
              <div className="text-xl font-bold tabular-nums">
                {todayStats.count === 0 ? '—' : `${todayStats.sharePct >= 0 ? '+' : ''}${todayStats.sharePct.toFixed(0)}%`}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('paperTrading.winsLosses', 'Wins / Losses')}</div>
              <div className="text-xl font-bold tabular-nums">
                <span className="text-emerald-500">{todayStats.wins}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-red-500">{todayStats.losses}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('paperTrading.cumulativeLabel', 'Cumulative')}</div>
              <div className={cn('text-xl font-bold tabular-nums', stats.totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
              </div>
            </div>
          </div>
          {todayStats.trades.length > 0 && (
            <div className="mt-4 rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-2 font-medium text-muted-foreground">{t('paperTrading.symbol', 'Symbol')}</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">{t('paperTrading.pattern', 'Pattern')}</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">R</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">P&L</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">{t('paperTrading.outcome', 'Outcome')}</th>
                  </tr>
                </thead>
                <tbody>
                  {todayStats.trades.slice(0, 8).map((trade) => {
                    const r = trade.outcome_r ?? 0;
                    const pnl = trade.pnl ?? 0;
                    return (
                      <tr key={trade.id} className="border-b border-border/50 last:border-0">
                        <td className="p-2 font-medium">{trade.symbol}</td>
                        <td className="p-2 capitalize text-muted-foreground">{extractPattern(trade.notes)}</td>
                        <td className={cn('p-2 text-right tabular-nums', r >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                          {r >= 0 ? '+' : ''}{r.toFixed(2)}R
                        </td>
                        <td className={cn('p-2 text-right tabular-nums font-medium', pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </td>
                        <td className="p-2 text-muted-foreground truncate max-w-[160px]">{trade.close_reason ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {todayStats.trades.length > 8 && (
                <div className="text-xs text-muted-foreground text-center p-2 bg-muted/20">
                  +{todayStats.trades.length - 8} {t('paperTrading.moreTrades', 'more')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('paperTrading.totalTrades')} value={stats.totalTrades.toString()} icon={<Activity className="h-4 w-4" />} />
        <StatCard
          label={t('paperTrading.winRate')}
          value={`${stats.winRate.toFixed(0)}%`}
          icon={<Target className="h-4 w-4" />}
          color={stats.winRate >= 50 ? 'text-emerald-500' : 'text-red-500'}
        />
        <StatCard
          label={t('paperTrading.avgRTrade')}
          value={`${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`}
          icon={<TrendingUp className="h-4 w-4" />}
          color={stats.avgR >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
        <StatCard
          label={t('paperTrading.totalPnl')}
          value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
          icon={stats.totalPnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          color={stats.totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label={t('paperTrading.bestTrade')}
          value={`+${(stats.bestTrade.outcome_r ?? 0).toFixed(1)}R`}
          subtitle={stats.bestTrade.symbol}
          icon={<Award className="h-4 w-4" />}
          color="text-emerald-500"
        />
        <StatCard
          label={t('paperTrading.worstTrade')}
          value={`${(stats.worstTrade.outcome_r ?? 0).toFixed(1)}R`}
          subtitle={stats.worstTrade.symbol}
          icon={<TrendingDown className="h-4 w-4" />}
          color="text-red-500"
        />
        <StatCard
          label={t('paperTrading.avgHoldTime')}
          value={stats.avgHoldHours < 24 ? `${stats.avgHoldHours.toFixed(0)}h` : `${(stats.avgHoldHours / 24).toFixed(1)}d`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {equityCurve.length > 1 && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">{t('paperTrading.equityCurve')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 15% 20%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(217 10% 65%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(217 10% 65%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <RechartsTooltip {...chartTooltipStyle} formatter={(value: number) => [`$${value.toFixed(2)}`, t('paperTrading.cumulativePnl')]} />
                <Line type="monotone" dataKey="pnl" stroke={equityFinalPositive ? '#10b981' : '#ef4444'} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {patternStats.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">{t('paperTrading.winRateByPattern')}</h3>
            <ResponsiveContainer width="100%" height={patternStats.length * 36 + 20}>
              <BarChart data={patternStats} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 15% 20%)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(217 10% 65%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(217 10% 65%)' }} axisLine={false} tickLine={false} width={100} />
                <RechartsTooltip {...chartTooltipStyle} formatter={(value: number, name: string) => [`${value}%`, name === 'winRate' ? t('paperTrading.win') : t('paperTrading.loss')]} />
                <Bar dataKey="winRate" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} />
                <Bar dataKey="lossRate" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">{t('paperTrading.rDistribution')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 15% 20%)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(217 10% 65%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(217 10% 65%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <RechartsTooltip {...chartTooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {rDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.min >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {forwardData.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">{t('paperTrading.patternEdgeComparison')}</h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-2 font-medium text-muted-foreground">{t('paperTrading.pattern')}</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">{t('paperTrading.backtestWinPct')}</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">{t('paperTrading.yourWinPct')}</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">{t('paperTrading.trades')}</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">{t('paperTrading.edgeDelta')}</th>
                  </tr>
                </thead>
                <tbody>
                  {forwardData.filter(d => d.backtestWinRate !== null).map((d, i) => {
                    const delta = d.backtestWinRate !== null ? d.liveWinRate - d.backtestWinRate : 0;
                    return (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="p-2 font-medium capitalize">{d.patternName}</td>
                        <td className="p-2 text-right tabular-nums text-muted-foreground">{d.backtestWinRate?.toFixed(0)}%</td>
                        <td className="p-2 text-right tabular-nums">{d.liveWinRate.toFixed(0)}%</td>
                        <td className="p-2 text-right tabular-nums text-muted-foreground">{d.liveTrades}</td>
                        <td className={cn('p-2 text-right tabular-nums font-bold', delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(0)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, subtitle, icon, color }: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-muted-foreground">{icon}</div>
          <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        </div>
        <div className={cn('text-lg font-bold tabular-nums', color)}>{value}</div>
        {subtitle && <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}