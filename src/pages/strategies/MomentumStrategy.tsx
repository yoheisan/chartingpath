import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, AlertTriangle, Zap, Activity } from "lucide-react";
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

const MomentumStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'What is Momentum Trading?' },
    { id: 'momentum-indicators', title: 'Key Momentum Indicators', level: 'novice' as const },
    { id: 'entry-signals', title: 'Entry Signals', level: 'intermediate' as const },
    { id: 'position-management', title: 'Position Management', level: 'intermediate' as const },
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
            <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Trend Following</Badge>
            <Badge variant="outline">Indicator-Based</Badge>
            <Badge variant="secondary">19 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Momentum Trading: Riding Strong Price Movements</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Capture accelerating price action by identifying and trading assets showing strong directional momentum.
            A favorite strategy among swing traders and active investors.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Typical Timeframe', value: '15min-Daily', description: 'Chart intervals' },
              { label: 'Trade Duration', value: 'Hours-Days', description: 'Hold time' },
              { label: 'Win Rate Target', value: '45-55%', description: 'With high R:R' },
              { label: 'Risk:Reward', value: '1:2-1:4', description: 'Target ratio' },
            ]}
            title="Momentum Trading at a Glance"
          />

          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Activity className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Momentum trading is based on the premise that strong price movements tend to continue.
                "The trend is your friend" — ride the wave until momentum exhausts.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Momentum traders buy assets that are rising and sell those that are falling, betting that
              the current trend will persist. This strategy exploits the behavioral tendency of markets
              to trend — the "herding effect" where traders pile into winning positions.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="ascending-triangle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> Strong momentum continuation after breakout — the ideal momentum entry scenario.
              </div>
            </div>
          </section>

          <section id="momentum-indicators">
            <SkillLevelSection level="novice" title="Key Momentum Indicators">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      RSI (Relative Strength Index)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Measures speed and magnitude of price changes. RSI above 50 indicates bullish momentum,
                    below 50 bearish. Strong momentum: RSI 60-70 for longs, 30-40 for shorts.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      MACD Histogram
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Shows the difference between MACD line and signal line. Growing histogram bars
                    indicate increasing momentum; shrinking bars signal momentum loss.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Rate of Change (ROC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Measures percentage change over a period. Rising ROC confirms acceleration;
                    falling ROC warns of deceleration even if price is still rising.
                  </CardContent>
                </Card>
              </div>

              <PatternChecklist
                title="Momentum Confirmation Checklist"
                items={[
                  { text: "Price above key moving averages (20/50 EMA)" },
                  { text: "RSI trending above 50 (longs) or below 50 (shorts)" },
                  { text: "MACD histogram expanding in trade direction" },
                  { text: "Volume increasing on momentum moves", critical: true },
                  { text: "Higher highs and higher lows forming" }
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="entry-signals">
            <SkillLevelSection level="intermediate" title="Momentum Entry Signals">
              <TradingRule title="Pullback Entry" type="entry">
                Enter on pullbacks to moving averages during strong momentum. Wait for price to touch 20 EMA and show rejection candle before entering.
              </TradingRule>

              <TradingRule title="Breakout Continuation" type="entry">
                Enter after price breaks above resistance with strong volume. Momentum continuation often follows consolidation near highs.
              </TradingRule>

              <TradingRule title="RSI 50-Line Bounce" type="entry">
                In strong uptrends, RSI often bounces off the 50 level. Enter when RSI touches 50 and turns back up with price confirmation.
              </TradingRule>

              <ProTip>
                The best momentum entries occur when multiple timeframes align. A daily uptrend
                with a 4H pullback completing offers the highest probability setup.
              </ProTip>
            </SkillLevelSection>
          </section>

          <section id="position-management">
            <SkillLevelSection level="intermediate" title="Position Management">
              <div className="space-y-4">
                <h4 className="font-semibold">Trailing Stops</h4>
                <p className="text-muted-foreground">
                  Use ATR-based trailing stops to lock in profits while allowing room for normal volatility.
                  A 2x ATR trail from swing highs keeps you in trending moves.
                </p>

                <h4 className="font-semibold">Scaling Out</h4>
                <p className="text-muted-foreground">
                  Take partial profits at key resistance levels. Sell 1/3 at first target, 1/3 at second,
                  trail the final 1/3 for potential extended moves.
                </p>

                <h4 className="font-semibold">Momentum Exhaustion Signs</h4>
                <p className="text-muted-foreground">
                  Exit when you see bearish divergence (price making new highs while RSI/MACD make lower highs),
                  volume drying up on advances, or climactic volume spikes.
                </p>
              </div>
            </SkillLevelSection>
          </section>

          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management">
              <RiskManagementBox
                positionSize="1-2% account risk per trade"
                stopLoss="Below recent swing low or 2x ATR"
                riskReward="Minimum 1:2, target 1:3+"
                maxRisk="5% total portfolio risk across all positions"
              />

              <CommonMistakes
                title="Common Momentum Trading Mistakes"
                mistakes={[
                  "Chasing extended moves — enter on pullbacks, not at highs",
                  "Ignoring momentum divergence warning signals",
                  "Holding through momentum exhaustion",
                  "Trading momentum in ranging/choppy markets",
                  "Over-leveraging because trend 'seems strong'"
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Techniques">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">Relative Strength Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">
                    Professional momentum traders compare assets within sectors to find relative strength leaders.
                    A stock outperforming its sector during market pullbacks often leads the next leg up.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Compare asset performance to benchmark (SPY, sector ETF)</li>
                    <li>Look for assets making new highs when market is flat</li>
                    <li>Track relative strength line breakouts before price breakouts</li>
                    <li>Rotate into strongest performers within hot sectors</li>
                  </ul>
                </CardContent>
              </Card>

              <ProTip>
                Institutional traders use "momentum factor" screens that combine price momentum,
                earnings momentum, and estimate revisions. Stocks ranking high across all three
                dimensions show the strongest continuation.
              </ProTip>
            </SkillLevelSection>
          </section>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Ready to Trade Momentum?</h3>
            <p className="text-muted-foreground mb-4">
              Practice identifying momentum setups with our pattern recognition tools.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/screener" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Scan for Momentum
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

export default MomentumStrategy;
