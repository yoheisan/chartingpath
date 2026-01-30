import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DynamicPatternChart } from "@/components/DynamicPatternChart";
import {
  SkillLevelSection,
  TradingRule,
  PatternChecklist,
  CommonMistakes,
  ProTip,
  RiskManagementBox,
  StatisticsBox,
  TableOfContents
} from "@/components/blog/ArticleSection";

const TrendFollowingStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'What is Trend Following?' },
    { id: 'core-principles', title: 'Core Principles', level: 'novice' as const },
    { id: 'trend-identification', title: 'Trend Identification', level: 'novice' as const },
    { id: 'entry-strategies', title: 'Entry Strategies', level: 'intermediate' as const },
    { id: 'exit-strategies', title: 'Exit Strategies', level: 'intermediate' as const },
    { id: 'position-sizing', title: 'Position Sizing', level: 'advanced' as const },
    { id: 'pro-techniques', title: 'Professional Techniques', level: 'professional' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn/trading-strategies-guide" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Strategy Guide
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Trend Trading</Badge>
            <Badge variant="outline">Directional Strategy</Badge>
            <Badge variant="secondary">18 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Trend Following: Riding the Market's Big Moves</h1>
          <p className="text-xl text-muted-foreground mb-8">
            "The trend is your friend until the end." Master the strategy that has generated billions for hedge funds 
            like Renaissance Technologies and traders like Richard Dennis's Turtle Traders.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Typical Win Rate', value: '35-45%', description: 'Low but profitable' },
              { label: 'Risk-Reward', value: '3:1 to 10:1+', description: 'Big winners compensate' },
              { label: 'Hold Time', value: 'Weeks-Months', description: 'Patience required' },
              { label: 'Famous Traders', value: '40+ Years', description: 'Proven track record' },
            ]}
            title="Trend Following Statistics"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Trend following is a systematic approach that aims to capture extended moves in markets by 
                entering in the direction of established trends and holding until the trend reverses.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Trend following is perhaps the most time-tested strategy in trading. It was the foundation of 
              Richard Dennis's famous Turtle Trading experiment, Bill Dunn's 40+ year track record, and 
              countless managed futures funds. The core idea is simple: markets trend, and by positioning 
              with the trend and cutting losses quickly, you can capture asymmetric returns.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="bull-flag" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> A bull flag continuation pattern — trend followers would enter on the breakout and ride the trend higher.
              </div>
            </div>
          </section>

          {/* Core Principles */}
          <section id="core-principles">
            <SkillLevelSection level="novice" title="Core Principles of Trend Following">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50 border-l-4 border-green-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">1. Let Winners Run</h4>
                    <p className="text-sm text-muted-foreground">
                      The core of trend following profitability. Don't exit profitable trades early — 
                      use trailing stops to stay in trends as long as possible. A few big winners 
                      pay for many small losers.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-red-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">2. Cut Losses Short</h4>
                    <p className="text-sm text-muted-foreground">
                      Exit losing positions quickly and without emotion. Every trade starts with a predefined 
                      stop loss. If the market proves you wrong, accept it and move on.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-blue-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">3. Trade All Markets</h4>
                    <p className="text-sm text-muted-foreground">
                      Diversify across uncorrelated markets (commodities, currencies, indices, bonds). 
                      You never know which market will trend next, so cast a wide net.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-purple-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">4. Systematic Execution</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove emotion by following rules mechanically. Define entries, exits, and 
                      position sizing mathematically. Execute without discretion.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                Trend following has a low win rate (35-45%) but high profitability due to asymmetric payoffs. 
                You must be psychologically prepared to be wrong more often than right while still making money.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* Trend Identification */}
          <section id="trend-identification">
            <SkillLevelSection level="novice" title="How to Identify Trends">
              <p className="text-muted-foreground mb-6">
                Before you can follow a trend, you must identify one. Here are the primary methods:
              </p>

              <h4 className="text-lg font-semibold mb-4">Moving Average Methods</h4>
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Price vs. 200 MA:</strong> Price above 200-day MA = uptrend, below = downtrend. 
                    The simplest and most widely used method.
                  </li>
                  <li>
                    <strong className="text-foreground">50/200 Cross (Golden/Death Cross):</strong> 50 MA crossing above 200 MA = bullish, 
                    crossing below = bearish. Slower but more reliable.
                  </li>
                  <li>
                    <strong className="text-foreground">Stacked MAs:</strong> 20 &gt; 50 &gt; 200 MA = strong uptrend. 
                    The wider the spacing, the stronger the trend.
                  </li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">Donchian Channel (Turtle Method)</h4>
              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-3">
                  The Turtle Traders used a 20-day Donchian Channel:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Upper Band:</strong> Highest high of last 20 days</li>
                  <li>• <strong>Lower Band:</strong> Lowest low of last 20 days</li>
                  <li>• <strong>Entry:</strong> Long on break above upper band, short on break below lower</li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">ADX (Average Directional Index)</h4>
              <p className="text-muted-foreground mb-4">
                ADX measures trend strength regardless of direction:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• ADX &lt; 20 = No trend (avoid trend following)</li>
                <li>• ADX 20-40 = Developing trend (good entries)</li>
                <li>• ADX &gt; 40 = Strong trend (stay in, but trend may be extended)</li>
              </ul>
            </SkillLevelSection>
          </section>

          {/* Entry Strategies */}
          <section id="entry-strategies">
            <SkillLevelSection level="intermediate" title="Trend Following Entry Strategies">
              <h4 className="text-lg font-semibold mb-4">1. Breakout Entry</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  Enter long when price closes above the highest high of the last N periods (e.g., 20 or 55 days). 
                  Enter short when price closes below the lowest low.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop at the 10-day low (for longs) or 10-day high (for shorts). 
                  This is shorter than the entry period for faster exit on reversals.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">2. Pullback to Moving Average</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  Wait for an established trend (price above <Link to="/learn/moving-averages" className="text-primary hover:underline">200 MA</Link>), then enter on pullbacks to the 
                  20 or 50 MA. Requires a bounce confirmation candle.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop below the 50 MA or below the swing low created by the pullback.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">3. Volatility Breakout (ATR)</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  Enter when price moves 2-3x ATR (Average True Range) from a reference point 
                  (e.g., 20-day moving average). This signals abnormal momentum.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Set stop at 2x ATR from entry. ATR-based stops adapt to market volatility.
                </TradingRule>
              </div>

              <Alert className="mt-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Pyramiding:</strong> Add to winning positions as the trend continues. 
                  Enter additional units at each new breakout level, but reduce size with each addition 
                  (e.g., 4 units, then 3, 2, 1).
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* Exit Strategies */}
          <section id="exit-strategies">
            <SkillLevelSection level="intermediate" title="Trend Following Exit Strategies">
              <p className="text-muted-foreground mb-6">
                Exits are more important than entries in trend following. A great entry with a poor exit 
                will still lose money.
              </p>

              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Trailing Stop (N-Period Low/High)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Exit longs when price closes below the 10-day low. Exit shorts when price closes 
                    above the 10-day high. This keeps you in trends while exiting when momentum reverses.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">ATR Trailing Stop</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Set stop at entry price minus 2x ATR, then trail it upward as price advances. 
                    Never move the stop backward. This adapts to volatility conditions.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Moving Average Cross Exit</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Exit when the 10 MA crosses below the 30 MA (for longs). This signals 
                    short-term momentum is turning against the trend.
                  </CardContent>
                </Card>
              </div>

              <CommonMistakes 
                mistakes={[
                  'Taking profits too early on winning trades (violates "let winners run")',
                  'Not cutting losses quickly enough (hoping for recovery)',
                  'Abandoning the strategy during drawdowns (normal in trend following)',
                  'Over-optimizing entry/exit parameters on historical data',
                  'Trading too few markets (missing trends that pay for losers)',
                  'Using tight stops that get triggered by normal volatility',
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* Position Sizing */}
          <section id="position-sizing">
            <SkillLevelSection level="advanced" title="Position Sizing for Trend Followers">
              <p className="text-muted-foreground mb-6">
                Position sizing is critical because trend following has many small losses and few big wins. 
                You must survive the losses to capture the wins.
              </p>

              <h4 className="text-lg font-semibold mb-4">ATR-Based Position Sizing (Turtle Method)</h4>
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  The Turtle Traders used "N" (20-day ATR) to normalize position sizes across markets:
                </p>
                <div className="font-mono text-sm bg-background/50 p-4 rounded">
                  <p>Dollar Volatility = ATR × Point Value</p>
                  <p>1% Equity / Dollar Volatility = Position Size</p>
                  <p className="mt-2 text-muted-foreground">Example: $100,000 account, ATR = $50</p>
                  <p>Position Size = $1,000 / $50 = 20 units</p>
                </div>
              </div>

              <RiskManagementBox 
                positionSize="0.5-2% of equity per trade"
                stopLoss="2x ATR trailing stop"
                riskReward="3:1 to 10:1+"
                maxRisk="10-25% portfolio heat max"
              />
            </SkillLevelSection>
          </section>

          {/* Professional Techniques */}
          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Trend Following Techniques">
              <h4 className="text-lg font-semibold mb-4">Multi-Timeframe Confirmation</h4>
              <p className="text-muted-foreground mb-4">
                Use weekly charts to identify the major trend, daily for entry timing, and monthly 
                for overall context. Only trade in the direction of the higher timeframe trend.
              </p>

              <h4 className="text-lg font-semibold mb-4">Sector/Asset Class Rotation</h4>
              <p className="text-muted-foreground mb-4">
                Instead of individual instruments, apply trend following to asset classes (equities vs. bonds) 
                or sectors (tech vs. energy). This captures macro trends with less noise.
              </p>

              <h4 className="text-lg font-semibold mb-4">Regime Filters</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  Reduce position sizes or sit out entirely during unfavorable regimes:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>VIX &gt; 30:</strong> High volatility, wider stops, smaller positions</li>
                  <li>• <strong>ADX &lt; 20 across most markets:</strong> Range-bound, reduce exposure</li>
                  <li>• <strong>Correlation spike:</strong> All markets moving together = reduced diversification</li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">Systematic Rebalancing</h4>
              <PatternChecklist 
                title="Monthly Review Checklist"
                items={[
                  { text: 'Review all open positions vs. current trend status', critical: true },
                  { text: 'Adjust position sizes based on current volatility (ATR)', critical: true },
                  { text: 'Check sector/market correlation for diversification' },
                  { text: 'Review win rate and average win/loss for system health' },
                  { text: 'Log any discretionary overrides for later analysis' },
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* Summary */}
          <section className="mt-12">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <CardHeader>
                <CardTitle>Trend Following Strategy Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Best For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Patient traders comfortable with low win rates</li>
                      <li>• Those who can handle extended drawdowns</li>
                      <li>• Systematic/rules-based personality</li>
                      <li>• Multi-market portfolio approach</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Not Ideal For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Those who need high win rates psychologically</li>
                      <li>• Traders who take profits too early</li>
                      <li>• Single-market or single-instrument focus</li>
                      <li>• Short-term, high-frequency trading styles</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Related Strategies */}
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Related Strategies</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/learn/strategies/momentum-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Momentum Trading</h4>
                    <p className="text-sm text-muted-foreground">Shorter-term trend exploitation</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/breakout" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Breakout Strategy</h4>
                    <p className="text-sm text-muted-foreground">Capturing trend initiations</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/position-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Position Trading</h4>
                    <p className="text-sm text-muted-foreground">Long-term trend holding</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default TrendFollowingStrategy;
