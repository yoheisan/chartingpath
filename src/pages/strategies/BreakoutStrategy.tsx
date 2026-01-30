import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, AlertTriangle, Zap, ArrowUpRight } from "lucide-react";
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

const BreakoutStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'What is Breakout Trading?' },
    { id: 'types', title: 'Types of Breakouts', level: 'novice' as const },
    { id: 'identification', title: 'Identifying Breakout Setups', level: 'novice' as const },
    { id: 'entry-rules', title: 'Entry Rules', level: 'intermediate' as const },
    { id: 'false-breakouts', title: 'Handling False Breakouts', level: 'intermediate' as const },
    { id: 'risk-management', title: 'Risk Management', level: 'advanced' as const },
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
            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">Price Action</Badge>
            <Badge variant="outline">Technical Strategy</Badge>
            <Badge variant="secondary">14 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Breakout Trading: Capturing Explosive Moves</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Learn to identify and trade price breakouts from consolidation patterns, support/resistance levels, 
            and chart formations — the moments when markets decide their next direction.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Win Rate', value: '40-55%', description: 'Varies by filter' },
              { label: 'Risk-Reward', value: '2:1 to 4:1+', description: 'Target trend continuation' },
              { label: 'Best Timeframes', value: 'Daily/4H', description: 'Higher = more reliable' },
              { label: 'False Breakouts', value: '~50%', description: 'Hence need for filters' },
            ]}
            title="Breakout Trading Statistics"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Zap className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                A breakout occurs when price moves decisively beyond a defined level of support, resistance, 
                or pattern boundary with increased momentum, signaling the start of a new trend or trend continuation.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Breakout trading capitalizes on the moment markets transition from consolidation to trending behavior. 
              These explosive moves occur when accumulated buying or selling pressure finally overcomes a key level. 
              The strategy is favored by momentum traders because breakouts often lead to sustained directional moves 
              with favorable risk-reward ratios.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="ascending-triangle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> An ascending triangle breakout — price breaks above horizontal resistance after multiple tests, 
                confirming bullish momentum.
              </div>
            </div>
          </section>

          {/* Types of Breakouts */}
          <section id="types">
            <SkillLevelSection level="novice" title="Types of Breakouts">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50 border-l-4 border-green-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                      1. Horizontal Level Breakouts
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Price breaks above resistance or below support that has been tested multiple times. 
                      The more tests, the more significant the breakout when it occurs.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-blue-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      2. Chart Pattern Breakouts
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Breakouts from <Link to="/learn/triangle-patterns" className="text-primary hover:underline">triangles</Link>, 
                      <Link to="/learn/flag-pennant-patterns" className="text-primary hover:underline"> flags</Link>, 
                      <Link to="/learn/wedge-patterns" className="text-primary hover:underline"> wedges</Link>, and other formations. 
                      These often have measured move targets based on pattern height.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-purple-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      3. Range Breakouts
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Price breaks out of a defined trading range after consolidation. 
                      The longer the range, the more powerful the breakout tends to be.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-amber-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">
                      4. Volatility Breakouts
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Price moves beyond a volatility envelope (Bollinger Bands, ATR bands, Keltner Channels). 
                      These signal abnormal momentum regardless of specific price levels.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                Not all breakouts are equal. Breakouts from longer consolidation periods with multiple tests 
                tend to be more reliable than breakouts from short, untested ranges.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* Identification */}
          <section id="identification">
            <SkillLevelSection level="novice" title="Identifying High-Probability Breakout Setups">
              <PatternChecklist 
                title="Breakout Validation Checklist"
                items={[
                  { text: 'Level has been tested 2-4+ times (more tests = more significant)', critical: true },
                  { text: 'Price is consolidating in a tightening range before breakout', critical: true },
                  { text: 'Volume is declining during consolidation (coiling)', critical: false },
                  { text: 'The breakout candle has above-average volume', critical: true },
                  { text: 'Breakout occurs in direction of higher timeframe trend', critical: false },
                  { text: 'Price closes beyond the level (not just wicks)', critical: true },
                  { text: 'No major resistance immediately above breakout level', critical: false },
                ]}
              />

              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mt-6">
                <h4 className="font-semibold mb-3">The Squeeze Setup</h4>
                <p className="text-sm text-muted-foreground">
                  The highest-probability breakouts occur after volatility contraction — when Bollinger Bands 
                  narrow inside Keltner Channels (the "TTM Squeeze"). This compression precedes explosive moves 
                  as pent-up energy is released.
                </p>
              </div>
            </SkillLevelSection>
          </section>

          {/* Entry Rules */}
          <section id="entry-rules">
            <SkillLevelSection level="intermediate" title="Breakout Entry Rules">
              <h4 className="text-lg font-semibold mb-4">1. Aggressive Entry (Breakout)</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  Enter immediately when price breaks above resistance (long) or below support (short) 
                  with a strong candle and increased volume. Use a buy-stop order at the breakout level.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop just below the breakout level (for longs) or just above (for shorts). 
                  If price falls back into the range, the breakout has failed.
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Target 1.5-2x the height of the consolidation range, or the next significant 
                  resistance/support level.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">2. Conservative Entry (Retest)</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  Wait for the breakout to occur, then wait for price to pull back and retest 
                  the breakout level as new support/resistance. Enter on the bounce.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop below the retest low (for longs) — typically 0.5-1x ATR below 
                  the breakout level.
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Same targets as aggressive entry, but with better risk-reward due to tighter stop.
                </TradingRule>
              </div>

              <Alert className="mt-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Trade-Off:</strong> Aggressive entries catch more of the move but have lower win rates. 
                  Conservative retest entries have higher win rates but sometimes miss the move if no retest occurs.
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* False Breakouts */}
          <section id="false-breakouts">
            <SkillLevelSection level="intermediate" title="Handling False Breakouts">
              <p className="text-muted-foreground mb-6">
                Up to 50% of breakouts fail. False breakouts (also called "fakeouts" or "traps") occur when 
                price breaks a level only to quickly reverse back into the range. Here's how to handle them:
              </p>

              <h4 className="text-lg font-semibold mb-4">Recognizing False Breakouts</h4>
              <div className="grid gap-4 mb-6">
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-red-600 dark:text-red-400">Low Volume Breakout:</strong> 
                    {" "}Breakout occurs on below-average volume — lack of conviction, likely to fail.
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-red-600 dark:text-red-400">Wick-Only Close:</strong> 
                    {" "}Price breaks level intraday but closes back inside — rejection signal.
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-red-600 dark:text-red-400">Immediate Reversal:</strong> 
                    {" "}Price reverses within 1-3 candles of breakout — trapped traders.
                  </CardContent>
                </Card>
              </div>

              <h4 className="text-lg font-semibold mb-4">Trading the Failed Breakout</h4>
              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Failed breakouts can be excellent counter-trend opportunities:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• If a bullish breakout fails and reverses, go short with stop above the false high</li>
                  <li>• Target the opposite end of the range (old support)</li>
                  <li>• These trades trap breakout traders, causing forced liquidation</li>
                </ul>
              </div>

              <CommonMistakes 
                mistakes={[
                  'Entering breakouts without volume confirmation',
                  'Using stops too tight (normal volatility triggers them)',
                  'Chasing breakouts after they\'ve already extended significantly',
                  'Trading every breakout instead of waiting for A+ setups',
                  'Not waiting for the candle close (entering on wicks)',
                  'Ignoring the higher timeframe trend direction',
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* Risk Management */}
          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management for Breakout Trading">
              <RiskManagementBox 
                positionSize="1-2% of account per trade"
                stopLoss="Below breakout level + buffer"
                riskReward="1.5:1 or better"
                maxRisk="Max 3 similar breakouts open"
              />

              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mt-6">
                <h4 className="font-semibold mb-3">Position Sizing for Breakouts</h4>
                <div className="font-mono text-sm bg-background/50 p-4 rounded">
                  <p>Account Size: $50,000</p>
                  <p>Risk Per Trade: 1% = $500</p>
                  <p>Stop Distance: 2% below entry</p>
                  <p className="mt-2">Position Size = $500 / 2% = $25,000</p>
                  <p className="text-muted-foreground">= 50% of account per trade at 1% risk</p>
                </div>
              </div>
            </SkillLevelSection>
          </section>

          {/* Professional Techniques */}
          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Breakout Techniques">
              <h4 className="text-lg font-semibold mb-4">Multi-Timeframe Breakout Confirmation</h4>
              <p className="text-muted-foreground mb-4">
                The most reliable breakouts occur when multiple timeframes align. A daily breakout 
                is more significant if the weekly chart also shows a breakout from a larger pattern.
              </p>

              <h4 className="text-lg font-semibold mb-4">Order Flow Confirmation</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  Professional traders use order flow data to validate breakouts:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Delta:</strong> Positive delta on bullish breakouts (more buying at ask)</li>
                  <li>• <strong>Large Prints:</strong> Institutional orders appearing at breakout level</li>
                  <li>• <strong>Absorption:</strong> Selling absorbed without price falling back</li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">Measured Move Targets</h4>
              <div className="space-y-3">
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Rectangles:</strong> Height of rectangle added to breakout point
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Triangles:</strong> Base width added to breakout point
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Flags:</strong> Length of flagpole added to breakout point
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Head & Shoulders:</strong> Head-to-neckline distance from neckline break
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* Summary */}
          <section className="mt-12">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <CardHeader>
                <CardTitle>Breakout Strategy Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Best For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Momentum-oriented traders</li>
                      <li>• Those comfortable with moderate win rates</li>
                      <li>• Patient traders who wait for setups</li>
                      <li>• Pattern recognition skills</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Not Ideal For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Those who can't handle false breakouts</li>
                      <li>• Traders needing constant action</li>
                      <li>• Range-trading personality types</li>
                      <li>• Those without patience for consolidation</li>
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
              <Link to="/learn/strategies/trend-following" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Trend Following</h4>
                    <p className="text-sm text-muted-foreground">Riding extended breakout moves</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/momentum-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Momentum Trading</h4>
                    <p className="text-sm text-muted-foreground">Capturing strong directional moves</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/support-resistance" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Support & Resistance</h4>
                    <p className="text-sm text-muted-foreground">Understanding key levels</p>
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

export default BreakoutStrategy;
