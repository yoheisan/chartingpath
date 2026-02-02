import { useState } from 'react';
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
  Code,
  ArrowRight
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
  Area
} from 'recharts';
import { RRComparisonTable, type RRTierStats } from './RRComparisonTable';

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
  };
  summary: {
    totalPatterns: number;
    totalTrades: number;
    overallWinRate: number;
    overallExpectancy: number;
    bestPattern: { id: string; name: string; expectancy: number };
    worstPattern: { id: string; name: string; expectancy: number };
  };
  patterns: PatternResult[];
  trades: TradeEntry[];
  equity: EquityPoint[];
  /** Multi-RR comparison stats from historical simulations */
  rrComparison?: RRTierStats[];
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

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatR = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`;

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

  // Find best and worst patterns based on their individual expectancy
  const getBestWorstPatterns = () => {
    if (artifact.patterns.length === 0) {
      return { best: null, worst: null };
    }
    
    // Sort patterns by expectancy
    const sorted = [...artifact.patterns].sort((a, b) => b.expectancy - a.expectancy);
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

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="equity">Equity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{artifact.summary.totalTrades}</div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatPercent(artifact.summary.overallWinRate)}</div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${artifact.summary.overallExpectancy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatR(artifact.summary.overallExpectancy)}
                </div>
                <p className="text-sm text-muted-foreground">Expectancy</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{artifact.summary.totalPatterns}</div>
                <p className="text-sm text-muted-foreground">Patterns Tested</p>
              </CardContent>
            </Card>
          </div>

          {/* R:R Tier Selector + Best & Worst Pattern */}
          <div className="space-y-4">
            {/* R:R Tier Selector */}
            {artifact.rrComparison && artifact.rrComparison.length > 0 && (
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
            )}

            {/* Best & Worst Pattern Cards - only show if more than 1 pattern */}
            {artifact.patterns.length > 1 && bestPattern && worstPattern ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-500" />
                      Best Performing Pattern
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
          {artifact.patterns.map(pattern => (
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
                      <div className="font-semibold">{pattern.profitFactor.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg R</div>
                      <div className="font-semibold">{formatR(pattern.avgRMultiple)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Max Drawdown</div>
                      <div className="font-semibold text-red-500">{formatPercent(pattern.maxDrawdown)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      <div className="font-semibold">{pattern.sharpeRatio.toFixed(2)}</div>
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
                All {artifact.trades.length} simulated trades
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
                      <TableHead className="text-right">Entry</TableHead>
                      <TableHead className="text-right">Exit</TableHead>
                      <TableHead className="text-right">R-Multiple</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead>Exit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {artifact.trades.slice(0, 100).map((trade, idx) => (
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
                        <TableCell className="text-right font-mono">{trade.entryPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{trade.exitPrice.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-semibold ${trade.rMultiple >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatR(trade.rMultiple)}
                        </TableCell>
                        <TableCell className="text-xs">{getRegimeDescription(trade.regime)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {trade.exitReason === 'tp' ? 'TP' : trade.exitReason === 'sl' ? 'SL' : 'Time'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {artifact.trades.length > 100 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Showing first 100 of {artifact.trades.length} trades
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equity Tab */}
        <TabsContent value="equity" className="space-y-6">
          {/* Equity Curve */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Equity Curve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={artifact.equity}>
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
                      formatter={(val: number) => [`$${val.toFixed(2)}`, 'Equity']}
                    />
                    <ReferenceLine y={100000} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
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
                  <AreaChart data={artifact.equity}>
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
      </Tabs>
      
      {/* Automate CTA - Journey Stage Handoff */}
      {artifact.patterns.length > 0 && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Ready to Automate?</h3>
                  <p className="text-sm text-muted-foreground">
                    Export your best-performing patterns to trading scripts
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  // Use the best performing pattern for context handoff
                  const bestPattern = artifact.summary.bestPattern.id;
                  navigate(`/members/scripts?pattern=${bestPattern}`);
                }}
                className="gap-2"
              >
                <Code className="h-4 w-4" />
                Browse Related Scripts
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatternLabViewer;
