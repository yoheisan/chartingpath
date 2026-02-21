import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy, Zap, FlaskConical, TrendingUp, TrendingDown } from 'lucide-react';

interface TickerStat {
  symbol: string;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  avg_rr: number;
  expectancy_r: number;
  est_annualized_pct: number;
  avg_bars: number;
}

const TF_LABEL: Record<string, string> = {
  '1wk': '1W', '1d': '1D', '8h': '8H', '4h': '4H', '1h': '1H',
};

const BARS_PER_YEAR: Record<string, number> = {
  '1wk': 52, '1d': 252, '8h': 756, '4h': 1512, '1h': 6048,
};

const CONFIDENCE_THRESHOLD = 30;

export default function EdgeAtlasPatternPage() {
  const { patternId } = useParams<{ patternId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const timeframe = searchParams.get('timeframe') || '1d';
  const assetType = searchParams.get('assetType') || 'stocks';
  const patternName = searchParams.get('patternName') || patternId || '';

  const [tickers, setTickers] = useState<TickerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'est_annualized_pct' | 'win_rate_pct' | 'total_trades' | 'expectancy_r'>('est_annualized_pct');
  const [totalSampleSize, setTotalSampleSize] = useState(0);

  useEffect(() => {
    if (!patternId) return;
    fetchTickers();
  }, [patternId, timeframe, assetType]);

  const fetchTickers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('historical_pattern_occurrences')
        .select('symbol, outcome, risk_reward_ratio, bars_to_outcome')
        .eq('pattern_id', patternId!)
        .eq('timeframe', timeframe)
        .eq('asset_type', assetType)
        .in('outcome', ['hit_tp', 'hit_sl'])
        .not('bars_to_outcome', 'is', null);

      if (error) throw error;

      // Aggregate per symbol
      const symbolMap: Record<string, { wins: number; losses: number; rrs: number[]; bars: number[] }> = {};
      for (const row of (data || [])) {
        if (!symbolMap[row.symbol]) symbolMap[row.symbol] = { wins: 0, losses: 0, rrs: [], bars: [] };
        const entry = symbolMap[row.symbol];
        if (row.outcome === 'hit_tp') entry.wins++;
        else entry.losses++;
        entry.rrs.push(Number(row.risk_reward_ratio) || 2);
        if (row.bars_to_outcome) entry.bars.push(Number(row.bars_to_outcome));
      }

      const barsPerYear = BARS_PER_YEAR[timeframe] || 252;

      const stats: TickerStat[] = Object.entries(symbolMap)
        .filter(([, v]) => v.wins + v.losses >= 5)
        .map(([symbol, v]) => {
          const total = v.wins + v.losses;
          const avg_rr = v.rrs.reduce((a, b) => a + b, 0) / v.rrs.length;
          const win_rate = v.wins / total;
          const expectancy_r = win_rate * avg_rr - (1 - win_rate);
          const avg_bars = v.bars.length > 0 ? v.bars.reduce((a, b) => a + b, 0) / v.bars.length : 10;
          const trades_per_year = barsPerYear / Math.max(avg_bars, 1);
          const est_annualized_pct = trades_per_year * expectancy_r;

          return {
            symbol,
            total_trades: total,
            wins: v.wins,
            losses: v.losses,
            win_rate_pct: Math.round(win_rate * 1000) / 10,
            avg_rr: Math.round(avg_rr * 100) / 100,
            expectancy_r: Math.round(expectancy_r * 1000) / 1000,
            est_annualized_pct: Math.round(est_annualized_pct * 10) / 10,
            avg_bars: Math.round(avg_bars * 10) / 10,
          };
        })
        .filter(s => s.expectancy_r > 0);

      stats.sort((a, b) => b[sortBy] - a[sortBy]);
      const totalTrades = stats.reduce((sum, s) => sum + s.total_trades, 0);
      setTotalSampleSize(totalTrades);
      setTickers(stats);
    } catch (e) {
      console.error('EdgeAtlas ticker fetch error:', e);
      setTickers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (col: typeof sortBy) => {
    setSortBy(col);
    setTickers(prev => [...prev].sort((a, b) => b[col] - a[col]));
  };

  const handleLiveSignals = (symbol: string) => {
    navigate(`/patterns/live?pattern=${encodeURIComponent(patternId!)}&timeframe=${timeframe}&assetType=${assetType}`);
  };

  const handleValidate = (symbol: string) => {
    navigate(`/projects/pattern-lab/new?pattern=${encodeURIComponent(patternId!)}&timeframe=${timeframe}&mode=validate&symbol=${encodeURIComponent(symbol)}`);
  };

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className={`text-xs px-2 py-1 rounded transition-colors ${sortBy === col ? 'bg-primary/20 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-6 py-10">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Edge Atlas
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Edge Atlas · Proven Tickers</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{patternName}</h1>
            <Badge variant="outline" className="font-mono text-sm">
              {TF_LABEL[timeframe] || timeframe}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">{assetType}</Badge>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {loading ? '...' : `${tickers.length} instruments with positive edge on this pattern/timeframe combination. n=${totalSampleSize}`}
            {' '}· Sorted by estimated annualised return. Min 5 resolved trades per ticker.
          </p>
        </div>

        {/* Sort controls */}
        {!loading && tickers.length > 0 && (
          <div className="flex items-center gap-1 mb-4 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Sort by:</span>
            <SortBtn col="est_annualized_pct" label="Est. Annual %" />
            <SortBtn col="win_rate_pct" label="Win Rate" />
            <SortBtn col="expectancy_r" label="Expectancy" />
            <SortBtn col="total_trades" label="Sample Size" />
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-14 ml-auto" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            ))}
          </div>
        ) : tickers.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-12 text-center text-muted-foreground">
            No tickers found with positive edge for this combination.
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_90px_80px_70px_auto] gap-4 px-4 py-2.5 border-b border-border/30 bg-muted/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Instrument</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Win Rate</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right" title="Expectancy in R per trade — average risk-units gained per trade">Expect. (R)</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Est. Annual</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Trades</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Avg Bars</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"></span>
            </div>

            {tickers.map((t, i) => {
              const isLowSample = t.total_trades < CONFIDENCE_THRESHOLD;
              return (
                <div
                  key={t.symbol}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_90px_80px_70px_auto] gap-3 sm:gap-4 items-center px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  {/* Symbol */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm font-mono">{t.symbol.replace('=X', '').replace('^', '')}</span>
                        {isLowSample && <span className="text-[10px] text-yellow-500">⚠️</span>}
                      </div>
                      <div className="flex items-center gap-2 sm:hidden text-xs text-muted-foreground mt-0.5">
                        <span>Win: <span className={t.win_rate_pct >= 55 ? 'text-green-500' : 'text-foreground'}>{t.win_rate_pct}%</span></span>
                        <span>Expect: <span className="text-green-500 font-mono">{t.expectancy_r.toFixed(3)}R</span></span>
                        <span className="font-bold text-green-400">+{t.est_annualized_pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="ml-auto flex gap-2 sm:hidden">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleValidate(t.symbol)}>
                        <FlaskConical className="h-3 w-3" /> Validate
                      </Button>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="hidden sm:block text-right">
                    <span className={`text-sm font-medium ${t.win_rate_pct >= 55 ? 'text-green-500' : t.win_rate_pct >= 45 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t.win_rate_pct}%
                    </span>
                    <div className="text-[10px] text-muted-foreground">{t.wins}W / {t.losses}L</div>
                  </div>

                  {/* Expectancy */}
                  <div className="hidden sm:block text-right">
                    <span className="font-mono text-sm text-green-500">{t.expectancy_r.toFixed(3)}R</span>
                  </div>

                  {/* Est Annual */}
                  <div className="hidden sm:block text-right">
                    <span className={`text-base font-bold ${t.est_annualized_pct >= 20 ? 'text-green-400' : t.est_annualized_pct >= 8 ? 'text-green-500' : 'text-green-600'}`}>
                      +{t.est_annualized_pct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Trades */}
                  <div className="hidden sm:block text-right">
                    <span className="text-sm text-muted-foreground">{t.total_trades}</span>
                  </div>

                  {/* Avg Bars */}
                  <div className="hidden sm:block text-right">
                    <span className="text-sm text-muted-foreground">{t.avg_bars}</span>
                  </div>

                  {/* CTAs */}
                  <div className="hidden sm:flex items-center gap-2 justify-end">
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleLiveSignals(t.symbol)}>
                      <Zap className="h-3 w-3" /> Live
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleValidate(t.symbol)}>
                      <FlaskConical className="h-3 w-3" /> Validate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && tickers.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            ⚠️ = fewer than {CONFIDENCE_THRESHOLD} samples · Est. Annual % = trades/yr × expectancy × 1% risk/trade
          </p>
        )}
      </div>
    </div>
  );
}
