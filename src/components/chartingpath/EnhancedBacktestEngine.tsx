import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { PatternDetectionDisplay } from './PatternDetectionDisplay';
import { SignalAnalysisDashboard } from './SignalAnalysisDashboard';
import { DEFAULT_DISCIPLINE_FILTERS, DisciplineFilters } from './TradeDisciplineFilters';
import { toast } from 'sonner';
import { 
  validateTradeDiscipline,
  DisciplineTracker,
  TradeSignal,
  OpenPosition,
  PriceBar,
  DisciplineStats
} from '@/services/tradeDisciplineService';
import {
  Play, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Activity,
  Settings,
  Eye,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface PatternBacktestResult {
  patternId: string;
  patternName: string;
  trades: number;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
}

interface EnhancedBacktestEngineProps {
  strategy: any;
  results: any;
  isRunning: boolean;
  onBacktest: (strategy: any) => void;
  onStrategyUpdate?: (updates: Partial<any>) => void;
  progress?: number;
  progressPhase?: string;
}

export const EnhancedBacktestEngine: React.FC<EnhancedBacktestEngineProps> = ({
  strategy,
  results,
  isRunning,
  onBacktest,
  onStrategyUpdate,
  progress = 0,
  progressPhase = ''
}) => {
  // Get discipline filters from strategy or use defaults
  const disciplineFilters: DisciplineFilters = strategy.disciplineFilters || DEFAULT_DISCIPLINE_FILTERS;

  // Handler to update discipline filters in the strategy
  const handleFilterChange = (updates: Partial<DisciplineFilters>) => {
    if (onStrategyUpdate) {
      const newFilters = { ...disciplineFilters, ...updates };
      onStrategyUpdate({ disciplineFilters: newFilters });
    }
  };


  /**
   * Bar limits per timeframe – capped to prevent edge function timeout.
   * The edge function trims to 3000 bars, but fetching from Yahoo before trim can timeout.
   * These limits ensure we stay well under 3000 bars for reliable execution.
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

  const [interactiveParams, setInteractiveParams] = useState({
    riskPerTrade: strategy.riskManagement?.riskPerTrade || 2.0,
    portfolioRiskCap: strategy.multiPatternSettings?.portfolioRiskCap || 6.0
  });

  const updateConfig = (field: string, value: any) => {
    setBacktestConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      
      // Auto-adjust date range when timeframe changes
      if (field === 'timeframe') {
        const maxDays = getMaxDaysForTimeframe(value);
        const barLabel = getBarLimitLabel(value);
        const start = new Date(prev.startDate);
        const end = new Date(prev.endDate);
        const currentDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        // If current range exceeds the limit, adjust it
        if (currentDays > maxDays) {
          const newDates = getDefaultDateRange(value);
          newConfig.startDate = newDates.startDate;
          newConfig.endDate = newDates.endDate;
          
          toast.info(`Date range capped for ${value} timeframe`, {
            description: `Max: ${barLabel}. Adjusted to ${newDates.startDate} → ${newDates.endDate}`,
            duration: 5000
          });
        }
      }
      
      // Also validate when dates change directly
      if (field === 'startDate' || field === 'endDate') {
        const timeframe = newConfig.timeframe;
        const maxDays = getMaxDaysForTimeframe(timeframe);
        const barLabel = getBarLimitLabel(timeframe);
        const start = new Date(field === 'startDate' ? value : prev.startDate);
        const end = new Date(field === 'endDate' ? value : prev.endDate);
        const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (requestedDays > maxDays) {
          // Cap the start date to respect the limit
          const cappedStart = new Date(end);
          cappedStart.setDate(end.getDate() - maxDays);
          newConfig.startDate = cappedStart.toISOString().split('T')[0];
          
          toast.warning(`Date range exceeds ${timeframe} limit`, {
            description: `Capped to ${barLabel}. Use daily (1d) for longer ranges.`,
            duration: 5000
          });
        }
      }
      
      return newConfig;
    });
  };

  const updateInteractiveParam = (field: string, value: number) => {
    setInteractiveParams(prev => ({ ...prev, [field]: value }));
  };

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
    console.log('Interactive parameters:', interactiveParams);
    console.log('Strategy patterns:', strategy.patterns);
    console.log(`Estimated bars: ~${requestedDays} days × bars/day for ${backtestConfig.timeframe}`);
    
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

  // Calculate pattern-specific results from actual backtest data
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

      // Calculate Sharpe ratio (simplified)
      const returns = data.trades.map(t => t.pnlPercent || 0);
      const avgRet = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgRet, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = stdDev > 0 ? (avgRet / stdDev) * Math.sqrt(252) : 0;

      return {
        patternId: patternName.toLowerCase().replace(/\s+/g, '_'),
        patternName,
        trades: totalTrades,
        winRate: parseFloat(winRate.toFixed(1)),
        avgReturn: parseFloat(avgReturn.toFixed(2)),
        maxDrawdown: parseFloat((-maxDD).toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2))
      };
    }).sort((a, b) => b.profitFactor - a.profitFactor);
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Enhanced Pattern Backtesting Engine
              <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-accent/10">
                Multi-Pattern v2.0
              </Badge>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Backtest Configuration</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Symbol</Label>
                    <Select value={backtestConfig.symbol} onValueChange={(value) => updateConfig('symbol', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EURUSD">EUR/USD</SelectItem>
                        <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                        <SelectItem value="USDJPY">USD/JPY</SelectItem>
                        <SelectItem value="BTCUSD">BTC/USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Timeframe</Label>
                    <Select value={backtestConfig.timeframe} onValueChange={(value) => updateConfig('timeframe', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1 Minute (max 7 days)</SelectItem>
                        <SelectItem value="5m">5 Minutes (max 60 days)</SelectItem>
                        <SelectItem value="15m">15 Minutes (max 60 days)</SelectItem>
                        <SelectItem value="1h">1 Hour (max 2 years)</SelectItem>
                        <SelectItem value="4h">4 Hours (max 2 years)</SelectItem>
                        <SelectItem value="1d">Daily (unlimited)</SelectItem>
                        <SelectItem value="1wk">Weekly (unlimited)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={backtestConfig.startDate}
                      onChange={(e) => {
                        const maxDays = getMaxDaysForTimeframe(backtestConfig.timeframe);
                        const start = new Date(e.target.value);
                        const end = new Date(backtestConfig.endDate);
                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (days > maxDays) {
                          toast.error(`Date range cannot exceed ${maxDays} days for ${backtestConfig.timeframe} timeframe`);
                          return;
                        }
                        updateConfig('startDate', e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={backtestConfig.endDate}
                      onChange={(e) => {
                        const maxDays = getMaxDaysForTimeframe(backtestConfig.timeframe);
                        const start = new Date(backtestConfig.startDate);
                        const end = new Date(e.target.value);
                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (days > maxDays) {
                          toast.error(`Date range cannot exceed ${maxDays} days for ${backtestConfig.timeframe} timeframe`);
                          return;
                        }
                        updateConfig('endDate', e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <Label>Spread (pips)</Label>
                    <Input
                      type="number"
                      value={backtestConfig.spread}
                      onChange={(e) => updateConfig('spread', parseFloat(e.target.value))}
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label>Initial Balance ($)</Label>
                    <Input
                      type="number"
                      value={backtestConfig.initialBalance}
                      onChange={(e) => updateConfig('initialBalance', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
              <span>{strategy.patterns?.filter(p => p.enabled).length || 0} Patterns Active</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span>${backtestConfig.initialBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>{[
                disciplineFilters.trendAlignmentEnabled,
                disciplineFilters.minRiskRewardEnabled,
                disciplineFilters.volumeConfirmationEnabled,
                disciplineFilters.maxPatternsEnabled,
                disciplineFilters.maxConcurrentTradesEnabled,
                disciplineFilters.timeFilterEnabled,
                disciplineFilters.atrStopValidationEnabled,
                disciplineFilters.cooldownEnabled
              ].filter(Boolean).length}/8 Discipline Filters</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Parameter Sliders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interactive Risk Parameters</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust parameters and see instant impact on backtest results
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center justify-between">
                Risk Per Trade
                <span className="text-primary font-medium">{interactiveParams.riskPerTrade}%</span>
              </Label>
              <Slider
                value={[interactiveParams.riskPerTrade]}
                onValueChange={([value]) => updateInteractiveParam('riskPerTrade', value)}
                min={0.5}
                max={5.0}
                step={0.1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum loss per individual trade</p>
            </div>

            <div>
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Portfolio Risk Cap
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    Auto-Exit
                  </Badge>
                </span>
                <span className="text-primary font-medium">{interactiveParams.portfolioRiskCap}%</span>
              </Label>
              <Slider
                value={[interactiveParams.portfolioRiskCap]}
                onValueChange={([value]) => updateInteractiveParam('portfolioRiskCap', value)}
                min={3.0}
                max={15.0}
                step={0.5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                When total loss reaches this %, all trades exit. New patterns still trigger entries.
              </p>
            </div>

          </div>
          
          {/* Note about per-pattern TP/SL */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <strong>Take Profit & Stop Loss:</strong> Each trade uses the pattern-specific TP/SL configured in Step 4 of the strategy builder.
              </div>
            </div>
          </div>

          {/* Risk Threshold Explanation */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Auto-Exit Behavior:</strong> If combined losses across all open trades reach {interactiveParams.portfolioRiskCap}%, 
                all positions are closed immediately. The backtest continues and new trades are opened when the next pattern confirms.
              </div>
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
                Test {strategy.patterns?.filter(p => p.enabled).length || 0} patterns with current configuration
              </p>
            </div>
            <Button
              onClick={runBacktest}
              disabled={isRunning || !strategy.patterns?.some(p => p.enabled)}
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

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Signal Analysis Dashboard - Comprehensive view */}
          {disciplineStats.totalSignals > 0 && (
            <SignalAnalysisDashboard 
              stats={disciplineStats} 
              filters={disciplineFilters}
              patternBreakdown={results.patternBreakdown}
              trades={results.trades}
              onFilterChange={handleFilterChange}
            />
          )}

          {/* Overall Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Overall Performance
                {disciplineStats.rejectedTrades > 0 && (
                  <Badge variant="outline" className="gap-1 text-xs bg-green-500/10 border-green-500/30 text-green-600">
                    <Shield className="w-3 h-3" />
                    {disciplineStats.rejectedTrades} low-quality trades avoided
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${results.totalReturn > 0 ? 'text-green-500' : results.totalReturn < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {results.totalReturn > 0 ? '+' : ''}{(results.totalReturn ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Total Return</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${results.maxDrawdown > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    -{Math.abs(results.maxDrawdown ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Max Drawdown</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${results.totalTrades > 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {(results.winRate ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${results.profitFactor > 0 ? 'text-purple-500' : 'text-muted-foreground'}`}>
                    {(results.profitFactor ?? 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Profit Factor</div>
                </div>
                <div className="text-center col-span-2 md:col-span-4 border-t pt-4 mt-2">
                  <div className={`text-xl font-semibold ${results.totalTrades > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {results.totalTrades ?? 0} trades executed
                    {results.rawSignals > 0 && results.totalTrades === 0 && (
                      <span className="text-sm font-normal text-amber-500 ml-2">
                        ({results.rawSignals} signals filtered by discipline rules)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pattern-Specific Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Pattern Performance Breakdown
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Individual performance metrics for each pattern type
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patternResults.map((pattern) => (
                  <Card key={pattern.patternId} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{pattern.patternName}</h4>
                          <p className="text-sm text-muted-foreground">{pattern.trades} trades executed</p>
                        </div>
                        <Badge variant={pattern.profitFactor > 1.5 ? "default" : "secondary"}>
                          PF: {pattern.profitFactor}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-green-500">{pattern.winRate}%</div>
                          <div className="text-muted-foreground">Win Rate</div>
                        </div>
                        <div>
                          <div className="font-medium">{pattern.avgReturn}%</div>
                          <div className="text-muted-foreground">Avg Return</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-500">{pattern.maxDrawdown}%</div>
                          <div className="text-muted-foreground">Max DD</div>
                        </div>
                        <div>
                          <div className="font-medium">{pattern.profitFactor}</div>
                          <div className="text-muted-foreground">Profit Factor</div>
                        </div>
                        <div>
                          <div className="font-medium">{pattern.sharpeRatio}</div>
                          <div className="text-muted-foreground">Sharpe</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI-Detected Patterns */}
          {results.patternDetails && results.patternDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  AI Pattern Detection Results
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real pattern detections from AI analysis of historical price data
                </p>
              </CardHeader>
              <CardContent>
                <PatternDetectionDisplay detections={results.patternDetails} />
              </CardContent>
            </Card>
          )}

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trade Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Trades</span>
                  <span className="font-medium">{results.totalTrades ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Winning Trades</span>
                  <span className="font-medium text-green-500">
                    {results.winningTrades ?? 0} ({results.winRate?.toFixed(1) ?? 0}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Losing Trades</span>
                  <span className="font-medium text-red-500">
                    {results.losingTrades ?? 0} ({(100 - (results.winRate ?? 0)).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Win</span>
                  <span className="font-medium text-green-500">
                    {results.avgWin != null ? `${results.avgWin >= 0 ? '+' : ''}${results.avgWin.toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Loss</span>
                  <span className="font-medium text-red-500">
                    {results.avgLoss != null ? `${results.avgLoss.toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Max Drawdown</span>
                  <span className="font-medium text-red-500">
                    {results.maxDrawdown != null ? `${results.maxDrawdown.toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sharpe Ratio</span>
                  <span className="font-medium">{results.sharpeRatio?.toFixed(2) ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sortino Ratio</span>
                  <span className="font-medium">{results.sortinoRatio?.toFixed(2) ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Factor</span>
                  <span className="font-medium">{results.profitFactor?.toFixed(2) ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expectancy</span>
                  <span className={`font-medium ${(results.expectancy ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {results.expectancy != null ? `${results.expectancy >= 0 ? '+' : ''}${results.expectancy.toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};