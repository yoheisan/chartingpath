import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  X, 
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Filter
} from 'lucide-react';

export type SortOption = 'newest' | 'rr_high' | 'rr_low' | 'quality';
export type DirectionFilter = 'all' | 'long' | 'short';

interface SetupFiltersProps {
  patterns: string[];
  timeframes: string[];
  // Current values
  searchQuery: string;
  selectedPattern: string;
  selectedTimeframe: string;
  selectedDirection: DirectionFilter;
  sortBy: SortOption;
  // Handlers
  onSearchChange: (query: string) => void;
  onPatternChange: (pattern: string) => void;
  onTimeframeChange: (timeframe: string) => void;
  onDirectionChange: (direction: DirectionFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  // Stats
  filteredCount: number;
  totalCount: number;
}

export default function SetupFilters({
  patterns,
  timeframes,
  searchQuery,
  selectedPattern,
  selectedTimeframe,
  selectedDirection,
  sortBy,
  onSearchChange,
  onPatternChange,
  onTimeframeChange,
  onDirectionChange,
  onSortChange,
  onClearFilters,
  filteredCount,
  totalCount,
}: SetupFiltersProps) {
  const hasActiveFilters = useMemo(() => {
    return searchQuery !== '' || 
           selectedPattern !== 'all' || 
           selectedTimeframe !== 'all' || 
           selectedDirection !== 'all';
  }, [searchQuery, selectedPattern, selectedTimeframe, selectedDirection]);

  return (
    <div className="space-y-4">
      {/* Search + Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbol..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="rr_high">Best R:R</SelectItem>
            <SelectItem value="rr_low">Lowest R:R</SelectItem>
            <SelectItem value="quality">Quality Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        
        {/* Direction Toggle */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          <Button
            variant={selectedDirection === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none h-8 px-3"
            onClick={() => onDirectionChange('all')}
          >
            All
          </Button>
          <Button
            variant={selectedDirection === 'long' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none h-8 px-3 border-x border-border/50"
            onClick={() => onDirectionChange('long')}
          >
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            Long
          </Button>
          <Button
            variant={selectedDirection === 'short' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none h-8 px-3"
            onClick={() => onDirectionChange('short')}
          >
            <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            Short
          </Button>
        </div>

        {/* Pattern Filter */}
        <Select value={selectedPattern} onValueChange={onPatternChange}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patterns</SelectItem>
            {patterns.map(pattern => (
              <SelectItem key={pattern} value={pattern}>
                {pattern.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Timeframe Filter */}
        {timeframes.length > 1 && (
          <Select value={selectedTimeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All TFs</SelectItem>
              {timeframes.map(tf => (
                <SelectItem key={tf} value={tf}>
                  {tf.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground"
            onClick={onClearFilters}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}

        {/* Results count */}
        <div className="ml-auto">
          <Badge variant="outline" className="text-xs">
            {filteredCount === totalCount 
              ? `${totalCount} setups`
              : `${filteredCount} of ${totalCount}`
            }
          </Badge>
        </div>
      </div>
    </div>
  );
}
