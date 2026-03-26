import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { PageMeta } from '@/components/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  FlaskConical,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { PatternStatsCTA } from '@/components/PatternStatsCTA';

// ── Types ────────────────────────────────────────────────────────────────────

interface AssetBreakdown {
  asset_type: string;
  timeframe: string;
  total: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  avg_rr: number;
  expectancy_r: number;
  avg_bars: number;
}

interface PatternAggregates {
  total_trades: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  avg_rr: number;
  expectancy_r: number;
  avg_bars: number;
  best_asset: string;
  best_timeframe: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PATTERN_IDS = [
  'ascending-triangle', 'descending-triangle', 'symmetrical-triangle',
  'double-bottom', 'double-top', 'triple-bottom', 'triple-top',
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'bull-flag', 'bear-flag', 'rising-wedge', 'falling-wedge',
  'cup-and-handle', 'inverse-cup-and-handle',
  'donchian-breakout-long', 'donchian-breakout-short',
];

const PATTERN_DIRECTION: Record<string, string> = {
  'ascending-triangle': 'bullish', 'descending-triangle': 'bearish', 'symmetrical-triangle': 'neutral',
  'double-bottom': 'bullish', 'double-top': 'bearish', 'triple-bottom': 'bullish', 'triple-top': 'bearish',
  'head-and-shoulders': 'bearish', 'inverse-head-and-shoulders': 'bullish',
  'bull-flag': 'bullish', 'bear-flag': 'bearish', 'rising-wedge': 'bearish', 'falling-wedge': 'bullish',
  'cup-and-handle': 'bullish', 'inverse-cup-and-handle': 'bearish',
  'donchian-breakout-long': 'bullish', 'donchian-breakout-short': 'bearish',
};

const TF_LABEL: Record<string, string> = { '1wk': '1W', '1d': '1D', '8h': '8H', '4h': '4H', '1h': '1H' };

// ── Component ────────────────────────────────────────────────────────────────

export default function PatternStatisticsPage() {
  const { t } = useTranslation();
  const { patternId } = useParams<{ patternId: string }>();
  const navigate = useNavigate();

  const [breakdowns, setBreakdowns] = useState<AssetBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const direction = PATTERN_DIRECTION[patternId || ''] || 'neutral';
  const patternName = t(`patterns.${patternId}.name`, patternId || '');
  const patternDesc = t(`patterns.${patternId}.description`, '');
  const directionLabel = t(`patternStats.direction_${direction}`, direction);

  const assetLabel = (key: string) => t(`edgeAtlas.${key}`, key);

  useEffect(() => {
    if (!patternId) return;
    fetchStats();
  }, [patternId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Paginated fetch of all resolved trades for this pattern
      const PAGE_SIZE = 1000;
      let allData: { asset_type: string; timeframe: string; outcome: string; risk_reward_ratio: number; bars_to_outcome: number }[] = [];
      let page = 0;
      while (true) {
        const { data, error } = await supabase
          .from('historical_pattern_occurrences')
          .select('asset_type, timeframe, outcome, risk_reward_ratio, bars_to_outcome')
          .eq('pattern_id', patternId!)
          .in('outcome', ['hit_tp', 'hit_sl'])
          .not('bars_to_outcome', 'is', null)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) throw error;
        allData = [...allData, ...(data || [])];
        if (!data || data.length < PAGE_SIZE) break;
        page++;
      }

      // Group by asset_type + timeframe
      const groups: Record<string, { wins: number; losses: number; rrs: number[]; bars: number[] }> = {};
      for (const row of allData) {
        const key = `${row.asset_type}|${row.timeframe}`;
        if (!groups[key]) groups[key] = { wins: 0, losses: 0, rrs: [], bars: [] };
        const g = groups[key];
        if (row.outcome === 'hit_tp') g.wins++;
        else g.losses++;
        g.rrs.push(Number(row.risk_reward_ratio) || 2);
        g.bars.push(Number(row.bars_to_outcome));
      }

      const results: AssetBreakdown[] = Object.entries(groups)
        .filter(([, v]) => v.wins + v.losses >= 10)
        .map(([key, v]) => {
          const [asset_type, timeframe] = key.split('|');
          const total = v.wins + v.losses;
          const avg_rr = v.rrs.reduce((a, b) => a + b, 0) / v.rrs.length;
          const win_rate = v.wins / total;
          const expectancy_r = win_rate * avg_rr - (1 - win_rate);
          const avg_bars = v.bars.reduce((a, b) => a + b, 0) / v.bars.length;

          return {
            asset_type,
            timeframe,
            total,
            wins: v.wins,
            losses: v.losses,
            win_rate_pct: Math.round(win_rate * 1000) / 10,
            avg_rr: Math.round(avg_rr * 100) / 100,
            expectancy_r: Math.round(expectancy_r * 1000) / 1000,
            avg_bars: Math.round(avg_bars * 10) / 10,
          };
        })
        .sort((a, b) => b.expectancy_r - a.expectancy_r);

      setBreakdowns(results);
    } catch (e) {
      console.error('PatternStatistics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const aggregates = useMemo<PatternAggregates | null>(() => {
    if (breakdowns.length === 0) return null;
    const total = breakdowns.reduce((s, b) => s + b.total, 0);
    const wins = breakdowns.reduce((s, b) => s + b.wins, 0);
    const losses = breakdowns.reduce((s, b) => s + b.losses, 0);
    const avgRr = breakdowns.reduce((s, b) => s + b.avg_rr * b.total, 0) / total;
    const avgBars = breakdowns.reduce((s, b) => s + b.avg_bars * b.total, 0) / total;
    const wr = wins / total;
    const best = breakdowns[0];
    return {
      total_trades: total, wins, losses,
      win_rate_pct: Math.round(wr * 1000) / 10,
      avg_rr: Math.round(avgRr * 100) / 100,
      expectancy_r: Math.round((wr * avgRr - (1 - wr)) * 1000) / 1000,
      avg_bars: Math.round(avgBars * 10) / 10,
      best_asset: best.asset_type,
      best_timeframe: best.timeframe,
    };
  }, [breakdowns]);

  const pageTitle = `${patternName} Statistics — Win Rate, Expectancy & Historical Data`;
  const pageDesc = `${patternName} pattern performance across ${aggregates?.total_trades?.toLocaleString() || '320,000+'} historical trades. See win rates, expectancy, and the best markets to trade this pattern.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${patternName} Pattern Statistics`,
    description: pageDesc,
    author: { '@type': 'Organization', name: 'ChartingPath' },
    publisher: { '@type': 'Organization', name: 'ChartingPath', url: 'https://chartingpath.com' },
  };

