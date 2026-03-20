import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy, Zap, FlaskConical, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translatePatternName } from '@/utils/translatePatternName';
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
  const { t } = useTranslation();

  const timeframe = searchParams.get('timeframe') || '1d';
  const assetType = searchParams.get('assetType') || 'stocks';
  const patternName = searchParams.get('patternName') || patternId || '';

  const [tickers, setTickers] = useState<TickerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'est_annualized_pct' | 'win_rate_pct' | 'total_trades' | 'expectancy_r'>('est_annualized_pct');
  const [totalSampleSize, setTotalSampleSize] = useState(0);
  const [liveCountMap, setLiveCountMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!patternId) return;
    fetchTickers();
    fetchLiveCounts();
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

  const fetchLiveCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('live_pattern_detections')
        .select('instrument')
        .eq('pattern_id', patternId!)
        .eq('timeframe', timeframe)
        .eq('asset_type', assetType)
        .eq('status', 'active');

      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of (data || [])) {
        counts[row.instrument] = (counts[row.instrument] || 0) + 1;
      }
      setLiveCountMap(counts);
    } catch (e) {
      console.error('Live count fetch error:', e);
    }
  };

  const handleSort = (col: typeof sortBy) => {
    setSortBy(col);
    setTickers(prev => [...prev].sort((a, b) => b[col] - a[col]));
  };

  const edgeAtlasBackUrl = `/edge-atlas/${encodeURIComponent(patternId!)}?timeframe=${timeframe}&assetType=${assetType}&patternName=${encodeURIComponent(patternName)}`;

  const handleLiveSignals = (symbol: string) => {
    navigate(`/patterns/live?pattern=${encodeURIComponent(patternId!)}&timeframe=${timeframe}&assetType=${assetType}&highlight=${encodeURIComponent(symbol)}`, {
      state: { backUrl: edgeAtlasBackUrl, backLabel: `${patternName} · Edge Atlas` }
    });
  };

  const handleValidate = (symbol: string) => {
    navigate(`/projects/pattern-lab/new?pattern=${encodeURIComponent(patternId!)}&timeframe=${timeframe}&mode=validate&instrument=${encodeURIComponent(symbol)}`, {
      state: { backUrl: edgeAtlasBackUrl, backLabel: `${patternName} · Edge Atlas` }
    });
  };

  const handleStudyChart = (symbol: string) => {
    navigate(`/members/dashboard`, {
      state: { initialSymbol: symbol, backUrl: edgeAtlasBackUrl, backLabel: `${patternName} · Edge Atlas` }
    });
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
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10">

        {/* Back */}
        <button
          onClick={() => navigate('/#edge-atlas')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('edgeAtlas.backToEdgeAtlas')}
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">{t('edgeAtlas.provenTickers')}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{translatePatternName(patternName)}</h1>
            <Badge variant="outline" className="font-mono text-sm">
              {TF_LABEL[timeframe] || timeframe}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">{t(`edgeAtlas.${assetType}`, assetType)}</Badge>
            {(() => {
              const totalLive = Object.values(liveCountMap).reduce((a, b) => a + b, 0);
              return totalLive > 0 ? (
                <Badge className="bg-primary/20 text-primary border border-primary/30 gap-1 text-xs">
                  <Zap className="h-3 w-3" />
                  {t('edgeAtlas.liveSignals', { count: totalLive })}
                </Badge>
              ) : null;
            })()}
          </div>
           <p className="text-muted-foreground mt-2 text-sm">
            {loading ? '...' : t('edgeAtlas.instrumentsFound', { count: tickers.length, total: totalSampleSize })}
            {' '}· {t('edgeAtlas.sortedBy')}
          </p>
        </div>

        {/* Sort controls */}
        {!loading && tickers.length > 0 && (
          <div className="flex items-center gap-1 mb-4 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">{t('edgeAtlas.sortBy')}</span>
            <SortBtn col="est_annualized_pct" label={t('edgeAtlas.estAnnual')} />
            <SortBtn col="win_rate_pct" label={t('edgeAtlas.winRate')} />
            <SortBtn col="expectancy_r" label={t('edgeAtlas.expectancy')} />
            <SortBtn col="total_trades" label={t('edgeAtlas.sampleSize')} />
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
            {t('edgeAtlas.noTickers')}
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_90px_80px_70px_170px] gap-4 px-4 py-2.5 border-b border-border/30 bg-muted/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('edgeAtlas.instrument')}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('edgeAtlas.winRate')}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right" title="Expectancy in R per trade — average risk-units gained per trade">{t('edgeAtlas.expectancyR')}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('edgeAtlas.estAnnualCol')}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('edgeAtlas.trades')}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t('edgeAtlas.avgBars')}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"></span>
            </div>

            {tickers.map((tk, i) => {
              const isLowSample = tk.total_trades < CONFIDENCE_THRESHOLD;
              return (
                <div
                  key={tk.symbol}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_90px_80px_70px_170px] gap-3 sm:gap-4 items-center px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  {/* Symbol */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStudyChart(tk.symbol)}
                          className="font-semibold text-sm font-mono hover:text-primary transition-colors underline-offset-2 hover:underline text-left"
                        >
                          {tk.symbol.replace('=X', '').replace('^', '')}
                        </button>
                        {isLowSample && <span className="text-[10px] text-yellow-500">⚠️</span>}
                      </div>
                      <div className="flex items-center gap-2 sm:hidden text-xs text-muted-foreground mt-0.5">
                        <span>{t('edgeAtlas.win')} <span className={tk.win_rate_pct >= 55 ? 'text-green-500' : 'text-foreground'}>{tk.win_rate_pct}%</span></span>
                        <span>{t('edgeAtlas.expect')} <span className="text-green-500 font-mono">{tk.expectancy_r.toFixed(3)}R</span></span>
                        <span className="font-bold text-green-400">+{tk.est_annualized_pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="ml-auto flex gap-2 sm:hidden">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleValidate(tk.symbol)}>
                         <FlaskConical className="h-3 w-3" /> {t('edgeAtlas.validate')}
                      </Button>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="hidden sm:block text-right">
                    <span className={`text-sm font-medium ${tk.win_rate_pct >= 55 ? 'text-green-500' : tk.win_rate_pct >= 45 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {tk.win_rate_pct}%
                    </span>
                    <div className="text-[10px] text-muted-foreground">{tk.wins}W / {tk.losses}L</div>
                  </div>

                  {/* Expectancy */}
                  <div className="hidden sm:block text-right">
                    <span className="font-mono text-sm text-green-500">{tk.expectancy_r.toFixed(3)}R</span>
                  </div>

                  {/* Est Annual */}
                  <div className="hidden sm:block text-right">
                    <span className={`text-base font-bold ${tk.est_annualized_pct >= 20 ? 'text-green-400' : tk.est_annualized_pct >= 8 ? 'text-green-500' : 'text-green-600'}`}>
                      +{tk.est_annualized_pct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Trades */}
                  <div className="hidden sm:block text-right">
                    <span className="text-sm text-muted-foreground">{tk.total_trades}</span>
                  </div>

                  {/* Avg Bars */}
                  <div className="hidden sm:block text-right">
                    <span className="text-sm text-muted-foreground">{tk.avg_bars}</span>
                  </div>

                  {/* CTAs */}
                  <div className="hidden sm:flex items-center gap-2 justify-end">
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleValidate(tk.symbol)}>
                      <FlaskConical className="h-3 w-3" /> {t('edgeAtlas.validate')}
                    </Button>
                    {(() => {
                      const liveCount = liveCountMap[tk.symbol] || 0;
                      return (
                        <Button
                          size="sm"
                          variant={liveCount > 0 ? 'default' : 'outline'}
                          className={`text-xs h-8 gap-1.5 ${liveCount > 0 ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30' : 'text-muted-foreground'}`}
                          onClick={() => handleLiveSignals(tk.symbol)}
                          disabled={liveCount === 0}
                        >
                          <Zap className={`h-3 w-3 ${liveCount > 0 ? 'text-primary' : ''}`} />
                          {t('edgeAtlas.live')}
                          <span className={`text-[10px] font-bold ${liveCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {liveCount}
                          </span>
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && tickers.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('edgeAtlas.lowSampleNote', { threshold: CONFIDENCE_THRESHOLD })}
          </p>
        )}
      </div>
    </div>
  );
}
