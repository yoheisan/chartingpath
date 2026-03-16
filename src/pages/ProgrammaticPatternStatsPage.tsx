import { useParams, Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { usePatternStats } from '@/hooks/usePatternStats';
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
  const canonical = `https://chartingpath.com/patterns/stats/${patternSlug}/${assetClass}/${timeframe}`;

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

  return (
    <article className="min-h-screen bg-[#0f1117]">
      <PageMeta
        title={pageTitle}
        description={pageDesc}
        canonicalPath={`/patterns/stats/${patternSlug}/${assetClass}/${timeframe}`}
      />

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/patterns/stats" className="hover:text-orange-400">Pattern Stats</Link>
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
            <p className="text-muted-foreground">Not enough data for this combination yet. We need at least a few resolved trades to generate statistics.</p>
            <Button asChild variant="outline">
              <Link to="/patterns/stats">Browse All Pattern Statistics</Link>
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
                  <MetricTile icon={<TrendingUp className="h-5 w-5" />} label="Win Rate" value={`${(data.winRate * 100).toFixed(1)}%`} colorClass={wrColor(data.winRate)} />
                  <MetricTile icon={<Target className="h-5 w-5" />} label="Avg Expectancy" value={`${data.avgExpectancy}R`} colorClass={expColor(data.avgExpectancy)} />
                  <MetricTile icon={<BarChart3 className="h-5 w-5" />} label="Avg R:R" value={`${data.avgRR}:1`} colorClass="text-foreground" />
                  <MetricTile icon={<Hash className="h-5 w-5" />} label="Total Trades" value={data.totalTrades.toLocaleString()} colorClass="text-foreground"
                    badge={data.totalTrades >= 100 ? 'Significant' : data.totalTrades < 30 ? 'Emerging' : undefined}
                    badgeVariant={data.totalTrades >= 100 ? 'default' : 'secondary'}
                  />
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  The {pName} pattern on {acLabel} at the {tfLabel} timeframe has demonstrated a{' '}
                  <strong className={wrColor(data.winRate)}>{(data.winRate * 100).toFixed(1)}%</strong> win rate across{' '}
                  <strong>{data.totalTrades.toLocaleString()}</strong> backtested trades, with an average expectancy of{' '}
                  <strong className={expColor(data.avgExpectancy)}>{data.avgExpectancy}R</strong> per trade —{' '}
                  {data.winRate >= 0.5 ? 'outperforming' : 'underperforming'} the baseline 50% threshold by{' '}
                  {Math.abs((data.winRate - 0.5) * 100).toFixed(1)} percentage points.
                </p>
              </section>
            </FadeSection>

            {/* ── Section 2: What Is This Pattern? ─────────────────────────── */}
            <FadeSection>
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">What Is the {pName}?</h2>
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
                  <h2 className="text-xl font-bold text-foreground mb-4">Performance by Market</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2d3a] text-muted-foreground">
                          <th className="text-left py-3 pr-4">Instrument</th>
                          <th className="text-right py-3 px-4">Trades</th>
                          <th className="text-right py-3 px-4">Win Rate</th>
                          <th className="text-right py-3 px-4">Avg R</th>
                          <th className="text-right py-3 pl-4">Grade</th>
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
                        View Live Setups <ArrowRight className="ml-1 h-4 w-4" />
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
                  <h2 className="text-xl font-bold text-foreground mb-1">Is This Pattern's Edge Holding Up?</h2>
                  <p className="text-sm text-muted-foreground mb-4">Monthly win rate over the last 12 months</p>
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
                          formatter={(v: number) => [`${v}%`, 'Win Rate']}
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
                <h2 className="text-xl font-bold text-foreground mb-4">Grade Distribution</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Higher-graded instances historically perform better. Filter the Screener to Grade A/B for the strongest setups.
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
                  <h2 className="text-xl font-bold text-foreground mb-4">How To Trade the {pName}</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    <TradeCard icon={<Crosshair className="h-5 w-5 text-orange-400" />} title="Entry" body={`${guide.entry} On ${tfLabel} charts, this typically means waiting for the breakout candle to close.`} />
                    <TradeCard icon={<Shield className="h-5 w-5 text-red-400" />} title="Stop Loss" body={`${guide.stopLoss} For ${pName}, the historical average R:R is ${data.avgRR}:1.`} />
                    <TradeCard icon={<Target className="h-5 w-5 text-green-400" />} title="Take Profit" body={`${guide.takeProfit} The historical average R:R for this pattern on ${acLabel} ${tfLabel} is ${data.avgRR}:1.`} />
                  </div>
                </section>
              </FadeSection>
            )}

            {/* ── Section 7: Timeframe Comparison ─────────────────────────── */}
            {data.timeframeComparison.length > 1 && (
              <FadeSection>
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4">Comparison With Other Timeframes</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2d3a] text-muted-foreground">
                          <th className="text-left py-3 pr-4">Timeframe</th>
                          <th className="text-right py-3 px-4">Trades</th>
                          <th className="text-right py-3 px-4">Win Rate</th>
                          <th className="text-right py-3 px-4">Expectancy</th>
                          <th className="text-right py-3 pl-4">View</th>
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
                                  {isCurrent && <span className="ml-2 text-xs text-orange-400">(current)</span>}
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
                <h2 className="text-xl font-bold text-foreground mb-4">Live Signals Right Now</h2>
                {liveSignals && liveSignals.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {liveSignals.map((sig: any) => (
                      <div key={sig.id} className="bg-[#1a1d27] rounded-lg p-4 border border-[#2a2d3a]">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-orange-500/20 text-orange-400 text-xs">{sig.direction?.toUpperCase()}</Badge>
                          <span className="font-medium text-foreground text-sm">{sig.instrument}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Entry: {sig.entry_price?.toFixed(4)}</p>
                          <p>SL: {sig.stop_loss_price?.toFixed(4)} | TP: {sig.take_profit_price?.toFixed(4)}</p>
                        </div>
                        <Link to={`/patterns/live`} className="text-orange-400 text-xs hover:underline mt-2 inline-block">
                          View Signal →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#1a1d27] rounded-lg p-6 text-center border border-[#2a2d3a]">
                    <p className="text-muted-foreground mb-3">
                      No live {pName} setups on {acLabel} right now. Set an alert to be notified when one appears.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/members/alerts"><Bell className="mr-1 h-4 w-4" /> Set Alert</Link>
                    </Button>
                  </div>
                )}
              </section>
            </FadeSection>

            {/* ── Section 9: FAQ ───────────────────────────────────────────── */}
            <FadeSection>
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="works" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      Does the {pName} pattern work on {acLabel}?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      Based on {data.totalTrades.toLocaleString()} backtested trades on {acLabel} at the {tfLabel} timeframe, the {pName} pattern has a {(data.winRate * 100).toFixed(1)}% win rate with an average expectancy of {data.avgExpectancy}R. It {data.winRate >= 0.5 ? 'outperforms' : 'underperforms'} the 50% baseline, suggesting it {data.winRate >= 0.5 ? 'does have' : 'may not have'} a statistically meaningful edge in this market.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="best-tf" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      What is the best timeframe for {pName} on {acLabel}?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {data.timeframeComparison.length > 0
                        ? `Based on our data, the ${TIMEFRAME_LABELS[data.timeframeComparison.sort((a, b) => b.expectancy - a.expectancy)[0]?.timeframe] || 'Daily'} timeframe shows the highest expectancy for ${pName} on ${acLabel}. See the timeframe comparison table above for full details.`
                        : `We're still gathering data across timeframes for this combination.`}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sample" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      How many trades is this based on?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {data.totalTrades.toLocaleString()} historical trades{data.earliestDate ? ` between ${data.earliestDate.split('T')[0]} and ${data.lastUpdated.split('T')[0]}` : ''}, sourced from ChartingPath's Edge Atlas database of 320,000+ pattern outcomes.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="calc" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      How is the win rate calculated?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      A trade is counted as a win when price reaches the take profit level before the stop loss level. Timeouts — trades where neither level is hit — are excluded from win rate calculations but included in expectancy calculations.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="alert" className="border-[#2a2d3a] bg-[#1a1d27] rounded-lg px-4">
                    <AccordionTrigger className="text-foreground text-sm hover:no-underline">
                      Can I get alerted when a {pName} appears on {acLabel}?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      Yes. ChartingPath scans {acLabel} markets every hour for new {pName} formations.{' '}
                      <Link to="/members/alerts" className="text-orange-400 hover:underline">Set up an alert →</Link>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            </FadeSection>

            {/* ── Section 10: CTA ──────────────────────────────────────────── */}
            <FadeSection>
              <section className="bg-[#1a1d27] rounded-xl border border-orange-500/30 p-8 text-center">
                <h2 className="text-xl font-bold text-foreground mb-3">
                  Ready to trade {pName} with statistical confidence?
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Link to={`/patterns/live?pattern=${patternSlug}`}>
                      See Live {pName} Setups <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/projects/pattern-lab/new">
                      <FlaskConical className="mr-1 h-4 w-4" /> Run a Custom Backtest
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
      {badge && <Badge variant={badgeVariant} className="mt-1 text-[10px]">{badge}</Badge>}
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
