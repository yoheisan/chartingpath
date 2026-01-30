import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, Clock, Calendar } from "lucide-react";
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

const SwingTradingStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'What is Swing Trading?' },
    { id: 'swing-structure', title: 'Market Swing Structure', level: 'novice' as const },
    { id: 'entry-patterns', title: 'Entry Patterns', level: 'intermediate' as const },
    { id: 'holding-period', title: 'Optimal Holding Periods', level: 'intermediate' as const },
    { id: 'risk-management', title: 'Risk Management', level: 'advanced' as const },
    { id: 'pro-techniques', title: 'Professional Techniques', level: 'professional' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">Multi-Day</Badge>
            <Badge variant="outline">Time-Based Strategy</Badge>
            <Badge variant="secondary">21 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Swing Trading: Capturing Multi-Day Price Swings</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Hold positions for days to weeks, capturing the natural "swing" movements of markets.
            Perfect for traders who can't monitor screens all day but want active involvement.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Typical Timeframe', value: '4H-Daily', description: 'Chart intervals' },
              { label: 'Trade Duration', value: '2-14 Days', description: 'Hold time' },
              { label: 'Trades/Month', value: '5-15', description: 'Frequency' },
              { label: 'Win Rate Target', value: '50-60%', description: 'With 1:2 R:R' },
            ]}
            title="Swing Trading at a Glance"
          />

          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Calendar className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Swing trading exploits the natural rhythm of markets — the tendency to move in waves
                or "swings" between support and resistance levels over multiple days.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Unlike day trading, swing trading allows you to step away from screens while positions work.
              You analyze charts in the evening, place orders, and let the market do its work. This makes
              it ideal for those with full-time jobs or other commitments.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="double-bottom" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> Classic swing trade setup — buying at swing low with stop below support, targeting swing high.
              </div>
            </div>
          </section>

          <section id="swing-structure">
            <SkillLevelSection level="novice" title="Understanding Market Swing Structure">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Swing Highs and Lows
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Markets move in zigzag patterns. A swing high is a peak surrounded by lower peaks on both sides.
                    A swing low is a trough surrounded by higher troughs. These form the structure of trends.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Trend Identification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Uptrend: Higher highs AND higher lows. Downtrend: Lower highs AND lower lows.
                    Swing traders trade WITH the trend, buying pullbacks in uptrends and selling rallies in downtrends.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Swing Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Most swings last 3-10 bars on the chart timeframe. On a daily chart, this means
                    3-10 trading days. Time your entries at the start of new swings for maximum profit potential.
                  </CardContent>
                </Card>
              </div>

              <PatternChecklist
                title="Swing Trade Setup Checklist"
                items={[
                  { text: "Clear trend direction on higher timeframe (weekly)" },
                  { text: "Price pulling back to key support/resistance" },
                  { text: "Volume declining on pullback, expanding on resumption", critical: true },
                  { text: "Entry trigger (candlestick pattern, indicator signal)" },
                  { text: "Clear stop loss level (below swing low)" }
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="entry-patterns">
            <SkillLevelSection level="intermediate" title="High-Probability Entry Patterns">
              <TradingRule title="Flag/Pennant Pullback" type="entry">
                After strong move, price consolidates in tight flag pattern. Enter on breakout from flag with stop below flag low.
              </TradingRule>

              <TradingRule title="Moving Average Bounce" type="entry">
                In uptrends, price often bounces from 20 or 50 EMA. Enter when price touches EMA and shows bullish rejection candle.
              </TradingRule>

              <TradingRule title="Support/Resistance Retest" type="entry">
                After breakout, price often retests the broken level. Enter on successful retest with stop just beyond the level.
              </TradingRule>

              <TradingRule title="Fibonacci Retracement" type="entry">
                Price commonly retraces 38.2%, 50%, or 61.8% of prior swing. Enter at these levels with confluence from other indicators.
              </TradingRule>

              <ProTip>
                The best swing trades occur when daily timeframe entry coincides with weekly
                timeframe support/resistance. This multi-timeframe confluence dramatically
                increases success rates.
              </ProTip>
            </SkillLevelSection>
          </section>

          <section id="holding-period">
            <SkillLevelSection level="intermediate" title="Optimal Holding Periods">
              <div className="space-y-4">
                <h4 className="font-semibold">When to Hold Longer</h4>
                <p className="text-muted-foreground">
                  Extend holds when trend is strong, momentum increasing, and no major resistance ahead.
                  Use trailing stops to protect profits while allowing room for continuation.
                </p>

                <h4 className="font-semibold">When to Exit Early</h4>
                <p className="text-muted-foreground">
                  Cut trades short when momentum wanes (divergence), approaching major news events,
                  or when price stalls at resistance without conviction.
                </p>

                <h4 className="font-semibold">Weekend Holding</h4>
                <p className="text-muted-foreground">
                  Consider reducing position size before weekends to limit gap risk. Alternatively,
                  widen stops slightly to account for potential Monday gaps.
                </p>
              </div>
            </SkillLevelSection>
          </section>

          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management">
              <RiskManagementBox
                positionSize="1-2% account risk per trade"
                stopLoss="Below most recent swing low (longs)"
                riskReward="Minimum 1:2, target 1:3"
                maxRisk="6% total exposure across all swing positions"
              />

              <CommonMistakes
                title="Common Swing Trading Mistakes"
                mistakes={[
                  "Entering counter-trend against strong momentum",
                  "Moving stops to breakeven too early (getting stopped out on normal volatility)",
                  "Not accounting for overnight gaps in stop placement",
                  "Over-trading — forcing trades when no clear setups exist",
                  "Ignoring the weekly trend when trading daily swings"
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Techniques">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">Multiple Position Management</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">
                    Professional swing traders run portfolios of 5-10 positions simultaneously.
                    This diversification smooths equity curves and reduces single-trade impact.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Diversify across sectors to reduce correlation</li>
                    <li>Use correlation analysis — avoid holding multiple highly-correlated positions</li>
                    <li>Scale into winning positions as they prove themselves</li>
                    <li>Cut losers quickly but give winners room to run</li>
                  </ul>
                </CardContent>
              </Card>

              <ProTip>
                Track your average holding period for winners vs. losers. Most traders hold
                losers too long and cut winners too short. Your data will reveal this pattern
                if present.
              </ProTip>
            </SkillLevelSection>
          </section>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Ready to Swing Trade?</h3>
            <p className="text-muted-foreground mb-4">
              Find swing trading setups with our pattern scanner.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/screener" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Find Swing Setups
              </Link>
              <Link to="/learn" className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors">
                More Strategies
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default SwingTradingStrategy;
