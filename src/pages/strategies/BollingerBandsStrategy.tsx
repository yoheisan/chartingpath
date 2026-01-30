import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, Activity, Maximize2 } from "lucide-react";
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

const BollingerBandsStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'Understanding Bollinger Bands' },
    { id: 'band-structure', title: 'Band Structure', level: 'novice' as const },
    { id: 'trading-signals', title: 'Trading Signals', level: 'intermediate' as const },
    { id: 'squeeze-strategy', title: 'The Squeeze Strategy', level: 'advanced' as const },
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
            <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400">Volatility</Badge>
            <Badge variant="outline">Indicator-Based</Badge>
            <Badge variant="secondary">18 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Bollinger Bands Strategy: Trading Volatility</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master the art of volatility trading with Bollinger Bands — from band squeezes to
            mean reversion setups and trend-following band walks.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Best Timeframes', value: '1H-Daily', description: 'Most reliable' },
              { label: 'Primary Use', value: 'Volatility', description: 'Squeeze & expansion' },
              { label: 'Win Rate', value: '55-65%', description: 'Mean reversion' },
              { label: 'Settings', value: '20,2', description: 'Standard' },
            ]}
            title="Bollinger Bands at a Glance"
          />

          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Maximize2 className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Bollinger Bands measure volatility and identify overbought/oversold conditions.
                Created by John Bollinger, they adapt to market conditions dynamically.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Unlike fixed indicators, Bollinger Bands expand and contract based on market volatility.
              This makes them excellent for identifying when volatility is about to increase (squeeze)
              and when prices are extended (mean reversion opportunities).
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="symmetrical-triangle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> Bollinger Band squeeze before breakout — bands tighten during consolidation, then expand on breakout.
              </div>
            </div>
          </section>

          <section id="band-structure">
            <SkillLevelSection level="novice" title="Understanding Band Structure">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Middle Band (SMA 20)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    The 20-period Simple Moving Average serves as the baseline. Price above middle band
                    suggests bullish bias; below suggests bearish. Often acts as dynamic support/resistance.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Upper Band
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Middle band + 2 standard deviations. Represents dynamic resistance. Price touching
                    upper band doesn't mean sell — in strong trends, price "walks the band."
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Lower Band
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Middle band - 2 standard deviations. Represents dynamic support. In downtrends,
                    price can walk the lower band for extended periods.
                  </CardContent>
                </Card>
              </div>

              <PatternChecklist
                title="Bollinger Band Settings"
                items={[
                  { text: "Standard: 20-period SMA, 2 standard deviations" },
                  { text: "Shorter-term: 10,1.5 for faster signals" },
                  { text: "Longer-term: 50,2.5 for position trading" },
                  { text: "Adjust based on asset volatility and timeframe" }
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="trading-signals">
            <SkillLevelSection level="intermediate" title="Trading Signals">
              <TradingRule title="Mean Reversion (Band Touch)" type="entry">
                When price touches outer band in RANGING market, look for reversal back to middle band. Combine with oversold RSI or reversal candlestick.
              </TradingRule>

              <TradingRule title="Band Walk (Trend Following)" type="entry">
                In strong trends, price 'walks' along the band without reversing. Enter on pullbacks to middle band rather than fading the move.
              </TradingRule>

              <TradingRule title="W-Bottom / M-Top" type="entry">
                Classic Bollinger pattern: First low touches lower band, second low is higher and doesn't touch band. Signals momentum shift.
              </TradingRule>

              <TradingRule title="Squeeze Breakout" type="entry">
                When bands tighten significantly (low volatility), prepare for expansion. Trade the breakout in direction of the move with momentum confirmation.
              </TradingRule>

              <ProTip>
                The biggest mistake is fading band touches in trending markets. First identify
                if market is trending or ranging. Only use mean reversion in ranges; use band
                walks in trends.
              </ProTip>
            </SkillLevelSection>
          </section>

          <section id="squeeze-strategy">
            <SkillLevelSection level="advanced" title="The Squeeze Strategy">
              <div className="space-y-4">
                <h4 className="font-semibold">Identifying the Squeeze</h4>
                <p className="text-muted-foreground">
                  A squeeze occurs when bands narrow to 6-month low width. This indicates extremely
                  low volatility, which typically precedes a major move. The direction is unknown,
                  but the move is coming.
                </p>

                <h4 className="font-semibold">Trading the Breakout</h4>
                <p className="text-muted-foreground">
                  Wait for price to close outside the bands with expanding bands. Enter in direction
                  of the breakout. The first expansion bar often sets the trend for days or weeks.
                </p>

                <h4 className="font-semibold">Using Momentum Confirmation</h4>
                <p className="text-muted-foreground">
                  Add the Keltner Channel. When Bollinger Bands are inside Keltner Channels, it's
                  a squeeze. When they break outside, the squeeze is released. Trade in that direction.
                </p>
              </div>

              <CommonMistakes
                title="Squeeze Trading Mistakes"
                mistakes={[
                  "Entering before the squeeze releases (premature entry)",
                  "Not using momentum indicator to confirm direction",
                  "Fighting the breakout direction",
                  "Taking profits too early on squeeze breakouts"
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management">
              <RiskManagementBox
                positionSize="1-2% account risk per trade"
                stopLoss="Beyond opposite band or 1.5x ATR"
                riskReward="1:2 for mean reversion, 1:3+ for squeeze"
                maxRisk="Don't trade bands in choppy, directionless markets"
              />

              <CommonMistakes
                title="Common Bollinger Band Mistakes"
                mistakes={[
                  "Treating band touch as automatic buy/sell signal",
                  "Ignoring whether market is trending or ranging",
                  "Using same strategy in all market conditions",
                  "Not confirming signals with volume or momentum",
                  "Setting stops too tight (within normal band range)"
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Techniques">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">Bandwidth Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">
                    Bandwidth = (Upper Band - Lower Band) / Middle Band. This indicator quantifies
                    the squeeze and helps identify historical low volatility points.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Track bandwidth over time — find 6-month lows</li>
                    <li>Historical low bandwidth often precedes major moves</li>
                    <li>Compare current bandwidth to historical average</li>
                    <li>Use bandwidth expansion to confirm breakouts</li>
                  </ul>
                </CardContent>
              </Card>

              <ProTip>
                Combine Bollinger Bands with %B indicator. %B shows where price is relative to
                the bands (0 = lower band, 1 = upper band, 0.5 = middle). This helps identify
                extreme readings and divergences more precisely.
              </ProTip>
            </SkillLevelSection>
          </section>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Ready to Trade Bollinger Bands?</h3>
            <p className="text-muted-foreground mb-4">
              Find squeeze setups and band trades with our scanner.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/screener" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Find BB Setups
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

export default BollingerBandsStrategy;
