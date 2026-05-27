import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, FlaskConical, TrendingUp, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildPatternLabUrl, buildBacktestSeoUrl } from '@/utils/patternLabUrl';
import {
  STAT_PATTERNS,
  STAT_ASSET_CLASSES,
  PATTERN_NAMES,
  PATTERN_DESCRIPTIONS,
  PATTERN_SVG_PATHS,
  PATTERN_TRADING_GUIDE,
  ASSET_CLASS_LABELS,
  type StatPattern,
  type StatAssetClass,
} from '@/config/patternStatsConstants';

/** URL slug → asset_type as stored in instrument_pattern_stats_mv */
const ASSET_SLUG_TO_DB: Record<string, string> = {
  forex: 'fx',
  crypto: 'crypto',
  stocks: 'stocks',
  commodities: 'commodities',
  indices: 'indices',
};

interface Row {
  symbol: string;
  timeframe: string;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  avg_rr: number;
  expectancy_r: number;
}

interface Aggregated {
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  avgExpectancy: number;
  avgRR: number;
  topCombos: Row[];
}

function aggregate(rows: Row[]): Aggregated {
  const totalTrades = rows.reduce((s, r) => s + r.total_trades, 0);
  const totalWins = rows.reduce((s, r) => s + r.wins, 0);
  const totalLosses = rows.reduce((s, r) => s + r.losses, 0);
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  // Trade-weighted expectancy
  const expectancySum = rows.reduce((s, r) => s + r.expectancy_r * r.total_trades, 0);
  const rrSum = rows.reduce((s, r) => s + r.avg_rr * r.total_trades, 0);
  const avgExpectancy = totalTrades > 0 ? expectancySum / totalTrades : 0;
  const avgRR = totalTrades > 0 ? rrSum / totalTrades : 0;
  const topCombos = [...rows]
    .filter((r) => r.total_trades >= 10)
    .sort((a, b) => b.expectancy_r - a.expectancy_r)
    .slice(0, 5);
  return { totalTrades, totalWins, totalLosses, winRate, avgExpectancy, avgRR, topCombos };
}

