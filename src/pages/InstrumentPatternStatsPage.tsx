import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { PageMeta } from '@/components/PageMeta';
import { JsonLd } from '@/components/JsonLd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { PatternStatsCTA } from '@/components/PatternStatsCTA';

// ── Types ────────────────────────────────────────────────────────────────────

interface Breakdown {
  timeframe: string;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  expectancy_r: number;
  avg_rr: number;
  avg_bars: number;
}

interface Aggregates {
  total_trades: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  expectancy_r: number;
  avg_rr: number;
  avg_bars: number;
}

interface StatsResponse {
  success: boolean;
  instrument: string;
  pattern_id: string;
  pattern_name: string;
  breakdowns: Breakdown[];
  aggregates: Aggregates | null;
  related_instruments: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const PATTERN_DISPLAY: Record<string, { name: string; direction: string }> = {
  'ascending-triangle': { name: 'Ascending Triangle', direction: 'Bullish' },
  'descending-triangle': { name: 'Descending Triangle', direction: 'Bearish' },
  'symmetrical-triangle': { name: 'Symmetrical Triangle', direction: 'Neutral' },
  'double-bottom': { name: 'Double Bottom', direction: 'Bullish' },
  'double-top': { name: 'Double Top', direction: 'Bearish' },
  'triple-bottom': { name: 'Triple Bottom', direction: 'Bullish' },
  'triple-top': { name: 'Triple Top', direction: 'Bearish' },
  'head-and-shoulders': { name: 'Head and Shoulders', direction: 'Bearish' },
  'inverse-head-and-shoulders': { name: 'Inverse Head and Shoulders', direction: 'Bullish' },
  'bull-flag': { name: 'Bull Flag', direction: 'Bullish' },
  'bear-flag': { name: 'Bear Flag', direction: 'Bearish' },
  'rising-wedge': { name: 'Rising Wedge', direction: 'Bearish' },
  'falling-wedge': { name: 'Falling Wedge', direction: 'Bullish' },
  'cup-and-handle': { name: 'Cup & Handle', direction: 'Bullish' },
  'inverse-cup-and-handle': { name: 'Inverse Cup & Handle', direction: 'Bearish' },
  'donchian-breakout-long': { name: 'Donchian Breakout (Long)', direction: 'Bullish' },
  'donchian-breakout-short': { name: 'Donchian Breakout (Short)', direction: 'Bearish' },
};

const TF_LABEL: Record<string, string> = { '1wk': '1W', '1d': '1D', '8h': '8H', '4h': '4H', '1h': '1H' };

// ── Component ────────────────────────────────────────────────────────────────

export default function InstrumentPatternStatsPage() {
  const { t } = useTranslation();
  const { patternId, instrument } = useParams<{ patternId: string; instrument: string }>();
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const info = PATTERN_DISPLAY[patternId || ''] || { name: patternId, direction: 'Neutral' };
  const displayInstrument = instrument?.toUpperCase() || '';
  const displayPatternName = data?.pattern_name || info.name;

  useEffect(() => {
    if (!patternId || !instrument) return;
    setLoading(true);
    supabase.functions
      .invoke('get-instrument-pattern-stats', {
        body: { pattern_id: patternId, instrument },
      })
      .then(({ data: resp, error }) => {
        if (error) console.error('Edge function error:', error);
        else setData(resp as StatsResponse);
      })
      .finally(() => setLoading(false));
  }, [patternId, instrument]);

  const agg = data?.aggregates;

  const pageTitle = t('patternStats.pageTitle', { pattern: displayPatternName, instrument: displayInstrument, defaultValue: `${displayPatternName} on ${displayInstrument} — Win Rate & Stats` });
  const pageDesc = agg
    ? t('patternStats.pageDescWithData', { pattern: displayPatternName, instrument: displayInstrument, winRate: agg.win_rate_pct, trades: agg.total_trades, expectancy: `${agg.expectancy_r > 0 ? '+' : ''}${agg.expectancy_r.toFixed(3)}R`, defaultValue: `${displayPatternName} pattern on ${displayInstrument}: ${agg.win_rate_pct}% win rate across ${agg.total_trades} trades. Expectancy ${agg.expectancy_r > 0 ? '+' : ''}${agg.expectancy_r.toFixed(3)}R.` })
    : t('patternStats.pageDescNoData', { pattern: displayPatternName, instrument: displayInstrument, defaultValue: `${displayPatternName} pattern statistics for ${displayInstrument}. Historical win rate, expectancy and performance data.` });

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={pageTitle}
        description={pageDesc}
        canonicalPath={`/patterns/${patternId}/${instrument}/statistics`}
      />

      {/* Article JSON-LD */}
      <JsonLd data={{
        '@type': 'Article',
        headline: `${displayPatternName} on ${displayInstrument} — Performance Statistics`,
        description: pageDesc,
        author: { '@type': 'Organization', name: 'ChartingPath' },
        publisher: { '@type': 'Organization', name: 'ChartingPath', url: 'https://chartingpath.com' },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://chartingpath.com/patterns/${patternId}/${instrument}/statistics`,
        },
      }} />

