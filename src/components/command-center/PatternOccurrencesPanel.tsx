import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Clock, Target, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GradeBadge } from '@/components/ui/GradeBadge';

export interface PatternOccurrence {
  id: string;
  pattern_name: string;
  direction: string;
  detected_at: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  quality_score: string | null;
  outcome?: string | null;
  outcome_pnl_percent?: number | null;
  isActive: boolean;
}

interface PatternOccurrencesPanelProps {
  symbol: string;
  timeframe: string;
  onPatternSelect?: (pattern: PatternOccurrence) => void;
  selectedPatternId?: string | null;
}

export function PatternOccurrencesPanel({ 
  symbol, 
  timeframe, 
  onPatternSelect,
  selectedPatternId,
}: PatternOccurrencesPanelProps) {
  const [patterns, setPatterns] = useState<PatternOccurrence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatterns() {
      setLoading(true);
      setPatterns([]);

      try {
        // Fetch active patterns
        const { data: activeData } = await supabase
          .from('live_pattern_detections')
          .select('id, pattern_name, direction, first_detected_at, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score')
          .eq('instrument', symbol)
          .eq('timeframe', timeframe)
          .eq('status', 'active')
          .order('first_detected_at', { ascending: false })
          .limit(20);

        // Fetch historical patterns
        const { data: historicalData } = await supabase
          .from('historical_pattern_occurrences')
          .select('id, pattern_name, direction, detected_at, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, outcome, outcome_pnl_percent')
          .eq('symbol', symbol)
          .eq('timeframe', timeframe)
          .order('detected_at', { ascending: false })
          .limit(30);

        const combined: PatternOccurrence[] = [];

        // Add active patterns
        if (activeData) {
          activeData.forEach((p) => {
            combined.push({
              id: p.id,
              pattern_name: p.pattern_name,
              direction: p.direction,
              detected_at: p.first_detected_at,
              entry_price: p.entry_price,
              stop_loss_price: p.stop_loss_price,
              take_profit_price: p.take_profit_price,
              risk_reward_ratio: p.risk_reward_ratio,
              quality_score: p.quality_score,
              isActive: true,
            });
          });
        }

        // Add historical patterns (avoid duplicates by id)
        const activeIds = new Set(combined.map((p) => p.id));
        if (historicalData) {
          historicalData.forEach((p) => {
            if (!activeIds.has(p.id)) {
              combined.push({
                id: p.id,
                pattern_name: p.pattern_name,
                direction: p.direction,
                detected_at: p.detected_at,
                entry_price: p.entry_price,
                stop_loss_price: p.stop_loss_price,
                take_profit_price: p.take_profit_price,
                risk_reward_ratio: p.risk_reward_ratio,
                quality_score: p.quality_score,
                outcome: p.outcome,
                outcome_pnl_percent: p.outcome_pnl_percent,
                isActive: false,
              });
            }
          });
        }

        // Sort by date descending
        combined.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());

        setPatterns(combined);
      } catch (err) {
        console.error('[PatternOccurrencesPanel] Error fetching patterns:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPatterns();
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
        <Target className="h-8 w-8 mb-2 opacity-50" />
        <p>No patterns found for {symbol} ({timeframe})</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {patterns.map((p) => {
          const isSelected = selectedPatternId === p.id;
          const isClickable = Boolean(onPatternSelect);
          
          return (
            <div
              key={p.id}
              onClick={() => onPatternSelect?.(p)}
              className={cn(
                'flex items-center justify-between p-2 rounded-md border text-xs transition-colors',
                p.isActive ? 'bg-primary/5 border-primary/20' : 'bg-card border-border',
                isClickable && 'cursor-pointer hover:bg-accent/50',
                isSelected && 'ring-2 ring-primary bg-primary/10'
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {p.direction === 'long' ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.pattern_name}</div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {format(new Date(p.detected_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {p.quality_score && (
                  <GradeBadge grade={p.quality_score} size="sm" showTooltip={false} />
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {p.risk_reward_ratio.toFixed(1)}R
                </Badge>
                {p.isActive ? (
                  <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">
                    Active
                  </Badge>
                ) : p.outcome ? (
                  <Badge
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      p.outcome === 'win'
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : p.outcome === 'loss'
                        ? 'bg-red-500/20 text-red-600'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {p.outcome === 'win' ? `+${p.outcome_pnl_percent?.toFixed(1)}%` : p.outcome === 'loss' ? `${p.outcome_pnl_percent?.toFixed(1)}%` : p.outcome}
                  </Badge>
                ) : null}
                
                {isClickable && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Eye className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>View pattern on chart</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
