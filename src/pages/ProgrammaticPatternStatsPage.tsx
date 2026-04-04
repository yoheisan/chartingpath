import { useParams, Link } from 'react-router-dom';
import { useOutcomeCount } from '@/hooks/useOutcomeCount';
import { PageMeta } from '@/components/PageMeta';
import { usePatternStats } from '@/hooks/usePatternStats';
import { useTranslation } from 'react-i18next';
import {
  PATTERN_NAMES,
  PATTERN_DESCRIPTIONS,
  PATTERN_SVG_PATHS,
  PATTERN_TRADING_GUIDE,
  ASSET_CLASS_LABELS,
  TIMEFRAME_LABELS,
  STAT_TIMEFRAMES,
} from '@/config/patternStatsConstants';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Target,
  BarChart3,
  Hash,
  ArrowRight,
  Bell,
  FlaskConical,
  Shield,
  Crosshair,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

// ─── JSON-LD injection hook ─────────────────────────────────────────────────
function useJsonLd(jsonLd: Record<string, any> | null) {
  useEffect(() => {
    if (!jsonLd) return;
    const id = 'pattern-stats-jsonld';
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(jsonLd);
    return () => { el?.remove(); };
  }, [jsonLd]);
}
// ─── Fade-in on scroll ──────────────────────────────────────────────────────
function FadeSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      {children}
    </div>
  );
}

// ─── Metric color helpers ───────────────────────────────────────────────────
function wrColor(wr: number) {
  if (wr >= 0.5) return 'text-green-400';
  if (wr >= 0.4) return 'text-amber-400';
  return 'text-red-400';
}

function expColor(e: number) {
  return e > 0 ? 'text-green-400' : 'text-red-400';
}

