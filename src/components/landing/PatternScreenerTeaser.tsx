import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, TrendingUp, TrendingDown, Zap
} from 'lucide-react';
import { formatSignalAgeSimple } from '@/utils/formatSignalAge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { cn } from '@/lib/utils';
import { withTimeout } from '@/utils/withTimeout';
import { GradeBadge } from '@/components/ui/GradeBadge';

interface LiveSetup {
  instrument: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  signalTs: string;
  quality: { score: string; grade?: string; reasons: string[] };
  tradePlan: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rr: number;
  };
  currentPrice?: number;
  prevClose?: number;
  changePercent?: number | null;
  historicalPerformance?: {
    winRate: number;
    avgRMultiple: number;
    sampleSize: number;
    profitFactor?: number;
  };
}

type AssetType = 'stocks' | 'fx' | 'crypto' | 'commodities';

const ASSET_TABS: { value: AssetType; label: string }[] = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'fx', label: 'Forex' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'commodities', label: 'Commodities' },
];

// Grade ordering for sorting (A=1, B=2, etc.)
const GRADE_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, F: 5 };

const getPatternGrade = (setup: LiveSetup): string => {
  return setup.quality?.grade || setup.quality?.score || 'C';
};

const MAX_TEASER_ITEMS = 10;

/**
 * Homepage teaser version of the screener.
 * Shows top 10 signals per asset class sorted by grade + win rate.
 * No filters, minimal UI, strong CTA to full screener.
 */
