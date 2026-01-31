/**
 * PineScriptVisualizer - Pine Script Development Education
 * 
 * Professional-grade content covering:
 * - Pine Script basics
 * - Indicator development
 * - Strategy creation
 * - Backtesting and alerts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BookOpen,
  Lightbulb,
  BarChart3,
  Target,
  Zap,
  Bell,
  LineChart,
  TrendingUp
} from 'lucide-react';

export const PineScriptVisualizer = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Code2 className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Custom Pine Script Development</h2>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">TradingView</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Pine Script is TradingView's programming language for creating custom indicators, strategies, 
          and alerts. With millions of users, TradingView provides free infrastructure for backtesting 
          and alerting. This guide takes you from zero to deploying your own trading systems.
        </p>
      </div>

      <Tabs defaultValue="basics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Tips</TabsTrigger>
        </TabsList>

        {/* Basics Tab */}
        <TabsContent value="basics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Pine Script Fundamentals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-primary font-semibold mb-2">Two Types of Scripts</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-muted/50">
                    <LineChart className="w-5 h-5 text-blue-400 mb-1" />
                    <p className="font-semibold">indicator()</p>
                    <p className="text-sm text-muted-foreground">Overlays or oscillators. No trade logic.</p>
                  </div>
                  <div className="p-3 rounded bg-muted/50">
                    <TrendingUp className="w-5 h-5 text-green-400 mb-1" />
                    <p className="font-semibold">strategy()</p>
                    <p className="text-sm text-muted-foreground">Full trading logic with backtesting.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Your First Pine Script</h4>
                <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`//@version=5
indicator("My First Indicator", overlay=true)

// Input parameters
length = input.int(20, title="MA Length")

// Calculate moving average
ma = ta.sma(close, length)

// Plot on chart
plot(ma, color=color.blue, linewidth=2, title="SMA")`}</pre>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-blue-400 mb-2">Key Built-in Variables</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code className="bg-muted px-1 rounded">open, high, low, close</code>
                      <span className="text-muted-foreground">Price data</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-muted px-1 rounded">volume</code>
                      <span className="text-muted-foreground">Bar volume</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-muted px-1 rounded">bar_index</code>
                      <span className="text-muted-foreground">Bar number</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-muted px-1 rounded">time</code>
                      <span className="text-muted-foreground">Unix timestamp</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <h4 className="font-semibold text-green-400 mb-2">Key Functions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code className="bg-muted px-1 rounded">ta.sma()</code>
                      <span className="text-muted-foreground">Moving average</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-muted px-1 rounded">ta.rsi()</code>
                      <span className="text-muted-foreground">RSI indicator</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-muted px-1 rounded">ta.crossover()</code>
                      <span className="text-muted-foreground">Cross detection</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-muted px-1 rounded">ta.highest()</code>
                      <span className="text-muted-foreground">Highest value</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indicators Tab */}
        <TabsContent value="indicators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Building Custom Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Multi-Timeframe RSI with Divergence</h4>
                <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`//@version=5
indicator("MTF RSI Divergence", overlay=false)

// Inputs
rsi_len = input.int(14, "RSI Length")
htf = input.timeframe("D", "Higher Timeframe")

// Current TF RSI
rsi = ta.rsi(close, rsi_len)

// Higher TF RSI
htf_rsi = request.security(syminfo.tickerid, htf, ta.rsi(close, rsi_len))

// Divergence detection
price_higher = high > high[1] and high[1] > high[2]
rsi_lower = rsi < rsi[1] and rsi[1] < rsi[2]
bearish_div = price_higher and rsi_lower

price_lower = low < low[1] and low[1] < low[2]
rsi_higher = rsi > rsi[1] and rsi[1] > rsi[2]
bullish_div = price_lower and rsi_higher

// Plotting
plot(rsi, color=color.blue, title="RSI")
plot(htf_rsi, color=color.orange, title="HTF RSI")
hline(70, color=color.red, linestyle=hline.style_dashed)
hline(30, color=color.green, linestyle=hline.style_dashed)

// Divergence markers
plotshape(bearish_div, style=shape.triangledown, location=location.top, 
          color=color.red, size=size.small, title="Bearish Div")
plotshape(bullish_div, style=shape.triangleup, location=location.bottom, 
          color=color.green, size=size.small, title="Bullish Div")`}</pre>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Custom Volatility Band</h4>
                <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`//@version=5
indicator("ATR Volatility Bands", overlay=true)

// Inputs
length = input.int(20, "Length")
mult = input.float(2.0, "Multiplier")
src = input.source(close, "Source")

// Calculate ATR-based bands
basis = ta.sma(src, length)
atr = ta.atr(length)
upper = basis + (mult * atr)
lower = basis - (mult * atr)

// Coloring based on trend
trend_up = close > basis
band_color = trend_up ? color.new(color.green, 80) : color.new(color.red, 80)

// Plotting
p1 = plot(upper, color=color.green, title="Upper")
p2 = plot(lower, color=color.red, title="Lower")
plot(basis, color=color.blue, title="Basis")
fill(p1, p2, color=band_color)`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Building Trading Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-primary font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Strategy vs Indicator
                </p>
                <p className="text-sm text-muted-foreground">
                  Strategies use <code className="bg-muted px-1 rounded">strategy.entry()</code> and 
                  <code className="bg-muted px-1 rounded ml-1">strategy.close()</code> to simulate trades. 
                  They show profit/loss, drawdown, and generate trade lists in the Strategy Tester panel.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Complete EMA Crossover Strategy</h4>
                <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`//@version=5
strategy("EMA Crossover Strategy", overlay=true, 
         default_qty_type=strategy.percent_of_equity, 
         default_qty_value=100)

// Inputs
fast_len = input.int(9, "Fast EMA")
slow_len = input.int(21, "Slow EMA")
use_sl = input.bool(true, "Use Stop Loss")
sl_pct = input.float(2.0, "Stop Loss %")
use_tp = input.bool(true, "Use Take Profit")
tp_pct = input.float(4.0, "Take Profit %")

// Calculate EMAs
fast_ema = ta.ema(close, fast_len)
slow_ema = ta.ema(close, slow_len)

// Entry conditions
long_cond = ta.crossover(fast_ema, slow_ema)
short_cond = ta.crossunder(fast_ema, slow_ema)

// Calculate SL/TP levels
long_sl = close * (1 - sl_pct/100)
long_tp = close * (1 + tp_pct/100)
short_sl = close * (1 + sl_pct/100)
short_tp = close * (1 - tp_pct/100)

// Strategy execution
if long_cond
    strategy.entry("Long", strategy.long)
    if use_sl
        strategy.exit("Long Exit", "Long", stop=long_sl, limit=use_tp ? long_tp : na)

if short_cond
    strategy.entry("Short", strategy.short)
    if use_sl
        strategy.exit("Short Exit", "Short", stop=short_sl, limit=use_tp ? short_tp : na)

// Plotting
plot(fast_ema, color=color.blue, title="Fast EMA")
plot(slow_ema, color=color.orange, title="Slow EMA")

// Entry markers
plotshape(long_cond, style=shape.triangleup, location=location.belowbar, 
          color=color.green, size=size.small)
plotshape(short_cond, style=shape.triangledown, location=location.abovebar, 
          color=color.red, size=size.small)`}</pre>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-semibold text-green-400 mb-2">Strategy Properties</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><code>initial_capital</code> - Starting balance</li>
                    <li><code>default_qty_type</code> - Percent or fixed</li>
                    <li><code>commission_type</code> - Per trade or percent</li>
                    <li><code>slippage</code> - Simulated slippage</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-semibold text-blue-400 mb-2">Key Functions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><code>strategy.entry()</code> - Open position</li>
                    <li><code>strategy.close()</code> - Close position</li>
                    <li><code>strategy.exit()</code> - SL/TP orders</li>
                    <li><code>strategy.cancel_all()</code> - Cancel orders</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Setting Up Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold mb-2">Alert Conditions in Pine Script</h4>
                <div className="bg-muted/50 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{`//@version=5
