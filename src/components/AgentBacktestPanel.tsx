import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Play, TrendingUp, Shield, Clock, Briefcase, Loader2, AlertTriangle, CheckCircle, Eye, Zap, Settings2 } from 'lucide-react';
import { AgentBacktestAdapter, AgentBacktestParams } from '@/adapters/agentBacktestAdapter';
import { toast } from 'sonner';
import { AgentWeights, DEFAULT_WEIGHTS, DEFAULT_CUTOFFS } from '../../engine/backtester-v2/agents/types';
import { AgentCard } from './agent-backtest/AgentCard';
import { CompositeScoreRing } from './agent-backtest/CompositeScoreRing';
import { VerdictZoneBar } from './agent-backtest/VerdictZoneBar';
import { AgentImpactSimulator } from './agent-backtest/AgentImpactSimulator';

const PRESETS: Record<string, { label: string; weights: AgentWeights; cutoffs: { take: number; watch: number }; description: string }> = {
  balanced: { label: '⚖️ Balanced', weights: { analyst: 25, risk: 25, timing: 25, portfolio: 25 }, cutoffs: { take: 70, watch: 50 }, description: 'Equal weight across all agents' },
  conservative: { label: '🛡️ Conservative', weights: { analyst: 20, risk: 35, timing: 25, portfolio: 20 }, cutoffs: { take: 80, watch: 60 }, description: 'Heavy risk focus, higher thresholds' },
  aggressive: { label: '🔥 Aggressive', weights: { analyst: 35, risk: 15, timing: 25, portfolio: 25 }, cutoffs: { take: 60, watch: 40 }, description: 'Signal-driven, lower thresholds' },
  momentum: { label: '⚡ Momentum', weights: { analyst: 30, risk: 20, timing: 30, portfolio: 20 }, cutoffs: { take: 65, watch: 45 }, description: 'Timing + analyst heavy for trend capture' },
};

