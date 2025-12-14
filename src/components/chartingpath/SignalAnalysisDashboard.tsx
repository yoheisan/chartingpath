import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Clock, 
  AlertTriangle,
  Info,
  Lightbulb,
  ArrowRight,
  Filter,
  Activity,
  PieChart,
  Zap
} from 'lucide-react';
import { DisciplineFilters } from './TradeDisciplineFilters';

interface DisciplineStats {
  totalSignals: number;
  allowedTrades: number;
  rejectedTrades: number;
  rejectionRate: number;
  rejectionsByFilter: Record<string, number>;
}

interface PatternBreakdown {
  [patternName: string]: {
    trades: number;
    wins: number;
    totalPnl: number;
  };
}

interface TradeDetail {
  patternName: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  exitReason: string;
  pnl: number;
  pnlPercent: number;
  holdingBars: number;
  targetPercent: number;
  stopPercent: number;
  disciplineApproved: boolean;
}

interface SignalAnalysisDashboardProps {
  stats: DisciplineStats;
  filters: DisciplineFilters;
  patternBreakdown?: PatternBreakdown;
  trades?: TradeDetail[];
  onFilterChange?: (updates: Partial<DisciplineFilters>) => void;
}

const FILTER_DESCRIPTIONS: Record<string, { 
  name: string; 
  icon: React.ReactNode; 
  description: string;
  impact: string;
  recommendation: string;
}> = {
  'liquidity': {
    name: 'Low Liquidity Filter',
    icon: <Clock className="w-4 h-4" />,
    description: 'Rejects trades during weekends, holidays, and low-volume periods',
    impact: 'Daily charts may flag many bars as "low liquidity" due to weekends',
    recommendation: 'Consider disabling for daily timeframes, or the filter is too strict for forex'
  },
  'Stop': {
    name: 'ATR Stop Validation',
    icon: <Target className="w-4 h-4" />,
    description: 'Requires stop loss to be at least 1 ATR from entry',
    impact: 'Pattern-based stops may be tighter than ATR during low volatility',
    recommendation: 'Lower minAtrMultiplier to 0.5-0.75 or disable for pattern-based stops'
  },
  'Trend': {
    name: 'Trend Alignment',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Only allows trades in the direction of the higher timeframe trend',
    impact: 'Counter-trend patterns (like reversal patterns) will be rejected',
    recommendation: 'Disable for reversal patterns like H&S, Double Top/Bottom'
  },
  'Cooldown': {
    name: 'Trade Cooldown',
    icon: <Clock className="w-4 h-4" />,
    description: 'Enforces minimum bars between trades',
    impact: `With 5-bar cooldown on daily = 5 trading days between trades`,
    recommendation: 'Reduce cooldownBars to 2-3 for daily charts'
  },
  'R:R': {
    name: 'Risk/Reward Ratio',
    icon: <Target className="w-4 h-4" />,
    description: 'Requires minimum reward-to-risk ratio',
    impact: 'Trades with targets too close to entry are rejected',
    recommendation: 'Pattern targets should be 2x the stop distance'
  },
  'Volume': {
    name: 'Volume Confirmation',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Requires above-average volume on breakouts',
    impact: 'Forex pairs have no volume data, always passes',
    recommendation: 'Works best with stocks and crypto'
  },
  'Max positions': {
    name: 'Max Concurrent Trades',
    icon: <Shield className="w-4 h-4" />,
    description: 'Limits number of simultaneous open positions',
    impact: 'May reject valid signals when at position limit',
    recommendation: 'Increase maxConcurrentTrades for multi-pattern strategies'
  },
  'Pattern': {
    name: 'Pattern Limit',
    icon: <Filter className="w-4 h-4" />,
    description: 'Limits patterns traded to enforce specialization',
    impact: 'Extra patterns beyond limit are ignored',
    recommendation: 'Increase maxPatterns or focus on fewer patterns'
  }
};

