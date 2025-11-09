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
    riskPerTrade: strategyAnswers.risk?.riskPerTrade || 2,
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

    const isElite = subscriptionPlan?.toLowerCase() === 'elite';

    if (!isElite && !canRunBacktest && !hasUnlimited) {
      toast.error('Daily backtest limit reached. Upgrade for unlimited runs.');
      return;
    }

    try {
      // Elite can proceed even if usage RPC fails
      try {
        await incrementUsage();
      } catch (e) {
        if (!isElite) throw e;
      }
      
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
          stop_loss: strategyAnswers.risk?.maxDrawdown || 5,
          take_profit: 10,
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

      // Run real BacktesterV2 engine
      const { BacktesterV2Adapter } = await import('@/adapters/backtesterV2');
      const adapter = new BacktesterV2Adapter();
      
      // Simulate progress updates while running
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + (hasV2Access ? 5 : 10), 95));
      }, hasV2Access ? 500 : 300);

      try {
        const backtestParams = {
          instrument: params.instrument,
          timeframe: params.timeframe,
          period: 'custom',
          fromDate: params.fromDate,
          toDate: params.toDate,
          initialCapital: params.initialCapital,
          positionSizingType: 'percentage',
          positionSize: params.riskPerTrade,
          stopLoss: strategyAnswers.risk?.maxDrawdown || 5,
          takeProfit: 10,
          orderType: 'market',
          commission: params.commission,
          slippage: params.slippage
        };

        const result = await adapter.runBacktest(backtestParams, strategyAnswers);
        
        clearInterval(progressInterval);
        setProgress(100);
        
        // Update run record with results
        await completeBacktest(run.id, result);
        
      } catch (backtestError) {
        clearInterval(progressInterval);
        throw backtestError;
      }

    } catch (error: any) {
      console.error('Error running backtest:', error);
      
      if (error.message.includes('limit')) {
        toast.error('Daily backtest limit reached. Upgrade for unlimited runs.');
      } else {
        toast.error(`Backtest failed: ${error.message}`);
      }
      
      setIsBacktesting(false);
      setProgress(0);
    }
  };

  const completeBacktest = async (runId: string, engineResult: any) => {
    // Use results from the real BacktesterV2 engine
    const results = {
      id: runId,
      strategy_name: engineResult.strategy_name,
      instrument: engineResult.instrument,
      timeframe: engineResult.timeframe,
      from_date: engineResult.from_date,
      to_date: engineResult.to_date,
      status: 'completed',
      win_rate: engineResult.win_rate,
      profit_factor: engineResult.profit_factor,
      net_pnl: engineResult.net_pnl,
      max_drawdown: engineResult.max_drawdown,
      total_trades: engineResult.total_trades,
      avg_win: engineResult.avg_win,
      avg_loss: engineResult.avg_loss,
      trade_log: engineResult.trade_log,
      equity_curve_data: engineResult.equity_curve_data,
      drawdown_data: engineResult.equity_curve_data.map((point: any) => ({
        date: point.date,
        drawdown: point.drawdown || 0,
        equity: point.equity
      })),
      sharpe_ratio: engineResult.sharpe_ratio,
      expectancy: engineResult.net_pnl / (engineResult.total_trades || 1),
      cagr: ((engineResult.equity_curve_data[engineResult.equity_curve_data.length - 1]?.equity / params.initialCapital) ** (365 / 365) - 1) * 100,
      created_at: engineResult.created_at
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
      toast.success(`${hasV2Access ? 'V2 ' : ''}Backtest completed with real engine!`);
    } catch (error) {
      console.error('Error completing backtest:', error);
      toast.error('Failed to save backtest results');
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
              <div className="font-bold text-green-600">15%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="font-bold text-blue-600">65%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className="font-bold text-orange-600">{strategyAnswers.risk?.maxDrawdown || 10}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Risk/Reward</div>
              <div className="font-bold text-purple-600">1:2</div>
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