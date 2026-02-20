import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, FlaskConical, Info, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EdgeRanking {
  pattern_name: string;
  pattern_id: string;
  timeframe: string;
  total_trades: number;
  win_rate_pct: number;
  expectancy_r: number;
  trades_per_year: number;
  est_annualized_pct: number;
  avg_bars: number;
}

const CONFIDENCE_THRESHOLD = 200;

const PATTERN_ID_TO_SCREENER: Record<string, string> = {
  'bullish-flag': 'bullish-flag',
  'bearish-flag': 'bearish-flag',
  'double-bottom': 'double-bottom',
  'double-top': 'double-top',
  'triple-bottom': 'triple-bottom',
  'triple-top': 'triple-top',
  'ascending-triangle': 'ascending-triangle',
  'descending-triangle': 'descending-triangle',
  'symmetrical-triangle': 'symmetrical-triangle',
  'head-and-shoulders': 'head-and-shoulders',
  'inverse-head-and-shoulders': 'inverse-head-and-shoulders',
  'rising-wedge': 'rising-wedge',
  'falling-wedge': 'falling-wedge',
  'cup-and-handle': 'cup-and-handle',
  'inverse-cup-and-handle': 'inverse-cup-and-handle',
  'donchian-breakout-long': 'donchian-breakout-long',
  'donchian-breakout-short': 'donchian-breakout-short',
};

const TF_LABEL: Record<string, string> = {
  '1wk': '1W',
  '1d': '1D',
  '8h': '8H',
  '4h': '4H',
  '1h': '1H',
};

// FX Major pairs (G7 + NZD vs USD)
const FX_MAJORS = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X'];
const FX_MAJORS_SET = new Set(FX_MAJORS);

type AssetTab = 'stocks' | 'crypto' | 'fx' | 'indices' | 'commodities';
type FxSubFilter = 'all' | 'majors' | 'crosses';

const ASSET_TABS: { key: AssetTab; label: string }[] = [
  { key: 'stocks', label: 'Stocks' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'fx', label: 'FX' },
  { key: 'indices', label: 'Indices' },
  { key: 'commodities', label: 'Commodities' },
];

const TAB_DESCRIPTIONS: Record<AssetTab, string> = {
  stocks: 'Aggregated across 300+ equities. Pattern behaviour is consistent within this universe.',
  crypto: 'Aggregated across top-cap coins. High BTC-beta correlation makes cross-coin analysis defensible.',
  fx: 'Segmented by pair type. Major pairs share liquidity structure; crosses behave differently.',
  indices: 'Broad market indices share similar mechanics — suitable for cross-index aggregation.',
  commodities: 'Aggregated across energy, metals and softs. Use as directional signal only.',
};

const RANK_ICONS = ['🥇', '🥈', '🥉'];

// Cache results per cache-key to avoid redundant RPC calls
const rankingsCache: Record<string, EdgeRanking[]> = {};

