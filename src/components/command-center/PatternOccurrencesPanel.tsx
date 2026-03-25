import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Clock, Target, Eye, BarChart3, ChevronDown, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GradeBadge } from '@/components/ui/GradeBadge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PATTERN_DISPLAY_NAMES } from '@/hooks/useScreenerCaps';

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

/** Compact performance metrics bar */
function PerformanceMetricsBar({ patterns }: { patterns: PatternOccurrence[] }) {
  const { t } = useTranslation();
  const stats = useMemo(() => {
    const resolved = patterns.filter(p => !p.isActive && p.outcome && p.outcome !== 'pending');
    const wins = resolved.filter(p => p.outcome === 'hit_tp' || p.outcome === 'win');
    const losses = resolved.filter(p => p.outcome === 'hit_sl' || p.outcome === 'loss');
    const winRate = resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0;

    const totalWinPnl = wins.reduce((s, p) => s + Math.abs(p.outcome_pnl_percent || 0), 0);
    const totalLossPnl = losses.reduce((s, p) => s + Math.abs(p.outcome_pnl_percent || 0), 0);
    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? Infinity : 0;

    const avgWin = wins.length > 0 ? totalWinPnl / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLossPnl / losses.length : 0;
    const wr = resolved.length > 0 ? wins.length / resolved.length : 0;
    const expectancy = (wr * avgWin) - ((1 - wr) * avgLoss);

    return {
      sampleSize: resolved.length,
      winRate,
      profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
      expectancy,
      activeCount: patterns.filter(p => p.isActive).length,
    };
  }, [patterns]);

  if (stats.sampleSize === 0 && stats.activeCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-gradient-to-r from-primary/5 to-transparent text-xs flex-wrap">
      <div className="flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">{t('commandCenter.performance')}</span>
      </div>
      {stats.sampleSize > 0 ? (
        <>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t('screener.winRate')}</span>
            <span className={cn(
              "font-semibold",
              stats.winRate >= 50 ? "text-emerald-500" : "text-red-500"
            )}>
              {stats.winRate.toFixed(0)}%
            </span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t('commandCenter.pf')}</span>
            <span className={cn(
              "font-semibold",
              stats.profitFactor >= 1 ? "text-emerald-500" : "text-red-500"
            )}>
              {stats.profitFactor.toFixed(2)}
            </span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">{t('commandCenter.exp')}</span>
            <span className={cn(
              "font-semibold",
              stats.expectancy >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {stats.expectancy >= 0 ? '+' : ''}{stats.expectancy.toFixed(2)}%
            </span>
          </div>
          <span className="text-border">|</span>
          <span className="text-muted-foreground">n={stats.sampleSize}</span>
        </>
      ) : (
        <span className="text-muted-foreground">{t('commandCenter.noResolvedTrades')}</span>
      )}
    </div>
  );
}

/** Active patterns section */
function ActivePatternsSection({ 
  patterns, 
  onPatternSelect, 
  selectedPatternId 
}: { 
  patterns: PatternOccurrence[]; 
  onPatternSelect?: (p: PatternOccurrence) => void;
  selectedPatternId?: string | null;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  
  if (patterns.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 border-b border-border hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold">{t('commandCenter.activePatterns', { count: patterns.length })}</span>
        </div>
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-2 space-y-1 border-b border-border bg-primary/[0.02]">
          {patterns.map((p) => (
            <PatternRow 
              key={p.id} 
              pattern={p} 
              isSelected={selectedPatternId === p.id}
              onSelect={onPatternSelect}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Single pattern row */
function PatternRow({ 
  pattern: p, 
  isSelected, 
  onSelect 
}: { 
  pattern: PatternOccurrence; 
  isSelected: boolean;
  onSelect?: (p: PatternOccurrence) => void;
}) {
  const { t } = useTranslation();
  const isClickable = Boolean(onSelect);

  return (
    <div
      onClick={() => onSelect?.(p)}
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
          <div className="font-medium text-sm truncate">
            {PATTERN_DISPLAY_NAMES[p.pattern_name] || p.pattern_name}
          </div>
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
        <Badge variant="outline" className="text-xs px-1.5 py-0">
          {p.risk_reward_ratio.toFixed(1)}R
        </Badge>
        {p.isActive ? (
          <Badge className="bg-primary/20 text-primary text-xs px-1.5 py-0">
            Active
          </Badge>
        ) : p.outcome ? (
          <Badge
            className={cn(
              'text-xs px-1.5 py-0',
              (p.outcome === 'win' || p.outcome === 'hit_tp')
                ? 'bg-emerald-500/20 text-emerald-600'
                : (p.outcome === 'loss' || p.outcome === 'hit_sl')
                ? 'bg-red-500/20 text-red-600'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {(p.outcome === 'win' || p.outcome === 'hit_tp') 
              ? (p.outcome_pnl_percent != null ? `+${p.outcome_pnl_percent.toFixed(1)}%` : 'hit_tp')
              : (p.outcome === 'loss' || p.outcome === 'hit_sl') 
              ? (p.outcome_pnl_percent != null ? `${p.outcome_pnl_percent.toFixed(1)}%` : 'hit_sl')
              : p.outcome}
          </Badge>
        ) : null}
        
        {isClickable && (
          <Tooltip>
            <TooltipTrigger asChild>
              {p.isActive ? (
                <Eye className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
              ) : (
                <Play className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
              )}
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{p.isActive ? t('commandCenter.viewPatternOnChart') : t('commandCenter.replayTrade')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function PatternOccurrencesPanel({ 
  symbol, 
  timeframe, 
  onPatternSelect,
  selectedPatternId,
}: PatternOccurrencesPanelProps) {
  const { t } = useTranslation();
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
          .select('id, pattern_name, direction, detected_at, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, outcome, outcome_pnl_percent, validation_status')
          .eq('symbol', symbol)
          .eq('timeframe', timeframe)
          .in('validation_status', ['confirmed', 'pending'])
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

  const activePatterns = useMemo(() => patterns.filter(p => p.isActive), [patterns]);
  const historicalPatterns = useMemo(() => patterns.filter(p => !p.isActive), [patterns]);

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
        <p>{t('commandCenter.noPatternsFound', { symbol, timeframe })}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Performance Metrics Bar */}
      <PerformanceMetricsBar patterns={patterns} />

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        {/* Active Patterns Section */}
        <ActivePatternsSection 
          patterns={activePatterns}
          onPatternSelect={onPatternSelect}
          selectedPatternId={selectedPatternId}
        />

        {/* Historical Patterns */}
        {historicalPatterns.length > 0 && (
          <div className="p-2 space-y-1">
            {activePatterns.length > 0 && (
              <div className="px-1 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('commandCenter.historical', { count: historicalPatterns.length })}
                </span>
              </div>
            )}
            {historicalPatterns.map((p) => (
              <PatternRow
                key={p.id}
                pattern={p}
                isSelected={selectedPatternId === p.id}
                onSelect={onPatternSelect}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
