/**
 * StopLossVisualizer - Comprehensive Stop Loss Education
 * 
 * Industry-leading content covering:
 * - Technical stop placement methods
 * - ATR-based stops
 * - Trailing stop strategies
 * - Time-based stops
 */

import { useState, useMemo, Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
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
  Clock,
  Zap
} from 'lucide-react';
import { generateDemoBars } from '@/utils/chartIndicators';

const StrategyIndicatorChart = lazy(() => 
  import('@/components/charts/StrategyIndicatorChart')
);

export const StopLossVisualizer = () => {
  const [entryPrice, setEntryPrice] = useState(150);
  const [atrValue, setAtrValue] = useState(3.5);
  const [atrMultiplier, setAtrMultiplier] = useState(2);
  
  const demoBars = useMemo(() => generateDemoBars(120), []);

  const stopCalculations = useMemo(() => {
    const atrStop = entryPrice - (atrValue * atrMultiplier);
    const percentStop2 = entryPrice * 0.98;
    const percentStop5 = entryPrice * 0.95;
    const riskPerShare2ATR = atrValue * atrMultiplier;
    const riskPerShare5Pct = entryPrice * 0.05;
    
    return {
      atrStop,
      percentStop2,
      percentStop5,
      riskPerShare2ATR,
      riskPerShare5Pct,
      atrStopPercent: ((entryPrice - atrStop) / entryPrice) * 100
    };
  }, [entryPrice, atrValue, atrMultiplier]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Stop Loss Strategies: Your Defense System</h2>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Risk Control</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          A stop loss is your first line of defense against catastrophic losses. The best traders don't just 
          set stops—they place them strategically based on market structure and volatility, then honor them 
          unconditionally. This guide covers every major stop loss methodology used by professionals.
        </p>
      </div>

      <Tabs defaultValue="methods" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="atr">ATR Stops</TabsTrigger>
          <TabsTrigger value="trailing">Trailing Stops</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
        </TabsList>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          {/* Technical Stops */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Technical Structure Stops
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The most reliable stops are placed at levels where your trade thesis is invalidated—usually 
                at technical support/resistance levels or pattern boundaries.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">Support/Resistance Stops</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Place below key support for longs</li>
                    <li>• Place above key resistance for shorts</li>
                    <li>• Add buffer for market noise (ATR-based)</li>
                    <li>• Invalidates trade if level breaks</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">Pattern-Based Stops</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Head & shoulders: below neckline</li>
                    <li>• Double bottom: below second low</li>
                    <li>• Breakout: below breakout candle low</li>
                    <li>• Trend: below prior swing low</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">Moving Average Stops</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use 20 EMA for swing trades</li>
                    <li>• Use 50/200 SMA for position trades</li>
                    <li>• Close below MA = exit signal</li>
                    <li>• Works best in trending markets</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-amber-400 mb-2">Time-Based Stops</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Exit if no move within X bars</li>
                    <li>• Day traders: 30-60 minute max</li>
                    <li>• Swing traders: 3-5 day max</li>
                    <li>• Preserves capital for better setups</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fixed vs Dynamic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Fixed vs. Dynamic Stops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Fixed Percentage Stops (Avoid)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Setting a fixed 5% or 10% stop regardless of market conditions is the hallmark 
                    of amateur trading. It ignores volatility and market structure.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>❌ Ignores actual volatility</li>
                    <li>❌ Gets stopped out by normal noise</li>
                    <li>❌ May be too wide in low-vol stocks</li>
                    <li>❌ No logical invalidation point</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Volatility-Adjusted Stops (Use This)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Professional traders use ATR (Average True Range) to size stops according to 
                    actual market volatility. This adapts automatically to conditions.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Adapts to each market's volatility</li>
                    <li>✓ Survives normal price fluctuations</li>
                    <li>✓ Tighter in calm markets (less risk)</li>
                    <li>✓ Wider in volatile markets (room to move)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ATR Tab */}
        <TabsContent value="atr" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                ATR-Based Stop Loss System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                <p className="text-lg font-semibold text-primary mb-2">The Professional Standard</p>
                <p className="text-muted-foreground">
                  ATR (Average True Range) measures how much an asset typically moves in a period. 
                  Using multiples of ATR for stops ensures your stop is sized to the actual volatility 
                  of what you're trading.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <pre className="text-lg font-mono text-center text-primary">
                  Stop Loss = Entry Price - (ATR × Multiplier)
                </pre>
              </div>

              {/* ATR Chart Visualization */}
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <StrategyIndicatorChart
                  bars={demoBars}
                  indicator="atr"
                  title="ATR Indicator"
                  description="14-period ATR showing volatility levels"
                  height={400}
                />
              </Suspense>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">1× ATR Stop</h4>
                  <p className="text-sm text-muted-foreground">
                    Very tight stop for scalping. Expects immediate follow-through. High win rate 
                    trades only.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Use: Momentum breakouts</p>
                </div>

                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <h4 className="font-semibold text-primary mb-2">2× ATR Stop (Standard)</h4>
                  <p className="text-sm text-muted-foreground">
                    The most common professional setting. Gives room for normal market noise while 
                    protecting from real reversals.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Use: Swing trades, most setups</p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-purple-400 mb-2">3× ATR Stop</h4>
                  <p className="text-sm text-muted-foreground">
                    Wide stop for position trades. Survives volatility spikes but requires 
                    smaller position size.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Use: Position trades, volatile markets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ATR by Market */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                ATR Multipliers by Market Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="text-left py-2 px-3">Market</th>
                      <th className="text-left py-2 px-3">Typical ATR %</th>
                      <th className="text-left py-2 px-3">Recommended Multiplier</th>
                      <th className="text-left py-2 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">Large Cap Stocks</td>
                      <td className="py-2 px-3">1-2%</td>
                      <td className="py-2 px-3 text-primary">2.0×</td>
                      <td className="py-2 px-3 text-muted-foreground">Lower volatility, tighter stops OK</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">Small Cap Stocks</td>
                      <td className="py-2 px-3">3-5%</td>
                      <td className="py-2 px-3 text-primary">2.5×</td>
                      <td className="py-2 px-3 text-muted-foreground">More volatile, need wider stops</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">Forex (Majors)</td>
                      <td className="py-2 px-3">0.5-1%</td>
                      <td className="py-2 px-3 text-primary">1.5-2×</td>
                      <td className="py-2 px-3 text-muted-foreground">Low vol, but leverage makes it feel bigger</td>
                    </tr>
                    <tr className="border-b border-muted/50">
                      <td className="py-2 px-3">Crypto (BTC)</td>
                      <td className="py-2 px-3">3-8%</td>
                      <td className="py-2 px-3 text-primary">2.5-3×</td>
                      <td className="py-2 px-3 text-muted-foreground">High volatility, wide stops essential</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Commodities</td>
                      <td className="py-2 px-3">1-3%</td>
                      <td className="py-2 px-3 text-primary">2×</td>
                      <td className="py-2 px-3 text-muted-foreground">Can spike on news, be cautious</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trailing Tab */}
        <TabsContent value="trailing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Trailing Stop Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Trailing stops move your stop loss upward (for longs) as price advances, locking in profits 
                while giving the trade room to breathe. The key is choosing the right trailing method for 
                your trading style.
              </p>

              <div className="space-y-4">
                {/* ATR Trailing */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary">Most Popular</Badge>
                    ATR Trailing Stop (Chandelier Exit)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Trail stop at highest high minus N×ATR. Invented by Charles LeBeau, used by trend followers.
                  </p>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    Stop = Highest High (22 periods) - 3×ATR
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-green-400">✓</span> Adapts to volatility automatically
                    <br /><span className="text-green-400">✓</span> Locks in profits during trends
                    <br /><span className="text-amber-400">!</span> May exit too early in choppy markets
                  </div>
                </div>

                {/* Percentage Trailing */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold text-blue-400 mb-2">Percentage Trailing Stop</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Simple: trail at a fixed percentage below the highest price reached.
                  </p>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    Stop = Highest High × (1 - Trail%)
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-green-400">✓</span> Simple to implement
                    <br /><span className="text-red-400">✗</span> Doesn't adapt to volatility
                    <br /><span className="text-amber-400">!</span> Best for position trades in stable instruments
                  </div>
                </div>

                {/* Swing Low Trailing */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold text-purple-400 mb-2">Swing Low Trailing Stop</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Move stop to below each higher swing low as uptrend progresses.
                  </p>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    Stop = Prior Swing Low - Buffer
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-green-400">✓</span> Based on actual market structure
                    <br /><span className="text-green-400">✓</span> Stays in trends longer
                    <br /><span className="text-amber-400">!</span> Requires manual adjustment
                  </div>
                </div>

                {/* Time-Based Tightening */}
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold text-amber-400 mb-2">Time-Based Tightening</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tighten stop as trade matures. Reduces ATR multiplier over time.
                  </p>
                  <div className="bg-muted/50 p-3 rounded font-mono text-sm">
                    Day 1-3: 3×ATR → Day 4-7: 2×ATR → Day 8+: 1.5×ATR
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-green-400">✓</span> Protects profits as trade matures
                    <br /><span className="text-green-400">✓</span> Accounts for reduced edge over time
                    <br /><span className="text-amber-400">!</span> More complex to manage
                  </div>
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
                Stop Loss Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entry">Entry Price ($)</Label>
                    <Input
                      id="entry"
                      type="number"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="atr">Current ATR (14-period)</Label>
                    <Input
                      id="atr"
                      type="number"
                      step="0.1"
                      value={atrValue}
                      onChange={(e) => setAtrValue(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>ATR Multiplier: {atrMultiplier}×</Label>
                    <Slider
                      value={[atrMultiplier]}
                      onValueChange={(v) => setAtrMultiplier(v[0])}
                      min={1}
                      max={4}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">ATR-Based Stop</p>
                    <p className="text-3xl font-bold text-primary">${stopCalculations.atrStop.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stopCalculations.atrStopPercent.toFixed(1)}% below entry
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm text-muted-foreground">2% Stop</p>
                      <p className="text-xl font-bold">${stopCalculations.percentStop2.toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30 border">
                      <p className="text-sm text-muted-foreground">5% Stop</p>
                      <p className="text-xl font-bold">${stopCalculations.percentStop5.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-400 text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Risk per share (ATR method): ${stopCalculations.riskPerShare2ATR.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Psychology Tab */}
        <TabsContent value="psychology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                The Psychology of Stop Losses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  The Hardest Part of Trading
                </p>
                <p className="text-sm text-muted-foreground">
                  Setting a stop loss is easy. Honoring it when price approaches is the hardest thing in trading. 
                  Your brain will create compelling reasons to move the stop or remove it entirely. This is 
                  normal—but it will destroy your account.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-red-400 mb-2">Common Rationalizations</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>"It's just market makers hunting stops"</li>
                    <li>"I'll just wait for it to come back"</li>
                    <li>"The fundamentals are still good"</li>
                    <li>"I'll add to my position to average down"</li>
                    <li>"I can't afford to take this loss"</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">Professional Mindset</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>"This loss is the cost of doing business"</li>
                    <li>"My stop is my protection, not my enemy"</li>
                    <li>"Being wrong is fine; staying wrong is fatal"</li>
                    <li>"There will always be another trade"</li>
                    <li>"Small losses are acceptable; large losses are not"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Stop Loss Mistakes That Blow Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Moving stops further away",
                    consequence: "Turns small losses into account-destroying losses",
                    fix: "Decide stop before entry. Never move it further."
                  },
                  {
                    mistake: "Not using stops at all",
                    consequence: "One catastrophic loss wipes out months of gains",
                    fix: "No trade without a predefined exit point"
                  },
                  {
                    mistake: "Stops too tight (getting stopped out constantly)",
                    consequence: "Death by 1000 cuts, even with winning system",
                    fix: "Use ATR-based stops; give trades room to work"
                  },
                  {
                    mistake: "Mental stops instead of actual orders",
                    consequence: "Emotions prevent execution when needed",
                    fix: "Always place actual stop orders in the market"
                  },
                  {
                    mistake: "Using round numbers for stops",
                    consequence: "Stop hunting at obvious levels",
                    fix: "Place stops at odd prices, slightly beyond obvious levels"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card">
                    <p className="font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {item.mistake}
                    </p>
                    <p className="text-sm text-red-400/80 mt-1">{item.consequence}</p>
                    <p className="text-sm text-green-400 mt-2">✓ {item.fix}</p>
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

export default StopLossVisualizer;
