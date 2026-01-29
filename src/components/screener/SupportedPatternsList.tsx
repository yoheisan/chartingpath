import { Badge } from '@/components/ui/badge';
import { Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PATTERN_DISPLAY_NAMES, ALL_PATTERN_IDS } from '@/hooks/useScreenerCaps';

interface PatternCount {
  patternId: string;
  count: number;
  longCount: number;
  shortCount: number;
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
}

/**
 * Displays all supported patterns with their active signal counts.
 * Shows locked patterns with a lock icon and upgrade hint.
 */
export function SupportedPatternsList({
  patternCounts,
  lockedPatterns = [],
  compact = false,
  selectedPattern,
  onPatternClick,
}: SupportedPatternsListProps) {
  // Create a map for quick lookup
  const countMap = new Map(patternCounts.map(p => [p.patternId, p]));
  
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
            const count = data?.count || 0;
            const isActive = count > 0;
            const isSelected = selectedPattern === patternId;
            
            return (
              <Tooltip key={patternId}>
                <TooltipTrigger asChild>
                  <Badge
                    variant={isActive ? 'default' : 'outline'}
                    className={`
                      text-[10px] px-2 py-0.5 cursor-pointer transition-all
                      ${isLocked ? 'opacity-50 border-dashed' : ''}
                      ${isActive ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30' : 'hover:bg-muted'}
                      ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}
                    `}
                    onClick={() => !isLocked && onPatternClick?.(patternId)}
                  >
                    {isLocked && <Lock className="h-2.5 w-2.5 mr-1" />}
                    <span className="truncate max-w-[100px]">
                      {PATTERN_DISPLAY_NAMES[patternId] || patternId}
                    </span>
                    {isActive && (
                      <span className="ml-1 font-bold">{count}</span>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="font-medium">{PATTERN_DISPLAY_NAMES[patternId] || patternId}</div>
                  {isLocked ? (
                    <div className="text-muted-foreground">Upgrade to unlock</div>
                  ) : isActive ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-green-500 flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" /> {data?.longCount || 0}
                      </span>
                      <span className="text-red-500 flex items-center gap-0.5">
                        <TrendingDown className="h-3 w-3" /> {data?.shortCount || 0}
                      </span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No active signals</div>
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
          const count = data?.count || 0;
          const isActive = count > 0;
          const isSelected = selectedPattern === patternId;
          
          return (
            <Tooltip key={patternId}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    p-2.5 rounded-lg border text-center cursor-pointer transition-all
                    ${isLocked 
                      ? 'border-dashed opacity-60 bg-muted/30' 
                      : isActive 
                        ? 'border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10' 
                        : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                    }
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                  `}
                  onClick={() => !isLocked && onPatternClick?.(patternId)}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {PATTERN_DISPLAY_NAMES[patternId] || patternId}
                    </span>
                  </div>
                  
                  {isActive ? (
                    <div className="flex items-center justify-center gap-2 text-[10px]">
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" />
                        {data?.longCount || 0}
                      </span>
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5">
                        <TrendingDown className="h-3 w-3" />
                        {data?.shortCount || 0}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-[10px] text-muted-foreground">
                      <Minus className="h-3 w-3 mr-1" />
                      No signals
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isLocked ? (
                  <span>Upgrade to unlock this pattern</span>
                ) : isActive ? (
                  <span>{count} active signal{count !== 1 ? 's' : ''} detected</span>
                ) : (
                  <span>Scanning for this pattern - no signals yet</span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
