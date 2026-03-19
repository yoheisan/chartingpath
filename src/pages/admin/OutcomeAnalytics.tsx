import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, Download, ArrowLeft, Crosshair, ShieldAlert } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface OutcomeStats {
  id: string;
  pattern_name: string;
  timeframe: string;
  instrument: string | null;
  total_signals: number;
  wins: number;
  losses: number;
  timeouts: number;
  win_rate: number;
  avg_r_multiple: number;
  avg_pnl_percent: number;
  last_updated: string;
}

interface RecentOutcome {
  id: string;
  triggered_at: string;
  outcome_status: string;
  outcome_price: number | null;
  outcome_at: string | null;
  outcome_pnl_percent: number | null;
  outcome_r_multiple: number | null;
  is_auto_captured: boolean;
  mfe_r: number | null;
  mae_r: number | null;
  entry_price: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  alerts: {
    symbol: string;
    pattern: string;
    timeframe: string;
  };
}

export default function OutcomeAnalytics() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch aggregate stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['outcome-analytics-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outcome_analytics_cache')
        .select('*')
        .order('total_signals', { ascending: false });
      
      if (error) throw error;
      return data as OutcomeStats[];
    },
  });

  // Fetch recent outcomes with MFE/MAE
  const { data: recentOutcomes, isLoading: outcomesLoading, refetch: refetchOutcomes } = useQuery({
    queryKey: ['recent-outcomes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts_log')
        .select(`
          id,
          triggered_at,
          outcome_status,
          outcome_price,
          outcome_at,
          outcome_pnl_percent,
          outcome_r_multiple,
          is_auto_captured,
          mfe_r,
          mae_r,
          entry_price,
          stop_loss_price,
          take_profit_price,
          alerts!inner(symbol, pattern, timeframe)
        `)
        .in('outcome_status', ['hit_tp', 'hit_sl', 'timeout'])
        .order('outcome_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as RecentOutcome[];
    },
  });

  // Fetch pending count
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-outcomes-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('alerts_log')
        .select('*', { count: 'exact', head: true })
        .eq('outcome_status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Calculate totals
  const totals = stats?.reduce((acc, stat) => ({
    signals: acc.signals + stat.total_signals,
    wins: acc.wins + stat.wins,
    losses: acc.losses + stat.losses,
    timeouts: acc.timeouts + stat.timeouts,
  }), { signals: 0, wins: 0, losses: 0, timeouts: 0 });

  const overallWinRate = totals && totals.signals > 0 
    ? ((totals.wins / totals.signals) * 100).toFixed(1) 
    : '0';

  // Timeout diagnostics
  const timeoutDiagnostics = useMemo(() => {
    if (!recentOutcomes) return null;

    const timeouts = recentOutcomes.filter(o => o.outcome_status === 'timeout');
    if (timeouts.length === 0) return null;

    const withMfe = timeouts.filter(o => o.mfe_r !== null && o.mfe_r !== 0);
    const withMae = timeouts.filter(o => o.mae_r !== null && o.mae_r !== 0);

    const avgMfeR = withMfe.length > 0
      ? withMfe.reduce((s, o) => s + (o.mfe_r || 0), 0) / withMfe.length
      : null;
    const avgMaeR = withMae.length > 0
      ? withMae.reduce((s, o) => s + (o.mae_r || 0), 0) / withMae.length
      : null;

    // How many got close to TP (MFE > 1R)
    const nearTpCount = withMfe.filter(o => (o.mfe_r || 0) >= 1.0).length;
    // How many had significant adverse excursion
    const deepDrawdownCount = withMae.filter(o => (o.mae_r || 0) <= -0.5).length;

    // Timeout by pattern
    const byPattern = new Map<string, { count: number; avgMfe: number; totalMfe: number }>();
    for (const t of timeouts) {
      const key = t.alerts.pattern;
      const existing = byPattern.get(key) || { count: 0, avgMfe: 0, totalMfe: 0 };
      existing.count++;
      existing.totalMfe += (t.mfe_r || 0);
      existing.avgMfe = existing.totalMfe / existing.count;
      byPattern.set(key, existing);
    }

    const patternBreakdown = Array.from(byPattern.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.count - a.count);

    // Derive insight
    let insight = '';
    if (avgMfeR !== null && avgMfeR >= 1.0) {
      insight = 'Trades are reaching profitable territory but TPs are too far. Consider tightening Take Profit levels.';
    } else if (avgMfeR !== null && avgMfeR >= 0.5) {
      insight = 'Trades show moderate favorable movement. Consider partial profit-taking at 1R or widening the time window.';
    } else if (avgMfeR !== null && avgMfeR < 0.3) {
      insight = 'Trades barely move in the right direction. The patterns may be firing too early or on range-bound instruments.';
    } else {
      insight = 'Insufficient MFE data. New trades will start tracking max excursion automatically.';
    }

    return {
      totalTimeouts: timeouts.length,
      avgMfeR,
      avgMaeR,
      nearTpCount,
      deepDrawdownCount,
      patternBreakdown,
      insight,
      hasMfeData: withMfe.length > 0,
    };
  }, [recentOutcomes]);

  const triggerOutcomeCheck = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-alert-outcomes');
      
      if (error) throw error;
      
      toast.success(`Checked ${data.checked} alerts, updated ${data.updated} outcomes`);
      refetchStats();
      refetchOutcomes();
    } catch (err) {
      console.error('Failed to trigger outcome check:', err);
      toast.error('Failed to check outcomes');
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = () => {
    if (!stats) return;
    
    const csv = [
      ['Pattern', 'Timeframe', 'Instrument', 'Total', 'Wins', 'Losses', 'Timeouts', 'Win Rate', 'Avg R', 'Avg PnL%'].join(','),
      ...stats.map(s => [
        s.pattern_name,
        s.timeframe,
        s.instrument || 'ALL',
        s.total_signals,
        s.wins,
        s.losses,
        s.timeouts,
        s.win_rate.toFixed(1),
        s.avg_r_multiple.toFixed(2),
        s.avg_pnl_percent.toFixed(2),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outcome-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getOutcomeIcon = (status: string) => {
    switch (status) {
      case 'hit_tp': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'hit_sl': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'timeout': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getOutcomeBadge = (status: string) => {
    switch (status) {
      case 'hit_tp': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">TP Hit</Badge>;
      case 'hit_sl': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">SL Hit</Badge>;
      case 'timeout': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Timeout</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatR = (val: number | null | undefined) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground">—</span>;
    const color = val >= 0 ? 'text-green-500' : 'text-red-500';
    return <span className={color}>{val >= 0 ? '+' : ''}{val.toFixed(2)}R</span>;
  };

  const timeoutRate = totals && totals.signals > 0
    ? ((totals.timeouts / totals.signals) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Admin Dashboard
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outcome Analytics</h1>
          <p className="text-muted-foreground">Auto-captured alert outcomes with MFE/MAE excursion tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData} disabled={!stats?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={triggerOutcomeCheck} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Check Outcomes
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Outcomes</CardDescription>
            <CardTitle className="text-2xl">{totals?.signals || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Wins (TP Hit)</CardDescription>
            <CardTitle className="text-2xl text-green-500">{totals?.wins || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Losses (SL Hit)</CardDescription>
            <CardTitle className="text-2xl text-red-500">{totals?.losses || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Timeouts</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">{totals?.timeouts || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-2xl">{overallWinRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Timeout Rate</CardDescription>
            <CardTitle className={`text-2xl ${Number(timeoutRate) > 50 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {timeoutRate}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Pending Alert */}
      {pendingCount && pendingCount > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">Pending Outcomes</CardTitle>
            </div>
            <CardDescription>
              {pendingCount} alerts are being tracked for SL/TP outcomes (MFE/MAE now tracked on each check)
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Timeout Diagnostics */}
      {timeoutDiagnostics && (
        <Card className="border-yellow-500/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-yellow-500" />
              <CardTitle>Timeout Diagnostics</CardTitle>
            </div>
            <CardDescription>
              Analysis of trades that expired without hitting SL or TP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Insight banner */}
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Actionable Insight</p>
                  <p className="text-sm text-muted-foreground mt-1">{timeoutDiagnostics.insight}</p>
                </div>
              </div>
            </div>

            {/* Excursion Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Avg MFE (Best Profit)</p>
                <p className="text-lg font-bold mt-1">
                  {timeoutDiagnostics.avgMfeR !== null
                    ? <span className="text-green-500">+{timeoutDiagnostics.avgMfeR.toFixed(2)}R</span>
                    : <span className="text-muted-foreground">No data</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Best unrealized profit before timeout
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Avg MAE (Worst Loss)</p>
                <p className="text-lg font-bold mt-1">
                  {timeoutDiagnostics.avgMaeR !== null
                    ? <span className="text-red-500">{timeoutDiagnostics.avgMaeR.toFixed(2)}R</span>
                    : <span className="text-muted-foreground">No data</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Worst unrealized loss before timeout
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Near TP (MFE ≥ 1R)</p>
                <p className="text-lg font-bold mt-1">
                  {timeoutDiagnostics.nearTpCount}
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    / {timeoutDiagnostics.totalTimeouts}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Got close to target but didn't hit it
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Deep Drawdown (MAE ≤ -0.5R)</p>
                <p className="text-lg font-bold mt-1">
                  {timeoutDiagnostics.deepDrawdownCount}
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    / {timeoutDiagnostics.totalTimeouts}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Experienced significant adverse movement
                </p>
              </div>
            </div>

            {/* Timeout by Pattern */}
            {timeoutDiagnostics.patternBreakdown.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Timeout by Pattern</h4>
                <div className="space-y-2">
                  {timeoutDiagnostics.patternBreakdown.map(({ pattern, count, avgMfe }) => {
                    const pct = timeoutDiagnostics.totalTimeouts > 0
                      ? (count / timeoutDiagnostics.totalTimeouts) * 100
                      : 0;
                    return (
                      <div key={pattern} className="flex items-center gap-3">
                        <span className="text-sm w-48 truncate">{pattern}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-yellow-500/60"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          MFE: {avgMfe.toFixed(2)}R
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aggregate Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Performance by Instrument</CardTitle>
          <CardDescription>Aggregated win rates from auto-captured outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading stats...</div>
          ) : !stats?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No outcome data yet. Outcomes will appear as alerts are tracked.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead className="text-right">Signals</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">Timeout %</TableHead>
                  <TableHead className="text-right">Avg R</TableHead>
                  <TableHead className="text-right">Avg PnL%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => {
                  const toRate = stat.total_signals > 0
                    ? ((stat.timeouts / stat.total_signals) * 100).toFixed(0)
                    : '0';
                  return (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.pattern_name}</TableCell>
                      <TableCell>{stat.timeframe}</TableCell>
                      <TableCell>{stat.instrument || 'ALL'}</TableCell>
                      <TableCell className="text-right">{stat.total_signals}</TableCell>
                      <TableCell className="text-right">
                        <span className={stat.win_rate >= 50 ? 'text-green-500' : 'text-red-500'}>
                          {stat.win_rate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={Number(toRate) > 50 ? 'text-yellow-500' : 'text-muted-foreground'}>
                          {toRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={stat.avg_r_multiple >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {stat.avg_r_multiple >= 0 ? '+' : ''}{stat.avg_r_multiple.toFixed(2)}R
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={stat.avg_pnl_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {stat.avg_pnl_percent >= 0 ? '+' : ''}{stat.avg_pnl_percent.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Outcomes Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Outcomes</CardTitle>
          <CardDescription>Latest auto-captured trade results with excursion data</CardDescription>
        </CardHeader>
        <CardContent>
          {outcomesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading outcomes...</div>
          ) : !recentOutcomes?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No outcomes captured yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="text-right">R-Multiple</TableHead>
                  <TableHead className="text-right">MFE</TableHead>
                  <TableHead className="text-right">MAE</TableHead>
                  <TableHead className="text-right">PnL%</TableHead>
                  <TableHead>Captured</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOutcomes.map((outcome) => (
                  <TableRow key={outcome.id}>
                    <TableCell className="font-medium">{outcome.alerts.symbol}</TableCell>
                    <TableCell>{outcome.alerts.pattern}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getOutcomeIcon(outcome.outcome_status)}
                        {getOutcomeBadge(outcome.outcome_status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {outcome.outcome_r_multiple !== null
                        ? formatR(outcome.outcome_r_multiple)
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatR(outcome.mfe_r)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatR(outcome.mae_r)}
                    </TableCell>
                    <TableCell className="text-right">
                      {outcome.outcome_pnl_percent !== null && (
                        <span className={outcome.outcome_pnl_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {outcome.outcome_pnl_percent >= 0 ? '+' : ''}{outcome.outcome_pnl_percent.toFixed(2)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {outcome.outcome_at ? format(new Date(outcome.outcome_at), 'MMM d, HH:mm') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {outcome.is_auto_captured ? 'Auto' : 'Manual'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
