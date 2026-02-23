import { Link } from "react-router-dom";
import { ArrowLeft, Clock, TrendingUp, Target, Shield, BarChart3, AlertTriangle, Sun } from "lucide-react";
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

const DayTradingStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.dayTrading.${key}`);
  const sc = (key: string) => t(`strategies.common.${key}`);

  const tocSections = [
    { id: 'introduction', title: s('tocIntroduction') },
    { id: 'characteristics', title: s('tocCharacteristics'), level: 'novice' as const },
    { id: 'market-selection', title: s('tocMarketSelection'), level: 'novice' as const },
    { id: 'entry-setups', title: s('tocEntrySetups'), level: 'intermediate' as const },
    { id: 'trade-management', title: s('tocTradeManagement'), level: 'intermediate' as const },
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
            <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400">{s('badgeIntraday')}</Badge>
            <Badge variant="outline">{s('badgeTimeBased')}</Badge>
            <Badge variant="secondary">{s('badgeReadTime')}</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{s('title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">{s('subtitle')}</p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: s('statsTf'), value: s('statsTfVal'), description: s('statsTfDesc') },
              { label: s('statsDuration'), value: s('statsDurationVal'), description: s('statsDurationDesc') },
              { label: s('statsDailyTrades'), value: s('statsDailyTradesVal'), description: s('statsDailyTradesDesc') },
              { label: s('statsWinRate'), value: s('statsWinRateVal'), description: s('statsWinRateDesc') },
            ]}
            title={s('statsTitle')}
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Sun className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">{s('introAlert')}</AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">{s('introP1')}</p>

            <div className="my-8 rounded-lg overflow-hidden border border-border bg-card">
              <DynamicPatternChart patternType="ascending-triangle" height={400} showTitle={false} />
              <div className="p-4 bg-muted/30 text-sm text-muted-foreground">
                <strong>{sc('chart')}:</strong> {s('chartCaption')}
              </div>
            </div>
          </section>

          {/* Key Characteristics */}
          <section id="characteristics">
            <SkillLevelSection level="novice" title={s('charTitle')}>
              <div className="grid gap-4 mb-6">
                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      {s('sameDayTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('sameDayDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      {s('largerTargetsTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('largerTargetsDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      {s('qualitySetupsTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('qualitySetupsDesc')}</CardContent>
                </Card>

                <Card className="bg-background/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-500" />
                      {s('capitalTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{s('capitalDesc')}</CardContent>
                </Card>
              </div>

              <ProTip>{s('proTipTiming')}</ProTip>
            </SkillLevelSection>
          </section>

          {/* Market Selection */}
          <section id="market-selection">
            <SkillLevelSection level="novice" title={s('marketSelTitle')}>
              <p className="text-muted-foreground mb-6">{s('marketSelP')}</p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-green-600 dark:text-green-400">{s('idealMarketsTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-2">
                      <li>• <strong>{s('idealES')}</strong> {s('idealESDesc')}</li>
                      <li>• <strong>{s('idealNQ')}</strong> {s('idealNQDesc')}</li>
                      <li>• <strong>{s('idealEURUSD')}</strong> {s('idealEURUSDDesc')}</li>
                      <li>• <strong>{s('idealStocks')}</strong> {s('idealStocksDesc')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-red-500/10 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-red-600 dark:text-red-400">{s('avoidTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <ul className="space-y-2">
                      <li>• <strong>{s('avoidPenny')}</strong> {s('avoidPennyDesc')}</li>
                      <li>• <strong>{s('avoidExotic')}</strong> {s('avoidExoticDesc')}</li>
                      <li>• <strong>{s('avoidIlliquid')}</strong> {s('avoidIlliquidDesc')}</li>
                      <li>• <strong>{s('avoidOptions')}</strong></li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </SkillLevelSection>
          </section>

          {/* Entry Setups */}
          <section id="entry-setups">
            <SkillLevelSection level="intermediate" title={s('entryTitle')}>
              <p className="text-muted-foreground mb-6">{s('entryP')}</p>

              <h4 className="text-lg font-semibold mb-4">{s('orbTitle')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('orbEntry')}>{s('orbEntryDesc')}</TradingRule>
                <TradingRule type="stop" title={s('orbStop')}>{s('orbStopDesc')}</TradingRule>
                <TradingRule type="target" title={s('orbTarget')}>{s('orbTargetDesc')}</TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('vwapTitle')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('vwapEntry')}>
                  {s('vwapEntryDesc')}
                </TradingRule>
                <TradingRule type="stop" title={s('vwapStop')}>{s('vwapStopDesc')}</TradingRule>
                <TradingRule type="target" title={s('vwapTarget')}>{s('vwapTargetDesc')}</TradingRule>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('failedTitle')}</h4>
              <div className="space-y-3 mb-6">
                <TradingRule type="entry" title={s('failedEntry')}>{s('failedEntryDesc')}</TradingRule>
                <TradingRule type="stop" title={s('failedStop')}>{s('failedStopDesc')}</TradingRule>
                <TradingRule type="target" title={s('failedTarget')}>{s('failedTargetDesc')}</TradingRule>
              </div>
            </SkillLevelSection>
          </section>

          {/* Trade Management */}
          <section id="trade-management">
            <SkillLevelSection level="intermediate" title={s('tradeMgmtTitle')}>
              <p className="text-muted-foreground mb-6">{s('tradeMgmtP')}</p>

              <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-6">
                <h4 className="font-semibold mb-4">{s('scalingTitle')}</h4>
                <p className="text-sm text-muted-foreground mb-4">{s('scalingP')}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>{s('scalingFirst')}</strong> {s('scalingFirstDesc')}</li>
                  <li>• <strong>{s('scalingSecond')}</strong> {s('scalingSecondDesc')}</li>
                  <li>• <strong>{s('scalingThird')}</strong> {s('scalingThirdDesc')}</li>
                </ul>
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
                  <strong>{s('threeStrikeRule')}</strong> {s('threeStrikeRuleDesc')}
                </AlertDescription>
              </Alert>
            </SkillLevelSection>
          </section>

          {/* Professional Techniques */}
          <section id="pro-techniques">
            <SkillLevelSection level="professional" title={s('proTitle')}>
              <h4 className="text-lg font-semibold mb-4">{s('multiTfTitle')}</h4>
              <p className="text-muted-foreground mb-4">{s('multiTfP')}</p>

              <h4 className="text-lg font-semibold mb-4">{s('marketInternalsTitle')}</h4>
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">{s('marketInternalsP')}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>$TICK:</strong> {s('tickDesc')}</li>
                  <li>• <strong>$ADD:</strong> {s('addDesc')}</li>
                  <li>• <strong>$VOLD:</strong> {s('voldDesc')}</li>
                  <li>• <strong>VIX:</strong> {s('vixDesc')}</li>
                </ul>
              </div>

              <h4 className="text-lg font-semibold mb-4">{s('prepTitle')}</h4>
              <PatternChecklist 
                title={s('prepChecklistTitle')}
                items={[
                  { text: s('prepItem1'), critical: true },
                  { text: s('prepItem2'), critical: true },
                  { text: s('prepItem3'), critical: true },
                  { text: s('prepItem4') },
                  { text: s('prepItem5') },
                  { text: s('prepItem6') },
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
              <Link to="/learn/strategies/scalping" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedScalping')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedScalpingDesc')}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/learn/strategies/swing-trading" className="block">
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{s('relatedSwing')}</h4>
                    <p className="text-sm text-muted-foreground">{s('relatedSwingDesc')}</p>
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
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default DayTradingStrategy;
