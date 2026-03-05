import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Play, RotateCcw, TrendingUp, TrendingDown, Shield, Clock, Briefcase, Loader2, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { AgentBacktestAdapter, AgentBacktestParams } from '@/adapters/agentBacktestAdapter';
import { toast } from 'sonner';
import { AgentWeights, DEFAULT_WEIGHTS, DEFAULT_CUTOFFS } from '../../engine/backtester-v2/agents/types';

const PRESETS: Record<string, { label: string; weights: AgentWeights; cutoffs: { take: number; watch: number }; description: string }> = {
  balanced: {
    label: 'Balanced',
    weights: { analyst: 25, risk: 25, timing: 25, portfolio: 25 },
    cutoffs: { take: 70, watch: 50 },
    description: 'Equal weight across all agents',
  },
  conservative: {
    label: 'Conservative',
    weights: { analyst: 20, risk: 35, timing: 25, portfolio: 20 },
    cutoffs: { take: 80, watch: 60 },
    description: 'Heavy risk focus, higher thresholds',
  },
  aggressive: {
    label: 'Aggressive',
    weights: { analyst: 35, risk: 15, timing: 25, portfolio: 25 },
    cutoffs: { take: 60, watch: 40 },
    description: 'Signal-driven, lower thresholds',
  },
  momentum: {
    label: 'Momentum',
    weights: { analyst: 30, risk: 20, timing: 30, portfolio: 20 },
    cutoffs: { take: 65, watch: 45 },
    description: 'Timing + analyst heavy for trend capture',
  },
};

const AGENT_META = [
  { key: 'analyst' as const, label: 'Analyst', icon: Brain, color: 'text-blue-500' },
  { key: 'risk' as const, label: 'Risk Manager', icon: Shield, color: 'text-amber-500' },
  { key: 'timing' as const, label: 'Timing', icon: Clock, color: 'text-purple-500' },
  { key: 'portfolio' as const, label: 'Portfolio', icon: Briefcase, color: 'text-emerald-500' },
];

