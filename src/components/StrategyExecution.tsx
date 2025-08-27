import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  Play, 
  Pause, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Clock,
  Target,
  Zap
} from 'lucide-react';

interface StrategyExecution {
  id: string;
  strategy_id: string;
  symbol: string;
  signal_type: 'long' | 'short' | 'exit';
  price: number;
  quantity: number;
  executed_at: string;
  execution_reason: string;
}

interface ActiveStrategy {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  strategy_code?: string;
}

interface StrategyExecutionProps {
  strategies: ActiveStrategy[];
  portfolioId?: string;
  onRefresh?: () => void;
}

const MOCK_MARKET_DATA = {
  'EUR/USD': { price: 1.0875, change: 0.0012 },
  'GBP/USD': { price: 1.2654, change: -0.0034 },
  'USD/JPY': { price: 149.82, change: 0.45 },
  'AUD/USD': { price: 0.6567, change: 0.0023 },
  'USD/CAD': { price: 1.3721, change: -0.0018 },
};

export const StrategyExecution = ({ strategies, portfolioId, onRefresh }: StrategyExecutionProps) => {
  const { user } = useUserProfile();
  const { toast } = useToast();
  const [executions, setExecutions] = useState<StrategyExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [configs, setConfigs] = useState<Record<string, { symbol: string; quantity: number; slPct?: number; tpPct?: number }>>({});

  const MAJOR_PAIRS = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD','NZD/USD','EUR/GBP'];

  const parseDefaultsFromCode = (code?: string) => {
    if (!code) return { slPct: undefined, tpPct: undefined };
    const slMatch = code.match(/slPct\s*=\s*input\.float\(([^,\)]+)/);
    const tpMatch = code.match(/tpPct\s*=\s*input\.float\(([^,\)]+)/);
    const sl = slMatch ? parseFloat(slMatch[1]) : undefined;
    const tp = tpMatch ? parseFloat(tpMatch[1]) : undefined;
    return { slPct: isNaN(sl as number) ? undefined : sl, tpPct: isNaN(tp as number) ? undefined : tp } as { slPct?: number; tpPct?: number };
  };

  useEffect(() => {
    if (user) {
      fetchRecentExecutions();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        simulateStrategyExecution();
      }, 5000); // Check for signals every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, strategies]);

  // Initialize per-strategy configs when strategies change
  useEffect(() => {
    const next = { ...configs } as Record<string, { symbol: string; quantity: number; slPct?: number; tpPct?: number }>;
    strategies.filter(s => s.is_active).forEach(s => {
      if (!next[s.id]) {
        const defaults = parseDefaultsFromCode(s.strategy_code);
        next[s.id] = {
          symbol: 'EUR/USD',
          quantity: 1,
          slPct: defaults.slPct,
          tpPct: defaults.tpPct,
        };
      }
    });
    setConfigs(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategies]);

  const fetchRecentExecutions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('strategy_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setExecutions((data || []).map(execution => ({
        ...execution,
        signal_type: execution.signal_type as 'long' | 'short' | 'exit'
      })));
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  const simulateStrategyExecution = async () => {
    if (!user) return;

    const activeStrategies = strategies.filter(s => s.is_active);
    if (activeStrategies.length === 0) return;

    // Simulate strategy analysis
    setExecutionProgress(prev => Math.min(prev + 20, 100));

    // Random chance of generating a signal (10% chance per check)
    if (Math.random() < 0.1) {
      const strategy = activeStrategies[Math.floor(Math.random() * activeStrategies.length)];
      const cfg = configs[strategy.id] || { symbol: 'EUR/USD', quantity: 1 };
      const symbol = cfg.symbol;
      const marketData = MOCK_MARKET_DATA[symbol as keyof typeof MOCK_MARKET_DATA] || { price: 1.0 } as any;
      
      const signalType: 'long' | 'short' = Math.random() > 0.5 ? 'long' : 'short';
      const quantity = Math.max(1, Math.floor(cfg.quantity || 1));

      // Compute SL/TP absolute prices if provided as %
      const entry = marketData.price;
      const slPct = cfg.slPct;
      const tpPct = cfg.tpPct;
      const stop_loss = slPct !== undefined 
        ? (signalType === 'long' ? entry * (1 - slPct / 100) : entry * (1 + slPct / 100))
        : null;
      const take_profit = tpPct !== undefined 
        ? (signalType === 'long' ? entry * (1 + tpPct / 100) : entry * (1 - tpPct / 100))
        : null;

      // Create execution record
      try {
        const { error } = await supabase
          .from('strategy_executions')
          .insert({
            strategy_id: strategy.id,
            user_id: user.id,
            symbol,
            signal_type: signalType,
            price: entry,
            quantity,
            execution_reason: `${strategy.name} generated ${signalType.toUpperCase()} signal based on technical analysis`,
          });

        if (error) throw error;

        // Create paper trade
        const { error: tradeError } = await supabase
          .from('paper_trades')
          .insert({
            user_id: user.id,
            portfolio_id: portfolioId || user.id,
            symbol,
            trade_type: signalType === 'long' ? 'buy' : 'sell',
            quantity,
            entry_price: entry,
            stop_loss: stop_loss ?? undefined,
            take_profit: take_profit ?? undefined,
            notes: `Auto-executed by ${strategy.name}`,
          });

        if (tradeError) console.error('Trade creation error:', tradeError);

        toast({
          title: "Strategy Signal Executed",
          description: `${strategy.name}: ${signalType.toUpperCase()} ${quantity} ${symbol} at ${entry.toFixed(4)}`,
          variant: signalType === 'long' ? 'default' : 'destructive',
        });

        fetchRecentExecutions();
        onRefresh?.();
        setExecutionProgress(100);
        
        // Reset progress after execution
        setTimeout(() => setExecutionProgress(0), 1000);
      } catch (error) {
        console.error('Error creating execution:', error);
      }
    }

    // Reset progress if no signal generated
    setTimeout(() => {
      if (executionProgress > 0) setExecutionProgress(0);
    }, 2000);
  };

  const toggleExecution = () => {
    const activeStrategies = strategies.filter(s => s.is_active);
    
    if (activeStrategies.length === 0) {
      toast({
        title: "No Active Strategies",
        description: "Please activate at least one strategy to start execution",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(!isRunning);
    
    toast({
      title: isRunning ? "Strategy Execution Stopped" : "Strategy Execution Started",
      description: isRunning 
        ? "All strategies have been paused" 
        : `Running ${activeStrategies.length} active strategies`,
    });
  };

  const activeStrategies = strategies.filter(s => s.is_active);

  return (
    <div className="space-y-6">
      {/* Execution Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Strategy Execution Engine
          </CardTitle>
          <CardDescription>
            Monitor and control algorithmic strategy execution in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Overview */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{activeStrategies.length}</div>
                <div className="text-sm text-muted-foreground">Active Strategies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{executions.length}</div>
                <div className="text-sm text-muted-foreground">Recent Executions</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isRunning ? 'text-green-600' : 'text-gray-500'}`}>
                  {isRunning ? 'RUNNING' : 'STOPPED'}
                </div>
                <div className="text-sm text-muted-foreground">Engine Status</div>
              </div>
            </div>

            {/* Execution Progress */}
            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing market conditions...</span>
                  <span>{executionProgress}%</span>
                </div>
                <Progress value={executionProgress} className="h-2" />
              </div>
            )}

            {/* Control Button */}
            <div className="flex justify-center">
              <Button 
                onClick={toggleExecution}
                variant={isRunning ? "destructive" : "default"}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Stop Execution
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Execution
                  </>
                )}
              </Button>
            </div>

            {/* Active Strategies Configuration */}
            {activeStrategies.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Configure Active Strategies</h4>
                {activeStrategies.map(strategy => {
                  const cfg = configs[strategy.id] || { symbol: 'EUR/USD', quantity: 1 };
                  return (
                    <div key={strategy.id} className="p-3 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{strategy.name}</div>
                        <Badge variant="default">
                          <Activity className="h-3 w-3 mr-1" /> Running
                        </Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Symbol</div>
                          <Select 
                            value={cfg.symbol}
                            onValueChange={(val) => setConfigs(prev => ({ ...prev, [strategy.id]: { ...prev[strategy.id], symbol: val } }))}
                          >
                            <SelectTrigger className="z-50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                              {MAJOR_PAIRS.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                          <Input 
                            type="number"
                            min={1}
                            value={cfg.quantity}
                            onChange={(e) => setConfigs(prev => ({ ...prev, [strategy.id]: { ...prev[strategy.id], quantity: Number(e.target.value) } }))}
                          />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Stop Loss %</div>
                          <Input 
                            type="number"
                            step="0.1"
                            placeholder={parseDefaultsFromCode(strategy.strategy_code).slPct?.toString() || 'e.g. 1.0'}
                            value={cfg.slPct ?? ''}
                            onChange={(e) => setConfigs(prev => ({ ...prev, [strategy.id]: { ...prev[strategy.id], slPct: e.target.value === '' ? undefined : Number(e.target.value) } }))}
                          />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Take Profit %</div>
                          <Input 
                            type="number"
                            step="0.1"
                            placeholder={parseDefaultsFromCode(strategy.strategy_code).tpPct?.toString() || 'e.g. 3.5'}
                            value={cfg.tpPct ?? ''}
                            onChange={(e) => setConfigs(prev => ({ ...prev, [strategy.id]: { ...prev[strategy.id], tpPct: e.target.value === '' ? undefined : Number(e.target.value) } }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Executions
          </CardTitle>
          <CardDescription>
            Latest strategy signals and trade executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2" />
              <p>No executions yet. Start the engine to begin trading.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map(execution => (
                <div key={execution.id} 
                     className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {execution.signal_type === 'long' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : execution.signal_type === 'short' ? (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    
                    <div>
                      <div className="font-medium">
                        {execution.signal_type.toUpperCase()} {execution.quantity} {execution.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @ ${execution.price.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={execution.signal_type === 'long' ? 'default' : 'secondary'}>
                      {execution.signal_type}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(execution.executed_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};