const AGENT_META = [
  { key: 'analyst' as const, label: 'Analyst', icon: Brain, color: 'text-blue-500', bgColor: 'bg-blue-500/5', borderColor: 'border-blue-500/20', description: 'Bayesian win-probability & expectancy', factors: ['Win Rate', 'Expectancy R', 'Sample Size'] },
  { key: 'risk' as const, label: 'Risk Manager', icon: Shield, color: 'text-amber-500', bgColor: 'bg-amber-500/5', borderColor: 'border-amber-500/20', description: 'ATR stops, Kelly sizing, R:R validation', factors: ['ATR Stop', 'Kelly %', 'R:R Ratio'] },
  { key: 'timing' as const, label: 'Timing', icon: Clock, color: 'text-purple-500', bgColor: 'bg-purple-500/5', borderColor: 'border-purple-500/20', description: 'Macro events & economic calendar risk', factors: ['FOMC', 'NFP', 'CPI Events'] },
  { key: 'portfolio' as const, label: 'Portfolio', icon: Briefcase, color: 'text-emerald-500', bgColor: 'bg-emerald-500/5', borderColor: 'border-emerald-500/20', description: 'Concentration, directional heat, balance', factors: ['Sector Heat', 'Correlation', 'Max Weight'] },
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
  const [configTab, setConfigTab] = useState('agents');

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    setWeights({ ...preset.weights });
    setTakeCutoff(preset.cutoffs.take);
    setWatchCutoff(preset.cutoffs.watch);
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // Simulated composite for the ring preview
  const simulatedBreakdown = useMemo(() => {
    return AGENT_META.map(({ key, label, color }) => ({
      key, label, color,
      score: weights[key] * 0.72, // simulated 72% fill for preview
      max: weights[key],
    }));
  }, [weights]);

  const simulatedComposite = useMemo(() => {
    return simulatedBreakdown.reduce((a, b) => a + b.score, 0);
  }, [simulatedBreakdown]);

  const handleRun = async () => {
    const symbolList = symbols.split(',').map((s) => s.trim()).filter(Boolean);
    if (symbolList.length === 0) { toast.error('Add at least one symbol'); return; }

    setIsRunning(true);
    try {
      const adapter = new AgentBacktestAdapter();
      const params: AgentBacktestParams = {
        symbols: symbolList, fromDate, toDate, initialCapital, commission, slippage,
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
      {/* Hero Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Multi-Agent Portfolio Engine</h2>
          <p className="text-sm text-muted-foreground">4 autonomous agents score every trade opportunity. Adjust their influence in real-time.</p>
        </div>
      </div>

      {/* Main Layout: Agents + Score Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Agent Cards (2x2 grid) */}
        <div className="lg:col-span-2">
          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Button key={key} variant="outline" size="sm" onClick={() => applyPreset(key)} className="text-xs">
                {preset.label}
              </Button>
            ))}
            {totalWeight !== 100 && (
              <Badge variant="destructive" className="text-xs ml-auto">
                Weights: {totalWeight}/100
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENT_META.map((agent) => (
              <AgentCard
                key={agent.key}
                agentKey={agent.key}
                label={agent.label}
                icon={agent.icon}
                color={agent.color}
                bgColor={agent.bgColor}
                borderColor={agent.borderColor}
                weight={weights[agent.key]}
                onWeightChange={(v) => setWeights((prev) => ({ ...prev, [agent.key]: v }))}
                description={agent.description}
                factors={agent.factors}
                liveScore={results?.agentScoreSummary ? weights[agent.key] * 0.72 : undefined}
              />
            ))}
          </div>
        </div>

        {/* Right: Composite Score Ring */}
        <div className="flex flex-col items-center justify-center">
          <Card className="border-border bg-card w-full">
            <CardContent className="pt-6 flex flex-col items-center">
              <CompositeScoreRing
                score={Math.round(simulatedComposite)}
                takeCutoff={takeCutoff}
                watchCutoff={watchCutoff}
                agentBreakdown={simulatedBreakdown}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Verdict Zone Bar */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <VerdictZoneBar
            takeCutoff={takeCutoff}
            watchCutoff={watchCutoff}
            onTakeChange={setTakeCutoff}
            onWatchChange={setWatchCutoff}
            currentScore={Math.round(simulatedComposite)}
          />
        </CardContent>
      </Card>

      {/* Live Scenario Simulator */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <AgentImpactSimulator weights={weights} takeCutoff={takeCutoff} watchCutoff={watchCutoff} />
        </CardContent>
      </Card>

      {/* Backtest Configuration */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Backtest Parameters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Symbols</label>
              <Input value={symbols} onChange={(e) => setSymbols(e.target.value)} placeholder="AAPL, MSFT, GOOGL" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Capital ($)</label>
              <Input type="number" value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} className="text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Commission (%)</label>
              <Input type="number" step="0.01" value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Slippage (%)</label>
              <Input type="number" step="0.01" value={slippage} onChange={(e) => setSlippage(Number(e.target.value))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Re-evaluate (days)</label>
              <Input type="number" value={rebalanceDays} onChange={(e) => setRebalanceDays(Number(e.target.value))} min={1} className="text-sm" />
            </div>
          </div>

          <Button onClick={handleRun} disabled={isRunning || totalWeight !== 100} className="w-full" size="lg">
            {isRunning ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running Agent Backtest...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" />Run Multi-Agent Backtest</>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard label="Net P&L" value={`${results.net_pnl > 0 ? '+' : ''}${results.net_pnl.toFixed(2)}%`} positive={results.net_pnl > 0} />
                  <MetricCard label="Sharpe" value={results.sharpe_ratio.toFixed(2)} positive={results.sharpe_ratio > 1} />
                  <MetricCard label="Max DD" value={`${results.max_drawdown.toFixed(2)}%`} positive={false} />
                  <MetricCard label="Trades" value={String(results.total_trades)} />
                </div>
                {results.agentScoreSummary && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Decision Summary</h4>
                    <div className="flex items-center gap-6 text-sm flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Avg Score:</span>
                        <span className="font-mono font-medium">{results.agentScoreSummary.avgComposite}</span>
                      </div>
                      <Badge className={VERDICT_COLORS.TAKE}><CheckCircle className="h-3 w-3 mr-1" /> TAKE: {results.agentScoreSummary.takeCount}</Badge>
                      <Badge className={VERDICT_COLORS.WATCH}><Eye className="h-3 w-3 mr-1" /> WATCH: {results.agentScoreSummary.watchCount}</Badge>
                      <Badge className={VERDICT_COLORS.SKIP}><AlertTriangle className="h-3 w-3 mr-1" /> SKIP: {results.agentScoreSummary.skipCount}</Badge>
                    </div>
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
                        <th className="pb-2">Date</th><th className="pb-2">Type</th><th className="pb-2">Price</th>
                        <th className="pb-2">Qty</th><th className="pb-2">Score</th><th className="pb-2">Verdict</th>
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
                          <td>{t.verdict && <Badge className={`${VERDICT_COLORS[t.verdict]} text-xs`}>{t.verdict}</Badge>}</td>
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
