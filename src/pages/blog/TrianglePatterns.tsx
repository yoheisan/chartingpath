import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Target, CheckCircle, AlertTriangle } from "lucide-react";
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

const TrianglePatterns = () => {
  const tocSections = [
    { id: 'introduction', title: 'Understanding Triangle Patterns' },
    { id: 'ascending-triangle', title: 'Ascending Triangle', level: 'novice' as const },
    { id: 'descending-triangle', title: 'Descending Triangle', level: 'novice' as const },
    { id: 'symmetrical-triangle', title: 'Symmetrical Triangle', level: 'intermediate' as const },
    { id: 'trading-strategies', title: 'Trading Strategies', level: 'advanced' as const },
    { id: 'volume-confirmation', title: 'Volume Analysis', level: 'intermediate' as const },
    { id: 'failed-triangles', title: 'Failed Patterns & Traps', level: 'professional' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">Continuation Pattern</Badge>
            <Badge variant="outline">Chart Patterns</Badge>
            <Badge variant="secondary">15 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Triangle Patterns: Complete Trading Guide</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master the three types of triangle patterns — ascending, descending, and symmetrical — with professional identification techniques, entry strategies, and risk management frameworks.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Ascending Success', value: '73%', description: 'Upward breakout' },
              { label: 'Descending Success', value: '64%', description: 'Downward breakdown' },
              { label: 'Symmetrical', value: '71%', description: 'Either direction' },
              { label: 'Avg Move', value: '25-38%', description: 'After breakout' },
            ]}
            title="Triangle Pattern Performance (Bulkowski Research)"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <TrendingUp className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Triangle patterns represent periods of consolidation where price contracts between converging trendlines. 
                They're among the most reliable patterns because they show clear accumulation or distribution before a decisive move.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Triangles form when buyers and sellers reach a temporary equilibrium, but one side is gradually gaining control. 
              The pattern resolves when price breaks out of the converging boundaries, often with significant momentum as trapped traders exit and new traders enter.
            </p>

            <div className="bg-muted/30 p-6 rounded-lg mb-8">
              <h4 className="font-semibold mb-4">The Three Triangle Types at a Glance</h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h5 className="font-semibold">Ascending</h5>
                  <p className="text-sm text-muted-foreground">Bullish bias (73%)</p>
                  <p className="text-xs text-muted-foreground mt-1">Flat resistance, rising support</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10">
                  <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <h5 className="font-semibold">Descending</h5>
                  <p className="text-sm text-muted-foreground">Bearish bias (64%)</p>
                  <p className="text-xs text-muted-foreground mt-1">Falling resistance, flat support</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h5 className="font-semibold">Symmetrical</h5>
                  <p className="text-sm text-muted-foreground">Neutral (54% up)</p>
                  <p className="text-xs text-muted-foreground mt-1">Both lines converging</p>
                </div>
              </div>
            </div>
          </section>

          {/* ASCENDING TRIANGLE - NOVICE */}
          <section id="ascending-triangle">
            <h2 className="text-2xl font-bold mt-12 mb-4">Ascending Triangle (Bullish)</h2>
            
            <div className="my-8 rounded-xl overflow-hidden border border-border bg-card">
              <LazyPatternChart patternType="ascending-triangle" width={800} height={500} />
            </div>

            <SkillLevelSection level="novice" title="Understanding the Ascending Triangle">
              <p className="text-muted-foreground mb-4">
                Think of an ascending triangle as buyers gradually pushing price higher while sellers defend a ceiling. 
                Each time sellers push price down, buyers step in at higher prices — showing increasing bullish conviction.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-3">Pattern Structure</h4>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-sm font-bold">1</span>
                      Flat Resistance (Ceiling)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price repeatedly hits a horizontal resistance level but fails to break through. This shows consistent selling pressure at a specific price.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-sm font-bold">2</span>
                      Rising Support (Floor)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Each pullback finds support at a higher level. Connect at least 2-3 higher lows to draw the ascending trendline.
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-green-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-sm font-bold">✓</span>
                      Breakout Confirmation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Pattern completes when price breaks above resistance with increased volume. Wait for a daily close above the level for confirmation.
                  </CardContent>
                </Card>
              </div>

              <PatternChecklist 
                items={[
                  { text: 'Horizontal resistance with at least 2 touches', critical: true },
                  { text: 'Rising support line with at least 2 higher lows', critical: true },
                  { text: 'Pattern forms over 3 weeks to 3 months' },
                  { text: 'Volume decreases during formation' },
                  { text: 'Breakout occurs with 50%+ volume increase', critical: true },
                  { text: 'Prior uptrend exists (for continuation)' },
                ]}
              />

              <ProTip>
                The closer price gets to the apex (where the lines meet), the more explosive the breakout. 
                But breakouts at the apex are less reliable — ideal breakouts occur at 2/3 to 3/4 of the pattern width.
              </ProTip>
            </SkillLevelSection>

            <Card className="bg-muted/30 my-6">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Measured Move Target</p>
                  <p className="text-xl font-mono font-bold">
                    Target = Breakout + (Height of Triangle)
                  </p>
                </div>
                <div className="bg-background/50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Example:</strong> Triangle high at $50, low at $42, breakout at $50.50<br />
                    Height = $50 - $42 = $8<br />
                    Target = $50.50 + $8 = <strong className="text-green-500">$58.50</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Average upside move: 38% per Bulkowski's research</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* DESCENDING TRIANGLE - NOVICE */}
          <section id="descending-triangle">
            <h2 className="text-2xl font-bold mt-12 mb-4">Descending Triangle (Bearish)</h2>
            
            <div className="my-8 rounded-xl overflow-hidden border border-border bg-card">
              <LazyPatternChart patternType="descending-triangle" width={800} height={500} />
            </div>

            <SkillLevelSection level="novice" title="Understanding the Descending Triangle">
              <p className="text-muted-foreground mb-4">
                The descending triangle is the mirror image of the ascending — sellers are in control. 
                Each rally fails at a lower high, while buyers defend a horizontal support level that eventually breaks.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-3">Pattern Structure</h4>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-sm font-bold">1</span>
                      Falling Resistance (Descending Ceiling)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Each rally hits resistance at a lower level. Sellers are becoming more aggressive — they don't wait for price to reach previous highs.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-sm font-bold">2</span>
                      Flat Support (Horizontal Floor)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price repeatedly tests but doesn't break a horizontal support level. Buyers defend this level, but pressure is building.
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-sm font-bold">!</span>
                      Breakdown Confirmation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Pattern completes when price breaks below support with increased volume. This often triggers stop losses and accelerates the move.
                  </CardContent>
                </Card>
              </div>

              <PatternChecklist 
                items={[
                  { text: 'Horizontal support with at least 2 touches', critical: true },
                  { text: 'Falling resistance line with at least 2 lower highs', critical: true },
                  { text: 'Pattern duration: 3 weeks to 3 months' },
                  { text: 'Volume typically decreases during formation' },
                  { text: 'Breakdown occurs with volume spike', critical: true },
                  { text: 'Prior downtrend exists (for continuation)' },
                ]}
              />
            </SkillLevelSection>

            <TradingRule type="entry" title="Short Entry Strategy">
              <p><strong>Conservative:</strong> Enter short on daily close below support with volume confirmation.</p>
              <p className="mt-2"><strong>Aggressive:</strong> Enter short when price touches descending resistance during formation (higher risk).</p>
              <p className="mt-2"><strong>Re-test entry:</strong> Wait for support to become resistance after breakdown. Often provides best risk:reward.</p>
            </TradingRule>
          </section>

          {/* SYMMETRICAL TRIANGLE - INTERMEDIATE */}
          <section id="symmetrical-triangle">
            <h2 className="text-2xl font-bold mt-12 mb-4">Symmetrical Triangle (Neutral)</h2>
            
            <div className="my-8 rounded-xl overflow-hidden border border-border bg-card">
              <LazyPatternChart patternType="symmetrical-triangle" width={800} height={500} />
            </div>

            <SkillLevelSection level="intermediate" title="Trading the Symmetrical Triangle">
              <p className="text-muted-foreground mb-4">
                The symmetrical triangle shows a market in balance — both buyers and sellers are equally aggressive. 
                Price is being squeezed between converging trendlines, and energy is building for a breakout in either direction.
              </p>

              <Alert className="mb-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Key Insight:</strong> While symmetrical triangles are "neutral," they tend to break in the direction of the prior trend. 
                  If an uptrend preceded the triangle, expect an upward breakout (and vice versa). This happens ~54% of the time upward.
                </AlertDescription>
              </Alert>

              <h4 className="font-semibold text-lg mt-6 mb-3">Pattern Structure</h4>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Falling Resistance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Connect at least 2 lower highs. Each rally fails at a lower level as sellers become more aggressive.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Rising Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Connect at least 2 higher lows. Each dip finds buyers at higher prices — bulls are becoming more aggressive too.
                  </CardContent>
                </Card>
              </div>

              <h4 className="font-semibold text-lg mt-8 mb-4">Breakout Timing</h4>
              <div className="bg-muted/30 p-6 rounded-lg mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-red-500" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pattern Start</span>
                  <span className="text-blue-500 font-semibold">Ideal Breakout Zone (2/3 - 3/4)</span>
                  <span>Apex</span>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Breakouts in the ideal zone have highest reliability. Breakouts near the apex often fail or produce smaller moves.
                </p>
              </div>

              <TradingRule type="entry" title="Symmetrical Triangle Trading Rules">
                <ul className="space-y-2 mt-2">
                  <li>• <strong>Wait for direction:</strong> Don't anticipate — let the market show which way it's going</li>
                  <li>• <strong>Volume confirms:</strong> Breakout volume should be 50%+ above average</li>
                  <li>• <strong>Prior trend bias:</strong> Favor breakouts in direction of prior trend</li>
                  <li>• <strong>Avoid apex breakouts:</strong> Patterns that consolidate too long often fail</li>
                </ul>
              </TradingRule>
            </SkillLevelSection>
          </section>

          {/* TRADING STRATEGIES - ADVANCED */}
          <section id="trading-strategies">
            <SkillLevelSection level="advanced" title="Advanced Trading Strategies">
              <h4 className="font-semibold text-lg mb-4">Entry Strategy Comparison</h4>
              
              <div className="space-y-4 mb-8">
                <TradingRule type="entry" title="Breakout Entry (Most Common)">
                  <p>Enter on daily close beyond pattern boundary with volume confirmation.</p>
                  <p className="mt-2"><strong>Pros:</strong> Confirmation reduces false signals</p>
                  <p><strong>Cons:</strong> Worse entry price, may miss fast moves</p>
                  <p><strong>Stop:</strong> Inside the pattern, below rising support (longs) or above falling resistance (shorts)</p>
                </TradingRule>

                <TradingRule type="entry" title="Anticipation Entry (Aggressive)">
                  <p>Enter at pattern boundary before breakout — long at support or short at resistance within the pattern.</p>
                  <p className="mt-2"><strong>Pros:</strong> Best entry price if correct</p>
                  <p><strong>Cons:</strong> Lower probability, pattern may not complete</p>
                  <p><strong>Stop:</strong> Beyond opposite boundary + buffer</p>
                </TradingRule>

                <TradingRule type="entry" title="Re-test Entry (Best R:R)">
                  <p>Wait for breakout, then enter when price retests the broken boundary as new support/resistance.</p>
                  <p className="mt-2"><strong>Pros:</strong> Best risk:reward, high probability</p>
                  <p><strong>Cons:</strong> May miss trades that don't retest (~50% retest)</p>
                  <p><strong>Stop:</strong> Just beyond the old boundary</p>
                </TradingRule>
              </div>

              <h4 className="font-semibold text-lg mt-8 mb-4">Target Calculation Methods</h4>
              <Card className="bg-muted/30 mb-6">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-background/50">
                      <p className="font-semibold mb-2">Method 1: Pattern Height</p>
                      <p className="text-sm text-muted-foreground">Target = Breakout + Height of pattern at widest point</p>
                      <p className="text-xs text-muted-foreground mt-1">Most common approach, works ~75% of time</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50">
                      <p className="font-semibold mb-2">Method 2: Prior Move Projection</p>
                      <p className="text-sm text-muted-foreground">Target = Breakout + Length of move before pattern</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on measured move concept</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50">
                      <p className="font-semibold mb-2">Method 3: Fibonacci Extensions</p>
                      <p className="text-sm text-muted-foreground">Target = 1.618 or 2.618 extension of pattern height</p>
                      <p className="text-xs text-muted-foreground mt-1">For extended moves in strong trends</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <RiskManagementBox
                positionSize="1-2% account risk per trade"
                stopLoss="Inside pattern, beyond opposite boundary"
                riskReward="Minimum 1:2, ideally 1:3+"
                maxRisk="Reduce size if pattern near apex"
              />
            </SkillLevelSection>
          </section>

          {/* VOLUME CONFIRMATION - INTERMEDIATE */}
          <section id="volume-confirmation">
            <SkillLevelSection level="intermediate" title="Volume Analysis in Triangles">
              <p className="text-muted-foreground mb-6">
                Volume behavior during triangle formation is one of the most important confirmation factors. 
                Professional traders use volume to validate patterns and confirm breakouts.
              </p>

              <h4 className="font-semibold text-lg mb-4">Volume During Formation</h4>
              <div className="bg-muted/30 p-6 rounded-lg mb-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-24 text-sm font-medium text-right flex-shrink-0">Early Pattern</div>
                    <div className="flex-1 bg-blue-500/20 h-6 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-blue-500 rounded" style={{ width: '80%' }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">High Volume</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-24 text-sm font-medium text-right flex-shrink-0">Mid-Pattern</div>
                    <div className="flex-1 bg-blue-500/20 h-6 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-blue-500 rounded" style={{ width: '50%' }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">Declining</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-24 text-sm font-medium text-right flex-shrink-0">Near Apex</div>
                    <div className="flex-1 bg-blue-500/20 h-6 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-blue-500 rounded" style={{ width: '25%' }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">Very Low</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-24 text-sm font-medium text-right flex-shrink-0">Breakout</div>
                    <div className="flex-1 bg-green-500/20 h-6 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-green-500 rounded" style={{ width: '95%' }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">Volume Spike!</span>
                    </div>
                  </div>
                </div>
              </div>

              <ProTip>
                If volume doesn't decrease during formation, the pattern may be accumulation/distribution rather than a triangle. 
                The volume contraction is essential — it shows participants stepping aside before the resolution.
              </ProTip>

              <h4 className="font-semibold text-lg mt-8 mb-4">Breakout Volume Requirements</h4>
              <PatternChecklist 
                title="Volume Confirmation Checklist"
                items={[
                  { text: 'Breakout volume at least 50% above 20-day average', critical: true },
                  { text: 'Volume increases on first candle beyond boundary' },
                  { text: 'Follow-through day with above-average volume' },
                  { text: 'Low-volume pullbacks after breakout (healthy retest)' },
                  { text: 'Avoid breakouts with below-average volume', critical: true },
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* FAILED TRIANGLES - PROFESSIONAL */}
          <section id="failed-triangles">
            <SkillLevelSection level="professional" title="Failed Patterns & Trap Detection">
              <p className="text-muted-foreground mb-6">
                Not every triangle works. Failed patterns can actually be more profitable than successful ones — 
                if you know how to recognize and trade them.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">Signs of a Failing Pattern</h4>
              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/30">
                  <h5 className="font-semibold text-red-500 mb-2">1. Breakout Without Volume</h5>
                  <p className="text-sm text-muted-foreground">
                    Price breaks the boundary but volume is average or below. This often leads to failure within 2-3 days.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/30">
                  <h5 className="font-semibold text-red-500 mb-2">2. Apex Breakout</h5>
                  <p className="text-sm text-muted-foreground">
                    When price consolidates too long (more than 3/4 of pattern width), the stored energy dissipates. 
                    These breakouts have ~50% higher failure rate.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/30">
                  <h5 className="font-semibold text-red-500 mb-2">3. Counter-Trend Triangle</h5>
                  <p className="text-sm text-muted-foreground">
                    A bullish ascending triangle forming in a strong downtrend, or bearish descending in strong uptrend. 
                    These have higher failure rates.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/30">
                  <h5 className="font-semibold text-red-500 mb-2">4. Immediate Reversal</h5>
                  <p className="text-sm text-muted-foreground">
                    If price reverses within 2 days of breakout and closes back inside the pattern, consider it a failure. 
                    This often signals a move in the opposite direction.
                  </p>
                </div>
              </div>

              <TradingRule type="entry" title="Trading the Failed Breakout">
                <p>When a triangle breakout fails and price reverses back through the pattern, consider trading the opposite direction:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>Entry:</strong> When price closes beyond the opposite boundary</li>
                  <li>• <strong>Stop:</strong> At the failed breakout high/low</li>
                  <li>• <strong>Target:</strong> Pattern height in new direction, or more</li>
                </ul>
                <p className="mt-2 text-sm">Failed patterns often produce moves larger than successful ones due to trapped traders.</p>
              </TradingRule>

              <CommonMistakes 
                mistakes={[
                  "Trading intraday breakouts without daily close confirmation",
                  "Entering too early before clear boundary violation",
                  "Ignoring volume — breakouts without volume spike often fail",
                  "Drawing trend lines with only one touch point",
                  "Holding positions when breakout occurs too close to apex",
                  "Not using stops — failed breakouts can reverse violently",
                  "Averaging down on failed breakouts instead of cutting losses"
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* PERFORMANCE DATA TABLE */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Triangle Pattern Performance Data</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-muted-foreground">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Pattern</th>
                    <th className="text-left py-3 px-4">Direction</th>
                    <th className="text-left py-3 px-4">Success Rate</th>
                    <th className="text-left py-3 px-4">Avg Move</th>
                    <th className="text-left py-3 px-4">Throwback Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-semibold">Ascending</td>
                    <td className="py-3 px-4 text-green-500">↑ Upward (73%)</td>
                    <td className="py-3 px-4">73%</td>
                    <td className="py-3 px-4">+38%</td>
                    <td className="py-3 px-4">57%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-semibold">Descending</td>
                    <td className="py-3 px-4 text-red-500">↓ Downward (64%)</td>
                    <td className="py-3 px-4">64%</td>
                    <td className="py-3 px-4">-21%</td>
                    <td className="py-3 px-4">54%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 font-semibold">Symmetrical (Up)</td>
                    <td className="py-3 px-4 text-green-500">↑ Upward</td>
                    <td className="py-3 px-4">71%</td>
                    <td className="py-3 px-4">+31%</td>
                    <td className="py-3 px-4">59%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Symmetrical (Down)</td>
                    <td className="py-3 px-4 text-red-500">↓ Downward</td>
                    <td className="py-3 px-4">72%</td>
                    <td className="py-3 px-4">-17%</td>
                    <td className="py-3 px-4">45%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Data source: Thomas Bulkowski's Encyclopedia of Chart Patterns
            </p>
          </div>

          {/* KEY TAKEAWAYS */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
              <li><strong>Ascending triangles break up 73%</strong> — flat resistance, rising support shows bullish pressure</li>
              <li><strong>Descending triangles break down 64%</strong> — flat support, falling resistance shows bearish pressure</li>
              <li><strong>Symmetrical triangles follow prior trend</strong> — neutral pattern with slight upward bias (54%)</li>
              <li><strong>Volume must contract during formation</strong> — then spike on breakout for confirmation</li>
              <li><strong>Ideal breakouts occur at 2/3 to 3/4 of pattern</strong> — apex breakouts have higher failure rates</li>
              <li><strong>Throwbacks/pullbacks are common (45-59%)</strong> — often provide best entry opportunities</li>
              <li><strong>Failed breakouts can be traded in reverse</strong> — trapped traders fuel the opposite move</li>
            </ol>
          </div>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/wedge-patterns">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Wedge Patterns</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn about rising and falling wedges — similar but distinct from triangles.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/flag-pennant">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Flags and Pennants</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master these short-term continuation patterns for quick trades.
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
                Practice identifying triangle patterns in our interactive quiz
              </p>
              <Link to="/quiz/trading-knowledge">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Take the Quiz
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrianglePatterns;