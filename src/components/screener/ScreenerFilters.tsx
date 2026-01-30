import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
  Target, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Minus,
  X,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DirectionFilter = 'all' | 'long' | 'short';
export type TrendFilter = 'all' | 'with_trend' | 'counter_trend';
export type AgeFilter = 'all' | 'fresh' | 'recent' | 'aging';

// Age filter thresholds (in hours)
const AGE_THRESHOLDS = {
  fresh: 24,    // < 1 day
  recent: 72,   // < 3 days
  aging: 168,   // < 1 week
} as const;

export interface ScreenerFiltersState {
  direction: DirectionFilter;
  pattern: string;
  trend: TrendFilter;
  minRR: number;
  age: AgeFilter;
}

interface ScreenerFiltersProps {
  // Available options
  patterns: { id: string; name: string; count: number }[];
  
  // Current filter state
  filters: ScreenerFiltersState;
  
  // Stats for badges
  stats: {
    total: number;
    filtered: number;
    longCount: number;
    shortCount: number;
    withTrend: number;
    counterTrend: number;
    neutral: number;
    freshCount: number;
    recentCount: number;
    agingCount: number;
  };
  
  // Callbacks
  onChange: (filters: Partial<ScreenerFiltersState>) => void;
  onClear: () => void;
}

export const DEFAULT_SCREENER_FILTERS: ScreenerFiltersState = {
  direction: 'all',
  pattern: 'all',
  trend: 'all',
  minRR: 0,
  age: 'all',
};

