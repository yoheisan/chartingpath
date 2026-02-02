import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, TrendingUp, TrendingDown, Zap, Clock, Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

// Grade ordering for sorting (A=1, B=2, etc.)
const GRADE_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, F: 5 };

const getPatternGrade = (setup: LiveSetup): string => {
  return setup.quality?.grade || setup.quality?.score || 'C';
};

const MAX_TEASER_ITEMS = 10;

/**
 * Homepage teaser version of the screener.
 * Shows top 10 signals sorted by grade + win rate.
 * No filters, minimal UI, strong CTA to full screener.
 */
export function PatternScreenerTeaser() {
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Fetch patterns on mount
  useEffect(() => {
    const fetchPatterns = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fnError } = await withTimeout(
          supabase.functions.invoke('scan-live-patterns', {
            body: { 
              assetType: 'stocks',
              timeframe: '1d',
              forceRefresh: false,
            },
          }),
          25000
        );

        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || 'Failed to fetch patterns');

        const allPatterns = data.patterns || [];
        setTotalCount(allPatterns.length);
        setLastScanned(data.scannedAt || new Date().toISOString());
        
        // Sort by grade (A first) then by win rate (highest first)
        const sorted = [...allPatterns].sort((a, b) => {
          const gradeA = GRADE_ORDER[getPatternGrade(a)] || 3;
          const gradeB = GRADE_ORDER[getPatternGrade(b)] || 3;
          if (gradeA !== gradeB) return gradeA - gradeB;
          
          const winA = a.historicalPerformance?.winRate ?? 0;
          const winB = b.historicalPerformance?.winRate ?? 0;
          return winB - winA;
        });
        
        setPatterns(sorted.slice(0, MAX_TEASER_ITEMS));
      } catch (err) {
        console.error('Failed to fetch patterns:', err);
        setError('Unable to load patterns');
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  // Top patterns for display
  const topPatterns = useMemo(() => patterns, [patterns]);

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

  if (loading) {
    return (
      <section className="py-12 px-6 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge variant="outline" className="text-primary border-primary/50 animate-pulse mb-3">
              <Zap className="h-3 w-3 mr-1" />
              Loading...
            </Badge>
            <h2 className="text-2xl font-bold">Top Pattern Signals</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Scanning for high-quality setups...
            </p>
          </div>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-6 bg-muted/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-2">Pattern Screener</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/patterns/live">
            <Button>
              View Full Screener
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    );
  }

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
            Highest-graded setups from {totalCount > 0 ? totalCount : 'our'} active patterns
          </p>
        </div>

        {/* Signals Table */}
        {topPatterns.length > 0 ? (
          <div className="rounded-lg border bg-card overflow-hidden mb-6">
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
                {topPatterns.map((setup, idx) => {
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
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center mb-6">
            <p className="text-muted-foreground">No active patterns detected right now.</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Link to="/patterns/live">
            <Button size="lg" className="px-8">
              {totalCount > MAX_TEASER_ITEMS 
                ? `View All ${totalCount} Signals` 
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