      {/* FAQ JSON-LD */}
      {agg && (
        <JsonLd data={{
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: `What is the ${displayPatternName} win rate on ${displayInstrument}?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `Based on ${agg.total_trades.toLocaleString()} historically resolved trades, the ${displayPatternName} pattern on ${displayInstrument} has a win rate of ${agg.win_rate_pct}% at a ${agg.avg_rr}:1 risk-reward ratio.`,
              },
            },
            {
              '@type': 'Question',
              name: `Is the ${displayPatternName} profitable on ${displayInstrument}?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: agg.expectancy_r > 0
                  ? `Yes. The ${displayPatternName} on ${displayInstrument} has a positive expectancy of ${agg.expectancy_r.toFixed(3)}R per trade, meaning for every unit of risk you can expect to gain ${agg.expectancy_r.toFixed(3)} units on average.`
                  : `At a ${agg.avg_rr}:1 risk-reward ratio, the ${displayPatternName} on ${displayInstrument} has a negative expectancy of ${agg.expectancy_r.toFixed(3)}R. Traders may improve results by filtering for higher quality setups.`,
              },
            },
            {
              '@type': 'Question',
              name: `How long does a ${displayPatternName} take to resolve on ${displayInstrument}?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `On average, the ${displayPatternName} on ${displayInstrument} resolves in ${agg.avg_bars} bars from the breakout point.`,
              },
            },
          ],
        }} />
      )}

      <div className="container mx-auto max-w-5xl px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors">{t('patternStats.home', 'Home')}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/#edge-atlas" className="hover:text-foreground transition-colors">{t('edgeAtlas.badge', 'Edge Atlas')}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/patterns/${patternId}/statistics`} className="hover:text-foreground transition-colors">
            {displayPatternName}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{displayInstrument}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs">{info.direction}</Badge>
            <Badge variant="secondary" className="text-xs font-mono">{displayInstrument}</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {displayPatternName} on {displayInstrument}
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
            Historical performance statistics for the {displayPatternName} pattern on {displayInstrument}, based on backtested data.
          </p>
        </header>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : agg ? (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <KpiCard icon={<Target className="h-4 w-4" />} label={t('patternStats.winRate', 'Win Rate')} value={`${agg.win_rate_pct}%`} subtitle={`${agg.wins.toLocaleString()}W / ${agg.losses.toLocaleString()}L`} />
            <KpiCard icon={<TrendingUp className="h-4 w-4" />} label={t('patternStats.expectancyR', 'Expectancy (R)')} value={`${agg.expectancy_r > 0 ? '+' : ''}${agg.expectancy_r.toFixed(3)}R`} subtitle={`${t('patternStats.avgRR', 'Avg R:R')} ${agg.avg_rr}`} highlight={agg.expectancy_r > 0} />
            <KpiCard icon={<BarChart3 className="h-4 w-4" />} label={t('patternStats.sampleSize', 'Sample Size')} value={agg.total_trades.toLocaleString()} subtitle={t('patternStats.resolvedTrades', 'Resolved trades')} />
            <KpiCard icon={<Clock className="h-4 w-4" />} label={t('patternStats.avgDuration', 'Avg Duration')} value={`${agg.avg_bars} ${t('patternStats.bars', 'bars')}`} subtitle={t('patternStats.fromBreakout', 'From breakout')} />
          </section>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/40 p-12 text-center text-muted-foreground mb-10">
            {t('patternStats.notEnoughData', 'Not enough data for {{pattern}} on {{instrument}} yet.', { pattern: displayPatternName, instrument: displayInstrument })}
          </div>
        )}

        {/* Timeframe Breakdown Table */}
        {!loading && data?.breakdowns && data.breakdowns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">{t('patternStats.performanceByTimeframe', 'Performance by Timeframe')}</h2>
            <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_90px_80px] gap-4 px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('patternStats.timeframe', 'Timeframe')}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.winRate', 'Win Rate')}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.expR', 'Exp (R)')}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.avgRR', 'Avg R:R')}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.trades', 'Trades')}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.avgBars', 'Avg Bars')}</span>
              </div>

              {data.breakdowns.map((b) => (
                <div
                  key={b.timeframe}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px_90px_80px] gap-3 sm:gap-4 items-center px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <div>
                    <Badge variant="outline" className="font-mono text-xs">{TF_LABEL[b.timeframe] || b.timeframe}</Badge>
                  </div>
                  <span className={`hidden sm:block text-sm text-right font-medium ${b.win_rate_pct >= 55 ? 'text-green-500' : 'text-foreground'}`}>
                    {b.win_rate_pct}%
                  </span>
                  <span className={`hidden sm:block text-sm text-right font-mono ${b.expectancy_r > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {b.expectancy_r > 0 ? '+' : ''}{b.expectancy_r.toFixed(3)}R
                  </span>
                  <span className="hidden sm:block text-sm text-right text-muted-foreground">{b.avg_rr}</span>
                  <span className="hidden sm:block text-sm text-right text-muted-foreground">{b.total_trades.toLocaleString()}</span>
                  <span className="hidden sm:block text-sm text-right text-muted-foreground">{b.avg_bars}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        <PatternStatsCTA
          patternId={patternId || ''}
          patternName={displayPatternName}
          instrument={displayInstrument}
        />

        {/* Related Instruments */}
        {!loading && data?.related_instruments && data.related_instruments.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              {displayPatternName} on Other Instruments
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.related_instruments.map((sym) => (
                <Link
                  key={sym}
                  to={`/patterns/${patternId}/${sym}/statistics`}
                  className="rounded-xl border border-border/30 bg-card/40 p-4 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-sm">{sym}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{displayPatternName} stats →</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, subtitle, highlight }: { icon: React.ReactNode; label: string; value: string; subtitle: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/40 p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-green-500' : ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}
