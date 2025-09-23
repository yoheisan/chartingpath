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
  onBacktest: () => void;
}

export const EnhancedBacktestEngine: React.FC<EnhancedBacktestEngineProps> = ({
  strategy,
  results,
  isRunning,
  onBacktest
}) => {
  const [backtestConfig, setBacktestConfig] = useState({
    symbol: 'EURUSD',
    timeframe: 'H1',
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    spread: 1.5,
    commission: 0,
    slippage: 0.5,
    initialBalance: 10000,
    testModel: 'control_points'
  });

  const [interactiveParams, setInteractiveParams] = useState({
    riskPerTrade: strategy.riskManagement?.riskPerTrade || 2.0,
    portfolioRiskCap: strategy.multiPatternSettings?.portfolioRiskCap || 6.0,
    atrMultiplier: 2.0,
    takeProfitRatio: 2.0
  });

  const updateConfig = (field: string, value: any) => {
    setBacktestConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateInteractiveParam = (field: string, value: number) => {
    setInteractiveParams(prev => ({ ...prev, [field]: value }));
  };

  const runBacktest = async () => {
    console.log('Running enhanced pattern-based backtest with config:', backtestConfig);
    console.log('Interactive parameters:', interactiveParams);
    console.log('Strategy patterns:', strategy.patterns);
    onBacktest();
  };

  // Mock pattern-specific results
  const patternResults: PatternBacktestResult[] = [
    {
      patternId: 'head_shoulders',
      patternName: 'Head & Shoulders',
      trades: 45,
      winRate: 67.8,
      avgReturn: 1.23,
      maxDrawdown: -3.2,
      profitFactor: 1.85,
      sharpeRatio: 1.42
    },
    {
      patternId: 'double_top',
      patternName: 'Double Top',
      trades: 32,
      winRate: 62.5,
      avgReturn: 0.98,
      maxDrawdown: -2.8,
      profitFactor: 1.67,
      sharpeRatio: 1.15
    },
    {
      patternId: 'bullish_engulfing',
      patternName: 'Bullish Engulfing',
      trades: 78,
      winRate: 58.9,
      avgReturn: 0.76,
      maxDrawdown: -4.1,
      profitFactor: 1.42,
      sharpeRatio: 0.98
    }
  ];

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
                        <SelectItem value="M15">15 Minutes</SelectItem>
                        <SelectItem value="H1">1 Hour</SelectItem>
                        <SelectItem value="H4">4 Hours</SelectItem>
                        <SelectItem value="D1">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={backtestConfig.startDate}
                      onChange={(e) => updateConfig('startDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={backtestConfig.endDate}
                      onChange={(e) => updateConfig('endDate', e.target.value)}
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
            </div>

            <div>
              <Label className="flex items-center justify-between">
                Portfolio Risk Cap
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
                <span>Processing patterns...</span>
                <span>67%</span>
              </div>
              <Progress value={67} className="h-2" />
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