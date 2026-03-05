import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Shield, Clock, Briefcase, Loader2, Zap, Settings2 } from 'lucide-react';
import { AgentBacktestAdapter, AgentBacktestParams } from '@/adapters/agentBacktestAdapter';
import { toast } from 'sonner';
import { AgentWeights, DEFAULT_WEIGHTS, DEFAULT_CUTOFFS } from '../../engine/backtester-v2/agents/types';
import { Slider } from '@/components/ui/slider';
import { TradeOpportunityTable } from './agent-backtest/TradeOpportunityTable';
import { AgentGauges } from './agent-backtest/AgentGauges';
import { VerdictZoneBar } from './agent-backtest/VerdictZoneBar';

const PRESETS: Record<string, { label: string; weights: AgentWeights; cutoffs: { take: number; watch: number } }> = {
  balanced: { label: '⚖️ Balanced', weights: { analyst: 25, risk: 25, timing: 25, portfolio: 25 }, cutoffs: { take: 70, watch: 50 } },
  conservative: { label: '🛡️ Conservative', weights: { analyst: 20, risk: 35, timing: 25, portfolio: 20 }, cutoffs: { take: 80, watch: 60 } },
  aggressive: { label: '🔥 Aggressive', weights: { analyst: 35, risk: 15, timing: 25, portfolio: 25 }, cutoffs: { take: 60, watch: 40 } },
  momentum: { label: '⚡ Momentum', weights: { analyst: 30, risk: 20, timing: 30, portfolio: 20 }, cutoffs: { take: 65, watch: 45 } },
};

const AGENTS = [
  { key: 'analyst' as const, label: 'Analyst', icon: Brain, color: 'text-blue-400', barColor: 'bg-blue-500' },
  { key: 'risk' as const, label: 'Risk Mgr', icon: Shield, color: 'text-amber-400', barColor: 'bg-amber-500' },
  { key: 'timing' as const, label: 'Timing', icon: Clock, color: 'text-purple-400', barColor: 'bg-purple-500' },
  { key: 'portfolio' as const, label: 'Portfolio', icon: Briefcase, color: 'text-emerald-400', barColor: 'bg-emerald-500' },
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

export const AgentBacktestPanel: React.FC = () => {
  const [weights, setWeights] = useState<AgentWeights>({ ...DEFAULT_WEIGHTS });
  const [takeCutoff, setTakeCutoff] = useState(DEFAULT_CUTOFFS.take);
  const [watchCutoff, setWatchCutoff] = useState(DEFAULT_CUTOFFS.watch);

  const [symbols, setSymbols] = useState('AAPL, MSFT, GOOGL');
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState('2025-01-01');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [isRunning, setIsRunning] = useState(false);

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
      toast.success(`Agent backtest complete — ${result.total_trades} trades`);
    } catch (err: any) {
      toast.error(err.message || 'Agent backtest failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Multi-Agent Trade Filter</h2>
            <p className="text-xs text-muted-foreground">Adjust agent weights to dynamically filter trade opportunities</p>
          </div>
        </div>
        {totalWeight !== 100 && (
          <Badge variant="destructive" className="text-xs">Weights: {totalWeight}/100</Badge>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* LEFT SIDEBAR: Agent Controls */}
        <div className="space-y-3">
          {/* Presets */}
          <Card className="border-border bg-card">
            <CardContent className="p-3 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Quick Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <Button key={key} variant="outline" size="sm" onClick={() => applyPreset(key)} className="text-[11px] h-7">
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Sliders */}
          <Card className="border-border bg-card">
            <CardContent className="p-3 space-y-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Agent Weights</span>
              {AGENTS.map(({ key, label, icon: Icon, color, barColor }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className="text-xs font-medium text-foreground">{label}</span>
                    </div>
                    <span className={`text-sm font-mono font-bold ${color}`}>{weights[key]}</span>
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
            <CardContent className="p-3">
              <VerdictZoneBar
                takeCutoff={takeCutoff}
                watchCutoff={watchCutoff}
                onTakeChange={setTakeCutoff}
                onWatchChange={setWatchCutoff}
              />
            </CardContent>
          </Card>

          {/* Backtest Config (collapsed) */}
          <Card className="border-border bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Settings2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Backtest</span>
              </div>
              <Input value={symbols} onChange={(e) => setSymbols(e.target.value)} placeholder="Symbols" className="text-xs h-7" />
              <div className="grid grid-cols-2 gap-1.5">
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-xs h-7" />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-xs h-7" />
              </div>
              <Button onClick={handleRun} disabled={isRunning || totalWeight !== 100} className="w-full h-8 text-xs" size="sm">
                {isRunning ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running...</> : <><Zap className="h-3 w-3 mr-1" />Run Backtest</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Dashboard Content */}
        <div className="space-y-4">
          {/* Gauges Row */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
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
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                Trade Opportunities
                <span className="text-[10px] font-normal text-muted-foreground">— scores update live as you adjust agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <TradeOpportunityTable
                weights={weights}
                takeCutoff={takeCutoff}
                watchCutoff={watchCutoff}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
