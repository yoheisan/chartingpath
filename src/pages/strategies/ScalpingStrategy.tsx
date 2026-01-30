import { Link } from "react-router-dom";
import { ArrowLeft, Clock, TrendingUp, Target, Shield, BarChart3, AlertTriangle, Zap } from "lucide-react";
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

const ScalpingStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'What is Scalping?' },
    { id: 'characteristics', title: 'Key Characteristics', level: 'novice' as const },
    { id: 'setup-requirements', title: 'Setup Requirements', level: 'novice' as const },
    { id: 'entry-strategies', title: 'Entry Strategies', level: 'intermediate' as const },
    { id: 'exit-management', title: 'Exit Management', level: 'intermediate' as const },
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
            <Badge className="bg-red-500/20 text-red-600 dark:text-red-400">High Frequency</Badge>
            <Badge variant="outline">Time-Based Strategy</Badge>
            <Badge variant="secondary">12 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Scalping Strategy: Profiting from Small Price Movements</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master the art of rapid-fire trading — capturing dozens of small profits throughout the day that compound into substantial returns. 
            Used by proprietary trading firms and professional day traders worldwide.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Typical Timeframe', value: '1-5 min', description: 'Chart intervals' },
              { label: 'Trade Duration', value: 'Seconds-Minutes', description: 'Hold time' },
              { label: 'Daily Trades', value: '20-100+', description: 'High frequency' },
              { label: 'Win Rate Target', value: '55-65%', description: 'Minimum viable' },
            ]}
            title="Scalping at a Glance"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Zap className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Scalping is an ultra-short-term trading strategy that aims to profit from small price changes. 
                Scalpers execute many trades per day, each targeting tiny profits that accumulate over time.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Scalping requires intense focus, quick decision-making, and flawless execution. It's not for everyone — 
              but for those with the right temperament and setup, it offers a way to generate consistent daily income 
              without overnight risk exposure. This strategy is favored by proprietary trading firms due to its 
              predictable risk profile and ability to compound small edges.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="bull-flag" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> A typical scalping opportunity — quick entry on momentum with tight stop loss and small profit target.
              </div>
            </div>
          </section>

          {/* Key Characteristics */}
          <section id="characteristics">
            <SkillLevelSection level="novice" title="Key Characteristics of Scalping">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Ultra-Short Holding Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Positions are held for seconds to minutes — rarely more than 15 minutes. 
                    The goal is to capture quick moves and exit before the market can reverse.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Small Profit Targets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Each trade targets 5-20 pips (forex) or 0.1-0.5% moves. The edge comes from 
                    consistency and volume, not individual trade size.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      High Trade Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Scalpers may execute 20-100+ trades per day. This volume requires low 
                    commissions and tight spreads to remain profitable.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-500" />
                      Tight Risk Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Stop losses are extremely tight — often just 3-10 pips. One large loss 
                    can wipe out many small wins, so discipline is paramount.
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                Scalping works best in liquid markets with tight spreads. Forex majors (EUR/USD, GBP/USD), 
                large-cap stocks, and major index futures are ideal. Avoid illiquid instruments where 
                spread costs eat into profits.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* Setup Requirements */}
          <section id="setup-requirements">
            <SkillLevelSection level="novice" title="Setup Requirements">
              <p className="text-muted-foreground mb-6">
                Scalping demands more from your trading infrastructure than any other style. 
                Cutting corners on setup will cost you money.
              </p>

              <PatternChecklist 
                title="Essential Scalping Setup"
                items={[
                  { text: 'Direct market access (DMA) broker with sub-millisecond execution', critical: true },
                  { text: 'Commission structure of $1 or less per round trip', critical: true },
                  { text: 'Spreads under 1 pip for forex, 1 cent for stocks', critical: true },
                  { text: 'Low-latency internet connection (fiber preferred)' },
                  { text: 'Multiple monitors (minimum 2-3 screens)' },
                  { text: 'Keyboard shortcuts or hotkeys for rapid order entry' },
                  { text: 'Level 2 / DOM (Depth of Market) data' },
                  { text: 'Time and sales (tape) feed' },
                ]}
              />

              <Alert className="mt-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Cost Warning:</strong> If your broker charges $5+ per trade, scalping becomes 
                  nearly impossible to profit from. Commission costs can exceed 50% of gross profits 
                  for frequent traders with the wrong broker.
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* Entry Strategies */}
          <section id="entry-strategies">
            <SkillLevelSection level="intermediate" title="Entry Strategies">
              <p className="text-muted-foreground mb-6">
                Scalpers use several entry techniques, often combining multiple signals for confirmation.
              </p>

              <h4 className="text-lg font-semibold mb-4">1. Momentum Scalping</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  Enter in the direction of strong momentum when price breaks above a short-term high (long) 
                  or below a short-term low (short) with increased volume. Use 1-minute or 5-minute charts.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop 3-5 pips behind the entry bar's low (for longs) or high (for shorts). 
                  Maximum risk per trade: 0.1-0.25% of account.
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Target 1:1 to 1.5:1 reward-to-risk. Exit when momentum stalls or 
                  at the next micro resistance/support level.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">2. Range Scalping</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  During consolidation periods, buy at range support and sell at range resistance. 
                  Best during low-volatility sessions (Asian session for forex).
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Place stop just outside the range boundary — 2-3 pips beyond support/resistance.
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Target 70-80% of the range width. Don't try to capture the entire range.
                </TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">3. Order Flow Scalping</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title="Entry Signal">
                  Monitor DOM (Depth of Market) for large orders being absorbed. Enter when 
                  significant buying/selling pressure is visible but price hasn't moved yet.
                </TradingRule>
                <TradingRule type="stop" title="Stop Loss">
                  Exit immediately if the large order is pulled or absorbed without price movement.
                </TradingRule>
                <TradingRule type="target" title="Profit Target">
                  Quick 3-5 pip scalp as price adjusts to the order flow imbalance.
                </TradingRule>
              </div>
            </SkillLevelSection>
          </section>

          {/* Exit Management */}
          <section id="exit-management">
            <SkillLevelSection level="intermediate" title="Exit Management">
              <p className="text-muted-foreground mb-6">
                In scalping, exits matter more than entries. A perfect entry with poor exit 
                management will still lose money over time.
              </p>

              <div className="grid gap-4 mb-6">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Taking Profits</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Use limit orders at predetermined targets — never chase</li>
                      <li>• Consider scaling out: 50% at first target, 50% at extended target</li>
                      <li>• Exit immediately when momentum stalls (price clusters)</li>
                      <li>• Never turn a scalp into a day trade — stick to your timeframe</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Cutting Losses</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Hard stops are non-negotiable — never move a stop further away</li>
                      <li>• Exit early if trade thesis is invalidated (even before stop)</li>
                      <li>• Accept small losses as a cost of doing business</li>
                      <li>• Three consecutive losses = mandatory 15-minute break</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <CommonMistakes 
                mistakes={[
                  'Holding losers hoping they\'ll recover (turning scalps into day trades)',
                  'Taking profits too early out of fear, then watching price run',
                  'Overtrading after losses to "make it back"',
                  'Ignoring spread costs when calculating profitability',
                  'Trading during news events without adjusting position size',
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* Risk Management */}
          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management for Scalpers">
              <RiskManagementBox 
                positionSize="0.1-0.25% of account per trade"
                stopLoss="3-10 pips behind entry"
                riskReward="1:1 to 1.5:1"
                maxRisk="2% daily loss limit"
              />

              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mt-6">
                <h4 className="font-semibold mb-3">The Math of Scalping Profitability</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  With a 1:1 risk-reward ratio and 60% win rate:
                </p>
                <div className="font-mono text-sm bg-background/50 p-4 rounded">
                  <p>100 trades × $10 risk = $1000 total risk exposure</p>
                  <p>60 wins × $10 = $600 profit</p>
                  <p>40 losses × $10 = $400 loss</p>
                  <p className="mt-2 text-green-500 font-semibold">Net profit: $200 (20% return on risk)</p>
                  <p className="text-muted-foreground mt-2">Minus commissions: ~$100-200 depending on broker</p>
                </div>
              </div>
            </SkillLevelSection>
          </section>

          {/* Professional Techniques */}
          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Scalping Techniques">
              <p className="text-muted-foreground mb-6">
                These advanced techniques separate profitable scalpers from the rest.
              </p>

              <h4 className="text-lg font-semibold mb-4">Time-of-Day Edge</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  <strong>London Open (3-5 AM EST):</strong> High volatility, directional moves<br/>
                  <strong>New York Open (9:30-11 AM EST):</strong> Highest volume, best liquidity<br/>
                  <strong>Overlap (8-11 AM EST):</strong> Maximum opportunity window<br/>
                  <strong>Avoid:</strong> Lunch hours (12-2 PM EST) — low volume, choppy action
                </p>
              </div>

              <h4 className="text-lg font-semibold mb-4">Correlation Trading</h4>
              <p className="text-muted-foreground mb-4">
                Watch correlated instruments for leading signals. EUR/USD often leads USD/CHF inversely. 
                ES futures can signal SPY moves. Use correlations to confirm entries or spot divergences.
              </p>

              <h4 className="text-lg font-semibold mb-4">Psychological Edge</h4>
              <div className="space-y-3">
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Detachment:</strong> Treat each trade as one of thousands. 
                    No single trade matters — only the statistical edge over time.
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Routine:</strong> Same setup time, same pre-market analysis, 
                    same warm-up trades. Consistency in routine breeds consistency in results.
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Physical Health:</strong> Sleep 7+ hours. Exercise daily. 
                    Hydrate. Poor physical condition = poor decision-making under pressure.
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* Summary */}
          <section className="mt-12">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <CardHeader>
                <CardTitle>Scalping Strategy Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Best For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Full-time traders with screen time</li>
                      <li>• Those who prefer many small wins</li>
                      <li>• Traders with low latency setups</li>
                      <li>• Those who thrive under pressure</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Not Ideal For:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Part-time traders</li>
                      <li>• Those with high commission brokers</li>
                      <li>• Traders who need time to think</li>
                      <li>• Those who can't handle rapid losses</li>
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
              <Link to="/learn/strategies/day-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Day Trading</h4>
                    <p className="text-sm text-muted-foreground">Longer holds, fewer trades, same intraday principle</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/momentum-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Momentum Trading</h4>
                    <p className="text-sm text-muted-foreground">Similar entry logic, extended timeframes</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/breakout" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Breakout Strategy</h4>
                    <p className="text-sm text-muted-foreground">Key level breaks that scalpers exploit</p>
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

export default ScalpingStrategy;
