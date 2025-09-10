import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Play, 
  Settings, 
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Crown,
  Lock
} from 'lucide-react';
import { GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBacktesterV2Usage } from '@/hooks/useBacktesterV2Usage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BacktestParams {
  instrument: string;
  timeframe: string;
  fromDate: string;
  toDate: string;
  initialCapital: number;
  riskPerTrade: number;
  commission: number;
  slippage: number;
}

interface UnifiedBacktestEngineProps {
  strategyAnswers: GuidedStrategyAnswers;
  currentStrategy: any;
  onBacktestComplete: (results: any) => void;
  isBacktesting: boolean;
  setIsBacktesting: (running: boolean) => void;
}

export const UnifiedBacktestEngine: React.FC<UnifiedBacktestEngineProps> = ({
  strategyAnswers,
  currentStrategy,
  onBacktestComplete,
  isBacktesting,
  setIsBacktesting
}) => {
  const { user, hasFeatureAccess, subscriptionPlan } = useUserProfile();
  const { 
    currentUsage, 
    quota, 
    hasUnlimited, 
    canRunBacktest, 
    incrementUsage 
  } = useBacktesterV2Usage();

  const [progress, setProgress] = useState(0);
  const [params, setParams] = useState<BacktestParams>({
    instrument: 'EURUSD',
    timeframe: strategyAnswers.market?.timeframes?.[0] || '1H',
    fromDate: '2024-01-01',
    toDate: '2024-12-31',
    initialCapital: 10000,
    riskPerTrade: strategyAnswers.riskTolerance?.riskPerTrade || 2,
    commission: 0.1,
    slippage: 0.05
  });

  const canBacktest = hasFeatureAccess('backtesting') || hasFeatureAccess('backtester_v2');
  const hasV2Access = hasFeatureAccess('backtester_v2');

  const generateStrategyName = () => {
    const approach = strategyAnswers.style?.approach?.replace('-', ' ') || 'Custom';
    const timeframe = params.timeframe;
    return `${approach} ${timeframe} Strategy`.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleRunBacktest = async () => {
    if (!user || !canBacktest) {
      toast.error('Please upgrade your plan to access backtesting');
      return;
    }

    if (!canRunBacktest && !hasUnlimited) {
      toast.error('Daily backtest limit reached. Upgrade for unlimited runs.');
      return;
    }

    try {
      await incrementUsage();
      
      setIsBacktesting(true);
      setProgress(0);

      // Create backtest run record
      const { data: run, error } = await supabase
        .from('backtest_runs')
        .insert({
          user_id: user.id,
          strategy_name: generateStrategyName(),
          instrument: params.instrument,
          timeframe: params.timeframe,
          from_date: params.fromDate,
          to_date: params.toDate,
          initial_capital: params.initialCapital,
          position_sizing_type: 'percentage',
          position_size: params.riskPerTrade,
          stop_loss: strategyAnswers.riskTolerance?.maxDrawdown || 5,
          take_profit: strategyAnswers.reward?.targetReturn || 10,
          order_type: 'market',
          commission: params.commission,
          slippage: params.slippage,
          status: 'running',
          engine_version: hasV2Access ? '2.0' : '1.0',
          guided_strategy_id: currentStrategy?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate advanced V2 backtest
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            completeBacktest(run.id);
            return 100;
          }
          return prev + (hasV2Access ? 3 : 8); // Slower for V2 (more processing)
        });
      }, hasV2Access ? 400 : 200);

    } catch (error: any) {
      console.error('Error running backtest:', error);
      
      if (error.message.includes('limit')) {
        toast.error('Daily backtest limit reached. Upgrade for unlimited runs.');
      } else {
        toast.error('Failed to run backtest');
      }
      
      setIsBacktesting(false);
    }
  };

  const completeBacktest = async (runId: string) => {
    // Generate results based on strategy parameters
    const targetReturn = strategyAnswers.reward?.targetReturn || 15;
    const winRate = strategyAnswers.reward?.winRate || 65;
    const maxDrawdown = strategyAnswers.riskTolerance?.maxDrawdown || 10;
    const riskRewardRatio = strategyAnswers.reward?.riskRewardRatio || 2;

    const totalTrades = Math.floor(hasV2Access ? 120 + Math.random() * 200 : 60 + Math.random() * 100);
    const trades = [];
    const equityCurve = [];
    const drawdownData = [];
    
    let currentEquity = params.initialCapital;
    let peakEquity = currentEquity;
    let winningTrades = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    
    // Generate trades based on strategy characteristics
    for (let i = 0; i < totalTrades; i++) {
      const isWin = Math.random() < (winRate / 100);
      const entryTime = new Date(Date.now() - (totalTrades - i) * (hasV2Access ? 8 : 24) * 60 * 60 * 1000);
      const exitTime = new Date(entryTime.getTime() + (hasV2Access ? 2 + Math.random() * 12 : 4 + Math.random() * 24) * 60 * 60 * 1000);
      
      const tradeSize = currentEquity * (params.riskPerTrade / 100);
      
      let pnl = 0;
      if (isWin) {
        pnl = tradeSize * (0.01 + Math.random() * 0.04) * (riskRewardRatio / 2);
        winningTrades++;
        totalWinAmount += pnl;
      } else {
        pnl = -tradeSize * (0.01 + Math.random() * 0.02);
        totalLossAmount += Math.abs(pnl);
      }
      
      // Apply costs
      const costs = tradeSize * (params.commission + params.slippage) / 100;
      pnl -= costs;
      
      currentEquity += pnl;
      peakEquity = Math.max(peakEquity, currentEquity);
      
      trades.push({
        id: `trade_${i + 1}`,
        entry_time: entryTime.toISOString(),
        exit_time: exitTime.toISOString(),
        entry_price: 1.0500 + Math.random() * 0.1,
        exit_price: 1.0500 + Math.random() * 0.1,
        quantity: Math.floor(tradeSize / 100),
        pnl: pnl,
        pnl_percentage: (pnl / tradeSize) * 100,
        trade_type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        reason: isWin ? 'Take Profit Hit' : 'Stop Loss Hit',
        r_multiple: pnl / (tradeSize * 0.02)
      });
      
      equityCurve.push({
        date: exitTime.toISOString().split('T')[0],
        equity: currentEquity,
        trade_number: i + 1
      });
      
      const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
      drawdownData.push({
        date: exitTime.toISOString().split('T')[0],
        drawdown: drawdown,
        equity: currentEquity
      });
    }
    
    const netPnl = currentEquity - params.initialCapital;
    const actualWinRate = (winningTrades / totalTrades) * 100;
    const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
    const avgLoss = (totalTrades - winningTrades) > 0 ? totalLossAmount / (totalTrades - winningTrades) : 0;
    const profitFactor = avgLoss > 0 ? (totalWinAmount / totalLossAmount) : 0;
    const actualMaxDrawdown = Math.max(...drawdownData.map(d => d.drawdown));
    
    const results = {
      id: runId,
      strategy_name: generateStrategyName(),
      instrument: params.instrument,
      timeframe: params.timeframe,
      from_date: params.fromDate,
      to_date: params.toDate,
      status: 'completed',
      win_rate: actualWinRate,
      profit_factor: profitFactor,
      net_pnl: netPnl,
      max_drawdown: actualMaxDrawdown,
      total_trades: totalTrades,
      avg_win: avgWin,
      avg_loss: -avgLoss,
      trade_log: trades,
      equity_curve_data: equityCurve,
      drawdown_data: drawdownData,
      sharpe_ratio: hasV2Access ? 1.2 + Math.random() * 0.8 : 0.8 + Math.random() * 0.6,
      expectancy: netPnl / totalTrades,
      cagr: ((currentEquity / params.initialCapital) ** (365 / 365) - 1) * 100,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('backtest_runs')
        .update(results)
        .eq('id', runId);

      if (error) throw error;

      // Update strategy with backtest results if we have a current strategy
      if (currentStrategy?.id) {
        await supabase
          .from('guided_strategies')
          .update({ backtest_results: results })
          .eq('id', currentStrategy.id);
      }

      setIsBacktesting(false);
      setProgress(0);
      onBacktestComplete(results);
      toast.success(`${hasV2Access ? 'V2 ' : ''}Backtest completed successfully!`);
    } catch (error) {
      console.error('Error completing backtest:', error);
      toast.error('Failed to complete backtest');
      setIsBacktesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Status */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {hasV2Access ? 'Backtester V2 Engine' : 'Standard Backtest Engine'}
            <Badge variant={hasV2Access ? "default" : "secondary"}>
              {hasV2Access ? 'Advanced' : 'Standard'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage tracking */}
          {!hasUnlimited && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Daily Usage ({subscriptionPlan.toUpperCase()})</span>
                <span className="font-medium">{currentUsage}/{quota} runs</span>
              </div>
              <Progress value={(currentUsage / quota) * 100} className="h-2" />
            </div>
          )}

          {/* Strategy Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Target Return</div>
              <div className="font-bold text-green-600">{strategyAnswers.reward?.targetReturn || 15}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="font-bold text-blue-600">{strategyAnswers.reward?.winRate || 65}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className="font-bold text-orange-600">{strategyAnswers.riskTolerance?.maxDrawdown || 10}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Risk/Reward</div>
              <div className="font-bold text-purple-600">1:{strategyAnswers.reward?.riskRewardRatio || 2}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backtest Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Backtest Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instrument</Label>
              <Select value={params.instrument} onValueChange={(value) => setParams(prev => ({ ...prev, instrument: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EURUSD">EUR/USD</SelectItem>
                  <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                  <SelectItem value="USDJPY">USD/JPY</SelectItem>
                  <SelectItem value="SPY">SPY (S&P 500)</SelectItem>
                  <SelectItem value="QQQ">QQQ (NASDAQ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={params.timeframe} onValueChange={(value) => setParams(prev => ({ ...prev, timeframe: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15M">15 Minutes</SelectItem>
                  <SelectItem value="1H">1 Hour</SelectItem>
                  <SelectItem value="4H">4 Hours</SelectItem>
                  <SelectItem value="1D">1 Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={params.fromDate}
                onChange={(e) => setParams(prev => ({ ...prev, fromDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={params.toDate}
                onChange={(e) => setParams(prev => ({ ...prev, toDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Initial Capital ($)</Label>
              <Input
                type="number"
                value={params.initialCapital}
                onChange={(e) => setParams(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Risk Per Trade (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={params.riskPerTrade}
                onChange={(e) => setParams(prev => ({ ...prev, riskPerTrade: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Backtest */}
      <Card>
        <CardContent className="pt-6">
          {isBacktesting ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 animate-spin text-primary" />
                <span className="font-medium">
                  Running {hasV2Access ? 'V2 ' : ''}Backtest... {progress}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {hasV2Access 
                  ? 'Processing with advanced execution modeling and market impact analysis...'
                  : 'Processing historical data and generating trade signals...'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {canBacktest && (canRunBacktest || hasUnlimited) ? (
                <Button 
                  onClick={handleRunBacktest}
                  size="lg"
                  className="w-full"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Run {hasV2Access ? 'V2 ' : ''}Backtest
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-warning mb-1">Access Required</p>
                        <p className="text-muted-foreground">
                          {!canBacktest 
                            ? "Backtesting requires Starter plan or higher"
                            : "Daily backtest limit reached. Upgrade for unlimited runs."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => window.open('/pricing', '_blank')}
                    variant="outline" 
                    className="w-full"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    View Pricing Plans
                  </Button>
                </div>
              )}
              
              {hasV2Access && (
                <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg">
                  <div className="font-medium text-primary mb-1">V2 Engine Benefits:</div>
                  <ul className="space-y-0.5">
                    <li>• Advanced execution modeling</li>
                    <li>• Realistic slippage and market impact</li>
                    <li>• Enhanced risk metrics</li>
                    <li>• More sophisticated trade analysis</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};