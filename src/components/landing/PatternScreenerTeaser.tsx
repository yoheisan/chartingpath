import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import { TeaserSignalsTable } from '@/components/screener/TeaserSignalsTable';
import { useTranslation } from 'react-i18next';
import type { LiveSetup } from '@/types/screener';
import { GRADE_ORDER, getPatternGrade } from '@/types/screener';
import { filterActiveTradesOnly } from '@/utils/tradeOutcomeFilter';
import FullChartViewer from '@/components/charts/FullChartViewer';
import type { SetupWithVisuals, PatternQuality, VisualSpec } from '@/types/VisualSpec';
import { toast } from 'sonner';
import { usePlanGate } from '@/hooks/usePlanGate';

type TeaserAssetType = 'stocks' | 'fx' | 'crypto' | 'commodities';

const ASSET_TAB_KEYS: { value: TeaserAssetType; i18nKey: string; universe: number }[] = [
  { value: 'stocks', i18nKey: 'patternScreenerTeaser.stocks', universe: 250 },
  { value: 'fx', i18nKey: 'patternScreenerTeaser.forex', universe: 87 },
  { value: 'crypto', i18nKey: 'patternScreenerTeaser.crypto', universe: 97 },
  { value: 'commodities', i18nKey: 'patternScreenerTeaser.commodities', universe: 28 },
];

const MAX_TEASER_ITEMS = 12;

interface PatternDetailsResponse {
  success: boolean;
  pattern?: any;
  error?: string;
}

/** Map a DB row from live_pattern_detections into a LiveSetup */
function rowToLiveSetup(row: any): LiveSetup {
  const histPerf = row.historical_performance as any;
  return {
    dbId: row.id,
    instrument: row.instrument,
    patternId: row.pattern_id,
    patternName: row.pattern_name,
    direction: row.direction as 'long' | 'short',
    signalTs: row.first_detected_at,
    quality: {
      score: row.quality_score || 'C',
      grade: row.quality_score || 'C',
      reasons: row.quality_reasons || [],
    },
    tradePlan: {
      entry: row.entry_price,
      stopLoss: row.stop_loss_price,
      takeProfit: row.take_profit_price,
      rr: row.risk_reward_ratio,
    },
    currentPrice: row.current_price,
    prevClose: row.prev_close,
    changePercent: row.change_percent,
    trendAlignment: row.trend_alignment,
    trendIndicators: row.trend_indicators as any,
    historicalPerformance: histPerf ? {
      winRate: histPerf.winRate ?? histPerf.win_rate ?? 0,
      avgRMultiple: histPerf.avgRMultiple ?? histPerf.avg_r_multiple ?? 0,
      sampleSize: histPerf.sampleSize ?? histPerf.sample_size ?? 0,
      profitFactor: histPerf.profitFactor ?? histPerf.profit_factor,
      avgDurationBars: histPerf.avgDurationBars ?? histPerf.avg_duration_bars,
    } : undefined,
  };
}

/** Build a minimal VisualSpec fallback when full data hasn't loaded yet */
function buildFallbackVisualSpec(setup: LiveSetup): VisualSpec {
  const entry = setup.tradePlan.entry;
  return {
    version: '2.0.0',
    symbol: setup.instrument,
    timeframe: '4h',
    patternId: setup.patternId,
    signalTs: setup.signalTs,
    window: { startTs: setup.signalTs, endTs: setup.signalTs },
    yDomain: { min: Math.min(entry, setup.tradePlan.stopLoss) * 0.99, max: Math.max(entry, setup.tradePlan.takeProfit) * 1.01 },
    overlays: [],
  };
}

