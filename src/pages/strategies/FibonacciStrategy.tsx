import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Target, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticleSection, TradingRule, PatternChecklist } from "@/components/blog/ArticleSection";

const FibonacciStrategy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">Trading Strategies</Badge>
            <Badge variant="secondary">Intermediate</Badge>
            <Badge className="bg-amber-500/20 text-amber-400">Technical</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Fibonacci Retracement Strategy</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Master Fibonacci retracements and extensions to identify high-probability entry points and profit targets based on natural mathematical ratios.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 14 min read</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> 62-70% Win Rate</span>
            <span className="flex items-center gap-1"><Target className="h-4 w-4" /> 2:1 - 3:1 R:R</span>
          </div>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">62-70%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">2.5:1</div>
              <div className="text-sm text-muted-foreground">Avg R:R</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">All</div>
              <div className="text-sm text-muted-foreground">Timeframes</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">Medium</div>
              <div className="text-sm text-muted-foreground">Frequency</div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <ArticleSection title="Understanding Fibonacci Ratios">
            <p>
              Fibonacci ratios are derived from the Fibonacci sequence where each number is the sum of the two preceding numbers (1, 1, 2, 3, 5, 8, 13, 21...). The key ratios used in trading are:
            </p>
            <ul>
              <li><strong>23.6%:</strong> Shallow retracement — strong trends</li>
              <li><strong>38.2%:</strong> Moderate retracement — healthy pullback</li>
              <li><strong>50%:</strong> Psychological level (not true Fibonacci)</li>
              <li><strong>61.8%:</strong> Golden ratio — most watched level</li>
              <li><strong>78.6%:</strong> Deep retracement — last defense before reversal</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Drawing Fibonacci Retracements">
            <p>
              Proper Fibonacci placement is critical for accurate analysis:
            </p>
            <ul>
              <li><strong>Uptrend:</strong> Draw from swing low to swing high</li>
              <li><strong>Downtrend:</strong> Draw from swing high to swing low</li>
              <li>Use clear, significant swing points (not minor fluctuations)</li>
              <li>Align with the dominant trend on higher timeframes</li>
            </ul>
            <p>
              The 100% level represents the starting point of the move; 0% is the endpoint.
            </p>
          </ArticleSection>

          <ArticleSection title="The 61.8% Golden Pocket Strategy">
            <p>
              The zone between 61.8% and 65% is known as the "Golden Pocket" — the highest probability reversal area:
            </p>
            <TradingRule
              type="entry"
              title="Golden Pocket Entry"
            >
              <ul>
                <li>Identify a strong impulse move (trending leg)</li>
                <li>Draw Fibonacci from swing low to high (uptrend) or vice versa</li>
                <li>Wait for price to retrace into 61.8%-65% zone</li>
                <li>Look for reversal candlestick confirmation</li>
                <li>Enter with stop below 78.6% level</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="38.2% Shallow Pullback Strategy">
            <p>
              For strong trending markets, use the 38.2% level:
            </p>
            <TradingRule
              type="entry"
              title="38.2% Trend Continuation"
            >
              <ul>
                <li>Confirm strong trend momentum (steep angle, small pullbacks)</li>
                <li>Wait for pullback to 38.2% level</li>
                <li>Confirm with moving average confluence (21 EMA near 38.2%)</li>
                <li>Enter on bullish/bearish engulfing at level</li>
                <li>Stop below 50% level</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Fibonacci Extensions for Targets">
            <p>
              Use Fibonacci extensions to project profit targets beyond the original move:
            </p>
            <ul>
              <li><strong>127.2%:</strong> Conservative target — high probability</li>
              <li><strong>161.8%:</strong> Standard target — balanced R:R</li>
              <li><strong>200%:</strong> Extended target — trend continuation</li>
              <li><strong>261.8%:</strong> Aggressive target — strong momentum only</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Stop Loss Placement">
            <TradingRule
              type="stop"
              title="Fibonacci Stop Loss Rules"
            >
              <ul>
                <li><strong>61.8% Entry:</strong> Stop below 78.6% (or slightly beyond)</li>
                <li><strong>50% Entry:</strong> Stop below 61.8%</li>
                <li><strong>38.2% Entry:</strong> Stop below 50%</li>
                <li>Add ATR buffer for volatility</li>
                <li>Invalid if price closes beyond 100% (original swing)</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Take Profit Targets">
            <TradingRule
              type="target"
              title="Fibonacci Profit Targets"
            >
              <ul>
                <li><strong>TP1 (40%):</strong> 0% level (previous swing high/low)</li>
                <li><strong>TP2 (35%):</strong> -27.2% extension (127.2%)</li>
                <li><strong>TP3 (25%):</strong> -61.8% extension (161.8%)</li>
                <li>Trail remaining position with 20 EMA</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Fibonacci Confluence Zones">
            <p>
              The most powerful setups occur when Fibonacci levels align with other technical factors:
            </p>
            <ul>
              <li><strong>Horizontal Support/Resistance:</strong> Fib level at prior high/low</li>
              <li><strong>Moving Averages:</strong> 50/200 MA at Fib level</li>
              <li><strong>Trend Lines:</strong> Ascending/descending line meets Fib</li>
              <li><strong>Previous Fibonacci:</strong> Multiple Fib levels cluster</li>
              <li><strong>Round Numbers:</strong> Psychological price at Fib level</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Quality Setup Checklist">
            <PatternChecklist
              title="High-Quality Fibonacci Signals"
              items={[
                { text: "Clear impulse move with defined swing points", critical: true },
                { text: "Fibonacci level aligns with other S/R", critical: true },
                { text: "Reversal candlestick at Fib level", critical: true },
                { text: "Higher timeframe trend supports direction", critical: false },
                { text: "Volume decreases during retracement", critical: false },
                { text: "RSI/momentum confirms reversal", critical: false },
              ]}
            />
          </ArticleSection>

          <ArticleSection title="Multi-Timeframe Fibonacci">
            <p>
              Layer Fibonacci from different timeframes for confluence:
            </p>
            <ol>
              <li><strong>Weekly:</strong> Draw major Fib levels for context</li>
              <li><strong>Daily:</strong> Identify current swing for trade Fib</li>
              <li><strong>4H/1H:</strong> Fine-tune entry at matching levels</li>
            </ol>
            <p>
              When Fib levels from multiple timeframes align (within 0.5%), it creates a high-probability zone.
            </p>
          </ArticleSection>

          <ArticleSection title="Common Mistakes">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-semibold text-red-400">Avoid These Errors</span>
              </div>
              <ul className="mb-0">
                <li>Drawing Fibs on minor swings instead of significant moves</li>
                <li>Ignoring the trend direction when taking entries</li>
                <li>Not waiting for confirmation at Fib levels</li>
                <li>Using Fibs in choppy, ranging markets</li>
                <li>Expecting exact bounces (use zones, not lines)</li>
              </ul>
            </div>
          </ArticleSection>

          <ArticleSection title="Best Markets for Fibonacci">
            <ul>
              <li><strong>Forex:</strong> Excellent on all major pairs — clear trends</li>
              <li><strong>Indices:</strong> S&P 500, NASDAQ — institutional levels respected</li>
              <li><strong>Commodities:</strong> Gold, Oil — Fibs work well with trends</li>
              <li><strong>Crypto:</strong> BTC, ETH on 4H+ — good for swing trades</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Performance Expectations">
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expected Win Rate</div>
                    <div className="text-xl font-bold text-green-400">62-70%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Average R:R</div>
                    <div className="text-xl font-bold text-blue-400">2:1 - 3:1</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Trades per Week</div>
                    <div className="text-xl font-bold text-purple-400">3-8</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Best Timeframes</div>
                    <div className="text-xl font-bold text-amber-400">4H, D, W</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ArticleSection>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
            <Link to="/learn/strategies/vwap" className="text-primary hover:underline">
              ← VWAP Strategy
            </Link>
            <Link to="/learn/strategies/support-resistance" className="text-primary hover:underline">
              Support/Resistance Strategy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FibonacciStrategy;
