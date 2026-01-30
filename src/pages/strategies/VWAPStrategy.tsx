import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Target, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticleSection, TradingRule, PatternChecklist } from "@/components/blog/ArticleSection";

const VWAPStrategy = () => {
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
            <Badge className="bg-blue-500/20 text-blue-400">Intraday</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">VWAP Trading Strategy</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Learn to trade with VWAP (Volume Weighted Average Price) — the institutional benchmark used by professional traders to identify fair value and optimal entry points.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 10 min read</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> 65-72% Win Rate</span>
            <span className="flex items-center gap-1"><Target className="h-4 w-4" /> 1.5:1 - 2:1 R:R</span>
          </div>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">65-72%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">1.8:1</div>
              <div className="text-sm text-muted-foreground">Avg R:R</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">Intraday</div>
              <div className="text-sm text-muted-foreground">Best Use</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">High</div>
              <div className="text-sm text-muted-foreground">Frequency</div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <ArticleSection title="What is VWAP?">
            <p>
              VWAP (Volume Weighted Average Price) represents the average price a security has traded at throughout the day, weighted by volume. It's the benchmark institutional traders use to evaluate execution quality.
            </p>
            <p>
              The formula: <code>VWAP = Σ(Price × Volume) / Σ(Volume)</code>
            </p>
            <p>
              Key characteristics of VWAP:
            </p>
            <ul>
              <li>Resets at the start of each trading session</li>
              <li>Represents "fair value" for the current session</li>
              <li>Acts as dynamic support/resistance throughout the day</li>
              <li>Becomes more stable as the day progresses</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Why Institutions Use VWAP">
            <p>
              Understanding institutional behavior gives retail traders an edge:
            </p>
            <ul>
              <li><strong>Benchmark Execution:</strong> Funds aim to buy below VWAP, sell above</li>
              <li><strong>Accumulation Zone:</strong> Price below VWAP = institutional buying likely</li>
              <li><strong>Distribution Zone:</strong> Price above VWAP = institutional selling likely</li>
              <li><strong>Mean Reversion:</strong> Price tends to return to VWAP</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="VWAP Bands Strategy">
            <p>
              Standard deviation bands around VWAP create trading zones:
            </p>
            <ul>
              <li><strong>Upper Band (+2σ):</strong> Overbought — look for short entries</li>
              <li><strong>Upper Band (+1σ):</strong> Extended — tighten stops on longs</li>
              <li><strong>VWAP Line:</strong> Fair value — key decision point</li>
              <li><strong>Lower Band (-1σ):</strong> Extended — tighten stops on shorts</li>
              <li><strong>Lower Band (-2σ):</strong> Oversold — look for long entries</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Long Entry Rules">
            <TradingRule
              type="entry"
              title="VWAP Long Setup"
            >
              <ul>
                <li>Overall trend is bullish (higher highs on daily)</li>
                <li>Price pulls back to VWAP from above</li>
                <li>Look for rejection candle (hammer, bullish engulfing) at VWAP</li>
                <li>Volume confirms — higher volume on bounce</li>
                <li>Enter on close of confirmation candle</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Short Entry Rules">
            <TradingRule
              type="entry"
              title="VWAP Short Setup"
            >
              <ul>
                <li>Overall trend is bearish (lower highs on daily)</li>
                <li>Price rallies to VWAP from below</li>
                <li>Look for rejection candle (shooting star, bearish engulfing) at VWAP</li>
                <li>Volume confirms — higher volume on rejection</li>
                <li>Enter on close of confirmation candle</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="VWAP Breakout Strategy">
            <p>For momentum trades when price breaks through VWAP:</p>
            <TradingRule
              type="entry"
              title="VWAP Break & Retest"
            >
              <ul>
                <li>Price breaks above/below VWAP with strong momentum</li>
                <li>Wait for retest of VWAP as new support/resistance</li>
                <li>Enter on successful retest confirmation</li>
                <li>Stop loss on opposite side of VWAP</li>
                <li>Target: 2x the distance from VWAP to retest low/high</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Stop Loss Placement">
            <TradingRule
              type="stop"
              title="VWAP Stop Loss Rules"
            >
              <ul>
                <li><strong>VWAP Bounce:</strong> Stop below/above the VWAP band (-1σ or +1σ)</li>
                <li><strong>VWAP Breakout:</strong> Stop on opposite side of VWAP line</li>
                <li>Add small ATR buffer (0.3-0.5 ATR)</li>
                <li>Never exceed 1% account risk on intraday trades</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Take Profit Targets">
            <TradingRule
              type="target"
              title="Profit Targets"
            >
              <ul>
                <li><strong>TP1 (50%):</strong> Opposite VWAP band (e.g., +1σ if entered at -1σ)</li>
                <li><strong>TP2 (30%):</strong> Previous day high/low or key level</li>
                <li><strong>TP3 (20%):</strong> +2σ or -2σ band</li>
                <li>Trail stops using VWAP as dynamic trailing level</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Best Time to Trade VWAP">
            <p>VWAP effectiveness varies throughout the trading day:</p>
            <ul>
              <li><strong>First 30 Minutes:</strong> VWAP volatile — avoid or scalp only</li>
              <li><strong>Mid-Morning (10:00-11:30):</strong> VWAP stabilizes — best setups form</li>
              <li><strong>Lunch (11:30-14:00):</strong> Low volume — signals less reliable</li>
              <li><strong>Afternoon (14:00-15:30):</strong> Good setups as volume returns</li>
              <li><strong>Final Hour:</strong> High volume but VWAP anchored — reversions likely</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Quality Signal Checklist">
            <PatternChecklist
              title="High-Probability VWAP Signals"
              items={[
                { text: "Price respects VWAP level (multiple touches)", critical: true },
                { text: "Volume increases on test/break of VWAP", critical: true },
                { text: "Trend direction aligns with trade", critical: true },
                { text: "Clear rejection candle pattern at VWAP", critical: false },
                { text: "Mid-session timing (10:00-15:00)", critical: false },
                { text: "Pre-market levels don't conflict", critical: false },
              ]}
            />
          </ArticleSection>

          <ArticleSection title="Combining VWAP with Other Indicators">
            <p>VWAP works best when combined with:</p>
            <ul>
              <li><strong>Support/Resistance:</strong> VWAP at key levels = confluence</li>
              <li><strong>Moving Averages:</strong> 9/20 EMA alignment with VWAP</li>
              <li><strong>RSI:</strong> Oversold at VWAP support = strong long signal</li>
              <li><strong>Volume Profile:</strong> VWAP near POC = high-probability zone</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Common Mistakes">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-semibold text-red-400">Avoid These Errors</span>
              </div>
              <ul className="mb-0">
                <li>Trading VWAP during the first 30 minutes</li>
                <li>Using VWAP on overnight/swing positions (it resets daily)</li>
                <li>Ignoring the overall trend direction</li>
                <li>Trading VWAP in low-volume choppy markets</li>
                <li>Not waiting for candle confirmation at VWAP</li>
              </ul>
            </div>
          </ArticleSection>

          <ArticleSection title="Performance Expectations">
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expected Win Rate</div>
                    <div className="text-xl font-bold text-green-400">65-72%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Average R:R</div>
                    <div className="text-xl font-bold text-blue-400">1.5:1 - 2:1</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Trades per Day</div>
                    <div className="text-xl font-bold text-purple-400">2-5</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Best Markets</div>
                    <div className="text-xl font-bold text-amber-400">Stocks, Futures</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ArticleSection>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
            <Link to="/learn/strategies/rsi-divergence" className="text-primary hover:underline">
              ← RSI Divergence
            </Link>
            <Link to="/learn/strategies/fibonacci" className="text-primary hover:underline">
              Fibonacci Strategy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VWAPStrategy;
