import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, Activity, Waves } from "lucide-react";
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

const MACDStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'Understanding MACD' },
    { id: 'components', title: 'MACD Components', level: 'novice' as const },
    { id: 'signal-types', title: 'Signal Types', level: 'intermediate' as const },
    { id: 'divergence', title: 'MACD Divergence', level: 'advanced' as const },
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
            <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">Indicator-Based</Badge>
            <Badge variant="outline">Momentum</Badge>
            <Badge variant="secondary">17 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">MACD Trading Strategy: Mastering Signal Line Crossovers</h1>
          <p className="text-xl text-muted-foreground mb-8">
            The Moving Average Convergence Divergence (MACD) is one of the most reliable momentum
            indicators. Learn to trade crossovers, histogram analysis, and divergence setups.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Best Timeframes', value: '4H-Daily', description: 'Higher reliability' },
              { label: 'Signal Frequency', value: 'Moderate', description: '5-15/month' },
              { label: 'Win Rate', value: '50-55%', description: 'With proper filters' },
              { label: 'False Signals', value: 'Common in ranges', description: 'Use filters' },
            ]}
            title="MACD Strategy at a Glance"
          />

          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Waves className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                MACD measures the relationship between two moving averages, revealing momentum shifts
                before they're visible in price alone. It's both a trend and momentum indicator.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Created by Gerald Appel in the late 1970s, MACD has stood the test of time. It excels at
              identifying trend changes and momentum shifts. While simple to understand, mastering MACD
              requires understanding its nuances and knowing when NOT to trade its signals.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="bull-flag" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> MACD confirmation of trend continuation — histogram expanding with price movement.
              </div>
            </div>
          </section>

          <section id="components">
            <SkillLevelSection level="novice" title="MACD Components Explained">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      MACD Line
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    The difference between 12-period and 26-period EMAs. When MACD line is above zero,
                    short-term momentum is bullish. Below zero, momentum is bearish.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Signal Line
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    A 9-period EMA of the MACD line. It smooths the MACD and generates trading signals
                    when crossed. Crossovers are the primary trading signals.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Histogram
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    The difference between MACD and Signal lines, displayed as bars. Growing bars show
                    increasing momentum; shrinking bars warn of momentum loss BEFORE the crossover.
                  </CardContent>
                </Card>
              </div>

              <PatternChecklist
                title="Default MACD Settings"
                items={[
                  { text: "Fast EMA: 12 periods" },
                  { text: "Slow EMA: 26 periods" },
                  { text: "Signal Line: 9-period EMA" },
                  { text: "Can adjust for sensitivity (8,17,9 faster; 19,39,9 slower)" }
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="signal-types">
            <SkillLevelSection level="intermediate" title="MACD Signal Types">
              <TradingRule title="Signal Line Crossover (Bullish)" type="entry">
                MACD line crosses above signal line. Enter long when crossover occurs, preferably near or below zero line for best risk/reward.
              </TradingRule>

              <TradingRule title="Signal Line Crossover (Bearish)" type="exit">
                MACD line crosses below signal line. Enter short or exit longs when crossover occurs, especially when near or above zero line.
              </TradingRule>

              <TradingRule title="Zero Line Cross" type="entry">
                MACD crossing above zero confirms bullish trend; below zero confirms bearish. Use as trend filter — only take bullish signals above zero.
              </TradingRule>

              <TradingRule title="Histogram Reversal" type="entry">
                Histogram shrinking warns of coming crossover. Prepare for trade when histogram starts shrinking after extended move.
              </TradingRule>

              <ProTip>
                The histogram gives earlier signals than crossovers. When histogram starts shrinking
                but MACD hasn't crossed yet, it's an early warning. Prepare your entry rather than
                waiting for the crossover confirmation.
              </ProTip>
            </SkillLevelSection>
          </section>

          <section id="divergence">
            <SkillLevelSection level="advanced" title="MACD Divergence Trading">
              <div className="space-y-4">
                <h4 className="font-semibold">Bullish Divergence</h4>
                <p className="text-muted-foreground">
                  Price makes lower lows but MACD makes higher lows. This shows selling pressure
                  is weakening despite new price lows. Potential reversal signal.
                </p>

                <h4 className="font-semibold">Bearish Divergence</h4>
                <p className="text-muted-foreground">
                  Price makes higher highs but MACD makes lower highs. Momentum is failing to
                  confirm new highs. Warning of potential top.
                </p>

                <h4 className="font-semibold">Hidden Divergence</h4>
                <p className="text-muted-foreground">
                  In uptrend: price makes higher low but MACD makes lower low = trend continuation.
                  In downtrend: price makes lower high but MACD makes higher high = continuation.
                </p>
              </div>

              <CommonMistakes
                title="Divergence Trading Mistakes"
                mistakes={[
                  "Trading divergence in strong trends (can persist)",
                  "Not waiting for price confirmation after divergence",
                  "Using small divergence — look for significant divergence",
                  "Ignoring the primary trend direction"
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management">
              <RiskManagementBox
                positionSize="1-2% account risk per trade"
                stopLoss="Below recent swing low or 1.5x ATR"
                riskReward="Minimum 1:1.5, target 1:2+"
                maxRisk="Reduce size in ranging/choppy markets"
              />

              <CommonMistakes
                title="Common MACD Trading Mistakes"
                mistakes={[
                  "Using MACD in sideways markets (many false signals)",
                  "Trading every crossover without additional confirmation",
                  "Ignoring the trend — MACD works best WITH trend",
                  "Using MACD alone without price action confirmation",
                  "Not adjusting settings for different market conditions"
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Techniques">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">Multi-Timeframe MACD</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">
                    Professional traders align MACD signals across multiple timeframes for
                    higher probability trades.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Weekly MACD above zero = bullish bias</li>
                    <li>Daily MACD bullish crossover = entry signal</li>
                    <li>4H MACD for fine-tuning entry timing</li>
                    <li>Only take daily signals in direction of weekly MACD</li>
                  </ul>
                </CardContent>
              </Card>

              <ProTip>
                Combine MACD with RSI for confirmation. When MACD gives bullish crossover
                AND RSI is above 50 (but not overbought), signal reliability increases
                significantly.
              </ProTip>
            </SkillLevelSection>
          </section>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Ready to Trade MACD?</h3>
            <p className="text-muted-foreground mb-4">
              Scan for MACD crossover setups with our pattern scanner.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/screener" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Find MACD Setups
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

export default MACDStrategy;
