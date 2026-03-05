import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Shield, Clock, Briefcase, Loader2, Zap, Settings2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentWeightsFAQ } from './agent-backtest/AgentWeightsFAQ';
import { AgentBacktestAdapter, AgentBacktestParams } from '@/adapters/agentBacktestAdapter';
import { toast } from 'sonner';
import { AgentWeights, DEFAULT_WEIGHTS, DEFAULT_CUTOFFS } from '../../engine/backtester-v2/agents/types';
import { Slider } from '@/components/ui/slider';
import { TradeOpportunityTable, AssetClassFilter, TradeSetup } from './agent-backtest/TradeOpportunityTable';
import { AgentGauges } from './agent-backtest/AgentGauges';
import { VerdictZoneBar } from './agent-backtest/VerdictZoneBar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AgentBacktestResults } from './agent-backtest/AgentBacktestResults';
import { V2BacktestResult } from '@/adapters/backtesterV2';

const PRESETS: Record<string, { label: string; weights: AgentWeights; cutoffs: { take: number; watch: number } }> = {
  balanced: { label: '⚖️ Balanced', weights: { analyst: 25, risk: 25, timing: 25, portfolio: 25 }, cutoffs: { take: 70, watch: 50 } },
  conservative: { label: '🛡️ Conservative', weights: { analyst: 20, risk: 35, timing: 25, portfolio: 20 }, cutoffs: { take: 80, watch: 60 } },
  aggressive: { label: '🔥 Aggressive', weights: { analyst: 35, risk: 15, timing: 25, portfolio: 25 }, cutoffs: { take: 60, watch: 40 } },
  momentum: { label: '⚡ Momentum', weights: { analyst: 30, risk: 20, timing: 30, portfolio: 20 }, cutoffs: { take: 65, watch: 45 } },
};

const AGENTS = [
  { key: 'analyst' as const, label: 'Analyst', icon: Brain, color: 'text-blue-400', barColor: 'bg-blue-500', tooltip: 'Bayesian win-probability & historical hit-rates for the detected pattern. Higher weight → prioritize setups with strong statistical edge.' },
  { key: 'risk' as const, label: 'Risk Mgr', icon: Shield, color: 'text-amber-400', barColor: 'bg-amber-500', tooltip: 'ATR-based stop placement, Kelly sizing & risk/reward quality. Higher weight → prioritize tight risk control with well-defined stops.' },
  { key: 'timing' as const, label: 'Timing', icon: Clock, color: 'text-purple-400', barColor: 'bg-purple-500', tooltip: 'Macro/economic calendar proximity & market-session context. Higher weight → avoid entries near high-impact news or illiquid sessions.' },
  { key: 'portfolio' as const, label: 'Portfolio', icon: Briefcase, color: 'text-emerald-400', barColor: 'bg-emerald-500', tooltip: 'Concentration risk, sector heat & directional exposure. Higher weight → penalize trades that over-concentrate in one asset or direction.' },
];

// Simulated trade data for gauge calculations
const MOCK_RAW_SCORES = [
  { analyst: 0.92, risk: 0.88, timing: 0.75, portfolio: 0.80 },
  { analyst: 0.85, risk: 0.72, timing: 0.80, portfolio: 0.65 },
  { analyst: 0.60, risk: 0.45, timing: 0.55, portfolio: 0.70 },
  { analyst: 0.95, risk: 0.82, timing: 0.60, portfolio: 0.40 },
  { analyst: 0.78, risk: 0.90, timing: 0.85, portfolio: 0.75 },
  { analyst: 0.72, risk: 0.68, timing: 0.40, portfolio: 0.85 },
  { analyst: 0.55, risk: 0.50, timing: 0.30, portfolio: 0.60 },
  { analyst: 0.88, risk: 0.75, timing: 0.70, portfolio: 0.55 },
  { analyst: 0.82, risk: 0.92, timing: 0.65, portfolio: 0.90 },
  { analyst: 0.70, risk: 0.55, timing: 0.15, portfolio: 0.50 },
  { analyst: 0.65, risk: 0.60, timing: 0.45, portfolio: 0.35 },
  { analyst: 0.48, risk: 0.40, timing: 0.20, portfolio: 0.55 },
];

