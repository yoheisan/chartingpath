import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, TrendingUp, TrendingDown, Minus, RefreshCw, Star, StarOff, Loader2, MapPin, Search } from 'lucide-react';
import { UniversalSymbolSearch } from '@/components/charts/UniversalSymbolSearch';
import { supabase } from '@/integrations/supabase/client';
import StudyChart, { ChartMarker } from '@/components/charts/StudyChart';
import { CompressedBar } from '@/types/VisualSpec';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getChartDataLimits, Timeframe } from '@/config/dataCoverageContract';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTradingCopilotContext } from '@/components/copilot';

interface CommandCenterChartProps {
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  onSymbolChange?: (symbol: string) => void;
  onWatchlistChange?: () => void;
}

const TIMEFRAMES = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '8h', label: '8H' },
  { value: '1d', label: '1D' },
  { value: '1wk', label: '1W' },
];

const PATTERN_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'double-top', label: 'Double Top' },
  { value: 'double-bottom', label: 'Double Bottom' },
  { value: 'head-and-shoulders', label: 'Head & Shoulders' },
  { value: 'inverse-head-and-shoulders', label: 'Inv. H&S' },
  { value: 'ascending-triangle', label: 'Asc. Triangle' },
  { value: 'descending-triangle', label: 'Desc. Triangle' },
  { value: 'rising-wedge', label: 'Rising Wedge' },
  { value: 'falling-wedge', label: 'Falling Wedge' },
  { value: 'bull-flag', label: 'Bull Flag' },
  { value: 'bear-flag', label: 'Bear Flag' },
  { value: 'cup-and-handle', label: 'Cup & Handle' },
  { value: 'triple-top', label: 'Triple Top' },
  { value: 'triple-bottom', label: 'Triple Bottom' },
  { value: 'donchian-breakout-long', label: 'Donchian Long' },
  { value: 'donchian-breakout-short', label: 'Donchian Short' },
];

