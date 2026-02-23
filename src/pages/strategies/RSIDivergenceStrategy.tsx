import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Target, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArticleSection, TradingRule, PatternChecklist } from "@/components/blog/ArticleSection";

const RSIDivergenceStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.rsiDivergence.${key}`);
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
            <Badge variant="outline">{s('badge1')}</Badge>
            <Badge variant="secondary">{s('badge2')}</Badge>
            <Badge className="bg-purple-500/20 text-purple-400">{s('badge3')}</Badge>
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
              <div className="text-2xl font-bold text-green-400">{s('metricWinRate')}</div>
              <div className="text-sm text-muted-foreground">{s('metricWinRateLabel')}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{s('metricRR')}</div>
              <div className="text-sm text-muted-foreground">{s('metricRRLabel')}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{s('metricTimeframes')}</div>
              <div className="text-sm text-muted-foreground">{s('metricTimeframesLabel')}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{s('metricFrequency')}</div>
              <div className="text-sm text-muted-foreground">{s('metricFrequencyLabel')}</div>
            </CardContent>
          </Card>
        </div>

        <div className="prose prose-invert max-w-none">
          <ArticleSection title={s('whatIsTitle')}>
            <p>{s('whatIsP1')}</p>
            <p>{s('whatIsP2')}</p>
            <ul>
              <li><strong>{s('bullishDiv')}</strong> {s('bullishDivDesc')}</li>
              <li><strong>{s('bearishDiv')}</strong> {s('bearishDivDesc')}</li>
            </ul>
            <p>{s('whatIsP3')}</p>
          </ArticleSection>

          <ArticleSection title={s('settingsTitle')}>
            <p>{s('settingsP')}</p>
            <ul>
              <li><strong>{s('settingPeriod')}</strong> {s('settingPeriodDesc')}</li>
              <li><strong>{s('settingOB')}</strong> {s('settingOBDesc')}</li>
              <li><strong>{s('settingOS')}</strong> {s('settingOSDesc')}</li>
            </ul>
            <p>{s('settingsNote')}</p>
          </ArticleSection>

          <ArticleSection title={s('bullishEntryTitle')}>
            <TradingRule type="entry" title={s('bullishEntryRule')}>
              <ul>
                <li>{s('bullEntry1')}</li>
                <li>{s('bullEntry2')}</li>
                <li>{s('bullEntry3')}</li>
                <li>{s('bullEntry4')}</li>
                <li>{s('bullEntry5')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('bearishEntryTitle')}>
            <TradingRule type="entry" title={s('bearishEntryRule')}>
              <ul>
                <li>{s('bearEntry1')}</li>
                <li>{s('bearEntry2')}</li>
                <li>{s('bearEntry3')}</li>
                <li>{s('bearEntry4')}</li>
                <li>{s('bearEntry5')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('stopLossTitle')}>
            <TradingRule type="stop" title={s('stopLossRule')}>
              <ul>
                <li><strong>{s('stop1')}</strong> {s('stop1Desc')}</li>
                <li><strong>{s('stop2')}</strong> {s('stop2Desc')}</li>
                <li>{s('stop3')}</li>
                <li>{s('stop4')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('takeProfitTitle')}>
            <TradingRule type="target" title={s('takeProfitRule')}>
              <ul>
                <li><strong>{s('tp1')}</strong> {s('tp1Desc')}</li>
                <li><strong>{s('tp2')}</strong> {s('tp2Desc')}</li>
                <li><strong>{s('tp3')}</strong> {s('tp3Desc')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('qualityTitle')}>
            <PatternChecklist
              title={s('qualityChecklistTitle')}
              items={[
                { text: s('quality1'), critical: true },
                { text: s('quality2'), critical: true },
                { text: s('quality3'), critical: false },
                { text: s('quality4'), critical: true },
                { text: s('quality5'), critical: false },
                { text: s('quality6'), critical: false },
              ]}
            />
          </ArticleSection>

          <ArticleSection title={s('hiddenTitle')}>
            <p>{s('hiddenP1')}</p>
            <ul>
              <li><strong>{s('hiddenBullish')}</strong> {s('hiddenBullishDesc')}</li>
              <li><strong>{s('hiddenBearish')}</strong> {s('hiddenBearishDesc')}</li>
            </ul>
            <p>{s('hiddenP2')}</p>
          </ArticleSection>

          <ArticleSection title={s('mtfTitle')}>
            <p>{s('mtfP')}</p>
            <ol>
              <li><strong>{s('mtf1')}</strong> {s('mtf1Desc')}</li>
              <li><strong>{s('mtf2')}</strong> {s('mtf2Desc')}</li>
              <li><strong>{s('mtf3')}</strong> {s('mtf3Desc')}</li>
            </ol>
            <p>{s('mtfExample')}</p>
          </ArticleSection>

          <ArticleSection title={s('mistakesTitle')}>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-semibold text-red-400">{s('criticalErrors')}</span>
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
              <li><strong>{s('marketForex')}</strong> {s('marketForexDesc')}</li>
              <li><strong>{s('marketStocks')}</strong> {s('marketStocksDesc')}</li>
              <li><strong>{s('marketIndices')}</strong> {s('marketIndicesDesc')}</li>
              <li><strong>{s('marketCrypto')}</strong> {s('marketCryptoDesc')}</li>
            </ul>
          </ArticleSection>

          <ArticleSection title={s('perfTitle')}>
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfWinRateLabel')}</div>
                    <div className="text-xl font-bold text-green-400">{s('perfWinRate')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfRRLabel')}</div>
                    <div className="text-xl font-bold text-blue-400">{s('perfRR')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfTradesLabel')}</div>
                    <div className="text-xl font-bold text-purple-400">{s('perfTrades')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfTfLabel')}</div>
                    <div className="text-xl font-bold text-amber-400">{s('perfTf')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ArticleSection>

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
            <Link to="/learn/strategies/momentum" className="text-primary hover:underline">
              {s('navPrev')}
            </Link>
            <Link to="/learn/strategies/vwap" className="text-primary hover:underline">
              {s('navNext')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSIDivergenceStrategy;
