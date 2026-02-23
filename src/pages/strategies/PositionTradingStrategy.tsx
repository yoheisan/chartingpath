import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Shield, BarChart3, Clock, Building2 } from "lucide-react";
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

const PositionTradingStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.positionTrading.${key}`);
  const sc = (key: string) => t(`strategies.common.${key}`);

  const tocSections = [
    { id: 'introduction', title: s('tocIntro') },
    { id: 'fundamental-analysis', title: s('tocFundamental'), level: 'novice' as const },
    { id: 'technical-timing', title: s('tocTechnicalTiming'), level: 'intermediate' as const },
    { id: 'portfolio-construction', title: s('tocPortfolio'), level: 'intermediate' as const },
    { id: 'risk-management', title: s('tocRiskMgmt'), level: 'advanced' as const },
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
            <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400">{s('badge1')}</Badge>
            <Badge variant="outline">{s('badge2')}</Badge>
            <Badge variant="secondary">{s('readTime')}</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{s('title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">{s('subtitle')}</p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: s('statsTfLabel'), value: s('statsTfVal'), description: s('statsTfDesc') },
              { label: s('statsDurLabel'), value: s('statsDurVal'), description: s('statsDurDesc') },
              { label: s('statsTradesLabel'), value: s('statsTradesVal'), description: s('statsTradesDesc') },
              { label: s('statsWrLabel'), value: s('statsWrVal'), description: s('statsWrDesc') },
            ]}
            title={s('statsTitle')}
          />

          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Building2 className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">{s('introAlert')}</AlertDescription>
            </Alert>
            <p className="text-muted-foreground leading-relaxed mb-6">{s('introP')}</p>
            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="cup-and-handle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>{sc('chart')}:</strong> {s('chartCaption')}
              </div>
            </div>
          </section>

          <section id="fundamental-analysis">
            <SkillLevelSection level="novice" title={s('fundamentalTitle')}>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {s('earningsTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('earningsDesc')}</CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {s('revenueTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('revenueDesc')}</CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {s('industryTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('industryDesc')}</CardContent>
                </Card>
              </div>
              <PatternChecklist
                title={s('checklistTitle')}
                items={[
                  { text: s('check1'), critical: true },
                  { text: s('check2') },
                  { text: s('check3') },
                  { text: s('check4') },
                  { text: s('check5') }
                ]}
              />
            </SkillLevelSection>
          </section>

          <section id="technical-timing">
            <SkillLevelSection level="intermediate" title={s('technicalTitle')}>
              <TradingRule title={s('baseBreakout')} type="entry">{s('baseBreakoutDesc')}</TradingRule>
              <TradingRule title={s('weeklyMA')} type="entry">{s('weeklyMADesc')}</TradingRule>
              <TradingRule title={s('sectorRotation')} type="entry">{s('sectorRotationDesc')}</TradingRule>
              <ProTip>{s('proTipTiming')}</ProTip>
            </SkillLevelSection>
          </section>

          <section id="portfolio-construction">
            <SkillLevelSection level="intermediate" title={s('portfolioTitle')}>
              <div className="space-y-4">
                <h4 className="font-semibold">{s('concentrated')}</h4>
                <p className="text-muted-foreground">{s('concentratedDesc')}</p>
                <h4 className="font-semibold">{s('positionSizing')}</h4>
                <p className="text-muted-foreground">{s('positionSizingDesc')}</p>
                <h4 className="font-semibold">{s('sectorAlloc')}</h4>
                <p className="text-muted-foreground">{s('sectorAllocDesc')}</p>
              </div>
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
                title={s('mistakesTitle')}
                mistakes={[s('mistake1'), s('mistake2'), s('mistake3'), s('mistake4'), s('mistake5')]}
              />
            </SkillLevelSection>
          </section>

          <section id="pro-techniques">
            <SkillLevelSection level="professional" title={s('proTitle')}>
              <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">{s('pyramidingTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="mb-4">{s('pyramidingP')}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{s('pyramid1')}</li>
                    <li>{s('pyramid2')}</li>
                    <li>{s('pyramid3')}</li>
                    <li>{s('pyramid4')}</li>
                  </ul>
                </CardContent>
              </Card>
              <ProTip>{s('proTipSitting')}</ProTip>
            </SkillLevelSection>
          </section>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{s('ctaTitle')}</h3>
            <p className="text-muted-foreground mb-4">{s('ctaDesc')}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/screener" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                {s('ctaScan')}
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

export default PositionTradingStrategy;
