import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Target, Shield, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ArticleSection, TradingRule, PatternChecklist } from "@/components/blog/ArticleSection";
import { useTranslation } from "react-i18next";

const FibonacciStrategy = () => {
  const { t } = useTranslation();
  const s = (key: string) => t(`strategies.fibonacci.${key}`);
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
            <Badge className="bg-amber-500/20 text-amber-400">{s('badgeTechnical')}</Badge>
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
              <div className="text-2xl font-bold text-purple-400">{s('timeframes')}</div>
              <div className="text-sm text-muted-foreground">{s('timeframesKey')}</div>
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
          <ArticleSection title={s('understandingTitle')}>
            <p>{s('understandingP')}</p>
            <ul>
              <li><strong>{s('ratio236')}</strong> {s('ratio236Desc')}</li>
              <li><strong>{s('ratio382')}</strong> {s('ratio382Desc')}</li>
              <li><strong>{s('ratio50')}</strong> {s('ratio50Desc')}</li>
              <li><strong>{s('ratio618')}</strong> {s('ratio618Desc')}</li>
              <li><strong>{s('ratio786')}</strong> {s('ratio786Desc')}</li>
            </ul>
          </ArticleSection>

          <ArticleSection title={s('drawingTitle')}>
            <p>{s('drawingP')}</p>
            <ul>
              <li><strong>{s('drawUptrend')}</strong> {s('drawUptrendDesc')}</li>
              <li><strong>{s('drawDowntrend')}</strong> {s('drawDowntrendDesc')}</li>
              <li>{s('drawTip1')}</li>
              <li>{s('drawTip2')}</li>
            </ul>
            <p>{s('draw100P')}</p>
          </ArticleSection>

          <ArticleSection title={s('goldenTitle')}>
            <p>{s('goldenP')}</p>
            <TradingRule type="entry" title={s('goldenEntryTitle')}>
              <ul>
                <li>{s('goldenEntryItem1')}</li>
                <li>{s('goldenEntryItem2')}</li>
                <li>{s('goldenEntryItem3')}</li>
                <li>{s('goldenEntryItem4')}</li>
                <li>{s('goldenEntryItem5')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('shallowTitle')}>
            <p>{s('shallowP')}</p>
            <TradingRule type="entry" title={s('shallowEntryTitle')}>
              <ul>
                <li>{s('shallowEntryItem1')}</li>
                <li>{s('shallowEntryItem2')}</li>
                <li>{s('shallowEntryItem3')}</li>
                <li>{s('shallowEntryItem4')}</li>
                <li>{s('shallowEntryItem5')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('extensionsTitle')}>
            <p>{s('extensionsP')}</p>
            <ul>
              <li><strong>{s('ext1272')}</strong> {s('ext1272Desc')}</li>
              <li><strong>{s('ext1618')}</strong> {s('ext1618Desc')}</li>
              <li><strong>{s('ext200')}</strong> {s('ext200Desc')}</li>
              <li><strong>{s('ext2618')}</strong> {s('ext2618Desc')}</li>
            </ul>
          </ArticleSection>

          <ArticleSection title={s('stopTitle')}>
            <TradingRule type="stop" title={s('stopRulesTitle')}>
              <ul>
                <li><strong>{s('stop618')}</strong> {s('stop618Desc')}</li>
                <li><strong>{s('stop50')}</strong> {s('stop50Desc')}</li>
                <li><strong>{s('stop382')}</strong> {s('stop382Desc')}</li>
                <li>{s('stopATR')}</li>
                <li>{s('stopInvalid')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('tpTitle')}>
            <TradingRule type="target" title={s('tpRulesTitle')}>
              <ul>
                <li><strong>{s('tp1')}</strong> {s('tp1Desc')}</li>
                <li><strong>{s('tp2')}</strong> {s('tp2Desc')}</li>
                <li><strong>{s('tp3')}</strong> {s('tp3Desc')}</li>
                <li>{s('tpTrail')}</li>
              </ul>
            </TradingRule>
          </ArticleSection>

          <ArticleSection title={s('confluenceTitle')}>
            <p>{s('confluenceP')}</p>
            <ul>
              <li><strong>{s('confSR')}</strong> {s('confSRDesc')}</li>
              <li><strong>{s('confMA')}</strong> {s('confMADesc')}</li>
              <li><strong>{s('confTL')}</strong> {s('confTLDesc')}</li>
              <li><strong>{s('confFib')}</strong> {s('confFibDesc')}</li>
              <li><strong>{s('confRound')}</strong> {s('confRoundDesc')}</li>
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

          <ArticleSection title={s('multiTfTitle')}>
            <p>{s('multiTfP')}</p>
            <ol>
              <li><strong>{s('multiTfWeekly')}</strong> {s('multiTfWeeklyDesc')}</li>
              <li><strong>{s('multiTfDaily')}</strong> {s('multiTfDailyDesc')}</li>
              <li><strong>{s('multiTf4H')}</strong> {s('multiTf4HDesc')}</li>
            </ol>
            <p>{s('multiTfCluster')}</p>
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
              <li><strong>{s('marketForex')}</strong> {s('marketForexDesc')}</li>
              <li><strong>{s('marketIndices')}</strong> {s('marketIndicesDesc')}</li>
              <li><strong>{s('marketCommodities')}</strong> {s('marketCommoditiesDesc')}</li>
              <li><strong>{s('marketCrypto')}</strong> {s('marketCryptoDesc')}</li>
            </ul>
          </ArticleSection>

          <ArticleSection title={s('perfTitle')}>
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfWinRate')}</div>
                    <div className="text-xl font-bold text-green-400">{s('perfWinRateVal')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfRR')}</div>
                    <div className="text-xl font-bold text-blue-400">{s('perfRRVal')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfTrades')}</div>
                    <div className="text-xl font-bold text-purple-400">{s('perfTradesVal')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{s('perfTf')}</div>
                    <div className="text-xl font-bold text-amber-400">{s('perfTfVal')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ArticleSection>

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-border">
            <Link to="/learn/strategies/vwap" className="text-primary hover:underline">{s('navPrev')}</Link>
            <Link to="/learn/strategies/support-resistance" className="text-primary hover:underline">{s('navNext')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FibonacciStrategy;
