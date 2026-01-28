import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Target, CheckCircle, AlertTriangle } from "lucide-react";
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

const DoubleTopBottom = () => {
  const tocSections = [
    { id: 'introduction', title: 'Understanding Double Tops & Bottoms' },
    { id: 'double-top-novice', title: 'Double Top Basics', level: 'novice' as const },
    { id: 'double-top-trading', title: 'Trading the Double Top', level: 'intermediate' as const },
    { id: 'double-bottom-novice', title: 'Double Bottom Basics', level: 'novice' as const },
    { id: 'double-bottom-trading', title: 'Trading the Double Bottom', level: 'intermediate' as const },
    { id: 'advanced-techniques', title: 'Advanced Techniques', level: 'advanced' as const },
    { id: 'risk-management', title: 'Risk Management Discipline' },
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
            <Badge variant="destructive">Reversal Pattern</Badge>
            <Badge variant="outline">Chart Patterns</Badge>
            <Badge variant="secondary">12 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Double Top and Double Bottom Patterns: Complete Guide</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master these high-probability reversal patterns used by professional traders worldwide — from basic identification to advanced execution strategies.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Double Top Success', value: '78%', description: 'Bearish reversal' },
              { label: 'Double Bottom Success', value: '79%', description: 'Bullish reversal' },
              { label: 'Avg Move', value: '20-35%', description: 'After confirmation' },
              { label: 'Pullback Rate', value: '60-64%', description: 'Retest frequency' },
            ]}
            title="Pattern Performance (Bulkowski Research)"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <TrendingDown className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Double Tops and Double Bottoms are among the most common and reliable reversal patterns in technical analysis. 
                They signal trend exhaustion when price fails to break a key level twice — indicating a shift in market sentiment.
              </AlertDescription>
            </Alert>
          </section>

          {/* DOUBLE TOP - NOVICE */}
          <section id="double-top-novice">
            <h2 className="text-2xl font-bold mt-12 mb-4">Double Top Pattern (Bearish Reversal)</h2>
            
            <div className="my-8 rounded-xl overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="double-top" width={800} height={500} />
            </div>

            <SkillLevelSection level="novice" title="Understanding the Double Top">
              <p className="text-muted-foreground">
                Think of a Double Top as the market hitting its head on a ceiling twice. After the second failed attempt to break through, the market gives up and falls back down.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-3">The "M" Shape</h4>
              <p className="text-muted-foreground mb-4">
                The Double Top looks like the letter "M" on your chart:
              </p>

              <div className="grid gap-4">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-sm font-bold">1</span>
                      First Peak
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price rises to a high point during an uptrend, then pulls back. Buyers take profits, causing a temporary dip.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-sm font-bold">2</span>
                      Valley (Neckline)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    The low point between the two peaks. This becomes the critical support level — when it breaks, the pattern confirms.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-sm font-bold">3</span>
                      Second Peak
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price rallies again but fails to break above the first peak. This shows buyers are exhausted and sellers are gaining control.
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-sm font-bold">!</span>
                      Confirmation Break
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    When price breaks below the valley low (neckline) with increased volume, the pattern is confirmed and the sell signal is triggered.
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                The two peaks should be within 3% of each other in price. If they're exactly the same, be suspicious — natural markets rarely create perfect symmetry.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* DOUBLE TOP - TRADING */}
          <section id="double-top-trading">
            <SkillLevelSection level="intermediate" title="Trading the Double Top">
              <PatternChecklist 
                items={[
                  { text: 'Prior uptrend of at least 10% or 3 months', critical: true },
                  { text: 'Two peaks within 3-4% of each other', critical: true },
                  { text: 'Valley depth is at least 10% from peaks' },
                  { text: 'Second peak has lower volume than first', critical: true },
                  { text: 'Time between peaks: 2 weeks to 3 months' },
                  { text: 'Neckline break with 50%+ volume increase', critical: true },
                ]}
              />

              <h4 className="font-semibold text-lg mt-6 mb-4">Entry Strategies</h4>
              
              <div className="space-y-4 mb-8">
                <TradingRule type="entry" title="Conservative Entry">
                  <p>Enter short when price closes below the neckline (valley low) with increased volume. This is the safest approach with highest confirmation.</p>
                </TradingRule>

                <TradingRule type="entry" title="Aggressive Entry">
                  <p>Enter short when price fails at the second peak. Use when volume divergence is clear (second peak has much lower volume).</p>
                </TradingRule>

                <TradingRule type="entry" title="Throwback Entry (Best R:R)">
                  <p>Wait for price to break neckline, then rally back to test it as resistance. Enter short when this retest fails. Occurs in ~60% of patterns.</p>
                </TradingRule>
              </div>

              <h4 className="font-semibold text-lg mb-4">Stop Loss & Targets</h4>
              
              <TradingRule type="stop" title="Stop Loss Placement">
                <p>Place stop loss above the highest peak, plus a small buffer (1-2%). This invalidates the pattern if triggered.</p>
              </TradingRule>

              <Card className="bg-muted/30 my-6">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Measured Move Target</p>
                    <p className="text-2xl font-mono font-bold">
                      Target = Neckline − (Peak − Neckline)
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Example:</strong> Peaks at $100, Neckline at $85, Break at $84<br />
                      Target = $84 − ($100 − $85) = $84 − $15 = <strong className="text-red-500">$69</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Average decline: 20% per Bulkowski's research</p>
                  </div>
                </CardContent>
              </Card>
            </SkillLevelSection>
          </section>

          {/* DOUBLE BOTTOM - NOVICE */}
          <section id="double-bottom-novice">
            <h2 className="text-2xl font-bold mt-12 mb-4">Double Bottom Pattern (Bullish Reversal)</h2>
            
            <div className="my-8 rounded-xl overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="double-bottom" width={800} height={500} />
            </div>

            <SkillLevelSection level="novice" title="Understanding the Double Bottom">
              <p className="text-muted-foreground">
                The Double Bottom is the mirror image of the Double Top. Think of it as the market bouncing off a floor twice — after the second bounce, buyers take control and push prices higher.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-3">The "W" Shape</h4>
              <p className="text-muted-foreground mb-4">
                The Double Bottom looks like the letter "W" on your chart:
              </p>

              <div className="grid gap-4">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-sm font-bold">1</span>
                      First Trough
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price falls to a low point during a downtrend, then bounces. Sellers take profits and buyers step in, causing a temporary rally.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-sm font-bold">2</span>
                      Peak (Neckline)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    The high point between the two troughs. This becomes critical resistance — when it breaks, the pattern confirms.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-sm font-bold">3</span>
                      Second Trough
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Price falls again but fails to break below the first trough. Sellers are exhausted — buyers see this as a buying opportunity.
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-green-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-sm font-bold">✓</span>
                      Confirmation Break
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    When price breaks above the middle peak (neckline) with increased volume, the pattern confirms and the buy signal is triggered.
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                Double Bottoms typically produce larger moves than Double Tops (35% average rise vs 20% average decline). This is because fear (downtrend) often capitulates faster than greed (uptrend) exhausts.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* DOUBLE BOTTOM - TRADING */}
          <section id="double-bottom-trading">
            <SkillLevelSection level="intermediate" title="Trading the Double Bottom">
              <PatternChecklist 
                items={[
                  { text: 'Prior downtrend of at least 10% or 3 months', critical: true },
                  { text: 'Two troughs within 3-4% of each other', critical: true },
                  { text: 'Peak height is at least 10% from troughs' },
                  { text: 'Second trough has higher or equal volume to first', critical: true },
                  { text: 'Bullish divergence on RSI/MACD (optional but powerful)' },
                  { text: 'Neckline break with 50%+ volume increase', critical: true },
                ]}
              />

              <h4 className="font-semibold text-lg mt-6 mb-4">Entry Strategies</h4>
              
              <div className="space-y-4 mb-8">
                <TradingRule type="entry" title="Conservative Entry">
                  <p>Enter long when price closes above the neckline (middle peak) with increased volume. Highest probability of success.</p>
                </TradingRule>

                <TradingRule type="entry" title="Pullback Entry (Best R:R)">
                  <p>Wait for price to break neckline, then pull back to test it as support. Enter long when this retest holds. Occurs in ~64% of patterns.</p>
                </TradingRule>
              </div>

              <h4 className="font-semibold text-lg mb-4">Stop Loss & Targets</h4>
              
              <TradingRule type="stop" title="Stop Loss Placement">
                <p>Place stop loss below the lowest trough, minus a small buffer (1-2%). This invalidates the pattern if triggered.</p>
              </TradingRule>

              <Card className="bg-muted/30 my-6">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Measured Move Target</p>
                    <p className="text-2xl font-mono font-bold">
                      Target = Neckline + (Neckline − Trough)
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Example:</strong> Troughs at $50, Neckline at $65, Break at $66<br />
                      Target = $66 + ($65 − $50) = $66 + $15 = <strong className="text-green-500">$81</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Average rise: 35% per Bulkowski's research</p>
                  </div>
                </CardContent>
              </Card>
            </SkillLevelSection>
          </section>

          {/* ADVANCED TECHNIQUES */}
          <section id="advanced-techniques">
            <SkillLevelSection level="advanced" title="Advanced Techniques">
              <h4 className="font-semibold text-lg mb-4">Volume Profile Analysis</h4>
              <p className="text-muted-foreground mb-4">
                Professional traders analyze volume at each stage of the pattern:
              </p>

              <div className="bg-muted/30 p-6 rounded-lg mb-6">
                <h5 className="font-medium mb-4">Double Top Volume Profile</h5>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm">First Peak</div>
                    <div className="flex-1 bg-blue-500/20 h-5 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-blue-500 rounded" style={{ width: '75%' }} />
                    </div>
                    <span className="text-xs w-16">High</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm">Second Peak</div>
                    <div className="flex-1 bg-orange-500/20 h-5 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-orange-500 rounded" style={{ width: '45%' }} />
                    </div>
                    <span className="text-xs w-16">Lower ✓</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm">Breakout</div>
                    <div className="flex-1 bg-red-500/20 h-5 rounded relative">
                      <div className="absolute inset-y-0 left-0 bg-red-500 rounded" style={{ width: '90%' }} />
                    </div>
                    <span className="text-xs w-16">Spike! ✓</span>
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-lg mb-4">Adam and Eve Variations</h4>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardContent className="pt-4">
                    <h5 className="font-medium mb-2">Adam Peak/Trough</h5>
                    <p className="text-sm text-muted-foreground">Sharp, V-shaped with a single candlestick extreme. Higher volatility reversal.</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4">
                    <h5 className="font-medium mb-2">Eve Peak/Trough</h5>
                    <p className="text-sm text-muted-foreground">Rounded, U-shaped with multiple candlesticks. More gradual reversal.</p>
                  </CardContent>
                </Card>
              </div>

              <Alert className="border-primary/50 bg-primary/5">
                <AlertDescription>
                  <strong>Research Finding:</strong> "Adam-Eve" combinations (one sharp, one rounded) tend to perform better than pure "Adam-Adam" or "Eve-Eve" patterns, according to Bulkowski's research.
                </AlertDescription>
              </Alert>

              <h4 className="font-semibold text-lg mt-8 mb-4">Failed Pattern Exploitation</h4>
              <p className="text-muted-foreground mb-4">
                When a Double Top fails (price breaks above both peaks), it often leads to an explosive continuation move. The same applies when a Double Bottom fails to the downside.
              </p>
              <TradingRule type="risk" title="Busted Pattern Trade">
                <p>If a Double Top breaks above the peaks, consider going long with stop below neckline. The failed pattern often leads to a move 1.5-2x the original pattern height.</p>
              </TradingRule>
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
              stopLoss="Beyond the extreme peak/trough"
              riskReward="Minimum 1:2 (target ÷ stop distance)"
              maxRisk="Never risk more than 2% on a single pattern"
            />

            <CommonMistakes 
              mistakes={[
                'Trading before neckline break confirmation',
                'Expecting exact price symmetry (3-4% variance is normal)',
                'Ignoring the volume pattern during formation',
                'Not waiting for a daily close beyond neckline',
                'Setting stops too tight near pattern boundaries',
                'Assuming all double tops/bottoms are tradeable',
                'Ignoring the broader market trend',
                'Trading in illiquid markets or penny stocks',
              ]}
            />

            <h4 className="font-semibold text-lg mt-8 mb-4">Key Takeaways</h4>
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Double Tops and Bottoms have ~78-79% success rates when properly validated</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Volume analysis is critical — look for decreasing volume on second peak/trough</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Wait for neckline break confirmation before entering</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Pullback entries (60-64% occurrence) offer the best risk:reward</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Use measured move targets but scale out at multiple levels</span>
                </li>
              </ul>
            </div>
          </section>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/head-and-shoulders">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Head and Shoulders Pattern</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Learn about this powerful three-peak reversal pattern with 89% success rate.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/triangle-patterns">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Triangle Patterns Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master ascending, descending, and symmetrical triangles for continuation trades.
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
                Take our quiz to practice identifying Double Tops and Bottoms
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

export default DoubleTopBottom;
