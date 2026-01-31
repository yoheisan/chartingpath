/**
 * KellyCriterionVisualizer - Comprehensive Kelly Criterion Education
 * 
 * Industry-leading content based on:
 * - John Kelly's original 1956 paper
 * - Ed Thorp's practical applications
 * - Ralph Vince's optimal f extensions
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Target,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Shield
} from 'lucide-react';

export const KellyCriterionVisualizer = () => {
  const [winRate, setWinRate] = useState(55);
  const [winLossRatio, setWinLossRatio] = useState(2);

  const kellyCalculation = useMemo(() => {
    const w = winRate / 100;
    const r = winLossRatio;
    const fullKelly = w - ((1 - w) / r);
    const halfKelly = fullKelly / 2;
    const quarterKelly = fullKelly / 4;
    const expectancy = (w * r) - (1 - w);
    
    return {
      fullKelly: Math.max(0, fullKelly * 100),
      halfKelly: Math.max(0, halfKelly * 100),
      quarterKelly: Math.max(0, quarterKelly * 100),
      expectancy,
      hasEdge: fullKelly > 0
    };
  }, [winRate, winLossRatio]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Kelly Criterion: Mathematically Optimal Position Sizing</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Advanced</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The Kelly Criterion provides the mathematically optimal bet size to maximize long-term growth rate. 
          Developed by John Kelly at Bell Labs in 1956 and later applied to trading by Ed Thorp, it answers 
          the fundamental question: "Given my edge, how much should I bet?"
        </p>
      </div>

      <Tabs defaultValue="theory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="theory">Theory</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="practical">Practical Use</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Theory Tab */}
        <TabsContent value="theory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                The Kelly Formula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-6 rounded-lg">
                <pre className="text-xl font-mono text-center text-primary mb-4">
                  f* = (bp - q) / b
                </pre>
                <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <span className="text-primary font-semibold">f*</span>
                    <p className="text-muted-foreground">Optimal fraction of capital</p>
                  </div>
                  <div>
                    <span className="text-primary font-semibold">b</span>
                    <p className="text-muted-foreground">Odds received (win/loss ratio)</p>
                  </div>
                  <div>
                    <span className="text-primary font-semibold">p / q</span>
                    <p className="text-muted-foreground">Probability of win/loss</p>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground">
                Simplified for trading:
              </p>
              
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <pre className="text-lg font-mono text-center text-primary">
                  Kelly % = Win Rate - [(1 - Win Rate) / Win:Loss Ratio]
                </pre>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  What Kelly Optimizes
                </p>
                <p className="text-sm text-muted-foreground">
                  Kelly maximizes the expected logarithm of wealth—equivalent to maximizing the geometric 
                  growth rate. This is different from maximizing expected value, which ignores the path 
                  and only considers the endpoint.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Historical Origins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-blue-500">
                  <p className="font-semibold mb-1">1956 - John Kelly (Bell Labs)</p>
                  <p className="text-sm text-muted-foreground">
                    Originally developed to solve a problem in information theory—how to maximize 
                    the growth rate of a gambler with inside information about horse racing results 
                    transmitted over a noisy telephone line.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-green-500">
                  <p className="font-semibold mb-1">1962 - Ed Thorp (MIT Mathematician)</p>
                  <p className="text-sm text-muted-foreground">
                    Applied Kelly to blackjack card counting in "Beat the Dealer," then to 
                    options trading and hedge fund management. His fund averaged 20%+ annual 
                    returns for 30 years using Kelly-based sizing.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-purple-500">
                  <p className="font-semibold mb-1">1990s - Ralph Vince</p>
                  <p className="text-sm text-muted-foreground">
                    Extended Kelly with "optimal f" for continuous distributions and developed 
                    practical methods for estimating parameters from trading history.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Interactive Kelly Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-6">
                  <div>
                    <Label>Win Rate: {winRate}%</Label>
                    <Slider
                      value={[winRate]}
                      onValueChange={(v) => setWinRate(v[0])}
                      min={30}
                      max={80}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>30%</span>
                      <span>80%</span>
                    </div>
                  </div>

                  <div>
                    <Label>Win/Loss Ratio: {winLossRatio.toFixed(1)}:1</Label>
                    <Slider
                      value={[winLossRatio]}
                      onValueChange={(v) => setWinLossRatio(v[0])}
                      min={0.5}
                      max={5}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0.5:1</span>
                      <span>5:1</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${kellyCalculation.hasEdge ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <p className="text-sm text-muted-foreground">Edge (Expectancy)</p>
                    <p className={`text-2xl font-bold ${kellyCalculation.hasEdge ? 'text-green-400' : 'text-red-400'}`}>
                      {(kellyCalculation.expectancy * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kellyCalculation.hasEdge ? 'Positive edge - profitable system' : 'No edge - do not trade this system'}
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <p className="text-sm text-muted-foreground">Full Kelly</p>
                    <p className="text-3xl font-bold text-purple-400">{kellyCalculation.fullKelly.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Maximum theoretical growth (very volatile)</p>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">Half Kelly (Recommended)</p>
                    <p className="text-3xl font-bold text-primary">{kellyCalculation.halfKelly.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">~75% of max growth, much smoother</p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-muted-foreground">Quarter Kelly (Conservative)</p>
                    <p className="text-3xl font-bold text-blue-400">{kellyCalculation.quarterKelly.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">~50% of max growth, minimal drawdowns</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reference Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Kelly Reference Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Win Rate</th>
                      <th className="text-left py-2 px-3">1:1 R:R</th>
                      <th className="text-left py-2 px-3">2:1 R:R</th>
                      <th className="text-left py-2 px-3">3:1 R:R</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { wr: 40, r1: 'No Edge', r2: '10%', r3: '20%' },
                      { wr: 50, r1: '0%', r2: '25%', r3: '33%' },
                      { wr: 55, r1: '10%', r2: '33%', r3: '40%' },
                      { wr: 60, r1: '20%', r2: '40%', r3: '47%' },
                      { wr: 65, r1: '30%', r2: '48%', r3: '53%' },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-muted/50">
                        <td className="py-2 px-3 font-semibold">{row.wr}%</td>
                        <td className={`py-2 px-3 ${row.r1 === 'No Edge' ? 'text-red-400' : 'text-green-400'}`}>{row.r1}</td>
                        <td className="py-2 px-3 text-green-400">{row.r2}</td>
                        <td className="py-2 px-3 text-green-400">{row.r3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Full Kelly values shown. Use Half-Kelly (÷2) for practical trading.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Practical Tab */}
        <TabsContent value="practical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Why Use Fractional Kelly
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Full Kelly is theoretically optimal but practically dangerous. Professional traders universally 
                use fractional Kelly (25-50% of full) for these reasons:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Full Kelly Risks</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Extreme volatility (50%+ drawdowns)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Assumes perfect edge estimation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>No margin for estimation error</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>Psychological torture during drawdowns</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Half Kelly Benefits</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>75% of theoretical growth rate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Dramatically reduced drawdowns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Margin for estimation error</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Psychologically sustainable</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Critical Mistakes When Using Kelly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Overestimating win rate from small sample",
                    detail: "Need 100+ trades minimum to estimate edge reliably. 30 trades can easily show 60% win rate from a 50% system.",
                    fix: "Use at least 100 trades and apply confidence intervals"
                  },
                  {
                    mistake: "Not accounting for changing market conditions",
                    detail: "Edge measured in trending market may disappear in ranging market.",
                    fix: "Segment stats by market regime, use conservative estimates"
                  },
                  {
                    mistake: "Ignoring correlation between trades",
                    detail: "Kelly assumes independent bets. Correlated positions multiply risk.",
                    fix: "Reduce Kelly for correlated strategies, treat as single position"
                  },
                  {
                    mistake: "Using Kelly without an actual edge",
                    detail: "Kelly can't create edge—it only optimizes position sizing given an existing edge.",
                    fix: "Verify edge statistically before applying Kelly"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {item.mistake}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">{item.detail}</p>
                    <p className="text-sm text-green-400 mt-2">✓ {item.fix}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Kelly for Continuous Distributions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The basic Kelly formula assumes binary outcomes (win or lose fixed amounts). Real trading 
                has variable outcomes. Ralph Vince's "optimal f" extends Kelly for continuous distributions:
              </p>

              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="font-mono text-sm text-primary">
{`Optimal f = argmax[f] Σ log(1 + f × Ri/|Largest Loss|)

Where:
- f = fraction of capital to risk
- Ri = individual trade returns
- Optimization finds f that maximizes geometric growth`}
                </pre>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-purple-400 font-semibold mb-2">Practical Implementation</p>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li>1. Collect at least 100+ trade results</li>
                  <li>2. Run optimization to find optimal f</li>
                  <li>3. Use 25-50% of optimal f in live trading</li>
                  <li>4. Re-optimize quarterly as performance data accumulates</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Strategy Kelly */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Kelly for Multiple Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                When running multiple strategies, capital allocation becomes more complex. The key insight 
                is that Kelly applies to the portfolio level, not just individual strategies.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Uncorrelated Strategies</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    If strategies are truly independent, you can apply Kelly to each separately 
                    (with appropriate fractional reduction).
                  </p>
                  <p className="text-xs text-green-400">
                    Benefit: Diversification reduces portfolio volatility
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Correlated Strategies</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Correlated strategies must share a single Kelly allocation. Their combined 
                    exposure shouldn't exceed what Kelly recommends for one.
                  </p>
                  <p className="text-xs text-amber-400">
                    Warning: Correlation often increases during market stress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ed Thorp Quote */}
          <Card className="border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-400" />
                From the Master: Ed Thorp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-500/10 rounded-lg border-l-4 border-green-500">
                <p className="italic text-muted-foreground mb-2">
                  "In my hedge fund, we used Kelly-type position sizing. We typically ran at about 
                  half Kelly. The result was 30 years with no down years and an average return of 
                  about 20% annually with very low volatility. The Kelly approach, properly applied, 
                  is a key reason we were able to achieve such consistency."
                </p>
                <p className="text-sm font-semibold">— Ed Thorp, Pioneer of Quantitative Finance</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KellyCriterionVisualizer;
