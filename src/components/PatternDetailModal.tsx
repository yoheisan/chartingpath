import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, RotateCcw, Target, Shield, Clock, Volume2, Brain, AlertTriangle, Lightbulb, Info, BookOpen, Eye, Crosshair, BarChart3, Globe, CheckCircle } from "lucide-react";
import { getPatternDetails } from "@/utils/PatternDetails";
import { DynamicPatternChart } from "@/components/DynamicPatternChart";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { translatePatternName } from "@/utils/translatePatternName";
import { PatternPerformanceSnapshot } from "@/components/pattern-library/PatternPerformanceSnapshot";
import { PatternLiveSetupsCTA } from "@/components/pattern-library/PatternLiveSetupsCTA";
import { CandlestickEducationalNotice } from "@/components/pattern-library/CandlestickEducationalNotice";
import { PatternDynamicTimeframe } from "@/components/pattern-library/PatternDynamicTimeframe";
import { usePatternDetailStats, CANDLESTICK_PATTERNS } from "@/hooks/usePatternDetailStats";

interface PatternDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patternKey: string;
}

export const PatternDetailModal = ({ isOpen, onClose, patternKey }: PatternDetailModalProps) => {
  const { t } = useTranslation();
  const s = (key: string) => t(`patternDetailModal.${key}`);
  const patternDetail = getPatternDetails(patternKey);
  const { data: stats } = usePatternDetailStats(patternKey);
  const isCandlestick = CANDLESTICK_PATTERNS.includes(patternKey);

  const pc = (field: string, fallback: string) => t(`patternContent.${patternKey}.${field}`, fallback);
  const pcArr = (field: string, items: string[]) =>
    items.map((item, i) => t(`patternContent.${patternKey}.${field}_${i}`, item));

  if (!patternDetail) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reversal": return <RotateCcw className="h-4 w-4" />;
      case "continuation": return <TrendingUp className="h-4 w-4" />;
      case "candlestick": return <TrendingDown className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "reversal": return "destructive";
      case "continuation": return "default";
      case "candlestick": return "secondary";
      default: return "outline";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-bullish text-bullish-foreground";
      case "Intermediate": return "bg-primary text-primary-foreground";
      case "Advanced": return "bg-bearish text-bearish-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const translatedCharacteristics = pcArr('characteristics', patternDetail.characteristics);
  const translatedKeyFactors = pcArr('keyFactors', patternDetail.keyFactors);
  const translatedCommonMistakes = pcArr('commonMistakes', patternDetail.commonMistakes);
  const translatedAltTargets = pcArr('altTargets', patternDetail.targetPriceMethodologies.alternative);
  const translatedHowToIdentify = patternDetail.howToIdentify ? pcArr('howToIdentify', patternDetail.howToIdentify) : [];
  const translatedTradeTargets = patternDetail.howToTrade ? pcArr('tradeTargets', patternDetail.howToTrade.targets) : [];
  const translatedRealWorldExamples = patternDetail.realWorldExamples ? pcArr('realWorldExamples', patternDetail.realWorldExamples) : [];
  const translatedBestConditions = patternDetail.bestMarketConditions ? pcArr('bestConditions', patternDetail.bestMarketConditions) : [];

  // Determine whether to show standalone entry/stopLoss fields:
  // Hide them if howToTrade exists (to avoid duplication)
  const hasHowToTrade = !!patternDetail.howToTrade;

  // Dynamic outcome snapshot line
  const outcomeSnapshotText = stats
    ? stats.totalDetections >= 20
      ? t('patternLibrary.outcomeSnapshot', 'ChartingPath data: {{wr}}% win rate · n={{n}} detections · Best on {{tf}} · {{asset}}', { wr: stats.winRate, n: stats.totalDetections.toLocaleString(), tf: stats.bestTimeframe.toUpperCase(), asset: stats.bestAssetClass })
      : t('patternLibrary.accumulatingData', 'Accumulating data — {{count}} detection(s) so far', { count: stats.totalDetections })
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getTypeIcon(patternDetail.type)}
            <DialogTitle className="text-2xl">{translatePatternName(patternDetail.name)}</DialogTitle>
            <Badge variant={getTypeColor(patternDetail.type) as any} className="capitalize">
              {t(`patternLibrary.types.${patternDetail.type}`, patternDetail.type)}
            </Badge>
          </div>
          <DialogDescription className="text-base">
            {t(`patternLibrary.descriptions.${patternDetail.name}`, patternDetail.description)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Candlestick educational notice */}
            <CandlestickEducationalNotice patternKey={patternKey} />

            {/* Quick Stats — replace static accuracy with dynamic outcome data */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Dynamic win rate replaces static accuracy */}
              <div className="text-center p-3 border rounded-lg">
                {stats && stats.totalDetections >= 20 ? (
                  <>
                    <div className="text-2xl font-bold text-bullish">{stats.winRate}%</div>
                    <div className="text-xs text-muted-foreground">n={stats.totalDetections.toLocaleString()}</div>
                  </>
                ) : isCandlestick ? (
                  <>
                    <div className="text-sm text-muted-foreground italic">Educational only</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground italic">Accumulating data</div>
                  </>
                )}
                <div className="text-sm text-muted-foreground">{s('successRate')}</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Badge className={`${getDifficultyColor(patternDetail.difficulty)} text-sm`}>
                  {t(`patternLibrary.difficulty.${patternDetail.difficulty}`, patternDetail.difficulty)}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">{s('difficulty')}</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <PatternDynamicTimeframe patternKey={patternKey} textbookTimeframe={patternDetail.timeframe} />
                </div>
              </div>
            </div>

            {/* Dynamic outcome snapshot line */}
            {outcomeSnapshotText && (
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary font-semibold mr-2">
                  ChartingPath data
                </Badge>
                <span className="text-xs text-muted-foreground">{outcomeSnapshotText}</span>
              </div>
            )}

            <Separator />

            {/* Pattern Chart Visualization */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {s('patternVisualization')}
              </h3>
              <div className="rounded-xl overflow-hidden border border-border bg-card">
                <DynamicPatternChart 
                  patternType={patternKey} 
                  width={700} 
                  height={400} 
                  showTitle={false}
                />
              </div>
            </div>

            {/* What Is It? */}
            {patternDetail.whatIsIt && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {s('whatIsThisPattern')}
                  </h3>
                  <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                    <p className="text-sm leading-relaxed text-foreground">{pc('whatIsIt', patternDetail.whatIsIt)}</p>
                  </Card>
                </div>
              </>
            )}

            {/* Performance Snapshot — between Description and Key Characteristics */}
            <PatternPerformanceSnapshot patternKey={patternKey} />

            {/* Why It Happens */}
            {patternDetail.whyItHappens && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    {s('whyDoesItForm')}
                  </h3>
                  <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
                    <p className="text-sm leading-relaxed text-foreground">{pc('whyItHappens', patternDetail.whyItHappens)}</p>
                  </Card>
                </div>
              </>
            )}

            {/* How to Identify */}
            {patternDetail.howToIdentify && patternDetail.howToIdentify.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    {s('howToIdentify')}
                  </h3>
                  <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
                    <ol className="space-y-3">
                      {translatedHowToIdentify.map((step, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-foreground pt-0.5">{step.replace(/^STEP \d+:\s*/i, '').replace(/^ステップ\d+[：:]\s*/i, '')}</span>
                        </li>
                      ))}
                    </ol>
                  </Card>
                </div>
              </>
            )}

            {/* How to Trade — only show if exists */}
            {patternDetail.howToTrade && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Crosshair className="h-5 w-5 text-bullish" />
                    {s('howToTrade')}
                  </h3>
                  <div className="grid gap-4">
                    <Card className="p-4 bg-gradient-to-br from-muted/50 to-transparent">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        {s('tradeSetup')}
                      </h4>
                      <p className="text-sm text-muted-foreground">{pc('tradeSetup', patternDetail.howToTrade.setup)}</p>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-to-br from-bullish/10 to-transparent border-bullish/30">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-bullish">
                        <TrendingUp className="h-4 w-4" />
                        {s('entryStrategy')}
                      </h4>
                      <p className="text-sm text-foreground">{pc('tradeEntry', patternDetail.howToTrade.entry)}</p>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-to-br from-bearish/10 to-transparent border-bearish/30">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-bearish">
                        <Shield className="h-4 w-4" />
                        {s('stopLossPlacement')}
                      </h4>
                      <p className="text-sm text-foreground">{pc('tradeStopLoss', patternDetail.howToTrade.stopLoss)}</p>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-primary">
                        <Target className="h-4 w-4" />
                        {s('profitTargets')}
                      </h4>
                      <ul className="space-y-2">
                        {translatedTradeTargets.map((target, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{target}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                        <BarChart3 className="h-4 w-4" />
                        {s('positionSizing')}
                      </h4>
                      <p className="text-sm text-foreground">{pc('positionSizing', patternDetail.howToTrade.positionSizing)}</p>
                    </Card>
                  </div>
                </div>
              </>
            )}

            {/* Real-World Examples */}
            {patternDetail.realWorldExamples && patternDetail.realWorldExamples.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-cyan-500" />
                    {s('realWorldExamples')}
                  </h3>
                  <Card className="p-4 bg-gradient-to-br from-cyan-500/5 to-transparent border-cyan-500/20">
                    <ul className="space-y-2">
                      {translatedRealWorldExamples.map((example, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                          <span className="text-foreground">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </>
            )}

            {/* Best Market Conditions */}
            {patternDetail.bestMarketConditions && patternDetail.bestMarketConditions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    {s('bestMarketConditions')}
                  </h3>
                  <Card className="p-4 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
                    <ul className="space-y-2">
                      {translatedBestConditions.map((condition, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{condition}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </>
            )}

            <Separator />

            {/* Pattern Formation */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {s('patternFormation')}
              </h3>
              <p className="text-sm leading-relaxed">{pc('formation', patternDetail.formation)}</p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm italic">{pc('psychology', patternDetail.psychology)}</p>
              </div>
            </div>

            <Separator />

            {/* Key Characteristics */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{s('keyCharacteristics')}</h3>
              <ul className="space-y-2">
                {translatedCharacteristics.map((char, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {char}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Target Price Methodologies */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                {s('targetPriceMethodologies')}
              </h3>
              <div className="bg-gradient-to-r from-primary/5 to-bullish/5 p-4 rounded-lg border-l-4 border-primary">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-primary mb-2">{s('primaryTargetMethod')}</h4>
                    <p className="text-sm font-medium">{pc('primaryTarget', patternDetail.targetPriceMethodologies.primary)}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-bullish mb-2">{s('alternativeTargetCalc')}</h4>
                    <ul className="space-y-2">
                      {translatedAltTargets.map((target, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {target}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">{s('riskRewardRatio')}</h5>
                      <p className="text-sm font-medium text-primary">{pc('riskReward', patternDetail.targetPriceMethodologies.riskReward)}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground">{s('patternSuccessRate')}</h5>
                      {stats && stats.totalDetections >= 20 ? (
                        <p className="text-sm font-medium text-bullish">{stats.winRate}% (n={stats.totalDetections.toLocaleString()})</p>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground italic">Data accumulating</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg">
                    <h5 className="text-sm font-medium mb-1">{s('calculationMethod')}</h5>
                    <p className="text-sm text-muted-foreground italic">{pc('calculation', patternDetail.targetPriceMethodologies.calculation)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Information — only show standalone entry/SL if no howToTrade (to avoid duplication) */}
            {!hasHowToTrade && (
              <>
                <Separator />
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {s('entryAndTargets')}
                    </h3>
                    <div className="space-y-3">
                      <div className="border-l-4 border-bullish pl-3">
                        <h4 className="font-medium text-sm text-bullish">{s('entrySignal')}</h4>
                        <p className="text-sm text-muted-foreground">{pc('entry', patternDetail.entry)}</p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <h4 className="font-medium text-sm">{s('targetMethodology')}</h4>
                        <p className="text-sm text-muted-foreground">{pc('targetMethodology', patternDetail.targetMethodology)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {s('riskManagement')}
                    </h3>
                    <div className="space-y-3">
                      <div className="border-l-4 border-bearish pl-3">
                        <h4 className="font-medium text-sm text-bearish">{s('stopLoss')}</h4>
                        <p className="text-sm text-muted-foreground">{pc('stopLoss', patternDetail.stopLoss)}</p>
                      </div>
                      <div className="border-l-4 border-primary pl-3">
                        <h4 className="font-medium text-sm">{s('confirmation')}</h4>
                        <p className="text-sm text-muted-foreground">{pc('confirmation', patternDetail.confirmation)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Volume Analysis */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                {s('volumeProfile')}
              </h3>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">{pc('volumeProfile', patternDetail.volumeProfile)}</p>
              </div>
            </div>

            <Separator />

            {/* Success Factors */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                {s('keySuccessFactors')}
              </h3>
              <ul className="space-y-2">
                {translatedKeyFactors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-bullish mt-2 flex-shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* Live setups CTA — after key success factors, before common mistakes */}
            {!isCandlestick && (
              <>
                <Separator />
                <PatternLiveSetupsCTA patternKey={patternKey} patternName={patternDetail.name} />
              </>
            )}

            <Separator />

            {/* Common Mistakes */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {s('commonMistakes')}
              </h3>
              <ul className="space-y-2">
                {translatedCommonMistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-bearish mt-2 flex-shrink-0" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>

            {patternDetail.additionalNotes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">{s('additionalNotes')}</h3>
                  <div className="bg-primary/10 p-3 rounded-lg border-l-4 border-primary">
                    <p className="text-sm">{pc('additionalNotes', patternDetail.additionalNotes)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