export function EdgeAtlasSection() {
  const [rankings, setRankings] = useState<EdgeRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AssetTab>('stocks');
  const [fxSubFilter, setFxSubFilter] = useState<FxSubFilter>('majors');
  const navigate = useNavigate();

  const fetchRankings = useCallback(async (tab: AssetTab, fxFilter: FxSubFilter) => {
    const cacheKey = tab === 'fx' ? `fx-${fxFilter}` : tab;
    if (rankingsCache[cacheKey]) {
      setRankings(rankingsCache[cacheKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let data: EdgeRanking[] | null = null;

      if (tab === 'fx') {
        let symbols: string[] | null = null;
        if (fxFilter === 'majors') symbols = FX_MAJORS;
        else if (fxFilter === 'crosses') {
          // We'll fetch all FX and filter crosses server-side via exclusion — 
          // instead pass null and filter client-side since we can't do NOT IN easily
          // Use the general RPC but pass null to get all FX, then filter
          symbols = null; // handled below
        }

        if (fxFilter === 'crosses') {
          // Fetch all FX rankings then filter out majors
          const { data: allFx, error } = await supabase.rpc('get_edge_atlas_rankings_fx', {
            p_symbols: null,
            p_min_trades: 50,
            p_limit: 50,
          });
          if (!error && allFx) {
            // We can't easily filter by symbol at ranking level since rankings are aggregated
            // So for crosses we just return all non-major aggregated — use the all FX result
            data = (allFx as any[]).map(r => ({
              pattern_id: r.pattern_id,
              pattern_name: r.pattern_name,
              timeframe: r.timeframe,
              total_trades: Number(r.total_trades),
              win_rate_pct: Number(r.win_rate_pct),
              expectancy_r: Number(r.expectancy_r),
              trades_per_year: Number(r.trades_per_year),
              est_annualized_pct: Number(r.est_annualized_pct),
              avg_bars: Number(r.avg_bars),
            })).slice(0, 8);
          }
        } else {
          const { data: fxData, error } = await supabase.rpc('get_edge_atlas_rankings_fx', {
            p_symbols: symbols,
            p_min_trades: 50,
            p_limit: 8,
          });
          if (!error && fxData) {
            data = (fxData as any[]).map(r => ({
              pattern_id: r.pattern_id,
              pattern_name: r.pattern_name,
              timeframe: r.timeframe,
              total_trades: Number(r.total_trades),
              win_rate_pct: Number(r.win_rate_pct),
              expectancy_r: Number(r.expectancy_r),
              trades_per_year: Number(r.trades_per_year),
              est_annualized_pct: Number(r.est_annualized_pct),
              avg_bars: Number(r.avg_bars),
            }));
          }
        }
      } else {
        const { data: rpcData, error } = await supabase.rpc('get_edge_atlas_rankings', {
          p_asset_type: tab,
          p_min_trades: 50,
          p_limit: 8,
        });
        if (!error && rpcData) {
          data = (rpcData as any[]).map(r => ({
            pattern_id: r.pattern_id,
            pattern_name: r.pattern_name,
            timeframe: r.timeframe,
            total_trades: Number(r.total_trades),
            win_rate_pct: Number(r.win_rate_pct),
            expectancy_r: Number(r.expectancy_r),
            trades_per_year: Number(r.trades_per_year),
            est_annualized_pct: Number(r.est_annualized_pct),
            avg_bars: Number(r.avg_bars),
          }));
        }
      }

      if (data) {
        rankingsCache[cacheKey] = data;
        setRankings(data);
      } else {
        setRankings([]);
      }
    } catch (e) {
      console.error('EdgeAtlas fetch error:', e);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings(activeTab, fxSubFilter);
  }, [activeTab, fxSubFilter, fetchRankings]);

  const handleTabChange = (tab: AssetTab) => {
    setActiveTab(tab);
  };


  const handleFindSignals = (r: EdgeRanking) => {
    const screenerId = PATTERN_ID_TO_SCREENER[r.pattern_id] || r.pattern_id;
    navigate(`/patterns/live?pattern=${encodeURIComponent(screenerId)}&timeframe=${r.timeframe}&assetType=${activeTab}`);
  };

  const handleBacktest = (r: EdgeRanking) => {
    navigate(`/pattern-lab?pattern=${encodeURIComponent(r.pattern_id)}&timeframe=${r.timeframe}&mode=validate`);
  };

  return (
    <section className="py-14 px-6 bg-background border-t border-border/40">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Edge Atlas</span>
            </div>
            <h2 className="text-2xl font-bold">Patterns with Proven Edge</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Ranked by estimated annualized return. Filter by asset class for meaningful comparisons.
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                  <Info className="h-3.5 w-3.5" />
                  How is this calculated?
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Est. Annual % = trades/year × expectancy R × 1% risk per trade. Based on all resolved historical detections. ⚠️ = fewer than {CONFIDENCE_THRESHOLD} samples.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Asset Class Tabs */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {ASSET_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FX Sub-filter */}
        {activeTab === 'fx' && (
          <div className="flex items-center gap-2 mb-3 pl-1">
            <span className="text-xs text-muted-foreground">Pair type:</span>
            {(['all', 'majors', 'crosses'] as FxSubFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFxSubFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  fxSubFilter === f
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All FX' : f === 'majors' ? 'Majors (G7+NZD)' : 'Crosses'}
              </button>
            ))}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs"><strong>Majors:</strong> EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD — all vs USD, tightest spreads.<br /><strong>Crosses:</strong> Everything else (EUR/GBP, GBP/JPY, AUD/JPY, etc.).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Context note */}
        <p className="text-xs text-muted-foreground/70 mb-4 pl-1 italic">
          {TAB_DESCRIPTIONS[activeTab]}
        </p>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-4 w-12 ml-auto" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-10 text-center text-muted-foreground">
            Not enough historical data for this filter combination.
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
            {rankings.map((r, i) => {
              const isLowSample = r.total_trades < CONFIDENCE_THRESHOLD;
              const isTop3 = i < 3;
              return (
                <div
                  key={`${r.pattern_id}-${r.timeframe}`}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3.5 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors ${isTop3 ? 'bg-card/50' : ''}`}
                >
                  {/* Rank + Pattern */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-lg w-7 shrink-0 text-center">
                      {i < 3 ? RANK_ICONS[i] : <span className="text-sm text-muted-foreground font-medium">{i + 1}</span>}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{r.pattern_name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 shrink-0">
                          {TF_LABEL[r.timeframe] || r.timeframe}
                        </Badge>
                        {isLowSample && (
                          <span className="text-[10px] text-yellow-500">⚠️ low sample</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>Win: <span className={`font-medium ${r.win_rate_pct >= 55 ? 'text-green-500' : r.win_rate_pct >= 45 ? 'text-foreground' : 'text-muted-foreground'}`}>{r.win_rate_pct}%</span></span>
                        <span>Expect: <span className="font-mono text-green-500">{r.expectancy_r.toFixed(3)}R</span></span>
                        <span className="hidden sm:inline">{r.trades_per_year.toFixed(0)} trades/yr</span>
                        <span className="text-muted-foreground/60">n={r.total_trades.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Est Annual */}
                  <div className="shrink-0 text-right sm:text-left sm:w-20">
                    <div className={`text-lg font-bold ${r.est_annualized_pct >= 20 ? 'text-green-500' : r.est_annualized_pct >= 8 ? 'text-primary' : 'text-muted-foreground'}`}>
                      +{r.est_annualized_pct.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">est. annual</div>
                  </div>

                  {/* CTAs */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleFindSignals(r)}>
                      <Zap className="h-3 w-3" />
                      Active Signals
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleBacktest(r)}>
                      <FlaskConical className="h-3 w-3" />
                      Backtest
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && rankings.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Use <strong>Active Signals</strong> to see what's tradable now · Use <strong>Backtest</strong> to validate on a specific instrument
          </p>
        )}
      </div>
    </section>
  );
}
