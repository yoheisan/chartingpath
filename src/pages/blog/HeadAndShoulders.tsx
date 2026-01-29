import { Link } from "react-router-dom";
import { ArrowLeft, TrendingDown, TrendingUp, Target, CheckCircle, BookOpen, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LazyPatternChart } from "@/components/LazyPatternChart";
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

const HeadAndShoulders = () => {
  const tocSections = [
    { id: 'introduction', title: 'Introduction to Head & Shoulders' },
    { id: 'novice-basics', title: 'Understanding the Basics', level: 'novice' as const },
    { id: 'intermediate-identification', title: 'Pattern Identification', level: 'intermediate' as const },
    { id: 'advanced-trading', title: 'Trading Strategies', level: 'advanced' as const },
    { id: 'professional-edge', title: 'Professional Edge Techniques', level: 'professional' as const },
    { id: 'risk-management', title: 'Risk Management Discipline' },
    { id: 'inverse-pattern', title: 'Inverse Head & Shoulders' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Navigation */}
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        {/* Article Header */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="destructive">Reversal Pattern</Badge>
            <Badge variant="outline">Chart Patterns</Badge>
            <Badge variant="secondary">15 min read</Badge>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Head and Shoulders Pattern: Complete Trading Guide</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master the most reliable reversal pattern in technical analysis — from basic identification to professional execution strategies with proper risk management.
          </p>

          {/* Table of Contents */}
          <TableOfContents sections={tocSections} />

          {/* Key Statistics */}
          <StatisticsBox 
            stats={[
              { label: 'Success Rate', value: '89%', description: 'Per Bulkowski' },
              { label: 'Avg Decline', value: '22%', description: 'After breakout' },
              { label: 'Formation Time', value: '3-6 mo', description: 'Typical range' },
              { label: 'Throwback Rate', value: '45%', description: 'Retest neckline' },
            ]}
            title="Pattern Performance Statistics"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <TrendingDown className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                The Head and Shoulders pattern is considered the most reliable reversal pattern in technical analysis, 
                signaling a potential trend change from bullish to bearish with an 89% success rate when properly identified.
              </AlertDescription>
            </Alert>

            {/* Visual Chart */}
            <div className="my-8 rounded-xl overflow-hidden border border-border bg-card">
              <LazyPatternChart patternType="head-shoulders" width={800} height={500} />
            </div>
          </section>

          {/* NOVICE LEVEL */}
          <section id="novice-basics">
            <SkillLevelSection level="novice" title="Understanding the Basics">
              <p className="text-muted-foreground">
                If you're new to chart patterns, the Head and Shoulders is an excellent starting point. Think of it as a "mountain range" on your chart with three peaks.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-3">What Does It Look Like?</h4>
              <p className="text-muted-foreground mb-4">
                Imagine looking at a person's silhouette from behind — you see two shoulders with a head rising above them in the middle. That's exactly what this pattern looks like on a price chart:
              </p>

              <div className="grid gap-4">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-sm font-bold">1</span>
                      Left Shoulder
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price rises to a high point, then falls back. This is like the left shoulder of a person — a peak, but not the highest point.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-sm font-bold">2</span>
                      Head (Highest Point)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price rises again, this time higher than the left shoulder, creating the "head." This represents the final push to new highs before the trend reverses.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-sm font-bold">3</span>
                      Right Shoulder
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price rises once more, but this time it can't reach the height of the head. This is a warning sign — buyers are losing steam.
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-sm font-bold">!</span>
                      The Neckline (Critical!)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Draw a line connecting the two low points (between the shoulders and head). This is the "neckline" — when price breaks below this line, the pattern is confirmed.
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                <strong>Beginner's Rule:</strong> Never trade this pattern until price breaks below the neckline. Many beginners jump in too early when they see the right shoulder forming and get burned when the pattern fails.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* INTERMEDIATE LEVEL */}
          <section id="intermediate-identification">
            <SkillLevelSection level="intermediate" title="Pattern Identification & Validation">
              <p className="text-muted-foreground mb-6">
                At this level, you need to distinguish between genuine Head and Shoulders patterns and false formations. Not every three-peak structure is tradeable.
              </p>

              <h4 className="font-semibold text-lg mb-4">Volume Analysis: The Key Confirmation</h4>
              <p className="text-muted-foreground mb-4">
                Volume behavior during pattern formation is crucial for validation:
              </p>

              <div className="bg-muted/30 p-6 rounded-lg mb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 text-sm font-medium text-right flex-shrink-0">Left Shoulder</div>
                    <div className="flex-1 bg-green-500/20 h-6 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-green-500 rounded" style={{ width: '80%' }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">High Volume</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-20 text-sm font-medium text-right flex-shrink-0">Head</div>
                    <div className="flex-1 bg-blue-500/20 h-6 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-blue-500 rounded" style={{ width: '60%' }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">Lower Volume</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-20 text-sm font-medium text-right flex-shrink-0">Right Shoulder</div>
                    <div className="flex-1 bg-orange-500/20 h-6 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-orange-500 rounded" style={{ width: '40%' }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">Even Lower</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-20 text-sm font-medium text-right flex-shrink-0">Breakout</div>
                    <div className="flex-1 bg-red-500/20 h-6 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-red-500 rounded" style={{ width: '90%' }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">Volume Spike!</span>
                    </div>
                  </div>
                </div>
              </div>

              <PatternChecklist 
                items={[
                  { text: 'Prior uptrend exists (at least 3 months of bullish price action)', critical: true },
                  { text: 'Left shoulder volume is higher than head volume', critical: true },
                  { text: 'Right shoulder volume is lower than head volume' },
                  { text: 'Neckline is clearly defined (can slope up or down)' },
                  { text: 'Right shoulder peak is lower than the head', critical: true },
                  { text: 'Pattern takes at least 4-6 weeks to form' },
                  { text: 'Breakout occurs with 50%+ volume increase', critical: true },
                ]}
              />

              <h4 className="font-semibold text-lg mt-8 mb-4">Neckline Variations</h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-background/50">
                  <CardContent className="pt-4">
                    <div className="text-center mb-2">
                      <div className="w-full h-8 relative">
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-center">Horizontal</p>
                    <p className="text-xs text-muted-foreground text-center">Most common</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4">
                    <div className="text-center mb-2">
                      <div className="w-full h-8 relative">
                        <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-green-500 rotate-[-5deg] origin-left" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-center">Upward Sloping</p>
                    <p className="text-xs text-muted-foreground text-center">Less bearish</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/50 border-red-500/30">
                  <CardContent className="pt-4">
                    <div className="text-center mb-2">
                      <div className="w-full h-8 relative">
                        <div className="absolute top-1 left-0 right-0 h-0.5 bg-red-500 rotate-[5deg] origin-left" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-center">Downward Sloping</p>
                    <p className="text-xs text-red-500 text-center">Most bearish!</p>
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* ADVANCED LEVEL */}
          <section id="advanced-trading">
            <SkillLevelSection level="advanced" title="Trading Strategies & Execution">
              <p className="text-muted-foreground mb-6">
                Now we get into the practical trading mechanics. You'll learn multiple entry strategies, precise stop placement, and target calculation.
              </p>

              <h4 className="font-semibold text-lg mb-4">Entry Strategies</h4>
              
              <div className="space-y-4 mb-8">
                <TradingRule type="entry" title="Conservative Entry (Recommended)">
                  <p>Wait for a daily close below the neckline with increased volume. This confirms the pattern is valid and reduces the risk of false breakouts.</p>
                  <p className="mt-2 font-medium text-foreground">Entry: On the candle close below neckline</p>
                </TradingRule>

                <TradingRule type="entry" title="Aggressive Entry">
                  <p>Enter when price touches or slightly breaks the neckline intraday. Higher risk but better entry price if the pattern completes.</p>
                  <p className="mt-2 font-medium text-foreground">Entry: On neckline touch with tight stop</p>
                </TradingRule>

                <TradingRule type="entry" title="Retest Entry (Best Risk:Reward)">
                  <p>Wait for price to break below neckline, then retest it from below (throwback). This occurs in ~45% of patterns and offers the best entry point.</p>
                  <p className="mt-2 font-medium text-foreground">Entry: When price fails at neckline retest</p>
                </TradingRule>
              </div>

              <h4 className="font-semibold text-lg mb-4">Stop Loss Placement</h4>
              
              <div className="space-y-4 mb-8">
                <TradingRule type="stop" title="Above Right Shoulder (Aggressive)">
                  <p>Tighter stop providing better risk:reward ratio (typically 1:2 or better). Risk: Higher chance of being stopped out on volatility.</p>
                </TradingRule>

                <TradingRule type="stop" title="Above the Head (Conservative)">
                  <p>Wider stop that only triggers if the pattern completely fails. Lower risk:reward but higher probability of success.</p>
                </TradingRule>
              </div>

              <h4 className="font-semibold text-lg mb-4">Profit Target Calculation</h4>
              
              <Card className="bg-muted/30 my-6">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Measured Move Formula</p>
                    <p className="text-2xl font-mono font-bold">
                      Target = Neckline Break − (Head − Neckline)
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Example:</strong> If the head is at $150, neckline at $130, and breakout at $129:
                    </p>
                    <p className="text-sm mt-2">
                      Target = $129 − ($150 − $130) = $129 − $20 = <strong className="text-red-500">$109</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <TradingRule type="target" title="Multiple Target Strategy">
                <p>Scale out of your position at multiple levels:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• 50% at 1x measured move target</li>
                  <li>• 30% at 1.5x measured move</li>
                  <li>• 20% trailing stop for extended moves</li>
                </ul>
              </TradingRule>
            </SkillLevelSection>
          </section>

          {/* PROFESSIONAL LEVEL */}
          <section id="professional-edge">
            <SkillLevelSection level="professional" title="Professional Edge Techniques">
              <p className="text-muted-foreground mb-6">
                Professional traders look beyond the basic pattern. Here's how to gain an edge over retail traders.
              </p>

              <h4 className="font-semibold text-lg mb-4">Multi-Timeframe Confirmation</h4>
              <p className="text-muted-foreground mb-4">
                Before trading a Head and Shoulders on the daily chart, check higher timeframes:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <span><strong>Weekly:</strong> Is the overall trend still bullish? H&S at major resistance is more powerful.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <span><strong>Monthly:</strong> Are there historical support/resistance levels that align with your target?</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <span><strong>4-Hour:</strong> Use lower timeframe for precise entry timing after pattern confirmation.</span>
                </li>
              </ul>

              <h4 className="font-semibold text-lg mb-4">Institutional Order Flow</h4>
              <p className="text-muted-foreground mb-4">
                Watch for these signs of institutional participation:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Card className="bg-green-500/5 border-green-500/30">
                  <CardContent className="pt-4">
                    <h5 className="font-medium text-green-500 mb-2">Bullish Signs (Wait)</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Large buy orders absorbing selling</li>
                      <li>• Divergence in RSI/MACD at right shoulder</li>
                      <li>• Unusual options activity</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-500/30">
                  <CardContent className="pt-4">
                    <h5 className="font-medium text-red-500 mb-2">Bearish Signs (Confirm)</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Distribution patterns in volume</li>
                      <li>• Put/call ratio increasing</li>
                      <li>• Smart money selling into rallies</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <h4 className="font-semibold text-lg mb-4">Failed Pattern Exploitation</h4>
              <p className="text-muted-foreground mb-4">
                When a Head and Shoulders fails (price rallies above right shoulder), it often leads to an explosive move higher. Professionals watch for:
              </p>
              <Alert className="border-amber-500/50 bg-amber-500/5">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <AlertDescription>
                  <strong>Busted Pattern Trade:</strong> If price closes above the right shoulder after breaking the neckline, consider going long with stop below the recent low. Failed patterns often lead to moves 2-3x the original pattern height.
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* RISK MANAGEMENT */}
          <section id="risk-management">
            <h2 className="text-2xl font-bold mt-12 mb-6 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Risk Management Discipline
            </h2>

            <RiskManagementBox 
              positionSize="1-2% of account per trade"
              stopLoss="Above right shoulder or head"
              riskReward="Minimum 1:2 (target ÷ stop distance)"
              maxRisk="Never risk more than 2% on a single pattern"
            />

            <h4 className="font-semibold text-lg mb-4">Position Sizing Calculator</h4>
            <Card className="bg-muted/30 mb-6">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Use this formula to calculate your position size:
                </p>
                <div className="bg-background p-4 rounded-lg font-mono text-sm">
                  <p>Position Size = (Account × Risk%) ÷ (Entry − Stop Loss)</p>
                  <p className="mt-4 text-muted-foreground">
                    Example: $50,000 account, 1% risk, Entry $129, Stop $142<br />
                    Position = ($50,000 × 0.01) ÷ ($142 − $129) = $500 ÷ $13 = <strong>38 shares</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            <CommonMistakes 
              mistakes={[
                'Entering before neckline break confirmation',
                'Ignoring volume during pattern formation',
                'Setting stop loss too tight (getting stopped out by normal volatility)',
                'Not waiting for a daily close below the neckline',
                'Trading the pattern in low-liquidity assets',
                'Overleveraging due to high pattern success rate',
                'Ignoring the broader market trend',
                'Not having a clear exit strategy before entering',
              ]}
            />
          </section>

          {/* INVERSE PATTERN */}
          <section id="inverse-pattern">
            <h2 className="text-2xl font-bold mt-12 mb-4">Inverse Head and Shoulders (Bullish)</h2>
            
            <div className="my-8 rounded-xl overflow-hidden border border-border bg-card">
              <LazyPatternChart patternType="inverted-head-shoulders" width={800} height={500} />
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              The Inverse Head and Shoulders is the bullish counterpart, appearing at the end of a downtrend. All the same principles apply, but mirrored:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-500">Bullish Signals</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <li>Three troughs instead of peaks</li>
                  <li>Neckline acts as resistance</li>
                  <li>Volume increases on breakout above neckline</li>
                  <li>Target measured upward from breakout</li>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Volume Pattern</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <li>High volume on left shoulder low</li>
                  <li>Lower volume on head low</li>
                  <li>Even lower on right shoulder</li>
                  <li>Volume spike on neckline breakout</li>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Key Takeaways */}
          <section id="key-takeaways">
            <h2 className="text-2xl font-bold mt-12 mb-6">Key Takeaways</h2>
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>The Head and Shoulders is the most reliable reversal pattern with 89% success rate</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Always wait for neckline break confirmation before entering</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Volume analysis is crucial — look for declining volume through formation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Use proper position sizing — never risk more than 2% per trade</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Consider the throwback trade for best risk:reward entries</span>
                </li>
              </ul>
            </div>
          </section>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/double-top-bottom">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Double Top and Bottom Patterns</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn about these powerful reversal patterns and how they compare to Head and Shoulders.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/risk-management">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Risk Management Fundamentals</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master position sizing and stop loss strategies for consistent profitability.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quiz CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Test Your Knowledge</h3>
              <p className="text-muted-foreground mb-6">
                Take our comprehensive trading quiz to reinforce what you've learned
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/quiz/trading-knowledge">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Take the Quiz
                  </button>
                </Link>
                <Link to="/chart-patterns/library">
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    Explore Pattern Library
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeadAndShoulders;
