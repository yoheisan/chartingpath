import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import movingAveragesChart from "@/assets/moving-averages-chart.png";
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

const MovingAverages = () => {
  const tocSections = [
    { id: 'introduction', title: 'Why Moving Averages Matter' },
    { id: 'ma-types', title: 'Types of Moving Averages', level: 'novice' as const },
    { id: 'key-periods', title: 'Key Moving Average Periods', level: 'novice' as const },
    { id: 'dynamic-sr', title: 'Dynamic Support & Resistance', level: 'intermediate' as const },
    { id: 'crossover-systems', title: 'Crossover Trading Systems', level: 'intermediate' as const },
    { id: 'multi-ma-systems', title: 'Multi-MA Trading Systems', level: 'advanced' as const },
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
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">Trend Indicators</Badge>
            <Badge variant="outline">Technical Analysis</Badge>
            <Badge variant="secondary">14 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Moving Averages: The Foundation of Trend Trading</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master the most widely-used technical indicator in trading — from basic concepts to professional multi-timeframe systems that institutional traders rely on.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: '200 MA Trend', value: '73%', description: 'Accuracy above/below' },
              { label: 'Golden Cross', value: '65%', description: 'Win rate historical' },
              { label: 'Death Cross', value: '61%', description: 'Win rate historical' },
              { label: 'Institutional Use', value: '#1', description: 'Most watched indicator' },
            ]}
            title="Moving Average Statistics"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <TrendingUp className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                "The trend is your friend" — and moving averages are the most reliable way to identify, confirm, and trade with trends. 
                They smooth out price noise to reveal the underlying direction of a market.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Moving averages are the backbone of technical analysis. Nearly every professional trading system incorporates them in some form — 
              whether for trend identification, dynamic support/resistance, or entry/exit signals. Understanding MAs is non-negotiable for serious traders.
            </p>

            {/* Chart Image */}
            <div className="my-8 rounded-lg overflow-hidden border border-border">
              <img src={movingAveragesChart} alt="Moving Averages Chart - Golden Cross" className="w-full h-auto" />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> The 50-day MA crossing above the 200-day MA (Golden Cross) — one of the most widely-watched bullish signals in trading.
              </div>
            </div>
          </section>

          {/* MA TYPES - NOVICE */}
          <section id="ma-types">
            <SkillLevelSection level="novice" title="Types of Moving Averages">
              <p className="text-muted-foreground mb-6">
                Not all moving averages are created equal. Each type weighs price data differently, 
                making them more or less responsive to recent price action.
              </p>

              <div className="grid gap-4 mb-8">
                <Card className="bg-background/50 border-l-4 border-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Simple Moving Average (SMA)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3">Calculates the average price over a specific number of periods, with each data point weighted equally.</p>
                    <div className="bg-muted/30 p-3 rounded-lg font-mono text-xs">
                      SMA(10) = (P1 + P2 + P3 + ... + P10) ÷ 10
                    </div>
                    <ul className="mt-3 space-y-1">
                      <li><strong>Pros:</strong> Smooth, reliable, widely watched</li>
                      <li><strong>Cons:</strong> Lags behind price, slow to react</li>
                      <li><strong>Best for:</strong> Long-term trend identification, swing trading</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Exponential Moving Average (EMA)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3">Gives more weight to recent prices, making it more responsive to new information.</p>
                    <div className="bg-muted/30 p-3 rounded-lg font-mono text-xs">
                      EMA = (Price × k) + (Previous EMA × (1 - k))<br />
                      where k = 2 ÷ (periods + 1)
                    </div>
                    <ul className="mt-3 space-y-1">
                      <li><strong>Pros:</strong> Faster reaction, reduces lag</li>
                      <li><strong>Cons:</strong> More false signals in choppy markets</li>
                      <li><strong>Best for:</strong> Day trading, momentum trading</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-yellow-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Weighted Moving Average (WMA)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3">Assigns linearly decreasing weights to older data. More responsive than SMA but less than EMA.</p>
                    <ul className="mt-3 space-y-1">
                      <li><strong>Pros:</strong> Balance between SMA and EMA</li>
                      <li><strong>Cons:</strong> Less commonly used, fewer watching same levels</li>
                      <li><strong>Best for:</strong> Custom systems, specialized strategies</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-purple-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Hull Moving Average (HMA)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3">Designed to reduce lag while maintaining smoothness. Uses weighted moving averages in its calculation.</p>
                    <ul className="mt-3 space-y-1">
                      <li><strong>Pros:</strong> Very responsive, smooth curve</li>
                      <li><strong>Cons:</strong> Can overshoot at reversals</li>
                      <li><strong>Best for:</strong> Trend-following systems, momentum</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                For most traders, the choice between SMA and EMA matters less than consistency. Pick one and master it. 
                The 20 EMA and 50 SMA are the most widely watched — which creates self-fulfilling price reactions at these levels.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* KEY PERIODS - NOVICE */}
          <section id="key-periods">
            <SkillLevelSection level="novice" title="Key Moving Average Periods">
              <p className="text-muted-foreground mb-6">
                Certain MA periods are watched by so many traders that they become self-fulfilling. 
                When millions of traders see price approaching the 200-day MA, their collective actions create real support/resistance.
              </p>

              <div className="overflow-x-auto mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Period</th>
                      <th className="text-left py-3 px-4">Timeframe</th>
                      <th className="text-left py-3 px-4">Use Case</th>
                      <th className="text-left py-3 px-4">Who Watches It</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-semibold">9 EMA</td>
                      <td className="py-3 px-4">Short-term</td>
                      <td className="py-3 px-4">Day trading, scalping</td>
                      <td className="py-3 px-4 text-muted-foreground">Active day traders</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-semibold">20 EMA/SMA</td>
                      <td className="py-3 px-4">Short-term</td>
                      <td className="py-3 px-4">Swing trades, pullback entries</td>
                      <td className="py-3 px-4 text-muted-foreground">Swing traders, institutional</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-semibold text-primary">50 SMA</td>
                      <td className="py-3 px-4">Intermediate</td>
                      <td className="py-3 px-4">Trend confirmation, key support</td>
                      <td className="py-3 px-4 text-muted-foreground">Institutional, algorithms</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-semibold">100 SMA</td>
                      <td className="py-3 px-4">Medium-term</td>
                      <td className="py-3 px-4">Trend health, position trading</td>
                      <td className="py-3 px-4 text-muted-foreground">Position traders</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-primary">200 SMA</td>
                      <td className="py-3 px-4">Long-term</td>
                      <td className="py-3 px-4">Bull/bear market definition</td>
                      <td className="py-3 px-4 text-muted-foreground">Everyone — most watched</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Alert className="mb-6">
                <Activity className="h-5 w-5" />
                <AlertDescription>
                  <strong>The 200-Day Rule:</strong> Many institutional investors define a bull market as price above the 200-day SMA, 
                  and a bear market as price below. This simple rule keeps you on the right side of major trends.
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* DYNAMIC S/R - INTERMEDIATE */}
          <section id="dynamic-sr">
            <SkillLevelSection level="intermediate" title="Moving Averages as Dynamic Support & Resistance">
              <p className="text-muted-foreground mb-6">
                Unlike horizontal support/resistance, moving averages move with price — creating "dynamic" levels that adjust to market conditions. 
                In trending markets, MAs act as excellent entry points for pullback trades.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">How Dynamic S/R Works</h4>
              <div className="grid gap-4 mb-8">
                <Card className="bg-background/50 border-l-4 border-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Uptrend: MA as Support</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>In uptrends, price typically bounces off MAs from above. The 20 EMA is often the first support; 
                    if that breaks, the 50 SMA is the next line of defense.</p>
                    <p className="mt-2"><strong>Entry signal:</strong> Bullish candlestick pattern at MA support in an uptrend</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Downtrend: MA as Resistance</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>In downtrends, rallies typically fail at MAs from below. Price gets rejected and continues lower.</p>
                    <p className="mt-2"><strong>Entry signal:</strong> Bearish candlestick pattern at MA resistance in a downtrend</p>
                  </CardContent>
                </Card>
              </div>

              <TradingRule type="entry" title="MA Bounce Trading Strategy">
                <ol className="list-decimal pl-4 space-y-2 mt-2">
                  <li><strong>Identify trend:</strong> Price above 50 SMA = uptrend; below = downtrend</li>
                  <li><strong>Wait for pullback:</strong> Let price retrace to the 20 EMA (or 50 SMA for deeper pullbacks)</li>
                  <li><strong>Confirm with price action:</strong> Look for bullish engulfing, hammer, or other reversal pattern at MA</li>
                  <li><strong>Enter on confirmation:</strong> Buy on close of confirmation candle</li>
                  <li><strong>Stop below MA:</strong> Place stop 1-2% below the MA that provided support</li>
                  <li><strong>Target previous high:</strong> First target is the prior swing high</li>
                </ol>
              </TradingRule>

              <ProTip>
                The best MA bounces happen when multiple timeframes align. If the daily 20 EMA and weekly 10 EMA are at the same level, 
                that confluence creates a much stronger support zone.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* CROSSOVER SYSTEMS - INTERMEDIATE */}
          <section id="crossover-systems">
            <SkillLevelSection level="intermediate" title="Moving Average Crossover Systems">
              <p className="text-muted-foreground mb-6">
                MA crossovers generate buy and sell signals when a faster MA crosses a slower one. 
                These systems are among the oldest and most tested trading strategies.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">The Golden Cross (Bullish)</h4>
              <Card className="bg-green-500/5 border border-green-500/30 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h5 className="font-semibold">50-day SMA crosses ABOVE 200-day SMA</h5>
                      <p className="text-sm text-muted-foreground">Strong bullish signal indicating potential long-term uptrend</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-medium">Signal</p>
                      <p className="text-muted-foreground">Long-term trend shift bullish</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-medium">Action</p>
                      <p className="text-muted-foreground">Consider long positions, avoid shorts</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-medium">Win Rate</p>
                      <p className="text-muted-foreground">~65% historically on S&P 500</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h4 className="font-semibold text-lg mt-8 mb-4">The Death Cross (Bearish)</h4>
              <Card className="bg-red-500/5 border border-red-500/30 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h5 className="font-semibold">50-day SMA crosses BELOW 200-day SMA</h5>
                      <p className="text-sm text-muted-foreground">Strong bearish signal indicating potential long-term downtrend</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-medium">Signal</p>
                      <p className="text-muted-foreground">Long-term trend shift bearish</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-medium">Action</p>
                      <p className="text-muted-foreground">Consider reducing longs, potential shorts</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-medium">Win Rate</p>
                      <p className="text-muted-foreground">~61% historically on S&P 500</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <h4 className="font-semibold text-lg mt-8 mb-4">Faster Crossover Systems</h4>
              <div className="bg-muted/30 p-6 rounded-lg mb-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-2">9/21 EMA Crossover</h5>
                    <p className="text-sm text-muted-foreground mb-2">Fast system for short-term traders</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Buy: 9 EMA crosses above 21 EMA</li>
                      <li>• Sell: 9 EMA crosses below 21 EMA</li>
                      <li>• More signals, more false positives</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">20/50 SMA Crossover</h5>
                    <p className="text-sm text-muted-foreground mb-2">Balanced system for swing traders</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Buy: 20 SMA crosses above 50 SMA</li>
                      <li>• Sell: 20 SMA crosses below 50 SMA</li>
                      <li>• Good balance of signals and accuracy</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/5">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertDescription>
                  <strong>Critical Warning:</strong> MA crossover systems are lagging indicators — by the time the cross occurs, 
                  a significant portion of the move has already happened. They work best in trending markets and fail miserably in sideways/ranging conditions.
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* MULTI-MA SYSTEMS - ADVANCED */}
          <section id="multi-ma-systems">
            <SkillLevelSection level="advanced" title="Multi-MA Trading Systems">
              <p className="text-muted-foreground mb-6">
                Professional traders rarely rely on a single MA. Multi-MA systems provide better trend confirmation, 
                filter false signals, and create clear trading rules.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">Triple MA System (20/50/200)</h4>
              <Card className="bg-muted/30 mb-6">
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <h5 className="font-semibold mb-3">Bullish Alignment (Strong Uptrend)</h5>
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10">
                      <span className="font-mono">Price {">"} 20 MA {">"} 50 MA {">"} 200 MA</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">All MAs stacked bullishly — strongest buy signal. Look for pullbacks to the 20 MA for entries.</p>
                  </div>
                  <div className="mb-6">
                    <h5 className="font-semibold mb-3">Bearish Alignment (Strong Downtrend)</h5>
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10">
                      <span className="font-mono">Price {"<"} 20 MA {"<"} 50 MA {"<"} 200 MA</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">All MAs stacked bearishly — strongest sell signal. Look for rallies to the 20 MA for short entries.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3">Mixed/Transition</h5>
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10">
                      <span className="font-mono">MAs are crossing or not aligned</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Trend is unclear or transitioning. Reduce position size or wait for clarity.</p>
                  </div>
                </CardContent>
              </Card>

              <TradingRule type="entry" title="Triple MA Trading Rules">
                <ul className="space-y-2 mt-2">
                  <li>• <strong>Only trade in direction of 200 MA:</strong> Price above 200 = longs only; below = shorts only</li>
                  <li>• <strong>Use 50 MA for trend strength:</strong> Steep angle = strong trend; flat = weak/ranging</li>
                  <li>• <strong>Use 20 MA for entries:</strong> Enter on bounces from 20 MA in direction of trend</li>
                  <li>• <strong>MA expansion = trend strength:</strong> Widening gap between MAs = accelerating trend</li>
                  <li>• <strong>MA contraction = weakening:</strong> MAs converging = trend losing momentum</li>
                </ul>
              </TradingRule>

              <h4 className="font-semibold text-lg mt-8 mb-4">MA Ribbon/Fan System</h4>
              <div className="bg-muted/30 p-6 rounded-lg mb-8">
                <p className="text-muted-foreground mb-4">
                  Use 6-8 MAs (e.g., 10, 20, 30, 40, 50, 60, 100, 200) to create a "ribbon" that shows trend health at a glance:
                </p>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <p className="font-medium text-green-500">Expanding Ribbon</p>
                    <p className="text-muted-foreground">Strong trend, look for entries</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <p className="font-medium text-yellow-500">Flat/Twisted Ribbon</p>
                    <p className="text-muted-foreground">Ranging/choppy, avoid trading</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <p className="font-medium text-blue-500">Contracting Ribbon</p>
                    <p className="text-muted-foreground">Trend weakening, tighten stops</p>
                  </div>
                </div>
              </div>

              <RiskManagementBox
                positionSize="Standard 1-2% risk per trade"
                stopLoss="Below the MA used for entry (e.g., below 20 MA)"
                riskReward="1:2 minimum, use MA as trailing stop"
                maxRisk="Reduce size when MAs not aligned"
              />
            </SkillLevelSection>
          </section>

          {/* PROFESSIONAL TECHNIQUES */}
          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional MA Techniques">
              <h4 className="font-semibold text-lg mt-6 mb-4">MA Slope Analysis</h4>
              <p className="text-muted-foreground mb-4">
                The angle (slope) of a moving average tells you about trend strength, not just direction.
              </p>
              <div className="bg-muted/30 p-6 rounded-lg mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 font-medium">Steep Up</div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-green-500 to-green-500 transform rotate-[-15deg]" />
                    <span className="text-sm text-muted-foreground">Strong momentum, hold positions</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 font-medium">Gradual Up</div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-blue-500 to-blue-500 transform rotate-[-5deg]" />
                    <span className="text-sm text-muted-foreground">Healthy trend, normal trading</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 font-medium">Flattening</div>
                    <div className="flex-1 h-1 bg-yellow-500" />
                    <span className="text-sm text-muted-foreground">Trend weakening, caution</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 font-medium">Rolling Over</div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 transform rotate-[5deg]" />
                    <span className="text-sm text-muted-foreground">Potential reversal, take profits</span>
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-lg mt-8 mb-4">Multi-Timeframe MA Analysis</h4>
              <PatternChecklist 
                title="MTF Alignment Checklist"
                items={[
                  { text: 'Weekly price above 20 EMA (long-term trend bullish)', critical: true },
                  { text: 'Daily price above 50 SMA (intermediate trend bullish)' },
                  { text: 'Daily 20 EMA above 50 SMA (trend aligned)' },
                  { text: '4H pullback to 20 EMA for entry opportunity' },
                  { text: 'All timeframes agree on direction', critical: true },
                ]}
              />

              <h4 className="font-semibold text-lg mt-8 mb-4">Price Distance from MA</h4>
              <div className="space-y-4 mb-8">
                <TradingRule type="risk" title="Mean Reversion Warning">
                  <p>When price extends too far from the MA, a reversion to the mean becomes likely:</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Price {">"} 10% above 20 MA = Overbought, don't chase</li>
                    <li>• Price {"<"} 10% below 20 MA = Oversold, don't short</li>
                    <li>• Wait for pullback to MA before entering new positions</li>
                  </ul>
                </TradingRule>
              </div>

              <CommonMistakes 
                mistakes={[
                  "Using MAs in sideways/choppy markets — they create endless whipsaws",
                  "Relying solely on MA crosses without other confirmation",
                  "Not adjusting MA periods for different timeframes (daily vs intraday)",
                  "Ignoring price action and focusing only on MAs",
                  "Trading against higher timeframe MA trends",
                  "Using too many MAs which creates analysis paralysis",
                  "Expecting exact bounces from MAs — they're zones, not lines"
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* KEY TAKEAWAYS */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
              <li><strong>MAs identify trend direction</strong> — price above 200 MA = bullish; below = bearish</li>
              <li><strong>EMAs react faster than SMAs</strong> — choose based on your trading style</li>
              <li><strong>20, 50, and 200-day are most watched</strong> — these create self-fulfilling S/R levels</li>
              <li><strong>Golden/Death crosses signal major trend changes</strong> — but they lag, so use for confirmation</li>
              <li><strong>MAs work best in trending markets</strong> — avoid using them in ranges</li>
              <li><strong>Multi-MA alignment confirms trend strength</strong> — all MAs stacked = strong trend</li>
              <li><strong>MA slope shows momentum</strong> — steep angle = strong trend; flat = weakness</li>
              <li><strong>Combine MAs with price action</strong> — MAs work best with candlestick confirmation</li>
            </ol>
          </div>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/trend-analysis">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Trend Lines and Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Combine MAs with trend line analysis for powerful signals.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/macd-indicator">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>MACD Indicator</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  MACD uses moving averages to generate momentum signals.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quiz CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-blue-500/10 to-primary/5 border-blue-500/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Test Your MA Knowledge</h3>
              <p className="text-muted-foreground mb-6">
                Can you identify trend direction and optimal entry points using moving averages?
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

export default MovingAverages;