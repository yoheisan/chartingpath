/**
 * StatArbVisualizer - Statistical Arbitrage Education
 * 
 * Professional-grade content covering:
 * - Pairs trading fundamentals
 * - Cointegration testing
 * - Spread modeling
 * - Portfolio construction
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  GitBranch, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  Scale
} from 'lucide-react';

export const StatArbVisualizer = () => {
  const [zScore, setZScore] = useState(0);
  const [entryThreshold, setEntryThreshold] = useState(2);
  const [exitThreshold, setExitThreshold] = useState(0.5);

  const tradeSignal = useMemo(() => {
    if (zScore >= entryThreshold) return { action: 'SHORT spread', color: 'text-red-400' };
    if (zScore <= -entryThreshold) return { action: 'LONG spread', color: 'text-green-400' };
    if (Math.abs(zScore) <= exitThreshold) return { action: 'EXIT position', color: 'text-blue-400' };
    return { action: 'HOLD', color: 'text-muted-foreground' };
  }, [zScore, entryThreshold, exitThreshold]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Statistical Arbitrage</h2>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Market Neutral</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Statistical Arbitrage exploits temporary mispricings between related assets. By going 
          long one asset and short another, you profit when their prices converge—regardless of 
          market direction. This guide covers the mathematics, implementation, and pitfalls of 
          stat arb strategies.
        </p>
      </div>

      <Tabs defaultValue="fundamentals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="cointegration">Cointegration</TabsTrigger>
          <TabsTrigger value="signals">Signal Demo</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        {/* Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                What Is Statistical Arbitrage?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-lg text-center text-muted-foreground">
                  Stat Arb = <span className="text-primary font-semibold">Long Asset A + Short Asset B → Profit when spread reverts</span>
                </p>
              </div>

              <p className="text-muted-foreground">
                Two related assets (like Coke and Pepsi) tend to move together. When they 
                temporarily diverge, stat arb traders bet on convergence. This is market-neutral: 
                you don't care if stocks go up or down, only that the spread returns to normal.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Long the Spread
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    When spread is unusually LOW (Asset A underperforming):
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Buy Asset A (the underperformer)</li>
                    <li>• Short Asset B (the outperformer)</li>
                    <li>• Profit when A catches up to B</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Short the Spread
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    When spread is unusually HIGH (Asset A outperforming):
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Short Asset A (the outperformer)</li>
                    <li>• Buy Asset B (the underperformer)</li>
                    <li>• Profit when A falls back to B</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  The Risk: Divergence, Not Convergence
                </p>
                <p className="text-sm text-muted-foreground">
                  Sometimes spreads diverge further instead of converging. This happened dramatically 
                  to LTCM in 1998. Always use stop losses and position limits.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Classic Pairs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                Classic Pairs to Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">Same Sector Pairs</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• KO / PEP (Coca-Cola vs Pepsi)</li>
                    <li>• GM / F (General Motors vs Ford)</li>
                    <li>• JPM / BAC (Banks)</li>
                    <li>• XOM / CVX (Oil majors)</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold mb-2">ETF Pairs</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• SPY / IVV (Same index, different issuers)</li>
                    <li>• GLD / IAU (Gold ETFs)</li>
                    <li>• EWJ / DXJ (Japan ETFs)</li>
                    <li>• XLF / KRE (Financials vs Regionals)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cointegration Tab */}
        <TabsContent value="cointegration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Cointegration: The Mathematical Foundation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-primary font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Correlation vs Cointegration
                </p>
                <p className="text-sm text-muted-foreground">
                  Correlation measures if assets move together in the short term. Cointegration 
                  measures if their spread is mean-reverting in the long term. For stat arb, 
                  cointegration matters more than correlation.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Engle-Granger Two-Step Test</h4>
                <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`# Step 1: Regress Asset A on Asset B
from statsmodels.regression.linear_model import OLS
model = OLS(price_A, price_B).fit()
hedge_ratio = model.params[0]
spread = price_A - hedge_ratio * price_B

# Step 2: Test if spread is stationary (mean-reverting)
from statsmodels.tsa.stattools import adfuller
adf_result = adfuller(spread)
p_value = adf_result[1]

# If p-value < 0.05, spread is cointegrated
is_cointegrated = p_value < 0.05`}</pre>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Cointegrated ✓</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• ADF p-value &lt; 0.05</li>
                    <li>• Spread oscillates around mean</li>
                    <li>• Half-life is reasonable (5-30 days)</li>
                    <li>• Relationship is economically sensible</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-2">Not Cointegrated ✗</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• ADF p-value &gt; 0.05</li>
                    <li>• Spread trends or random walks</li>
                    <li>• Half-life is too long or negative</li>
                    <li>• Spurious relationship</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Half-Life Calculation</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Half-life tells you how long the spread takes to revert halfway to the mean:
                </p>
                <div className="bg-muted/50 p-4 rounded font-mono text-sm">
                  <pre>{`# Calculate half-life of mean reversion
spread_lag = spread.shift(1)
spread_diff = spread - spread_lag
model = OLS(spread_diff[1:], spread_lag[1:]).fit()
half_life = -np.log(2) / model.params[0]
print(f"Half-life: {half_life:.1f} days")`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signal Demo Tab */}
        <TabsContent value="signals" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Z-Score Signal Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  The Z-score measures how many standard deviations the spread is from its mean. 
                  Trade when Z-score exceeds thresholds; exit when it returns to normal.
                </p>

                <div className="space-y-6">
                  <div>
                    <Label>Current Z-Score: {zScore.toFixed(2)}</Label>
                    <Slider
                      value={[zScore]}
                      onValueChange={(v) => setZScore(v[0])}
                      min={-4}
                      max={4}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Entry Threshold: ±{entryThreshold.toFixed(1)}σ</Label>
                      <Slider
                        value={[entryThreshold]}
                        onValueChange={(v) => setEntryThreshold(v[0])}
                        min={1}
                        max={3}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Exit Threshold: ±{exitThreshold.toFixed(1)}σ</Label>
                      <Slider
                        value={[exitThreshold]}
                        onValueChange={(v) => setExitThreshold(v[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Z-Score Bar */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1/6 bg-green-500/30"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/6 bg-red-500/30"></div>
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-primary"
                    style={{ left: `${((zScore + 4) / 8) * 100}%` }}
                  ></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Mean
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>-4σ (Long)</span>
                  <span>0</span>
                  <span>+4σ (Short)</span>
                </div>
              </div>

              <div className={`p-4 rounded-lg border text-center ${
                tradeSignal.color.includes('green') ? 'bg-green-500/10 border-green-500/30' :
                tradeSignal.color.includes('red') ? 'bg-red-500/10 border-red-500/30' :
                tradeSignal.color.includes('blue') ? 'bg-blue-500/10 border-blue-500/30' :
                'bg-muted/30'
              }`}>
                <p className="text-sm text-muted-foreground">Trade Signal</p>
                <p className={`text-2xl font-bold ${tradeSignal.color}`}>
                  {tradeSignal.action}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Complete Pairs Trading Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{`class PairsTradingStrategy:
    def __init__(self, lookback=60, entry_z=2.0, exit_z=0.5):
        self.lookback = lookback
        self.entry_z = entry_z
        self.exit_z = exit_z
        
    def calculate_spread(self, price_a, price_b):
        # Calculate hedge ratio using rolling regression
        model = OLS(price_a[-self.lookback:], price_b[-self.lookback:]).fit()
        hedge_ratio = model.params[0]
        spread = price_a - hedge_ratio * price_b
        return spread, hedge_ratio
    
    def calculate_zscore(self, spread):
        mean = spread[-self.lookback:].mean()
        std = spread[-self.lookback:].std()
        zscore = (spread[-1] - mean) / std
        return zscore
    
    def generate_signal(self, zscore, current_position):
        if current_position == 0:
            if zscore > self.entry_z:
                return 'SHORT_SPREAD'  # Short A, Long B
            elif zscore < -self.entry_z:
                return 'LONG_SPREAD'   # Long A, Short B
        else:
            if abs(zscore) < self.exit_z:
                return 'EXIT'
        return 'HOLD'`}</pre>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Common Pitfalls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Ignoring transaction costs",
                    fix: "Stat arb requires many trades. Model bid-ask spreads and commissions."
                  },
                  {
                    mistake: "Overfitting lookback period",
                    fix: "Use walk-forward testing. 60-120 day lookbacks are common."
                  },
                  {
                    mistake: "No stop loss",
                    fix: "Exit if Z-score exceeds 4-5 standard deviations. Relationship may be broken."
                  },
                  {
                    mistake: "Ignoring structural breaks",
                    fix: "Continuously test for cointegration. Exit if relationship breaks down."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {item.mistake}
                    </p>
                    <p className="text-sm text-green-400 mt-1">✓ {item.fix}</p>
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

export default StatArbVisualizer;
