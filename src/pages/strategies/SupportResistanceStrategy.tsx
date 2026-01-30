import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Target, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticleSection, TradingRule, PatternChecklist } from "@/components/blog/ArticleSection";

const SupportResistanceStrategy = () => {
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
            <Badge variant="secondary">Beginner</Badge>
            <Badge className="bg-green-500/20 text-green-400">Price Action</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Support & Resistance Strategy</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Master the foundational trading strategy that underpins all technical analysis — identifying and trading key support and resistance levels for consistent profits.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 12 min read</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> 60-68% Win Rate</span>
            <span className="flex items-center gap-1"><Target className="h-4 w-4" /> 2:1 - 3:1 R:R</span>
          </div>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">60-68%</div>
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
              <div className="text-2xl font-bold text-amber-400">High</div>
              <div className="text-sm text-muted-foreground">Frequency</div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <ArticleSection title="What is Support and Resistance?">
            <p>
              Support and resistance are price levels where buying and selling pressure historically emerges, causing price to pause, reverse, or consolidate.
            </p>
            <ul>
              <li><strong>Support:</strong> A price level where buying interest prevents further decline (floor)</li>
              <li><strong>Resistance:</strong> A price level where selling interest prevents further advance (ceiling)</li>
            </ul>
            <p>
              These levels work because traders remember previous price reactions and place orders accordingly, creating self-fulfilling prophecies.
            </p>
          </ArticleSection>

          <ArticleSection title="Types of Support/Resistance">
            <ul>
              <li><strong>Horizontal S/R:</strong> Static levels from previous highs/lows</li>
              <li><strong>Dynamic S/R:</strong> Moving averages (20, 50, 200 EMA)</li>
              <li><strong>Trend Line S/R:</strong> Diagonal lines connecting swing points</li>
              <li><strong>Psychological S/R:</strong> Round numbers ($100, $50, $10)</li>
              <li><strong>Fibonacci S/R:</strong> Retracement levels (38.2%, 50%, 61.8%)</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Identifying Strong Levels">
            <p>Not all S/R levels are equal. The strongest levels share these characteristics:</p>
            <ul>
              <li><strong>Multiple Touches:</strong> Price has tested the level 2-3+ times</li>
              <li><strong>Time Significance:</strong> Level visible on higher timeframes</li>
              <li><strong>Volume:</strong> High volume on tests indicates strong interest</li>
              <li><strong>Reaction Strength:</strong> Sharp rejections vs. gradual turns</li>
              <li><strong>Confluence:</strong> Multiple S/R types align at same level</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Support Bounce Strategy (Long)">
            <TradingRule
              type="entry"
              title="Long Entry at Support"
            >
              <ul>
                <li>Identify clear support level with 2+ previous touches</li>
                <li>Wait for price to approach support</li>
                <li>Look for bullish reversal candle (hammer, engulfing, morning star)</li>
                <li>Volume should decrease on approach, increase on bounce</li>
                <li>Enter on close of confirmation candle</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Resistance Rejection Strategy (Short)">
            <TradingRule
              type="entry"
              title="Short Entry at Resistance"
            >
              <ul>
                <li>Identify clear resistance with 2+ previous touches</li>
                <li>Wait for price to approach resistance</li>
                <li>Look for bearish reversal candle (shooting star, bearish engulfing)</li>
                <li>Volume pattern: decrease on approach, increase on rejection</li>
                <li>Enter on close of confirmation candle</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Breakout & Retest Strategy">
            <p>When price breaks through S/R, old resistance becomes new support (and vice versa):</p>
            <TradingRule
              type="entry"
              title="Break & Retest Entry"
            >
              <ul>
                <li>Wait for decisive break of S/R (close beyond level)</li>
                <li>Breakout should have increased volume</li>
                <li>Wait for pullback to test the broken level</li>
                <li>Enter when price confirms the flip (old R now S)</li>
                <li>Stop below the new support zone</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Stop Loss Placement">
            <TradingRule
              type="stop"
              title="S/R Stop Loss Rules"
            >
              <ul>
                <li><strong>Bounce Trade:</strong> Stop below support (add ATR buffer)</li>
                <li><strong>Rejection Trade:</strong> Stop above resistance (add ATR buffer)</li>
                <li><strong>Breakout Retest:</strong> Stop on wrong side of broken level</li>
                <li>Buffer size: 0.5-1 ATR beyond the level</li>
                <li>Max risk: 1-2% per trade</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Take Profit Targets">
            <TradingRule
              type="target"
              title="S/R Profit Targets"
            >
              <ul>
                <li><strong>TP1 (50%):</strong> Next S/R level (minimum 1.5:1 R:R)</li>
                <li><strong>TP2 (30%):</strong> Major S/R zone or round number</li>
                <li><strong>TP3 (20%):</strong> Trail with moving average or break structure</li>
                <li>Use measured move from range if trading range breakout</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Zone vs. Line Approach">
            <p>
              Professional traders think in <strong>zones</strong>, not exact lines:
            </p>
            <ul>
              <li>Mark S/R as a zone spanning recent wicks</li>
              <li>Zone width: Typically 0.5-1% of price</li>
              <li>Allow price to enter the zone before triggering</li>
              <li>Confirmation must occur within or at the zone edge</li>
            </ul>
            <p>
              This approach accounts for market noise and prevents premature entries.
            </p>
          </ArticleSection>

          <ArticleSection title="Quality Setup Checklist">
            <PatternChecklist
              title="High-Probability S/R Signals"
              items={[
                { text: "Level has 2+ previous significant touches", critical: true },
                { text: "Level visible on higher timeframe", critical: true },
                { text: "Clear reversal candlestick confirmation", critical: true },
                { text: "Trend direction aligns (bounce in uptrend, reject in downtrend)", critical: false },
                { text: "Volume pattern confirms (decrease then spike)", critical: false },
                { text: "Confluence with other indicators (MA, Fib, trendline)", critical: false },
              ]}
            />
          </ArticleSection>

          <ArticleSection title="Combining with Other Tools">
            <p>S/R works best when combined with:</p>
            <ul>
              <li><strong>Candlestick Patterns:</strong> Pin bars, engulfing at levels</li>
              <li><strong>Moving Averages:</strong> 50/200 MA at S/R = confluence</li>
              <li><strong>Fibonacci:</strong> Fib levels aligning with horizontal S/R</li>
              <li><strong>RSI:</strong> Oversold at support, overbought at resistance</li>
              <li><strong>Volume Profile:</strong> High volume nodes as S/R</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Common Mistakes">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-semibold text-red-400">Avoid These Errors</span>
              </div>
              <ul className="mb-0">
                <li>Drawing too many levels (creates analysis paralysis)</li>
                <li>Using exact price lines instead of zones</li>
                <li>Ignoring higher timeframe levels</li>
                <li>Trading weak levels with only 1 touch</li>
                <li>Not waiting for confirmation candlestick</li>
                <li>Counter-trend trading at minor levels</li>
              </ul>
            </div>
          </ArticleSection>

          <ArticleSection title="Performance Expectations">
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expected Win Rate</div>
                    <div className="text-xl font-bold text-green-400">60-68%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Average R:R</div>
                    <div className="text-xl font-bold text-blue-400">2:1 - 3:1</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Trades per Week</div>
                    <div className="text-xl font-bold text-purple-400">5-15</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Best Timeframes</div>
                    <div className="text-xl font-bold text-amber-400">1H, 4H, D</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ArticleSection>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
            <Link to="/learn/strategies/fibonacci" className="text-primary hover:underline">
              ← Fibonacci Strategy
            </Link>
            <Link to="/learn/strategies/gap-trading" className="text-primary hover:underline">
              Gap Trading Strategy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportResistanceStrategy;
