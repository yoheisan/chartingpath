import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, Activity, Maximize2 } from "lucide-react";
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

const BollingerBandsStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.bollingerBands.${key}`);
  const sc = (key: string) => t(`strategies.common.${key}`);

  const tocSections = [
    { id: 'introduction', title: s('tocIntroduction') },
    { id: 'band-structure', title: s('tocBandStructure'), level: 'novice' as const },
    { id: 'trading-signals', title: s('tocTradingSignals'), level: 'intermediate' as const },
    { id: 'squeeze-strategy', title: s('tocSqueezeStrategy'), level: 'advanced' as const },
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
            <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400">{s('badge1')}</Badge>
            <Badge variant="outline">{s('badge2')}</Badge>
            <Badge variant="secondary">{t('strategies.common.minRead', { count: 18 })}</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{s('title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">{s('subtitle')}</p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: s('statsBestTf'), value: s('statsBestTfVal'), description: s('statsBestTfDesc') },
              { label: s('statsPrimaryUse'), value: s('statsPrimaryUseVal'), description: s('statsPrimaryUseDesc') },
              { label: s('statsWinRate'), value: s('statsWinRateVal'), description: s('statsWinRateDesc') },
              { label: s('statsSettings'), value: s('statsSettingsVal'), description: s('statsSettingsDesc') },
            ]}
            title={s('statsTitle')}
          />

          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Maximize2 className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">{s('introAlert')}</AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">{s('introP1')}</p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="symmetrical-triangle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>Chart:</strong> {s('chartCaption')}
              </div>
            </div>
          </section>

          <section id="band-structure">
            <SkillLevelSection level="novice" title={s('bandStructureTitle')}>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {s('middleBand')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('middleBandDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      {s('upperBand')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('upperBandDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {s('lowerBand')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('lowerBandDesc')}</CardContent>
                </Card>
              </div>

              <PatternChecklist
                title={s('settingsTitle')}
                items={[
                  { text: s('settingStandard') },
                  { text: s('settingShorter') },
                  { text: s('settingLonger') },
                  { text: s('settingAdjust') }
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="trading-signals">
            <SkillLevelSection level="intermediate" title={s('tradingSignalsTitle')}>
              <TradingRule title={s('meanReversionTitle')} type="entry">{s('meanReversionDesc')}</TradingRule>
              <TradingRule title={s('bandWalkTitle')} type="entry">{s('bandWalkDesc')}</TradingRule>
              <TradingRule title={s('wBottomTitle')} type="entry">{s('wBottomDesc')}</TradingRule>
              <TradingRule title={s('squeezeBreakoutTitle')} type="entry">{s('squeezeBreakoutDesc')}</TradingRule>
              <ProTip>{s('proTipTrending')}</ProTip>
            </SkillLevelSection>
          </section>

          <section id="squeeze-strategy">
            <SkillLevelSection level="advanced" title={s('squeezeTitle')}>
              <div className="space-y-4">
                <h4 className="font-semibold">{s('identifyingSqueeze')}</h4>
                <p className="text-muted-foreground">{s('identifyingSqueezeP')}</p>
                <h4 className="font-semibold">{s('tradingBreakout')}</h4>
                <p className="text-muted-foreground">{s('tradingBreakoutP')}</p>
                <h4 className="font-semibold">{s('momentumConfirmation')}</h4>
                <p className="text-muted-foreground">{s('momentumConfirmationP')}</p>
              </div>

              <CommonMistakes
                title={s('squeezeMistakesTitle')}
                mistakes={[s('squeezeMistake1'), s('squeezeMistake2'), s('squeezeMistake3'), s('squeezeMistake4')]}
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
                  <CardTitle className="text-lg">{s('bandwidthTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">{s('bandwidthP')}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{s('bandwidthItem1')}</li>
                    <li>{s('bandwidthItem2')}</li>
                    <li>{s('bandwidthItem3')}</li>
                    <li>{s('bandwidthItem4')}</li>
                  </ul>
                </CardContent>
              </Card>

              <ProTip>{s('proTipPercentB')}</ProTip>
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

export default BollingerBandsStrategy;