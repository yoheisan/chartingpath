import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Target, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticleSection, TradingRule, PatternChecklist } from "@/components/blog/ArticleSection";

const GapTradingStrategy = () => {
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
            <Badge className="bg-orange-500/20 text-orange-400">Intraday</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">Gap Trading Strategy</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Learn to profit from price gaps — the high-probability setups that occur when markets open significantly higher or lower than the previous close.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 11 min read</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> 65-75% Win Rate</span>
            <span className="flex items-center gap-1"><Target className="h-4 w-4" /> 1.5:1 - 2:1 R:R</span>
          </div>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">65-75%</div>
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
              <div className="text-2xl font-bold text-purple-400">Open</div>
              <div className="text-sm text-muted-foreground">Best Time</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">Daily</div>
              <div className="text-sm text-muted-foreground">Frequency</div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <ArticleSection title="What is a Price Gap?">
            <p>
              A gap occurs when a security opens at a price significantly different from its previous close, leaving an empty space on the chart where no trading occurred.
            </p>
            <ul>
              <li><strong>Gap Up:</strong> Open price is above prior day's high</li>
              <li><strong>Gap Down:</strong> Open price is below prior day's low</li>
              <li><strong>Full Gap:</strong> Open outside prior day's entire range</li>
              <li><strong>Partial Gap:</strong> Open beyond prior close but within range</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Types of Gaps">
            <p>Understanding gap types helps predict behavior:</p>
            <ul>
              <li><strong>Common Gaps:</strong> Small, occur in ranges — usually fill quickly (70%+ fill rate)</li>
              <li><strong>Breakaway Gaps:</strong> Large, break key S/R — often don't fill; signal new trends</li>
              <li><strong>Runaway/Continuation Gaps:</strong> Mid-trend gaps — momentum continuation</li>
              <li><strong>Exhaustion Gaps:</strong> End of trend gaps — reversal imminent; fill quickly</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Gap Fill Strategy (Mean Reversion)">
            <p>Most gaps fill within the same session — capitalize on this tendency:</p>
            <TradingRule
              type="entry"
              title="Gap Fill Long (Gap Down)"
            >
              <ul>
                <li>Identify gap down of 0.5-2% (too large = may not fill)</li>
                <li>Wait 15-30 minutes for opening range to establish</li>
                <li>Look for reversal signs: bullish candle, RSI oversold</li>
                <li>Enter long targeting previous close</li>
                <li>Stop below the morning low (or opening range low)</li>
              </ul>
            </TradingRule>

            <TradingRule
              type="entry"
              title="Gap Fill Short (Gap Up)"
            >
              <ul>
                <li>Identify gap up of 0.5-2%</li>
                <li>Wait 15-30 minutes for opening range</li>
                <li>Look for reversal: bearish candle, RSI overbought</li>
                <li>Enter short targeting previous close</li>
                <li>Stop above the morning high</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Gap & Go Strategy (Momentum)">
            <p>Ride momentum when strong gaps extend rather than fill:</p>
            <TradingRule
              type="entry"
              title="Gap & Go Entry"
            >
              <ul>
                <li>Identify gap with catalyst (earnings, news, sector move)</li>
                <li>Gap size: 3%+ typically needed for continuation</li>
                <li>Wait for first pullback after market open</li>
                <li>Enter on break of first candle high (long) or low (short)</li>
                <li>Volume should be 2x+ normal average</li>
                <li>Target: Extension levels or prior resistance</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Opening Range Breakout with Gaps">
            <p>Combine gap analysis with opening range:</p>
            <TradingRule
              type="entry"
              title="Gap ORB Strategy"
            >
              <ul>
                <li>Mark the first 15 or 30-minute range after open</li>
                <li><strong>Gap Up + Break Above Range:</strong> Strong long signal</li>
                <li><strong>Gap Up + Break Below Range:</strong> Failed gap, strong short</li>
                <li><strong>Gap Down + Break Below Range:</strong> Strong short signal</li>
                <li><strong>Gap Down + Break Above Range:</strong> Failed gap, strong long</li>
                <li>Enter on break with stop at opposite range boundary</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Stop Loss Placement">
            <TradingRule
              type="stop"
              title="Gap Trade Stop Loss"
            >
              <ul>
                <li><strong>Gap Fill:</strong> Beyond the opening range extreme</li>
                <li><strong>Gap & Go:</strong> Below first pullback low (longs) / above high (shorts)</li>
                <li><strong>ORB Break:</strong> Opposite side of the opening range</li>
                <li>Max risk: 1% account on gap trades (volatile)</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Take Profit Targets">
            <TradingRule
              type="target"
              title="Gap Trade Targets"
            >
              <ul>
                <li><strong>Gap Fill:</strong> Previous close (primary target)</li>
                <li><strong>Gap & Go TP1:</strong> Measured move (gap size projected from entry)</li>
                <li><strong>Gap & Go TP2:</strong> Prior swing high/low or key resistance</li>
                <li><strong>ORB:</strong> 1x, 1.5x, 2x the opening range height</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Gap Trading Filters">
            <p>Increase win rate by filtering setups:</p>
            <ul>
              <li><strong>Size Filter:</strong> 0.5-2% for fills; 3%+ for continuation</li>
              <li><strong>Volume Filter:</strong> Gap on above-average volume = more reliable</li>
              <li><strong>Catalyst:</strong> News-driven gaps more likely to run</li>
              <li><strong>Trend Filter:</strong> Trade gaps in direction of larger trend</li>
              <li><strong>S/R Context:</strong> Gap into major S/R often reverses</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Quality Setup Checklist">
            <PatternChecklist
              title="High-Probability Gap Signals"
              items={[
                { text: "Gap size appropriate for strategy (fill vs. continuation)", critical: true },
                { text: "Volume confirms gap significance", critical: true },
                { text: "Wait for opening range (15-30 min)", critical: true },
                { text: "Clear reversal/continuation pattern visible", critical: false },
                { text: "No major earnings/news pending intraday", critical: false },
                { text: "Gap direction aligns with sector/market trend", critical: false },
              ]}
            />
          </ArticleSection>

          <ArticleSection title="Pre-Market Analysis">
            <p>Prepare before the market opens:</p>
            <ol>
              <li><strong>Scan for Gaps:</strong> Use screener to find 1%+ gappers</li>
              <li><strong>Check Catalyst:</strong> Earnings, upgrades, sector news</li>
              <li><strong>Volume Check:</strong> Pre-market volume vs. average</li>
              <li><strong>Identify Levels:</strong> Mark prior day's high/low/close, key S/R</li>
              <li><strong>Plan Trade:</strong> Determine strategy (fill vs. go) before open</li>
            </ol>
          </ArticleSection>

          <ArticleSection title="Common Mistakes">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-semibold text-red-400">Avoid These Errors</span>
              </div>
              <ul className="mb-0">
                <li>Trading immediately at the open (wait for range)</li>
                <li>Fading breakaway gaps (they don't fill)</li>
                <li>Ignoring the catalyst behind the gap</li>
                <li>Using too large position sizes on volatile opens</li>
                <li>Holding gap fills too long (take profit at prior close)</li>
              </ul>
            </div>
          </ArticleSection>

          <ArticleSection title="Best Markets for Gap Trading">
            <ul>
              <li><strong>US Stocks:</strong> Individual stocks gap frequently (earnings, news)</li>
              <li><strong>Indices (SPY, QQQ):</strong> Smaller gaps, more predictable fills</li>
              <li><strong>Forex:</strong> Weekend gaps on Sunday open</li>
              <li><strong>Crypto:</strong> Gaps exist on futures (CME BTC/ETH)</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Performance Expectations">
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Gap Fill Win Rate</div>
                    <div className="text-xl font-bold text-green-400">68-75%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Gap & Go Win Rate</div>
                    <div className="text-xl font-bold text-blue-400">55-62%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Trades per Week</div>
                    <div className="text-xl font-bold text-purple-400">3-8</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Best Time</div>
                    <div className="text-xl font-bold text-amber-400">9:30-11:00</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ArticleSection>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
            <Link to="/learn/strategies/support-resistance" className="text-primary hover:underline">
              ← Support/Resistance Strategy
            </Link>
            <Link to="/learn" className="text-primary hover:underline">
              Back to Learning Center →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapTradingStrategy;