indicator("Alert Example", overlay=true)

// Conditions
long_signal = ta.crossover(ta.ema(close, 9), ta.ema(close, 21))
short_signal = ta.crossunder(ta.ema(close, 9), ta.ema(close, 21))

// Plot signals
plotshape(long_signal, style=shape.triangleup, location=location.belowbar, 
          color=color.green)
plotshape(short_signal, style=shape.triangledown, location=location.abovebar, 
          color=color.red)

// Alert conditions
alertcondition(long_signal, title="Long Signal", 
               message="EMA Crossover BUY on {{ticker}} at {{close}}")
alertcondition(short_signal, title="Short Signal", 
               message="EMA Crossover SELL on {{ticker}} at {{close}}")`}</pre>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Webhook Alerts for Automation
                </p>
                <p className="text-sm text-muted-foreground">
                  TradingView can send webhook alerts to external services. Use this to automate 
                  trade execution with brokers like Alpaca, Interactive Brokers, or custom bots.
                </p>
                <div className="bg-muted/50 p-3 rounded font-mono text-sm mt-2">
                  {`{"action": "buy", "ticker": "{{ticker}}", "price": {{close}}}`}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Common Pine Script Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    mistake: "Using request.security() incorrectly",
                    fix: "Always use barmerge.lookahead_off in request.security() to avoid lookahead bias"
                  },
                  {
                    mistake: "Repainting indicators",
                    fix: "Use confirmed bar data with barstate.isconfirmed or [1] for closed bars only"
                  },
                  {
                    mistake: "Not accounting for bar_index limits",
                    fix: "Charts only load ~10k bars. Use bar_index >= min_bars checks"
                  },
                  {
                    mistake: "Overcomplicating scripts",
                    fix: "Keep it simple. Complex scripts are harder to debug and often slower"
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

export default PineScriptVisualizer;