export const CommandCenterChart = memo(function CommandCenterChart({
  symbol,
  timeframe,
  onTimeframeChange,
  onSymbolChange,
  onWatchlistChange,
}: CommandCenterChartProps) {
  const { profile, user } = useUserProfile();
  const isMobile = useIsMobile();
  const copilot = useTradingCopilotContext();
  const userId = user?.id;
  const [bars, setBars] = useState<CompressedBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ current: number; change: number; changePct: number } | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState('none');
  const [patternOccurrences, setPatternOccurrences] = useState<any[]>([]);
  const [patternLoading, setPatternLoading] = useState(false);

  // Check if user is on a paid plan
  const isPaidUser = profile?.subscription_plan && 
    !['free', 'starter'].includes(profile.subscription_plan);

  // Check if symbol is in user's watchlist
  const checkWatchlistStatus = useCallback(async () => {
    if (!userId || !isPaidUser) {
      setIsInWatchlist(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('symbol', symbol.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      setIsInWatchlist(!!data);
    } catch (err) {
      console.error('[CommandCenterChart] watchlist check error:', err);
    }
  }, [userId, isPaidUser, symbol]);

  useEffect(() => {
    checkWatchlistStatus();
  }, [checkWatchlistStatus]);

  // Add to watchlist
  const addToWatchlist = async () => {
    if (!userId) {
      toast.error('Please sign in to add to watchlist');
      return;
    }
    if (!isPaidUser) {
      toast.error('Upgrade to a paid plan to create custom watchlists');
      return;
    }

    setWatchlistLoading(true);
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({
          user_id: userId,
          symbol: symbol.toUpperCase(),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Symbol already in watchlist');
        } else {
          throw error;
        }
      } else {
        toast.success(`${symbol} added to watchlist`);
        setIsInWatchlist(true);
        onWatchlistChange?.();
      }
    } catch (err) {
      console.error('[CommandCenterChart] add to watchlist error:', err);
      toast.error('Failed to add to watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async () => {
    if (!userId) return;

    setWatchlistLoading(true);
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', symbol.toUpperCase());

      if (error) throw error;
      toast.success(`${symbol} removed from watchlist`);
      setIsInWatchlist(false);
      onWatchlistChange?.();
    } catch (err) {
      console.error('[CommandCenterChart] remove from watchlist error:', err);
      toast.error('Failed to remove from watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use centralized DATA_COVERAGE limits
      const chartLimits = getChartDataLimits(timeframe as Timeframe);
      const { barLimit, minBarsRequired, daysBack } = chartLimits;

      console.log(`[CommandCenterChart] Fetching ${symbol} ${timeframe}: barLimit=${barLimit}, minBarsRequired=${minBarsRequired}, daysBack=${daysBack}`);

      // Fetch from historical_prices table
      const { data, error: dbError } = await supabase
        .from('historical_prices')
        .select('date, open, high, low, close, volume')
        .eq('symbol', symbol)
        .eq('timeframe', timeframe)
        .order('date', { ascending: true })
        .limit(barLimit);

      if (dbError) throw dbError;

      // Only use DB data if we have enough bars
      const hasEnoughData = data && data.length >= minBarsRequired;
      console.log(`[CommandCenterChart] DB returned ${data?.length || 0} bars, hasEnoughData=${hasEnoughData}`);

      if (!hasEnoughData) {
        // Fallback to Yahoo Finance
        // IMPORTANT: Yahoo limits hourly data to ~60 days, so for 4h/8h (aggregated from 1h)
        // we must use a shorter lookback to avoid API errors
        const isHourlyAggregated = ['4h', '8h'].includes(timeframe);
        const yahooLookbackDays = isHourlyAggregated ? 60 : daysBack;
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - yahooLookbackDays);
        
        console.log(`[CommandCenterChart] Using Yahoo fallback: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (${yahooLookbackDays} days)`);

        const { data: fnData, error: fnError } = await supabase.functions.invoke('fetch-yahoo-finance', {
          body: { 
            symbol, 
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            interval: timeframe,
            includeOhlc: true,
          },
        });

        if (fnError) {
          console.error('[CommandCenterChart] Yahoo fallback error:', fnError);
          throw new Error(fnError.message || 'Failed to fetch chart data');
        }
        
        console.log(`[CommandCenterChart] Yahoo returned ${fnData?.bars?.length || 0} bars`);
        
        const fetchedBars: CompressedBar[] = (fnData?.bars || []).map((b: any) => ({
          t: b.date || (typeof b.t === 'number' ? new Date(b.t * 1000).toISOString() : b.t),
          o: b.open || b.o,
          h: b.high || b.h,
          l: b.low || b.l,
          c: b.close || b.c,
          v: b.volume || b.v,
        }));

        if (fetchedBars.length === 0) {
          throw new Error('No data available for this symbol/timeframe');
        }

        setBars(fetchedBars);
        updatePriceData(fetchedBars);
      } else {
        const mapped: CompressedBar[] = data.map((row) => ({
          t: row.date,
          o: row.open,
          h: row.high,
          l: row.low,
          c: row.close,
          v: row.volume || 0,
        }));

        setBars(mapped);
        updatePriceData(mapped);
      }
    } catch (err: any) {
      console.error('[CommandCenterChart] fetch error:', err);
      setError(err.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  const updatePriceData = (chartBars: CompressedBar[]) => {
    if (chartBars.length < 2) return;
    
    const latest = chartBars[chartBars.length - 1];
    const prev = chartBars[chartBars.length - 2];
    const change = latest.c - prev.c;
    const changePct = (change / prev.c) * 100;

    setPriceData({
      current: latest.c,
      change,
      changePct,
    });
  };

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Fetch historical pattern occurrences when pattern is selected
  useEffect(() => {
    if (!selectedPattern || selectedPattern === 'none') {
      setPatternOccurrences([]);
      return;
    }

    const fetchPatterns = async () => {
      setPatternLoading(true);
      const upperSymbol = symbol.toUpperCase();
      console.log(`[CommandCenterChart] Fetching patterns: symbol=${upperSymbol}, pattern_id=${selectedPattern}`);
      try {
        const { data, error } = await supabase
          .from('historical_pattern_occurrences')
          .select('pattern_name, detected_at, direction, outcome, outcome_pnl_percent, quality_score, entry_price, visual_spec')
          .eq('symbol', upperSymbol)
          .eq('pattern_id', selectedPattern)
          .eq('validation_status', 'confirmed')
          .order('detected_at', { ascending: true })
          .limit(100);

        if (error) throw error;
        console.log(`[CommandCenterChart] Pattern query returned ${data?.length || 0} occurrences`);
        setPatternOccurrences(data || []);
      } catch (err) {
        console.error('[CommandCenterChart] pattern fetch error:', err);
        setPatternOccurrences([]);
      } finally {
        setPatternLoading(false);
      }
    };

    fetchPatterns();
  }, [selectedPattern, symbol]);

  // Generate chart markers from pattern occurrences
  // Show only structural pivots (T1, T2, NL, etc.) for all occurrences
  const chartMarkers: ChartMarker[] = useMemo(() => {
    if (!selectedPattern || selectedPattern === 'none' || patternOccurrences.length === 0) return [];
    
    const markers: ChartMarker[] = [];
    const occurrenceColors = ['#f97316', '#a855f7', '#06b6d4', '#eab308', '#ec4899'];
    
    patternOccurrences.forEach((p, idx) => {
      const color = occurrenceColors[idx % occurrenceColors.length];
      const vs = p.visual_spec as any;
      const pivots = vs?.pivots as Array<{ timestamp: string; label: string; type: string; price: number }> | undefined;
      
      if (pivots && pivots.length > 0) {
        pivots.forEach((pivot) => {
          const isHigh = pivot.type === 'high';
          const shortLabel = pivot.label
            .replace('Top ', 'T').replace('Bottom ', 'B')
            .replace('Neckline', 'NL').replace('Head', 'H')
            .replace('Shoulder ', 'S');
          markers.push({
            time: pivot.timestamp,
            position: isHigh ? 'aboveBar' : 'belowBar',
            color,
            shape: isHigh ? 'arrowDown' : 'arrowUp',
            text: shortLabel,
          });
        });
      }
    });
    
    // Deduplicate markers by time + text
    const seen = new Set<string>();
    return markers.filter((m) => {
      const key = `${m.time}|${m.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedPattern, patternOccurrences]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
  };

  const getTrendIcon = () => {
    if (!priceData) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (priceData.change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (priceData.change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = () => {
    if (!priceData) return 'text-muted-foreground';
    if (priceData.change > 0) return 'text-emerald-500';
    if (priceData.change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 border-b border-border">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <InstrumentLogo instrument={symbol} size={isMobile ? "sm" : "md"} showName={false} />
          <div>
            <h2 className="text-sm sm:text-lg font-semibold">{symbol}</h2>
            {priceData && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <span className="font-medium">{formatPrice(priceData.current)}</span>
                <span className={`${getChangeColor()} ${isMobile ? 'hidden xs:inline' : ''}`}>
                  {priceData.change >= 0 ? '+' : ''}{priceData.changePct.toFixed(2)}%
                </span>
                {getTrendIcon()}
              </div>
            )}
          </div>
          {onSymbolChange && (
            <UniversalSymbolSearch
              onSelect={(sym) => onSymbolChange(sym)}
              trigger={
                <Button variant="outline" size="sm" className="h-7 sm:h-8 gap-1.5 text-xs text-muted-foreground">
                  <Search className="h-3 w-3" />
                  <span className="hidden sm:inline">Search ticker...</span>
                </Button>
              }
            />
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Add to Watchlist Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isInWatchlist ? "secondary" : "outline"}
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={isInWatchlist ? removeFromWatchlist : addToWatchlist}
                disabled={watchlistLoading}
              >
                {watchlistLoading ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : isInWatchlist ? (
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-500 text-amber-500" />
                ) : (
                  <StarOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </TooltipContent>
          </Tooltip>

          {/* Timeframe Selector */}
          <Select value={timeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-16 sm:w-20 h-7 sm:h-8 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Pattern History Overlay */}
          {!isMobile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                    <SelectTrigger className={`w-8 h-8 p-0 justify-center ${selectedPattern && selectedPattern !== 'none' ? 'border-primary text-primary' : ''}`}>
                      {patternLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {PATTERN_OPTIONS.map((p) => (
                        <SelectItem key={p.value || 'none'} value={p.value || 'none'}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPattern && selectedPattern !== 'none' && patternOccurrences.length > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[9px] bg-primary text-primary-foreground">
                      {patternOccurrences.length}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {selectedPattern && selectedPattern !== 'none'
                  ? `${patternOccurrences.length} ${PATTERN_OPTIONS.find(p => p.value === selectedPattern)?.label || ''} occurrences`
                  : 'Map historical patterns'
                }
              </TooltipContent>
            </Tooltip>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={fetchChartData}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              asChild
            >
              <a
                href={`https://www.tradingview.com/chart/?symbol=${symbol}&aff_id=3433`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                TradingView
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Skeleton className="h-8 w-32 mx-auto" />
              <Skeleton className="h-[300px] w-full max-w-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchChartData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        ) : bars.length > 0 ? (
          <div className="h-full p-2">
            <StudyChart 
              bars={bars} 
              symbol={symbol} 
              timeframe={timeframe}
              autoHeight 
              onSendToCopilot={(context, analysis) => copilot.openWithAnalysis(context, analysis)}
              chartMarkers={chartMarkers}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available for {symbol}
          </div>
        )}
      </div>
    </div>
  );
});
