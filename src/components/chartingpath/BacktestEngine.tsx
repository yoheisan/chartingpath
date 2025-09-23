import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
  BarChart3, 
  Play, 
  TrendingUp, 
  TrendingDown, 
  Calendar as CalendarIcon,
  Settings,
  DollarSign,
  Percent,
  Target,
  Activity
} from 'lucide-react';

interface BacktestEngineProps {
  strategy: any;
  results: any;
  isRunning: boolean;
  onBacktest: () => void;
}

export const BacktestEngine: React.FC<BacktestEngineProps> = ({
  strategy,
  results,
  isRunning,
  onBacktest
}) => {
  const [backtestConfig, setBacktestConfig] = useState({
    symbol: 'USDJPY',
    timeframe: 'M5',
    startDate: new Date('2023-02-08'),
    endDate: new Date('2024-02-09'),
    spread: 2,
    executionMode: 'zero_latency',
    testModel: 'every_tick'
  });
  
  const [showConfig, setShowConfig] = useState(false);

  const updateConfig = (field: string, value: any) => {
    setBacktestConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const runBacktest = () => {
    console.log('Running backtest with config:', backtestConfig);
    onBacktest();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Professional Backtest Engine
            </div>
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
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
                <div className="space-y-6">
                  {/* Period Selection */}
                  <div>
                    <Label className="text-base font-medium">Period</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-sm">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(backtestConfig.startDate, 'PPP')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={backtestConfig.startDate}
                              onSelect={(date) => date && updateConfig('startDate', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-sm">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(backtestConfig.endDate, 'PPP')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={backtestConfig.endDate}
                              onSelect={(date) => date && updateConfig('endDate', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Symbol & Timeframe */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Symbol</Label>
                      <Select
                        value={backtestConfig.symbol}
                        onValueChange={(value) => updateConfig('symbol', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDJPY">USDJPY</SelectItem>
                          <SelectItem value="EURUSD">EURUSD</SelectItem>
                          <SelectItem value="GBPUSD">GBPUSD</SelectItem>
                          <SelectItem value="AUDUSD">AUDUSD</SelectItem>
                          <SelectItem value="USDCAD">USDCAD</SelectItem>
                          <SelectItem value="USDCHF">USDCHF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Timeframe</Label>
                      <Select
                        value={backtestConfig.timeframe}
                        onValueChange={(value) => updateConfig('timeframe', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M1">M1</SelectItem>
                          <SelectItem value="M5">M5</SelectItem>
                          <SelectItem value="M15">M15</SelectItem>
                          <SelectItem value="M30">M30</SelectItem>
                          <SelectItem value="H1">H1</SelectItem>
                          <SelectItem value="H4">H4</SelectItem>
                          <SelectItem value="D1">D1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Execution Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Execution Mode</Label>
                      <Select
                        value={backtestConfig.executionMode}
                        onValueChange={(value) => updateConfig('executionMode', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zero_latency">Zero latency, ideal execution</SelectItem>
                          <SelectItem value="real_world">Real-world execution</SelectItem>
                          <SelectItem value="slippage">With slippage simulation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Test Model</Label>
                      <Select
                        value={backtestConfig.testModel}
                        onValueChange={(value) => updateConfig('testModel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="every_tick">Every tick</SelectItem>
                          <SelectItem value="1min_ohlc">1 minute OHLC</SelectItem>
                          <SelectItem value="open_prices">Open prices only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Spread (pips)</Label>
                    <Input
                      type="number"
                      value={backtestConfig.spread}
                      onChange={(e) => updateConfig('spread', parseFloat(e.target.value) || 0)}
                      step="0.1"
                      min="0"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowConfig(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => { runBacktest(); setShowConfig(false); }}>
                      Run Backtest
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure and run professional backtests with detailed performance metrics
          </p>
        </CardHeader>
        <CardContent>
          {/* Quick Settings Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Symbol</p>
              <p className="font-medium">{backtestConfig.symbol}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Timeframe</p>
              <p className="font-medium">{backtestConfig.timeframe}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Spread</p>
              <p className="font-medium">{backtestConfig.spread} pips</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium text-xs">
                {format(backtestConfig.startDate, 'MMM yyyy')} - {format(backtestConfig.endDate, 'MMM yyyy')}
              </p>
            </div>
          </div>

          <Button onClick={runBacktest} disabled={isRunning} className="w-full mb-6">
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
          
          {results && (
            <div className="space-y-6">
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Backtest Results</h3>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Total Return</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">+15.4%</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Max Drawdown</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">-5.2%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Win Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">68.5%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Profit Factor</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">2.1</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-xl font-semibold">145</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg Win</p>
                    <p className="text-xl font-semibold text-green-600">+28.4 pips</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Avg Loss</p>
                    <p className="text-xl font-semibold text-red-600">-15.2 pips</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                    <p className="text-xl font-semibold">1.42</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Expectancy</p>
                    <p className="text-xl font-semibold text-green-600">+14.7 pips</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Recovery Factor</p>
                    <p className="text-xl font-semibold">2.96</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};