/** Convert LiveSetup → SetupWithVisuals for the FullChartViewer */
function toSetupWithVisuals(setup: LiveSetup): SetupWithVisuals {
  const visualSpec = setup.visualSpec || buildFallbackVisualSpec(setup);
  return {
    dbId: setup.dbId,
    instrument: setup.instrument,
    patternId: setup.patternId,
    patternName: setup.patternName,
    direction: setup.direction,
    signalTs: setup.signalTs,
    quality: setup.quality as PatternQuality,
    tradePlan: {
      entryType: setup.tradePlan.entryType || 'bar_close',
      entry: setup.tradePlan.entry,
      stopLoss: setup.tradePlan.stopLoss,
      takeProfit: setup.tradePlan.takeProfit,
      rr: setup.tradePlan.rr,
      stopDistance: setup.tradePlan.stopDistance || Math.abs(setup.tradePlan.entry - setup.tradePlan.stopLoss),
      tpDistance: setup.tradePlan.tpDistance || Math.abs(setup.tradePlan.takeProfit - setup.tradePlan.entry),
      timeStopBars: setup.tradePlan.timeStopBars || 100,
      bracketLevelsVersion: setup.tradePlan.bracketLevelsVersion || '1.0.0',
      priceRounding: setup.tradePlan.priceRounding || { priceDecimals: 2, rrDecimals: 1 },
    },
    bars: Array.isArray(setup.bars) ? setup.bars : [],
    visualSpec,
  };
}

/** Map API detail response back to LiveSetup */
function mapApiResponseToLiveSetup(pattern: any): LiveSetup {
  return {
    dbId: pattern.id,
    instrument: pattern.instrument,
    patternId: pattern.pattern_id || pattern.patternId,
    patternName: pattern.pattern_name || pattern.patternName,
    direction: pattern.direction,
    signalTs: pattern.first_detected_at || pattern.signalTs,
    quality: pattern.quality || {
      score: pattern.quality_score || 'C',
      grade: pattern.quality_score || 'C',
      reasons: pattern.quality_reasons || [],
    },
    tradePlan: pattern.trade_plan || pattern.tradePlan || {
      entry: pattern.entry_price,
      stopLoss: pattern.stop_loss_price,
      takeProfit: pattern.take_profit_price,
      rr: pattern.risk_reward_ratio,
    },
    bars: pattern.bars,
    visualSpec: pattern.visual_spec || pattern.visualSpec,
    currentPrice: pattern.current_price || pattern.currentPrice,
    trendAlignment: pattern.trend_alignment || pattern.trendAlignment,
    trendIndicators: pattern.trend_indicators || pattern.trendIndicators,
    historicalPerformance: pattern.historical_performance || pattern.historicalPerformance,
  };
}

