import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Minus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import ThumbnailChart from './ThumbnailChart';
import type { SetupWithVisuals } from '@/types/VisualSpec';

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
  // NEW: Trend alignment fields
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
  symbol?: string; // Optional: filter by specific symbol for instrument-specific history
  timeframe?: string;
  direction?: 'long' | 'short';
  limit?: number;
  className?: string;
}

// Show substantially more historical occurrences for proper 5-year backtested view
const DEFAULT_LIMIT = 50;

export function HistoricalOccurrencesList({ 
  patternId, 
  patternName,
  symbol,
  timeframe = '1d',
  direction,
  limit = DEFAULT_LIMIT,
  className 
}: HistoricalOccurrencesListProps) {
  const [occurrences, setOccurrences] = useState<HistoricalOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    wins: 0, 
    losses: 0, 
    pending: 0,
    withTrend: 0,
    counterTrend: 0,
    neutral: 0,
    // Win rates by trend alignment
    withTrendWinRate: 0,
    counterTrendWinRate: 0
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
          
          // Trend alignment stats
          const withTrend = mapped.filter(o => o.trendAlignment === 'with_trend').length;
          const counterTrend = mapped.filter(o => o.trendAlignment === 'counter_trend').length;
          const neutral = mapped.filter(o => o.trendAlignment === 'neutral' || !o.trendAlignment).length;
          
          // Win rates by trend alignment
          const withTrendWins = mapped.filter(o => o.trendAlignment === 'with_trend' && o.outcome === 'win').length;
          const withTrendTotal = mapped.filter(o => o.trendAlignment === 'with_trend' && (o.outcome === 'win' || o.outcome === 'loss')).length;
          const counterTrendWins = mapped.filter(o => o.trendAlignment === 'counter_trend' && o.outcome === 'win').length;
          const counterTrendTotal = mapped.filter(o => o.trendAlignment === 'counter_trend' && (o.outcome === 'win' || o.outcome === 'loss')).length;
          
          setStats({ 
            wins, 
            losses, 
            pending,
            withTrend,
            counterTrend,
            neutral,
            withTrendWinRate: withTrendTotal > 0 ? (withTrendWins / withTrendTotal) * 100 : 0,
            counterTrendWinRate: counterTrendTotal > 0 ? (counterTrendWins / counterTrendTotal) * 100 : 0
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
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Historical Occurrences
          </CardTitle>
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

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Historical Occurrences
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-bullish/10 text-bullish border-bullish/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              {stats.wins} wins
            </Badge>
            <Badge variant="outline" className="bg-bearish/10 text-bearish border-bearish/30">
              <XCircle className="h-3 w-3 mr-1" />
              {stats.losses} losses
            </Badge>
            {stats.pending > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {stats.pending} pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-2">
            {occurrences.map((occurrence) => (
              <OccurrenceRow key={occurrence.id} occurrence={occurrence} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface OccurrenceRowProps {
  occurrence: HistoricalOccurrence;
}

function OccurrenceRow({ occurrence }: OccurrenceRowProps) {
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
    <div className={cn(
      'group flex items-center gap-3 p-3 rounded-lg border transition-colors',
      'hover:bg-muted/30 hover:border-border/80',
      'border-border/50 bg-card/50'
    )}>
      {/* Mini Chart Preview */}
      {occurrence.bars && occurrence.bars.length > 0 && (
        <div className="w-16 h-10 rounded overflow-hidden bg-background/50 flex-shrink-0">
          <ThumbnailChart
            bars={occurrence.bars.slice(-30)}
            visualSpec={occurrence.visualSpec}
            height={40}
          />
        </div>
      )}
      
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
          <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground">
            {occurrence.qualityScore}
          </Badge>
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
            R:R {occurrence.riskRewardRatio.toFixed(1)}
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
      
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
    </div>
  );
}