export function ScreenerFilters({
  patterns,
  filters,
  stats,
  onChange,
  onClear,
}: ScreenerFiltersProps) {
  const hasActiveFilters = useMemo(() => {
    return filters.direction !== 'all' ||
           filters.pattern !== 'all' ||
           filters.trend !== 'all' ||
           filters.minRR > 0 ||
           filters.age !== 'all';
  }, [filters]);

  return (
    <div className="space-y-3">
      {/* Primary Filter Row: Direction Toggle + Pattern + Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Direction Toggle - Most important trader filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background p-1">
          <Button
            variant={filters.direction === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3 text-xs font-medium"
            onClick={() => onChange({ direction: 'all' })}
          >
            All
            <Badge variant="outline" className="ml-1.5 h-4 text-[10px] px-1.5 bg-background">
              {stats.total}
            </Badge>
          </Button>
          <Button
            variant={filters.direction === 'long' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "h-8 px-3 text-xs font-medium gap-1",
              filters.direction === 'long' && "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
            onClick={() => onChange({ direction: 'long' })}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Long
            {stats.longCount > 0 && (
              <Badge variant="outline" className={cn(
                "ml-0.5 h-4 text-[10px] px-1.5",
                filters.direction === 'long' ? "bg-emerald-700/50 border-emerald-500/50" : "bg-background"
              )}>
                {stats.longCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={filters.direction === 'short' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "h-8 px-3 text-xs font-medium gap-1",
              filters.direction === 'short' && "bg-red-600 hover:bg-red-700 text-white"
            )}
            onClick={() => onChange({ direction: 'short' })}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Short
            {stats.shortCount > 0 && (
              <Badge variant="outline" className={cn(
                "ml-0.5 h-4 text-[10px] px-1.5",
                filters.direction === 'short' ? "bg-red-700/50 border-red-500/50" : "bg-background"
              )}>
                {stats.shortCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Pattern Filter */}
        <Select value={filters.pattern} onValueChange={(v) => onChange({ pattern: v })}>
          <SelectTrigger className="h-9 w-44 text-xs">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All Patterns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patterns</SelectItem>
            {patterns.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center justify-between w-full">
                  <span>{p.name}</span>
                  {p.count > 0 && (
                    <Badge variant="secondary" className="ml-2 h-4 text-[10px] px-1.5">
                      {p.count}
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Trend Alignment Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ToggleGroup 
                  type="single" 
                  value={filters.trend} 
                  onValueChange={(v) => v && onChange({ trend: v as TrendFilter })}
                  className="border border-border/60 rounded-lg p-1 bg-background"
                >
                  <ToggleGroupItem value="all" className="text-xs px-2.5 h-7">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="with_trend" className="text-xs px-2.5 h-7 gap-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    Trend
                    {stats.withTrend > 0 && (
                      <Badge variant="secondary" className="h-4 text-[10px] px-1 ml-0.5">
                        {stats.withTrend}
                      </Badge>
                    )}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="counter_trend" className="text-xs px-2.5 h-7 gap-1">
                    <ArrowDownRight className="h-3 w-3 text-amber-500" />
                    Counter
                    {stats.counterTrend > 0 && (
                      <Badge variant="secondary" className="h-4 text-[10px] px-1 ml-0.5">
                        {stats.counterTrend}
                      </Badge>
                    )}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm p-4">
              <p className="font-semibold mb-2">Trend Alignment</p>
              <div className="text-xs space-y-2 text-muted-foreground">
                <div className="flex gap-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 mt-0.5" />
                  <span><strong className="text-emerald-600">With Trend</strong> — Pattern aligns with market direction. Higher probability.</span>
                </div>
                <div className="flex gap-2">
                  <ArrowDownRight className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                  <span><strong className="text-amber-600">Counter Trend</strong> — Reversal setup. Higher risk, larger reward potential.</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}

        {/* Results Count */}
        <div className="ml-auto">
          <Badge variant="outline" className="text-xs font-medium">
            {stats.filtered === stats.total 
              ? `${stats.total} setups`
              : `${stats.filtered} of ${stats.total}`
            }
          </Badge>
        </div>
      </div>

      {/* Secondary Filter Row: R:R Threshold + Age Filter */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Min R:R Presets - Using trader-friendly notation: Risk:Reward */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 p-1">
                <Target className="h-3.5 w-3.5 text-muted-foreground ml-2" />
                <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">R:R</span>
                <Button
                  variant={filters.minRR === 0 ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => onChange({ minRR: 0 })}
                >
                  Any
                </Button>
                <Button
                  variant={filters.minRR === 1.5 ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs font-mono",
                    filters.minRR === 1.5 && "bg-primary"
                  )}
                  onClick={() => onChange({ minRR: 1.5 })}
                >
                  1:1.5
                </Button>
                <Button
                  variant={filters.minRR === 2 ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs font-mono",
                    filters.minRR === 2 && "bg-primary"
                  )}
                  onClick={() => onChange({ minRR: 2 })}
                >
                  1:2
                </Button>
                <Button
                  variant={filters.minRR === 3 ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs font-mono",
                    filters.minRR === 3 && "bg-primary"
                  )}
                  onClick={() => onChange({ minRR: 3 })}
                >
                  1:3
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium mb-2">Risk to Reward Ratio</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div><strong>1:2</strong> — Risk $1 to potentially gain $2</div>
                <div><strong>1:3</strong> — Risk $1 to potentially gain $3</div>
                <div className="pt-1 text-muted-foreground/80">Pro traders typically require at least 1:2</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Age Presets */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 p-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground ml-2" />
                <Button
                  variant={filters.age === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => onChange({ age: 'all' })}
                >
                  Any Age
                </Button>
                <Button
                  variant={filters.age === 'fresh' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs gap-1",
                    filters.age === 'fresh' && "bg-primary"
                  )}
                  onClick={() => onChange({ age: 'fresh' })}
                >
                  Fresh
                  {stats.freshCount > 0 && (
                    <Badge variant="outline" className={cn(
                      "h-4 text-[10px] px-1",
                      filters.age === 'fresh' ? "bg-primary-foreground/20" : "bg-background"
                    )}>
                      {stats.freshCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={filters.age === 'recent' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs gap-1",
                    filters.age === 'recent' && "bg-primary"
                  )}
                  onClick={() => onChange({ age: 'recent' })}
                >
                  Recent
                  {stats.recentCount > 0 && (
                    <Badge variant="outline" className={cn(
                      "h-4 text-[10px] px-1",
                      filters.age === 'recent' ? "bg-primary-foreground/20" : "bg-background"
                    )}>
                      {stats.recentCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium mb-2">Signal Age</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div><strong>Fresh:</strong> &lt;24h old — Newest setups</div>
                <div><strong>Recent:</strong> &lt;3 days — Still actionable</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// Helper to calculate age stats from patterns
export function calculateAgeStats(
  patterns: { signalTs: string }[]
): { freshCount: number; recentCount: number; agingCount: number } {
  const now = Date.now();
  let freshCount = 0;
  let recentCount = 0;
  let agingCount = 0;

  patterns.forEach(p => {
    const ageHours = (now - new Date(p.signalTs).getTime()) / (1000 * 60 * 60);
    if (ageHours < AGE_THRESHOLDS.fresh) {
      freshCount++;
    } else if (ageHours < AGE_THRESHOLDS.recent) {
      recentCount++;
    } else {
      agingCount++;
    }
  });

  return { freshCount, recentCount, agingCount };
}

// Helper to filter patterns by age
export function filterByAge(
  patterns: { signalTs: string }[],
  ageFilter: AgeFilter
): typeof patterns {
  if (ageFilter === 'all') return patterns;
  
  const now = Date.now();
  return patterns.filter(p => {
    const ageHours = (now - new Date(p.signalTs).getTime()) / (1000 * 60 * 60);
    switch (ageFilter) {
      case 'fresh':
        return ageHours < AGE_THRESHOLDS.fresh;
      case 'recent':
        return ageHours < AGE_THRESHOLDS.recent;
      case 'aging':
        return ageHours >= AGE_THRESHOLDS.recent;
      default:
        return true;
    }
  });
}

// Helper to filter patterns by minRR
export function filterByMinRR<T extends { tradePlan: { rr: number } }>(
  patterns: T[],
  minRR: number
): T[] {
  if (minRR <= 0) return patterns;
  return patterns.filter(p => p.tradePlan.rr >= minRR);
}
