import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { SetupWithVisuals } from '@/types/VisualSpec';
import { GradeBadge } from '@/components/ui/GradeBadge';

interface HistoricalOccurrence {
  id: string;
  symbol: string;
  patternName: string;
  direction: 'long' | 'short';
  detectedAt: string;
  patternStartDate: string;
  patternEndDate: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskRewardRatio: number;
  outcome: 'win' | 'loss' | 'pending' | null;
  outcomePnlPercent: number | null;
  barsToOutcome: number | null;
  qualityScore: string;
  visualSpec: any;
  bars: any[];
  trendAlignment: 'with_trend' | 'counter_trend' | 'neutral' | null;
  trendIndicators: {
    macd_signal?: string;
    ema_trend?: string;
    rsi_zone?: string;
    adx_strength?: string;
  } | null;
}

interface HistoricalOccurrencesListProps {
  patternId: string;
  patternName: string;
  symbol?: string;
  timeframe?: string;
  direction?: 'long' | 'short';
  limit?: number;
  className?: string;
  selectedRR?: number; // User-selected R:R for display consistency
  /** Callback when an occurrence is selected for viewing */
  onSelectOccurrence?: (setup: SetupWithVisuals) => void;
  /** Enable "View in Dashboard" navigation for playback (default: true if onSelectOccurrence not provided) */
  enableDashboardNavigation?: boolean;
}

type TrendFilter = 'all' | 'with_trend' | 'counter_trend';

const DEFAULT_LIMIT = 50;

