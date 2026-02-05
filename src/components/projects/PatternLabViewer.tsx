import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Ban,
  Award,
  BarChart3,
  LineChart,
  ArrowRight,
  Zap,
  Star,
  Bell,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { RRComparisonTable, type RRTierStats } from './RRComparisonTable';
import { ExitComparisonTable, type ExitStrategyStats } from './ExitComparisonTable';
import ExitEquityOverlay, { type ExitEquitySeries } from './ExitEquityOverlay';
import BenchmarkSelector from './BenchmarkSelector';

interface BenchmarkData {
  symbol: string;
  displayName: string;
  data: { date: string; value: number }[];
  color: string;
  returnPercent: number;
}

interface PatternResult {
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  totalTrades: number;
  winRate: number;
  avgRMultiple: number;
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  regimeBreakdown: {
    regimeKey: string;
    n: number;
    winRate: number;
    avgR: number;
    isReliable: boolean;
    recommendation: 'trade' | 'caution' | 'avoid';
  }[];
  doNotTradeRules: string[];
}

interface TradeEntry {
  entryDate: string;
  exitDate: string;
  instrument: string;
  patternId: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  rMultiple: number;
  isWin: boolean;
  regime: string;
  exitReason: 'tp' | 'sl' | 'time_stop';
  rrOutcomes?: {
    rr2: { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate?: string; exitPrice?: number };
    rr3: { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate?: string; exitPrice?: number };
    rr4: { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate?: string; exitPrice?: number };
    rr5: { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate?: string; exitPrice?: number };
  };
}

interface EquityPoint {
  date: string;
  value: number;
  drawdown: number;
}

interface PatternLabArtifact {
  projectType: 'pattern_lab';
  timeframe: string;
  lookbackYears: number;
  generatedAt: string;
  executionAssumptions: {
    bracketLevelsVersion: string;
    priceRounding: { priceDecimals: number; rrDecimals: number };
    maxBarsInTrade?: number;
    fillRule?: string;
  };
  summary: {
    totalPatterns: number;
    totalTrades: number;
    overallWinRate: number;
    overallExpectancy: number;
    overallMaxDrawdown?: number; // Now properly calculated as percentage
    bestPattern: { id: string; name: string; expectancy: number; winRate?: number; totalTrades?: number };
    worstPattern: { id: string; name: string; expectancy: number; winRate?: number; totalTrades?: number };
  };
  patterns: PatternResult[];
  trades: TradeEntry[];
  equity: EquityPoint[];
  /** Multi-RR comparison stats from historical simulations */
  rrComparison?: RRTierStats[];
  optimalTier?: string;
  /** Tier-aware computed stats (preferred when present) */
  patternsByTier?: Record<string, PatternResult[]>;
  equityByTier?: Record<string, EquityPoint[]>;
  maxDrawdownByTier?: Record<string, number>; // percentage (0-100)
  /** Exit Strategy Optimizer data */
  exitComparison?: ExitStrategyStats[];
  optimalExitStrategy?: string;
  exitEquityByStrategy?: Record<string, EquityPoint[]>;
}

interface PatternLabViewerProps {
  artifact: PatternLabArtifact;
  runId: string;
}

