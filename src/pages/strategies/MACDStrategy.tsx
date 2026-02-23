import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, Activity, Waves } from "lucide-react";
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

const MACDStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.macd.${key}`);
  const sc = (key: string) => t(`strategies.common.${key}`);

  const tocSections = [
    { id: 'introduction', title: s('tocIntroduction') },
    { id: 'components', title: s('tocComponents'), level: 'novice' as const },
    { id: 'signal-types', title: s('tocSignalTypes'), level: 'intermediate' as const },
    { id: 'divergence', title: s('tocDivergence'), level: 'advanced' as const },
    { id: 'risk-management', title: s('tocRiskManagement'), level: 'advanced' as const },
    { id: 'pro-techniques', title: s('tocProTechniques'), level: 'professional' as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {sc('backToLearningCenter')}
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">{s('badge1')}</Badge>
            <Badge variant="outline">{s('badge2')}</Badge>
            <Badge variant="secondary">{t('strategies.common.minRead', { count: 17 })}</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{s('title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">{s('subtitle')}</p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: s('statsBestTf'), value: s('statsBestTfVal'), description: s('statsBestTfDesc') },
              { label: s('statsSignalFreq'), value: s('statsSignalFreqVal'), description: s('statsSignalFreqDesc') },
              { label: s('statsWinRate'), value: s('statsWinRateVal'), description: s('statsWinRateDesc') },
              { label: s('statsFalseSignals'), value: s('statsFalseSignalsVal'), description: s('statsFalseSignalsDesc') },
            ]}
            title={s('statsTitle')}
          />

          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Waves className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">{s('introAlert')}</AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">{s('introP1')}</p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="bull-flag" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> {s('chartCaption')}
              </div>
            </div>
          </section>

          <section id="components">
            <SkillLevelSection level="novice" title={s('componentsTitle')}>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {s('macdLine')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('macdLineDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      {s('signalLine')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('signalLineDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {s('histogram')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('histogramDesc')}</CardContent>
                </Card>
              </div>

              <PatternChecklist
                title={s('defaultSettingsTitle')}
                items={[
                  { text: s('settingFastEMA') },
                  { text: s('settingSlowEMA') },
                  { text: s('settingSignalLine') },
                  { text: s('settingAdjust') }
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="signal-types">
            <SkillLevelSection level="intermediate" title={s('signalTypesTitle')}>
              <TradingRule title={s('bullishCrossover')} type="entry">{s('bullishCrossoverDesc')}</TradingRule>
              <TradingRule title={s('bearishCrossover')} type="exit">{s('bearishCrossoverDesc')}</TradingRule>
              <TradingRule title={s('zeroLineCross')} type="entry">{s('zeroLineCrossDesc')}</TradingRule>
              <TradingRule title={s('histogramReversal')} type="entry">{s('histogramReversalDesc')}</TradingRule>
              <ProTip>{s('proTipHistogram')}</ProTip>
            </SkillLevelSection>
          </section>

          <section id="divergence">
            <SkillLevelSection level="advanced" title={s('divergenceTitle')}>
              <div className="space-y-4">
                <h4 className="font-semibold">{s('bullishDivergence')}</h4>
                <p className="text-muted-foreground">{s('bullishDivergenceP')}</p>
                <h4 className="font-semibold">{s('bearishDivergence')}</h4>
                <p className="text-muted-foreground">{s('bearishDivergenceP')}</p>
                <h4 className="font-semibold">{s('hiddenDivergence')}</h4>
                <p className="text-muted-foreground">{s('hiddenDivergenceP')}</p>
              </div>

              <CommonMistakes
                title={s('divMistakesTitle')}
                mistakes={[s('divMistake1'), s('divMistake2'), s('divMistake3'), s('divMistake4')]}
              />
            </SkillLevelSection>
          </section>

          <section id="risk-management">
            <SkillLevelSection level="advanced" title={s('riskTitle')}>
              <RiskManagementBox
                positionSize={s('riskPositionSize')}
                stopLoss={s('riskStopLoss')}
                riskReward={s('riskReward')}
                maxRisk={s('riskMax')}
              />

              <CommonMistakes
                title={s('commonMistakesTitle')}
                mistakes={[s('mistake1'), s('mistake2'), s('mistake3'), s('mistake4'), s('mistake5')]}
              />
            </SkillLevelSection>
          </section>

          <section id="pro-techniques">
            <SkillLevelSection level="professional" title={s('proTitle')}>
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">{s('multiTfTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">{s('multiTfP')}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{s('multiTfItem1')}</li>
                    <li>{s('multiTfItem2')}</li>
                    <li>{s('multiTfItem3')}</li>
                    <li>{s('multiTfItem4')}</li>
                  </ul>
                </CardContent>
              </Card>

              <ProTip>{s('proTipRSI')}</ProTip>
            </SkillLevelSection>
          </section>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{s('ctaTitle')}</h3>
            <p className="text-muted-foreground mb-4">{s('ctaDesc')}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/screener" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                {s('ctaButton')}
              </Link>
              <Link to="/learn" className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors">
                {sc('moreStrategies')}
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default MACDStrategy;