/**
 * VaRVisualizer - Value at Risk Education
 * 
 * Professional-grade content covering:
 * - VaR fundamentals and calculation methods
 * - Historical, Parametric, and Monte Carlo VaR
 * - Limitations and proper interpretation
 * - Practical applications for traders
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  BarChart3, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  Shield,
  Target
} from 'lucide-react';

export const VaRVisualizer = () => {
  const [portfolioValue, setPortfolioValue] = useState(100000);
  const [dailyVolatility, setDailyVolatility] = useState(2);
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  const varCalc = useMemo(() => {
    // Z-scores for different confidence levels
    const zScores: Record<number, number> = {
      90: 1.28,
      95: 1.65,
      99: 2.33
    };
    
    const zScore = zScores[confidenceLevel] || 1.65;
    const dailyVaR = portfolioValue * (dailyVolatility / 100) * zScore;
    const weeklyVaR = dailyVaR * Math.sqrt(5);
    const monthlyVaR = dailyVaR * Math.sqrt(21);
    const annualVaR = dailyVaR * Math.sqrt(252);
    
    return {
      dailyVaR,
      weeklyVaR,
      monthlyVaR,
      annualVaR,
      dailyVaRPercent: (dailyVaR / portfolioValue) * 100,
      zScore
    };
  }, [portfolioValue, dailyVolatility, confidenceLevel]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Value at Risk (VaR): Quantifying Portfolio Risk</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Advanced</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Value at Risk (VaR) is the industry standard for measuring and communicating market risk. 
          It answers a simple question: "What's the maximum I could lose over a given period at a 
          certain confidence level?" Used by banks, hedge funds, and regulators worldwide.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="limitations">Limitations</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                What Is VaR?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  "There is a <span className="text-primary font-semibold">{confidenceLevel}%</span> probability that 
                  the portfolio will not lose more than <span className="text-primary font-semibold">$X</span> over 
                  the next <span className="text-primary font-semibold">day/week/month</span>."
                </p>
              </div>

              <p className="text-muted-foreground">
                VaR provides a single number that captures the risk of an entire portfolio, making it easy to 
                communicate risk to stakeholders, set risk limits, and compare different investments.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card text-center">
                  <p className="text-sm text-muted-foreground">Confidence Level</p>
                  <p className="text-2xl font-bold text-primary mt-1">{confidenceLevel}%</p>
                  <p className="text-xs text-muted-foreground mt-1">How often losses stay within VaR</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <p className="text-sm text-muted-foreground">Time Horizon</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">1 Day</p>
                  <p className="text-xs text-muted-foreground mt-1">Common for trading desks</p>
                </div>
                <div className="p-4 rounded-lg border bg-card text-center">
                  <p className="text-sm text-muted-foreground">VaR Amount</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">$X</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximum expected loss</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Origins & Industry Adoption
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30 border-l-4 border-blue-500">
                  <p className="font-semibold">1990s - JP Morgan</p>
                  <p className="text-sm text-muted-foreground">
                    Dennis Weatherstone (CEO) requested daily VaR reports—the "4:15 report" delivered 
                    15 minutes after market close showing bank-wide risk.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border-l-4 border-green-500">
                  <p className="font-semibold">1994 - RiskMetrics</p>
                  <p className="text-sm text-muted-foreground">
                    JP Morgan published their VaR methodology publicly, establishing industry standard.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border-l-4 border-purple-500">
                  <p className="font-semibold">1996 - Basel Accords</p>
                  <p className="text-sm text-muted-foreground">
                    Banking regulators adopted VaR for determining capital requirements, cementing 
                    its role in financial regulation.
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
                Parametric VaR Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="portfolio">Portfolio Value ($)</Label>
                    <Input
                      id="portfolio"
                      type="number"
                      value={portfolioValue}
                      onChange={(e) => setPortfolioValue(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Daily Volatility (σ): {dailyVolatility}%</Label>
                    <Slider
                      value={[dailyVolatility]}
                      onValueChange={(v) => setDailyVolatility(v[0])}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on historical price movements
                    </p>
                  </div>

                  <div>
                    <Label>Confidence Level</Label>
                    <div className="flex gap-2 mt-2">
                      {[90, 95, 99].map((level) => (
                        <button
                          key={level}
                          onClick={() => setConfidenceLevel(level)}
                          className={`px-4 py-2 rounded ${
                            confidenceLevel === level 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {level}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">Daily VaR ({confidenceLevel}%)</p>
                    <p className="text-3xl font-bold text-primary">
                      ${varCalc.dailyVaR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {varCalc.dailyVaRPercent.toFixed(2)}% of portfolio
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-muted-foreground">Weekly VaR</p>
                      <p className="text-xl font-bold text-blue-400">
                        ${varCalc.weeklyVaR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <p className="text-sm text-muted-foreground">Monthly VaR</p>
                      <p className="text-xl font-bold text-purple-400">
                        ${varCalc.monthlyVaR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded text-sm">
                    <p className="text-muted-foreground">
                      Formula: VaR = Portfolio × σ × Z-score
                      <br />
                      Z-score at {confidenceLevel}%: {varCalc.zScore}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                VaR Calculation Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Parametric */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <Badge className="bg-blue-500/20 text-blue-400">Simple</Badge>
                  Parametric (Variance-Covariance) VaR
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Assumes returns follow a normal distribution. Fast to calculate but may underestimate 
                  tail risk.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                  VaR = Portfolio Value × σ × Z-score
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-green-400">✓ Fast computation</div>
                  <div className="text-red-400">✗ Assumes normal distribution</div>
                  <div className="text-green-400">✓ Easy to understand</div>
                  <div className="text-red-400">✗ Underestimates fat tails</div>
                </div>
              </div>

              {/* Historical */}
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary">Recommended</Badge>
                  Historical Simulation VaR
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Uses actual historical returns to simulate outcomes. No distribution assumption required.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                  Sort historical returns → Take (1-confidence)th percentile
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-green-400">✓ Captures actual fat tails</div>
                  <div className="text-red-400">✗ Needs lots of data</div>
                  <div className="text-green-400">✓ No distribution assumption</div>
                  <div className="text-red-400">✗ Past may not predict future</div>
                </div>
              </div>

              {/* Monte Carlo */}
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                  <Badge className="bg-purple-500/20 text-purple-400">Advanced</Badge>
                  Monte Carlo VaR
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Simulates thousands of random price paths. Can model complex instruments and fat-tailed 
                  distributions.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                  Generate 10,000+ scenarios → Price portfolio → Take percentile
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-green-400">✓ Most flexible</div>
                  <div className="text-red-400">✗ Computationally expensive</div>
                  <div className="text-green-400">✓ Handles complex portfolios</div>
                  <div className="text-red-400">✗ Model risk (garbage in = garbage out)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limitations Tab */}
        <TabsContent value="limitations" className="space-y-6">
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Critical Limitations of VaR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">
                  VaR Tells You Nothing About Losses Beyond the VaR Level
                </p>
                <p className="text-sm text-muted-foreground">
                  If your 95% VaR is $100,000, you know losses exceed this 5% of the time—but those 
                  losses could be $101,000 or $10 million. VaR is silent about this.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    issue: "Tail Risk Blindness",
                    detail: "VaR ignores what happens beyond the cutoff. The 2008 crisis saw losses far beyond VaR estimates.",
                    solution: "Use Expected Shortfall (CVaR) which averages losses beyond VaR"
                  },
                  {
                    issue: "Assumes Normal Conditions",
                    detail: "Markets aren't normal during crises. Correlations spike and liquidity vanishes.",
                    solution: "Stress test separately for crisis scenarios"
                  },
                  {
                    issue: "Past ≠ Future",
                    detail: "Historical VaR assumes past volatility predicts future volatility.",
                    solution: "Update VaR regularly, use multiple time periods"
                  },
                  {
                    issue: "False Precision",
                    detail: "VaR of $1,234,567 suggests precision that doesn't exist.",
                    solution: "Treat VaR as an estimate, not an exact number"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {item.issue}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                    <p className="text-sm text-green-400 mt-2">✓ {item.solution}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Proper Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                How to Use VaR Properly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Use VaR as one tool among many, not the only risk measure",
                  "Combine with stress testing for crisis scenarios",
                  "Use Expected Shortfall (CVaR) to capture tail risk",
                  "Update VaR estimates regularly as volatility changes",
                  "Set VaR limits based on your risk tolerance, not arbitrary numbers",
                  "Understand your VaR model's assumptions and limitations"
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VaRVisualizer;
