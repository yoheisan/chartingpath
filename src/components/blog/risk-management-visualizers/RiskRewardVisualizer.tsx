/**
 * RiskRewardVisualizer - Comprehensive Risk-Reward Ratio Education
 * 
 * Industry-leading content covering:
 * - R:R fundamentals and expectancy
 * - Win rate vs R:R tradeoffs
 * - Optimal ratio selection
 * - Expectancy calculations
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Target, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Scale
} from 'lucide-react';

export const RiskRewardVisualizer = () => {
  const [winRate, setWinRate] = useState(50);
  const [riskRewardRatio, setRiskRewardRatio] = useState(2);
  const [avgWin, setAvgWin] = useState(200);
  const [avgLoss, setAvgLoss] = useState(100);

  const expectancyCalc = useMemo(() => {
    const wr = winRate / 100;
    // Formula-based expectancy
    const formulaExpectancy = (wr * riskRewardRatio) - (1 - wr);
    
    // Dollar-based expectancy
    const dollarExpectancy = (wr * avgWin) - ((1 - wr) * avgLoss);
    const actualRR = avgWin / avgLoss;
    
    // Breakeven win rate for given R:R
    const breakevenWinRate = 1 / (1 + riskRewardRatio);
    
    return {
      formulaExpectancy,
      dollarExpectancy,
      actualRR,
      breakevenWinRate,
      isProfitable: formulaExpectancy > 0
    };
  }, [winRate, riskRewardRatio, avgWin, avgLoss]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Risk-Reward Ratio: The Edge That Matters</h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Expectancy</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Risk-reward ratio is the relationship between your potential loss and potential gain on each trade. 
          Understanding this relationship—and its interplay with win rate—is what separates profitable traders 
          from everyone else. You can be wrong more than half the time and still make money.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="calculator">Expectancy Calc</TabsTrigger>
          <TabsTrigger value="tradeoffs">Win Rate Tradeoffs</TabsTrigger>
          <TabsTrigger value="practical">Practical Use</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                The Core Concept
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-6 rounded-lg">
                <pre className="text-xl font-mono text-center text-primary mb-4">
                  Risk:Reward = Stop Loss Distance : Target Distance
                </pre>
                <div className="text-center text-sm text-muted-foreground">
                  A 1:2 ratio means you risk $1 to make $2
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <p className="text-3xl font-bold text-red-400">1:1</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Risk $100 to make $100
                    <br />Need 50%+ win rate
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
                  <p className="text-3xl font-bold text-primary">1:2</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Risk $100 to make $200
                    <br />Need 33%+ win rate
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <p className="text-3xl font-bold text-green-400">1:3</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Risk $100 to make $300
                    <br />Need 25%+ win rate
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Key Insight
                </p>
                <p className="text-sm text-muted-foreground">
                  With a 1:2 risk-reward ratio, you can lose 66% of your trades and still break even. 
                  Win 40% and you're consistently profitable. This is why higher R:R ratios are so powerful.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* The Expectancy Formula */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                The Expectancy Formula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Expectancy tells you how much you expect to make (or lose) per dollar risked over many trades. 
                It's the most important metric for evaluating any trading system.
              </p>

              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="font-mono text-center text-primary text-lg">
                  E = (Win% × Avg Win) - (Loss% × Avg Loss)
                </pre>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Or simplified: E = (W × R) - (1 - W)
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Positive Expectancy Example</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Win Rate: 45%</li>
                    <li>R:R Ratio: 2:1</li>
                    <li>E = (0.45 × 2) - (0.55 × 1)</li>
                    <li className="text-green-400 font-semibold">E = 0.35R per trade</li>
                    <li className="text-xs">Risk $100, expect to make $35 per trade</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Negative Expectancy Example</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Win Rate: 60%</li>
                    <li>R:R Ratio: 0.5:1</li>
                    <li>E = (0.60 × 0.5) - (0.40 × 1)</li>
                    <li className="text-red-400 font-semibold">E = -0.10R per trade</li>
                    <li className="text-xs">Risk $100, expect to LOSE $10 per trade</li>
                  </ul>
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
                Expectancy Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label>Win Rate: {winRate}%</Label>
                    <Slider
                      value={[winRate]}
                      onValueChange={(v) => setWinRate(v[0])}
                      min={20}
                      max={80}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Risk:Reward Ratio: 1:{riskRewardRatio}</Label>
                    <Slider
                      value={[riskRewardRatio]}
                      onValueChange={(v) => setRiskRewardRatio(v[0])}
                      min={0.5}
                      max={5}
                      step={0.25}
                      className="mt-2"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <Label>Or calculate from actual results:</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="avgWin" className="text-xs">Avg Win ($)</Label>
                        <Input
                          id="avgWin"
                          type="number"
                          value={avgWin}
                          onChange={(e) => setAvgWin(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="avgLoss" className="text-xs">Avg Loss ($)</Label>
                        <Input
                          id="avgLoss"
                          type="number"
                          value={avgLoss}
                          onChange={(e) => setAvgLoss(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${expectancyCalc.isProfitable ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <p className="text-sm text-muted-foreground">Expectancy (per $1 risked)</p>
                    <p className={`text-3xl font-bold ${expectancyCalc.isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                      ${expectancyCalc.formulaExpectancy.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {expectancyCalc.isProfitable ? 'Profitable system ✓' : 'Unprofitable system ✗'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-muted-foreground">Dollar Expectancy</p>
                    <p className="text-xl font-bold text-blue-400">
                      ${expectancyCalc.dollarExpectancy.toFixed(2)} per trade
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actual R:R: 1:{expectancyCalc.actualRR.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-muted-foreground">Breakeven Win Rate</p>
                    <p className="text-xl font-bold text-amber-400">
                      {(expectancyCalc.breakevenWinRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      At 1:{riskRewardRatio} R:R, you need this win rate to break even
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expectancy Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Expectancy Reference Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Win Rate</th>
                      <th className="text-left py-2 px-3">1:1 R:R</th>
                      <th className="text-left py-2 px-3">1:2 R:R</th>
                      <th className="text-left py-2 px-3">1:3 R:R</th>
                      <th className="text-left py-2 px-3">1:4 R:R</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { wr: 30, r1: -0.40, r2: -0.10, r3: 0.20, r4: 0.50 },
                      { wr: 40, r1: -0.20, r2: 0.20, r3: 0.60, r4: 1.00 },
                      { wr: 50, r1: 0.00, r2: 0.50, r3: 1.00, r4: 1.50 },
                      { wr: 60, r1: 0.20, r2: 0.80, r3: 1.40, r4: 2.00 },
                      { wr: 70, r1: 0.40, r2: 1.10, r3: 1.80, r4: 2.50 },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-muted/50">
                        <td className="py-2 px-3 font-semibold">{row.wr}%</td>
                        <td className={`py-2 px-3 ${row.r1 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {row.r1 >= 0 ? '+' : ''}{row.r1.toFixed(2)}R
                        </td>
                        <td className={`py-2 px-3 ${row.r2 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {row.r2 >= 0 ? '+' : ''}{row.r2.toFixed(2)}R
                        </td>
                        <td className="py-2 px-3 text-green-400">+{row.r3.toFixed(2)}R</td>
                        <td className="py-2 px-3 text-green-400">+{row.r4.toFixed(2)}R</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Expectancy shown per $1 risked. Green = profitable, Red = unprofitable
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tradeoffs Tab */}
        <TabsContent value="tradeoffs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                The Win Rate vs R:R Tradeoff
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                There's an inherent tradeoff between win rate and risk-reward ratio. As you target larger 
                rewards relative to risk, your win rate naturally decreases because price has further to travel.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-3">High Win Rate Strategy</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Win Rate: 65-75%</li>
                    <li>• R:R: 0.5:1 to 1:1</li>
                    <li>• Small, consistent gains</li>
                    <li>• Few large losses hurt badly</li>
                    <li>• Psychologically easier</li>
                    <li>• Examples: Scalping, mean reversion</li>
                  </ul>
                  <div className="mt-3 p-2 bg-amber-500/10 rounded text-xs text-amber-400">
                    ⚠️ Vulnerable to single large loss
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-3">High R:R Strategy</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Win Rate: 30-45%</li>
                    <li>• R:R: 2:1 to 4:1</li>
                    <li>• Many small losses, few big wins</li>
                    <li>• Big winners cover losing streaks</li>
                    <li>• Psychologically challenging</li>
                    <li>• Examples: Trend following, breakouts</li>
                  </ul>
                  <div className="mt-3 p-2 bg-green-500/10 rounded text-xs text-green-400">
                    ✓ More robust to market changes
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-primary font-semibold mb-2">Professional Preference</p>
                <p className="text-sm text-muted-foreground">
                  Most professional traders prefer higher R:R strategies (1:2 minimum) because:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>1. They're more forgiving of prediction errors</li>
                  <li>2. A few big winners can salvage a bad month</li>
                  <li>3. Transaction costs matter less with larger gains</li>
                  <li>4. The math is more favorable for long-term survival</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                R:R Mistakes to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Cutting winners short, letting losers run",
                    detail: "The opposite of what works. Destroys R:R by reducing wins and increasing losses.",
                    fix: "Use predetermined targets. Trail stops on winners. Honor stop losses."
                  },
                  {
                    mistake: "Using same R:R for all market conditions",
                    detail: "Trending markets support higher R:R; ranging markets suit lower R:R.",
                    fix: "Adapt R:R targets to current market regime."
                  },
                  {
                    mistake: "Setting unrealistic targets",
                    detail: "Targeting 5:1 on every trade means most trades never reach target.",
                    fix: "Base targets on realistic market structure and volatility."
                  },
                  {
                    mistake: "Ignoring win rate in system design",
                    detail: "A 2:1 R:R means nothing if you only win 25% of trades.",
                    fix: "Track actual win rate and calculate real expectancy."
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

        {/* Practical Tab */}
        <TabsContent value="practical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Setting Realistic Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your R:R target should be based on market structure, not arbitrary numbers. Here's how to 
                set realistic targets:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">1. Identify Market Structure</h4>
                  <p className="text-sm text-muted-foreground">
                    Look for the next significant support/resistance level. That's your realistic target. 
                    If it doesn't give at least 1:2 R:R, the trade may not be worth taking.
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">2. Use ATR for Target Sizing</h4>
                  <p className="text-sm text-muted-foreground">
                    If your stop is 2×ATR, target 4×ATR for a 1:2 R:R. This adapts to each asset's volatility.
                  </p>
                  <div className="bg-muted/50 p-2 rounded mt-2 font-mono text-sm">
                    Target = Entry + (Stop Distance × R:R Ratio)
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">3. Consider Partial Exits</h4>
                  <p className="text-sm text-muted-foreground">
                    Take partial profits at 1:1 R:R (50%), then let rest run to 1:2 or 1:3. 
                    This secures some profit while maintaining upside.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Real Trade Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Breakout Trade (AAPL)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Entry: $175 (breakout above resistance)</li>
                    <li>Stop: $172 (below breakout level)</li>
                    <li>Target: $181 (next resistance)</li>
                    <li>Risk: $3 | Reward: $6</li>
                    <li className="text-primary font-semibold">R:R = 1:2 ✓</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Pullback Trade (EUR/USD)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Entry: 1.0850 (bounce off 50 EMA)</li>
                    <li>Stop: 1.0820 (below swing low)</li>
                    <li>Target: 1.0940 (prior high)</li>
                    <li>Risk: 30 pips | Reward: 90 pips</li>
                    <li className="text-primary font-semibold">R:R = 1:3 ✓</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskRewardVisualizer;
