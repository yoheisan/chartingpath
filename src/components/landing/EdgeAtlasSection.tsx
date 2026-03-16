import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, FlaskConical, Info, Zap, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
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

const FX_MAJORS = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X'];

type AssetTab = 'stocks' | 'crypto' | 'fx' | 'indices' | 'commodities';
type FxSubFilter = 'all' | 'majors' | 'crosses';

const ASSET_TAB_KEYS: AssetTab[] = ['stocks', 'crypto', 'fx', 'indices', 'commodities'];

const UNIVERSE_BY_ASSET_TF: Record<string, Record<string, number>> = {
  stocks:      { '1h': 48, '4h': 225, '8h': 240, '1d': 250, '1wk': 323 },
  crypto:      { '4h': 13, '8h': 40, '1d': 69, '1wk': 97 },
  fx:          { '4h': 54, '8h': 69, '1d': 87, '1wk': 87 },
  indices:     { '1h': 6, '4h': 19, '8h': 26, '1d': 32, '1wk': 32 },
  commodities: { '4h': 1, '1d': 28, '1wk': 28 },
};

const getUniverse = (asset: string, timeframe?: string): number => {
  const tfMap = UNIVERSE_BY_ASSET_TF[asset];
  if (!tfMap) return 0;
  if (timeframe && tfMap[timeframe]) return tfMap[timeframe];
  return Math.max(...Object.values(tfMap));
};

const TAB_DESC_KEYS: Record<AssetTab, string> = {
  stocks: 'edgeAtlas.stocksDesc',
  crypto: 'edgeAtlas.cryptoDesc',
  fx: 'edgeAtlas.fxDesc',
  indices: 'edgeAtlas.indicesDesc',
  commodities: 'edgeAtlas.commoditiesDesc',
};

const RANK_ICONS = ['🥇', '🥈', '🥉'];

const rankingsCache: Record<string, EdgeRanking[]> = {};

