import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

const PATTERN_DISPLAY: Record<string, { name: string; description: string; direction: string }> = {
  'ascending-triangle': { name: 'Ascending Triangle', description: 'A bullish continuation pattern formed by a flat resistance line and a rising support trendline, indicating increasing buying pressure.', direction: 'Bullish' },
  'descending-triangle': { name: 'Descending Triangle', description: 'A bearish continuation pattern with a flat support and declining resistance, suggesting sellers are gaining control.', direction: 'Bearish' },
  'symmetrical-triangle': { name: 'Symmetrical Triangle', description: 'A neutral consolidation pattern with converging trendlines that can break in either direction, reflecting market indecision.', direction: 'Neutral' },
  'double-bottom': { name: 'Double Bottom', description: 'A bullish reversal pattern that forms after a downtrend when price tests a support level twice and bounces, resembling the letter "W".', direction: 'Bullish' },
  'double-top': { name: 'Double Top', description: 'A bearish reversal pattern where price tests a resistance level twice and fails to break through, forming an "M" shape.', direction: 'Bearish' },
  'triple-bottom': { name: 'Triple Bottom', description: 'A bullish reversal pattern with three roughly equal lows, indicating strong support and potential trend reversal.', direction: 'Bullish' },
  'triple-top': { name: 'Triple Top', description: 'A bearish reversal pattern where price tests resistance three times, signaling exhaustion and a likely downside break.', direction: 'Bearish' },
  'head-and-shoulders': { name: 'Head and Shoulders', description: 'A classic bearish reversal pattern with three peaks — the middle peak (head) is the highest, flanked by two lower peaks (shoulders).', direction: 'Bearish' },
  'inverse-head-and-shoulders': { name: 'Inverse Head and Shoulders', description: 'A bullish reversal pattern mirroring the head and shoulders, with three troughs where the middle is the deepest.', direction: 'Bullish' },
  'bull-flag': { name: 'Bull Flag', description: 'A short-term bullish continuation pattern where a sharp upward move is followed by a brief rectangular consolidation before continuing higher.', direction: 'Bullish' },
  'bear-flag': { name: 'Bear Flag', description: 'A bearish continuation pattern where a sharp decline is followed by a brief upward-sloping consolidation before resuming lower.', direction: 'Bearish' },
  'rising-wedge': { name: 'Rising Wedge', description: 'A bearish pattern where price converges within upward-sloping trendlines, typically breaking down as buying momentum fades.', direction: 'Bearish' },
  'falling-wedge': { name: 'Falling Wedge', description: 'A bullish pattern with downward-converging trendlines, usually resolving to the upside as selling pressure diminishes.', direction: 'Bullish' },
  'cup-and-handle': { name: 'Cup & Handle', description: 'A bullish continuation pattern resembling a teacup, with a rounded bottom (cup) followed by a slight pullback (handle) before breakout.', direction: 'Bullish' },
  'inverse-cup-and-handle': { name: 'Inverse Cup & Handle', description: 'A bearish variant of the cup and handle, with a rounded top followed by a small rally before breaking down.', direction: 'Bearish' },
  'donchian-breakout-long': { name: 'Donchian Breakout (Long)', description: 'A momentum-based long signal triggered when price breaks above the upper Donchian channel, indicating a potential new uptrend.', direction: 'Bullish' },
  'donchian-breakout-short': { name: 'Donchian Breakout (Short)', description: 'A momentum-based short signal triggered when price breaks below the lower Donchian channel, suggesting a potential new downtrend.', direction: 'Bearish' },
};

const TF_LABEL: Record<string, string> = { '1wk': '1W', '1d': '1D', '8h': '8H', '4h': '4H', '1h': '1H' };
const ASSET_LABEL: Record<string, string> = { stocks: 'Stocks', crypto: 'Crypto', fx: 'Forex', indices: 'Indices', commodities: 'Commodities' };

// ── Component ────────────────────────────────────────────────────────────────