export default function BacktestPatternAssetPage() {
  const { patternId, assetClass } = useParams<{ patternId: string; assetClass: string }>();
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);

  const validPattern = patternId && (STAT_PATTERNS as readonly string[]).includes(patternId);
  const validAsset = assetClass && (STAT_ASSET_CLASSES as readonly string[]).includes(assetClass);

  useEffect(() => {
    if (!validPattern || !validAsset) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const dbAsset = ASSET_SLUG_TO_DB[assetClass!];
      const { data, error } = await supabase
        .from('instrument_pattern_stats_mv')
        .select('symbol, timeframe, total_trades, wins, losses, win_rate_pct, avg_rr, expectancy_r')
        .eq('pattern_id', patternId)
        .eq('asset_type', dbAsset)
        .gte('total_trades', 5);
      if (cancelled) return;
      if (error) {
        console.error('[BacktestPatternAsset] fetch error', error);
        setRows([]);
      } else {
        setRows((data || []) as Row[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [patternId, assetClass, validPattern, validAsset]);

  const agg = useMemo(() => (rows ? aggregate(rows) : null), [rows]);
  const hasData = agg !== null && agg.totalTrades >= 10;

  // Sparse-data noindex: tell crawlers to skip thin pages
  useEffect(() => {
    if (loading || !validPattern || !validAsset) return;
    if (hasData) return;
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex, follow');
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, [loading, hasData, validPattern, validAsset]);

  if (!validPattern || !validAsset) {
    return <Navigate to="/pattern-lab" replace />;
  }

  const patternName = PATTERN_NAMES[patternId!] || patternId!;
  const assetLabel = ASSET_CLASS_LABELS[assetClass!];
  const description = PATTERN_DESCRIPTIONS[patternId!];
  const guide = PATTERN_TRADING_GUIDE[patternId!];
  const svgPath = PATTERN_SVG_PATHS[patternId!];

  const title = `Backtest the ${patternName} on ${assetLabel} — Win rate & expectancy | ChartingPath`;
  const metaDesc = hasData
    ? `${patternName} on ${assetLabel}: ${agg!.winRate.toFixed(1)}% win rate, ${agg!.avgExpectancy.toFixed(2)}R expectancy across ${agg!.totalTrades.toLocaleString()} historical occurrences. Run your own backtest in Pattern Lab.`
    : `Backtest the ${patternName} on ${assetLabel} in Pattern Lab. Pick any instrument and timeframe and see the full historical edge.`;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Pattern Lab', item: 'https://chartingpath.com/pattern-lab' },
          { '@type': 'ListItem', position: 2, name: `${patternName} on ${assetLabel}`, item: `https://chartingpath.com${buildBacktestSeoUrl(patternId!, assetClass!)}` },
        ],
      },
      {
        '@type': 'Article',
        headline: `Backtest the ${patternName} on ${assetLabel}`,
        description: metaDesc,
        author: { '@type': 'Organization', name: 'ChartingPath' },
      },
    ],
  };

  return (
    <article className="min-h-screen bg-[#0f1117]">
      <PageMeta title={title} description={metaDesc} canonicalPath={buildBacktestSeoUrl(patternId!, assetClass!)} jsonLd={jsonLd} />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-14 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/pattern-lab" className="hover:text-orange-400 inline-flex items-center">
            <ChevronLeft className="h-3 w-3 mr-1" /> Pattern Lab
          </Link>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-start gap-4 mb-4">
            {svgPath && (
              <svg viewBox="0 0 200 100" className="w-20 h-12 shrink-0" aria-hidden>
                <path d={svgPath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
                {t('backtestSeo.heroTitle', { defaultValue: 'Backtest the {{pattern}} on {{asset}}', pattern: patternName, asset: assetLabel })}
              </h1>
              <p className="text-muted-foreground max-w-2xl">{metaDesc}</p>
            </div>
          </div>

          <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white mt-4">
            <Link to={buildPatternLabUrl({ pattern: patternId })}>
              <FlaskConical className="mr-2 h-4 w-4" />
              {t('backtestSeo.runCta', { defaultValue: 'Run a backtest on {{asset}}', asset: assetLabel })}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </header>

        {/* Stats grid */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t('backtestSeo.edgeTitle', { defaultValue: 'Historical edge on {{asset}}', asset: assetLabel })}
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : hasData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t('backtestSeo.winRate', 'Win rate'), value: `${agg!.winRate.toFixed(1)}%` },
                { label: t('backtestSeo.expectancy', 'Expectancy'), value: `${agg!.avgExpectancy >= 0 ? '+' : ''}${agg!.avgExpectancy.toFixed(2)}R` },
                { label: t('backtestSeo.avgRR', 'Avg R:R'), value: agg!.avgRR.toFixed(2) },
                { label: t('backtestSeo.sampleSize', 'Sample size'), value: agg!.totalTrades.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 text-sm text-muted-foreground">
              {t('backtestSeo.limitedData', { defaultValue: 'Limited historical data so far for the {{pattern}} on {{asset}}. Run a backtest in Pattern Lab to see fresh results.', pattern: patternName, asset: assetLabel })}
            </div>
          )}
        </section>

        {/* Top combos */}
        {hasData && agg!.topCombos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {t('backtestSeo.topTitle', { defaultValue: 'Best {{pattern}} setups on {{asset}}', pattern: patternName, asset: assetLabel })}
            </h2>
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#0f1117] text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">{t('backtestSeo.colInstrument', 'Instrument')}</th>
                    <th className="text-left px-4 py-3">{t('backtestSeo.colTf', 'Timeframe')}</th>
                    <th className="text-right px-4 py-3">{t('backtestSeo.colTrades', 'Trades')}</th>
                    <th className="text-right px-4 py-3">{t('backtestSeo.winRate', 'Win rate')}</th>
                    <th className="text-right px-4 py-3">{t('backtestSeo.expectancy', 'Expectancy')}</th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {agg!.topCombos.map((r) => (
                    <tr key={`${r.symbol}-${r.timeframe}`} className="border-t border-[#2a2d3a]">
                      <td className="px-4 py-3 font-medium text-foreground">{r.symbol}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.timeframe}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{r.total_trades}</td>
                      <td className="px-4 py-3 text-right text-foreground">{r.win_rate_pct.toFixed(1)}%</td>
                      <td className={`px-4 py-3 text-right font-medium ${r.expectancy_r >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.expectancy_r >= 0 ? '+' : ''}{r.expectancy_r.toFixed(2)}R
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={buildPatternLabUrl({ pattern: patternId, instrument: r.symbol, timeframe: r.timeframe })}
                          className="text-xs text-orange-400 hover:underline inline-flex items-center"
                        >
                          {t('backtestSeo.openLab', 'Open in Lab')} <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* About the pattern */}
        {description && (
          <section className="mb-12 max-w-3xl">
            <h2 className="text-xl font-bold text-foreground mb-3">
              {t('backtestSeo.aboutTitle', { defaultValue: 'About the {{pattern}}', pattern: patternName })}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </section>
        )}

        {/* Trading guide */}
        {guide && (
          <section className="mb-12 max-w-3xl">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {t('backtestSeo.guideTitle', { defaultValue: 'How to trade the {{pattern}}', pattern: patternName })}
            </h2>
            <div className="space-y-3">
              {[
                { label: t('backtestSeo.guideEntry', 'Entry'), text: guide.entry },
                { label: t('backtestSeo.guideSl', 'Stop loss'), text: guide.stopLoss },
                { label: t('backtestSeo.guideTp', 'Take profit'), text: guide.takeProfit },
              ].map((g) => (
                <div key={g.label} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
                  <div className="text-xs text-orange-400 font-medium uppercase mb-1.5">{g.label}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{g.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cross-links */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            {t('backtestSeo.compareTitle', { defaultValue: '{{pattern}} on other markets', pattern: patternName })}
          </h2>
          <div className="flex flex-wrap gap-2">
            {STAT_ASSET_CLASSES.filter((ac) => ac !== assetClass).map((ac) => (
              <Link
                key={ac}
                to={buildBacktestSeoUrl(patternId!, ac)}
                className="text-sm px-3 py-1.5 rounded-full bg-[#1a1d27] border border-[#2a2d3a] text-muted-foreground hover:text-orange-400 hover:border-orange-500/40 transition-colors"
              >
                {ASSET_CLASS_LABELS[ac]}
              </Link>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/30 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              {t('backtestSeo.finalCtaTitle', 'Test this setup on your own watchlist')}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('backtestSeo.finalCtaBody', 'Pick any instrument, set your timeframe, and see the historical edge in seconds.')}
            </div>
          </div>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link to={buildPatternLabUrl({ pattern: patternId })}>
              {t('backtestSeo.finalCtaButton', 'Open Pattern Lab')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}