export function HistoricalOccurrencesList({ 
  patternId, 
  patternName,
  symbol,
  timeframe = '1d',
  direction,
  limit = DEFAULT_LIMIT,
  className,
  selectedRR = 2,
  onSelectOccurrence,
  enableDashboardNavigation,
}: HistoricalOccurrencesListProps) {
  const navigate = useNavigate();
  
  // Enable dashboard navigation if no callback provided (or explicitly enabled)
  const shouldNavigateToDashboard = enableDashboardNavigation ?? !onSelectOccurrence;
  const [occurrences, setOccurrences] = useState<HistoricalOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('all');
  const [stats, setStats] = useState({ 
    wins: 0, 
    losses: 0, 
    pending: 0,
    withTrend: 0,
    counterTrend: 0,
    neutral: 0,
    winRate: 0,
    withTrendWinRate: 0,
    counterTrendWinRate: 0,
    accumulatedRoi: 0,
    withTrendRoi: 0,
    counterTrendRoi: 0
  });

  useEffect(() => {
    const fetchOccurrences = async () => {
      setLoading(true);
      
      try {
        // Map direction from UI values to database constraint values
        const dbDirectionMap: Record<string, string> = {
          'long': 'bullish',
          'short': 'bearish'
        };
        
        // Query historical_pattern_occurrences table
        let query = supabase
          .from('historical_pattern_occurrences')
          .select('*')
          .eq('pattern_id', patternId)
          .eq('timeframe', timeframe)
          .eq('validation_status', 'confirmed')
          .order('detected_at', { ascending: false })
          .limit(limit);
        
        // Filter by symbol if provided (for instrument-specific history)
        if (symbol) {
          query = query.eq('symbol', symbol);
        }
        
        if (direction) {
          const dbDirection = dbDirectionMap[direction] || direction;
          query = query.eq('direction', dbDirection);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Map database values back to UI-friendly values
          const outcomeMap: Record<string, 'win' | 'loss' | 'pending'> = {
            'hit_tp': 'win',
            'hit_sl': 'loss',
            'timeout': 'pending',
            'pending': 'pending',
            'invalidated': 'pending'
          };
          
          const directionMap: Record<string, 'long' | 'short'> = {
            'bullish': 'long',
            'bearish': 'short'
          };
          
          const mapped: HistoricalOccurrence[] = data.map(row => ({
            id: row.id,
            symbol: row.symbol,
            patternName: row.pattern_name,
            direction: directionMap[row.direction] || (row.direction as 'long' | 'short'),
            detectedAt: row.detected_at,
            patternStartDate: row.pattern_start_date,
            patternEndDate: row.pattern_end_date,
            entryPrice: Number(row.entry_price),
            stopLossPrice: Number(row.stop_loss_price),
            takeProfitPrice: Number(row.take_profit_price),
            riskRewardRatio: Number(row.risk_reward_ratio),
            outcome: row.outcome ? outcomeMap[row.outcome] || (row.outcome as 'win' | 'loss' | 'pending') : null,
            outcomePnlPercent: row.outcome_pnl_percent ? Number(row.outcome_pnl_percent) : null,
            barsToOutcome: row.bars_to_outcome,
            qualityScore: row.quality_score || 'B',
            visualSpec: row.visual_spec,
            bars: Array.isArray(row.bars) ? row.bars : [],
            // Trend alignment fields
            trendAlignment: row.trend_alignment as 'with_trend' | 'counter_trend' | 'neutral' | null,
            trendIndicators: row.trend_indicators as HistoricalOccurrence['trendIndicators']
          }));
          
          setOccurrences(mapped);
          
          // Calculate stats
          const wins = mapped.filter(o => o.outcome === 'win').length;
          const losses = mapped.filter(o => o.outcome === 'loss').length;
          const pending = mapped.filter(o => !o.outcome || o.outcome === 'pending').length;
          const totalResolved = wins + losses;
          const winRate = totalResolved > 0 ? (wins / totalResolved) * 100 : 0;
          
          // Trend alignment stats
          const withTrend = mapped.filter(o => o.trendAlignment === 'with_trend').length;
          const counterTrend = mapped.filter(o => o.trendAlignment === 'counter_trend').length;
          const neutral = mapped.filter(o => o.trendAlignment === 'neutral' || !o.trendAlignment).length;
          
          // Win rates by trend alignment
          const withTrendWins = mapped.filter(o => o.trendAlignment === 'with_trend' && o.outcome === 'win').length;
          const withTrendTotal = mapped.filter(o => o.trendAlignment === 'with_trend' && (o.outcome === 'win' || o.outcome === 'loss')).length;
          const counterTrendWins = mapped.filter(o => o.trendAlignment === 'counter_trend' && o.outcome === 'win').length;
          const counterTrendTotal = mapped.filter(o => o.trendAlignment === 'counter_trend' && (o.outcome === 'win' || o.outcome === 'loss')).length;
          
          // Calculate accumulated ROI (sum of all outcomePnlPercent)
          const accumulatedRoi = mapped
            .filter(o => o.outcomePnlPercent !== null)
            .reduce((sum, o) => sum + (o.outcomePnlPercent || 0), 0);
          
          const withTrendRoi = mapped
            .filter(o => o.trendAlignment === 'with_trend' && o.outcomePnlPercent !== null)
            .reduce((sum, o) => sum + (o.outcomePnlPercent || 0), 0);
          
          const counterTrendRoi = mapped
            .filter(o => o.trendAlignment === 'counter_trend' && o.outcomePnlPercent !== null)
            .reduce((sum, o) => sum + (o.outcomePnlPercent || 0), 0);
          
          setStats({ 
            wins, 
            losses, 
            pending,
            withTrend,
            counterTrend,
            neutral,
            winRate,
            withTrendWinRate: withTrendTotal > 0 ? (withTrendWins / withTrendTotal) * 100 : 0,
            counterTrendWinRate: counterTrendTotal > 0 ? (counterTrendWins / counterTrendTotal) * 100 : 0,
            accumulatedRoi,
            withTrendRoi,
            counterTrendRoi
          });
        } else {
          // No data in DB - show empty state
          setOccurrences([]);
        }
      } catch (err) {
        console.error('Error fetching historical occurrences:', err);
        setOccurrences([]);
      }
      
      setLoading(false);
    };
    
    fetchOccurrences();
  }, [patternId, symbol, timeframe, direction, limit]);

  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Historical Occurrences
            </CardTitle>
            
            {/* Show disabled filters during loading */}
            <div className="flex items-center gap-2 opacity-50">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <ToggleGroup type="single" value="all" className="h-7" disabled>
                <ToggleGroupItem value="all" className="text-xs px-2 h-6">All</ToggleGroupItem>
                <ToggleGroupItem value="with_trend" className="text-xs px-2 h-6">
                  <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
                  With Trend
                </ToggleGroupItem>
                <ToggleGroupItem value="counter_trend" className="text-xs px-2 h-6">
                  <ArrowDownRight className="h-3 w-3 mr-1 text-amber-500" />
                  Counter
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          
          {/* Loading stats skeleton */}
          <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <Skeleton className="h-3 w-12 mx-auto mb-2" />
                  <Skeleton className="h-6 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-8 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (occurrences.length === 0) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Historical Occurrences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No historical data available yet</p>
            <p className="text-xs mt-1">Pattern occurrences will appear as they are detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter occurrences based on trend filter
  const filteredOccurrences = occurrences.filter(o => {
    if (trendFilter === 'all') return true;
    return o.trendAlignment === trendFilter;
  });

  // Calculate filtered stats
  const filteredWins = filteredOccurrences.filter(o => o.outcome === 'win').length;
  const filteredLosses = filteredOccurrences.filter(o => o.outcome === 'loss').length;
  const filteredTotal = filteredWins + filteredLosses;
  const filteredWinRate = filteredTotal > 0 ? (filteredWins / filteredTotal) * 100 : 0;
  const filteredRoi = filteredOccurrences
    .filter(o => o.outcomePnlPercent !== null)
    .reduce((sum, o) => sum + (o.outcomePnlPercent || 0), 0);

  // Transform database bar format to CompressedBar format
  const transformBarsToCompressed = (bars: any[]): import('@/types/VisualSpec').CompressedBar[] => {
    if (!bars || !Array.isArray(bars)) return [];
    
    return bars.map(bar => {
      // Check if already in compressed format
      if (bar.t !== undefined && bar.c !== undefined) {
        return bar as import('@/types/VisualSpec').CompressedBar;
      }
      
      // Transform from database format (close, date, high, low, open, volume)
      return {
        t: bar.date || bar.t || '',
        o: bar.open ?? bar.o ?? 0,
        h: bar.high ?? bar.h ?? 0,
        l: bar.low ?? bar.l ?? 0,
        c: bar.close ?? bar.c ?? 0,
        v: bar.volume ?? bar.v ?? 0,
      };
    });
  };

  // Handler to convert occurrence to SetupWithVisuals and open chart (or navigate to dashboard)
  const handleOpenChart = (occurrence: HistoricalOccurrence) => {
    // Map outcome back to the database format
    const outcomeMap: Record<string, 'hit_tp' | 'hit_sl' | 'timeout' | 'pending'> = {
      'win': 'hit_tp',
      'loss': 'hit_sl',
      'pending': 'pending',
    };
    
    // Transform bars to compressed format
    const compressedBars = transformBarsToCompressed(occurrence.bars);
    
    // Calculate entryBarIndex from visualSpec or default to 30 bars before end
    const entryBarIndex = occurrence.visualSpec?.entryBarIndex ?? 
      Math.max(0, compressedBars.length - (occurrence.barsToOutcome ?? 1) - 1);
    
    // Check if this occurrence has playback data
    const hasPlaybackData = occurrence.barsToOutcome != null && compressedBars.length > 0;
    
    const setup: SetupWithVisuals = {
      instrument: occurrence.symbol,
      patternId: patternId,
      patternName: occurrence.patternName,
      direction: occurrence.direction,
      signalTs: occurrence.detectedAt,
      quality: {
        score: 7, // Default score
        grade: (occurrence.qualityScore as 'A' | 'B' | 'C' | 'D' | 'F') || 'B',
        confidence: 70,
        reasons: [],
        warnings: [],
        tradeable: true,
      },
      tradePlan: {
        entryType: 'market',
        entry: occurrence.entryPrice,
        stopLoss: occurrence.stopLossPrice,
        takeProfit: occurrence.takeProfitPrice,
        rr: occurrence.riskRewardRatio,
        stopDistance: Math.abs(occurrence.entryPrice - occurrence.stopLossPrice),
        tpDistance: Math.abs(occurrence.takeProfitPrice - occurrence.entryPrice),
        timeStopBars: 100,
        bracketLevelsVersion: '2.0.0',
        priceRounding: { priceDecimals: 5, rrDecimals: 2 },
      },
      bars: compressedBars,
      visualSpec: occurrence.visualSpec || {
        version: '2.0.0',
        symbol: occurrence.symbol,
        timeframe: timeframe,
        patternId: patternId,
        signalTs: occurrence.detectedAt,
        window: { startTs: occurrence.patternStartDate, endTs: occurrence.patternEndDate },
        yDomain: { min: 0, max: 0 },
        overlays: [],
        entryBarIndex,
      },
      // Include outcome data for playback
      outcome: occurrence.outcome ? outcomeMap[occurrence.outcome] : null,
      outcomePnlPercent: occurrence.outcomePnlPercent,
      barsToOutcome: occurrence.barsToOutcome,
      entryBarIndex,
    };
    
    // If callback provided, use it; otherwise navigate to dashboard with playback context
    if (onSelectOccurrence) {
      onSelectOccurrence(setup);
    } else if (shouldNavigateToDashboard && hasPlaybackData) {
      // Navigate to dashboard with pattern context for playback
      navigate('/members/dashboard', {
        state: {
          playbackPattern: {
            occurrenceId: occurrence.id,
            symbol: occurrence.symbol,
            timeframe: timeframe,
            patternId: patternId,
            patternName: occurrence.patternName,
            direction: occurrence.direction,
            setup,
            enablePlayback: true,
          }
        }
      });
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Historical Occurrences
            <span className="ml-1 px-1.5 py-0.5 text-sm font-medium bg-muted rounded text-muted-foreground">
              R:R 1:{selectedRR}
            </span>
          </CardTitle>
          
          {/* Trend Filter Toggle with Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <ToggleGroup 
                    type="single" 
                    value={trendFilter} 
                    onValueChange={(val) => val && setTrendFilter(val as TrendFilter)}
                    className="h-7"
                  >
                    <ToggleGroupItem value="all" className="text-xs px-2 h-6">
                      All
                    </ToggleGroupItem>
                    <ToggleGroupItem value="with_trend" className="text-xs px-2 h-6">
                      <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />
                      With Trend
                    </ToggleGroupItem>
                    <ToggleGroupItem value="counter_trend" className="text-xs px-2 h-6">
                      <ArrowDownRight className="h-3 w-3 mr-1 text-amber-500" />
                      Counter
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-4" side="bottom">
                <p className="font-semibold mb-2">What is Trend Alignment?</p>
                <p className="text-xs text-muted-foreground mb-3">
                  We analyze each pattern against the higher-timeframe trend using MACD, 50/200 EMA, RSI, and ADX indicators.
                </p>
                <div className="text-xs space-y-2">
                  <div className="flex gap-2">
                    <ArrowUpRight className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">With Trend:</span>
                      <span className="text-muted-foreground"> Pattern direction matches the dominant market trend. Generally higher probability trades.</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ArrowDownRight className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Counter Trend:</span>
                      <span className="text-muted-foreground"> Pattern direction opposes the trend. Higher risk, potential reversal trades.</span>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Accumulated Stats Panel */}
        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {trendFilter === 'all' ? 'Overall' : trendFilter === 'with_trend' ? 'With Trend' : 'Counter Trend'}
              </div>
              <div className={cn(
                "text-lg font-bold",
                filteredWinRate >= 50 ? "text-bullish" : "text-bearish"
              )}>
                {filteredWinRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Accumulated</div>
              <div className={cn(
                "text-lg font-bold",
                filteredRoi >= 0 ? "text-bullish" : "text-bearish"
              )}>
                {filteredRoi >= 0 ? '+' : ''}{filteredRoi.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Total ROI</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Wins</div>
              <div className="text-lg font-bold text-bullish">{filteredWins}</div>
              <div className="text-xs text-muted-foreground">trades</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Losses</div>
              <div className="text-lg font-bold text-bearish">{filteredLosses}</div>
              <div className="text-xs text-muted-foreground">trades</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Sample Size</div>
              <div className="text-lg font-bold text-foreground">{filteredTotal}</div>
              <div className="text-xs text-muted-foreground">resolved</div>
            </div>
          </div>
          
          {/* Trend Comparison (only show when 'all' filter is active and data exists) */}
          {trendFilter === 'all' && (stats.withTrend > 0 || stats.counterTrend > 0) && (
            <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap justify-center gap-6 text-xs">
              {stats.withTrend > 0 && (
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">With Trend:</span>
                  <span className={cn(
                    "font-semibold",
                    stats.withTrendWinRate >= 50 ? "text-bullish" : "text-bearish"
                  )}>
                    {stats.withTrendWinRate.toFixed(1)}% win
                  </span>
                  <span className={cn(
                    "font-semibold",
                    stats.withTrendRoi >= 0 ? "text-bullish" : "text-bearish"
                  )}>
                    ({stats.withTrendRoi >= 0 ? '+' : ''}{stats.withTrendRoi.toFixed(1)}% ROI)
                  </span>
                </div>
              )}
              {stats.counterTrend > 0 && (
                <div className="flex items-center gap-1.5">
                  <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-muted-foreground">Counter Trend:</span>
                  <span className={cn(
                    "font-semibold",
                    stats.counterTrendWinRate >= 50 ? "text-bullish" : "text-bearish"
                  )}>
                    {stats.counterTrendWinRate.toFixed(1)}% win
                  </span>
                  <span className={cn(
                    "font-semibold",
                    stats.counterTrendRoi >= 0 ? "text-bullish" : "text-bearish"
                  )}>
                    ({stats.counterTrendRoi >= 0 ? '+' : ''}{stats.counterTrendRoi.toFixed(1)}% ROI)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-2">
            {filteredOccurrences.length > 0 ? (
              filteredOccurrences.map((occurrence) => (
                <OccurrenceRow 
                  key={occurrence.id} 
                  occurrence={occurrence} 
                  selectedRR={selectedRR} 
                  onOpenChart={handleOpenChart}
                  showPlaybackHint={shouldNavigateToDashboard && occurrence.barsToOutcome != null}
                />
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Filter className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No {trendFilter.replace('_', ' ')} patterns found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface OccurrenceRowProps {
  occurrence: HistoricalOccurrence;
  selectedRR?: number;
  onOpenChart?: (occurrence: HistoricalOccurrence) => void;
  /** Show playback hint (navigates to dashboard) */
  showPlaybackHint?: boolean;
}

function OccurrenceRow({ occurrence, selectedRR = 2, onOpenChart, showPlaybackHint }: OccurrenceRowProps) {
  const getOutcomeColor = (outcome: string | null) => {
    switch (outcome) {
      case 'win': return 'text-bullish bg-bullish/10 border-bullish/30';
      case 'loss': return 'text-bearish bg-bearish/10 border-bearish/30';
      default: return 'text-muted-foreground bg-muted/50 border-border';
    }
  };

  const getOutcomeIcon = (outcome: string | null) => {
    switch (outcome) {
      case 'win': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'loss': return <XCircle className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const getTrendAlignmentBadge = (alignment: string | null) => {
    if (!alignment) return null;
    
    switch (alignment) {
      case 'with_trend':
        return (
          <Badge 
            variant="outline" 
            className="text-xs px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            title="Trade aligns with larger market trend (MACD, EMAs, RSI, ADX)"
          >
            <ArrowUpRight className="h-3 w-3 mr-0.5" />
            With Trend
          </Badge>
        );
      case 'counter_trend':
        return (
          <Badge 
            variant="outline" 
            className="text-xs px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            title="Trade is against the larger market trend"
          >
            <ArrowDownRight className="h-3 w-3 mr-0.5" />
            Counter
          </Badge>
        );
      case 'neutral':
        return (
          <Badge 
            variant="outline" 
            className="text-xs px-1.5 py-0 text-muted-foreground"
            title="Mixed signals from trend indicators"
          >
            <Minus className="h-3 w-3 mr-0.5" />
            Neutral
          </Badge>
        );
      default:
        return null;
    }
  };

  const formattedDate = format(new Date(occurrence.detectedAt), 'MMM dd, yyyy');
  const formattedTime = format(new Date(occurrence.detectedAt), 'HH:mm');

  return (
    <div 
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border transition-colors',
        'hover:bg-muted/30 hover:border-border/80',
        'border-border/50 bg-card/50',
        onOpenChart && occurrence.bars?.length > 0 && 'cursor-pointer'
      )}
      onClick={() => {
        if (onOpenChart && occurrence.bars?.length > 0) {
          onOpenChart(occurrence);
        }
      }}
    >
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{occurrence.symbol}</span>
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs px-1.5 py-0',
              occurrence.direction === 'long' 
                ? 'text-bullish border-bullish/30' 
                : 'text-bearish border-bearish/30'
            )}
          >
            {occurrence.direction === 'long' ? (
              <TrendingUp className="h-3 w-3 mr-0.5" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-0.5" />
            )}
            {occurrence.direction}
          </Badge>
          <GradeBadge grade={occurrence.qualityScore} variant="pill" size="sm" showTooltip={false} className="text-xs px-1.5 py-0" />
          {/* NEW: Trend Alignment Badge */}
          {getTrendAlignmentBadge(occurrence.trendAlignment)}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            R:R {selectedRR.toFixed(1)}
          </span>
          {occurrence.barsToOutcome && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {occurrence.barsToOutcome} bars
            </span>
          )}
        </div>
      </div>
      
      {/* Outcome Badge */}
      <div className="flex-shrink-0">
        <Badge 
          variant="outline"
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            getOutcomeColor(occurrence.outcome)
          )}
        >
          {getOutcomeIcon(occurrence.outcome)}
          {occurrence.outcome === 'win' && occurrence.outcomePnlPercent !== null && (
            <span>+{occurrence.outcomePnlPercent.toFixed(1)}%</span>
          )}
          {occurrence.outcome === 'loss' && occurrence.outcomePnlPercent !== null && (
            <span>{occurrence.outcomePnlPercent.toFixed(1)}%</span>
          )}
          {(!occurrence.outcome || occurrence.outcome === 'pending') && (
            <span>Pending</span>
          )}
        </Badge>
      </div>
      
      {/* Playback indicator or chevron */}
      {showPlaybackHint ? (
        <div className="flex items-center gap-1 text-primary">
          <Play className="h-3.5 w-3.5 fill-current" />
          <span className="text-xs font-medium hidden sm:inline">Replay</span>
        </div>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
      )}
    </div>
  );
}
