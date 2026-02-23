import { Link } from "react-router-dom";
import { ArrowLeft, Clock, TrendingUp, Target, Shield, BarChart3, AlertTriangle, Zap } from "lucide-react";
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

const ScalpingStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.scalping.${key}`);
  const sc = (key: string) => t(`strategies.common.${key}`);

  const tocSections = [
    { id: 'introduction', title: s('tocIntro') },
    { id: 'characteristics', title: s('tocCharacteristics'), level: 'novice' as const },
    { id: 'setup-requirements', title: s('tocSetup'), level: 'novice' as const },
    { id: 'entry-strategies', title: s('tocEntry'), level: 'intermediate' as const },
    { id: 'exit-management', title: s('tocExit'), level: 'intermediate' as const },
    { id: 'risk-management', title: s('tocRiskMgmt'), level: 'advanced' as const },
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
            <Badge className="bg-red-500/20 text-red-600 dark:text-red-400">{s('badge1')}</Badge>
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
              <Zap className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">{s('introAlert')}</AlertDescription>
            </Alert>
            <p className="text-muted-foreground leading-relaxed mb-6">{s('introP')}</p>
            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="bull-flag" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>{sc('chart')}:</strong> {s('chartCaption')}
              </div>
            </div>
          </section>

          <section id="characteristics">
            <SkillLevelSection level="novice" title={s('characteristicsTitle')}>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      {s('holdingTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('holdingDesc')}</CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      {s('profitTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('profitDesc')}</CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      {s('volumeTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('volumeDesc')}</CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-500" />
                      {s('riskControlTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('riskControlDesc')}</CardContent>
                </Card>
              </div>
              <ProTip>{s('proTipLiquidity')}</ProTip>
            </SkillLevelSection>
          </section>

          <section id="setup-requirements">
            <SkillLevelSection level="novice" title={s('setupTitle')}>
              <p className="text-muted-foreground mb-6">{s('setupP')}</p>
              <PatternChecklist 
                title={s('setupChecklistTitle')}
                items={[
                  { text: s('setup1'), critical: true },
                  { text: s('setup2'), critical: true },
                  { text: s('setup3'), critical: true },
                  { text: s('setup4') },
                  { text: s('setup5') },
                  { text: s('setup6') },
                  { text: s('setup7') },
                  { text: s('setup8') },
                ]}
              />
              <Alert className="mt-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  <strong>{s('costWarning')}</strong> {s('costWarningDesc')}
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          <section id="entry-strategies">
            <SkillLevelSection level="intermediate" title={s('entryTitle')}>
              <p className="text-muted-foreground mb-6">{s('entryP')}</p>

              <h4 className="text-lg font-semibold mb-4">{s('momentumScalping')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('momentumEntry')}>{s('momentumEntryDesc')}</TradingRule>
                <TradingRule type="stop" title={s('momentumStop')}>{s('momentumStopDesc')}</TradingRule>
                <TradingRule type="target" title={s('momentumTarget')}>{s('momentumTargetDesc')}</TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('rangeScalping')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('rangeEntry')}>{s('rangeEntryDesc')}</TradingRule>
                <TradingRule type="stop" title={s('rangeStop')}>{s('rangeStopDesc')}</TradingRule>
                <TradingRule type="target" title={s('rangeTarget')}>{s('rangeTargetDesc')}</TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('orderFlowScalping')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('orderFlowEntry')}>{s('orderFlowEntryDesc')}</TradingRule>
                <TradingRule type="stop" title={s('orderFlowStop')}>{s('orderFlowStopDesc')}</TradingRule>
                <TradingRule type="target" title={s('orderFlowTarget')}>{s('orderFlowTargetDesc')}</TradingRule>
              </div>
            </SkillLevelSection>
          </section>

          <section id="exit-management">
            <SkillLevelSection level="intermediate" title={s('exitTitle')}>
              <p className="text-muted-foreground mb-6">{s('exitP')}</p>
              <div className="grid gap-4 mb-6">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">{s('takingProfits')}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• {s('tp1')}</li>
                      <li>• {s('tp2')}</li>
                      <li>• {s('tp3')}</li>
                      <li>• {s('tp4')}</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">{s('cuttingLosses')}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• {s('cl1')}</li>
                      <li>• {s('cl2')}</li>
                      <li>• {s('cl3')}</li>
                      <li>• {s('cl4')}</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              <CommonMistakes 
                mistakes={[s('exitMistake1'), s('exitMistake2'), s('exitMistake3'), s('exitMistake4'), s('exitMistake5')]}
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
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mt-6">
                <h4 className="font-semibold mb-3">{s('mathTitle')}</h4>
                <p className="text-sm text-muted-foreground mb-4">{s('mathP')}</p>
                <div className="font-mono text-sm bg-background/50 p-4 rounded">
                  <p>{s('mathLine1')}</p>
                  <p>{s('mathLine2')}</p>
                  <p>{s('mathLine3')}</p>
                  <p className="mt-2 text-green-500 font-semibold">{s('mathResult')}</p>
                  <p className="text-muted-foreground mt-2">{s('mathNote')}</p>
                </div>
              </div>
            </SkillLevelSection>
          </section>

          <section id="pro-techniques">
            <SkillLevelSection level="professional" title={s('proTitle')}>
              <p className="text-muted-foreground mb-6">{s('proP')}</p>

              <h4 className="text-lg font-semibold mb-4">{s('todTitle')}</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  <strong>{s('todLondon')}</strong> {s('todLondonDesc')}<br/>
                  <strong>{s('todNY')}</strong> {s('todNYDesc')}<br/>
                  <strong>{s('todOverlap')}</strong> {s('todOverlapDesc')}<br/>
                  <strong>{s('todAvoid')}</strong> {s('todAvoidDesc')}
                </p>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('corrTitle')}</h4>
              <p className="text-muted-foreground mb-4">{s('corrP')}</p>

              <h4 className="text-lg font-semibold mb-4">{s('psychTitle')}</h4>
              <div className="space-y-3">
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">{s('detachment')}</strong> {s('detachmentDesc')}
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">{s('routine')}</strong> {s('routineDesc')}
                  </CardContent>
                </Card>
                <Card className="bg-background/50">
                  <CardContent className="pt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">{s('health')}</strong> {s('healthDesc')}
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

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
                      <li>• {s('bestFor1')}</li>
                      <li>• {s('bestFor2')}</li>
                      <li>• {s('bestFor3')}</li>
                      <li>• {s('bestFor4')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{s('notIdealFor')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {s('notIdeal1')}</li>
                      <li>• {s('notIdeal2')}</li>
                      <li>• {s('notIdeal3')}</li>
                      <li>• {s('notIdeal4')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">{s('relatedTitle')}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/learn/strategies/day-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedDayTrading')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedDayTradingDesc')}</p>
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
              <Link to="/learn/strategies/breakout" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedBreakout')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedBreakoutDesc')}</p>
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

export default ScalpingStrategy;
