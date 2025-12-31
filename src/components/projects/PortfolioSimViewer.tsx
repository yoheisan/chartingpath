import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PiggyBank
} from 'lucide-react';

interface EquityPoint {
  date: string;
  value: number;
  drawdown: number;
  weights: Record<string, number>;
}

interface PortfolioSimArtifact {
  projectType: 'portfolio_sim';
  timeframe: string;
  lookbackYears: number;
  generatedAt: string;
  config: {
    initialValue: number;
    rebalanceFrequency: string;
    dcaAmount: number;
    dcaFrequency: string;
    holdings: { symbol: string; weight: number }[];
  };
  summary: {
    finalValue: number;
    totalReturn: number;
    cagr: number;
    maxDrawdown: number;
    totalContributions: number;
    sharpeRatio: number;
  };
  comparison: {
    withRebalancing: any;
    buyAndHold: any;
    rebalancingBenefit: number;
  };
  equity: EquityPoint[];
}

interface PortfolioSimViewerProps {
  artifact: PortfolioSimArtifact;
  runId: string;
}

const PortfolioSimViewer = ({ artifact, runId }: PortfolioSimViewerProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  
  const equityData = artifact.equity.map(e => ({
    ...e,
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    drawdownPct: e.drawdown * -100,
  }));
  
  const isPositiveReturn = artifact.summary.totalReturn >= 0;
  const rebalancingHelped = artifact.comparison.rebalancingBenefit > 0;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold">{formatCurrency(artifact.summary.finalValue)}</div>
            </div>
            <p className="text-sm text-muted-foreground">Final Value</p>
          </CardContent>
        </Card>
        
        <Card className={`border-border/50 ${isPositiveReturn ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {isPositiveReturn ? (
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              )}
              <div className={`text-2xl font-bold ${isPositiveReturn ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(artifact.summary.totalReturn)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Total Return</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              <div className="text-2xl font-bold">{formatPercent(artifact.summary.cagr)}</div>
            </div>
            <p className="text-sm text-muted-foreground">CAGR</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              <div className="text-2xl font-bold text-red-500">{formatPercent(artifact.summary.maxDrawdown)}</div>
            </div>
            <p className="text-sm text-muted-foreground">Max Drawdown</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Simulation Config Summary */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Simulation Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4 text-sm">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Initial</div>
                <div className="font-medium">{formatCurrency(artifact.config.initialValue)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Rebalance</div>
                <div className="font-medium capitalize">{artifact.config.rebalanceFrequency}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">DCA/Month</div>
                <div className="font-medium">{artifact.config.dcaAmount > 0 ? formatCurrency(artifact.config.dcaAmount) : 'None'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Sharpe</div>
                <div className="font-medium">{artifact.summary.sharpeRatio.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {artifact.config.holdings.map(h => (
                <Badge key={h.symbol} variant="secondary">
                  {h.symbol}: {(h.weight * 100).toFixed(0)}%
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rebalancing Comparison */}
      <Card className={`border-border/50 ${rebalancingHelped ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className={`h-5 w-5 ${rebalancingHelped ? 'text-green-500' : 'text-amber-500'}`} />
            Rebalancing Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">With Rebalancing</div>
              <div className="text-xl font-bold">{formatPercent(artifact.comparison.withRebalancing.totalReturn)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Buy & Hold</div>
              <div className="text-xl font-bold">{formatPercent(artifact.comparison.buyAndHold.totalReturn)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Rebalancing Benefit</div>
              <div className={`text-xl font-bold ${rebalancingHelped ? 'text-green-500' : 'text-red-500'}`}>
                {rebalancingHelped ? '+' : ''}{formatPercent(artifact.comparison.rebalancingBenefit)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Equity Curve */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Portfolio Value Over Time</CardTitle>
          <CardDescription>
            {artifact.lookbackYears} year simulation • Total contributed: {formatCurrency(artifact.summary.totalContributions)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Drawdown Chart */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Drawdown</CardTitle>
          <CardDescription>Portfolio decline from peak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  domain={['auto', 0]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Drawdown']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <defs>
                  <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="drawdownPct" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  fill="url(#colorDrawdown)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioSimViewer;
