import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Target, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticleSection, TradingRule, PatternChecklist } from "@/components/blog/ArticleSection";

const RSIDivergenceStrategy = () => {
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
            <Badge className="bg-purple-500/20 text-purple-400">Momentum</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">RSI Divergence Strategy</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Master the art of identifying trend reversals using RSI divergence patterns — one of the most reliable momentum-based signals in technical analysis.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 12 min read</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> 68-75% Win Rate</span>
            <span className="flex items-center gap-1"><Target className="h-4 w-4" /> 1.5:1 - 2.5:1 R:R</span>
          </div>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">68-75%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">2:1</div>
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
          <ArticleSection title="What is RSI Divergence?">
            <p>
              RSI (Relative Strength Index) divergence occurs when price action and the RSI indicator move in opposite directions, signaling potential trend exhaustion and imminent reversal.
            </p>
            <p>
              There are two primary types of divergence:
            </p>
            <ul>
              <li><strong>Bullish Divergence:</strong> Price makes lower lows while RSI makes higher lows — signals potential upward reversal</li>
              <li><strong>Bearish Divergence:</strong> Price makes higher highs while RSI makes lower highs — signals potential downward reversal</li>
            </ul>
            <p>
              Divergence works because momentum often leads price. When the RSI fails to confirm new price extremes, it suggests underlying buying or selling pressure is weakening.
            </p>
          </ArticleSection>

          <ArticleSection title="RSI Settings & Configuration">
            <p>Standard RSI settings work well for divergence trading:</p>
            <ul>
              <li><strong>Period:</strong> 14 (default) for swing trades; 7-9 for intraday</li>
              <li><strong>Overbought Level:</strong> 70 (traditional) or 80 (stricter)</li>
              <li><strong>Oversold Level:</strong> 30 (traditional) or 20 (stricter)</li>
            </ul>
            <p>
              For divergence specifically, the exact levels matter less than the slope comparison between price and RSI.
            </p>
          </ArticleSection>

          <ArticleSection title="Entry Rules - Bullish Divergence">
            <TradingRule
              type="entry"
              title="Bullish RSI Divergence Entry"
            >
              <ul>
                <li>Price forms a lower low</li>
                <li>RSI forms a higher low (divergence confirmed)</li>
                <li>RSI ideally below 40 (oversold zone)</li>
                <li>Wait for bullish price confirmation (engulfing candle, break of mini-resistance)</li>
                <li>Enter long on confirmation candle close</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Entry Rules - Bearish Divergence">
            <TradingRule
              type="entry"
              title="Bearish RSI Divergence Entry"
            >
              <ul>
                <li>Price forms a higher high</li>
                <li>RSI forms a lower high (divergence confirmed)</li>
                <li>RSI ideally above 60 (overbought zone)</li>
                <li>Wait for bearish price confirmation (bearish engulfing, break of mini-support)</li>
                <li>Enter short on confirmation candle close</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Stop Loss Placement">
            <TradingRule
              type="stop"
              title="Stop Loss Rules"
            >
              <ul>
                <li><strong>Bullish Divergence:</strong> Stop below the lowest low of the divergence pattern</li>
                <li><strong>Bearish Divergence:</strong> Stop above the highest high of the divergence pattern</li>
                <li>Add 0.5-1 ATR buffer for volatility protection</li>
                <li>Maximum 2% account risk per trade</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Take Profit Targets">
            <TradingRule
              type="target"
              title="Profit Target Guidelines"
            >
              <ul>
                <li><strong>TP1 (60% position):</strong> Previous swing high/low — 1.5:1 R:R minimum</li>
                <li><strong>TP2 (30% position):</strong> Next major resistance/support level</li>
                <li><strong>TP3 (10% position):</strong> Trail with 20 EMA or until RSI reaches opposite extreme</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title="Divergence Quality Checklist">
            <PatternChecklist
              title="High-Quality Divergence Signals"
              items={[
                { text: "Clear swing points visible on both price and RSI", critical: true },
                { text: "RSI in oversold/overbought zone during divergence", critical: true },
                { text: "Divergence forms over 10-50 bars (not too fast, not too slow)", critical: false },
                { text: "Price confirmation candle present", critical: true },
                { text: "Higher timeframe trend supports reversal direction", critical: false },
                { text: "Volume increase on confirmation candle", critical: false },
              ]}
            />
          </ArticleSection>

          <ArticleSection title="Hidden Divergence (Trend Continuation)">
            <p>
              Hidden divergence signals trend continuation rather than reversal:
            </p>
            <ul>
              <li><strong>Hidden Bullish:</strong> Price makes higher lows, RSI makes lower lows — buy in uptrend</li>
              <li><strong>Hidden Bearish:</strong> Price makes lower highs, RSI makes higher highs — sell in downtrend</li>
            </ul>
            <p>
              Hidden divergence is particularly powerful when trading pullbacks within established trends.
            </p>
          </ArticleSection>

          <ArticleSection title="Multi-Timeframe Approach">
            <p>Increase accuracy by analyzing multiple timeframes:</p>
            <ol>
              <li><strong>Higher Timeframe:</strong> Identify the primary trend direction</li>
              <li><strong>Trading Timeframe:</strong> Spot divergence signals</li>
              <li><strong>Lower Timeframe:</strong> Fine-tune entry timing</li>
            </ol>
            <p>
              Example: Daily trend bullish → 4H bullish divergence forms → 1H for precise entry.
            </p>
          </ArticleSection>

          <ArticleSection title="Common Mistakes to Avoid">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-semibold text-red-400">Critical Errors</span>
              </div>
              <ul className="mb-0">
                <li>Trading divergence without price confirmation</li>
                <li>Ignoring the higher timeframe trend</li>
                <li>Using too short RSI periods (creates noise)</li>
                <li>Trading divergence during strong momentum trends</li>
                <li>Expecting immediate reversal (divergence can persist)</li>
              </ul>
            </div>
          </ArticleSection>

          <ArticleSection title="Best Markets for RSI Divergence">
            <ul>
              <li><strong>Forex:</strong> Major pairs with good liquidity (EUR/USD, GBP/USD)</li>
              <li><strong>Stocks:</strong> Large-cap stocks with smooth price action</li>
              <li><strong>Indices:</strong> S&P 500, NASDAQ — excellent divergence setups</li>
              <li><strong>Crypto:</strong> BTC, ETH on 4H+ timeframes</li>
            </ul>
          </ArticleSection>

          <ArticleSection title="Performance Expectations">
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expected Win Rate</div>
                    <div className="text-xl font-bold text-green-400">68-75%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Average R:R</div>
                    <div className="text-xl font-bold text-blue-400">1.5:1 - 2.5:1</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Trades per Month</div>
                    <div className="text-xl font-bold text-purple-400">8-15</div>
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
            <Link to="/learn/strategies/momentum" className="text-primary hover:underline">
              ← Momentum Strategy
            </Link>
            <Link to="/learn/strategies/vwap" className="text-primary hover:underline">
              VWAP Strategy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSIDivergenceStrategy;