export default function PatternStatisticsPage() {
  const { patternId } = useParams<{ patternId: string }>();
  const navigate = useNavigate();

  const [breakdowns, setBreakdowns] = useState<AssetBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const info = PATTERN_DISPLAY[patternId || ''] || { name: patternId, description: '', direction: 'Neutral' };

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
      total_trades: total,
      wins,
      losses,
      win_rate_pct: Math.round(wr * 1000) / 10,
      avg_rr: Math.round(avgRr * 100) / 100,
      expectancy_r: Math.round((wr * avgRr - (1 - wr)) * 1000) / 1000,
      avg_bars: Math.round(avgBars * 10) / 10,
      best_asset: best.asset_type,
      best_timeframe: best.timeframe,
    };
  }, [breakdowns]);

  const pageTitle = `${info.name} Statistics — Win Rate, Expectancy & Historical Data`;
  const pageDesc = `${info.name} pattern performance across ${aggregates?.total_trades?.toLocaleString() || '320,000+'} historical trades. See win rates, expectancy, and the best markets to trade this pattern.`;

  // JSON-LD structured data (Article + FAQ)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${info.name} Pattern Statistics`,
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
        name: `What is the win rate of a ${info.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Based on ${aggregates.total_trades.toLocaleString()} historically resolved trades, the ${info.name} pattern has a win rate of ${aggregates.win_rate_pct}% at a 2:1 risk-reward ratio. The best performing market for this pattern is ${ASSET_LABEL[aggregates.best_asset] || aggregates.best_asset} on the ${TF_LABEL[aggregates.best_timeframe] || aggregates.best_timeframe} timeframe.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is the ${info.name} pattern profitable?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: aggregates.expectancy_r > 0
            ? `Yes. The ${info.name} has a positive expectancy of ${aggregates.expectancy_r.toFixed(3)}R per trade at 2:1 risk-reward, based on ${aggregates.total_trades.toLocaleString()} historical trades. This means for every unit of risk, you can expect to gain ${aggregates.expectancy_r.toFixed(3)} units on average over many trades.`
            : `At a 2:1 risk-reward ratio, the ${info.name} has a negative expectancy of ${aggregates.expectancy_r.toFixed(3)}R based on ${aggregates.total_trades.toLocaleString()} trades. Traders may achieve better results with a tighter take-profit target or by filtering for higher quality setups.`,
        },
      },
      {
        '@type': 'Question',
        name: `How long does a ${info.name} pattern take to resolve?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `On average, a ${info.name} pattern resolves in ${aggregates.avg_bars} bars from the breakout point. The exact duration depends on the timeframe — for example, ${aggregates.avg_bars} bars on a daily chart means approximately ${Math.round(aggregates.avg_bars)} trading days.`,
        },
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title={pageTitle} description={pageDesc} canonicalPath={`/patterns/${patternId}/statistics`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <div className="container mx-auto max-w-5xl px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/#edge-atlas" className="hover:text-foreground transition-colors">Edge Atlas</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{info.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs">{info.direction}</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">{info.name} Statistics</h1>
          <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">{info.description}</p>
        </header>

        {/* Aggregate KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : aggregates ? (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <KpiCard icon={<Target className="h-4 w-4" />} label="Win Rate" value={`${aggregates.win_rate_pct}%`} subtitle={`${aggregates.wins.toLocaleString()}W / ${aggregates.losses.toLocaleString()}L`} />
            <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Expectancy (R)" value={`${aggregates.expectancy_r > 0 ? '+' : ''}${aggregates.expectancy_r.toFixed(3)}R`} subtitle={`Avg R:R ${aggregates.avg_rr}`} highlight={aggregates.expectancy_r > 0} />
            <KpiCard icon={<Clock className="h-4 w-4" />} label="Return on Time" value={`${aggregates.avg_bars > 0 ? (aggregates.expectancy_r / aggregates.avg_bars).toFixed(4) : '—'}R/bar`} subtitle="Capital efficiency" highlight={aggregates.avg_bars > 0 && aggregates.expectancy_r / aggregates.avg_bars >= 0.01} />
            <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Sample Size" value={aggregates.total_trades.toLocaleString()} subtitle="Resolved trades" />
            <KpiCard icon={<Clock className="h-4 w-4" />} label="Avg Duration" value={`${aggregates.avg_bars} bars`} subtitle={`Best: ${ASSET_LABEL[aggregates.best_asset] || aggregates.best_asset} ${TF_LABEL[aggregates.best_timeframe] || aggregates.best_timeframe}`} />
          </section>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/40 p-12 text-center text-muted-foreground mb-10">
            Not enough data for this pattern yet.
          </div>
        )}

        {/* Breakdown Table */}
        {!loading && breakdowns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Performance by Market & Timeframe</h2>
            <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_80px_90px_80px_140px] gap-4 px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Market / Timeframe</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Win Rate</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Exp (R)</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">ROT</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Avg R:R</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Trades</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Avg Bars</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</span>
              </div>

              {breakdowns.map((b) => (
                <div
                  key={`${b.asset_type}-${b.timeframe}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px_80px_90px_80px_140px] gap-3 sm:gap-4 items-center px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">{ASSET_LABEL[b.asset_type] || b.asset_type}</Badge>
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
                      onClick={() => navigate(`/edge-atlas/${patternId}?timeframe=${b.timeframe}&assetType=${b.asset_type}&patternName=${encodeURIComponent(info.name)}`)}
                    >
                      <Zap className="h-3 w-3" /> Tickers
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 gap-1"
                      onClick={() => navigate(`/projects/pattern-lab/new?pattern=${patternId}&timeframe=${b.timeframe}`)}
                    >
                      <FlaskConical className="h-3 w-3" /> Lab
                    </Button>
                  </div>
                  {/* Mobile summary */}
                  <div className="flex items-center justify-between sm:hidden text-xs text-muted-foreground">
                    <span>WR {b.win_rate_pct}%</span>
                    <span className="text-green-500 font-mono">{b.expectancy_r.toFixed(3)}R</span>
                    <span>{b.total} trades</span>
                    <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => navigate(`/edge-atlas/${patternId}?timeframe=${b.timeframe}&assetType=${b.asset_type}&patternName=${encodeURIComponent(info.name)}`)}>
                      View
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
            patternName={info.name}
          />
        )}

        {/* SEO content block */}
        {!loading && aggregates && (
          <section className="prose prose-invert max-w-none mb-12">
            <h2>How to Trade the {info.name}</h2>
            <p>
              Based on {aggregates.total_trades.toLocaleString()} resolved trades across multiple markets and timeframes,
              the {info.name} pattern has a historical win rate of <strong>{aggregates.win_rate_pct}%</strong> with
              an average risk-to-reward ratio of <strong>{aggregates.avg_rr}:1</strong>.
              This gives it a positive expectancy of <strong>{aggregates.expectancy_r.toFixed(3)}R</strong> per trade.
            </p>
            <p>
              The strongest performance is observed in <strong>{ASSET_LABEL[aggregates.best_asset] || aggregates.best_asset}</strong> on
              the <strong>{TF_LABEL[aggregates.best_timeframe] || aggregates.best_timeframe}</strong> timeframe.
              Trades typically resolve within <strong>{aggregates.avg_bars} bars</strong>.
            </p>
          </section>
        )}

        {/* All patterns grid */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">All Pattern Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(PATTERN_DISPLAY).map(([id, p]) => (
              <Link
                key={id}
                to={`/patterns/${id}/statistics`}
                className={`rounded-lg border border-border/30 px-4 py-3 hover:bg-muted/30 transition-colors ${id === patternId ? 'bg-primary/10 border-primary/30' : 'bg-card/30'}`}
              >
                <span className="text-sm font-medium">{p.name}</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">{p.direction}</span>
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
