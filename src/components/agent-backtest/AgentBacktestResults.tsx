import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Activity, Target, ShieldAlert, X } from 'lucide-react';
import { V2BacktestResult } from '@/adapters/backtesterV2';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

interface AgentBacktestResultsProps {
  result: V2BacktestResult & { verdicts?: any[]; agentScoreSummary?: any };
  onClose: () => void;
}

export const AgentBacktestResults: React.FC<AgentBacktestResultsProps> = ({ result, onClose }) => {
  const isProfit = result.net_pnl >= 0;

  const chartData = (result.equity_curve_data || []).filter(
    (_: any, i: number, arr: any[]) =>
      i % Math.max(1, Math.floor(arr.length / 60)) === 0 || i === arr.length - 1
  );
  const equityValues = chartData.map((d: any) => Number(d?.equity ?? 0)).filter((v: number) => Number.isFinite(v));
  const minEquity = equityValues.length ? Math.min(...equityValues) : 0;
  const maxEquity = equityValues.length ? Math.max(...equityValues) : 0;
  const span = Math.max(maxEquity - minEquity, Math.max(1, minEquity * 0.02));

  const metrics = [
    { label: 'Net P&L', value: `${isProfit ? '+' : ''}${result.net_pnl.toFixed(2)}%`, icon: isProfit ? TrendingUp : TrendingDown, color: isProfit ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Total Trades', value: result.total_trades.toString(), icon: BarChart3, color: 'text-blue-400' },
    { label: 'Sharpe Ratio', value: result.sharpe_ratio.toFixed(2), icon: Activity, color: 'text-purple-400' },
    { label: 'Max Drawdown', value: `${result.max_drawdown.toFixed(2)}%`, icon: ShieldAlert, color: 'text-amber-400' },
    { label: 'Win Rate', value: `${result.win_rate.toFixed(1)}%`, icon: Target, color: 'text-emerald-400' },
    { label: 'Profit Factor', value: result.profit_factor.toFixed(2), icon: BarChart3, color: 'text-blue-400' },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Backtest Results
              <Badge variant="outline" className={`text-xs ${isProfit ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                {isProfit ? '▲ Profitable' : '▼ Loss'}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {result.strategy_name} · {result.from_date} → {result.to_date}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-5">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <span className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* Equity Curve */}
        {result.equity_curve_data && result.equity_curve_data.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Equity Curve</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.equity_curve_data.filter((_: any, i: number) => i % Math.max(1, Math.floor(result.equity_curve_data.length / 60)) === 0 || i === result.equity_curve_data.length - 1)}>
                  <defs>
                    <linearGradient id="agentEquityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isProfit ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isProfit ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" tickFormatter={(v: string) => v?.slice(0, 7)} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity']}
                  />
                  <Area type="monotone" dataKey="equity" stroke={isProfit ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} fill="url(#agentEquityGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trade Log (last 10) */}
        {result.trade_log && result.trade_log.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Recent Trades <span className="text-xs font-normal">({result.trade_log.length} total)</span>
            </h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-center font-medium">Score</th>
                    <th className="px-3 py-2 text-center font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trade_log.slice(0, 10).map((trade: any) => (
                    <tr key={trade.id} className="border-t border-border/50">
                      <td className="px-3 py-2 text-muted-foreground">{trade.entry_time?.slice(0, 10)}</td>
                      <td className="px-3 py-2">
                        <span className={trade.trade_type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>
                          {trade.trade_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{trade.entry_price?.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono">{trade.quantity}</td>
                      <td className="px-3 py-2 text-center font-mono">{trade.compositeScore?.toFixed(0) ?? '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {trade.verdict ? (
                          <Badge variant="outline" className={`text-[10px] ${
                            trade.verdict === 'TAKE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                            trade.verdict === 'WATCH' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                            'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}>
                            {trade.verdict}
                          </Badge>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