// ─── Live signals hook ──────────────────────────────────────────────────────
function useLiveSignals(patternSlug: string, assetClass: string, timeframe: string) {
  const dbAsset = { forex: 'fx', crypto: 'crypto', stocks: 'stock', commodities: 'commodity', indices: 'index' }[assetClass] || assetClass;
  return useQuery({
    queryKey: ['live-signals-stats', patternSlug, assetClass, timeframe],
    queryFn: async () => {
      const { data } = await supabase
        .from('live_pattern_detections')
        .select('id, instrument, pattern_name, entry_price, stop_loss_price, take_profit_price, detected_at, direction')
        .eq('pattern_id', patternSlug)
        .eq('asset_type', dbAsset)
        .eq('timeframe', timeframe)
        .eq('status', 'active')
        .order('detected_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Pattern SVG Diagram ────────────────────────────────────────────────────
function PatternDiagram({ slug }: { slug: string }) {
  const path = PATTERN_SVG_PATHS[slug];
  if (!path) return null;
  return (
    <svg viewBox="0 0 200 100" className="w-full max-w-xs" aria-label={`${PATTERN_NAMES[slug]} pattern diagram`}>
      <path d={path} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function ProgrammaticPatternStatsPage() {
  const { t } = useTranslation();
  const { patternSlug = '', assetClass = '', timeframe = '' } = useParams<{
    patternSlug: string;
    assetClass: string;
    timeframe: string;
  }>();

  const { data, isLoading, error } = usePatternStats(patternSlug, assetClass, timeframe);
  const { data: liveSignals } = useLiveSignals(patternSlug, assetClass, timeframe);

  const pName = PATTERN_NAMES[patternSlug] || patternSlug;
  const acLabel = ASSET_CLASS_LABELS[assetClass] || assetClass;
  const tfLabel = TIMEFRAME_LABELS[timeframe] || timeframe;
  const guide = PATTERN_TRADING_GUIDE[patternSlug];

  // SEO content — always in DOM even during loading
  const pageTitle = data
    ? `${pName} on ${acLabel} ${tfLabel}: ${data.totalTrades} Trades, ${(data.winRate * 100).toFixed(0)}% Win Rate | ChartingPath`
    : `${pName} ${acLabel} ${tfLabel} Backtest Statistics | ChartingPath`;
  const pageDesc = data
    ? `Backtest results for ${pName} on ${acLabel} at ${tfLabel} timeframe. ${data.totalTrades} historical trades, ${(data.winRate * 100).toFixed(1)}% win rate, ${data.avgExpectancy}R average expectancy. Real data from ChartingPath's Edge Atlas.`
    : `Historical backtest statistics for ${pName} on ${acLabel} at ${tfLabel} timeframe. Powered by ChartingPath's Edge Atlas database.`;

  // Inject JSON-LD
  useJsonLd(data ? {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${pName} ${acLabel} ${tfLabel} Backtest Statistics`,
    description: `Historical backtest results for ${pName} pattern on ${acLabel} at ${tfLabel} timeframe`,
    creator: { '@type': 'Organization', name: 'ChartingPath' },
    dateModified: data.lastUpdated?.split('T')[0],
    variableMeasured: ['Win Rate', 'Expectancy', 'Risk Reward Ratio', 'Sample Size'],
  } : null);

  const wrFormatted = data ? (data.winRate * 100).toFixed(1) : '0';
  const diffFormatted = data ? Math.abs((data.winRate - 0.5) * 100).toFixed(1) : '0';

  return (
    <article className="min-h-screen bg-[#0f1117]">
      <PageMeta
        title={pageTitle}
        description={pageDesc}
        canonicalPath={`/patterns/stats/${patternSlug}/${assetClass}/${timeframe}`}
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/patterns/stats" className="hover:text-orange-400">{t('patternStats.breadcrumbPatternStats')}</Link>
          <span className="mx-2">/</span>
          <span>{pName}</span>
          <span className="mx-2">/</span>
          <span>{acLabel}</span>
          <span className="mx-2">/</span>
          <span>{tfLabel}</span>
        </nav>

        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-12 w-3/4 bg-[#1a1d27]" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 bg-[#1a1d27]" />)}
            </div>
            <Skeleton className="h-40 bg-[#1a1d27]" />
          </div>
        ) : error || !data ? (
          <div className="text-center py-20 space-y-4">
            <h1 className="text-2xl font-bold text-foreground">{pName} — {acLabel} {tfLabel}</h1>
            <p className="text-muted-foreground">{t('patternStats.notEnoughDataCombo')}</p>
            <Button asChild variant="outline">
              <Link to="/patterns/stats">{t('patternStats.browseAll')}</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* ── Section 1: Hero Stats Banner ─────────────────────────────── */}
            <FadeSection>
              <section className="rounded-xl bg-[#1a1d27] border-l-4 border-orange-500 p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                  {pName} — {acLabel} {tfLabel}
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <MetricTile icon={<TrendingUp className="h-5 w-5" />} label={t('patternStats.winRate')} value={`${wrFormatted}%`} colorClass={wrColor(data.winRate)} />
                  <MetricTile icon={<Target className="h-5 w-5" />} label={t('patternStats.avgExpectancy')} value={`${data.avgExpectancy}R`} colorClass={expColor(data.avgExpectancy)} />
                  <MetricTile icon={<BarChart3 className="h-5 w-5" />} label={t('patternStats.avgRR')} value={`${data.avgRR}:1`} colorClass="text-foreground" />
                  <MetricTile icon={<Hash className="h-5 w-5" />} label={t('patternStats.totalTrades')} value={data.totalTrades.toLocaleString()} colorClass="text-foreground"
                    badge={data.totalTrades >= 100 ? t('patternStats.badgeSignificant') : data.totalTrades < 30 ? t('patternStats.badgeEmerging') : undefined}
                    badgeVariant={data.totalTrades >= 100 ? 'default' : 'secondary'}
                  />
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('patternStats.heroSummary', {
                    pattern: pName,
                    asset: acLabel,
                    timeframe: tfLabel,
                    winRate: wrFormatted,
                    trades: data.totalTrades.toLocaleString(),
                    expectancy: data.avgExpectancy,
                    performance: data.winRate >= 0.5 ? t('patternStats.outperforming') : t('patternStats.underperforming'),
                    diff: diffFormatted,
                  })}
                </p>
              </section>
            </FadeSection>

            {/* ── Section 2: What Is This Pattern? ─────────────────────────── */}
            <FadeSection>
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">{t('patternStats.whatIsPattern', { pattern: pName })}</h2>
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <p className="text-muted-foreground leading-relaxed">
                    {PATTERN_DESCRIPTIONS[patternSlug] || `The ${pName} is a chart pattern detected by ChartingPath's scanner.`}
                  </p>
                  <div className="flex justify-center bg-[#1a1d27] rounded-lg p-6">
                    <PatternDiagram slug={patternSlug} />
                  </div>
                </div>
              </section>
            </FadeSection>

            {/* ── Section 3: Performance by Market ─────────────────────────── */}
            {data.instrumentBreakdown.length > 0 && (
              <FadeSection>
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4">{t('patternStats.performanceByMarket')}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2d3a] text-muted-foreground">
                          <th className="text-left py-3 pr-4">{t('patternStats.instrument')}</th>
                          <th className="text-right py-3 px-4">{t('patternStats.trades')}</th>
                          <th className="text-right py-3 px-4">{t('patternStats.winRate')}</th>
                          <th className="text-right py-3 px-4">{t('patternStats.avgRR')}</th>
                          <th className="text-right py-3 pl-4">{t('patternStats.grade')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.instrumentBreakdown.map((row) => (
                          <tr key={row.symbol} className="border-b border-[#1a1d27] hover:bg-[#1a1d27]/50">
                            <td className="py-3 pr-4">
                              <Link to={`/members/dashboard?instrument=${row.symbol}`} className="text-orange-400 hover:underline font-medium">
                                {row.symbol}
                              </Link>
                            </td>
                            <td className="text-right py-3 px-4 text-muted-foreground">{row.trades}</td>
                            <td className={`text-right py-3 px-4 font-medium ${wrColor(row.winRate)}`}>{(row.winRate * 100).toFixed(0)}%</td>
                            <td className={`text-right py-3 px-4 ${expColor(row.avgR)}`}>{row.avgR > 0 ? '+' : ''}{row.avgR}R</td>
                            <td className="text-right py-3 pl-4">
                              <Badge variant={row.grade === 'A' ? 'default' : 'secondary'} className="text-xs">{row.grade}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/patterns/live?pattern=${patternSlug}&timeframe=${timeframe}`}>
                        {t('patternStats.viewLiveSetups')} <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </section>
              </FadeSection>
            )}

            {/* ── Section 4: Win Rate Over Time ────────────────────────────── */}
            {data.monthlyBreakdown.some(m => m.trades > 0) && (
              <FadeSection>
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-1">{t('patternStats.edgeHoldingTitle')}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{t('patternStats.edgeHoldingSubtitle')}</p>
                  <div className="bg-[#1a1d27] rounded-lg p-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.monthlyBreakdown.map(m => ({ ...m, winPct: +(m.winRate * 100).toFixed(1) }))}>
                        <defs>
                          <linearGradient id="wrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} labelStyle={{ color: '#9ca3af' }}
                          formatter={(v: number) => [`${v}%`, t('patternStats.winRate')]}
                        />
                        <Area type="monotone" dataKey="winPct" stroke="#f97316" fill="url(#wrGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </FadeSection>
            )}

            {/* ── Section 5: Grade Distribution ────────────────────────────── */}
            <FadeSection>
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">{t('patternStats.gradeDistribution')}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('patternStats.gradeDistributionHint')}
                </p>
                <div className="bg-[#1a1d27] rounded-lg p-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={['A', 'B', 'C', 'D'].map(g => ({
                      grade: g,
                      count: data.gradeDistribution[g as keyof typeof data.gradeDistribution],
                      pct: data.totalTrades > 0
                        ? +((data.gradeDistribution[g as keyof typeof data.gradeDistribution] / data.totalTrades) * 100).toFixed(1)
                        : 0,
                    }))} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="grade" tick={{ fill: '#e5e7eb', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }}
                        formatter={(v: number) => [`${v}%`, 'Share']}
                      />
                      <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                        {['A', 'B', 'C', 'D'].map((g, i) => (
                          <Cell key={g} fill={i === 0 ? '#f97316' : i === 1 ? '#fb923c' : i === 2 ? '#6b7280' : '#374151'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </FadeSection>

            {/* ── Section 6: How To Trade ──────────────────────────────────── */}
            {guide && (
              <FadeSection>
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4">{t('patternStats.howToTrade', { pattern: pName })}</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <TradeCard icon={<Crosshair className="h-5 w-5 text-orange-400" />} title={t('patternStats.entry')} body={`${guide.entry} ${t('patternStats.onTimeframeCharts', { timeframe: tfLabel })}`} />
                    <TradeCard icon={<Shield className="h-5 w-5 text-red-400" />} title={t('patternStats.stopLoss')} body={`${guide.stopLoss} ${t('patternStats.historicalAvgRR', { pattern: pName, rr: data.avgRR })}`} />
                    <TradeCard icon={<Target className="h-5 w-5 text-green-400" />} title={t('patternStats.takeProfit')} body={`${guide.takeProfit} ${t('patternStats.historicalAvgRRTakeProfit', { asset: acLabel, timeframe: tfLabel, rr: data.avgRR })}`} />
                  </div>
                </section>
              </FadeSection>
            )}

            {/* ── Section 7: Timeframe Comparison ─────────────────────────── */}
            {data.timeframeComparison.length > 1 && (
              <FadeSection>
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4">{t('patternStats.comparisonTimeframes')}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2d3a] text-muted-foreground">
                          <th className="text-left py-3 pr-4">{t('patternStats.timeframe')}</th>
                          <th className="text-right py-3 px-4">{t('patternStats.trades')}</th>
                          <th className="text-right py-3 px-4">{t('patternStats.winRate')}</th>
                          <th className="text-right py-3 px-4">{t('patternStats.expectancy')}</th>
                          <th className="text-right py-3 pl-4">{t('patternStats.view')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.timeframeComparison
                          .sort((a, b) => {
                            const order = ['1h', '4h', '8h', '1d', '1wk'];
                            return order.indexOf(a.timeframe) - order.indexOf(b.timeframe);
                          })
                          .map((row) => {
                            const isCurrent = row.timeframe === timeframe;
                            return (
                              <tr key={row.timeframe} className={`border-b border-[#1a1d27] ${isCurrent ? 'bg-orange-500/10' : 'hover:bg-[#1a1d27]/50'}`}>
                                <td className={`py-3 pr-4 font-medium ${isCurrent ? 'text-orange-400' : 'text-foreground'}`}>
                                  {TIMEFRAME_LABELS[row.timeframe] || row.timeframe}
                                  {isCurrent && <span className="ml-2 text-xs text-orange-400">({t('patternStats.current')})</span>}
                                </td>
                                <td className="text-right py-3 px-4 text-muted-foreground">{row.trades}</td>
                                <td className={`text-right py-3 px-4 font-medium ${wrColor(row.winRate)}`}>{(row.winRate * 100).toFixed(0)}%</td>
                                <td className={`text-right py-3 px-4 ${expColor(row.expectancy)}`}>{row.expectancy > 0 ? '+' : ''}{row.expectancy}R</td>
                                <td className="text-right py-3 pl-4">
                                  {!isCurrent && (
                                    <Link to={`/patterns/stats/${patternSlug}/${assetClass}/${row.timeframe}`} className="text-orange-400 hover:underline text-xs">
                                      →
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </FadeSection>
            )}

            {/* ── Section 8: Live Signals ──────────────────────────────────── */}
            <FadeSection>
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">{t('patternStats.liveSignalsTitle')}</h2>
                {liveSignals && liveSignals.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {liveSignals.map((sig: any) => (
                      <div key={sig.id} className="bg-[#1a1d27] rounded-lg p-4 border border-[#2a2d3a]">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-orange-500/20 text-orange-400 text-xs">{sig.direction?.toUpperCase()}</Badge>
                          <span className="font-medium text-foreground text-sm">{sig.instrument}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>{t('patternStats.entry')}: {sig.entry_price?.toFixed(4)}</p>
                          <p>SL: {sig.stop_loss_price?.toFixed(4)} | TP: {sig.take_profit_price?.toFixed(4)}</p>
                        </div>
                        <Link to={`/patterns/live`} className="text-orange-400 text-xs hover:underline mt-2 inline-block">
                          {t('patternStats.viewSignal')}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1a1d27] rounded-lg p-6 text-center border border-[#2a2d3a]">
                    <p className="text-muted-foreground mb-3">
                      {t('patternStats.noLiveSignals', { pattern: pName, asset: acLabel })}
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/members/alerts"><Bell className="mr-1 h-4 w-4" /> {t('patternStats.setAlert')}</Link>
                    </Button>
                  </div>
                )}
              </section>
            </FadeSection>

            {/* ── Section 9: FAQ ───────────────────────────────────────────── */}
            <FadeSection>
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">{t('patternStats.faqTitle')}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="works" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      {t('patternStats.faqWorksQuestion', { pattern: pName, asset: acLabel })}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {t('patternStats.faqWorksAnswer', {
                        trades: data.totalTrades.toLocaleString(),
                        asset: acLabel,
                        timeframe: tfLabel,
                        pattern: pName,
                        winRate: wrFormatted,
                        expectancy: data.avgExpectancy,
                        performance: data.winRate >= 0.5 ? t('patternStats.outperforming') : t('patternStats.underperforming'),
                        edge: data.winRate >= 0.5 ? t('patternStats.doesHaveEdge') : t('patternStats.mayNotHaveEdge'),
                      })}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="best-tf" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      {t('patternStats.faqBestTfQuestion', { pattern: pName, asset: acLabel })}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {data.timeframeComparison.length > 0
                        ? t('patternStats.faqBestTfAnswer', {
                            timeframe: TIMEFRAME_LABELS[data.timeframeComparison.sort((a, b) => b.expectancy - a.expectancy)[0]?.timeframe] || 'Daily',
                            pattern: pName,
                            asset: acLabel,
                          })
                        : t('patternStats.faqBestTfNoData')}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sample" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      {t('patternStats.faqSampleQuestion')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {t('patternStats.faqSampleAnswer', {
                        trades: data.totalTrades.toLocaleString(),
                        from: data.earliestDate?.split('T')[0] || '—',
                        to: data.lastUpdated.split('T')[0],
                      })}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="calc" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      {t('patternStats.faqCalcQuestion')}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {t('patternStats.faqCalcAnswer')}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="alert" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      {t('patternStats.faqAlertQuestion', { pattern: pName, asset: acLabel })}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {t('patternStats.faqAlertAnswer', { asset: acLabel, pattern: pName })}{' '}
                      <Link to="/members/alerts" className="text-orange-400 hover:underline">{t('patternStats.faqAlertLink')}</Link>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            </FadeSection>

            {/* ── Section 10: CTA ──────────────────────────────────────────── */}
            <FadeSection>
              <section className="bg-[#1a1d27] rounded-xl border border-orange-500/30 p-8 text-center">
                <h2 className="text-xl font-bold text-foreground mb-3">
                  {t('patternStats.ctaTitle', { pattern: pName })}
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Link to={`/patterns/live?pattern=${patternSlug}`}>
                      {t('patternStats.ctaLiveSetups', { pattern: pName })} <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/projects/pattern-lab/new">
                      <FlaskConical className="mr-1 h-4 w-4" /> {t('patternStats.ctaBacktest')}
                    </Link>
                  </Button>
                </div>
              </section>
            </FadeSection>
          </>
        )}
      </div>
    </article>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetricTile({
  icon, label, value, colorClass, badge, badgeVariant = 'default',
}: {
  icon: React.ReactNode; label: string; value: string; colorClass: string;
  badge?: string; badgeVariant?: 'default' | 'secondary';
}) {
  return (
    <div className="bg-[#0f1117] rounded-lg p-4 border border-[#2a2d3a]">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
        {icon} {label}
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      {badge && <Badge variant={badgeVariant} className="mt-1 text-sm">{badge}</Badge>}
    </div>
  );
}

function TradeCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-[#1a1d27] rounded-lg p-5 border border-[#2a2d3a]">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
