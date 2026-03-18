import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Activity,
  FlaskConical,
  Bell,
  FileCode,
  BookOpen,
  Crown,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Scan,
  Bot,
  Wallet
} from "lucide-react";
import { Link } from "react-router-dom";

const FAQ = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("screener");

  // Scoped helpers
  const s = (key: string) => t(`faq.screener.${key}`);
  const pl = (key: string) => t(`faq.patternLab.${key}`);
  const al = (key: string) => t(`faq.alerts.${key}`);
  const sc = (key: string) => t(`faq.scripts.${key}`);
  const le = (key: string) => t(`faq.learning.${key}`);
  const ac = (key: string) => t(`faq.account.${key}`);
  const cp = (key: string) => t(`faq.copilot.${key}`, key);
  const ap = (key: string) => t(`faq.automation.${key}`, key);

  const faqData = {
    "screener": {
      title: t('faq.tabs.screener'),
      icon: <Activity className="h-5 w-5 text-amber-500" />,
      description: t('faq.tabs.screenerDesc'),
      sections: [
        {
          category: s('catMarkets'),
          questions: [
            {
              question: s('q_asianMarkets'),
              answer: (
                <div className="space-y-3">
                  <p dangerouslySetInnerHTML={{ __html: s('a_asianMarketsIntro') }} />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{s('a_apacStocks')}</h4>
                      <div className="text-xs space-y-1">
                        <div>• {s('a_hongKong')}</div>
                        <div>• {s('a_singapore')}</div>
                        <div>• {s('a_thailand')}</div>
                        <div>• {s('a_chinaAdrs')}</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{s('a_alsoCovered')}</h4>
                      <div className="text-xs space-y-1">
                        <div>• {s('a_apacFx')}</div>
                        <div>• {s('a_indices')}</div>
                        <div>• {s('a_apacEtfs')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: s('q_exchanges'),
              answer: (
                <div className="space-y-3">
                  <p>{s('a_exchangesIntro')}</p>
                  <div className="border rounded-lg p-4">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium mb-1">{s('a_americas')}</div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>{s('a_americasExchanges')}</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">{s('a_europe')}</div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>{s('a_europeExchanges')}</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">{s('a_asiaPacific')}</div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>{s('a_asiaPacificExchanges')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{s('a_exchangesPlus')}</p>
                </div>
              )
            },
            {
              question: s('q_apacData'),
              answer: (
                <div className="space-y-3">
                  <p dangerouslySetInnerHTML={{ __html: s('a_apacDataIntro') }} />
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p>{s('a_apacDataSource')}</p>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: s('catGettingStarted'),
          questions: [
            {
              question: s('q_whatIsScreener'),
              answer: (
                <div className="space-y-3">
                  <p>{s('a_screenerIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{s('a_keyFeatures')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {s('a_feature1')}</li>
                      <li>• {s('a_feature2')}</li>
                      <li>• {s('a_feature3')}</li>
                      <li>• {s('a_feature4')}</li>
                      <li>• {s('a_feature5')}</li>
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: s('a_screenerAccess') }} />
                </div>
              )
            },
            {
              question: s('q_filterPatterns'),
              answer: (
                <div className="space-y-3">
                  <p>{s('a_filterIntro')}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{s('a_assetFilters')}</h4>
                      <div className="text-xs space-y-1">
                        <div>• {s('a_assetStocks')}</div>
                        <div>• {s('a_assetForex')}</div>
                        <div>• {s('a_assetCrypto')}</div>
                        <div>• {s('a_assetCommodities')}</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{s('a_patternFilters')}</h4>
                      <div className="text-xs space-y-1">
                        <div>• {s('a_filterTimeframe')}</div>
                        <div>• {s('a_filterDirection')}</div>
                        <div>• {s('a_filterQuality')}</div>
                        <div>• {s('a_filterType')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: s('q_qualityGrades'),
              answer: (
                <div className="space-y-4">
                  <p>{s('a_qualityIntro')}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-bullish text-white">A</Badge>
                      <div>
                        <strong>{s('a_gradeA')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_gradeADesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="secondary">B</Badge>
                      <div>
                        <strong>{s('a_gradeB')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_gradeBDesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">C</Badge>
                      <div>
                        <strong>{s('a_gradeC')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_gradeCDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: s('catMethodology'),
          questions: [
            {
              question: s('q_methodology'),
              answer: (
                <div className="space-y-4">
                  <p dangerouslySetInnerHTML={{ __html: s('a_methodologyIntro') }} />
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Scan className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{s('a_layer1Title')}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{s('a_layer1Desc')}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{s('a_layer2Title')}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{s('a_layer2Desc')}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{s('a_layer3Title')}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{s('a_layer3Desc')}</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm" dangerouslySetInnerHTML={{ __html: s('a_methodologyResult') }} />
                </div>
              )
            },
            {
              question: s('q_patternDefinitions'),
              answer: (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{s('a_patternDefsIntro')}</p>
                  
                  {/* Bearish Reversal Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      {s('a_bearishReversal')}
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_doubleTop')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_doubleTopDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_tripleTop')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_tripleTopDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_headShoulders')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_headShouldersDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_risingWedge')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_risingWedgeDesc')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bullish Reversal Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      {s('a_bullishReversal')}
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_doubleBottom')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_doubleBottomDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_tripleBottom')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_tripleBottomDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_inverseHS')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_inverseHSDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_fallingWedge')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_fallingWedgeDesc')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Continuation Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                      {s('a_continuationPatterns')}
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_bullFlag')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_bullFlagDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_bearFlag')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_bearFlagDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_cupHandle')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_cupHandleDesc')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Triangle Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      {s('a_trianglePatterns')}
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_ascTriangle')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_ascTriangleDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_descTriangle')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_descTriangleDesc')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Momentum Breakouts */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-primary" />
                      {s('a_momentumBreakout')}
                    </h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_donchianLong')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_donchianLongDesc')}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="font-medium text-sm">{s('a_donchianShort')}</div>
                        <p className="text-xs text-muted-foreground mt-1">{s('a_donchianShortDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: s('q_qualityScoring'),
              answer: (
                <div className="space-y-4">
                  <p dangerouslySetInnerHTML={{ __html: s('a_qualityScoringIntro') }} />
                  <div className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium">{s('a_structuralFactors')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_priorTrend')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_structuralSymmetry')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_priceActionQuality')}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{s('a_volumeVolatility')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_volumeConfirmation')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_relativeVolume')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_volatilityRegime')}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{s('a_contextFactors')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_adxTrend')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_historicalWinRate')}</div>
                        <div className="text-xs text-muted-foreground">• {s('a_patternSymmetry')}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                      <Badge className="bg-emerald-600 text-white min-w-8 justify-center">A</Badge>
                      <span className="text-sm">{s('a_scoreA')}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                      <Badge className="bg-sky-600 text-white min-w-8 justify-center">B</Badge>
                      <span className="text-sm">{s('a_scoreB')}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                      <Badge variant="secondary" className="min-w-8 justify-center">C</Badge>
                      <span className="text-sm">{s('a_scoreC')}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 border rounded-lg">
                      <Badge variant="outline" className="min-w-8 justify-center">D–F</Badge>
                      <span className="text-sm">{s('a_scoreDF')}</span>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: s('q_repeatabilityGate'),
              answer: (
                <div className="space-y-4">
                  <p dangerouslySetInnerHTML={{ __html: s('a_repeatabilityIntro') }} />
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge className="bg-emerald-600 text-white min-w-8 justify-center mt-0.5">A</Badge>
                      <div>
                        <strong className="text-sm">{s('a_repeatA')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_repeatADesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge className="bg-sky-600 text-white min-w-8 justify-center mt-0.5">B</Badge>
                      <div>
                        <strong className="text-sm">{s('a_repeatB')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_repeatBDesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant="secondary" className="min-w-8 justify-center mt-0.5">C</Badge>
                      <div>
                        <strong className="text-sm">{s('a_repeatC')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_repeatCDesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant="outline" className="min-w-8 justify-center mt-0.5">D</Badge>
                      <div>
                        <strong className="text-sm">{s('a_repeatD')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_repeatDDesc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm" dangerouslySetInnerHTML={{ __html: s('a_repeatabilityNote') }} />
                </div>
              )
            },
            {
              question: s('q_dataPoorFallback'),
              answer: (
                <div className="space-y-4">
                  <p dangerouslySetInnerHTML={{ __html: s('a_dataPoorIntro') }} />
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant="outline" className="min-w-6 justify-center mt-0.5">1</Badge>
                      <div>
                        <strong className="text-sm">{s('a_fallback1Title')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_fallback1Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant="outline" className="min-w-6 justify-center mt-0.5">2</Badge>
                      <div>
                        <strong className="text-sm">{s('a_fallback2Title')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_fallback2Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant="outline" className="min-w-6 justify-center mt-0.5">3</Badge>
                      <div>
                        <strong className="text-sm">{s('a_fallback3Title')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_fallback3Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant="outline" className="min-w-6 justify-center mt-0.5">4</Badge>
                      <div>
                        <strong className="text-sm">{s('a_fallback4Title')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_fallback4Desc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm" dangerouslySetInnerHTML={{ __html: s('a_dataPoorNote') }} />
                </div>
              )
            },
            {
              question: s('q_validationPipeline'),
              answer: (
                <div className="space-y-4">
                  <p>{s('a_validationIntro')}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Scan className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <strong className="text-sm">{s('a_valLayer1Title')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_valLayer1Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <strong className="text-sm">{s('a_valLayer2Title')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_valLayer2Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Layers className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <strong className="text-sm">{s('a_valLayer3Title')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_valLayer3Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <div>
                        <strong className="text-sm">{s('a_fullyConfirmed')}</strong>
                        <p className="text-xs text-muted-foreground">{s('a_fullyConfirmedDesc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p>{s('a_validationResult')}</p>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: s('catEvaluation'),
          questions: [
            {
              question: s('q_evaluation'),
              answer: (
                <div className="space-y-4">
                  <p dangerouslySetInnerHTML={{ __html: s('a_evaluationIntro') }} />
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{s('a_eval1Title')}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{s('a_eval1Desc')}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <h4 className="font-semibold">{s('a_eval2Title')}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{s('a_eval2Desc')}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{s('a_eval3Title')}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{s('a_eval3Desc')}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{s('a_eval4Title')}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{s('a_eval4Desc')}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <h4 className="font-semibold">{s('a_eval5Title')}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{s('a_eval5Desc')}</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm" dangerouslySetInnerHTML={{ __html: s('a_evaluationNote') }} />
                </div>
              )
            },
            {
              question: s('q_knownLimitations'),
              answer: (
                <div className="space-y-4">
                  <p>{s('a_limitationsIntro')}</p>
                  <div className="space-y-2">
                    <div className="border rounded-lg p-3">
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: s('a_limit1') }} />
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: s('a_limit2') }} />
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: s('a_limit3') }} />
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: s('a_limit4') }} />
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: t('faq.screener.catTransparency', 'Performance Transparency'),
          questions: [
            {
              question: t('faq.screener.q_whyMostPatternsLose', 'Why do most patterns show negative returns at 2:1 R:R?'),
              answer: (
                <div className="space-y-4">
                  <p>{t('faq.screener.a_whyLoseIntro', 'Pattern detection identifies structural formations — it does not guarantee profitable outcomes. At a fixed 2:1 risk-reward ratio, the baseline win rate required to break even is 33.3%. Our data across 484,000+ historical detections shows that most patterns fall slightly below this threshold.')}</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{t('faq.screener.a_whyLoseTitle', 'Historical Win Rates at 2:1 R:R (484K+ samples)')}</h4>
                    <div className="text-sm space-y-1">
                      <div>• {t('faq.screener.a_whyLoseBullish', 'Bullish patterns (Falling Wedge, Double Bottom, Inverse H&S): 35–38% win rate')}</div>
                      <div>• {t('faq.screener.a_whyLoseBearish', 'Bearish patterns (Rising Wedge, Double Top, H&S): 22–24% win rate')}</div>
                      <div>• {t('faq.screener.a_whyLoseBreakeven', 'Breakeven threshold at 2:1 R:R: 33.3%')}</div>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p><strong>{t('faq.screener.a_whyLoseKey', 'Key insight:')}</strong> {t('faq.screener.a_whyLoseKeyDesc', "The platform's value is not in guaranteeing every signal wins — it's in filtering the universe of possible trades to the statistically strongest setups, and providing the tools (Pattern Lab, Edge Atlas) to identify which specific pattern×instrument×timeframe combinations have positive expectancy.")}</p>
                  </div>
                </div>
              )
            },
            {
              question: t('faq.screener.q_whatGradesMean', 'What do quality grades actually mean?'),
              answer: (
                <div className="space-y-4">
                  <p>{t('faq.screener.a_gradesMeanIntro', 'Grades reflect structural quality — how well-formed a pattern is based on 9 technical factors. They measure detection confidence, not trade outcome probability.')}</p>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{t('faq.screener.a_gradesMeanDims', 'Two Independent Dimensions')}</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">{t('faq.screener.a_detectionQuality', 'Detection Quality (Grades)')}</div>
                          <div className="text-xs text-muted-foreground">{t('faq.screener.a_detectionQualityDesc', '"Is this a well-formed pattern?" Evaluates trend alignment, symmetry, volume, ADX, and structure.')}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">{t('faq.screener.a_edgeQuality', 'Edge Quality (Edge Atlas)')}</div>
                          <div className="text-xs text-muted-foreground">{t('faq.screener.a_edgeQualityDesc', '"Does this pattern×instrument×timeframe actually make money?" Based on historical outcome data with sample sizes.')}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm">
                      <p><strong>{t('faq.screener.a_gradesCaveat', 'Important:')}</strong> {t('faq.screener.a_gradesCaveatDesc', 'A well-formed pattern on a low-edge instrument is still a poor trade. Always check the Edge Atlas or Pattern Lab to validate the statistical edge before acting on any signal, regardless of its grade.')}</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: t('faq.screener.q_howToReadStats', 'How should I read win rates and sample sizes?'),
              answer: (
                <div className="space-y-4">
                  <p>{t('faq.screener.a_readStatsIntro', 'Every win rate shown on the platform is accompanied by a sample size (n=X). This is critical context that most trading platforms omit.')}</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{t('faq.screener.a_readStatsSample', 'Sample Size Confidence Levels')}</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">n &lt; 30</Badge>
                        <span className="text-muted-foreground text-xs">{t('faq.screener.a_sampleLow', 'Low confidence — treat as directional indicator only')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">n = 30–100</Badge>
                        <span className="text-muted-foreground text-xs">{t('faq.screener.a_sampleMedium', 'Moderate confidence — patterns are emerging')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground text-xs">n &gt; 100</Badge>
                        <span className="text-muted-foreground text-xs">{t('faq.screener.a_sampleHigh', 'High confidence — statistically meaningful')}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('faq.screener.a_readStatsNote', 'Win rates without sample sizes are misleading. A "70% win rate" based on 10 trades is far less reliable than a "35% win rate" based on 5,000 trades. We always show both numbers so you can make informed decisions.')}</p>
                </div>
              )
            }
          ]
        }
      ]
    },
    "pattern-lab": {
      title: t('faq.tabs.patternLab'),
      icon: <FlaskConical className="h-5 w-5 text-violet-500" />,
      description: t('faq.tabs.patternLabDesc'),
      sections: [
        {
          category: pl('catResearch'),
          questions: [
            {
              question: pl('q_whatIsPatternLab'),
              answer: (
                <div className="space-y-3">
                  <p>{pl('a_patternLabIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{pl('a_capabilities')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {pl('a_cap1')}</li>
                      <li>• {pl('a_cap2')}</li>
                      <li>• {pl('a_cap3')}</li>
                      <li>• {pl('a_cap4')}</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: pl('q_credits'),
              answer: (
                <div className="space-y-3">
                  <p>{pl('a_creditsIntro')}</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{pl('a_factors')}</h4>
                    <div className="text-sm space-y-1">
                      <div>• {pl('a_factor1')}</div>
                      <div>• {pl('a_factor2')}</div>
                      <div>• {pl('a_factor3')}</div>
                      <div>• {pl('a_factor4')}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{pl('a_creditsNote')}</p>
                </div>
              )
            },
            {
              question: pl('q_reliability'),
              answer: (
                <div className="space-y-4">
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">{pl('a_disclaimerTitle')}</h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">{pl('a_disclaimerText')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{pl('a_methodology')}</h4>
                    <div className="text-sm space-y-1">
                      <div>• {pl('a_method1')}</div>
                      <div>• {pl('a_method2')}</div>
                      <div>• {pl('a_method3')}</div>
                      <div>• {pl('a_method4')}</div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "alerts": {
      title: t('faq.tabs.alerts'),
      icon: <Bell className="h-5 w-5 text-emerald-500" />,
      description: t('faq.tabs.alertsDesc'),
      sections: [
        {
          category: al('catAlertSystem'),
          questions: [
            {
              question: al('q_howAlerts'),
              answer: (
                <div className="space-y-3">
                  <p>{al('a_alertsIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{al('a_alertContents')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {al('a_alert1')}</li>
                      <li>• {al('a_alert2')}</li>
                      <li>• {al('a_alert3')}</li>
                      <li>• {al('a_alert4')}</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: al('q_alertLimits'),
              answer: (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{al('a_alertLimitsTitle')}</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between"><span>{al('a_free')}</span><span>{al('a_freeAlerts')}</span></div>
                      <div className="flex justify-between"><span>{al('a_starter')}</span><span>{al('a_starterAlerts')}</span></div>
                      <div className="flex justify-between"><span>{al('a_pro')}</span><span>{al('a_proAlerts')}</span></div>
                      <div className="flex justify-between"><span>{al('a_proPlus')}</span><span>{al('a_proPlusAlerts')}</span></div>
                      <div className="flex justify-between"><span>{al('a_elite')}</span><span>{al('a_eliteAlerts')}</span></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{al('a_alertDelivery')}</p>
                </div>
              )
            }
          ]
        }
      ]
    },
    "scripts": {
      title: t('faq.tabs.scripts'),
      icon: <FileCode className="h-5 w-5 text-cyan-500" />,
      description: t('faq.tabs.scriptsDesc'),
      sections: [
        {
          category: sc('catScriptExport'),
          questions: [
            {
              question: sc('q_platforms'),
              answer: (
                <div className="space-y-4">
                  <p>{sc('a_platformsIntro')}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{sc('a_pineScript')}</div>
                        <div className="text-xs text-muted-foreground">{sc('a_allPlans')}</div>
                      </div>
                      <Badge variant="default">{sc('a_allPlans')}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{sc('a_mql4')}</div>
                        <div className="text-xs text-muted-foreground">{sc('a_expertAdvisors')}</div>
                      </div>
                      <Badge variant="secondary">Pro+</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{sc('a_mql5')}</div>
                        <div className="text-xs text-muted-foreground">{sc('a_advancedEAs')}</div>
                      </div>
                      <Badge className="bg-purple-600">Elite</Badge>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: sc('q_scriptContents'),
              answer: (
                <div className="space-y-3">
                  <p>{sc('a_scriptContentsIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{sc('a_scriptContentsTitle')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {sc('a_script1')}</li>
                      <li>• {sc('a_script2')}</li>
                      <li>• {sc('a_script3')}</li>
                      <li>• {sc('a_script4')}</li>
                      <li>• {sc('a_script5')}</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: sc('q_deployScript'),
              answer: (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{sc('a_deploySteps')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">1</Badge>
                        <span>{sc('a_deploy1')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">2</Badge>
                        <span>{sc('a_deploy2')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">3</Badge>
                        <span>{sc('a_deploy3')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">4</Badge>
                        <span>{sc('a_deploy4')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">5</Badge>
                        <span>{sc('a_deploy5')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "learning": {
      title: t('faq.tabs.learning'),
      icon: <BookOpen className="h-5 w-5 text-purple-500" />,
      description: t('faq.tabs.learningDesc'),
      sections: [
        {
          category: le('catEducational'),
          questions: [
            {
              question: le('q_patternLibrary'),
              answer: (
                <div className="space-y-3">
                  <p>{le('a_patternLibIntro')}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{le('a_patternCategories')}</h4>
                      <div className="text-xs space-y-1">
                        <div>• {le('a_cat1')}</div>
                        <div>• {le('a_cat2')}</div>
                        <div>• {le('a_cat3')}</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{le('a_eachPatternIncludes')}</h4>
                      <div className="text-xs space-y-1">
                        <div>• {le('a_inc1')}</div>
                        <div>• {le('a_inc2')}</div>
                        <div>• {le('a_inc3')}</div>
                        <div>• {le('a_inc4')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: le('q_patternQuiz'),
              answer: (
                <div className="space-y-3">
                  <p>{le('a_quizIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{le('a_quizFeatures')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {le('a_quiz1')}</li>
                      <li>• {le('a_quiz2')}</li>
                      <li>• {le('a_quiz3')}</li>
                      <li>• {le('a_quiz4')}</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: le('q_successRates'),
              answer: (
                <div className="space-y-4">
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">{le('a_importantNote')}</h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm">{le('a_successRatesDisclaimer')}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{le('a_successRatesAdvice')}</p>
                </div>
              )
            }
          ]
        }
      ]
    },
    "account": {
      title: t('faq.tabs.account'),
      icon: <Crown className="h-5 w-5 text-yellow-500" />,
      description: t('faq.tabs.accountDesc'),
      sections: [
        {
          category: ac('catSubscription'),
          questions: [
            {
              question: ac('q_tiers'),
              answer: (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">FREE</Badge>
                        <span className="font-semibold">{ac('a_freeLabel')}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{ac('a_freeDesc')}</div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">STARTER</Badge>
                        <span className="font-semibold">{ac('a_starterLabel')}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{ac('a_starterDesc')}</div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>PRO</Badge>
                        <span className="font-semibold">{ac('a_proLabel')}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{ac('a_proDesc')}</div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-600">ELITE</Badge>
                        <span className="font-semibold">{ac('a_eliteLabel')}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{ac('a_eliteDesc')}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <Link to="/projects/pricing" className="text-primary underline">{ac('a_viewPricing')}</Link>
                  </p>
                </div>
              )
            },
            {
              question: ac('q_refund'),
              answer: (
                <div className="space-y-2 text-muted-foreground">
                  <p>{ac('a_refund1')}</p>
                  <p>{ac('a_refund2')}</p>
                  <p className="font-medium text-foreground">{ac('a_refund3')}</p>
                </div>
              )
            },
            {
              question: ac('q_payment'),
              answer: (
                <div className="space-y-2 text-muted-foreground">
                  <p>{ac('a_paymentIntro')}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{ac('a_payment1')}</li>
                    <li>{ac('a_payment2')}</li>
                    <li>{ac('a_payment3')}</li>
                  </ul>
                </div>
              )
            },
            {
              question: ac('q_upgrades'),
              answer: (
                <div className="text-muted-foreground">
                  <p>{ac('a_upgradesDesc')}</p>
                </div>
              )
            }
          ]
        }
      ]
    },
    "copilot": {
      title: t('faq.tabs.copilot', 'Trading Copilot'),
      icon: <Bot className="h-5 w-5 text-primary" />,
      description: t('faq.tabs.copilotDesc', 'AI-powered assistant that connects all platform data for instant analysis'),
      sections: [
        {
          category: cp('catHowItWorks'),
          questions: [
            {
              question: cp('q_whatIsCopilot'),
              answer: (
                <div className="space-y-3">
                  <p>{cp('a_whatIsCopilotIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{cp('a_keyCapabilities')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {cp('a_cap1')}</li>
                      <li>• {cp('a_cap2')}</li>
                      <li>• {cp('a_cap3')}</li>
                      <li>• {cp('a_cap4')}</li>
                      <li>• {cp('a_cap5')}</li>
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground">{cp('a_howToOpen')}</p>
                </div>
              )
            },
            {
              question: cp('q_whatDataAccess'),
              answer: (
                <div className="space-y-4">
                  <p>{cp('a_dataAccessIntro')}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{cp('a_marketData')}</h4>
                      <div className="text-xs space-y-1">
                        <div>• {cp('a_livePatterns')}</div>
                        <div>• {cp('a_edgeAtlas')}</div>
                        <div>• {cp('a_marketBreadth')}</div>
                        <div>• {cp('a_economicCalendar')}</div>
                        <div>• {cp('a_marketReports')}</div>
                        <div>• {cp('a_priceData')}</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold text-sm mb-2">{cp('a_personalData')}</h4>
                      <div className="text-xs space-y-1">
                        <div>• {cp('a_userBacktests')}</div>
                        <div>• {cp('a_userAlerts')}</div>
                        <div>• {cp('a_paperPortfolio')}</div>
                        <div>• {cp('a_chartContext')}</div>
                        <div>• {cp('a_watchlist')}</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{cp('a_dataAccessNote')}</p>
                </div>
              )
            },
            {
              question: cp('q_combinedAnalysis'),
              answer: (
                <div className="space-y-4">
                  <p>{cp('a_combinedIntro')}</p>
                  <div className="space-y-2">
                    <div className="border rounded-lg p-3">
                      <p className="text-sm"><strong>{cp('a_exampleMarket')}</strong></p>
                      <p className="text-xs text-muted-foreground">{cp('a_exampleMarketDesc')}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-sm"><strong>{cp('a_exampleInstrument')}</strong></p>
                      <p className="text-xs text-muted-foreground">{cp('a_exampleInstrumentDesc')}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-sm"><strong>{cp('a_examplePortfolio')}</strong></p>
                      <p className="text-xs text-muted-foreground">{cp('a_examplePortfolioDesc')}</p>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: cp('catDifference'),
          questions: [
            {
              question: cp('q_vsChatGPT'),
              answer: (
                <div className="space-y-4">
                  <p>{cp('a_vsChatGPTIntro')}</p>
                  <div className="border rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2"><Bot className="h-4 w-4 text-primary" />{cp('a_copilotColumn')}</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>✓ {cp('a_copilotAdv1')}</div>
                          <div>✓ {cp('a_copilotAdv2')}</div>
                          <div>✓ {cp('a_copilotAdv3')}</div>
                          <div>✓ {cp('a_copilotAdv4')}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-muted-foreground">{cp('a_genericColumn')}</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>✗ {cp('a_genericDis1')}</div>
                          <div>✗ {cp('a_genericDis2')}</div>
                          <div>✗ {cp('a_genericDis3')}</div>
                          <div>✗ {cp('a_genericDis4')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: cp('q_pineScript'),
              answer: (
                <div className="space-y-3">
                  <p>{cp('a_pineScriptIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p>{cp('a_pineScriptExample')}</p>
                  </div>
                </div>
              )
            }
          ]
        },
        {
          category: cp('catPrivacy'),
          questions: [
            {
              question: cp('q_dataPrivacy'),
              answer: (
                <div className="space-y-3">
                  <p>{cp('a_privacyIntro')}</p>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm space-y-2">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{cp('a_privacy1')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{cp('a_privacy2')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{cp('a_privacy3')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              question: cp('q_availability'),
              answer: (
                <div className="space-y-3">
                  <p>{cp('a_availabilityIntro')}</p>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between"><span>{cp('a_freeTier')}</span><span>{cp('a_freeLimit')}</span></div>
                      <div className="flex justify-between"><span>{cp('a_starterTier')}</span><span>{cp('a_starterLimit')}</span></div>
                      <div className="flex justify-between"><span>{cp('a_proTier')}</span><span>{cp('a_proLimit')}</span></div>
                      <div className="flex justify-between"><span>{cp('a_eliteTier')}</span><span>{cp('a_eliteLimit')}</span></div>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    "automation": {
      title: t('faq.tabs.automation', 'Automation'),
      icon: <Wallet className="h-5 w-5 text-orange-500" />,
      description: t('faq.tabs.automationDesc', 'Auto Paper Trading, Signal Webhooks, and trade execution automation'),
      sections: [
        {
          category: ap('catAutoPaper'),
          questions: [
            {
              question: ap('q_whatIsAutoPaper'),
              answer: (
                <div className="space-y-3">
                  <p>{ap('a_whatIsAutoPaperIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{ap('a_howItWorksTitle')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">1</Badge>
                        <span>{ap('a_step1')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">2</Badge>
                        <span>{ap('a_step2')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">3</Badge>
                        <span>{ap('a_step3')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">4</Badge>
                        <span>{ap('a_step4')}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">5</Badge>
                        <span>{ap('a_step5')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-l-4 border-primary p-3 bg-muted/30 text-sm">
                    <p><strong>{ap('a_noRealMoney')}</strong> {ap('a_noRealMoneyDesc')}</p>
                  </div>
                </div>
              )
            },
            {
              question: ap('q_howToEnable'),
              answer: (
                <div className="space-y-3">
                  <p>{ap('a_howToEnableIntro')}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">1</Badge>
                      <span>{ap('a_enable1')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">2</Badge>
                      <span>{ap('a_enable2')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">3</Badge>
                      <span>{ap('a_enable3')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">4</Badge>
                      <span>{ap('a_enable4')}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{ap('a_enableNote')}</p>
                </div>
              )
            },
            {
              question: ap('q_positionSizing'),
              answer: (
                <div className="space-y-3">
                  <p>{ap('a_positionSizingIntro')}</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{ap('a_sizingFormula')}</h4>
                    <div className="bg-muted p-3 rounded font-mono text-xs">
                      {ap('a_formula')}
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>• {ap('a_sizing1')}</div>
                    <div>• {ap('a_sizing2')}</div>
                    <div>• {ap('a_sizing3')}</div>
                  </div>
                </div>
              )
            },
            {
              question: ap('q_whereToTrack'),
              answer: (
                <div className="space-y-3">
                  <p>{ap('a_whereToTrackIntro')}</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">{ap('a_panelFeatures')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {ap('a_track1')}</li>
                      <li>• {ap('a_track2')}</li>
                      <li>• {ap('a_track3')}</li>
                      <li>• {ap('a_track4')}</li>
                    </ul>
                  </div>
                </div>
              )
            },
            {
              question: ap('q_duplicateTrades'),
              answer: (
                <div className="space-y-2 text-muted-foreground">
                  <p>{ap('a_duplicateTradesDesc')}</p>
                </div>
              )
            }
          ]
        },
        {
          category: ap('catWebhook'),
          questions: [
            {
              question: ap('q_whatIsWebhook'),
              answer: (
                <div className="space-y-3">
                  <p>{ap('a_webhookIntro')}</p>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{ap('a_webhookPayload')}</h4>
                    <div className="text-sm space-y-1">
                      <div>• {ap('a_payload1')}</div>
                      <div>• {ap('a_payload2')}</div>
                      <div>• {ap('a_payload3')}</div>
                      <div>• {ap('a_payload4')}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{ap('a_webhookSecurity')}</p>
                </div>
              )
            },
            {
              question: ap('q_webhookSetup'),
              answer: (
                <div className="space-y-3">
                  <p>{ap('a_webhookSetupIntro')}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">1</Badge>
                      <span>{ap('a_setup1')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">2</Badge>
                      <span>{ap('a_setup2')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">3</Badge>
                      <span>{ap('a_setup3')}</span>
                    </div>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    }
  };

  const filteredSections = (sections: any[]) => {
    if (!searchTerm) return sections;
    
    return sections.map(section => ({
      ...section,
      questions: section.questions.filter((q: any) =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof q.answer === 'string' ? q.answer.toLowerCase().includes(searchTerm.toLowerCase()) : false)
      )
    })).filter(section => section.questions.length > 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {t('common.backToHome')}
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">{t('faq.title')}</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('faq.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-8">
            {Object.entries(faqData).map(([key, data]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                {data.icon}
                <span className="hidden sm:inline">{data.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(faqData).map(([key, data]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {data.icon}
                      <div>
                        <CardTitle>{data.title}</CardTitle>
                        <CardDescription>{data.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              <div className="space-y-8">
                {filteredSections(data.sections).map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <div className="w-1 h-8 bg-primary rounded-full"></div>
                      {section.category}
                    </h2>
                    
                    <div className="space-y-4">
                      {section.questions.map((qa: any, qaIndex: number) => (
                        <Collapsible key={qaIndex}>
                          <CollapsibleTrigger asChild>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-left text-card-foreground">{qa.question}</h3>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </CardHeader>
                            </Card>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <Card className="mt-2 border-l-4 border-l-primary">
                              <CardContent className="pt-6">
                                {typeof qa.answer === 'string' ? <p>{qa.answer}</p> : qa.answer}
                              </CardContent>
                            </Card>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredSections(data.sections).length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">{t('faq.noResults')}</h3>
                  <p className="text-muted-foreground">{t('faq.noResultsHint')}</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Contact Section */}
        <div className="mt-16 pt-8 border-t">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">{t('faq.stillNeedHelp')}</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {t('faq.stillNeedHelpDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link to="/projects/pricing">
                    <Crown className="h-4 w-4 mr-2" />
                    {t('faq.viewPlansSupport')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