export const SignalAnalysisDashboard: React.FC<SignalAnalysisDashboardProps> = ({
  stats,
  filters,
  patternBreakdown,
  trades,
  onFilterChange
}) => {
  // Sort rejections by count (highest first)
  const sortedRejections = Object.entries(stats.rejectionsByFilter || {})
    .sort((a, b) => b[1] - a[1]);
  
  // Calculate the "biggest offender" - the filter causing most rejections
  const biggestOffender = sortedRejections[0];
  const biggestOffenderPercent = stats.totalSignals > 0 && biggestOffender
    ? ((biggestOffender[1] / stats.totalSignals) * 100).toFixed(1)
    : 0;

  // Check if filters are too aggressive
  const isOverFiltering = stats.rejectionRate > 95;
  const isUnderFiltering = stats.rejectionRate < 10;

  // Helper to apply a filter change
  const applyFilterChange = (updates: Partial<DisciplineFilters>, description: string) => {
    if (onFilterChange) {
      onFilterChange(updates);
      // Show toast notification
      import('sonner').then(({ toast }) => {
        toast.success('Filter Updated', {
          description: description
        });
      });
    }
  };
  
  // Calculate pattern signal distribution
  const patternSignals = patternBreakdown 
    ? Object.entries(patternBreakdown).map(([name, data]) => ({
        name,
        trades: data.trades,
        wins: data.wins,
        winRate: data.trades > 0 ? (data.wins / data.trades * 100) : 0,
        totalPnl: data.totalPnl
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Warning Alert for Over Filtering with Quick Fix Button */}
      {isOverFiltering && (
        <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
          <div className="flex items-start justify-between w-full">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <AlertTitle className="text-amber-600">Filters Too Aggressive</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  {stats.rejectionRate.toFixed(1)}% of signals rejected. 
                  Only {stats.allowedTrades} trades from {stats.totalSignals} signals.
                </AlertDescription>
              </div>
            </div>
            {onFilterChange && (
              <Button 
                size="sm"
                variant="default"
                className="shrink-0 ml-4"
                onClick={() => applyFilterChange({
                  avoidLowLiquidity: false,
                  minAtrMultiplier: 0.5,
                  trendAlignmentEnabled: false,
                  cooldownBars: 2
                }, 'Applied recommended optimizations - run backtest again')}
              >
                <Zap className="w-4 h-4 mr-1" />
                Quick Fix All
              </Button>
            )}
          </div>
        </Alert>
      )}

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Signal Analysis Dashboard
          </CardTitle>
          <CardDescription>
            Understand why signals are being filtered and optimize your strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="filters">Filter Analysis</TabsTrigger>
              <TabsTrigger value="patterns">Pattern Stats</TabsTrigger>
              <TabsTrigger value="recommendations">Optimize</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Signal Flow Visualization */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h4 className="font-medium mb-4">Signal Flow</h4>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{stats.totalSignals}</div>
                    <div className="text-sm text-muted-foreground">Raw Signals</div>
                  </div>
                  
                  <div className="flex-1 px-4">
                    <div className="relative">
                      <div className="h-2 bg-muted rounded-full">
                        <div 
                          className="h-2 bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                          style={{ width: `${stats.rejectionRate}%` }}
                        />
                      </div>
                      <div className="absolute top-4 left-0 right-0 flex justify-between text-xs text-muted-foreground">
                        <span>{stats.rejectionRate.toFixed(1)}% filtered</span>
                        <span>{(100 - stats.rejectionRate).toFixed(1)}% passed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500">{stats.rejectedTrades}</div>
                      <div className="text-sm text-muted-foreground">Rejected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500">{stats.allowedTrades}</div>
                      <div className="text-sm text-muted-foreground">Executed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.totalSignals}</div>
                    <div className="text-sm text-muted-foreground">Total Signals Detected</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-500">{stats.rejectionRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Rejection Rate</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-500">{stats.allowedTrades}</div>
                    <div className="text-sm text-muted-foreground">Trades Executed</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{sortedRejections.length}</div>
                    <div className="text-sm text-muted-foreground">Active Filters</div>
                  </CardContent>
                </Card>
              </div>

              {/* Biggest Offender */}
              {biggestOffender && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          {FILTER_DESCRIPTIONS[biggestOffender[0]]?.icon || <Filter className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-medium">
                            {FILTER_DESCRIPTIONS[biggestOffender[0]]?.name || biggestOffender[0]}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Caused {biggestOffenderPercent}% of all rejections ({biggestOffender[1]} signals)
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                        Top Rejection Cause
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Filter Analysis Tab */}
            <TabsContent value="filters" className="space-y-4 mt-4">
              <div className="space-y-3">
                {sortedRejections.map(([filterName, count]) => {
                  const filterInfo = FILTER_DESCRIPTIONS[filterName];
                  const percentage = stats.totalSignals > 0 ? (count / stats.totalSignals * 100) : 0;
                  
                  return (
                    <Card key={filterName} className="overflow-hidden">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                              {filterInfo?.icon || <Shield className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-medium">{filterInfo?.name || filterName}</div>
                              <div className="text-sm text-muted-foreground">
                                {filterInfo?.description || 'Filter description unavailable'}
                              </div>
                            </div>
                          </div>
                          <Badge variant="destructive" className="shrink-0">
                            {count} rejected ({percentage.toFixed(1)}%)
                          </Badge>
                        </div>
                        
                        <Progress 
                          value={percentage} 
                          className="h-2 mb-2" 
                        />
                        
                        {filterInfo?.impact && (
                          <div className="mt-3 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                            <strong>Impact:</strong> {filterInfo.impact}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {sortedRejections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No signals were rejected by filters.</p>
                </div>
              )}
            </TabsContent>

            {/* Pattern Stats Tab */}
            <TabsContent value="patterns" className="space-y-4 mt-4">
              {patternSignals.length > 0 ? (
                <div className="space-y-3">
                  {patternSignals.map(pattern => (
                    <Card key={pattern.name}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{pattern.name}</div>
                          <Badge variant={pattern.totalPnl >= 0 ? "default" : "destructive"}>
                            {pattern.totalPnl >= 0 ? '+' : ''}{pattern.totalPnl.toFixed(2)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Trades</div>
                            <div className="font-medium">{pattern.trades}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Wins</div>
                            <div className="font-medium text-green-500">{pattern.wins}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Win Rate</div>
                            <div className="font-medium">{pattern.winRate.toFixed(1)}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="w-12 h-12 mx-auto mb-2" />
                  <p>No pattern trades executed yet.</p>
                  <p className="text-sm">Run a backtest to see pattern performance.</p>
                </div>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4 mt-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Optimization Suggestions</AlertTitle>
                <AlertDescription>
                  Click any button below to apply the optimization directly to your strategy.
                </AlertDescription>
              </Alert>

              {/* One-Click Apply All Button */}
              {onFilterChange && isOverFiltering && (
                <Card className="border-primary bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          Apply All Recommended Optimizations
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Relaxes aggressive filters to allow more trades while maintaining quality
                        </p>
                      </div>
                      <Button 
                        onClick={() => applyFilterChange({
                          avoidLowLiquidity: false,
                          minAtrMultiplier: 0.5,
                          trendAlignmentEnabled: false,
                          cooldownBars: 2
                        }, 'Applied all recommended optimizations')}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Apply All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {/* Individual Filter Adjustments */}
                {sortedRejections.slice(0, 4).map(([filterName, count]) => {
                  const filterInfo = FILTER_DESCRIPTIONS[filterName];
                  const percentage = stats.totalSignals > 0 ? (count / stats.totalSignals * 100) : 0;
                  
                  if (percentage < 10) return null; // Only show significant filters

                  // Determine the specific fix for each filter
                  const getFilterFix = (): { updates: Partial<DisciplineFilters>; label: string } | null => {
                    switch(filterName) {
                      case 'liquidity':
                        return filters.avoidLowLiquidity 
                          ? { updates: { avoidLowLiquidity: false }, label: 'Disable Liquidity Filter' }
                          : null;
                      case 'Stop':
                        return filters.minAtrMultiplier > 0.5
                          ? { updates: { minAtrMultiplier: 0.5 }, label: 'Set ATR to 0.5' }
                          : null;
                      case 'Trend':
                        return filters.trendAlignmentEnabled
                          ? { updates: { trendAlignmentEnabled: false }, label: 'Disable Trend Filter' }
                          : null;
                      case 'Cooldown':
                        return filters.cooldownBars > 2
                          ? { updates: { cooldownBars: 2 }, label: 'Reduce to 2 bars' }
                          : null;
                      case 'R:R':
                        return filters.minRiskReward > 1.5
                          ? { updates: { minRiskReward: 1.5 }, label: 'Lower R:R to 1.5' }
                          : null;
                      case 'Volume':
                        return filters.volumeConfirmationEnabled
                          ? { updates: { volumeConfirmationEnabled: false }, label: 'Disable Volume Filter' }
                          : null;
                      case 'Max positions':
                        return filters.maxConcurrentTrades < 5
                          ? { updates: { maxConcurrentTrades: 5 }, label: 'Increase to 5 positions' }
                          : null;
                      default:
                        return null;
                    }
                  };

                  const fix = getFilterFix();
                  
                  return (
                    <Card key={filterName} className="border-l-4 border-l-amber-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded bg-amber-500/10 text-amber-600">
                                {filterInfo?.icon}
                              </div>
                              <span className="font-medium">{filterInfo?.name || filterName}</span>
                              <Badge variant="destructive" className="text-xs">
                                {count} rejected ({percentage.toFixed(0)}%)
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {filterInfo?.recommendation || 'Consider adjusting this filter'}
                            </p>
                          </div>
                          {onFilterChange && fix && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="shrink-0"
                              onClick={() => applyFilterChange(fix.updates, `${fix.label} applied`)}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              {fix.label}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Quick Fixes with Apply Buttons */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Quick Fixes for More Trades
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filters.timeFilterEnabled && filters.avoidLowLiquidity && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-start gap-2 flex-1">
                          <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">
                            <strong>Disable "Avoid Low Liquidity"</strong> - weekends are flagged but don't affect daily candles
                          </span>
                        </div>
                        {onFilterChange && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => applyFilterChange({ avoidLowLiquidity: false }, 'Low liquidity filter disabled')}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    )}
                    {filters.atrStopValidationEnabled && filters.minAtrMultiplier >= 1 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-start gap-2 flex-1">
                          <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">
                            <strong>Lower ATR multiplier to 0.5</strong> - pattern stops are often tighter than 1 ATR
                          </span>
                        </div>
                        {onFilterChange && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => applyFilterChange({ minAtrMultiplier: 0.5 }, 'ATR multiplier set to 0.5')}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    )}
                    {filters.trendAlignmentEnabled && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-start gap-2 flex-1">
                          <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">
                            <strong>Disable Trend Alignment</strong> - reversal patterns (H&S, Double Top) are counter-trend
                          </span>
                        </div>
                        {onFilterChange && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => applyFilterChange({ trendAlignmentEnabled: false }, 'Trend alignment disabled')}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    )}
                    {filters.cooldownEnabled && filters.cooldownBars > 3 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-start gap-2 flex-1">
                          <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm">
                            <strong>Reduce cooldown to 2 bars</strong> - 5 bars = 1 trading week between trades
                          </span>
                        </div>
                        {onFilterChange && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => applyFilterChange({ cooldownBars: 2 }, 'Cooldown reduced to 2 bars')}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Trade Log */}
      {trades && trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              Executed Trades ({trades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {trades.map((trade, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    trade.pnl >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{trade.patternName}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(trade.entryDate).toLocaleDateString()} → {new Date(trade.exitDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Entry: {trade.entryPrice.toFixed(4)}</span>
                    <span>Exit: {trade.exitPrice.toFixed(4)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {trade.exitReason}
                    </Badge>
                    <span>{trade.holdingBars} bars</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
