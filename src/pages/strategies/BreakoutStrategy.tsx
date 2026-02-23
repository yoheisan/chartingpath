import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, AlertTriangle, Zap, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DynamicPatternChart } from "@/components/DynamicPatternChart";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.breakout.${key}`);
  const sc = (key: string) => t(`strategies.common.${key}`);

  const tocSections = [
    { id: 'introduction', title: s('tocIntroduction') },
    { id: 'types', title: s('tocTypes'), level: 'novice' as const },
    { id: 'identification', title: s('tocIdentification'), level: 'novice' as const },
    { id: 'entry-rules', title: s('tocEntryRules'), level: 'intermediate' as const },
    { id: 'false-breakouts', title: s('tocFalseBreakouts'), level: 'intermediate' as const },
    { id: 'risk-management', title: s('tocRiskManagement'), level: 'advanced' as const },
    { id: 'pro-techniques', title: s('tocProTechniques'), level: 'professional' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn/trading-strategies-guide" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {sc('backToStrategyGuide')}
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">{s('badge1')}</Badge>
            <Badge variant="outline">{s('badge2')}</Badge>
            <Badge variant="secondary">{t('strategies.common.minRead', { count: 14 })}</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{s('title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">{s('subtitle')}</p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: s('statsWinRate'), value: s('statsWinRateVal'), description: s('statsWinRateDesc') },
              { label: s('statsRR'), value: s('statsRRVal'), description: s('statsRRDesc') },
              { label: s('statsBestTf'), value: s('statsBestTfVal'), description: s('statsBestTfDesc') },
              { label: s('statsFalse'), value: s('statsFalseVal'), description: s('statsFalseDesc') },
            ]}
            title={s('statsTitle')}
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Zap className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">{s('introAlert')}</AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">{s('introP1')}</p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="ascending-triangle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> {s('chartCaption')}
              </div>
            </div>
          </section>

          {/* Types of Breakouts */}
          <section id="types">
            <SkillLevelSection level="novice" title={s('typesTitle')}>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50 border-l-4 border-green-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">{s('horizontalTitle')}</h4>
                    <p className="text-sm text-muted-foreground">{s('horizontalDesc')}</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-blue-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">{s('chartPatternTitle')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {s('chartPatternDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-purple-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">{s('rangeTitle')}</h4>
                    <p className="text-sm text-muted-foreground">{s('rangeDesc')}</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-l-4 border-amber-500">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">{s('volatilityTitle')}</h4>
                    <p className="text-sm text-muted-foreground">{s('volatilityDesc')}</p>
                  </CardContent>
                </Card>
              </div>

              <ProTip>{s('proTipTypes')}</ProTip>
            </SkillLevelSection>
          </section>

          {/* Identification */}
          <section id="identification">
            <SkillLevelSection level="novice" title={s('identTitle')}>
              <PatternChecklist 
                title={s('identChecklistTitle')}
                items={[
                  { text: s('identItem1'), critical: true },
                  { text: s('identItem2'), critical: true },
                  { text: s('identItem3'), critical: false },
                  { text: s('identItem4'), critical: true },
                  { text: s('identItem5'), critical: false },
                  { text: s('identItem6'), critical: true },
                  { text: s('identItem7'), critical: false },
                ]}
              />

              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mt-6">
                <h4 className="font-semibold mb-3">{s('squeezeSetup')}</h4>
                <p className="text-sm text-muted-foreground">{s('squeezeSetupP')}</p>
              </div>
            </SkillLevelSection>
          </section>

          {/* Entry Rules */}
          <section id="entry-rules">
            <SkillLevelSection level="intermediate" title={s('entryRulesTitle')}>
              <h4 className="text-lg font-semibold mb-4">{s('aggressiveEntry')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('aggressiveEntrySignal')}>{s('aggressiveEntrySignalDesc')}</TradingRule>
                <TradingRule type="stop" title={s('aggressiveStopLoss')}>{s('aggressiveStopLossDesc')}</TradingRule>
                <TradingRule type="target" title={s('aggressiveTarget')}>{s('aggressiveTargetDesc')}</TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('conservativeEntry')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('conservativeEntrySignal')}>{s('conservativeEntrySignalDesc')}</TradingRule>
                <TradingRule type="stop" title={s('conservativeStopLoss')}>{s('conservativeStopLossDesc')}</TradingRule>
                <TradingRule type="target" title={s('conservativeTarget')}>{s('conservativeTargetDesc')}</TradingRule>
              </div>

              <Alert className="mt-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Trade-Off:</strong> {s('tradeOffAlert')}
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* False Breakouts */}
          <section id="false-breakouts">
            <SkillLevelSection level="intermediate" title={s('falseBreakoutsTitle')}>
              <p className="text-muted-foreground mb-6">{s('falseBreakoutsP')}</p>

              <h4 className="text-lg font-semibold mb-4">{s('recognizing')}</h4>
              <div className="grid gap-4 mb-6">
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-red-600 dark:text-red-400">{s('lowVolBreakout')}</strong>
                    {" "}{s('lowVolBreakoutDesc')}
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-red-600 dark:text-red-400">{s('wickOnly')}</strong>
                    {" "}{s('wickOnlyDesc')}
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-red-600 dark:text-red-400">{s('immediateReversal')}</strong>
                    {" "}{s('immediateReversalDesc')}
                  </CardContent>
                </Card>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('tradingFailed')}</h4>
              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-4">{s('tradingFailedP')}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {s('tradingFailedItem1')}</li>
                  <li>• {s('tradingFailedItem2')}</li>
                  <li>• {s('tradingFailedItem3')}</li>
                </ul>
              </div>

              <CommonMistakes 
                mistakes={[s('commonMistake1'), s('commonMistake2'), s('commonMistake3'), s('commonMistake4'), s('commonMistake5'), s('commonMistake6')]}
              />
            </SkillLevelSection>
          </section>

          {/* Risk Management */}
          <section id="risk-management">
            <SkillLevelSection level="advanced" title={s('riskTitle')}>
              <RiskManagementBox 
                positionSize={s('riskPositionSize')}
                stopLoss={s('riskStopLoss')}
                riskReward={s('riskReward')}
                maxRisk={s('riskMax')}
              />

              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mt-6">
                <h4 className="font-semibold mb-3">{s('positionSizingTitle')}</h4>
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
            <SkillLevelSection level="professional" title={s('proTitle')}>
              <h4 className="text-lg font-semibold mb-4">{s('multiTfTitle')}</h4>
              <p className="text-muted-foreground mb-4">{s('multiTfP')}</p>

              <h4 className="text-lg font-semibold mb-4">{s('orderFlowTitle')}</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">{s('orderFlowP')}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Delta:</strong> {s('deltaItem')}</li>
                  <li>• <strong>Large Prints:</strong> {s('largePrintsItem')}</li>
                  <li>• <strong>Absorption:</strong> {s('absorptionItem')}</li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('measuredMoveTitle')}</h4>
              <div className="space-y-3">
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Rectangles:</strong> {s('rectanglesTarget')}
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Triangles:</strong> {s('trianglesTarget')}
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Flags:</strong> {s('flagsTarget')}
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Head & Shoulders:</strong> {s('hsTarget')}
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* Summary */}
          <section className="mt-12">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <CardHeader>
                <CardTitle>{s('summaryTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{s('bestFor')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {s('bestForItem1')}</li>
                      <li>• {s('bestForItem2')}</li>
                      <li>• {s('bestForItem3')}</li>
                      <li>• {s('bestForItem4')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{s('notIdealFor')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {s('notIdealItem1')}</li>
                      <li>• {s('notIdealItem2')}</li>
                      <li>• {s('notIdealItem3')}</li>
                      <li>• {s('notIdealItem4')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Related Strategies */}
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">{sc('relatedStrategies')}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/learn/strategies/trend-following" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedTrendFollowing')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedTrendFollowingDesc')}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/momentum-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedMomentum')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedMomentumDesc')}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/support-resistance" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedSR')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedSRDesc')}</p>
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