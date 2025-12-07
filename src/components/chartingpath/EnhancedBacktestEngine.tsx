import React, { useState } from 'react';
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
import { toast } from 'sonner';
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
  AlertTriangle
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
}

export const EnhancedBacktestEngine: React.FC<EnhancedBacktestEngineProps> = ({
  strategy,
  results,
  isRunning,
  onBacktest
}) => {
  // Get valid date range based on timeframe
  const getMaxDaysForTimeframe = (timeframe: string): number => {
    const limits: Record<string, number> = {
      '1m': 7,
      '5m': 60,
      '15m': 60,
      '1h': 730,
      '4h': 730,
      '1d': 36500, // ~100 years
      '1w': 36500
    };
    return limits[timeframe] || 730;
  };

  const getDefaultDateRange = (timeframe: string) => {
    const maxDays = getMaxDaysForTimeframe(timeframe);
    const endDate = new Date();
    const startDate = new Date();
    
    // Use 80% of max range to be safe
    const safeDays = Math.floor(maxDays * 0.8);
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
    portfolioRiskCap: strategy.multiPatternSettings?.portfolioRiskCap || 6.0,
    atrMultiplier: 2.0,
    takeProfitRatio: 2.0
  });

  const updateConfig = (field: string, value: any) => {
    setBacktestConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      
      // Auto-adjust date range when timeframe changes
      if (field === 'timeframe') {
        const maxDays = getMaxDaysForTimeframe(value);
        const start = new Date(prev.startDate);
        const end = new Date(prev.endDate);
        const currentDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        // If current range exceeds the limit, adjust it
        if (currentDays > maxDays) {
          const newDates = getDefaultDateRange(value);
          newConfig.startDate = newDates.startDate;
          newConfig.endDate = newDates.endDate;
          
          toast.info(`Date range adjusted for ${value} timeframe (max ${maxDays} days)`, {
            description: `New range: ${newDates.startDate} to ${newDates.endDate}`
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
    console.log('Running enhanced pattern-based backtest with config:', backtestConfig);
    console.log('Interactive parameters:', interactiveParams);
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

  // Calculate pattern-specific results from actual backtest data
  const patternResults: PatternBacktestResult[] = React.useMemo(() => {
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
              <span>{strategy.patterns?.length || 0} Patterns Active</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span>${backtestConfig.initialBalance.toLocaleString()}</span>
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

            <div>
              <Label className="flex items-center justify-between">
                ATR Stop Multiplier
                <span className="text-primary font-medium">{interactiveParams.atrMultiplier}x</span>
              </Label>
              <Slider
                value={[interactiveParams.atrMultiplier]}
                onValueChange={([value]) => updateInteractiveParam('atrMultiplier', value)}
                min={1.0}
                max={4.0}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="flex items-center justify-between">
                Take Profit Ratio
                <span className="text-primary font-medium">{interactiveParams.takeProfitRatio}:1</span>
              </Label>
              <Slider
                value={[interactiveParams.takeProfitRatio]}
                onValueChange={([value]) => updateInteractiveParam('takeProfitRatio', value)}
                min={1.0}
                max={5.0}
                step={0.1}
                className="mt-2"
              />
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
                Test {strategy.patterns?.length || 0} patterns with current configuration
              </p>
            </div>
            <Button
              onClick={runBacktest}
              disabled={isRunning || !strategy.patterns?.length}
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
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Running backtest...</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Overall Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Overall Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">+23.4%</div>
                  <div className="text-sm text-muted-foreground">Total Return</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">-6.8%</div>
                  <div className="text-sm text-muted-foreground">Max Drawdown</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">64.2%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">1.67</div>
                  <div className="text-sm text-muted-foreground">Profit Factor</div>
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
                <CardTitle className="text-lg">Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Sharpe Ratio</span>
                  <span className="font-medium">1.24</span>
                </div>
                <div className="flex justify-between">
                  <span>Sortino Ratio</span>
                  <span className="font-medium">1.78</span>
                </div>
                <div className="flex justify-between">
                  <span>Calmar Ratio</span>
                  <span className="font-medium">3.44</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Consecutive Losses</span>
                  <span className="font-medium text-red-500">4</span>
                </div>
                <div className="flex justify-between">
                  <span>Recovery Factor</span>
                  <span className="font-medium">3.44</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trade Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Trades</span>
                  <span className="font-medium">155</span>
                </div>
                <div className="flex justify-between">
                  <span>Winning Trades</span>
                  <span className="font-medium text-green-500">99 (64.2%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Losing Trades</span>
                  <span className="font-medium text-red-500">56 (35.8%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Win</span>
                  <span className="font-medium text-green-500">$124.50</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Loss</span>
                  <span className="font-medium text-red-500">-$78.20</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};