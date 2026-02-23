import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Target, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticleSection, TradingRule, PatternChecklist } from "@/components/blog/ArticleSection";
import { useTranslation } from "react-i18next";

const GapTradingStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.gapTrading.${key}`);
  const sc = (key: string) => t(`strategies.common.${key}`);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {sc('backToLearningCenter')}
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{s('badgeStrategies')}</Badge>
            <Badge variant="secondary">{s('badgeLevel')}</Badge>
            <Badge className="bg-orange-500/20 text-orange-400">{s('badgeIntraday')}</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">{s('title')}</h1>
          <p className="text-xl text-muted-foreground mb-4">{s('subtitle')}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {s('readTime')}</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> {s('winRateLabel')}</span>
            <span className="flex items-center gap-1"><Target className="h-4 w-4" /> {s('rrLabel')}</span>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{s('winRate')}</div>
              <div className="text-sm text-muted-foreground">{s('winRateKey')}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{s('avgRR')}</div>
              <div className="text-sm text-muted-foreground">{s('avgRRKey')}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{s('bestTime')}</div>
              <div className="text-sm text-muted-foreground">{s('bestTimeKey')}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{s('frequency')}</div>
              <div className="text-sm text-muted-foreground">{s('frequencyKey')}</div>
            </CardContent>
          </Card>
        </div>

        <div className="prose prose-invert max-w-none">
          <ArticleSection title={s('whatIsTitle')}>
            <p>{s('whatIsP')}</p>
            <ul>
              <li><strong>{s('gapUp')}</strong> {s('gapUpDesc')}</li>
              <li><strong>{s('gapDown')}</strong> {s('gapDownDesc')}</li>
              <li><strong>{s('fullGap')}</strong> {s('fullGapDesc')}</li>
              <li><strong>{s('partialGap')}</strong> {s('partialGapDesc')}</li>
            </ul>
          </ArticleSection>

          <ArticleSection title={s('typesTitle')}>
            <p>{s('typesP')}</p>
            <ul>
              <li><strong>{s('commonGaps')}</strong> {s('commonGapsDesc')}</li>
              <li><strong>{s('breakawayGaps')}</strong> {s('breakawayGapsDesc')}</li>
              <li><strong>{s('runawayGaps')}</strong> {s('runawayGapsDesc')}</li>
              <li><strong>{s('exhaustionGaps')}</strong> {s('exhaustionGapsDesc')}</li>
            </ul>
          </ArticleSection>

          <ArticleSection title={s('fillTitle')}>
            <p>{s('fillP')}</p>
            <TradingRule type="entry" title={s('fillLongTitle')}>
              <ul>
                <li>{s('fillLongItem1')}</li>
                <li>{s('fillLongItem2')}</li>
                <li>{s('fillLongItem3')}</li>
                <li>{s('fillLongItem4')}</li>
                <li>{s('fillLongItem5')}</li>
              </ul>
            </TradingRule>
            <TradingRule type="entry" title={s('fillShortTitle')}>
              <ul>
                <li>{s('fillShortItem1')}</li>
                <li>{s('fillShortItem2')}</li>
                <li>{s('fillShortItem3')}</li>
                <li>{s('fillShortItem4')}</li>
                <li>{s('fillShortItem5')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('gapGoTitle')}>
            <p>{s('gapGoP')}</p>
            <TradingRule type="entry" title={s('gapGoEntryTitle')}>
              <ul>
                <li>{s('gapGoItem1')}</li>
                <li>{s('gapGoItem2')}</li>
                <li>{s('gapGoItem3')}</li>
                <li>{s('gapGoItem4')}</li>
                <li>{s('gapGoItem5')}</li>
                <li>{s('gapGoItem6')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('orbTitle')}>
            <p>{s('orbP')}</p>
            <TradingRule type="entry" title={s('orbEntryTitle')}>
              <ul>
                <li>{s('orbItem1')}</li>
                <li><strong>{s('orbItem2')}</strong> {s('orbItem2Desc')}</li>
                <li><strong>{s('orbItem3')}</strong> {s('orbItem3Desc')}</li>
                <li><strong>{s('orbItem4')}</strong> {s('orbItem4Desc')}</li>
                <li><strong>{s('orbItem5')}</strong> {s('orbItem5Desc')}</li>
                <li>{s('orbItem6')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('stopTitle')}>
            <TradingRule type="stop" title={s('stopRulesTitle')}>
              <ul>
                <li><strong>{s('stopFill')}</strong> {s('stopFillDesc')}</li>
                <li><strong>{s('stopGo')}</strong> {s('stopGoDesc')}</li>
                <li><strong>{s('stopORB')}</strong> {s('stopORBDesc')}</li>
                <li>{s('stopMax')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('tpTitle')}>
            <TradingRule type="target" title={s('tpRulesTitle')}>
              <ul>
                <li><strong>{s('tpFill')}</strong> {s('tpFillDesc')}</li>
                <li><strong>{s('tpGo1')}</strong> {s('tpGo1Desc')}</li>
                <li><strong>{s('tpGo2')}</strong> {s('tpGo2Desc')}</li>
                <li><strong>{s('tpORB')}</strong> {s('tpORBDesc')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('filtersTitle')}>
            <p>{s('filtersP')}</p>
            <ul>
              <li><strong>{s('filterSize')}</strong> {s('filterSizeDesc')}</li>
              <li><strong>{s('filterVolume')}</strong> {s('filterVolumeDesc')}</li>
              <li><strong>{s('filterCatalyst')}</strong> {s('filterCatalystDesc')}</li>
              <li><strong>{s('filterTrend')}</strong> {s('filterTrendDesc')}</li>
              <li><strong>{s('filterSR')}</strong> {s('filterSRDesc')}</li>
            </ul>
          </ArticleSection>

          <ArticleSection title={s('checklistTitle')}>
            <PatternChecklist
              title={s('checklistHeader')}
              items={[
                { text: s('checkItem1'), critical: true },
                { text: s('checkItem2'), critical: true },
                { text: s('checkItem3'), critical: true },
                { text: s('checkItem4'), critical: false },
                { text: s('checkItem5'), critical: false },
                { text: s('checkItem6'), critical: false },
              ]}
            />
          </ArticleSection>

          <ArticleSection title={s('preMarketTitle')}>
            <p>{s('preMarketP')}</p>
            <ol>
              <li><strong>{s('preItem1')}</strong> {s('preItem1Desc')}</li>
              <li><strong>{s('preItem2')}</strong> {s('preItem2Desc')}</li>
              <li><strong>{s('preItem3')}</strong> {s('preItem3Desc')}</li>
              <li><strong>{s('preItem4')}</strong> {s('preItem4Desc')}</li>
              <li><strong>{s('preItem5')}</strong> {s('preItem5Desc')}</li>
            </ol>
          </ArticleSection>

          <ArticleSection title={s('mistakesTitle')}>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-semibold text-red-400">{s('mistakesLabel')}</span>
              </div>
              <ul className="mb-0">
                <li>{s('mistake1')}</li>
                <li>{s('mistake2')}</li>
                <li>{s('mistake3')}</li>
                <li>{s('mistake4')}</li>
                <li>{s('mistake5')}</li>
              </ul>
            </div>
          </ArticleSection>

          <ArticleSection title={s('bestMarketsTitle')}>
            <ul>
              <li><strong>{s('marketStocks')}</strong> {s('marketStocksDesc')}</li>
              <li><strong>{s('marketIndices')}</strong> {s('marketIndicesDesc')}</li>
              <li><strong>{s('marketForex')}</strong> {s('marketForexDesc')}</li>
              <li><strong>{s('marketCrypto')}</strong> {s('marketCryptoDesc')}</li>
            </ul>
          </ArticleSection>

          <ArticleSection title={s('perfTitle')}>
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfFillWinRate')}</div>
                    <div className="text-xl font-bold text-green-400">{s('perfFillWinRateVal')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfGoWinRate')}</div>
                    <div className="text-xl font-bold text-blue-400">{s('perfGoWinRateVal')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfTrades')}</div>
                    <div className="text-xl font-bold text-purple-400">{s('perfTradesVal')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfBestTime')}</div>
                    <div className="text-xl font-bold text-amber-400">{s('perfBestTimeVal')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ArticleSection>

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
            <Link to="/learn/strategies/support-resistance" className="text-primary hover:underline">{s('navPrev')}</Link>
            <Link to="/learn" className="text-primary hover:underline">{s('navNext')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapTradingStrategy;
