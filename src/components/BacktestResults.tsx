import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Target, 
  BarChart3,
  Download,
  AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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
}

interface BacktestResultsProps {
  run: BacktestRun;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ run }) => {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
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
              <span><strong>Engine:</strong> v1.0</span>
            </div>
            <Badge variant="secondary">
              {run.status === 'completed' ? 'Completed' : 'Processing'}
            </Badge>
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
          
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p>Trade history will be displayed here once the backtest completes.</p>
            </CardContent>
          </Card>
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