const VERDICT_COLORS: Record<string, string> = {
  TAKE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  WATCH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  SKIP: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const AgentBacktestPanel: React.FC = () => {
  const [symbols, setSymbols] = useState('AAPL, MSFT, GOOGL');
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState('2025-01-01');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [commission, setCommission] = useState(0.1);
  const [slippage, setSlippage] = useState(0.05);
  const [rebalanceDays, setRebalanceDays] = useState(1);

  const [weights, setWeights] = useState<AgentWeights>({ ...DEFAULT_WEIGHTS });
  const [takeCutoff, setTakeCutoff] = useState(DEFAULT_CUTOFFS.take);
  const [watchCutoff, setWatchCutoff] = useState(DEFAULT_CUTOFFS.watch);

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeResultTab, setActiveResultTab] = useState('overview');

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    setWeights({ ...preset.weights });
    setTakeCutoff(preset.cutoffs.take);
    setWatchCutoff(preset.cutoffs.watch);
  };

  const updateWeight = (key: keyof AgentWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleRun = async () => {
    const symbolList = symbols.split(',').map((s) => s.trim()).filter(Boolean);
    if (symbolList.length === 0) {
      toast.error('Add at least one symbol');
      return;
    }

    setIsRunning(true);
    try {
      const adapter = new AgentBacktestAdapter();
      const params: AgentBacktestParams = {
        symbols: symbolList,
        fromDate,
        toDate,
        initialCapital,
        commission,
        slippage,
        agentWeights: weights,
        verdictCutoffs: { take: takeCutoff, watch: watchCutoff },
        rebalanceFrequencyDays: rebalanceDays,
      };

      const result = await adapter.runAgentBacktest(params);
      setResults(result);
      setActiveResultTab('overview');
      toast.success(`Agent backtest complete — ${result.total_trades} trades`);
    } catch (err: any) {
      console.error('Agent backtest failed:', err);
      toast.error(err.message || 'Agent backtest failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Multi-Agent Portfolio Backtest</CardTitle>
          </div>
          <CardDescription>
            Configure a multi-asset backtest powered by 4 autonomous agents: Analyst, Risk, Timing, and Portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Symbols & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Symbols (comma-separated)</label>
              <Input value={symbols} onChange={(e) => setSymbols(e.target.value)} placeholder="AAPL, MSFT, GOOGL" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">From</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">To</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Initial Capital ($)</label>
              <Input type="number" value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Commission (%)</label>
              <Input type="number" step="0.01" value={commission} onChange={(e) => setCommission(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Slippage (%)</label>
              <Input type="number" step="0.01" value={slippage} onChange={(e) => setSlippage(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Re-evaluate every (days)</label>
              <Input type="number" value={rebalanceDays} onChange={(e) => setRebalanceDays(Number(e.target.value))} min={1} />
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Strategy Profile</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <Button key={key} variant="outline" size="sm" onClick={() => applyPreset(key)} className="text-xs">
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Agent Weight Sliders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Agent Weights</label>
              <span className={`text-xs ${totalWeight === 100 ? 'text-muted-foreground' : 'text-destructive font-medium'}`}>
                Total: {totalWeight}/100
              </span>
            </div>
            {AGENT_META.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${color} shrink-0`} />
                <span className="text-sm w-28 shrink-0">{label}</span>
                <Slider
                  value={[weights[key]]}
                  onValueChange={([v]) => updateWeight(key, v)}
                  min={0}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-8 text-right">{weights[key]}</span>
              </div>
            ))}
          </div>

          {/* Verdict Cutoffs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">TAKE threshold (≥)</label>
              <Slider value={[takeCutoff]} onValueChange={([v]) => setTakeCutoff(v)} min={50} max={95} step={1} />
              <span className="text-xs text-muted-foreground mt-1 block">{takeCutoff}</span>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">WATCH threshold (≥)</label>
              <Slider value={[watchCutoff]} onValueChange={([v]) => setWatchCutoff(v)} min={20} max={80} step={1} />
              <span className="text-xs text-muted-foreground mt-1 block">{watchCutoff}</span>
            </div>
          </div>

          {/* Run Button */}
          <Button onClick={handleRun} disabled={isRunning} className="w-full" size="lg">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Agent Backtest...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Multi-Agent Backtest
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Agent Backtest Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="verdicts">Verdicts</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {/* Score Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard label="Net P&L" value={`${results.net_pnl > 0 ? '+' : ''}${results.net_pnl.toFixed(2)}%`} positive={results.net_pnl > 0} />
                  <MetricCard label="Sharpe" value={results.sharpe_ratio.toFixed(2)} positive={results.sharpe_ratio > 1} />
                  <MetricCard label="Max DD" value={`${results.max_drawdown.toFixed(2)}%`} positive={false} />
                  <MetricCard label="Trades" value={String(results.total_trades)} />
                </div>

                {/* Agent Score Summary */}
                {results.agentScoreSummary && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Decision Summary</h4>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Avg Score:</span>
                        <span className="font-mono font-medium">{results.agentScoreSummary.avgComposite}</span>
                      </div>
                      <Badge className={VERDICT_COLORS.TAKE}>
                        <CheckCircle className="h-3 w-3 mr-1" /> TAKE: {results.agentScoreSummary.takeCount}
                      </Badge>
                      <Badge className={VERDICT_COLORS.WATCH}>
                        <Eye className="h-3 w-3 mr-1" /> WATCH: {results.agentScoreSummary.watchCount}
                      </Badge>
                      <Badge className={VERDICT_COLORS.SKIP}>
                        <AlertTriangle className="h-3 w-3 mr-1" /> SKIP: {results.agentScoreSummary.skipCount}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Equity Curve (simple text for now) */}
                {results.equity_curve_data?.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Equity curve: {results.equity_curve_data.length} data points from{' '}
                    {results.equity_curve_data[0]?.date} to {results.equity_curve_data[results.equity_curve_data.length - 1]?.date}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="verdicts">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {results.verdicts?.slice(-50).reverse().map((v: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm border-b border-border pb-2">
                      <span className="text-muted-foreground w-24 shrink-0">{v.date}</span>
                      <span className="font-medium w-16 shrink-0">{v.symbol}</span>
                      <Badge className={`${VERDICT_COLORS[v.verdict]} text-xs`}>{v.verdict}</Badge>
                      <span className="font-mono text-xs">{v.compositeScore}</span>
                      <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                        {AGENT_META.map(({ key, icon: Icon, color }) => (
                          <span key={key} className="flex items-center gap-0.5">
                            <Icon className={`h-3 w-3 ${color}`} />
                            {v.agentScores?.[key]?.score?.toFixed(0)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!results.verdicts || results.verdicts.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No verdicts generated</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="trades">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground text-left border-b border-border">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Score</th>
                        <th className="pb-2">Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.trade_log?.slice(-50).reverse().map((t: any, i: number) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1.5">{t.entry_time}</td>
                          <td className={t.trade_type === 'BUY' ? 'text-emerald-500' : 'text-red-500'}>{t.trade_type}</td>
                          <td className="font-mono">${t.entry_price?.toFixed(2)}</td>
                          <td>{t.quantity}</td>
                          <td className="font-mono">{t.compositeScore?.toFixed(0) ?? '-'}</td>
                          <td>
                            {t.verdict && <Badge className={`${VERDICT_COLORS[t.verdict]} text-xs`}>{t.verdict}</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!results.trade_log || results.trade_log.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No trades executed</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; positive?: boolean }> = ({ label, value, positive }) => (
  <div className="bg-muted/30 rounded-lg p-3 text-center">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className={`text-lg font-mono font-semibold ${positive === true ? 'text-emerald-500' : positive === false ? 'text-red-400' : 'text-foreground'}`}>
      {value}
    </div>
  </div>
);
