import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, Download, ArrowLeft } from "lucide-react";
import { useState } from "react";
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

  // Fetch recent outcomes
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
          <p className="text-muted-foreground">Auto-captured alert outcomes and performance metrics</p>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <CardDescription>Overall Win Rate</CardDescription>
            <CardTitle className="text-2xl">{overallWinRate}%</CardTitle>
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
              {pendingCount} alerts are being tracked for SL/TP outcomes
            </CardDescription>
          </CardHeader>
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
                  <TableHead className="text-right">Avg R</TableHead>
                  <TableHead className="text-right">Avg PnL%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Outcomes Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Outcomes</CardTitle>
          <CardDescription>Latest auto-captured trade results</CardDescription>
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
                      {outcome.outcome_r_multiple !== null && (
                        <span className={outcome.outcome_r_multiple >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {outcome.outcome_r_multiple >= 0 ? '+' : ''}{outcome.outcome_r_multiple.toFixed(2)}R
                        </span>
                      )}
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
