import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, Clock, Building2 } from "lucide-react";
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

const PositionTradingStrategy = () => {
  const tocSections = [
    { id: 'introduction', title: 'What is Position Trading?' },
    { id: 'fundamental-analysis', title: 'Fundamental Analysis', level: 'novice' as const },
    { id: 'technical-timing', title: 'Technical Timing', level: 'intermediate' as const },
    { id: 'portfolio-construction', title: 'Portfolio Construction', level: 'intermediate' as const },
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
            <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400">Long-Term</Badge>
            <Badge variant="outline">Trend Following</Badge>
            <Badge variant="secondary">23 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Position Trading: Building Wealth Through Major Trends</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Hold positions for weeks to months, capturing major market trends while minimizing
            transaction costs and time spent monitoring. The approach of legendary investors.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Typical Timeframe', value: 'Weekly-Monthly', description: 'Chart intervals' },
              { label: 'Trade Duration', value: '3-12 Months', description: 'Hold time' },
              { label: 'Trades/Year', value: '10-30', description: 'Low frequency' },
              { label: 'Win Rate Target', value: '40-50%', description: 'High R:R compensates' },
            ]}
            title="Position Trading at a Glance"
          />

          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Building2 className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                Position trading bridges the gap between active trading and long-term investing.
                It combines technical timing with fundamental conviction to capture major market moves.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Position traders think in terms of months, not days. They aim to capture 20-100%+ moves
              by identifying major trends early and holding through normal volatility. This approach
              requires patience and strong conviction, but offers potentially life-changing returns.
            </p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="cup-and-handle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> A major base formation — the type of pattern position traders seek for multi-month holds.
              </div>
            </div>
          </section>

          <section id="fundamental-analysis">
            <SkillLevelSection level="novice" title="Fundamental Analysis for Position Trading">
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Earnings Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Look for companies with accelerating earnings growth — 25%+ year-over-year growth
                    with acceleration in recent quarters. Earnings drive long-term stock performance.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Revenue Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Revenue growth validates earnings quality. Companies growing revenue 15%+ with
                    expanding margins have the fundamentals to support extended price advances.
                  </CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Industry Leadership
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Focus on market leaders within growing industries. The #1 or #2 player in a
                    growing sector often captures disproportionate gains as the sector expands.
                  </CardContent>
                </Card>
              </div>

              <PatternChecklist
                title="Fundamental Screening Criteria"
                items={[
                  { text: "EPS growth 25%+ year-over-year, accelerating", critical: true },
                  { text: "Revenue growth 15%+ with stable or improving margins" },
                  { text: "Industry in secular growth phase" },
                  { text: "Strong market position (#1 or #2 in niche)" },
                  { text: "Institutional sponsorship increasing (funds buying)" }
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="technical-timing">
            <SkillLevelSection level="intermediate" title="Technical Timing for Entry">
              <TradingRule title="Base Breakout" type="entry">
                Enter when price breaks out of multi-month base (flat base, cup-with-handle, double bottom) on heavy volume. The longer the base, the bigger the potential move.
              </TradingRule>

              <TradingRule title="Weekly Moving Average Support" type="entry">
                In established uptrends, buy pullbacks to the 10-week or 40-week moving average. These often mark excellent add points.
              </TradingRule>

              <TradingRule title="Sector Rotation Entry" type="entry">
                Enter when money flows into a neglected sector. Early sector rotation signals often precede major moves in individual names.
              </TradingRule>

              <ProTip>
                The best position trades occur when strong fundamentals align with a clear
                technical breakout. Either alone is good; both together is exceptional.
              </ProTip>
            </SkillLevelSection>
          </section>

          <section id="portfolio-construction">
            <SkillLevelSection level="intermediate" title="Portfolio Construction">
              <div className="space-y-4">
                <h4 className="font-semibold">Concentrated vs. Diversified</h4>
                <p className="text-muted-foreground">
                  Position traders typically hold 5-15 positions. Too many dilutes returns; too few
                  increases risk. Find your balance based on conviction levels and capital.
                </p>

                <h4 className="font-semibold">Position Sizing</h4>
                <p className="text-muted-foreground">
                  Start with 5-10% positions; add to winners as they prove themselves. Your best ideas
                  should become your biggest positions through pyramiding, not initial sizing.
                </p>

                <h4 className="font-semibold">Sector Allocation</h4>
                <p className="text-muted-foreground">
                  Limit exposure to any single sector to 30-40%. Sector concentration is fine when
                  that sector is leading, but diversify to protect against sector rotation.
                </p>
              </div>
            </SkillLevelSection>
          </section>

          <section id="risk-management">
            <SkillLevelSection level="advanced" title="Risk Management">
              <RiskManagementBox
                positionSize="5-10% initial, pyramid to 15-20%"
                stopLoss="7-8% below entry or below key weekly support"
                riskReward="Target 3:1 minimum, often 5:1+"
                maxRisk="25% total portfolio in any single sector"
              />

              <CommonMistakes
                title="Common Position Trading Mistakes"
                mistakes={[
                  "Selling too early — big moves take time to develop",
                  "Averaging down on losing positions (hoping for recovery)",
                  "Ignoring deteriorating fundamentals while holding",
                  "Not cutting losses when thesis breaks down",
                  "Excessive concentration in single stock or sector"
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="pro-techniques">
            <SkillLevelSection level="professional" title="Professional Techniques">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">Pyramiding Winners</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">
                    Professional position traders add to winning positions as they prove themselves.
                    This concentrates capital in what's working while limiting initial risk.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Initial position: 50% of intended size</li>
                    <li>First add: After 2-5% profit, add 25% more</li>
                    <li>Second add: At next buy point (pullback to support), final 25%</li>
                    <li>Never add to losing positions — only winners</li>
                  </ul>
                </CardContent>
              </Card>

              <ProTip>
                The biggest position trading gains come from sitting. Jesse Livermore said,
                "It was never my thinking that made the big money, it was my sitting."
                Have patience with winners.
              </ProTip>
            </SkillLevelSection>
          </section>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Ready for Position Trading?</h3>
            <p className="text-muted-foreground mb-4">
              Find major base breakouts and trend leaders with our scanner.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/screener" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Find Base Breakouts
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

export default PositionTradingStrategy;