export const AgentBacktestPanel: React.FC<{ onSendToBacktest?: (setup: TradeSetup) => void; onReset?: () => void }> = ({ onSendToBacktest, onReset }) => {
  const [weights, setWeights] = useState<AgentWeights>({ ...DEFAULT_WEIGHTS });
  const [takeCutoff, setTakeCutoff] = useState(DEFAULT_CUTOFFS.take);
  const [watchCutoff, setWatchCutoff] = useState(DEFAULT_CUTOFFS.watch);

  const [symbols, setSymbols] = useState('AAPL, MSFT, GOOGL');
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState('2025-01-01');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [assetClassFilter, setAssetClassFilter] = useState<AssetClassFilter>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [basketSymbols, setBasketSymbols] = useState<string[]>([]);
  const [backtestResult, setBacktestResult] = useState<(V2BacktestResult & { verdicts?: any[]; agentScoreSummary?: any }) | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const toggleBasket = (symbol: string) => {
    setBasketSymbols((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      setSymbols(next.join(', '));
      return next;
    });
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    setWeights({ ...p.weights });
    setTakeCutoff(p.cutoffs.take);
    setWatchCutoff(p.cutoffs.watch);
  };

  // Compute gauge stats dynamically
  const gaugeStats = useMemo(() => {
    const composites = MOCK_RAW_SCORES.map((r) =>
      r.analyst * weights.analyst + r.risk * weights.risk + r.timing * weights.timing + r.portfolio * weights.portfolio
    );
    const total = composites.length;
    const takes = composites.filter((c) => c >= takeCutoff).length;
    const watches = composites.filter((c) => c >= watchCutoff && c < takeCutoff).length;
    const skips = composites.filter((c) => c < watchCutoff).length;
    const avg = composites.reduce((a, b) => a + b, 0) / total;
    return {
      takeRate: (takes / total) * 100,
      watchRate: (watches / total) * 100,
      skipRate: (skips / total) * 100,
      avgScore: avg,
    };
  }, [weights, takeCutoff, watchCutoff]);

  const handleRun = async () => {
    const symbolList = symbols.split(',').map((s) => s.trim()).filter(Boolean);
    if (symbolList.length === 0) { toast.error('Add at least one symbol'); return; }
    setIsRunning(true);
    try {
      const adapter = new AgentBacktestAdapter();
      const params: AgentBacktestParams = {
        symbols: symbolList, fromDate, toDate, initialCapital,
        commission: 0.1, slippage: 0.05,
        agentWeights: weights,
        verdictCutoffs: { take: takeCutoff, watch: watchCutoff },
        rebalanceFrequencyDays: 1,
      };
      const result = await adapter.runAgentBacktest(params);
      setBacktestResult(result);
      toast.success(`Agent backtest complete — ${result.total_trades} trades`);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      toast.error(err.message || 'Agent backtest failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Agent Scoring</h2>
            <p className="text-sm text-muted-foreground">Adjust agent weights to dynamically score and filter trade opportunities</p>
          </div>
        </div>
        {totalWeight !== 100 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">Weights: {totalWeight}/100</Badge>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* LEFT SIDEBAR: Agent Controls */}
        <div className="space-y-4">
          {/* Presets */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Quick Presets</span>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
                      <p className="font-medium mb-1">Agent Weight Presets</p>
                      <p>Each preset adjusts how the 4 AI agents (Analyst, Risk, Timing, Portfolio) are weighted when scoring trades.</p>
                      <ul className="mt-1.5 space-y-1 list-disc pl-3">
                        <li><strong>Balanced</strong> — Equal weight across all agents (25% each)</li>
                        <li><strong>Conservative</strong> — Emphasizes Risk Manager (35%), requires higher score to TAKE</li>
                        <li><strong>Aggressive</strong> — Emphasizes Analyst (35%), lower threshold to TAKE</li>
                        <li><strong>Momentum</strong> — Boosts Analyst + Timing agents for trend-following setups</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <Button key={key} variant="outline" size="sm" onClick={() => applyPreset(key)} className="text-sm h-9">
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Asset Class Filter */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Asset Class</span>
              <ToggleGroup
                type="single"
                value={assetClassFilter}
                onValueChange={(v) => v && setAssetClassFilter(v as AssetClassFilter)}
                className="flex flex-wrap gap-1.5"
              >
                {[
                  { value: 'all', label: 'All' },
                  { value: 'stocks', label: 'Stocks' },
                  { value: 'crypto', label: 'Crypto' },
                  { value: 'forex', label: 'Forex' },
                  { value: 'commodities', label: 'Cmdty' },
                ].map((ac) => (
                  <ToggleGroupItem key={ac.value} value={ac.value} size="sm" className="text-sm h-9 px-3.5">
                    {ac.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </CardContent>
          </Card>
          {/* Agent Sliders */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Agent Weights</span>
                <AgentWeightsFAQ
                  trigger={
                    <button className="inline-flex items-center">
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                    </button>
                  }
                />
              </div>
              {AGENTS.map(({ key, label, icon: Icon, color, barColor, tooltip }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[240px] text-xs">
                            {tooltip}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className={`text-base font-mono font-bold ${color}`}>{weights[key]}</span>
                  </div>
                  <Slider
                    value={[weights[key]]}
                    onValueChange={([v]) => setWeights((prev) => ({ ...prev, [key]: v }))}
                    min={0}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Verdict Thresholds */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <VerdictZoneBar
                takeCutoff={takeCutoff}
                watchCutoff={watchCutoff}
                onTakeChange={setTakeCutoff}
                onWatchChange={setWatchCutoff}
              />
            </CardContent>
          </Card>

          {/* Backtest Config */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Backtest Basket</span>
                </div>
                {basketSymbols.length > 0 && (
                  <button
                    onClick={() => { setBasketSymbols([]); setSymbols(''); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {basketSymbols.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {basketSymbols.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                      onClick={() => toggleBasket(s)}
                    >
                      {s} ✕
                    </Badge>
                  ))}
                </div>
              )}
              <Input value={symbols} onChange={(e) => setSymbols(e.target.value)} placeholder="Add symbols or pick from table +" className="text-sm h-9" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-sm h-9" />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-sm h-9" />
              </div>
              <Button onClick={handleRun} disabled={isRunning || totalWeight !== 100} className="w-full h-10 text-sm" size="default">
                {isRunning ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Running...</> : <><Zap className="h-4 w-4 mr-1.5" />Run Backtest</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Dashboard Content */}
        <div className="space-y-6">
          {/* Gauges Row */}
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <AgentGauges
                takeRate={gaugeStats.takeRate}
                watchRate={gaugeStats.watchRate}
                skipRate={gaugeStats.skipRate}
                avgScore={gaugeStats.avgScore}
              />
            </CardContent>
          </Card>

          {/* Trade Opportunity Table */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-base flex items-center gap-2">
                Trade Opportunities
                <span className="text-xs font-normal text-muted-foreground">— scores update live as you adjust agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <TradeOpportunityTable
                weights={weights}
                takeCutoff={takeCutoff}
                watchCutoff={watchCutoff}
                assetClassFilter={assetClassFilter}
                onSendToBacktest={onSendToBacktest}
                basketSymbols={basketSymbols}
                onToggleBasket={toggleBasket}
              />
            </CardContent>
          </Card>

          {/* Backtest Results */}
          {backtestResult && (
            <div ref={resultsRef}>
              <AgentBacktestResults
                result={backtestResult}
                onClose={() => setBacktestResult(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
