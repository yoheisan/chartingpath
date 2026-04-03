import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import InstrumentLogo from '@/components/charts/InstrumentLogo';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface SnapshotRow {
  id: string;
  instrument: string;
  pattern_name: string;
  direction: string;
  quality_score: string | null;
  entry_price: number | null;
  risk_reward_ratio: number | null;
  first_detected_at: string;
  historical_performance: any;
}

function formatAge(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const REFRESH_MS = 60_000;

export default function LivePatternPreview() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingBestAvailable, setShowingBestAvailable] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRows = async () => {
    try {
      // First try to get Grade A and B patterns
      const { data: abData, error: abErr } = await supabase
        .from('live_pattern_detections')
        .select('id, instrument, pattern_name, direction, quality_score, entry_price, risk_reward_ratio, first_detected_at, historical_performance')
        .eq('status', 'active')
        .in('quality_score', ['A', 'B'])
        .order('first_detected_at', { ascending: false })
        .limit(3);

      if (abErr) throw abErr;

      if (abData && abData.length >= 3) {
        setRows(abData);
        setShowingBestAvailable(false);
      } else {
        // Fallback: get highest-grade available
        const { data: fallbackData, error: fbErr } = await supabase
          .from('live_pattern_detections')
          .select('id, instrument, pattern_name, direction, quality_score, entry_price, risk_reward_ratio, first_detected_at, historical_performance')
          .eq('status', 'active')
          .order('first_detected_at', { ascending: false })
          .limit(3);

        if (fbErr) throw fbErr;
        setRows(fallbackData || []);
        setShowingBestAvailable((abData?.length ?? 0) < 3);
      }
      setError(null);
    } catch (err: any) {
      console.error('[LivePatternPreview]', err);
      setError('Unable to load live patterns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    timerRef.current = setInterval(fetchRows, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Skeleton state ──
  if (loading && rows.length === 0) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-primary border-primary/50">
              <Zap className="h-3 w-3 mr-1" />
              {t('patternScreenerTeaser.live', 'LIVE')}
            </Badge>
            <Skeleton className="h-5 w-48" />
          </div>
          <Card className="overflow-hidden">
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </section>
    );
  }

  // ── Error / empty state ──
  if (error || rows.length === 0) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {error || t('livePatternPreview.noPatterns', 'No active patterns right now')}
            </p>
            <Button variant="outline" onClick={fetchRows}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('livePatternPreview.refresh', 'Refresh')}
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-muted/20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
              <Zap className="h-3 w-3 mr-1" />
              {t('patternScreenerTeaser.live', 'LIVE')}
            </Badge>
            <h2 className="text-xl font-bold">{t('livePatternPreview.title', 'Latest Pattern Detections')}</h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {t('livePatternPreview.autoRefresh', 'Auto-refreshes every 60s')}
          </span>
        </div>

        {showingBestAvailable && (
          <p className="text-xs text-muted-foreground mb-3 italic">
            {t('livePatternPreview.bestAvailable', 'Showing best available — Grade A patterns appear when detected.')}
          </p>
        )}

        {/* Read-only screener snapshot */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">{t('teaserSignals.symbol', 'Symbol')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('teaserSignals.pattern', 'Pattern')}</TableHead>
                  <TableHead className="text-center whitespace-nowrap">{t('teaserSignals.grade', 'Grade')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('teaserSignals.signal', 'Signal')}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t('teaserSignals.winRate', 'Win %')}</TableHead>
                  <TableHead className="text-right whitespace-nowrap">R:R</TableHead>
                  <TableHead className="text-right whitespace-nowrap">{t('teaserSignals.age', 'Age')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isLong = row.direction === 'long';
                  const perf = row.historical_performance as any;
                  const winRate = perf?.winRate ?? perf?.win_rate;

                  return (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      <TableCell>
                        <InstrumentLogo instrument={row.instrument} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {t(`patternNames.${row.pattern_name}`, row.pattern_name)}
                      </TableCell>
                      <TableCell className="text-center">
                        <GradeBadge quality={{ score: row.quality_score || 'C' }} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs font-medium',
                            isLong
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
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
                            winRate >= 50 ? 'text-green-500' : 'text-muted-foreground'
                          )}>
                            {Number(winRate).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.risk_reward_ratio ? row.risk_reward_ratio.toFixed(1) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatAge(row.first_detected_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Single CTA */}
        <div className="text-center mt-6">
          <Link to="/patterns/live">
            <Button
              size="lg"
              className="px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Zap className="h-5 w-5 mr-2" />
              See all live patterns — free signup
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {t('livePatternPreview.signupLine', 'Showing highest-graded active patterns. Sign up free to see all signals with full outcome data.')}
        </p>
      </div>
    </section>
  );
}