import { Link } from "react-router-dom";
import { ArrowLeft, Shield, AlertTriangle, Target, CheckCircle, Calculator, TrendingDown, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

const RiskManagement = () => {
  const tocSections = [
    { id: 'introduction', title: 'Why Risk Management is Non-Negotiable' },
    { id: 'position-sizing', title: 'Position Sizing Fundamentals', level: 'novice' as const },
    { id: 'stop-loss-strategies', title: 'Stop Loss Strategies', level: 'intermediate' as const },
    { id: 'risk-reward-ratio', title: 'Risk-Reward Optimization', level: 'intermediate' as const },
    { id: 'portfolio-risk', title: 'Portfolio-Level Risk Management', level: 'advanced' as const },
    { id: 'drawdown-management', title: 'Drawdown Management', level: 'professional' as const },
    { id: 'risk-calculators', title: 'Risk Calculation Examples' },
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
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400">Essential Skills</Badge>
            <Badge variant="outline">Risk Management</Badge>
            <Badge variant="secondary">16 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Risk Management: The Foundation of Trading Survival</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Learn why professional traders obsess over risk before reward — and discover the position sizing, stop loss, and portfolio management techniques that protect capital in any market condition.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Retail Blowups', value: '70%', description: 'Within first year' },
              { label: 'Recovery from -50%', value: '100%', description: 'Gain required' },
              { label: 'Professional Risk', value: '0.5-2%', description: 'Per trade max' },
              { label: 'Survival Rate', value: '10×', description: 'Higher with proper sizing' },
            ]}
            title="Risk Management Impact Statistics"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Shield className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                "Rule №1: Never lose money. Rule №2: Never forget Rule №1." — Warren Buffett. 
                Risk management isn't about avoiding losses — it's about ensuring any single loss can never take you out of the game.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Here's the uncomfortable truth: your trading strategy is almost irrelevant compared to your risk management. 
              A mediocre strategy with excellent risk management will outperform an excellent strategy with poor risk management every time.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Why? Because the market will eventually throw a situation at you that you didn't anticipate. 
              When that happens, risk management is what determines whether you lose 2% and trade another day, or lose 50% and spend months recovering.
            </p>

            {/* The Math of Ruin Visualization */}
            <div className="my-8 p-6 rounded-xl border border-red-500/30 bg-red-500/5">
              <h3 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                The Brutal Math of Drawdowns
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">Account Loss</th>
                      <th className="text-left py-3 px-4">Gain Required to Recover</th>
                      <th className="text-left py-3 px-4">Reality Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-semibold text-yellow-500">-10%</td>
                      <td className="py-3 px-4">+11%</td>
                      <td className="py-3 px-4 text-muted-foreground">Manageable, 1-2 months</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-semibold text-orange-500">-25%</td>
                      <td className="py-3 px-4">+33%</td>
                      <td className="py-3 px-4 text-muted-foreground">Challenging, 3-6 months</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-semibold text-red-500">-50%</td>
                      <td className="py-3 px-4">+100%</td>
                      <td className="py-3 px-4 text-muted-foreground">Very difficult, 1-2 years</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-semibold text-red-600">-75%</td>
                      <td className="py-3 px-4">+300%</td>
                      <td className="py-3 px-4 text-muted-foreground">Career-threatening</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-red-700">-90%</td>
                      <td className="py-3 px-4">+900%</td>
                      <td className="py-3 px-4 text-muted-foreground">Effectively over</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                This asymmetry is why professionals prioritize capital preservation above all else.
              </p>
            </div>
          </section>

          {/* POSITION SIZING - NOVICE */}
          <section id="position-sizing">
            <SkillLevelSection level="novice" title="Position Sizing Fundamentals">
              <p className="text-muted-foreground mb-6">
                Position sizing answers the question: "How much should I risk on this trade?" 
                The answer is never based on how confident you feel — it's always based on math.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">The 1-2% Rule</h4>
              <p className="text-muted-foreground mb-4">
                Professional traders rarely risk more than 1-2% of their trading capital on any single trade. This isn't being overly cautious — it's survival math.
              </p>

              <Card className="bg-muted/30 my-6">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Maximum Risk Per Trade</p>
                    <p className="text-3xl font-mono font-bold text-primary">
                      1-2% of Account
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Account Size: $10,000</strong><br />
                      • 1% risk = $100 max loss per trade<br />
                      • 2% risk = $200 max loss per trade
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      At 1% risk, you can survive 100 consecutive losses. At 2%, you can survive 50. 
                      Either way, you'll never face a string of losses that wipes you out.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <h4 className="font-semibold text-lg mt-8 mb-4">Position Size Calculator Formula</h4>
              <Card className="bg-primary/5 border border-primary/20 my-6">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-xl font-mono font-bold">
                      Position Size = Account Risk ÷ Trade Risk per Share
                    </p>
                  </div>
                  <div className="space-y-4 mt-6">
                    <div className="p-4 rounded-lg bg-background/50">
                      <p className="font-semibold mb-2">Step-by-Step Example:</p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>1. Account size: $25,000</li>
                        <li>2. Risk per trade: 1% = $250</li>
                        <li>3. Entry price: $50.00</li>
                        <li>4. Stop loss: $47.00 (risk of $3.00 per share)</li>
                        <li>5. Position size: $250 ÷ $3.00 = <strong className="text-primary">83 shares</strong></li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ProTip>
                Calculate your position size BEFORE looking at the chart. This prevents the common mistake of sizing based on how "good" the setup looks. 
                Risk should be constant — conviction doesn't change how much you're willing to lose.
              </ProTip>

              <h4 className="font-semibold text-lg mt-8 mb-4">Why Fixed Fractional Position Sizing Works</h4>
              <div className="grid gap-4 mb-8">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Automatic Scaling Up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    As your account grows, your position sizes grow proportionally. You compound your gains without manually adjusting.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Automatic Scaling Down
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    During drawdowns, position sizes automatically decrease. This protects capital when your strategy isn't working.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Emotional Neutrality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Every trade has the same emotional weight. You won't be tempted to size up on "sure things" or size down on "scary" setups.
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* STOP LOSS STRATEGIES - INTERMEDIATE */}
          <section id="stop-loss-strategies">
            <SkillLevelSection level="intermediate" title="Stop Loss Strategies">
              <p className="text-muted-foreground mb-6">
                A stop loss isn't just a damage limiter — it's the mechanism that defines your risk and enables proper position sizing. 
                Without a stop, you can't calculate position size, and you're gambling, not trading.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">Types of Stop Losses</h4>
              <div className="grid gap-4 mb-8">
                <Card className="bg-background/50 border-l-4 border-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Technical Stop Loss</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2">Placed beyond key technical levels — support/resistance, swing points, pattern boundaries.</p>
                    <p><strong>Best for:</strong> Swing trades, pattern breakouts</p>
                    <p><strong>Example:</strong> Long trade with stop below the recent swing low or below pattern neckline</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">ATR-Based Stop Loss</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2">Uses Average True Range to set stops based on current volatility. Adapts to market conditions.</p>
                    <p><strong>Common setting:</strong> 2× ATR from entry</p>
                    <p><strong>Best for:</strong> Trend following, volatile markets</p>
                    <p><strong>Example:</strong> ATR(14) = $1.50, stop = entry price ± $3.00</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-yellow-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Percentage Stop Loss</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2">Fixed percentage from entry price. Simple but doesn't account for volatility.</p>
                    <p><strong>Common settings:</strong> 2% for stocks, 1% for forex, 5% for crypto</p>
                    <p><strong>Best for:</strong> Beginners, consistent risk across positions</p>
                    <p><strong>Limitation:</strong> Same % stop might be too tight in volatile markets</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-purple-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Time-Based Stop Loss</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2">Exit if trade doesn't move in expected direction within a set timeframe.</p>
                    <p><strong>Example:</strong> "If not profitable within 3 days, exit at market"</p>
                    <p><strong>Best for:</strong> Day trades, momentum strategies</p>
                    <p><strong>Rationale:</strong> Winning trades usually work quickly; dead money has opportunity cost</p>
                  </CardContent>
                </Card>
              </div>

              <TradingRule type="stop" title="Stop Loss Placement Rules">
                <ul className="space-y-2 mt-2">
                  <li>• <strong>Never move stop against your position</strong> — this is the #1 account killer</li>
                  <li>• <strong>Place stop where trade thesis is invalidated</strong> — not where loss "feels" acceptable</li>
                  <li>• <strong>Use buffer from obvious levels</strong> — stops at round numbers or obvious support get hunted</li>
                  <li>• <strong>Honor your stop with zero exceptions</strong> — mental stops don't work under pressure</li>
                </ul>
              </TradingRule>

              <CommonMistakes 
                mistakes={[
                  "Using mental stops instead of actual stop orders — you will fail to exit under pressure",
                  "Placing stops at obvious levels (round numbers, visible support) — these get hunted",
                  "Moving stops further away to avoid being stopped out — this destroys risk management",
                  "Using the same dollar stop for every asset — ignoring volatility differences",
                  "Setting stops too tight — getting stopped out by normal price fluctuation"
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* RISK-REWARD RATIO - INTERMEDIATE */}
          <section id="risk-reward-ratio">
            <SkillLevelSection level="intermediate" title="Risk-Reward Optimization">
              <p className="text-muted-foreground mb-6">
                Risk-reward ratio (R:R) compares how much you're risking to how much you could gain. 
                Understanding this relationship is essential for building a profitable trading system.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">The R:R and Win Rate Relationship</h4>
              <Card className="bg-muted/30 my-6">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Breakeven Win Rate by R:R</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-center py-3 px-4">Risk:Reward</th>
                          <th className="text-center py-3 px-4">Min Win Rate to Breakeven</th>
                          <th className="text-center py-3 px-4">50% Win Rate Expectancy</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="text-center py-3 px-4 font-semibold">1:1</td>
                          <td className="text-center py-3 px-4">50%</td>
                          <td className="text-center py-3 px-4 text-muted-foreground">$0 (breakeven)</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="text-center py-3 px-4 font-semibold">1:2</td>
                          <td className="text-center py-3 px-4">33%</td>
                          <td className="text-center py-3 px-4 text-green-500">+$0.50 per $1 risked</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="text-center py-3 px-4 font-semibold text-primary">1:3</td>
                          <td className="text-center py-3 px-4">25%</td>
                          <td className="text-center py-3 px-4 text-green-500">+$1.00 per $1 risked</td>
                        </tr>
                        <tr>
                          <td className="text-center py-3 px-4 font-semibold">1:5</td>
                          <td className="text-center py-3 px-4">17%</td>
                          <td className="text-center py-3 px-4 text-green-500">+$2.00 per $1 risked</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    With 1:3 R:R, you only need to win 25% of trades to break even, and 40% to be highly profitable.
                  </p>
                </CardContent>
              </Card>

              <h4 className="font-semibold text-lg mt-8 mb-4">Why Minimum 1:2 R:R Matters</h4>
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-3 text-red-500">1:1 R:R System</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Needs 50%+ win rate to profit</li>
                      <li>• Commissions/slippage eat into edge</li>
                      <li>• No room for error</li>
                      <li>• Small losing streaks hurt badly</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3 text-green-500">1:3 R:R System</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Needs only 25%+ win rate to profit</li>
                      <li>• Commissions have minimal impact</li>
                      <li>• Large margin for error</li>
                      <li>• One winner covers three losers</li>
                    </ul>
                  </div>
                </div>
              </div>

              <ProTip>
                Before entering any trade, calculate: "If I risk $X, what's my realistic target?" 
                If you can't identify a target that's at least 2× your risk, skip the trade — the math doesn't work.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* PORTFOLIO RISK - ADVANCED */}
          <section id="portfolio-risk">
            <SkillLevelSection level="advanced" title="Portfolio-Level Risk Management">
              <p className="text-muted-foreground mb-6">
                Individual trade risk is only part of the picture. You also need to manage risk across your entire portfolio — 
                because correlated positions can all move against you simultaneously.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">Maximum Portfolio Heat</h4>
              <Card className="bg-muted/30 my-6">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Total Open Risk Limit</p>
                    <p className="text-3xl font-mono font-bold text-amber-500">
                      5-10% Maximum
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>"Portfolio heat"</strong> = sum of all open position risks
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Example:</strong> If you risk 2% per trade, you should have maximum 5 positions open (5 × 2% = 10% total risk)
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      Even if each trade has independent risk, correlated markets can all move against you in a "risk-off" event.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <h4 className="font-semibold text-lg mt-8 mb-4">Correlation Risk</h4>
              <div className="space-y-4 mb-8">
                <TradingRule type="risk" title="Sector Concentration">
                  <p>Never have more than 3 positions in the same sector. Tech stocks, for example, tend to move together.</p>
                  <p className="mt-2"><strong>Example:</strong> Long AAPL + MSFT + GOOGL = 3 bets on the same outcome</p>
                </TradingRule>

                <TradingRule type="risk" title="Direction Concentration">
                  <p>In trending markets, avoid having all positions in the same direction. One reversal hits everything.</p>
                  <p className="mt-2"><strong>Example:</strong> 5 long positions in an uptrend = 5× damage if market turns</p>
                </TradingRule>

                <TradingRule type="risk" title="Currency Correlation">
                  <p>Forex pairs sharing a currency move together. EUR/USD and GBP/USD are highly correlated.</p>
                  <p className="mt-2"><strong>Example:</strong> Long EUR/USD + Long GBP/USD = 2 bets that USD weakens</p>
                </TradingRule>
              </div>

              <RiskManagementBox
                positionSize="1-2% per trade"
                stopLoss="Technical, ATR, or percentage-based"
                riskReward="Minimum 1:2, target 1:3"
                maxRisk="10% maximum portfolio heat"
              />
            </SkillLevelSection>
          </section>

          {/* DRAWDOWN MANAGEMENT - PROFESSIONAL */}
          <section id="drawdown-management">
            <SkillLevelSection level="professional" title="Drawdown Management">
              <p className="text-muted-foreground mb-6">
                Even with perfect risk management, drawdowns happen. Professional traders have pre-defined protocols 
                for managing extended losing periods.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">Drawdown Response Protocol</h4>
              <div className="space-y-4 mb-8">
                <div className="flex gap-4 items-start p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/30">
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-2xl font-bold text-yellow-500">-5%</p>
                    <p className="text-xs text-muted-foreground">Drawdown</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Yellow Alert</h5>
                    <p className="text-sm text-muted-foreground">Review recent trades. Continue trading but with heightened self-awareness. Check for process errors.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-lg bg-orange-500/5 border border-orange-500/30">
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-2xl font-bold text-orange-500">-10%</p>
                    <p className="text-xs text-muted-foreground">Drawdown</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Orange Alert</h5>
                    <p className="text-sm text-muted-foreground">Reduce position size to 50%. Take 2-day break from trading. Deep review of all trades. Is the system still valid?</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-lg bg-red-500/5 border border-red-500/30">
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-2xl font-bold text-red-500">-20%</p>
                    <p className="text-xs text-muted-foreground">Drawdown</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Red Alert</h5>
                    <p className="text-sm text-muted-foreground">Stop trading for 1-2 weeks. Reduce size to 25% when returning. Consider paper trading to rebuild confidence.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-4 rounded-lg bg-red-900/5 border border-red-900/30">
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-2xl font-bold text-red-700">-30%</p>
                    <p className="text-xs text-muted-foreground">Drawdown</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Full Stop</h5>
                    <p className="text-sm text-muted-foreground">Cease all live trading. Conduct complete system review. Paper trade for 30+ trades before returning with minimal size.</p>
                  </div>
                </div>
              </div>

              <PatternChecklist 
                title="Drawdown Review Checklist"
                items={[
                  { text: 'Did I follow my entry rules on every trade?', critical: true },
                  { text: 'Did I honor every stop loss without moving it?', critical: true },
                  { text: 'Was my position sizing correct for each trade?' },
                  { text: 'Did I overtrade or revenge trade after losses?' },
                  { text: 'Was I trading during unfavorable market conditions?' },
                  { text: 'Are the losses due to system failure or execution failure?', critical: true },
                  { text: 'Is my system still valid in current market regime?' },
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* RISK CALCULATORS */}
          <section id="risk-calculators">
            <h2 className="text-2xl font-bold mt-12 mb-4">Risk Calculation Examples</h2>

            <div className="grid gap-6 mb-8">
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Stock Trade Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Account Size:</span>
                      <span className="font-mono">$50,000</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Risk Per Trade (1%):</span>
                      <span className="font-mono">$500</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Entry Price:</span>
                      <span className="font-mono">$125.00</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <span className="font-mono">$120.00 (-$5.00/share)</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Target (1:3 R:R):</span>
                      <span className="font-mono">$140.00 (+$15.00/share)</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="font-semibold">Position Size:</span>
                      <span className="font-mono font-bold text-primary">100 shares ($12,500)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Forex Trade Example (EUR/USD)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Account Size:</span>
                      <span className="font-mono">$10,000</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Risk Per Trade (1%):</span>
                      <span className="font-mono">$100</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Entry Price:</span>
                      <span className="font-mono">1.0850</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <span className="font-mono">1.0800 (50 pips)</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Pip Value (mini lot):</span>
                      <span className="font-mono">$1.00/pip</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="font-semibold">Position Size:</span>
                      <span className="font-mono font-bold text-primary">2 mini lots (0.2 standard)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* KEY TAKEAWAYS */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
              <li><strong>Risk 1-2% per trade maximum</strong> — this ensures survival through any losing streak</li>
              <li><strong>Position size is math, not feeling</strong> — calculate before looking at the trade</li>
              <li><strong>Stop losses are non-negotiable</strong> — no stop = no trade; never move stops against position</li>
              <li><strong>Target minimum 1:2 R:R</strong> — without edge in R:R, you need impossibly high win rate</li>
              <li><strong>Manage portfolio heat</strong> — never exceed 10% total open risk across all positions</li>
              <li><strong>Have a drawdown protocol</strong> — pre-define responses to losing periods</li>
              <li><strong>Capital preservation is priority #1</strong> — you can't trade if you're out of money</li>
            </ol>
          </div>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/trading-psychology">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Trading Psychology</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Master the mental game that makes risk management possible.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/position-sizing">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Position Sizing Deep Dive</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Advanced position sizing strategies for different market conditions.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Calculator CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Calculate Your Position Size</h3>
              <p className="text-muted-foreground mb-6">
                Use our risk calculator to determine the perfect position size for your next trade
              </p>
              <Link to="/tools/risk-calculator">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Open Risk Calculator
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RiskManagement;