import { Link } from "react-router-dom";
import { ArrowLeft, TrendingDown, Target, Shield, BarChart3, AlertTriangle, RefreshCw } from "lucide-react";
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
import { useTranslation } from "react-i18next";

const MeanReversionStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.meanReversion.${key}`);
  const sc = (key: string) => t(`strategies.common.${key}`);

  const tocSections = [
    { id: 'introduction', title: s('tocIntroduction') },
    { id: 'theory', title: s('tocTheory'), level: 'novice' as const },
    { id: 'indicators', title: s('tocIndicators'), level: 'novice' as const },
    { id: 'entry-setups', title: s('tocEntrySetups'), level: 'intermediate' as const },
    { id: 'exit-strategies', title: s('tocExitStrategies'), level: 'intermediate' as const },
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
            <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400">{s('badgeCounterTrend')}</Badge>
            <Badge variant="outline">{s('badgeStatistical')}</Badge>
            <Badge variant="secondary">{s('badgeReadTime')}</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{s('title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">{s('subtitle')}</p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: s('statsWinRate'), value: s('statsWinRateVal'), description: s('statsWinRateDesc') },
              { label: s('statsRR'), value: s('statsRRVal'), description: s('statsRRDesc') },
              { label: s('statsBestMarkets'), value: s('statsBestMarketsVal'), description: s('statsBestMarketsDesc') },
              { label: s('statsHoldTime'), value: s('statsHoldTimeVal'), description: s('statsHoldTimeDesc') },
            ]}
            title={s('statsTitle')}
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <RefreshCw className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">{s('introAlert')}</AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">{s('introP1')}</p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="double-bottom" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>{sc('chart')}:</strong> {s('chartCaption')}
              </div>
            </div>
          </section>

          {/* Theory */}
          <section id="theory">
            <SkillLevelSection level="novice" title={s('theoryTitle')}>
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
                <h4 className="font-semibold mb-3">{s('theoryBoxTitle')}</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><strong className="text-foreground">{s('theoryStat')}</strong> {s('theoryStatDesc')}</li>
                  <li><strong className="text-foreground">{s('theoryProfit')}</strong> {s('theoryProfitDesc')}</li>
                  <li><strong className="text-foreground">{s('theoryValue')}</strong> {s('theoryValueDesc')}</li>
                  <li><strong className="text-foreground">{s('theoryMicro')}</strong> {s('theoryMicroDesc')}</li>
                </ul>
              </div>

              <Alert>
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>{s('theoryWarning')}</strong> {s('theoryWarningDesc')}
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* Key Indicators */}
          <section id="indicators">
            <SkillLevelSection level="novice" title={s('indicatorsTitle')}>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      {s('bbTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('bbDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-blue-500" />
                      {s('rsiTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('rsiDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-green-500" />
                      {s('distanceTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('distanceDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-amber-500" />
                      {s('zScoreTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('zScoreDesc')}</CardContent>
                </Card>
              </div>

              <ProTip>{s('proTipRSI')}</ProTip>
            </SkillLevelSection>
          </section>

          {/* Entry Setups */}
          <section id="entry-setups">
            <SkillLevelSection level="intermediate" title={s('entryTitle')}>
              <h4 className="text-lg font-semibold mb-4">{s('rsi2Title')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('rsi2Long')}>{s('rsi2LongDesc')}</TradingRule>
                <TradingRule type="exit" title={s('rsi2Exit')}>{s('rsi2ExitDesc')}</TradingRule>
                <TradingRule type="stop" title={s('rsi2Stop')}>{s('rsi2StopDesc')}</TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('bb2Title')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('bb2Long')}>{s('bb2LongDesc')}</TradingRule>
                <TradingRule type="target" title={s('bb2Target')}>{s('bb2TargetDesc')}</TradingRule>
                <TradingRule type="stop" title={s('bb2Stop')}>{s('bb2StopDesc')}</TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('multiDayTitle')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('multiDayLong')}>{s('multiDayLongDesc')}</TradingRule>
                <TradingRule type="exit" title={s('multiDayExit')}>{s('multiDayExitDesc')}</TradingRule>
              </div>
            </SkillLevelSection>
          </section>

          {/* Exit Strategies */}
          <section id="exit-strategies">
            <SkillLevelSection level="intermediate" title={s('exitTitle')}>
              <div className="grid gap-4 mb-6">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">{s('exitTimeTitle')}</h4>
                    <p className="text-sm text-muted-foreground">{s('exitTimeDesc')}</p>
                  </CardContent>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">{s('exitTargetTitle')}</h4>
                    <p className="text-sm text-muted-foreground">{s('exitTargetDesc')}</p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-500/10 border-amber-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">{s('exitIndicatorTitle')}</h4>
                    <p className="text-sm text-muted-foreground">{s('exitIndicatorDesc')}</p>
                  </CardContent>
                </Card>
              </div>

              <CommonMistakes 
                mistakes={[
                  s('mistake1'), s('mistake2'), s('mistake3'),
                  s('mistake4'), s('mistake5'), s('mistake6'),
                ]}
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

              <Alert className="mt-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>{s('avgDownWarning')}</strong> {s('avgDownWarningDesc')}
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* Professional Techniques */}
          <section id="pro-techniques">
            <SkillLevelSection level="professional" title={s('proTitle')}>
              <h4 className="text-lg font-semibold mb-4">{s('regimeTitle')}</h4>
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-4">{s('regimeP')}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>{s('regimeADX')}</strong> {s('regimeADXDesc')}</li>
                  <li>• <strong>{s('regimeBB')}</strong> {s('regimeBBDesc')}</li>
                  <li>• <strong>{s('regimeMA')}</strong> {s('regimeMADesc')}</li>
                  <li>• <strong>{s('regimeOff')}</strong></li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('pairsTitle')}</h4>
              <p className="text-muted-foreground mb-4">{s('pairsP')}</p>

              <h4 className="text-lg font-semibold mb-4">{s('intradayTitle')}</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">{s('intradayP')}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• {s('intradayItem1')}</li>
                  <li>• {s('intradayItem2')}</li>
                  <li>• {s('intradayItem3')}</li>
                </ul>
              </div>

              <PatternChecklist 
                title={s('checklistTitle')}
                items={[
                  { text: s('checkItem1'), critical: true },
                  { text: s('checkItem2'), critical: true },
                  { text: s('checkItem3'), critical: true },
                  { text: s('checkItem4') },
                  { text: s('checkItem5') },
                  { text: s('checkItem6') },
                ]}
              />
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
            <h2 className="text-2xl font-bold mb-4">{s('relatedTitle')}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/learn/rsi-indicator" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedRSI')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedRSIDesc')}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/bollinger-bands" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedBB')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedBBDesc')}</p>
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

export default MeanReversionStrategy;