export function EdgeAtlasSection() {
  const { t } = useTranslation();
  const [rankings, setRankings] = useState<EdgeRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AssetTab>('stocks');
  const [fxSubFilter, setFxSubFilter] = useState<FxSubFilter>('majors');
  const [liveCountMap, setLiveCountMap] = useState<Record<string, number>>({});
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  // Fetch total active setup counts per asset class (once on mount)
  useEffect(() => {
    (async () => {
      try {
        const counts: Record<string, number> = {};
        // Use server-side count per asset type to avoid 1000-row limit
        await Promise.all(
          ASSET_TAB_KEYS.map(async (asset) => {
            const { count, error } = await supabase
              .from('live_pattern_detections')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'active')
              .eq('asset_type', asset);
            if (!error && count != null) counts[asset] = count;
          })
        );
        setTabCounts(counts);
      } catch (e) {
        console.error('Tab count fetch error:', e);
      }
    })();
  }, []);

  // Fetch active live setup counts for current rankings
  const fetchLiveCounts = useCallback(async (rows: EdgeRanking[], assetType: AssetTab) => {
    if (rows.length === 0) return;
    try {
      const patternIds = [...new Set(rows.map(r => PATTERN_ID_TO_SCREENER[r.pattern_id] || r.pattern_id))];
      const timeframes = [...new Set(rows.map(r => r.timeframe))];

      const { data, error } = await supabase
        .from('live_pattern_detections')
        .select('pattern_id, timeframe')
        .eq('status', 'active')
        .eq('asset_type', assetType)
        .in('pattern_id', patternIds)
        .in('timeframe', timeframes);

      if (error) { console.error('Live count fetch error:', error); return; }

      const counts: Record<string, number> = {};
      for (const row of (data || [])) {
        const key = `${row.pattern_id}|${row.timeframe}`;
        counts[key] = (counts[key] || 0) + 1;
      }
      setLiveCountMap(counts);
    } catch (e) {
      console.error('Live count fetch error:', e);
    }
  }, []);

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
          symbols = null;
        }

        if (fxFilter === 'crosses') {
          const { data: allFx, error } = await supabase.rpc('get_edge_atlas_rankings_fx', {
            p_symbols: null,
            p_min_trades: 50,
            p_limit: 50,
          });
          if (!error && allFx) {
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

  useEffect(() => {
    if (rankings.length > 0) {
      fetchLiveCounts(rankings, activeTab);
    } else {
      setLiveCountMap({});
    }
  }, [rankings, activeTab, fetchLiveCounts]);

  const handleTabChange = (tab: AssetTab) => {
    setActiveTab(tab);
  };

  const handlePatternClick = (r: EdgeRanking) => {
    trackEvent('landing.cta_click', { button: 'edge_atlas_pattern', pattern: r.pattern_name, timeframe: r.timeframe });
    navigate(`/edge-atlas/${encodeURIComponent(r.pattern_id)}?timeframe=${r.timeframe}&assetType=${activeTab}&patternName=${encodeURIComponent(r.pattern_name)}`);
  };

  const handleFindSignals = (r: EdgeRanking) => {
    trackEvent('landing.cta_click', { button: 'edge_atlas_find_signals', pattern: r.pattern_name, timeframe: r.timeframe });
    const screenerId = PATTERN_ID_TO_SCREENER[r.pattern_id] || r.pattern_id;
    navigate(`/patterns/live?pattern=${encodeURIComponent(screenerId)}&timeframe=${r.timeframe}&assetType=${activeTab}`);
  };

  const handleBacktest = (r: EdgeRanking) => {
    trackEvent('landing.cta_click', { button: 'edge_atlas_validate', pattern: r.pattern_name, timeframe: r.timeframe });
    navigate(`/projects/pattern-lab/new?pattern=${encodeURIComponent(r.pattern_id)}&timeframe=${r.timeframe}&mode=validate`);
  };

  const assetTabLabels: Record<AssetTab, string> = {
    stocks: t('edgeAtlas.stocks'),
    crypto: t('edgeAtlas.crypto'),
    fx: t('edgeAtlas.fx'),
    indices: t('edgeAtlas.indices'),
    commodities: t('edgeAtlas.commodities'),
  };

  return (
    <section className="py-14 px-6 bg-background border-t border-border/40 min-h-[600px]">
      <div className="container mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">{t('edgeAtlas.badge')}</span>
            </div>
            <h2 className="text-2xl font-bold">{t('edgeAtlas.title')}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {t('edgeAtlas.subtitle')}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                  <Info className="h-3.5 w-3.5" />
                  {t('edgeAtlas.howCalculated')}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{t('edgeAtlas.howCalculatedTooltip', { threshold: CONFIDENCE_THRESHOLD })}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Asset Class Tabs */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {ASSET_TAB_KEYS.map(tabKey => {
            const count = tabCounts[tabKey] || 0;
            return (
              <button
                key={tabKey}
                onClick={() => handleTabChange(tabKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === tabKey
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {assetTabLabels[tabKey]}
                <span className={`text-[10px] font-mono ${
                  activeTab === tabKey
                    ? 'text-primary-foreground/70'
                    : count > 0 ? 'text-green-500' : 'text-muted-foreground/50'
                }`}>
                  {count}/{getUniverse(tabKey)}
                </span>
              </button>
            );
          })}
        </div>

        {/* FX Sub-filter */}
        {activeTab === 'fx' && (
          <div className="flex items-center gap-2 mb-3 pl-1">
            <span className="text-xs text-muted-foreground">{t('edgeAtlas.pairType')}</span>
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
                {f === 'all' ? t('edgeAtlas.allFx') : f === 'majors' ? t('edgeAtlas.majors') : t('edgeAtlas.crosses')}
              </button>
            ))}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs"><strong>{t('edgeAtlas.majors')}:</strong> {t('edgeAtlas.majorsTooltip')}<br /><strong>{t('edgeAtlas.crosses')}:</strong> {t('edgeAtlas.crossesTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Context note */}
        <p className="text-xs text-muted-foreground/70 mb-4 pl-1 italic">
          {t(TAB_DESC_KEYS[activeTab])}
        </p>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
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
            {t('edgeAtlas.noData')}
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
            {rankings.map((r, i) => {
              const isLowSample = r.total_trades < CONFIDENCE_THRESHOLD;
              const isTop3 = i < 3;
              const screenerId = PATTERN_ID_TO_SCREENER[r.pattern_id] || r.pattern_id;
              const liveCount = liveCountMap[`${screenerId}|${r.timeframe}`] || 0;
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
                        <button onClick={() => handlePatternClick(r)} className="font-semibold text-sm truncate hover:text-primary hover:underline underline-offset-2 transition-colors text-left">{t(`patternNames.${r.pattern_name}`, r.pattern_name)}</button>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 shrink-0">
                          {TF_LABEL[r.timeframe] || r.timeframe}
                        </Badge>
                        {isLowSample && (
                          <span className="text-[10px] text-yellow-500">⚠️ {t('edgeAtlas.lowSample')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span>{t('edgeAtlas.win')} <span className={`font-medium ${r.win_rate_pct >= 55 ? 'text-green-500' : r.win_rate_pct >= 45 ? 'text-foreground' : 'text-muted-foreground'}`}>{r.win_rate_pct}%</span></span>
                        <span>{t('edgeAtlas.expect')} <span className="font-mono text-green-500">{r.expectancy_r.toFixed(3)}R</span></span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <span className="cursor-help">{t('edgeAtlas.rot', 'ROT')} <span className={`font-mono ${(r.avg_bars > 0 ? r.expectancy_r / r.avg_bars : 0) >= 0.01 ? 'text-amber-400' : 'text-muted-foreground'}`}>{r.avg_bars > 0 ? (r.expectancy_r / r.avg_bars).toFixed(4) : '—'}{t('edgeAtlas.rPerBar', 'R/bar')}</span></span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm whitespace-normal">
                               <p className="text-xs"><strong>{t('edgeAtlas.returnOnTime', 'Return on Time')}</strong> — {t('edgeAtlas.rotTooltip', 'R earned per bar of capital exposure. Higher = more capital-efficient edge. Measures how quickly the pattern converts risk into return.')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="hidden sm:inline">{r.trades_per_year.toFixed(0)} {t('edgeAtlas.tradesPerYear')}</span>
                        <span className="text-muted-foreground/60">n={r.total_trades.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Est Annual */}
                  <div className="shrink-0 text-right sm:text-left sm:w-20">
                    <div className={`text-lg font-bold ${r.est_annualized_pct >= 20 ? 'text-green-400' : r.est_annualized_pct >= 8 ? 'text-green-500' : 'text-green-600'}`}>
                      +{r.est_annualized_pct.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">{t('edgeAtlas.estAnnual')}</div>
                  </div>

                  {/* CTAs */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleFindSignals(r)}>
                      <Zap className="h-3 w-3" />
                      {t('edgeAtlas.liveSetups')}
                      <span className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                        liveCount > 0
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {liveCount}
                      </span>
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => handleBacktest(r)}>
                      <FlaskConical className="h-3 w-3" />
                      {t('edgeAtlas.validate')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && rankings.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6" dangerouslySetInnerHTML={{ __html: t('edgeAtlas.footerNote') }} />
        )}
      </div>
    </section>
  );
}
