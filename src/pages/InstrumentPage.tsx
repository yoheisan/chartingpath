import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageMeta } from '@/components/PageMeta';
import { JsonLd } from '@/components/JsonLd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestScanButton } from '@/components/instruments/RequestScanButton';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  Zap,
  FlaskConical,
  Globe,
  Building2,
  Coins,
  ArrowUpRight,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface InstrumentData {
  symbol: string;
  name: string | null;
  exchange: string;
  asset_type: string;
  country: string | null;
  currency: string | null;
  sector: string | null;
}

interface PatternStat {
  pattern_id: string;
  pattern_name: string;
  timeframe: string;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  expectancy_r: number;
  avg_rr: number;
  avg_bars: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ASSET_TYPE_LABELS: Record<string, string> = {
  stocks: 'Stock',
  crypto: 'Cryptocurrency',
  fx: 'Forex',
  commodities: 'Commodity',
  indices: 'Index',
  etfs: 'ETF',
};

const EXCHANGE_LABELS: Record<string, string> = {
  NYSE: 'New York Stock Exchange',
  NASDAQ: 'NASDAQ',
  HKEX: 'Hong Kong Stock Exchange',
  SGX: 'Singapore Exchange',
  SET: 'Stock Exchange of Thailand',
  SSE: 'Shanghai Stock Exchange',
  SZSE: 'Shenzhen Stock Exchange',
  BINANCE: 'Binance',
  FOREX: 'Forex Market',
  COMEX: 'COMEX',
  NYMEX: 'NYMEX',
  CBOT: 'Chicago Board of Trade',
  ICE: 'ICE Futures',
  CME: 'Chicago Mercantile Exchange',
  US_ETF: 'US ETF Market',
  US_INDEX: 'US Market Index',
  LSE: 'London Stock Exchange',
  XETRA: 'XETRA',
  EURONEXT: 'Euronext',
  JPX: 'Japan Exchange',
  KRX: 'Korea Exchange',
  ASX: 'Australian Securities Exchange',
  NSE_INDIA: 'National Stock Exchange of India',
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', HK: '🇭🇰', SG: '🇸🇬', TH: '🇹🇭', CN: '🇨🇳', GB: '🇬🇧',
  DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵', KR: '🇰🇷', AU: '🇦🇺', IN: '🇮🇳',
  CA: '🇨🇦', BR: '🇧🇷', MX: '🇲🇽', IT: '🇮🇹', TW: '🇹🇼', ID: '🇮🇩',
};

function cleanSymbolForDisplay(symbol: string): string {
  return symbol.replace('=F', '').replace('=X', '').replace('^', '').replace('-USD', '');
}

// ── Component ────────────────────────────────────────────────────────────────

export default function InstrumentPage() {
  const { symbol: rawSymbol } = useParams<{ symbol: string }>();
  const [instrument, setInstrument] = useState<InstrumentData | null>(null);
  const [patterns, setPatterns] = useState<PatternStat[]>([]);
  const [loading, setLoading] = useState(true);

  const symbol = rawSymbol || '';

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);

    const fetchData = async () => {
      // Fetch instrument metadata
      const { data: inst } = await supabase
        .from('instruments')
        .select('*')
        .eq('symbol', symbol)
        .single();

      setInstrument(inst);

      // Fetch pattern stats from materialized view
      const { data: stats } = await supabase
        .from('instrument_pattern_stats_mv')
        .select('*')
        .eq('symbol', symbol)
        .gte('total_trades', 5)
        .order('total_trades', { ascending: false });

      if (stats) {
        setPatterns(stats as unknown as PatternStat[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [symbol]);

  const displaySymbol = cleanSymbolForDisplay(symbol);
  const displayName = instrument?.name || displaySymbol;
  const assetLabel = ASSET_TYPE_LABELS[instrument?.asset_type || ''] || instrument?.asset_type || '';
  const exchangeLabel = EXCHANGE_LABELS[instrument?.exchange || ''] || instrument?.exchange || '';
  const countryFlag = instrument?.country ? COUNTRY_FLAGS[instrument.country] || '' : '';

  const totalTrades = useMemo(() => patterns.reduce((s, p) => s + p.total_trades, 0), [patterns]);
  const avgWinRate = useMemo(() => {
    if (patterns.length === 0) return 0;
    const weighted = patterns.reduce((s, p) => s + p.win_rate_pct * p.total_trades, 0);
    return totalTrades > 0 ? Math.round((weighted / totalTrades) * 10) / 10 : 0;
  }, [patterns, totalTrades]);

  const pageTitle = `${displayName} (${displaySymbol}) — Chart Pattern Statistics | ${exchangeLabel}`;
  const pageDesc = totalTrades > 0
    ? `${displayName} chart pattern analysis: ${totalTrades.toLocaleString()} historical trades across ${patterns.length} patterns. ${avgWinRate}% average win rate. Traded on ${exchangeLabel}.`
    : `${displayName} (${displaySymbol}) chart pattern statistics and technical analysis data. Traded on ${exchangeLabel}.`;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={pageTitle}
        description={pageDesc}
        canonicalPath={`/instruments/${symbol}`}
      />

      <JsonLd data={{
        '@type': 'FinancialProduct',
        name: displayName,
        description: pageDesc,
        provider: { '@type': 'Organization', name: 'ChartingPath', url: 'https://chartingpath.com' },
        url: `https://chartingpath.com/instruments/${symbol}`,
      }} />

      {patterns.length > 0 && (
        <JsonLd data={{
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: `What chart patterns work best on ${displayName}?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `Based on ${totalTrades.toLocaleString()} historical trades, ${displayName} has been analyzed across ${patterns.length} chart patterns. The average win rate across all patterns is ${avgWinRate}%.${patterns[0] ? ` The most-traded pattern is ${patterns[0].pattern_name} with ${patterns[0].total_trades} occurrences.` : ''}`,
              },
            },
            {
              '@type': 'Question',
              name: `Which exchange does ${displayName} trade on?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: `${displayName} (${displaySymbol}) trades on ${exchangeLabel}${instrument?.currency ? `, denominated in ${instrument.currency}` : ''}.`,
              },
            },
          ],
        }} />
      )}

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/patterns/live" className="hover:text-foreground transition-colors">Screener</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{displaySymbol}</span>
        </nav>

