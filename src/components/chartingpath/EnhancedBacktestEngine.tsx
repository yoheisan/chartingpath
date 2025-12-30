import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DEFAULT_DISCIPLINE_FILTERS, DisciplineFilters } from './TradeDisciplineFilters';
import { toast } from 'sonner';
import { wedgeConfig } from '@/config/wedge';
import { 
  DisciplineStats
} from '@/services/tradeDisciplineService';
import {
  Play, 
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  Calendar
} from 'lucide-react';
import { BacktestResultSummary } from '@/components/BacktestResultSummary';

// Wedge mode helper
const isWedge = wedgeConfig.wedgeEnabled;

interface PatternBacktestResult {
  patternId: string;
  patternName: string;
  trades: number;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
  profitFactor: number;
}

interface EnhancedBacktestEngineProps {
  strategy: any;
  results: any;
  isRunning: boolean;
  onBacktest: (strategy: any) => void;
  onStrategyUpdate?: (updates: Partial<any>) => void;
  progress?: number;
  progressPhase?: string;
  onCreateAlert?: () => void;
  onOpenTradingView?: () => void;
  onShareBacktest?: () => void;
  isSharing?: boolean;
  linkCopied?: boolean;
}

export const EnhancedBacktestEngine: React.FC<EnhancedBacktestEngineProps> = ({
  strategy,
  results,
  isRunning,
  onBacktest,
  onStrategyUpdate,
  progress = 0,
  progressPhase = '',
  onCreateAlert,
  onOpenTradingView,
  onShareBacktest,
  isSharing = false,
  linkCopied = false
}) => {
  // Get discipline filters from strategy or use defaults
  const disciplineFilters: DisciplineFilters = strategy.disciplineFilters || DEFAULT_DISCIPLINE_FILTERS;

  /**
   * Bar limits per timeframe – capped to prevent edge function timeout.
   */
  const TIMEFRAME_BAR_LIMITS: Record<string, { maxBars: number; maxDays: number; label: string }> = {
    '1m': { maxBars: 2000, maxDays: 2, label: '2 days (~2000 bars)' },
    '5m': { maxBars: 2500, maxDays: 9, label: '9 days (~2500 bars)' },
    '15m': { maxBars: 2500, maxDays: 26, label: '26 days (~2500 bars)' },
    '1h': { maxBars: 2500, maxDays: 104, label: '~3 months (~2500 bars)' },
    '4h': { maxBars: 2500, maxDays: 417, label: '~14 months (~2500 bars)' },
    '1d': { maxBars: 2500, maxDays: 2500, label: '~7 years (~2500 bars)' },
    '1w': { maxBars: 2500, maxDays: 17500, label: '~48 years' }
  };

  const getMaxDaysForTimeframe = (timeframe: string): number => {
    return TIMEFRAME_BAR_LIMITS[timeframe]?.maxDays || 104;
  };

  const getBarLimitLabel = (timeframe: string): string => {
    return TIMEFRAME_BAR_LIMITS[timeframe]?.label || 'Unknown';
  };

  const getDefaultDateRange = (timeframe: string) => {
    const maxDays = getMaxDaysForTimeframe(timeframe);
    const endDate = new Date();
    const startDate = new Date();
    
    // Use 90% of max range to be safe
    const safeDays = Math.min(Math.floor(maxDays * 0.9), maxDays);
    startDate.setDate(endDate.getDate() - safeDays);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const initialTimeframe = strategy?.market?.timeframes?.[0] || '1h';
  const initialDates = getDefaultDateRange(initialTimeframe);

  const [backtestConfig, setBacktestConfig] = useState({
    symbol: strategy?.market?.instrument || 'EURUSD',
    timeframe: initialTimeframe,
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    spread: 1.5,
    commission: 0,
    slippage: 0.5,
    initialBalance: 10000,
    testModel: 'control_points'
  });

  // Update config when strategy changes
  React.useEffect(() => {
    if (strategy?.market?.instrument) {
      setBacktestConfig(prev => ({
        ...prev,
        symbol: strategy.market.instrument,
        timeframe: strategy.market.timeframes?.[0] || prev.timeframe
      }));
    }
  }, [strategy?.market?.instrument, strategy?.market?.timeframes]);

  const runBacktest = async () => {
    // Final validation before running
    const maxDays = getMaxDaysForTimeframe(backtestConfig.timeframe);
    const barLabel = getBarLimitLabel(backtestConfig.timeframe);
    const start = new Date(backtestConfig.startDate);
    const end = new Date(backtestConfig.endDate);
    const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (requestedDays > maxDays) {
      toast.error(`Date range too large for ${backtestConfig.timeframe}`, {
        description: `Max: ${barLabel}. Please shorten your date range or switch to daily (1d) timeframe.`,
        duration: 6000
      });
      return;
    }
    
    console.log('Running enhanced pattern-based backtest with config:', backtestConfig);
    console.log('Strategy patterns:', strategy.patterns);
    
    // Pass the backtest config to the strategy
    const strategyWithConfig = {
      ...strategy,
      backtestPeriod: {
        startDate: backtestConfig.startDate,
        endDate: backtestConfig.endDate
      },
      market: {
        ...strategy.market,
        instrument: backtestConfig.symbol,
        timeframes: [backtestConfig.timeframe]
      }
    };
    
    onBacktest(strategyWithConfig);
  };

  // Extract discipline stats from results if available
  const disciplineStats: DisciplineStats = useMemo(() => {
    if (results?.disciplineStats) {
      return results.disciplineStats;
    }
    // Default stats if not available
    return {
      totalSignals: results?.rawSignals || 0,
      allowedTrades: results?.trades?.length || 0,
      rejectedTrades: (results?.rawSignals || 0) - (results?.trades?.length || 0),
      rejectionRate: results?.rawSignals 
        ? (((results.rawSignals - (results?.trades?.length || 0)) / results.rawSignals) * 100)
        : 0,
      rejectionsByFilter: results?.rejectionsByFilter || {}
    };
  }, [results]);

  // Calculate pattern-specific results from actual backtest data (single pattern only for MVP)
  const patternResults: PatternBacktestResult[] = useMemo(() => {
    if (!results?.trades || results.trades.length === 0) {
      return [];
    }

    const patternMap = new Map<string, {
      trades: any[];
      wins: number;
      totalPnl: number;
      totalPnlPercent: number;
    }>();

    results.trades.forEach((trade: any) => {
      const patternName = trade.patternName || 'Unknown Pattern';
      if (!patternMap.has(patternName)) {
        patternMap.set(patternName, { trades: [], wins: 0, totalPnl: 0, totalPnlPercent: 0 });
      }
      const pattern = patternMap.get(patternName)!;
      pattern.trades.push(trade);
      if (trade.pnl > 0) pattern.wins++;
      pattern.totalPnl += trade.pnl || 0;
      pattern.totalPnlPercent += trade.pnlPercent || 0;
    });

    return Array.from(patternMap.entries()).map(([patternName, data]) => {
      const totalTrades = data.trades.length;
      const winRate = (data.wins / totalTrades) * 100;
      const avgReturn = data.totalPnlPercent / totalTrades;
      
      // Calculate max drawdown for this pattern
      let peak = 0;
      let maxDD = 0;
      let runningPnl = 0;
      data.trades.forEach(trade => {
        runningPnl += trade.pnlPercent || 0;
        if (runningPnl > peak) peak = runningPnl;
        const drawdown = peak - runningPnl;
        if (drawdown > maxDD) maxDD = drawdown;
      });

      // Calculate profit factor
      const grossProfit = data.trades
        .filter(t => t.pnl > 0)
        .reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(data.trades
        .filter(t => t.pnl < 0)
        .reduce((sum, t) => sum + t.pnl, 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

      return {
        patternId: patternName.toLowerCase().replace(/\s+/g, '_'),
        patternName,
        trades: totalTrades,
        winRate: parseFloat(winRate.toFixed(1)),
        avgReturn: parseFloat(avgReturn.toFixed(2)),
        maxDrawdown: parseFloat((-maxDD).toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2))
      };
    }).sort((a, b) => b.profitFactor - a.profitFactor);
  }, [results]);

  // Generate unique run ID for analytics
  const runId = useMemo(() => {
    if (results) {
      return `${Date.now()}-${backtestConfig.symbol}-${backtestConfig.timeframe}`;
    }
    return '';
  }, [results, backtestConfig.symbol, backtestConfig.timeframe]);

  // Get primary pattern name for result summary
  const primaryPattern = patternResults[0]?.patternName || strategy.patterns?.find((p: any) => p.enabled)?.name || 'Strategy';

  // Default CTA handlers if not provided
  const handleCreateAlert = onCreateAlert || (() => {
    toast.info('Create Alert functionality', { description: 'Connect to alert creation flow' });
  });

  const handleOpenTradingView = onOpenTradingView || (() => {
    const tvUrl = `https://www.tradingview.com/chart/?symbol=${backtestConfig.symbol}`;
    window.open(tvUrl, '_blank');
  });

  const handleShareBacktest = onShareBacktest || (() => {
    toast.info('Share functionality', { description: 'Generate shareable link' });
  });

  return (
    <div className="space-y-6">
      {/* Configuration Header - Read-only display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Pattern Backtest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>{backtestConfig.symbol} • {backtestConfig.timeframe}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{backtestConfig.startDate} to {backtestConfig.endDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <span>{strategy.patterns?.filter((p: any) => p.enabled).length || 0} Patterns</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Backtest */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ready to Run Backtest</h3>
              <p className="text-sm text-muted-foreground">
                Test {strategy.patterns?.filter((p: any) => p.enabled).length || 0} patterns with current configuration
              </p>
            </div>
            <Button
              onClick={runBacktest}
              disabled={isRunning || !strategy.patterns?.some((p: any) => p.enabled)}
              className="min-w-32"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
          </div>
          
          {isRunning && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progressPhase || 'Running backtest...'}</span>
                <span className="text-primary font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="text-xs text-muted-foreground text-center">
                {progress < 20 && 'Connecting to data provider...'}
                {progress >= 20 && progress < 50 && 'Downloading historical price data...'}
                {progress >= 50 && progress < 70 && 'Detecting patterns in price data...'}
                {progress >= 70 && progress < 90 && 'Simulating trades with discipline filters...'}
                {progress >= 90 && progress < 100 && 'Calculating performance metrics...'}
                {progress >= 100 && 'Complete!'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display - MVP Only */}
      {results && (
        <div className="space-y-6">
          {/* BacktestResultSummary with 3 CTAs */}
          <BacktestResultSummary
            results={{
              totalTrades: results.totalTrades ?? results.trades?.length ?? 0,
              winRate: results.winRate ?? 0,
              profitFactor: results.profitFactor ?? 0,
              maxDrawdown: results.maxDrawdown ?? 0,
              avgReturn: results.avgReturn,
              totalReturn: results.totalReturn
            }}
            symbol={backtestConfig.symbol}
            timeframe={backtestConfig.timeframe}
            pattern={primaryPattern}
            runId={runId}
            wedgeEnabled={isWedge}
            enabledPatternsCount={strategy.patterns?.filter((p: any) => p.enabled).length || 0}
            startDate={backtestConfig.startDate}
            endDate={backtestConfig.endDate}
            dataPoints={results.dataPoints}
            wedgeSummary={results.wedgeSummary}
            wedgeWarnings={results.wedgeWarnings}
            onCreateAlert={handleCreateAlert}
            onOpenTradingView={handleOpenTradingView}
            onShareBacktest={handleShareBacktest}
            isSharing={isSharing}
            linkCopied={linkCopied}
          />

          {/* Pattern Performance - Single Pattern Only with MVP metrics */}
          {patternResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Pattern Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patternResults.slice(0, 1).map((pattern) => (
                    <div key={pattern.patternId} className="border-l-4 border-l-primary pl-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{pattern.patternName}</h4>
                          <p className="text-sm text-muted-foreground">{pattern.trades} trades</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className={`font-medium ${pattern.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>{pattern.winRate}%</div>
                          <div className="text-muted-foreground">Win Rate</div>
                        </div>
                        <div>
                          <div className="font-medium">{pattern.avgReturn}%</div>
                          <div className="text-muted-foreground">Avg Return</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-500">{pattern.maxDrawdown}%</div>
                          <div className="text-muted-foreground">Max Drawdown</div>
                        </div>
                        <div>
                          <div className="font-medium">{pattern.profitFactor}</div>
                          <div className="text-muted-foreground">Profit Factor</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Executed Trades List - Read-only */}
          {results.trades && results.trades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Executed Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Pattern</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Dir</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Entry</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">SL</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">TP</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">Exit</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Reason</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">P&L</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">RR</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.trades.slice(0, 20).map((trade: any, idx: number) => {
                        const exitReasonLabel = trade.exitReason === 'target' ? 'TP' 
                          : trade.exitReason === 'stop-loss' ? 'SL' 
                          : trade.exitReason === 'timeout' ? 'Time' 
                          : trade.exitReason || '-';
                        const exitReasonColor = trade.exitReason === 'target' ? 'text-green-500' 
                          : trade.exitReason === 'stop-loss' ? 'text-red-500' 
                          : 'text-muted-foreground';
                        const dirLabel = trade.direction === 'long' ? 'L' : trade.direction === 'short' ? 'S' : '-';
                        const dirColor = trade.direction === 'long' ? 'text-green-600' : trade.direction === 'short' ? 'text-red-600' : '';
                        
                        return (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-2 px-2 font-medium">{trade.patternName || 'Unknown'}</td>
                            <td className={`py-2 px-2 font-bold ${dirColor}`}>{dirLabel}</td>
                            <td className="py-2 px-2 text-right font-mono">{trade.entryPrice?.toFixed(2) ?? '-'}</td>
                            <td className="py-2 px-2 text-right font-mono text-red-500">{trade.stopLossPrice?.toFixed(2) ?? '-'}</td>
                            <td className="py-2 px-2 text-right font-mono text-green-500">{trade.takeProfitPrice?.toFixed(2) ?? '-'}</td>
                            <td className="py-2 px-2 text-right font-mono">{trade.exitPrice?.toFixed(2) ?? '-'}</td>
                            <td className={`py-2 px-2 font-medium ${exitReasonColor}`}>{exitReasonLabel}</td>
                            <td className={`py-2 px-2 text-right font-medium ${(trade.pnlPercent ?? trade.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(trade.pnlPercent ?? trade.pnl ?? 0) >= 0 ? '+' : ''}{(trade.pnlPercent ?? trade.pnl ?? 0).toFixed(2)}%
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-muted-foreground">{trade.plannedRR?.toFixed(1) ?? '-'}</td>
                            <td className="py-2 px-2 text-muted-foreground">
                              {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {results.trades.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Showing 20 of {results.trades.length} trades
                    </p>
                  )}
                  
                  {/* Execution Assumptions Panel */}
                  {results.executionAssumptions && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-md border border-border/50">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Execution Assumptions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Entry:</span>{' '}
                          <span className="font-medium">{results.executionAssumptions.entryType === 'bar_close' ? 'Bar Close' : results.executionAssumptions.entryType}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time Stop:</span>{' '}
                          <span className="font-medium">{results.executionAssumptions.maxBarsInTrade} bars</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bracket:</span>{' '}
                          <span className="font-medium">OCO at Entry</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Slippage:</span>{' '}
                          <span className="font-medium">{results.executionAssumptions.slippagePercent}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