export function PatternScreenerTeaser() {
  const navigate = useNavigate();
  const [patternsByAsset, setPatternsByAsset] = useState<Record<AssetType, LiveSetup[]>>({
    stocks: [],
    fx: [],
    crypto: [],
    commodities: [],
  });
  const [totalCounts, setTotalCounts] = useState<Record<AssetType, number>>({
    stocks: 0,
    fx: 0,
    crypto: 0,
    commodities: 0,
  });
  const [loading, setLoading] = useState<Record<AssetType, boolean>>({
    stocks: true,
    fx: true,
    crypto: true,
    commodities: true,
  });
  const [activeTab, setActiveTab] = useState<AssetType>('stocks');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Fetch patterns for all asset types on mount - staggered to avoid browser connection pool exhaustion
  useEffect(() => {
    const fetchPatternsForAsset = async (assetType: AssetType) => {
      try {
        const { data, error: fnError } = await withTimeout(
          supabase.functions.invoke('scan-live-patterns', {
            body: { 
              assetType,
              timeframe: '1d',
              forceRefresh: false,
            },
          }),
          25000
        );

        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || 'Failed to fetch patterns');

        const allPatterns = data.patterns || [];
        
        // Deduplicate: For stocks like GOOG/GOOGL (same company, different share classes),
        // keep only the highest-graded entry per pattern name
        const dedupeKey = (p: LiveSetup) => {
          // Normalize instrument: strip suffix for share class variants
          const baseSymbol = p.instrument.replace(/L$/, ''); // GOOGL -> GOOG
          return `${baseSymbol}|${p.patternName}`;
        };
        
        const seenPatterns = new Map<string, LiveSetup>();
        for (const pattern of allPatterns) {
          const key = dedupeKey(pattern);
          const existing = seenPatterns.get(key);
          if (!existing) {
            seenPatterns.set(key, pattern);
          } else {
            // Keep the one with better grade, or higher win rate if same grade
            const existingGrade = GRADE_ORDER[getPatternGrade(existing)] || 3;
            const newGrade = GRADE_ORDER[getPatternGrade(pattern)] || 3;
            if (newGrade < existingGrade || 
                (newGrade === existingGrade && (pattern.historicalPerformance?.winRate ?? 0) > (existing.historicalPerformance?.winRate ?? 0))) {
              seenPatterns.set(key, pattern);
            }
          }
        }
        
        const dedupedPatterns = [...seenPatterns.values()];
        
        // Sort by grade (A first) then by win rate (highest first)
        const sorted = dedupedPatterns.sort((a: LiveSetup, b: LiveSetup) => {
          const gradeA = GRADE_ORDER[getPatternGrade(a)] || 3;
          const gradeB = GRADE_ORDER[getPatternGrade(b)] || 3;
          if (gradeA !== gradeB) return gradeA - gradeB;
          
          const winA = a.historicalPerformance?.winRate ?? 0;
          const winB = b.historicalPerformance?.winRate ?? 0;
          return winB - winA;
        });
        
        setPatternsByAsset(prev => ({
          ...prev,
          [assetType]: sorted.slice(0, MAX_TEASER_ITEMS),
        }));
        setTotalCounts(prev => ({
          ...prev,
          [assetType]: dedupedPatterns.length, // Show deduped count
        }));
        setTotalCounts(prev => ({
          ...prev,
          [assetType]: allPatterns.length,
        }));
        
        if (assetType === 'stocks') {
          setLastScanned(data.scannedAt || new Date().toISOString());
        }
      } catch (err) {
        console.error(`Failed to fetch ${assetType} patterns:`, err);
      } finally {
        setLoading(prev => ({ ...prev, [assetType]: false }));
      }
    };

    // Stagger requests to avoid browser connection pool exhaustion
    // Fetch the active tab first, then others with delays
    const fetchWithStagger = async () => {
      // Fetch stocks first (default/most common tab)
      await fetchPatternsForAsset('stocks');
      
      // Stagger remaining fetches with small delays to prevent ERR_ABORTED
      const remainingTabs = ASSET_TABS.filter(t => t.value !== 'stocks');
      for (let i = 0; i < remainingTabs.length; i++) {
        await new Promise(r => setTimeout(r, 200)); // 200ms delay between each
        fetchPatternsForAsset(remainingTabs[i].value); // Fire without awaiting
      }
    };
    
    fetchWithStagger();
  }, []);

  const currentPatterns = patternsByAsset[activeTab];
  const currentLoading = loading[activeTab];
  const currentTotal = totalCounts[activeTab];

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

  const SignalsTable = ({ patterns }: { patterns: LiveSetup[] }) => (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="whitespace-nowrap">Symbol</TableHead>
          <TableHead className="whitespace-nowrap">Pattern</TableHead>
          <TableHead className="text-center whitespace-nowrap">Grade</TableHead>
          <TableHead className="whitespace-nowrap">Signal</TableHead>
          <TableHead className="text-right whitespace-nowrap">Win Rate</TableHead>
          <TableHead className="text-right whitespace-nowrap">Age</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patterns.map((setup, idx) => {
          const isLong = setup.direction === 'long';
          const signalAge = formatSignalAgeSimple(setup.signalTs);
          const winRate = setup.historicalPerformance?.winRate;
          
          return (
            <TableRow 
              key={`${setup.instrument}-${setup.patternId}-${idx}`}
              className="hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <InstrumentLogo instrument={setup.instrument} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {setup.patternName}
              </TableCell>
              <TableCell className="text-center">
                <GradeBadge quality={setup.quality} />
              </TableCell>
              <TableCell>
                <Badge 
                  variant={isLong ? 'default' : 'destructive'}
                  className={cn(
                    'text-xs',
                    isLong 
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30' 
                      : 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30'
                  )}
                >
                  {isLong ? (
                    <><TrendingUp className="h-3 w-3 mr-1" /> Long</>
                  ) : (
                    <><TrendingDown className="h-3 w-3 mr-1" /> Short</>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {winRate != null ? (
                  <span className={cn(
                    'font-mono font-medium',
                    winRate >= 50 ? 'text-green-500' : winRate >= 40 ? 'text-yellow-500' : 'text-muted-foreground'
                  )}>
                    {winRate.toFixed(0)}%
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {signalAge}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <section className="py-12 px-6 bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge variant="outline" className="text-primary border-primary/50">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
            <span className="text-xs text-muted-foreground">
              {lastScanned ? `Updated ${new Date(lastScanned).toLocaleTimeString()}` : 'Just now'}
            </span>
          </div>
          <h2 className="text-2xl font-bold">Top Pattern Signals</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Highest-graded setups across markets
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetType)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            {ASSET_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
                {!loading[tab.value] && totalCounts[tab.value] > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                    {totalCounts[tab.value]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {ASSET_TABS.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {loading[tab.value] ? (
                <LoadingSkeleton />
              ) : patternsByAsset[tab.value].length > 0 ? (
                <div className="rounded-lg border bg-card overflow-hidden">
                  <SignalsTable patterns={patternsByAsset[tab.value]} />
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-8 text-center">
                  <p className="text-muted-foreground">No active patterns in {tab.label} right now.</p>
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
                ? `View All ${currentTotal} ${ASSET_TABS.find(t => t.value === activeTab)?.label} Signals` 
                : 'Open Full Screener'
              }
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            Filter by asset class, timeframe, grade, and more
          </p>
        </div>
      </div>
    </section>
  );
}
