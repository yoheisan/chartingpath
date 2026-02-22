import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/utils/withTimeout';
import { TeaserSignalsTable } from '@/components/screener/TeaserSignalsTable';
import { useTranslation } from 'react-i18next';
import type { LiveSetup } from '@/types/screener';
import { GRADE_ORDER, getPatternGrade } from '@/types/screener';

type TeaserAssetType = 'stocks' | 'fx' | 'crypto' | 'commodities';

const ASSET_TAB_KEYS: { value: TeaserAssetType; i18nKey: string; universe: number }[] = [
  { value: 'stocks', i18nKey: 'patternScreenerTeaser.stocks', universe: 90 },
  { value: 'fx', i18nKey: 'patternScreenerTeaser.forex', universe: 57 },
  { value: 'crypto', i18nKey: 'patternScreenerTeaser.crypto', universe: 84 },
  { value: 'commodities', i18nKey: 'patternScreenerTeaser.commodities', universe: 25 },
];

const MAX_TEASER_ITEMS = 10;

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
        const { data, error: fnError } = await withTimeout(
          supabase.functions.invoke('scan-live-patterns', {
            body: { assetType, timeframe: '1h', forceRefresh: false },
          }),
          25000
        );

        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || 'Failed to fetch patterns');

        const allPatterns = data.patterns || [];

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

        const dedupedPatterns = [...seenPatterns.values()];

        const sorted = dedupedPatterns.sort((a, b) => {
          const gradeA = GRADE_ORDER[getPatternGrade(a)] || 3;
          const gradeB = GRADE_ORDER[getPatternGrade(b)] || 3;
          if (gradeA !== gradeB) return gradeA - gradeB;
          return (b.historicalPerformance?.winRate ?? 0) - (a.historicalPerformance?.winRate ?? 0);
        });

        setPatternsByAsset(prev => ({ ...prev, [assetType]: sorted.slice(0, MAX_TEASER_ITEMS) }));
        setTotalCounts(prev => ({ ...prev, [assetType]: allPatterns.length }));

        if (assetType === 'stocks') {
          setLastScanned(data.scannedAt || new Date().toISOString());
        }
      } catch (err) {
        console.error(`Failed to fetch ${assetType} patterns:`, err);
      } finally {
        setLoading(prev => ({ ...prev, [assetType]: false }));
      }
    };

    const fetchWithStagger = async () => {
      await fetchPatternsForAsset('stocks');
      const remainingTabs = ASSET_TAB_KEYS.filter(t => t.value !== 'stocks');
      for (let i = 0; i < remainingTabs.length; i++) {
        await new Promise(r => setTimeout(r, 200));
        fetchPatternsForAsset(remainingTabs[i].value);
      }
    };

    fetchWithStagger();
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
    <section className="py-12 px-6 bg-muted/20">
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
