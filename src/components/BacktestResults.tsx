import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Target, 
  BarChart3,
  Download,
  AlertCircle,
  Save,
  Heart
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GuidedStrategyAnswers } from "./GuidedStrategyBuilder";

interface BacktestRun {
  id: string;
  strategy_name: string;
  instrument: string;
  timeframe: string;
  from_date: string;
  to_date: string;
  status: string;
  win_rate?: number;
  profit_factor?: number;
  net_pnl?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  total_trades?: number;
  avg_win?: number;
  avg_loss?: number;
  created_at: string;
  initial_capital?: number;
  trade_log?: any[];
  equity_curve_data?: any[];
  drawdown_data?: any[];
  engine_version?: string;
}

interface BacktestResultsProps {
  run: BacktestRun;
  strategyAnswers?: GuidedStrategyAnswers;
  onStrategySaved?: () => void;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ run, strategyAnswers, onStrategySaved }) => {
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [strategyName, setStrategyName] = React.useState('');
  const [strategyDescription, setStrategyDescription] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  // Mock equity curve data
  const equityCurveData = React.useMemo(() => {
    const data = [];
    let equity = run.initial_capital || 10000;
    const totalDays = 100;
    
    for (let i = 0; i <= totalDays; i++) {
      const randomReturn = (Math.random() - 0.45) * 0.02; // Slight positive bias
      equity = equity * (1 + randomReturn);
      data.push({
        date: `Day ${i}`,
        equity: equity,
        drawdown: Math.max(0, (equity / (run.initial_capital || 10000) - 1) * 100)
      });
    }
    return data;
  }, [run.id]);

  // Cumulative capital gains/loss data from actual trades
  const cumulativeGainsData = React.useMemo(() => {
    if (!run.trade_log || run.trade_log.length === 0) {
      return [];
    }

    const data = [];
    let cumulativePnL = 0;
    const initialCapital = run.initial_capital || 10000;

    // Add starting point
    data.push({
      tradeNumber: 0,
      cumulativePnL: 0,
      equity: initialCapital,
      gainPercentage: 0
    });

    // Calculate cumulative values for each trade
    run.trade_log.forEach((trade: any, index: number) => {
      cumulativePnL += trade.pnl;
      const currentEquity = initialCapital + cumulativePnL;
      const gainPercentage = (cumulativePnL / initialCapital) * 100;

      data.push({
        tradeNumber: index + 1,
        cumulativePnL,
        equity: currentEquity,
        gainPercentage
      });
    });

    return data;
  }, [run.trade_log, run.initial_capital]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Generate default strategy name
  const generateDefaultStrategyName = () => {
    return `${run.strategy_name} - ${new Date().toLocaleDateString()}`;
  };

  // Generate default description
  const generateDefaultDescription = () => {
    const winRateText = run.win_rate ? `${run.win_rate}% win rate` : 'Unknown win rate';
    const pnlText = run.net_pnl ? `${run.net_pnl > 0 ? '+' : ''}${run.net_pnl.toFixed(2)}% return` : 'Unknown return';
    return `Backtested strategy on ${run.instrument} (${run.timeframe}) with ${winRateText} and ${pnlText}. Tested from ${run.from_date} to ${run.to_date}.`;
  };

  // Initialize dialog with defaults
  React.useEffect(() => {
    if (showSaveDialog) {
      setStrategyName(generateDefaultStrategyName());
      setStrategyDescription(generateDefaultDescription());
    }
  }, [showSaveDialog, run]);

  // Handle save strategy
  const handleSaveStrategy = async () => {
    if (!strategyName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }

    setIsSaving(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Please log in to save strategies');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('guided_strategies')
        .insert({
          name: strategyName.trim(),
          description: strategyDescription.trim() || generateDefaultDescription(),
          answers: JSON.stringify(strategyAnswers) as any,
          backtest_results: run as any,
          user_id: user.user.id
        });

      if (error) throw error;

      toast.success('Strategy saved successfully to My Strategies!');
      setShowSaveDialog(false);
      setStrategyName('');
      setStrategyDescription('');
      onStrategySaved?.();
    } catch (error) {
      console.error('Error saving strategy:', error);
      const msg = (error as any)?.message || 'Failed to save strategy';
      toast.error(`Failed to save strategy: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span><strong>Instrument:</strong> {run.instrument}</span>
              <span><strong>Timeframe:</strong> {run.timeframe}</span>
              <span><strong>Period:</strong> {run.from_date} to {run.to_date}</span>
              <span><strong>Engine:</strong> {run.engine_version || 'v1.0'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {run.status === 'completed' ? 'Completed' : 'Processing'}
              </Badge>
              {/* Save Strategy Button - always available for logged-in users */}
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Heart className="h-3 w-3 mr-1" />
                    Save Strategy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Strategy to My Strategies</DialogTitle>
                    <DialogDescription>
                      Name and describe this strategy to save it in your personal vault. You can edit details later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="strategy-name">Strategy Name</Label>
                      <Input
                        id="strategy-name"
                        value={strategyName}
                        onChange={(e) => setStrategyName(e.target.value)}
                        placeholder="Enter a name for your strategy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="strategy-description">Description (Optional)</Label>
                      <Textarea
                        id="strategy-description"
                        value={strategyDescription}
                        onChange={(e) => setStrategyDescription(e.target.value)}
                        placeholder="Describe your strategy and results..."
                        rows={3}
                      />
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <h4 className="font-medium mb-2">Strategy Performance</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>Win Rate: <span className="font-medium">{run.win_rate ? `${run.win_rate}%` : 'N/A'}</span></div>
                        <div>Net Return: <span className="font-medium">{run.net_pnl ? `${run.net_pnl.toFixed(2)}%` : 'N/A'}</span></div>
                        <div>Max Drawdown: <span className="font-medium">{run.max_drawdown ? `${run.max_drawdown}%` : 'N/A'}</span></div>
                        <div>Total Trades: <span className="font-medium">{run.total_trades || 0}</span></div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveStrategy} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-background border-t-transparent mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-2" />
                          Save Strategy
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Results Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="compare" disabled>
            Compare <Badge variant="outline" className="ml-1">Pro</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold">
                      {run.win_rate ? formatPercentage(run.win_rate) : 'N/A'}
                    </p>
                  </div>
                  <Percent className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net P&L</p>
                    <p className={`text-2xl font-bold ${
                      (run.net_pnl || 0) >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {run.net_pnl ? formatCurrency(run.net_pnl) : 'N/A'}
                    </p>
                  </div>
                  {(run.net_pnl || 0) >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-success" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-destructive" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className="text-2xl font-bold text-destructive">
                      {run.max_drawdown ? formatPercentage(run.max_drawdown) : 'N/A'}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold">
                      {run.total_trades || 0}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Cumulative Capital Gains/Loss Chart - Primary Chart */}
            {cumulativeGainsData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>CUMULATIVE CAPITAL GAINS / LOSS</span>
                    <Badge variant="outline" className="uppercase text-xs tracking-wider">
                      Actual Trades
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={cumulativeGainsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="tradeNumber" 
                        label={{ value: 'Trade Number', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        label={{ value: 'Cumulative P&L ($)', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        label={{ value: 'Gain (%)', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-bold mb-2">Trade #{data.tradeNumber}</p>
                                <p className={`text-sm ${data.cumulativePnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  Cumulative P&L: {formatCurrency(data.cumulativePnL)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Current Equity: {formatCurrency(data.equity)}
                                </p>
                                <p className={`text-sm ${data.gainPercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  Total Gain: {data.gainPercentage.toFixed(2)}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="cumulativePnL" 
                        stroke="hsl(var(--foreground))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--foreground))', r: 3 }}
                        name="Cumulative P&L"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="gainPercentage" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Gain %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Equity Curve</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={equityCurveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Line 
                        type="monotone" 
                        dataKey="equity" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Drawdown Curve</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={equityCurveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${(value as number).toFixed(2)}%`} />
                      <Line 
                        type="monotone" 
                        dataKey="drawdown" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Profit Factor:</span>
                  <span className="ml-2 font-medium">
                    {run.profit_factor ? run.profit_factor.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sharpe Ratio:</span>
                  <span className="ml-2 font-medium">
                    {run.sharpe_ratio ? run.sharpe_ratio.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Win:</span>
                  <span className="ml-2 font-medium">
                    {run.avg_win ? formatCurrency(run.avg_win) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Loss:</span>
                  <span className="ml-2 font-medium">
                    {run.avg_loss ? formatCurrency(run.avg_loss) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Important Disclaimer</p>
                  <p className="text-muted-foreground">
                    Backtested results are hypothetical and do not guarantee future performance. 
                    Actual results may vary significantly. This is not financial advice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Trade History</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          {run.trade_log && run.trade_log.length > 0 ? (
            <>
              {/* Trade P&L Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Trade Profit & Loss Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={run.trade_log.slice(0, 50).map((trade: any, index: number) => ({
                      trade: `T${index + 1}`,
                      pnl: trade.pnl,
                      isWin: trade.pnl >= 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trade" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), 'P&L']}
                        labelFormatter={(label) => `Trade ${label}`}
                      />
                      <Bar dataKey="pnl">
                        {run.trade_log.slice(0, 50).map((trade: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={trade.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Enhanced Trade Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">Trade #</th>
                          <th className="text-left p-3 font-medium">Entry Time</th>
                          <th className="text-left p-3 font-medium">Exit Time</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-right p-3 font-medium">Entry Price</th>
                          <th className="text-right p-3 font-medium">Exit Price</th>
                          <th className="text-right p-3 font-medium">Quantity</th>
                          <th className="text-right p-3 font-medium">Principal</th>
                          <th className="text-right p-3 font-medium">P&L</th>
                          <th className="text-right p-3 font-medium">Win Amount</th>
                          <th className="text-right p-3 font-medium">Running Equity</th>
                          <th className="text-right p-3 font-medium">Drawdown</th>
                          <th className="text-left p-3 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let runningEquity = run.initial_capital || 10000;
                          let peakEquity = runningEquity;
                          
                          return run.trade_log.slice(0, 50).map((trade: any, index: number) => {
                            const principal = Math.abs(trade.quantity * trade.entry_price);
                            const winAmount = trade.pnl > 0 ? trade.pnl : 0;
                            runningEquity += trade.pnl;
                            peakEquity = Math.max(peakEquity, runningEquity);
                            const drawdown = ((peakEquity - runningEquity) / peakEquity) * 100;
                            
                            return (
                              <tr key={trade.id || index} className="border-b hover:bg-muted/25">
                                <td className="p-3 font-medium">#{index + 1}</td>
                                <td className="p-3 text-muted-foreground">
                                  {new Date(trade.entry_time).toLocaleDateString()}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {new Date(trade.exit_time).toLocaleDateString()}
                                </td>
                                <td className="p-3">
                                  <Badge variant={trade.trade_type === 'BUY' ? 'default' : 'secondary'}>
                                    {trade.trade_type}
                                  </Badge>
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {trade.entry_price.toFixed(5)}
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {trade.exit_price.toFixed(5)}
                                </td>
                                <td className="p-3 text-right">
                                  {trade.quantity.toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-medium">
                                  {formatCurrency(principal)}
                                </td>
                                <td className={`p-3 text-right font-medium ${
                                  trade.pnl >= 0 ? 'text-success' : 'text-destructive'
                                }`}>
                                  {formatCurrency(trade.pnl)}
                                </td>
                                <td className="p-3 text-right font-medium text-success">
                                  {winAmount > 0 ? formatCurrency(winAmount) : '-'}
                                </td>
                                <td className="p-3 text-right font-medium">
                                  {formatCurrency(runningEquity)}
                                </td>
                                <td className={`p-3 text-right font-medium ${
                                  drawdown > 5 ? 'text-destructive' : drawdown > 2 ? 'text-warning' : 'text-muted-foreground'
                                }`}>
                                  -{drawdown.toFixed(2)}%
                                </td>
                                <td className="p-3 text-muted-foreground text-xs">
                                  {trade.reason || 'Strategy signal'}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                  
                  {run.trade_log.length > 50 && (
                    <div className="p-4 text-center text-muted-foreground border-t">
                      Showing first 50 of {run.trade_log.length} trades. Export CSV to see all trades.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trade Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Winning Trades</p>
                      <p className="text-2xl font-bold text-success">
                        {run.trade_log.filter((t: any) => t.pnl > 0).length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((run.trade_log.filter((t: any) => t.pnl > 0).length / run.trade_log.length) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Losing Trades</p>
                      <p className="text-2xl font-bold text-destructive">
                        {run.trade_log.filter((t: any) => t.pnl < 0).length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((run.trade_log.filter((t: any) => t.pnl < 0).length / run.trade_log.length) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Largest Win</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(Math.max(...run.trade_log.map((t: any) => t.pnl)))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Best single trade
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>No trade data available. Run a backtest to see trade history.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <h3 className="text-lg font-semibold">Return Distributions</h3>
          
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p>Distribution analysis will be displayed here once the backtest completes.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BacktestResults;