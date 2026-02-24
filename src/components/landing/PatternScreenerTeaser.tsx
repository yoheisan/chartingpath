import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TeaserSignalsTable } from '@/components/screener/TeaserSignalsTable';
import { useTranslation } from 'react-i18next';
import type { LiveSetup } from '@/types/screener';
import { GRADE_ORDER, getPatternGrade } from '@/types/screener';

type TeaserAssetType = 'stocks' | 'fx' | 'crypto' | 'commodities';

const ASSET_TAB_KEYS: { value: TeaserAssetType; i18nKey: string; universe: number }[] = [
  { value: 'stocks', i18nKey: 'patternScreenerTeaser.stocks', universe: 250 },
  { value: 'fx', i18nKey: 'patternScreenerTeaser.forex', universe: 87 },
  { value: 'crypto', i18nKey: 'patternScreenerTeaser.crypto', universe: 97 },
  { value: 'commodities', i18nKey: 'patternScreenerTeaser.commodities', universe: 28 },
];

const MAX_TEASER_ITEMS = 12;

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
    } : undefined,
  };
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

  useEffect(() => {
    const fetchPatternsForAsset = async (assetType: TeaserAssetType) => {
      try {
        // Query DB-cached signals directly — no edge function compute needed
        const { data, error, count } = await supabase
          .from('live_pattern_detections')
          .select('*', { count: 'exact' })
          .eq('asset_type', assetType)
          .eq('status', 'active')
          .order('quality_score', { ascending: true })
          .order('first_detected_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const allPatterns = (data || []).map(rowToLiveSetup);

        // Deduplicate by instrument|pattern
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

    // Fetch all asset types in parallel — all are lightweight DB reads
    ASSET_TAB_KEYS.forEach(tab => fetchPatternsForAsset(tab.value));
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
      <div className="container mx-auto max-w-4xl">
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
                    <span className={`text-[10px] font-mono ${
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
                  <TeaserSignalsTable patterns={patternsByAsset[tab.value]} />
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
          <Link to="/patterns/live">
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
    </section>
  );
}