const PatternLabViewer = ({ artifact, runId }: PatternLabViewerProps) => {
  const navigate = useNavigate();
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedRRTier, setSelectedRRTier] = useState<number>(2);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);

  const handleBenchmarkChange = useCallback((newBenchmarks: BenchmarkData[]) => {
    setBenchmarks(newBenchmarks);
  }, []);

  const formatPercent = (value: number | undefined | null) => 
    value != null ? `${(value * 100).toFixed(1)}%` : '0.0%';
  const formatR = (value: number | undefined | null) => 
    value != null ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}R` : '+0.00R';

  const tierLabel = `1:${selectedRRTier}`;

  const selectedTierData = useMemo(() => {
    if (!artifact.rrComparison || artifact.rrComparison.length === 0) return null;
    return (
      artifact.rrComparison.find(rr => ('rrTier' in rr && rr.rrTier === selectedRRTier)) ||
      artifact.rrComparison.find(rr => ('tier' in rr && rr.tier === `1:${selectedRRTier}`)) ||
      null
    );
  }, [artifact.rrComparison, selectedRRTier]);

  const selectedTierWinRate = selectedTierData?.winRate ?? artifact.summary.overallWinRate;

  // Get expectancy for selected R:R tier from rrComparison data (overall)
  const getSelectedTierExpectancy = () => {
    if (!artifact.rrComparison || artifact.rrComparison.length === 0) {
      return artifact.summary.overallExpectancy;
    }
    const tierData = artifact.rrComparison.find(rr => {
      if ('rrTier' in rr && rr.rrTier === selectedRRTier) return true;
      if ('tier' in rr && rr.tier === `1:${selectedRRTier}`) return true;
      return false;
    });
    return tierData?.expectancy ?? artifact.summary.overallExpectancy;
  };

  // Prefer tier-aware backend outputs when present
  const effectivePatterns: PatternResult[] = useMemo(() => {
    return artifact.patternsByTier?.[tierLabel] ?? artifact.patterns;
  }, [artifact.patternsByTier, artifact.patterns, tierLabel]);

  const effectiveEquity: EquityPoint[] = useMemo(() => {
    return artifact.equityByTier?.[tierLabel] ?? artifact.equity;
  }, [artifact.equityByTier, artifact.equity, tierLabel]);

  const selectedTierMaxDrawdownPercent = useMemo(() => {
    // Prefer explicit backend max DD by tier
    if (artifact.maxDrawdownByTier?.[tierLabel] !== undefined) {
      return artifact.maxDrawdownByTier[tierLabel];
    }
    // Fallback: compute from equity points (drawdown is 0..1)
    if (!effectiveEquity || effectiveEquity.length === 0) return artifact.summary.overallMaxDrawdown ?? 0;
    const maxDD = Math.max(...effectiveEquity.map(p => p.drawdown ?? 0));
    return Math.min(maxDD * 100, 100);
  }, [artifact.maxDrawdownByTier, tierLabel, effectiveEquity, artifact.summary.overallMaxDrawdown]);

  // Calculate per-pattern stats for selected R:R tier
  // NOTE: This is now a fallback only. Preferred path is backend-provided patternsByTier.
  const getPatternStatsForTier = (patternId: string, tier: number) => {
    const baselinePattern = artifact.patterns.find(p => p.patternId === patternId);
    if (!baselinePattern) return { winRate: 0, expectancy: 0, totalTrades: 0 };
    
    // For single-pattern runs, rrComparison IS the pattern's data - use it directly
    if (artifact.patterns.length === 1 && artifact.rrComparison && artifact.rrComparison.length > 0) {
      const tierData = artifact.rrComparison.find(rr => 
        (rr.rrTier === tier) || (rr.tier === `1:${tier}`)
      );
      if (tierData) {
        return {
          winRate: tierData.winRate,
          expectancy: tierData.expectancy,
          totalTrades: tierData.sampleSize,
          patternName: baselinePattern.patternName,
          direction: baselinePattern.direction
        };
      }
    }
    
    // For multi-pattern runs, we need to approximate since rrComparison is aggregate
    // Get the overall win rate ratio between baseline and selected tier
    const baselineTierData = artifact.rrComparison?.find(rr => 
      (rr.rrTier === 2) || (rr.tier === '1:2')
    );
    const selectedTierData = artifact.rrComparison?.find(rr => 
      (rr.rrTier === tier) || (rr.tier === `1:${tier}`)
    );
    
    if (!baselineTierData || !selectedTierData || baselineTierData.winRate === 0) {
      // Fallback to static pattern data
      return {
        winRate: baselinePattern.winRate,
        expectancy: baselinePattern.expectancy,
        totalTrades: baselinePattern.totalTrades,
        patternName: baselinePattern.patternName,
        direction: baselinePattern.direction
      };
    }
    
    // For multi-pattern: scale pattern's baseline win rate by the same ratio as overall
    // This is an approximation - ideally backend would provide per-pattern per-tier data
    const winRateScaleFactor = selectedTierData.winRate / baselineTierData.winRate;
    const adjustedWinRate = Math.min(1, Math.max(0, baselinePattern.winRate * winRateScaleFactor));
    // Expectancy = (WinRate * R:R) - (LossRate * 1)
    const adjustedExpectancy = (adjustedWinRate * tier) - ((1 - adjustedWinRate) * 1);
    
    return {
      winRate: adjustedWinRate,
      expectancy: adjustedExpectancy,
      totalTrades: baselinePattern.totalTrades,
      patternName: baselinePattern.patternName,
      direction: baselinePattern.direction
    };
  };

  // Find best and worst patterns based on selected R:R tier
  const getBestWorstPatterns = () => {
    if (effectivePatterns.length === 0) {
      return { best: null, worst: null };
    }

    // If tier-aware pattern stats are present, use them directly (accurate)
    if (artifact.patternsByTier?.[tierLabel]) {
      const sorted = [...effectivePatterns].sort((a, b) => b.expectancy - a.expectancy);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      return { best, worst: sorted.length > 1 ? worst : null };
    }
    
    // Calculate stats for each pattern at the selected tier
    const patternsWithTierStats = artifact.patterns.map(p => ({
      ...p,
      ...getPatternStatsForTier(p.patternId, selectedRRTier)
    }));
    
    // Sort patterns by expectancy
    const sorted = [...patternsWithTierStats].sort((a, b) => b.expectancy - a.expectancy);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    // If only one pattern, best and worst are the same
    return { best, worst: sorted.length > 1 ? worst : null };
  };

  const { best: bestPattern, worst: worstPattern } = getBestWorstPatterns();
  const selectedTierExpectancy = getSelectedTierExpectancy();

  const getRecommendationBadge = (rec: 'trade' | 'caution' | 'avoid') => {
    switch (rec) {
      case 'trade':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Trade</Badge>;
      case 'caution':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Caution</Badge>;
      case 'avoid':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Avoid</Badge>;
    }
  };

  const getRegimeDescription = (key: string) => {
    const [trend, vol] = key.split('_');
    const trendDesc = trend === 'UP' ? 'Uptrend' : trend === 'DOWN' ? 'Downtrend' : 'Sideways';
    const volDesc = vol === 'HIGH' ? 'High Vol' : vol === 'LOW' ? 'Low Vol' : 'Medium Vol';
    return `${trendDesc}, ${volDesc}`;
  };

  const hasMultiRR = (artifact.rrComparison && artifact.rrComparison.length > 0);

  const displayedTrades = useMemo(() => {
    const tierKey = `rr${selectedRRTier}` as 'rr2' | 'rr3' | 'rr4' | 'rr5';
    return artifact.trades.map(t => {
      const outcome = t.rrOutcomes?.[tierKey];
      if (!outcome) return { ...t, tierOutcome: null as null | typeof outcome };
      return {
        ...t,
        // Prefer per-tier exit date when present (backend may provide)
        exitDate: outcome.exitDate ?? t.exitDate,
        rMultiple: outcome.rMultiple,
        // Fix: isWin must be based on hitting TP, not just positive R-multiple
        // Timeouts with positive R are not "wins" for statistical accuracy
        isWin: outcome.outcome === 'hit_tp',
        exitReason: outcome.outcome === 'hit_tp' ? 'tp' : outcome.outcome === 'hit_sl' ? 'sl' : 'time_stop',
        tierOutcome: outcome,
      };
    });
  }, [artifact.trades, selectedRRTier]);

  return (
    <div className="space-y-6">
      {/* R:R Tier Selector (global for all tabs) */}
      {hasMultiRR && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">R:R Target:</span>
            <div className="flex gap-1">
              {[2, 3, 4, 5].map(tier => (
                <Button
                  key={tier}
                  variant={selectedRRTier === tier ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRRTier(tier)}
                  className="font-mono"
                >
                  1:{tier}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Metrics update across Overview / Patterns / Trades / Equity
          </div>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="equity">Equity</TabsTrigger>
          <TabsTrigger value="exits" className="gap-1">
            <Zap className="h-3 w-3" />
            Exit Optimizer
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{artifact.summary.totalTrades}</div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatPercent(selectedTierWinRate)}</div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${selectedTierExpectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatR(selectedTierExpectancy)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Expectancy {artifact.rrComparison && artifact.rrComparison.length > 0 && <span className="text-xs opacity-70">(1:{selectedRRTier})</span>}
                </p>
              </CardContent>
            </Card>
            {selectedTierMaxDrawdownPercent !== undefined && (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-500">
                    {(selectedTierMaxDrawdownPercent ?? 0).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                </CardContent>
              </Card>
            )}
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{artifact.summary.totalPatterns}</div>
                <p className="text-sm text-muted-foreground">Patterns Tested</p>
              </CardContent>
            </Card>
          </div>

          {/* Best & Worst Pattern */}
          <div className="space-y-4">
            {/* Best & Worst Pattern Cards - only show if more than 1 pattern */}
            {effectivePatterns.length > 1 && bestPattern && worstPattern ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-500" />
                      Best Performing Pattern
                      {artifact.rrComparison && artifact.rrComparison.length > 0 && (
                        <span className="text-xs text-muted-foreground font-normal">(1:{selectedRRTier})</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{bestPattern.patternName}</div>
                    <div className={`text-2xl font-bold ${bestPattern.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatR(bestPattern.expectancy)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatPercent(bestPattern.winRate)} win rate • {bestPattern.totalTrades} trades
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Worst Performing Pattern
                      {artifact.rrComparison && artifact.rrComparison.length > 0 && (
                        <span className="text-xs text-muted-foreground font-normal">(1:{selectedRRTier})</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{worstPattern.patternName}</div>
                    <div className={`text-2xl font-bold ${worstPattern.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatR(worstPattern.expectancy)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatPercent(worstPattern.winRate)} win rate • {worstPattern.totalTrades} trades
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : bestPattern && (
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Pattern Performance
                    {artifact.rrComparison && artifact.rrComparison.length > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">(1:{selectedRRTier})</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{bestPattern.patternName}</div>
                  <div className={`text-2xl font-bold ${bestPattern.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatR(bestPattern.expectancy)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatPercent(bestPattern.winRate)} win rate • {bestPattern.totalTrades} trades
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* R:R Scenario Comparison */}
          {artifact.rrComparison && artifact.rrComparison.length > 0 && (
            <RRComparisonTable 
              stats={artifact.rrComparison}
              title="R:R Scenario Comparison"
              description="Optimize your target based on historical win rates and expectancy per R:R tier"
            />
          )}

          {/* Set Alert CTA - Journey Stage Handoff */}
          {artifact.patterns.length > 0 && (
            <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5">
              <CardContent className="py-5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Bell className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Like these results?</h3>
                      <p className="text-sm text-muted-foreground">
                        Set up alerts to get notified when {artifact.patterns.length === 1 ? 'this pattern forms' : 'these patterns form'} in the future
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      // Pass pattern context to alerts page
                      const patternParam = artifact.patterns.map(p => p.patternId).join(',');
                      navigate(`/members/alerts?patterns=${patternParam}&timeframe=${artifact.timeframe}`);
                    }}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Bell className="h-4 w-4" />
                    Set Alert
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Do Not Trade Rules */}
          {artifact.patterns.some(p => p.doNotTradeRules.length > 0) && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ban className="h-5 w-5 text-destructive" />
                  Do-Not-Trade Rules
                </CardTitle>
                <CardDescription>
                  Conditions where this pattern shows negative expectancy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {artifact.patterns.flatMap(p => 
                    p.doNotTradeRules.map((rule, i) => (
                      <li key={`${p.patternId}-${i}`} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <span><strong>{p.patternName}:</strong> {rule}</span>
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          {effectivePatterns.map(pattern => (
            <Card key={pattern.patternId} className="border-border/50 bg-card/50">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedPattern(
                  expandedPattern === pattern.patternId ? null : pattern.patternId
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pattern.direction === 'long' ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <CardTitle className="text-base">{pattern.patternName}</CardTitle>
                      <CardDescription>{pattern.totalTrades} trades</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                      <div className="font-semibold">{formatPercent(pattern.winRate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Expectancy</div>
                      <div className={`font-semibold ${pattern.expectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatR(pattern.expectancy)}
                      </div>
                    </div>
                    {expandedPattern === pattern.patternId ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {expandedPattern === pattern.patternId && (
                <CardContent className="pt-0 border-t border-border/50">
                  {/* Pattern Stats */}
                  <div className="grid gap-4 md:grid-cols-4 py-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Profit Factor</div>
                      <div className="font-semibold">{pattern.profitFactor?.toFixed(2) ?? '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg R</div>
                      <div className="font-semibold">{formatR(pattern.avgRMultiple)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Max Drawdown (R)</div>
                      <div className="font-semibold text-red-500">{pattern.maxDrawdown != null ? formatR(-Math.abs(pattern.maxDrawdown)) : '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      <div className="font-semibold">{pattern.sharpeRatio?.toFixed(2) ?? '-'}</div>
                    </div>
                  </div>

                  {/* Regime Breakdown */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Regime Breakdown
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Regime</TableHead>
                          <TableHead className="text-right">Trades</TableHead>
                          <TableHead className="text-right">Win Rate</TableHead>
                          <TableHead className="text-right">Avg R</TableHead>
                          <TableHead className="text-right">Recommendation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pattern.regimeBreakdown.map(regime => (
                          <TableRow key={regime.regimeKey}>
                            <TableCell className="font-medium">
                              {getRegimeDescription(regime.regimeKey)}
                              {!regime.isReliable && (
                                <span className="text-xs text-muted-foreground ml-2">(low sample)</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{regime.n}</TableCell>
                            <TableCell className="text-right">{formatPercent(regime.winRate)}</TableCell>
                            <TableCell className={`text-right ${regime.avgR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatR(regime.avgR)}
                            </TableCell>
                            <TableCell className="text-right">
                              {getRecommendationBadge(regime.recommendation)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Do Not Trade Rules for this pattern */}
                  {pattern.doNotTradeRules.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Do-Not-Trade Rules
                      </h5>
                      <ul className="text-sm space-y-1">
                        {pattern.doNotTradeRules.map((rule, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <XCircle className="h-3 w-3 text-destructive" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Trade Log</CardTitle>
              <CardDescription>
                Showing {Math.min(displayedTrades.length, 100)} of {displayedTrades.length} simulated trades (tier {tierLabel})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">R-Multiple</TableHead>
                      <TableHead className="text-right">Bars</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead>Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedTrades.slice(0, 100).map((trade, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">
                          {new Date(trade.entryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{trade.instrument}</TableCell>
                        <TableCell className="text-xs">{trade.patternId}</TableCell>
                        <TableCell>
                          {trade.direction === 'long' ? (
                            <Badge variant="outline" className="text-green-500 border-green-500/30">Long</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-500 border-red-500/30">Short</Badge>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${(trade.rMultiple ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatR(trade.rMultiple ?? 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {trade.tierOutcome?.bars ?? '-'}
                        </TableCell>
                        <TableCell className="text-xs">{getRegimeDescription(trade.regime)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {trade.tierOutcome?.outcome === 'hit_tp' ? 'TP' : trade.tierOutcome?.outcome === 'hit_sl' ? 'SL' : 'Time'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {displayedTrades.length > 100 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Showing first 100 of {displayedTrades.length} trades
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equity Tab */}
        <TabsContent value="equity" className="space-y-6">
          {/* Benchmark Selector */}
          {effectiveEquity.length > 0 && (
            <BenchmarkSelector
              startDate={effectiveEquity[0]?.date}
              endDate={effectiveEquity[effectiveEquity.length - 1]?.date}
              initialCapital={10000}
              onBenchmarkChange={handleBenchmarkChange}
            />
          )}

          {/* Equity Curve with Benchmarks */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Equity Curve
                {benchmarks.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    vs. {benchmarks.map(b => b.symbol).join(', ')}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Performance summary when benchmarks are active */}
              {benchmarks.length > 0 && effectiveEquity.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Strategy:</span>{' '}
                      <span className={`font-semibold ${
                        ((effectiveEquity[effectiveEquity.length - 1]?.value ?? 10000) - 10000) >= 0 
                          ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {(((effectiveEquity[effectiveEquity.length - 1]?.value ?? 10000) - 10000) / 100).toFixed(1)}%
                      </span>
                    </div>
                    {benchmarks.map(b => (
                      <div key={b.symbol}>
                        <span className="text-muted-foreground">{b.symbol}:</span>{' '}
                        <span className={`font-semibold ${b.returnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {b.returnPercent >= 0 ? '+' : ''}{b.returnPercent.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                    {/* Alpha calculation */}
                    {benchmarks.length === 1 && (
                      <div className="border-l border-border pl-4">
                        <span className="text-muted-foreground">Alpha:</span>{' '}
                        {(() => {
                          const strategyReturn = ((effectiveEquity[effectiveEquity.length - 1]?.value ?? 10000) - 10000) / 100;
                          const alpha = strategyReturn - benchmarks[0].returnPercent;
                          return (
                            <span className={`font-semibold ${alpha >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {alpha >= 0 ? '+' : ''}{alpha.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart 
                    data={(() => {
                      // Merge equity data with benchmark data by date
                      if (benchmarks.length === 0) return effectiveEquity;
                      
                      // Collect all unique dates from strategy + all benchmarks
                      const allDates = new Set<string>();
                      
                      effectiveEquity.forEach(point => {
                        allDates.add(point.date.split('T')[0]);
                      });
                      
                      benchmarks.forEach(benchmark => {
                        benchmark.data.forEach(point => {
                          allDates.add(point.date.split('T')[0]);
                        });
                      });
                      
                      // Sort dates chronologically
                      const sortedDates = Array.from(allDates).sort();
                      
                      // Create lookup maps for each data source
                      const strategyMap = new Map<string, { value: number; drawdown?: number }>();
                      effectiveEquity.forEach(point => {
                        strategyMap.set(point.date.split('T')[0], { value: point.value, drawdown: point.drawdown });
                      });
                      
                      const benchmarkMaps = benchmarks.map(b => {
                        const map = new Map<string, number>();
                        b.data.forEach(point => map.set(point.date.split('T')[0], point.value));
                        return { symbol: b.symbol, map };
                      });
                      
                      // Forward-fill interpolation to create continuous curves
                      let lastStrategy: { value: number; drawdown: number } = { value: 10000, drawdown: 0 };
                      const lastBenchmark: Record<string, number> = {};
                      benchmarks.forEach(b => { lastBenchmark[b.symbol] = 10000; });
                      
                      return sortedDates.map(dateKey => {
                        // Get or forward-fill strategy value
                        const strategyPoint = strategyMap.get(dateKey);
                        if (strategyPoint) {
                          lastStrategy = { value: strategyPoint.value, drawdown: strategyPoint.drawdown ?? 0 };
                        }
                        
                        // Build the data point
                        const point: Record<string, any> = {
                          date: dateKey,
                          strategy: lastStrategy.value,
                          drawdown: lastStrategy.drawdown,
                        };
                        
                        // Get or forward-fill each benchmark value
                        benchmarkMaps.forEach(({ symbol, map }) => {
                          const val = map.get(dateKey);
                          if (val !== undefined) {
                            lastBenchmark[symbol] = val;
                          }
                          point[symbol] = lastBenchmark[symbol];
                        });
                        
                        return point;
                      });
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => new Date(val).toLocaleDateString()}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                      formatter={(val: number, name: string) => {
                        const roi = ((val - 10000) / 10000) * 100;
                        const roiSign = roi >= 0 ? '+' : '';
                        return [
                          `$${val.toFixed(2)} (${roiSign}${roi.toFixed(1)}%)`, 
                          name === 'strategy' ? 'Strategy' : name
                        ];
                      }}
                    />
                    {benchmarks.length > 0 && <Legend />}
                    <ReferenceLine y={10000} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    
                    {/* Strategy line */}
                    <Line 
                      type="monotone" 
                      dataKey={benchmarks.length > 0 ? "strategy" : "value"}
                      name="Strategy"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    
                    {/* Benchmark lines */}
                    {benchmarks.map(benchmark => (
                      <Line
                        key={benchmark.symbol}
                        type="monotone"
                        dataKey={benchmark.symbol}
                        name={benchmark.symbol}
                        stroke={benchmark.color}
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    ))}
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Drawdown Chart */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={effectiveEquity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => new Date(val).toLocaleDateString()}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                    />
                    <Tooltip 
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                      formatter={(val: number) => [`${(val * 100).toFixed(2)}%`, 'Drawdown']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive) / 0.2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exit Optimizer Tab */}
        <TabsContent value="exits" className="space-y-6">
          {artifact.exitComparison && artifact.exitComparison.length > 0 ? (
            <>
              {/* Optimal Strategy Highlight */}
              {artifact.optimalExitStrategy && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Star className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Optimal Exit Strategy</h3>
                        <p className="text-sm text-muted-foreground">
                          {artifact.exitComparison.find(e => e.strategyId === artifact.optimalExitStrategy)?.strategyName || artifact.optimalExitStrategy}
                          {' '}delivers the highest expectancy for your pattern selection
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Exit Comparison Table */}
              <ExitComparisonTable 
                stats={artifact.exitComparison}
                title="Exit Strategy Comparison"
                description="Compare performance metrics across different exit methods to optimize your trading system"
              />

              {/* Exit Equity Overlay Chart */}
              {artifact.exitEquityByStrategy && Object.keys(artifact.exitEquityByStrategy).length > 0 && (
                <ExitEquityOverlay
                  series={artifact.exitComparison
                    .filter(e => artifact.exitEquityByStrategy?.[e.strategyId]?.length)
                    .map((e, idx) => ({
                      strategyId: e.strategyId,
                      strategyName: e.strategyName,
                      color: [
                        'hsl(var(--primary))',
                        'hsl(142, 76%, 36%)',
                        'hsl(221, 83%, 53%)',
                        'hsl(45, 93%, 47%)',
                        'hsl(280, 67%, 50%)',
                        'hsl(12, 76%, 61%)',
                        'hsl(173, 80%, 40%)',
                        'hsl(340, 82%, 52%)',
                      ][idx % 8],
                      data: artifact.exitEquityByStrategy![e.strategyId] || [],
                      finalValue: artifact.exitEquityByStrategy![e.strategyId]?.slice(-1)[0]?.value || 10000,
                      returnPercent: ((artifact.exitEquityByStrategy![e.strategyId]?.slice(-1)[0]?.value || 10000) - 10000) / 100,
                    }))
                    .filter(s => s.data.length > 0)
                  }
                />
              )}

              {/* Strategy Breakdown */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Strategy Categories
                  </CardTitle>
                  <CardDescription>
                    Exit strategies grouped by type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Fixed Targets */}
                    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                      <h4 className="font-semibold mb-2">Fixed R:R Targets</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Simple profit targets at fixed risk multiples
                      </p>
                      {artifact.exitComparison
                        .filter(e => e.strategyId.startsWith('fixed'))
                        .map(e => (
                          <div key={e.strategyId} className="flex justify-between text-sm py-1">
                            <span>{e.strategyName}</span>
                            <span className={e.expectancy >= 0 ? 'text-green-500' : 'text-destructive'}>
                              {e.expectancy >= 0 ? '+' : ''}{e.expectancy.toFixed(2)}R
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Trailing Stops */}
                    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                      <h4 className="font-semibold mb-2">Trailing Stops</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Dynamic stops that follow price movement
                      </p>
                      {artifact.exitComparison
                        .filter(e => e.strategyId.includes('atr') || e.strategyId.includes('scale'))
                        .map(e => (
                          <div key={e.strategyId} className="flex justify-between text-sm py-1">
                            <span>{e.strategyName}</span>
                            <span className={e.expectancy >= 0 ? 'text-green-500' : 'text-destructive'}>
                              {e.expectancy >= 0 ? '+' : ''}{e.expectancy.toFixed(2)}R
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Indicator-Based */}
                    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                      <h4 className="font-semibold mb-2">Indicator Exits</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Exits based on technical indicators
                      </p>
                      {artifact.exitComparison
                        .filter(e => e.strategyId.includes('rsi') || e.strategyId.includes('macd') || e.strategyId.includes('fib'))
                        .map(e => (
                          <div key={e.strategyId} className="flex justify-between text-sm py-1">
                            <span>{e.strategyName}</span>
                            <span className={e.expectancy >= 0 ? 'text-green-500' : 'text-destructive'}>
                              {e.expectancy >= 0 ? '+' : ''}{e.expectancy.toFixed(2)}R
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="py-12">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Exit Optimizer Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    Run a new Pattern Lab analysis to see exit strategy comparisons.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
    </div>
  );
};

export default PatternLabViewer;
