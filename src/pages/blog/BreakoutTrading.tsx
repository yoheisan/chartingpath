import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const BreakoutTrading = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Breakout Trading Strategy: Capturing Strong Moves
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Master the art of breakout trading to capture explosive price movements when markets break free from consolidation patterns.
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                What is Breakout Trading?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Breakout trading is a strategy that aims to enter a trade when the price breaks through a significant level of support or resistance, often accompanied by increased volume. These breakouts signal the start of new trends and can lead to substantial profits when traded correctly.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Types of Breakouts</h2>
          
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horizontal Breakouts</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-2">Breaking through key support or resistance levels:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Range breakouts</li>
                  <li>Double top/bottom breakouts</li>
                  <li>Rectangle pattern breakouts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pattern Breakouts</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-2">Breaking from consolidation patterns:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Triangle breakouts</li>
                  <li>Flag and pennant breakouts</li>
                  <li>Wedge breakouts</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Key Breakout Confirmation Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Volume Surge:</strong> Breakouts should be accompanied by at least 50% above average volume
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Strong Close:</strong> Price closes decisively beyond the breakout level (not just a wick)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Momentum:</strong> Strong momentum indicators (RSI above 50 for bullish, below 50 for bearish)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Follow-Through:</strong> Continuation in the breakout direction on subsequent candles
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Breakout Trading Setup</h2>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Step-by-Step Entry Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">1. Identify Consolidation</h3>
                <p>Look for price trading in a defined range or pattern for at least 2-3 weeks for daily charts, or proportionally for other timeframes.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">2. Mark Key Levels</h3>
                <p>Clearly define the breakout level - resistance for bullish breakouts, support for bearish breakouts. Use multiple touches to confirm the level.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">3. Wait for Breakout</h3>
                <p>Enter when price closes beyond the level with strong volume. Some traders wait for a retest of the broken level.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">4. Set Stop Loss</h3>
                <p>Place stop loss below the breakout level (for bullish) or above (for bearish), typically 1-2 ATR away.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">5. Define Targets</h3>
                <p>Measure the height of the consolidation pattern and project it from the breakout point, or use key Fibonacci extensions.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                False Breakout Warning Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Low volume on breakout (below average volume)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Wide candle wicks with small body beyond the level</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Immediate reversal back into the pattern within 1-2 candles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Breakout during low-liquidity hours or holidays</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Multiple failed breakout attempts in the same direction</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Advanced Breakout Strategies</h2>
          
          <div className="grid gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pullback Entry Strategy</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">Instead of entering immediately on breakout, wait for price to pull back and retest the broken level as new support/resistance.</p>
                <p className="font-semibold text-foreground">Advantages:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Better risk-reward ratio</li>
                  <li>Confirmation of level flip</li>
                  <li>Lower risk of false breakouts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multiple Timeframe Confirmation</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">Confirm breakouts on lower timeframes before entering, or ensure alignment with higher timeframe trends.</p>
                <p className="font-semibold text-foreground">Example:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Daily chart shows range breakout</li>
                  <li>4-hour chart confirms momentum</li>
                  <li>1-hour chart provides precise entry</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volatility-Based Position Sizing</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-3">Adjust position size based on the volatility of the breakout:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Low volatility breakouts: Larger positions</li>
                  <li>High volatility breakouts: Smaller positions</li>
                  <li>Use ATR to measure volatility</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Risk Management for Breakout Trading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Position Sizing</h3>
                <p>Risk no more than 1-2% of account per trade. Calculate position size based on the distance from entry to stop loss.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Stop Loss Placement</h3>
                <p>Place stops below the consolidation pattern low for bullish breakouts, or above the high for bearish breakouts. Give enough room to avoid noise.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Profit Taking</h3>
                <p>Scale out at multiple targets: Take 50% profit at 2R, move stop to breakeven, let remainder run to 3R or higher.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Win Rate Expectations</h3>
                <p>Good breakout strategies typically have 40-50% win rate but profit through superior risk-reward ratios of 2:1 or better.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Best Markets and Timeframes for Breakouts</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Best Markets</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Stocks with high relative strength and earnings catalysts</li>
                    <li>Major forex pairs during active trading sessions</li>
                    <li>Commodities following consolidation periods</li>
                    <li>Cryptocurrencies with strong fundamentals</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Optimal Timeframes</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Daily charts: Best for swing trading, clear patterns</li>
                    <li>4-hour charts: Good balance for position traders</li>
                    <li>1-hour charts: Intraday breakouts with quick moves</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Common Mistakes to Avoid</h2>
          
          <Card className="mb-8">
            <CardContent className="pt-6">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Chasing Breakouts:</strong> Entering after significant movement has already occurred
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Ignoring Volume:</strong> Trading breakouts without volume confirmation
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Over-Trading:</strong> Taking every breakout without proper setup quality
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">Wide Stops:</strong> Using stops too far from entry, hurting risk-reward
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">No Exit Plan:</strong> Entering without defined profit targets and trailing stops
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice Breakout Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Test your breakout trading skills with our interactive tools and build strategies based on this powerful technique.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/strategy-workspace?tab=quick-select">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Strategy Builder
                  </button>
                </Link>
                <Link to="/strategy-workspace?tab=builder">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Backtest Breakouts
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    </div>
  );
};

export default BreakoutTrading;
