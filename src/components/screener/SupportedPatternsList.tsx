import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Lock, TrendingUp, TrendingDown, Minus, Crown, Target } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PATTERN_DISPLAY_NAMES, ALL_PATTERN_IDS } from '@/hooks/useScreenerCaps';
import { translatePatternName } from '@/utils/translatePatternName';
import { cn } from '@/lib/utils';

interface PatternCount {
  patternId: string;
  count: number;
  longCount: number;
  shortCount: number;
}

/** Edge metrics for a pattern (from pattern_hit_rates) */
export interface PatternEdgeData {
  patternId: string;
  winRate: number; // 0-100
  avgRMultiple: number;
  sampleSize: number;
}

interface SupportedPatternsListProps {
  /** Map of patternId to count of active signals */
  patternCounts: PatternCount[];
  /** List of pattern IDs that are locked for this user's tier */
  lockedPatterns?: string[];
  /** Whether to show in compact mode (for homepage) */
  compact?: boolean;
  /** Currently selected pattern filter */
  selectedPattern?: string;
  /** Callback when a pattern is clicked */
  onPatternClick?: (patternId: string) => void;
  /** Edge metrics per pattern (optional - shows blur if not provided and unlocked) */
  edgeMetrics?: PatternEdgeData[];
  /** Whether edge metrics should be blurred (for free users) */
  blurEdgeMetrics?: boolean;
}

/**
 * Displays all supported patterns with their active signal counts.
 * Shows locked patterns with a lock icon and upgrade hint.
 * Shows edge metrics (win rate) with blur for free users.
 */
export function SupportedPatternsList({
  patternCounts,
  lockedPatterns = [],
  compact = false,
  selectedPattern,
  onPatternClick,
  edgeMetrics = [],
  blurEdgeMetrics = false,
}: SupportedPatternsListProps) {
  const { t } = useTranslation();
  // Create maps for quick lookup
  const countMap = new Map(patternCounts.map(p => [p.patternId, p]));
  const edgeMap = new Map(edgeMetrics.map(e => [e.patternId, e]));
  
  // Get all patterns sorted: active first, then by name
  const sortedPatterns = [...ALL_PATTERN_IDS].sort((a, b) => {
    const aCount = countMap.get(a)?.count || 0;
    const bCount = countMap.get(b)?.count || 0;
    if (aCount !== bCount) return bCount - aCount; // More signals first
    return (PATTERN_DISPLAY_NAMES[a] || a).localeCompare(PATTERN_DISPLAY_NAMES[b] || b);
  });

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-1.5">
          {sortedPatterns.map(patternId => {
            const isLocked = lockedPatterns.includes(patternId);
            const data = countMap.get(patternId);
            const edge = edgeMap.get(patternId);
            const count = data?.count || 0;
            const isActive = count > 0;
            const isSelected = selectedPattern === patternId;
            
            return (
              <Tooltip key={patternId}>
                <TooltipTrigger asChild>
                  <Badge
                    variant={isActive ? 'default' : 'outline'}
                    className={cn(
                      'text-sm px-2 py-0.5 cursor-pointer transition-all',
                      isLocked && 'opacity-50 border-dashed',
                      isActive && 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30',
                      !isActive && !isLocked && 'hover:bg-muted',
                      isSelected && 'ring-2 ring-primary ring-offset-1'
                    )}
                    onClick={() => !isLocked && onPatternClick?.(patternId)}
                  >
                    {isLocked && <Lock className="h-2.5 w-2.5 mr-1" />}
                    <span className="truncate max-w-[100px]">
                      {translatePatternName(PATTERN_DISPLAY_NAMES[patternId] || patternId)}
                    </span>
                    {isActive && (
                      <span className="ml-1 font-bold">{count}</span>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[200px]">
                  <div className="font-medium">{translatePatternName(PATTERN_DISPLAY_NAMES[patternId] || patternId)}</div>
                  {isLocked ? (
                    <div className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Crown className="h-3 w-3 text-amber-500" />
                      {t('screener.upgradeToUnlock')}
                    </div>
                  ) : isActive ? (
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500 flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" /> {data?.longCount || 0}
                        </span>
                        <span className="text-red-500 flex items-center gap-0.5">
                          <TrendingDown className="h-3 w-3" /> {data?.shortCount || 0}
                        </span>
                      </div>
                      {/* Edge metrics teaser */}
                      {blurEdgeMetrics ? (
                        <div className="flex items-center gap-1 text-muted-foreground pt-1 border-t border-border/50">
                          <Target className="h-3 w-3" />
                          <span className="blur-[2px] select-none">55%</span>
                          <Crown className="h-3 w-3 text-amber-500" />
                        </div>
                      ) : edge ? (
                        <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          <span className={cn(
                            'font-mono font-medium',
                            edge.winRate >= 50 ? 'text-green-500' : 'text-yellow-500'
                          )}>
                            {edge.winRate.toFixed(0)}%
                          </span>
                          <span className="text-muted-foreground">{t('screener.win')}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">{t('screener.noActiveSignals')}</div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  // Full display mode for dedicated page
  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {sortedPatterns.map(patternId => {
          const isLocked = lockedPatterns.includes(patternId);
          const data = countMap.get(patternId);
          const edge = edgeMap.get(patternId);
          const count = data?.count || 0;
          const isActive = count > 0;
          const isSelected = selectedPattern === patternId;
          
          return (
            <Tooltip key={patternId}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'p-2.5 rounded-lg border text-center cursor-pointer transition-all',
                    isLocked && 'border-dashed opacity-60 bg-muted/30',
                    !isLocked && isActive && 'border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10',
                    !isLocked && !isActive && 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
                    isSelected && 'ring-2 ring-primary ring-offset-2'
                  )}
                  onClick={() => !isLocked && onPatternClick?.(patternId)}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span className={cn(
                      'text-xs font-medium',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>
                      {translatePatternName(PATTERN_DISPLAY_NAMES[patternId] || patternId)}
                    </span>
                  </div>
                  
                  {isActive ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          {data?.longCount || 0}
                        </span>
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5">
                          <TrendingDown className="h-3 w-3" />
                          {data?.shortCount || 0}
                        </span>
                      </div>
                      {/* Edge metrics row */}
                      <div className="flex items-center justify-center gap-1 text-sm pt-1 border-t border-border/30">
                        {blurEdgeMetrics ? (
                          <>
                            <span className="text-muted-foreground blur-[2px] select-none">55%</span>
                            <Crown className="h-2.5 w-2.5 text-amber-500" />
                          </>
                        ) : edge ? (
                          <>
                            <span className={cn(
                              'font-mono font-semibold',
                              edge.winRate >= 50 ? 'text-green-500' : edge.winRate >= 40 ? 'text-yellow-500' : 'text-red-500'
                            )}>
                              {edge.winRate.toFixed(0)}%
                            </span>
                            <span className="text-muted-foreground">{t('screener.win')}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Minus className="h-3 w-3 mr-1" />
                      {t('screener.noSignals')}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isLocked ? (
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-500" />
                    <span>{t('screener.upgradeToUnlockPattern')}</span>
                  </div>
                ) : isActive ? (
                  <div className="space-y-1">
                    <span>{t('screener.activeSignalDetected', { count })}</span>
                    {blurEdgeMetrics && (
                      <div className="flex items-center gap-1 text-muted-foreground pt-1 border-t border-border/50">
                        <Crown className="h-3 w-3 text-amber-500" />
                        <span className="text-xs">{t('screener.upgradeToSeeEdge')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span>{t('screener.scanningNoSignals')}</span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
