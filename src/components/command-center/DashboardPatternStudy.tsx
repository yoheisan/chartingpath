import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { AUTH_REQUIRED_TIMEFRAMES } from './CommandCenterChart';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GradeBadge } from '@/components/ui/GradeBadge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  CalendarDays,
  CheckCircle,
  XCircle,
  Timer,
  Clock,
  ChevronDown,
  Play,
  Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { PATTERN_DISPLAY_NAMES } from '@/hooks/useScreenerCaps';
import { CompressedBar, VisualSpec, SetupWithVisuals } from '@/types/VisualSpec';
const ThumbnailChart = lazy(() => import('@/components/charts/ThumbnailChart'));
import { PatternOccurrence } from './PatternOccurrencesPanel';

interface HistoricalPattern {
  id: string;
  pattern_id: string;
  pattern_name: string;
  direction: string;
  detected_at: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  quality_score: string | null;
  quality_reasons: string[] | null;
  outcome: string | null;
  outcome_pnl_percent: number | null;
  bars_to_outcome: number | null;
  visual_spec: VisualSpec;
  bars: CompressedBar[];
}

interface ActivePattern {
  id: string;
  pattern_id: string;
  pattern_name: string;
  direction: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  quality_score: string | null;
  visual_spec: VisualSpec;
  bars: CompressedBar[];
  first_detected_at: string;
}

interface DashboardPatternStudyProps {
  symbol: string;
  timeframe: string;
  onPatternSelect?: (pattern: PatternOccurrence) => void;
  selectedPatternId?: string | null;
  /** When false, skip data fetching (panel is hidden) */
  active?: boolean;
}