/** Timeout wrapper */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function PatternScreenerTeaser() {
  const { t } = useTranslation();
  const [patternsByAsset, setPatternsByAsset] = useState<Record<TeaserAssetType, LiveSetup[]>>({
    stocks: [], fx: [], crypto: [], commodities: [],
  });
  const [totalCounts, setTotalCounts] = useState<Record<TeaserAssetType, number>>({
    stocks: 0, fx: 0, crypto: 0, commodities: 0,
  });
  const [loading, setLoading] = useState<Record<TeaserAssetType, boolean>>({
    stocks: true, fx: true, crypto: true, commodities: true,
  });
  const [activeTab, setActiveTab] = useState<TeaserAssetType>('stocks');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Chart viewer state
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedSetup, setSelectedSetup] = useState<SetupWithVisuals | null>(null);
  const [loadingChartDetails, setLoadingChartDetails] = useState(false);
  const chartDetailsRequestIdRef = useRef(0);

  useEffect(() => {
    const fetchPatternsForAsset = async (assetType: TeaserAssetType) => {
      try {
        const { data, error, count } = await supabase
          .from('live_pattern_detections')
          .select('*', { count: 'exact' })
          .eq('asset_type', assetType)
          .eq('status', 'active')
          .order('quality_score', { ascending: true })
          .order('first_detected_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const allPatternsRaw = (data || []).map(rowToLiveSetup);
        // Filter out patterns where trade has already ended (SL/TP breached)
        let allPatterns = filterActiveTradesOnly(allPatternsRaw);

        // Fallback: enrich patterns missing historicalPerformance from the materialized view
        const needsEnrichment = allPatterns.filter(p => !p.historicalPerformance || p.historicalPerformance.winRate === 0);
        if (needsEnrichment.length > 0) {
          const symbols = [...new Set(needsEnrichment.map(p => p.instrument))];
          const { data: mvData } = await supabase
            .from('instrument_pattern_stats_mv' as any)
            .select('symbol, pattern_id, win_rate, expectancy_r, total_trades, avg_rr')
            .in('symbol', symbols);

          if (mvData?.length) {
            const statsMap = new Map<string, any>();
            for (const row of mvData as any[]) {
              statsMap.set(`${row.symbol}|${row.pattern_id}`, row);
            }
            allPatterns = allPatterns.map(p => {
              if (p.historicalPerformance && p.historicalPerformance.winRate > 0) return p;
              const stat = statsMap.get(`${p.instrument}|${p.patternId}`);
              if (!stat || stat.total_trades < 5) return p;
              return {
                ...p,
                historicalPerformance: {
                  winRate: stat.win_rate,
                  avgRMultiple: stat.expectancy_r ?? stat.avg_rr ?? 0,
                  sampleSize: stat.total_trades,
                },
              };
            });
          }
        }

        const dedupeKey = (p: LiveSetup) => {
          const baseSymbol = p.instrument.replace(/L$/, '');
          return `${baseSymbol}|${p.patternName}`;
        };
        const seenPatterns = new Map<string, LiveSetup>();
        for (const pattern of allPatterns) {
          const key = dedupeKey(pattern);
          const existing = seenPatterns.get(key);
          if (!existing) {
            seenPatterns.set(key, pattern);
          } else {
            const existingGrade = GRADE_ORDER[getPatternGrade(existing)] || 3;
            const newGrade = GRADE_ORDER[getPatternGrade(pattern)] || 3;
            if (newGrade < existingGrade ||
                (newGrade === existingGrade && (pattern.historicalPerformance?.winRate ?? 0) > (existing.historicalPerformance?.winRate ?? 0))) {
              seenPatterns.set(key, pattern);
            }
          }
        }

        const sorted = [...seenPatterns.values()].sort((a, b) => {
          const gradeA = GRADE_ORDER[getPatternGrade(a)] || 3;
          const gradeB = GRADE_ORDER[getPatternGrade(b)] || 3;
          if (gradeA !== gradeB) return gradeA - gradeB;
          return (b.historicalPerformance?.winRate ?? 0) - (a.historicalPerformance?.winRate ?? 0);
        });

        setPatternsByAsset(prev => ({ ...prev, [assetType]: sorted.slice(0, MAX_TEASER_ITEMS) }));
        setTotalCounts(prev => ({ ...prev, [assetType]: count || allPatterns.length }));

        if (assetType === 'stocks' && data?.length) {
          setLastScanned(data[0].updated_at || new Date().toISOString());
        }
      } catch (err) {
        console.error(`Failed to fetch ${assetType} patterns:`, err);
      } finally {
        setLoading(prev => ({ ...prev, [assetType]: false }));
      }
    };

    ASSET_TAB_KEYS.forEach(tab => fetchPatternsForAsset(tab.value));
  }, []);

  /** Open chart viewer for a setup — lazy-load full bars/VisualSpec */
  const handleOpenChart = useCallback(async (setup: LiveSetup) => {
    const requestId = ++chartDetailsRequestIdRef.current;

    trackEvent('teaser.open_chart', { instrument: setup.instrument, patternId: setup.patternId });

    setChartOpen(true);
    setLoadingChartDetails(true);
    setSelectedSetup(toSetupWithVisuals(setup));

    try {
      const hasBars = Array.isArray(setup.bars) && setup.bars.length > 0;
      if (hasBars) return;

      if (!setup.dbId) {
        console.warn('[TeaserChart] Missing dbId; cannot load detailed chart data');
        return;
      }

      const timeouts = [25_000, 45_000] as const;
      let lastErr: any = null;

      for (let i = 0; i < timeouts.length; i++) {
        try {
          const res = await withTimeout(
            supabase.functions.invoke<PatternDetailsResponse>('get-live-pattern-details', {
              body: { id: setup.dbId },
            }),
            timeouts[i],
            'get-live-pattern-details'
          );

          if (res.error) throw res.error;
          if (!res.data?.success || !res.data.pattern) {
            throw new Error(res.data?.error || 'Failed to load pattern details');
          }

          if (chartDetailsRequestIdRef.current !== requestId) return;

          setSelectedSetup(toSetupWithVisuals(mapApiResponseToLiveSetup(res.data.pattern)));
          return;
        } catch (err: any) {
          lastErr = err;
          if (i < timeouts.length - 1) {
            await new Promise(r => setTimeout(r, 750));
          }
        }
      }

      throw lastErr;
    } catch (err: any) {
      console.error('[TeaserChart] Failed to load chart details:', err?.message || err);
    } finally {
      if (chartDetailsRequestIdRef.current === requestId) {
        setLoadingChartDetails(false);
      }
    }
  }, []);

  const currentTotal = totalCounts[activeTab];
  const activeTabConfig = ASSET_TAB_KEYS.find(t => t.value === activeTab);

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-12 px-6 bg-muted/20 min-h-[500px]">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge variant="outline" className="text-primary border-primary/50">
              <Zap className="h-3 w-3 mr-1" />
              {t('patternScreenerTeaser.live')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {lastScanned ? `${t('patternScreenerTeaser.updated')} ${new Date(lastScanned).toLocaleTimeString()}` : t('patternScreenerTeaser.justNow')}
            </span>
          </div>
          <h2 className="text-2xl font-bold">{t('patternScreenerTeaser.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('patternScreenerTeaser.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TeaserAssetType)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            {ASSET_TAB_KEYS.map(tab => {
              const count = totalCounts[tab.value];
              const isActive = activeTab === tab.value;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="text-sm gap-1.5">
                  {t(tab.i18nKey)}
                  {!loading[tab.value] && (
                    <span className={`text-sm font-mono ${
                      isActive
                        ? 'opacity-70'
                        : count > 0 ? 'text-green-500' : 'text-muted-foreground/50'
                    }`}>
                      {count}/{tab.universe}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ASSET_TAB_KEYS.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {loading[tab.value] ? (
                <LoadingSkeleton />
              ) : patternsByAsset[tab.value].length > 0 ? (
                <div className="rounded-lg border bg-card overflow-hidden">
                  <TeaserSignalsTable
                    patterns={patternsByAsset[tab.value]}
                    onOpenChart={handleOpenChart}
                  />
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-8 text-center">
                  <p className="text-muted-foreground">{t('patternScreenerTeaser.noActivePatterns', { label: t(tab.i18nKey) })}</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* CTA */}
        <div className="text-center">
          <Link to="/patterns/live" onClick={() => trackEvent('landing.cta_click', { button: 'screener_teaser_view_all', asset_type: activeTab, total: currentTotal })}>
            <Button size="lg" className="px-8">
              {currentTotal > MAX_TEASER_ITEMS
                ? t('patternScreenerTeaser.viewAllSignals', { count: currentTotal, label: activeTabConfig ? t(activeTabConfig.i18nKey) : '' })
                : t('patternScreenerTeaser.openFullScreener')
              }
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            {t('patternScreenerTeaser.filterHint')}
          </p>
        </div>
      </div>

      {/* Inline Chart Viewer Dialog */}
      <FullChartViewer
        open={chartOpen}
        onOpenChange={setChartOpen}
        setup={selectedSetup}
        loading={loadingChartDetails}
        onCreateAlert={() => {
          toast.info(t('patternScreenerTeaser.signUpForAlerts', 'Sign up to create alerts'));
        }}
        isCreatingAlert={false}
      />
    </section>
  );
}