  const faqJsonLd = aggregates ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the win rate of a ${patternName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Based on ${aggregates.total_trades.toLocaleString()} historically resolved trades, the ${patternName} pattern has a win rate of ${aggregates.win_rate_pct}% at a 2:1 risk-reward ratio. The best performing market for this pattern is ${assetLabel(aggregates.best_asset)} on the ${TF_LABEL[aggregates.best_timeframe] || aggregates.best_timeframe} timeframe.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is the ${patternName} pattern profitable?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: aggregates.expectancy_r > 0
            ? `Yes. The ${patternName} has a positive expectancy of ${aggregates.expectancy_r.toFixed(3)}R per trade at 2:1 risk-reward, based on ${aggregates.total_trades.toLocaleString()} historical trades.`
            : `At a 2:1 risk-reward ratio, the ${patternName} has a negative expectancy of ${aggregates.expectancy_r.toFixed(3)}R based on ${aggregates.total_trades.toLocaleString()} trades.`,
        },
      },
      {
        '@type': 'Question',
        name: `How long does a ${patternName} pattern take to resolve?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `On average, a ${patternName} pattern resolves in ${aggregates.avg_bars} bars from the breakout point.`,
        },
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title={pageTitle} description={pageDesc} canonicalPath={`/patterns/${patternId}/statistics`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">{t('patternStats.home', 'Home')}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/#edge-atlas" className="hover:text-foreground transition-colors">{t('edgeAtlas.badge', 'Edge Atlas')}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{patternName}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs">{directionLabel}</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            {t('patternStats.patternStatsHeading', { pattern: patternName, defaultValue: `${patternName} Statistics` })}
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">{patternDesc}</p>
        </header>

        {/* Aggregate KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : aggregates ? (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <KpiCard icon={<Target className="h-4 w-4" />} label={t('patternStats.winRate', 'Win Rate')} value={`${aggregates.win_rate_pct}%`} subtitle={`${aggregates.wins.toLocaleString()}W / ${aggregates.losses.toLocaleString()}L`} />
            <KpiCard icon={<TrendingUp className="h-4 w-4" />} label={t('patternStats.expectancyR', 'Expectancy (R)')} value={`${aggregates.expectancy_r > 0 ? '+' : ''}${aggregates.expectancy_r.toFixed(3)}R`} subtitle={`${t('patternStats.avgRR', 'Avg R:R')} ${aggregates.avg_rr}`} highlight={aggregates.expectancy_r > 0} />
            <KpiCard icon={<Clock className="h-4 w-4" />} label={t('patternStats.returnOnTime', 'Return on Time')} value={`${aggregates.avg_bars > 0 ? (aggregates.expectancy_r / aggregates.avg_bars).toFixed(4) : '—'}R/bar`} subtitle={t('patternStats.capitalEfficiency', 'Capital efficiency')} highlight={aggregates.avg_bars > 0 && aggregates.expectancy_r / aggregates.avg_bars >= 0.01} />
            <KpiCard icon={<BarChart3 className="h-4 w-4" />} label={t('patternStats.sampleSize', 'Sample Size')} value={aggregates.total_trades.toLocaleString()} subtitle={t('patternStats.resolvedTrades', 'Resolved trades')} />
            <KpiCard icon={<Clock className="h-4 w-4" />} label={t('patternStats.avgDuration', 'Avg Duration')} value={`${aggregates.avg_bars} ${t('patternStats.bars', 'bars')}`} subtitle={`${t('patternStats.best', 'Best')}: ${assetLabel(aggregates.best_asset)} ${TF_LABEL[aggregates.best_timeframe] || aggregates.best_timeframe}`} />
          </section>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/40 p-12 text-center text-muted-foreground mb-10">
            {t('patternStats.notEnoughDataPattern', 'Not enough data for this pattern yet.')}
          </div>
        )}

        {/* Breakdown Table */}
        {!loading && breakdowns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">{t('patternStats.performanceByMarket', 'Performance by Market & Timeframe')}</h2>
            <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_80px_90px_80px_140px] gap-4 px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('patternStats.marketTimeframe', 'Market / Timeframe')}</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.winRate', 'Win Rate')}</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.expR', 'Exp (R)')}</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.rot', 'ROT')}</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.avgRR', 'Avg R:R')}</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.trades', 'Trades')}</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.avgBars', 'Avg Bars')}</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('patternStats.actions', 'Actions')}</span>
              </div>

              {breakdowns.map((b) => (
                <div
                  key={`${b.asset_type}-${b.timeframe}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px_80px_90px_80px_140px] gap-3 sm:gap-4 items-center px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">{assetLabel(b.asset_type)}</Badge>
                    <Badge variant="outline" className="font-mono text-xs">{TF_LABEL[b.timeframe] || b.timeframe}</Badge>
                  </div>
                  <span className={`hidden sm:block text-sm text-right font-medium ${b.win_rate_pct >= 55 ? 'text-green-500' : 'text-foreground'}`}>
                    {b.win_rate_pct}%
                  </span>
                  <span className={`hidden sm:block text-sm text-right font-mono ${b.expectancy_r > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {b.expectancy_r > 0 ? '+' : ''}{b.expectancy_r.toFixed(3)}R
                  </span>
                  <span className={`hidden sm:block text-sm text-right font-mono ${b.avg_bars > 0 && b.expectancy_r / b.avg_bars >= 0.01 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {b.avg_bars > 0 ? (b.expectancy_r / b.avg_bars).toFixed(4) : '—'}
                  </span>
                  <span className="hidden sm:block text-sm text-right text-muted-foreground">{b.avg_rr}</span>
                  <span className="hidden sm:block text-sm text-right text-muted-foreground">{b.total.toLocaleString()}</span>
                  <span className="hidden sm:block text-sm text-right text-muted-foreground">{b.avg_bars}</span>
                  <div className="hidden sm:flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() => navigate(`/edge-atlas/${patternId}?timeframe=${b.timeframe}&assetType=${b.asset_type}&patternName=${encodeURIComponent(patternName)}`)}
                    >
                      <Zap className="h-3 w-3" /> {t('patternStats.tickers', 'Tickers')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() => navigate(buildPatternLabUrl({ pattern: patternId, timeframe: b.timeframe }))}
                    >
                      <FlaskConical className="h-3 w-3" /> {t('patternStats.lab', 'Lab')}
                    </Button>
                  </div>
                  {/* Mobile summary */}
                  <div className="flex items-center justify-between sm:hidden text-xs text-muted-foreground">
                    <span>WR {b.win_rate_pct}%</span>
                    <span className="text-green-500 font-mono">{b.expectancy_r.toFixed(3)}R</span>
                    <span>{b.total} {t('patternStats.trades', 'trades')}</span>
                    <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => navigate(`/edge-atlas/${patternId}?timeframe=${b.timeframe}&assetType=${b.asset_type}&patternName=${encodeURIComponent(patternName)}`)}>
                      {t('patternStats.view', 'View')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        {!loading && (
          <PatternStatsCTA
            patternId={patternId || ''}
            patternName={patternName}
          />
        )}

        {/* SEO content block */}
        {!loading && aggregates && (
          <section className="prose prose-invert max-w-none mb-12">
            <h2>{t('patternStats.howToTrade', { pattern: patternName, defaultValue: `How to Trade the ${patternName}` })}</h2>
            <p>
              {t('patternStats.seoBlock1', {
                trades: aggregates.total_trades.toLocaleString(),
                pattern: patternName,
                winRate: aggregates.win_rate_pct,
                avgRR: aggregates.avg_rr,
                expectancy: aggregates.expectancy_r.toFixed(3),
                defaultValue: `Based on ${aggregates.total_trades.toLocaleString()} resolved trades across multiple markets and timeframes, the ${patternName} pattern has a historical win rate of ${aggregates.win_rate_pct}% with an average risk-to-reward ratio of ${aggregates.avg_rr}:1. This gives it a positive expectancy of ${aggregates.expectancy_r.toFixed(3)}R per trade.`,
              })}
            </p>
            <p>
              {t('patternStats.seoBlock2', {
                bestAsset: assetLabel(aggregates.best_asset),
                bestTf: TF_LABEL[aggregates.best_timeframe] || aggregates.best_timeframe,
                avgBars: aggregates.avg_bars,
                defaultValue: `The strongest performance is observed in ${assetLabel(aggregates.best_asset)} on the ${TF_LABEL[aggregates.best_timeframe] || aggregates.best_timeframe} timeframe. Trades typically resolve within ${aggregates.avg_bars} bars.`,
              })}
            </p>
          </section>
        )}

        {/* All patterns grid */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">{t('patternStats.allPatternStatistics', 'All Pattern Statistics')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PATTERN_IDS.map((id) => (
              <Link
                key={id}
                to={`/patterns/${id}/statistics`}
                className={`rounded-lg border border-border/30 px-4 py-3 hover:bg-muted/30 transition-colors ${id === patternId ? 'bg-primary/10 border-primary/30' : 'bg-card/30'}`}
              >
                <span className="text-sm font-medium">{t(`patterns.${id}.name`, id)}</span>
                <span className="block text-sm text-muted-foreground mt-0.5">{t(`patternStats.direction_${PATTERN_DIRECTION[id] || 'neutral'}`, PATTERN_DIRECTION[id] || 'neutral')}</span>
              </Link>
            ))}
          </div>
        </section>
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