        {/* Header */}
        {loading ? (
          <div className="mb-10">
            <Skeleton className="h-10 w-64 mb-3" />
            <Skeleton className="h-6 w-96" />
          </div>
        ) : (
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs gap-1">
                <Building2 className="h-3 w-3" />
                {instrument?.exchange || 'Unknown'}
              </Badge>
              <Badge variant="secondary" className="text-xs">{assetLabel}</Badge>
              {instrument?.currency && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Coins className="h-3 w-3" />
                  {instrument.currency}
                </Badge>
              )}
              {countryFlag && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Globe className="h-3 w-3" />
                  {countryFlag} {instrument?.country}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              {displayName}
              <span className="text-muted-foreground font-mono ml-3 text-2xl">{displaySymbol}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
              Chart pattern performance statistics for {displayName}, traded on {exchangeLabel}.
              {totalTrades > 0 && ` Based on ${totalTrades.toLocaleString()} historically resolved trades.`}
            </p>
          </header>
        )}

        {/* Summary KPIs */}
        {!loading && totalTrades > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Patterns Analyzed" value={patterns.length.toString()} subtitle="Unique patterns" />
            <KpiCard icon={<Target className="h-4 w-4" />} label="Avg Win Rate" value={`${avgWinRate}%`} subtitle="Weighted average" highlight={avgWinRate >= 55} />
            <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Total Trades" value={totalTrades.toLocaleString()} subtitle="Resolved occurrences" />
            <KpiCard icon={<Building2 className="h-4 w-4" />} label="Exchange" value={instrument?.exchange || '—'} subtitle={exchangeLabel} />
          </section>
        )}

        {/* Pattern Performance Table */}
        {!loading && patterns.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Pattern Performance</h2>
            <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_70px_70px_80px_80px_70px_40px] gap-3 px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pattern</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">TF</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">Win %</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">Exp (R)</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">Trades</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right">Bars</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-right"></span>
              </div>
              {patterns.map((p, i) => (
                <Link
                  key={`${p.pattern_id}-${p.timeframe}-${i}`}
                  to={`/patterns/${p.pattern_id}/${symbol}/statistics`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_70px_70px_80px_80px_70px_40px] gap-2 sm:gap-3 items-center px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.pattern_name}</span>
                  </div>
                  <span className="hidden sm:block text-xs text-right font-mono text-muted-foreground">
                    {p.timeframe}
                  </span>
                  <span className={`hidden sm:block text-sm text-right font-medium ${p.win_rate_pct >= 55 ? 'text-green-500' : ''}`}>
                    {p.win_rate_pct}%
                  </span>
                  <span className={`hidden sm:block text-sm text-right font-mono ${p.expectancy_r > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {p.expectancy_r > 0 ? '+' : ''}{p.expectancy_r.toFixed(3)}R
                  </span>
                  <span className="hidden sm:block text-sm text-right text-muted-foreground">{p.total_trades.toLocaleString()}</span>
                  <span className="hidden sm:block text-sm text-right text-muted-foreground">{p.avg_bars}</span>
                  <span className="hidden sm:block text-right">
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && patterns.length === 0 && (
          <div className="rounded-xl border border-border/40 bg-card/40 p-12 text-center text-muted-foreground mb-10">
            <p className="mb-4">No historical pattern data available for {displayName} yet.</p>
            <RequestScanButton
              symbol={symbol}
              assetType={instrument?.asset_type}
              hasPatternData={false}
            />
          </div>
        )}

        {/* CTA */}
        <section className="flex flex-wrap gap-3 mb-12">
          <Button asChild variant="default" className="gap-2">
            <Link to={`/patterns/live?search=${displaySymbol}`}>
              <Zap className="h-4 w-4" /> View Live Signals
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/projects/pattern-lab/new?instrument=${displaySymbol}`}>
              <FlaskConical className="h-4 w-4" /> Backtest {displaySymbol}
            </Link>
          </Button>
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