export function DashboardPatternStudy({
  symbol,
  timeframe,
  onPatternSelect,
  selectedPatternId,
  active = true,
}: DashboardPatternStudyProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [historicalPatterns, setHistoricalPatterns] = useState<HistoricalPattern[]>([]);
  const [activePatterns, setActivePatterns] = useState<ActivePattern[]>([]);
  const [activePatternsOpen, setActivePatternsOpen] = useState(true);
  // Track last fetched key to avoid redundant refetches on panel toggle
  const [lastFetchedKey, setLastFetchedKey] = useState<string | null>(null);

  const timeframeLabel = timeframe.toUpperCase();

  const currentFetchKey = `${symbol}|${timeframe}|${user?.id ?? 'anon'}`;

  // Fetch data — skip when panel is inactive (hidden) or auth-gated
  // Don't refetch if we already have data for the same symbol/timeframe
  useEffect(() => {
    if (!active) {
      return; // Panel hidden — don't fetch
    }
    if (AUTH_REQUIRED_TIMEFRAMES.has(timeframe) && !user) {
      setLoading(false);
      setHistoricalPatterns([]);
      setActivePatterns([]);
      setLastFetchedKey(null);
      return;
    }

    // Skip refetch if we already loaded this exact combination
    if (lastFetchedKey === currentFetchKey) {
      return;
    }

    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      console.log('[DashboardPatternStudy] fetchData START', { symbol, timeframe });
      try {
        // Fetch active and historical in parallel
        const [activeRes, historicalRes] = await Promise.all([
          supabase
            .from('live_pattern_detections')
            .select('id, pattern_id, pattern_name, direction, first_detected_at, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, visual_spec, bars')
            .eq('instrument', symbol)
            .eq('timeframe', timeframe)
            .eq('status', 'active')
            .order('first_detected_at', { ascending: false })
            .limit(10),
          supabase
            .from('historical_pattern_occurrences')
            .select('id, pattern_id, pattern_name, direction, detected_at, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, quality_reasons, outcome, outcome_pnl_percent, bars_to_outcome, visual_spec, bars, validation_status')
            .eq('symbol', symbol)
            .eq('timeframe', timeframe)
            .in('validation_status', ['confirmed', 'pending'])
            .order('detected_at', { ascending: false })
            .limit(50),
        ]);

        if (cancelled) return;
        console.log('[DashboardPatternStudy] fetchData OK', {
          active: activeRes.data?.length ?? 0,
          activeError: activeRes.error?.message,
          historical: historicalRes.data?.length ?? 0,
          historicalError: historicalRes.error?.message,
        });

        if (activeRes.data) {
          setActivePatterns(activeRes.data.map((p: any) => ({
            ...p,
            bars: (p.bars || []).map((b: any) => ({
              t: b.t || b.date,
              o: b.o ?? b.open,
              h: b.h ?? b.high,
              l: b.l ?? b.low,
              c: b.c ?? b.close,
              v: b.v ?? b.volume ?? 0,
            })),
            visual_spec: p.visual_spec as VisualSpec,
          })));
        }

        if (historicalRes.data) {
          setHistoricalPatterns(historicalRes.data.map((p: any) => ({
            ...p,
            bars: (p.bars || []).map((b: any) => ({
              t: b.t || b.date,
              o: b.o ?? b.open,
              h: b.h ?? b.high,
              l: b.l ?? b.low,
              c: b.c ?? b.close,
              v: b.v ?? b.volume ?? 0,
            })),
            visual_spec: p.visual_spec as VisualSpec,
          })));
        }

        if (!cancelled) {
          setLastFetchedKey(currentFetchKey);
        }
      } catch (err) {
        console.error('[DashboardPatternStudy] Error:', err);
      } finally {
        if (!cancelled) {
          console.log('[DashboardPatternStudy] setLoading(false)');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [symbol, timeframe, user, active, currentFetchKey, lastFetchedKey]);

  // Performance stats
  const stats = useMemo(() => {
    const withOutcome = historicalPatterns.filter(p => p.outcome && p.outcome !== 'pending');
    const wins = withOutcome.filter(p => p.outcome === 'hit_tp');
    const losses = withOutcome.filter(p => p.outcome === 'hit_sl');
    const winRate = withOutcome.length > 0 ? (wins.length / withOutcome.length) * 100 : 0;

    const totalWinPnl = wins.reduce((s, p) => s + Math.abs(p.outcome_pnl_percent || 0), 0);
    const totalLossPnl = losses.reduce((s, p) => s + Math.abs(p.outcome_pnl_percent || 0), 0);
    const totalPnl = withOutcome.reduce((s, p) => s + (p.outcome_pnl_percent || 0), 0);
    const avgPnl = withOutcome.length > 0 ? totalPnl / withOutcome.length : 0;
    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? Infinity : 0;

    return {
      totalPatterns: historicalPatterns.length,
      activePatterns: activePatterns.length,
      sampleSize: withOutcome.length,
      winRate,
      avgPnl,
      totalPnl,
      profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
      wins: wins.length,
      losses: losses.length,
    };
  }, [historicalPatterns, activePatterns]);

  const handlePatternClick = useCallback((pattern: HistoricalPattern | ActivePattern, isActive: boolean) => {
    if (!onPatternSelect) return;
    const detected_at = 'detected_at' in pattern ? pattern.detected_at : pattern.first_detected_at;
    onPatternSelect({
      id: pattern.id,
      pattern_name: pattern.pattern_name,
      direction: pattern.direction,
      detected_at,
      entry_price: pattern.entry_price,
      stop_loss_price: pattern.stop_loss_price,
      take_profit_price: pattern.take_profit_price,
      risk_reward_ratio: pattern.risk_reward_ratio,
      quality_score: pattern.quality_score,
      outcome: 'outcome' in pattern ? pattern.outcome : undefined,
      outcome_pnl_percent: 'outcome_pnl_percent' in pattern ? pattern.outcome_pnl_percent : undefined,
      isActive,
    });
  }, [onPatternSelect]);

  const handleReplay = useCallback((pattern: HistoricalPattern) => {
    const displaySymbol = symbol.replace('=X', '').replace('=F', '').replace('-USD', '').toUpperCase();
    const setup: SetupWithVisuals = {
      instrument: displaySymbol,
      patternId: pattern.pattern_id,
      patternName: PATTERN_DISPLAY_NAMES[pattern.pattern_id] || pattern.pattern_name,
      direction: pattern.direction === 'bullish' ? 'long' : pattern.direction as 'long' | 'short',
      signalTs: pattern.detected_at,
      quality: {
        score: pattern.quality_score === 'A' ? 9 : pattern.quality_score === 'B' ? 7 : pattern.quality_score === 'C' ? 5 : 3,
        grade: (pattern.quality_score || 'B') as 'A' | 'B' | 'C' | 'D' | 'F',
        confidence: 75,
        reasons: pattern.quality_reasons || [],
        warnings: [],
        tradeable: true,
      },
      tradePlan: {
        entryType: 'market',
        entry: pattern.entry_price,
        stopLoss: pattern.stop_loss_price,
        takeProfit: pattern.take_profit_price,
        rr: pattern.risk_reward_ratio,
        stopDistance: Math.abs(pattern.entry_price - pattern.stop_loss_price),
        tpDistance: Math.abs(pattern.take_profit_price - pattern.entry_price),
        timeStopBars: 100,
        bracketLevelsVersion: '1.0',
        priceRounding: { priceDecimals: 2, rrDecimals: 1 },
      },
      bars: pattern.bars,
      visualSpec: pattern.visual_spec,
      outcome: pattern.outcome === 'hit_tp' ? 'hit_tp' : pattern.outcome === 'hit_sl' ? 'hit_sl' : pattern.outcome === 'timeout' ? 'timeout' : null,
      barsToOutcome: pattern.bars_to_outcome,
    };

    // Load into inline chart via onPatternSelect
    if (onPatternSelect) {
      handlePatternClick(pattern, false);
    }
  }, [symbol, onPatternSelect, handlePatternClick]);

  const getOutcomeIcon = (outcome: string | null) => {
    switch (outcome) {
      case 'hit_tp': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case 'hit_sl': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'timeout': return <Timer className="h-3.5 w-3.5 text-amber-500" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getOutcomeLabel = (outcome: string | null) => {
    switch (outcome) {
      case 'hit_tp': return 'Target Hit';
      case 'hit_sl': return 'Stop Hit';
      case 'timeout': return 'Timeout';
      case 'pending': return 'Pending';
      default: return '—';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" data-capture-target>
      {/* Active Patterns Section */}
      {activePatterns.length > 0 && (
        <Card className="border-primary/50">
          <Collapsible open={activePatternsOpen} onOpenChange={setActivePatternsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <CardTitle className="text-lg">
                      {t('commandCenter.activePatterns', { count: activePatterns.length })}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {timeframeLabel}
                    </Badge>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    activePatternsOpen && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activePatterns.map((pattern) => (
                    <Card
                      key={pattern.id}
                      className={cn(
                        "cursor-pointer hover:border-primary/50 transition-colors",
                        selectedPatternId === pattern.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handlePatternClick(pattern, true)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={pattern.direction === 'bullish' || pattern.direction === 'long' ? 'default' : 'destructive'}>
                            {pattern.direction === 'bullish' || pattern.direction === 'long' ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {PATTERN_DISPLAY_NAMES[pattern.pattern_id] || pattern.pattern_name}
                          </Badge>
                          <GradeBadge grade={pattern.quality_score} variant="pill" size="sm" showTooltip={false} />
                        </div>
                        <div className="h-24">
                          <Suspense fallback={<Skeleton className="h-full w-full" />}>
                            <ThumbnailChart
                              bars={pattern.bars}
                              visualSpec={pattern.visual_spec}
                              height={96}
                            />
                          </Suspense>
                        </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">{t('commandCenter.entry')}</p>
                            <p className="font-medium">${pattern.entry_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('commandCenter.target')}</p>
                            <p className="font-medium text-emerald-500">${pattern.take_profit_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('commandCenter.stop')}</p>
                            <p className="font-medium text-destructive">${pattern.stop_loss_price.toFixed(2)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t('commandCenter.performanceMetrics')}
            </CardTitle>
            {stats.sampleSize > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('commandCenter.basedOnTrades', { count: stats.sampleSize })}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xl font-bold">{stats.totalPatterns}</p>
              <p className="text-[10px] text-muted-foreground">{t('commandCenter.patterns')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xl font-bold text-primary">{stats.activePatterns}</p>
              <p className="text-[10px] text-muted-foreground">{t('commandCenter.activeNow')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className={cn("text-xl font-bold", stats.winRate >= 50 ? 'text-emerald-500' : 'text-amber-500')}>
                {stats.winRate.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground">{t('screener.winRate')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className={cn("text-xl font-bold", stats.avgPnl >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {stats.avgPnl >= 0 ? '+' : ''}{stats.avgPnl.toFixed(2)}%
              </p>
              <p className="text-[10px] text-muted-foreground">{t('commandCenter.avgPnl')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className={cn("text-xl font-bold", stats.totalPnl >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground">{t('commandCenter.totalPnl')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className={cn("text-xl font-bold", stats.profitFactor >= 1 ? 'text-emerald-500' : 'text-destructive')}>
                {stats.profitFactor.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">{t('commandCenter.profitFactor')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xl font-bold text-emerald-500">{stats.wins}</p>
              <p className="text-[10px] text-muted-foreground">{t('commandCenter.wins')}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xl font-bold text-destructive">{stats.losses}</p>
              <p className="text-[10px] text-muted-foreground">{t('commandCenter.losses')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Pattern Occurrences Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('commandCenter.historicalPatternOccurrences')}
              <Badge variant="secondary" className="text-xs">
                {timeframeLabel}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('commandCenter.patternsFound', { count: historicalPatterns.length })}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {historicalPatterns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('screener.pattern')}</TableHead>
                  <TableHead className="w-[80px]">{t('commandCenter.view')}</TableHead>
                  <TableHead className="w-[80px]">{t('commandCenter.replay')}</TableHead>
                  <TableHead>{t('commandCenter.date')}</TableHead>
                  <TableHead className="text-right">{t('commandCenter.entry')}</TableHead>
                  <TableHead className="text-right">{t('commandCenter.target')}</TableHead>
                  <TableHead className="text-right">{t('commandCenter.stop')}</TableHead>
                  <TableHead className="text-center">{t('commandCenter.rr')}</TableHead>
                  <TableHead className="text-center">{t('commandCenter.outcome')}</TableHead>
                  <TableHead className="text-right">{t('commandCenter.pnl')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalPatterns.map((pattern) => (
                  <TableRow
                    key={pattern.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedPatternId === pattern.id && "bg-primary/10"
                    )}
                    onClick={() => handlePatternClick(pattern, false)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {pattern.direction === 'bullish' || pattern.direction === 'long' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className="font-medium text-sm">
                          {PATTERN_DISPLAY_NAMES[pattern.pattern_id] || pattern.pattern_name}
                        </span>
                        <GradeBadge grade={pattern.quality_score} variant="pill" size="sm" showTooltip={false} className="text-[10px]" />
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePatternClick(pattern, false);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {t('commandCenter.view')}
                      </Button>
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReplay(pattern);
                        }}
                      >
                        <Play className="h-3.5 w-3.5 mr-1 fill-current" />
                        {t('commandCenter.replay')}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(pattern.detected_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(pattern.detected_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${pattern.entry_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-500">
                      ${pattern.take_profit_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-destructive">
                      ${pattern.stop_loss_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {pattern.risk_reward_ratio.toFixed(1)}:1
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {getOutcomeIcon(pattern.outcome)}
                        <span className="text-xs">{getOutcomeLabel(pattern.outcome)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {pattern.outcome_pnl_percent != null ? (
                        <span className={pattern.outcome_pnl_percent >= 0 ? 'text-emerald-500' : 'text-destructive'}>
                          {pattern.outcome_pnl_percent >= 0 ? '+' : ''}{pattern.outcome_pnl_percent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{t('commandCenter.noHistoricalPatternsFound')}</p>
              <p className="text-xs mt-1">{t('commandCenter.patternHistoryWillPopulate')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
