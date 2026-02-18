import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, AlertTriangle, TrendingDown, Clock, Activity, ArrowUpRight, CheckCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HealthIssue {
  pattern_name: string;
  timeframe: string;
  instrument: string | null;
  issue_type: 'low_win_rate' | 'negative_expectancy' | 'high_timeout_rate' | 'sample_degradation';
  severity: 'warning' | 'critical';
  current_value: number;
  threshold: number;
  sample_size: number;
  recommendation: string;
}

interface PatternHealthData {
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

// Thresholds for color coding
const WIN_RATE_GOOD = 50;
const WIN_RATE_WARNING = 35;
const EXPECTANCY_GOOD = 0.2;
const EXPECTANCY_WARNING = 0;

export default function PatternHealthMonitor() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRecalculation, setLastRecalculation] = useState<string | null>(null);

  // Fetch pattern stats
  const { data: patterns, isLoading, refetch } = useQuery({
    queryKey: ['pattern-health-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outcome_analytics_cache')
        .select('*')
        .gte('total_signals', 5) // Only patterns with meaningful sample size
        .order('total_signals', { ascending: false });
      
      if (error) throw error;
      return data as PatternHealthData[];
    },
  });

  // Calculate health issues locally
  const healthIssues: HealthIssue[] = [];
  patterns?.forEach(p => {
    if (p.win_rate < WIN_RATE_WARNING) {
      healthIssues.push({
        pattern_name: p.pattern_name,
        timeframe: p.timeframe,
        instrument: p.instrument,
        issue_type: 'low_win_rate',
        severity: p.win_rate < 25 ? 'critical' : 'warning',
        current_value: p.win_rate,
        threshold: WIN_RATE_WARNING,
        sample_size: p.total_signals,
        recommendation: 'Review detection parameters',
      });
    }
    if (p.avg_r_multiple < EXPECTANCY_WARNING) {
      healthIssues.push({
        pattern_name: p.pattern_name,
        timeframe: p.timeframe,
        instrument: p.instrument,
        issue_type: 'negative_expectancy',
        severity: p.avg_r_multiple < -0.5 ? 'critical' : 'warning',
        current_value: p.avg_r_multiple,
        threshold: EXPECTANCY_WARNING,
        sample_size: p.total_signals,
        recommendation: 'Adjust SL/TP levels',
      });
    }
    const timeoutRate = p.total_signals > 0 ? (p.timeouts / p.total_signals) * 100 : 0;
    if (timeoutRate > 40) {
      healthIssues.push({
        pattern_name: p.pattern_name,
        timeframe: p.timeframe,
        instrument: p.instrument,
        issue_type: 'high_timeout_rate',
        severity: 'warning',
        current_value: timeoutRate,
        threshold: 40,
        sample_size: p.total_signals,
        recommendation: 'Extend time stops',
      });
    }
  });

  const criticalCount = healthIssues.filter(h => h.severity === 'critical').length;
  const warningCount = healthIssues.filter(h => h.severity === 'warning').length;

  // Overall system health score (0-100)
  const totalPatterns = patterns?.length || 1;
  const healthyPatterns = totalPatterns - new Set(healthIssues.map(h => `${h.pattern_name}|${h.timeframe}|${h.instrument}`)).size;
  const healthScore = Math.round((healthyPatterns / totalPatterns) * 100);

  const triggerRecalculation = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('recalculate-pattern-stats');
      
      if (error) throw error;
      
      toast.success(`Recalculated ${data.stats.patternsUpdated} patterns, synced ${data.stats.livePatternsSync} live signals`);
      setLastRecalculation(new Date().toISOString());
      refetch();
    } catch (err) {
      console.error('Failed to recalculate:', err);
      toast.error('Recalculation failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (winRate: number, expectancy: number) => {
    if (winRate < WIN_RATE_WARNING || expectancy < -0.5) return 'text-destructive';
    if (winRate < WIN_RATE_GOOD || expectancy < EXPECTANCY_GOOD) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getIssueIcon = (type: HealthIssue['issue_type']) => {
    switch (type) {
      case 'low_win_rate': return <TrendingDown className="h-4 w-4" />;
      case 'negative_expectancy': return <AlertTriangle className="h-4 w-4" />;
      case 'high_timeout_rate': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Admin Dashboard
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pattern Health Monitor</h1>
          <p className="text-muted-foreground">
            Closed-loop feedback system for pattern quality improvement
          </p>
        </div>
        <Button onClick={triggerRecalculation} disabled={isRefreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Recalculate Stats
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>System Health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={cn(
                "text-3xl font-bold",
                healthScore >= 80 ? "text-emerald-500" : healthScore >= 60 ? "text-yellow-500" : "text-destructive"
              )}>
                {healthScore}%
              </div>
              <Progress 
                value={healthScore} 
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Patterns</CardDescription>
            <CardTitle className="text-2xl">{patterns?.length || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card className={cn(criticalCount > 0 && "border-destructive/50")}>
          <CardHeader className="pb-2">
            <CardDescription>Critical Issues</CardDescription>
            <CardTitle className={cn("text-2xl", criticalCount > 0 && "text-destructive")}>
              {criticalCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Warnings</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">{warningCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Feedback Loop Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Flywheel
          </CardTitle>
          <CardDescription>
            How auto-captured outcomes improve pattern quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex-1 p-4 rounded-lg bg-muted text-center">
              <div className="font-medium">1. Alert Triggered</div>
              <div className="text-muted-foreground text-xs">Pattern detected</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 p-4 rounded-lg bg-muted text-center">
              <div className="font-medium">2. Outcome Captured</div>
              <div className="text-muted-foreground text-xs">SL/TP hit tracked</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 p-4 rounded-lg bg-muted text-center">
              <div className="font-medium">3. Stats Aggregated</div>
              <div className="text-muted-foreground text-xs">Win rates updated</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 p-4 rounded-lg bg-muted text-center">
              <div className="font-medium">4. Quality Improved</div>
              <div className="text-muted-foreground text-xs">Grades recalculated</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <div className="font-medium text-primary">5. Better Signals</div>
              <div className="text-muted-foreground text-xs">Screener shows verified stats</div>
            </div>
          </div>
          {lastRecalculation && (
            <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Last synced: {format(new Date(lastRecalculation), 'MMM d, HH:mm')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Issues */}
      {healthIssues.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Underperforming Patterns
            </CardTitle>
            <CardDescription>
              Patterns flagged for review based on auto-captured outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthIssues.slice(0, 20).map((issue, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{issue.pattern_name}</TableCell>
                    <TableCell>{issue.timeframe}</TableCell>
                    <TableCell>{issue.instrument || 'ALL'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={issue.severity === 'critical' ? 'destructive' : 'outline'}
                        className="gap-1"
                      >
                        {getIssueIcon(issue.issue_type)}
                        {issue.issue_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      issue.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'
                    )}>
                      {issue.current_value.toFixed(1)}
                      {issue.issue_type === 'low_win_rate' || issue.issue_type === 'high_timeout_rate' ? '%' : 'R'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {issue.threshold}
                      {issue.issue_type === 'low_win_rate' || issue.issue_type === 'high_timeout_rate' ? '%' : 'R'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">n={issue.sample_size}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {issue.recommendation}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Patterns Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Performance (Verified)</CardTitle>
          <CardDescription>
            Stats derived from auto-captured alert outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !patterns?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No verified outcome data yet. Stats will appear as alerts are tracked.
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
                  <TableHead className="text-right">Expectancy</TableHead>
                  <TableHead className="text-right">Avg PnL</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patterns.map((p) => {
                  const hasIssue = healthIssues.some(
                    h => h.pattern_name === p.pattern_name && 
                         h.timeframe === p.timeframe && 
                         h.instrument === p.instrument
                  );
                  
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.pattern_name}</TableCell>
                      <TableCell>{p.timeframe}</TableCell>
                      <TableCell>{p.instrument || 'ALL'}</TableCell>
                      <TableCell className="text-right">{p.total_signals}</TableCell>
                      <TableCell className={cn("text-right font-mono", getHealthColor(p.win_rate, p.avg_r_multiple))}>
                        {p.win_rate.toFixed(1)}%
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        p.avg_r_multiple >= 0 ? 'text-emerald-500' : 'text-destructive'
                      )}>
                        {p.avg_r_multiple >= 0 ? '+' : ''}{p.avg_r_multiple.toFixed(2)}R
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        p.avg_pnl_percent >= 0 ? 'text-emerald-500' : 'text-destructive'
                      )}>
                        {p.avg_pnl_percent >= 0 ? '+' : ''}{p.avg_pnl_percent.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        {hasIssue ? (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                            Review
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            Healthy
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
