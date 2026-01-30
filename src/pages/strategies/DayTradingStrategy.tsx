import { Link } from "react-router-dom";
import { ArrowLeft, Clock, TrendingUp, Target, Shield, BarChart3, AlertTriangle, Sun } from "lucide-react";
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

const DayTradingStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'What is Day Trading?' },
    { id: 'characteristics', title: 'Key Characteristics', level: 'novice' as const },
    { id: 'market-selection', title: 'Market Selection', level: 'novice' as const },
    { id: 'entry-setups', title: 'Entry Setups', level: 'intermediate' as const },
    { id: 'trade-management', title: 'Trade Management', level: 'intermediate' as const },
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
            <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400">Intraday</Badge>
            <Badge variant="outline">Time-Based Strategy</Badge>
            <Badge variant="secondary">15 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Day Trading Strategy: Complete Intraday Guide</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master the discipline of closing all positions before market close — capturing intraday volatility 
            while sleeping soundly without overnight risk exposure.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Typical Timeframe', value: '5-60 min', description: 'Chart intervals' },
              { label: 'Trade Duration', value: 'Minutes-Hours', description: 'Same day only' },
              { label: 'Daily Trades', value: '3-10', description: 'Quality over quantity' },
              { label: 'Win Rate Target', value: '50-60%', description: 'With good R:R' },
            ]}
            title="Day Trading at a Glance"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Sun className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Day trading involves buying and selling securities within the same trading day. 
                All positions are closed before the market closes, eliminating overnight gap risk.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Day trading offers a middle ground between the intensity of scalping and the patience required for swing trading. 
              You have time to analyze setups properly, but still benefit from the immediate feedback loop of intraday trading. 
              This strategy is popular among retail traders because it provides clear daily P&L and no overnight stress.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="ascending-triangle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> An ascending triangle breakout — a classic day trading setup on a 15-minute chart.
              </div>
            </div>
          </section>

          {/* Key Characteristics */}
          <section id="characteristics">
            <SkillLevelSection level="novice" title="Key Characteristics of Day Trading">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Same-Day Resolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Every trade is opened and closed within the same trading session. 
                    This eliminates overnight gap risk and weekend exposure.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Larger Targets Than Scalping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Day traders target 20-100+ pips per trade, allowing for better risk-reward ratios 
                    and more room for price to develop.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      Focus on Quality Setups
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Unlike scalping, day trading emphasizes waiting for high-probability setups. 
                    3-10 well-chosen trades beat 50 mediocre ones.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-500" />
                      Capital Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    US pattern day trader rules require $25,000 minimum for stocks. 
                    Forex and futures have lower capital requirements.
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                The best day trading opportunities occur during the first 2 hours after market open 
                and the last hour before close. Mid-day sessions (11 AM - 2 PM EST) are often choppy and 
                low-probability.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* Market Selection */}
          <section id="market-selection">
            <SkillLevelSection level="novice" title="Market Selection for Day Trading">
              <p className="text-muted-foreground mb-6">
                Not all markets are created equal for day trading. Choose instruments with the right 
                characteristics for your style.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-green-600 dark:text-green-400">Ideal Markets</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-2">
                      <li>• <strong>ES (S&P 500 Futures):</strong> Deep liquidity, predictable patterns</li>
                      <li>• <strong>NQ (Nasdaq Futures):</strong> Higher volatility, tech-driven</li>
                      <li>• <strong>EUR/USD:</strong> Tightest forex spreads, huge volume</li>
                      <li>• <strong>Large-cap stocks:</strong> AAPL, MSFT, TSLA for momentum</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-red-500/10 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-red-600 dark:text-red-400">Avoid</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-2">
                      <li>• <strong>Penny stocks:</strong> Wide spreads, manipulation risk</li>
                      <li>• <strong>Exotic forex pairs:</strong> Unpredictable, wide spreads</li>
                      <li>• <strong>Illiquid futures:</strong> Slippage destroys edge</li>
                      <li>• <strong>Options without understanding Greeks</strong></li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* Entry Setups */}
          <section id="entry-setups">
            <SkillLevelSection level="intermediate" title="Day Trading Entry Setups">
              <p className="text-muted-foreground mb-6">
                Master these core setups before adding complexity. Each setup has specific conditions 
                that must be met for a valid trade.
              </p>

              <h4 className="text-lg font-semibold mb-4">1. Opening Range Breakout (ORB)</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  Wait for the first 15-30 minutes to establish an opening range. 
                  Enter on a decisive break above/below this range with increased volume.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop at the opposite side of the opening range, or at the 50% level 
                  of the range for tighter risk.
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Target 1.5-2x the opening range height. Trail stop to breakeven after 1R profit.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">2. VWAP Pullback</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  In a trending day, wait for price to pull back to <Link to="/learn/volume-analysis" className="text-primary hover:underline">VWAP</Link>. 
                  Enter when price bounces off VWAP with a confirmation candle.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop just below VWAP (for longs) with a buffer of 2-3 ticks.
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Target the high of the day (for longs) or a measured move equal to 
                  the distance from the day's low to VWAP.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">3. Failed Breakdown/Breakout</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  When price breaks a key level but quickly reverses back (within 2-3 candles), 
                  enter in the direction of the reversal. This traps breakout traders.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop beyond the failed breakout's extreme point.
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Target the opposite end of the range or the next significant support/resistance level.
                </TradingRule>
              </div>
            </SkillLevelSection>
          </section>

          {/* Trade Management */}
          <section id="trade-management">
            <SkillLevelSection level="intermediate" title="Trade Management">
              <p className="text-muted-foreground mb-6">
                How you manage trades in-flight determines long-term profitability more than entry accuracy.
              </p>

              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
                <h4 className="font-semibold mb-4">Scaling Out Strategy</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Many professional day traders scale out of positions in thirds:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>First third:</strong> Exit at 1R (1:1 risk-reward) to lock in profits</li>
                  <li>• <strong>Second third:</strong> Exit at 2R with trailing stop at 1R</li>
                  <li>• <strong>Final third:</strong> Let it run with trailing stop, targeting 3R+</li>
                </ul>
              </div>

              <CommonMistakes 
                mistakes={[
                  'Moving stop loss further away when trade goes against you',
                  'Closing winners too early and letting losers run (disposition effect)',
                  'Adding to losing positions (averaging down)',
                  'Trading during lunch hour when setups are low-probability',
                  'Revenge trading after a loss to "make it back"',
                  'Overtrading on slow days when there are no good setups',
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* Risk Management */}
          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management for Day Traders">
              <RiskManagementBox 
                positionSize="1-2% of account per trade"
                stopLoss="Below key intraday level"
                riskReward="1.5:1 or better"
                maxRisk="3-5% daily loss limit"
              />

              <Alert className="mt-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>The 3-Strike Rule:</strong> If you hit 3 consecutive losses, stop trading for the day. 
                  This prevents emotional spiral trading and protects your capital for tomorrow.
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* Professional Techniques */}
          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Day Trading Techniques">
              <h4 className="text-lg font-semibold mb-4">Multi-Timeframe Analysis</h4>
              <p className="text-muted-foreground mb-4">
                Use the higher timeframe (60-min or daily) to determine bias, then execute on the 
                lower timeframe (5-15 min). Trade in the direction of the higher timeframe trend.
              </p>

              <h4 className="text-lg font-semibold mb-4">Market Internals</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  Professional day traders monitor market internals for confirmation:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>$TICK:</strong> NYSE tick readings above +800 = bullish, below -800 = bearish</li>
                  <li>• <strong>$ADD:</strong> Advancing/declining issues ratio</li>
                  <li>• <strong>$VOLD:</strong> Up volume vs. down volume</li>
                  <li>• <strong>VIX:</strong> Volatility expansion/contraction</li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">Pre-Market Preparation</h4>
              <PatternChecklist 
                title="Daily Preparation Checklist"
                items={[
                  { text: 'Review overnight price action and gaps', critical: true },
                  { text: 'Check economic calendar for news events', critical: true },
                  { text: 'Identify key support/resistance levels', critical: true },
                  { text: 'Set daily bias (bullish, bearish, or neutral)' },
                  { text: 'Review yesterday\'s trades and lessons' },
                  { text: 'Set mental and physical state (hydrated, focused)' },
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* Summary */}
          <section className="mt-12">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <CardHeader>
                <CardTitle>Day Trading Strategy Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Best For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Traders with 4+ hours of screen time daily</li>
                      <li>• Those who want immediate feedback</li>
                      <li>• Risk-averse traders avoiding overnight gaps</li>
                      <li>• Disciplined personality types</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Not Ideal For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Part-time traders with day jobs</li>
                      <li>• Those under $25K (US PDT rule for stocks)</li>
                      <li>• Impatient traders who overtrade</li>
                      <li>• Those who can't handle daily P&L swings</li>
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
              <Link to="/learn/strategies/scalping" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Scalping Strategy</h4>
                    <p className="text-sm text-muted-foreground">Faster trades, tighter targets, more frequency</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/swing-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Swing Trading</h4>
                    <p className="text-sm text-muted-foreground">Multi-day holds for larger moves</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/momentum-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Momentum Trading</h4>
                    <p className="text-sm text-muted-foreground">Riding strong directional moves</p>
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

export default DayTradingStrategy;
