import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Play, 
  Save, 
  Download, 
  Send, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Settings,
  Calendar,
  DollarSign
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { tradingStrategies } from "@/utils/TradingStrategiesData";
import BacktestResults from "@/components/BacktestResults";
import BacktestParametersPanel, { BacktestParams } from "@/components/BacktestParametersPanel";

interface BacktestRun {
  id: string;
  strategy_name: string;
  instrument: string;
  timeframe: string;
  from_date: string;
  to_date: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  win_rate?: number;
  profit_factor?: number;
  net_pnl?: number;
  max_drawdown?: number;
  total_trades?: number;
  created_at: string;
  trade_log?: any[];
  equity_curve_data?: any[];
  drawdown_data?: any[];
}

const BacktestWorkspace = () => {
  const { user, profile, hasFeatureAccess } = useUserProfile();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [currentRun, setCurrentRun] = useState<BacktestRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backtestParams, setBacktestParams] = useState<BacktestParams>({
    instrument: "EURUSD",
    timeframe: "1H", 
    fromDate: "2024-01-01",
    toDate: "2024-12-31",
    initialCapital: 10000,
    positionSizingType: "percentage",
    positionSize: 10,
    stopLoss: 2,
    takeProfit: 6,
    orderType: "market",
    commission: 0.1,
    slippage: 0.05
  });

  const canRunBacktest = hasFeatureAccess('backtesting');
  const canAccessVault = hasFeatureAccess('backtesting');

  const handleSavePreset = async () => {
    if (!user) {
      toast.error("Please sign in to save presets");
      return;
    }

    if (!selectedStrategy) {
      toast.error("Please select a strategy first");
      return;
    }

    const presetName = prompt("Enter preset name:");
    if (!presetName) return;

    try {
      const { error } = await supabase
        .from('backtest_presets')
        .insert({
          user_id: user.id,
          name: presetName,
          description: `${selectedStrategy} preset for ${backtestParams.instrument} ${backtestParams.timeframe}`,
          parameters: {
            strategy: selectedStrategy,
            ...backtestParams
          }
        });

      if (error) throw error;
      toast.success("Preset saved successfully!");
    } catch (error) {
      console.error('Error saving preset:', error);
      toast.error("Failed to save preset");
    }
  };

  const handleForwardTest = async () => {
    if (!user || !currentRun) {
      toast.error("Please run a backtest first");
      return;
    }

    if (!currentRun.trade_log || currentRun.trade_log.length === 0) {
      toast.error("No trade data available for forward testing");
      return;
    }

    try {
      // Create or update paper portfolio
      const { data: portfolio, error: portfolioError } = await supabase
        .from('paper_portfolios')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (portfolioError && portfolioError.code !== 'PGRST116') {
        throw portfolioError;
      }

      if (!portfolio) {
        const { error: createError } = await supabase
          .from('paper_portfolios')
          .insert({
            user_id: user.id,
            initial_balance: backtestParams.initialCapital,
            current_balance: backtestParams.initialCapital
          });

        if (createError) throw createError;
      }

      // Navigate to paper trading with strategy context
      toast.success("Forward test setup complete! Redirecting to paper trading...");
      setTimeout(() => {
        window.location.href = `/members/trading?strategy=${encodeURIComponent(selectedStrategy)}&instrument=${backtestParams.instrument}`;
      }, 1500);

    } catch (error) {
      console.error('Error setting up forward test:', error);
      toast.error("Failed to setup forward test");
    }
  };

  const handleRunBacktest = async () => {
    if (!user || !canRunBacktest) {
      toast.error("Please upgrade your plan to run backtests");
      return;
    }

    if (!selectedStrategy) {
      toast.error("Please select a strategy first");
      return;
    }

    setIsRunning(true);
    setProgress(0);

    try {
      // Create backtest run record
      const { data: run, error } = await supabase
        .from('backtest_runs')
        .insert({
          user_id: user.id,
          strategy_name: selectedStrategy,
          instrument: backtestParams.instrument,
          timeframe: backtestParams.timeframe,
          from_date: backtestParams.fromDate,
          to_date: backtestParams.toDate,
          initial_capital: backtestParams.initialCapital,
          position_sizing_type: backtestParams.positionSizingType,
          position_size: backtestParams.positionSize,
          stop_loss: backtestParams.stopLoss,
          take_profit: backtestParams.takeProfit,
          order_type: backtestParams.orderType,
          commission: backtestParams.commission,
          slippage: backtestParams.slippage,
          status: 'running'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentRun(run as BacktestRun);

      // Simulate backtest progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            // Simulate completion with mock results
            completeBacktest(run.id);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

    } catch (error) {
      console.error('Error running backtest:', error);
      toast.error("Failed to run backtest");
      setIsRunning(false);
    }
  };

  const completeBacktest = async (runId: string) => {
    // Generate realistic trade data
    const totalTrades = Math.floor(50 + Math.random() * 100);
    const trades = [];
    const equityCurve = [];
    const drawdownData = [];
    
    let currentEquity = backtestParams.initialCapital;
    let peakEquity = currentEquity;
    let winningTrades = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;
    
    // Generate individual trades
    for (let i = 0; i < totalTrades; i++) {
      const isWin = Math.random() > 0.35; // ~65% win rate
      const entryTime = new Date(Date.now() - (totalTrades - i) * 24 * 60 * 60 * 1000);
      const exitTime = new Date(entryTime.getTime() + (1 + Math.random() * 48) * 60 * 60 * 1000);
      
      const tradeSize = (backtestParams.positionSizingType === 'percentage' 
        ? currentEquity * (backtestParams.positionSize / 100)
        : backtestParams.positionSize);
      
      let pnl = 0;
      if (isWin) {
        pnl = tradeSize * (0.01 + Math.random() * 0.05); // 1-6% gain
        winningTrades++;
        totalWinAmount += pnl;
      } else {
        pnl = -tradeSize * (0.01 + Math.random() * 0.03); // 1-4% loss
        totalLossAmount += Math.abs(pnl);
      }
      
      // Apply commission and slippage
      const costs = tradeSize * (backtestParams.commission + backtestParams.slippage) / 100;
      pnl -= costs;
      
      currentEquity += pnl;
      peakEquity = Math.max(peakEquity, currentEquity);
      
      const trade = {
        id: `trade_${i + 1}`,
        entry_time: entryTime.toISOString(),
        exit_time: exitTime.toISOString(),
        entry_price: 1.0500 + Math.random() * 0.1,
        exit_price: 1.0500 + Math.random() * 0.1,
        quantity: Math.floor(tradeSize / 100),
        pnl: pnl,
        pnl_percentage: (pnl / tradeSize) * 100,
        trade_type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        reason: isWin ? 'Take Profit Hit' : (Math.random() > 0.5 ? 'Stop Loss Hit' : 'Strategy Exit'),
        r_multiple: pnl / (tradeSize * 0.02) // Assuming 2% risk per trade
      };
      
      trades.push(trade);
      
      // Add equity curve point
      equityCurve.push({
        date: exitTime.toISOString().split('T')[0],
        equity: currentEquity,
        trade_number: i + 1
      });
      
      // Calculate drawdown
      const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
      drawdownData.push({
        date: exitTime.toISOString().split('T')[0],
        drawdown: drawdown,
        equity: currentEquity
      });
    }
    
    const netPnl = currentEquity - backtestParams.initialCapital;
    const winRate = (winningTrades / totalTrades) * 100;
    const avgWin = winningTrades > 0 ? totalWinAmount / winningTrades : 0;
    const avgLoss = (totalTrades - winningTrades) > 0 ? totalLossAmount / (totalTrades - winningTrades) : 0;
    const profitFactor = avgLoss > 0 ? (totalWinAmount / totalLossAmount) : 0;
    const maxDrawdown = Math.max(...drawdownData.map(d => d.drawdown));
    
    const mockResults = {
      win_rate: winRate,
      profit_factor: profitFactor,
      net_pnl: netPnl,
      max_drawdown: maxDrawdown,
      sharpe_ratio: 0.5 + Math.random() * 1.5,
      total_trades: totalTrades,
      avg_win: avgWin,
      avg_loss: -avgLoss,
      status: 'completed',
      trade_log: trades,
      equity_curve_data: equityCurve,
      drawdown_data: drawdownData,
      bars_processed: Math.floor(totalTrades * 24 * (1 + Math.random())),
      exposure_percentage: 45 + Math.random() * 30,
      avg_holding_time_hours: 12 + Math.random() * 36,
      expectancy: netPnl / totalTrades
    };

    try {
      const { data, error } = await supabase
        .from('backtest_runs')
        .update(mockResults)
        .eq('id', runId)
        .select()
        .single();

      if (error) throw error;

      setCurrentRun(data as BacktestRun);
      setIsRunning(false);
      toast.success("Backtest completed successfully!");
    } catch (error) {
      console.error('Error completing backtest:', error);
      toast.error("Failed to complete backtest");
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Backtesting Workspace
            </h1>
            <p className="text-muted-foreground mt-2">
              Test your trading strategies against historical data
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={profile?.subscription_plan === 'free' ? 'secondary' : 'default'}>
              {profile?.subscription_plan?.toUpperCase() || 'FREE'} Plan
            </Badge>
            {!canRunBacktest && (
              <Button variant="outline" size="sm">
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Parameters */}
          <div className="lg:col-span-1">
            <BacktestParametersPanel
              selectedStrategy={selectedStrategy}
              onStrategyChange={setSelectedStrategy}
              params={backtestParams}
              onParamsChange={setBacktestParams}
              strategies={tradingStrategies.map(s => ({
                id: s.id.toString(),
                name: s.name,
                category: s.category,
                description: s.description
              }))}
            />
          </div>

          {/* Main Area - Results */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={handleRunBacktest}
                      disabled={isRunning || !canRunBacktest}
                      className="flex items-center gap-2"
                    >
                      {isRunning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Run Backtest
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSavePreset}
                      disabled={!user || !selectedStrategy}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preset
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleForwardTest}
                      disabled={!currentRun || !currentRun.trade_log || currentRun.trade_log.length === 0}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Forward Test
                    </Button>
                  </div>

                  {isRunning && (
                    <div className="flex items-center gap-4 min-w-48">
                      <Progress value={progress} className="flex-1" />
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                  )}
                </div>
                
                {!canRunBacktest && (
                  <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm">Upgrade to Pro to run custom backtests</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results Area */}
            {currentRun ? (
              <BacktestResults run={currentRun} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Backtest</h3>
                  <p className="text-muted-foreground mb-6">
                    Configure your strategy parameters and click "Run Backtest" to begin
                  </p>
                  
                  {!canRunBacktest && (
                    <div className="bg-muted p-6 rounded-lg max-w-md mx-auto">
                      <h4 className="font-medium mb-2">Demo Mode</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        You can view sample backtest results in demo mode. Upgrade to Pro to run unlimited custom backtests.
                      </p>
                      <Button size="sm">View Demo Results</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestWorkspace;