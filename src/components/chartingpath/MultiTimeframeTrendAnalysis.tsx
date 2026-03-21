import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TimeframeTrend {
  timeframe: string;
  label: string;
  trend: 'up' | 'down' | 'flat';
  ema20: number;
  ema50: number;
  currentPrice: number;
  category: 'micro' | 'macro';
}

interface MultiTimeframeTrendAnalysisProps {
  instrument: string;
  onTrendAnalysisComplete?: (trends: TimeframeTrend[]) => void;
}

const TIMEFRAMES = [
  { id: '5m', label: '5 Min', category: 'micro' as const },
  { id: '15m', label: '15 Min', category: 'micro' as const },
  { id: '1h', label: '1 Hour', category: 'micro' as const },
  { id: '4h', label: '4 Hour', category: 'micro' as const },
  { id: '8h', label: '8 Hour', category: 'micro' as const },
  { id: '1d', label: 'Daily', category: 'macro' as const },
  { id: '1w', label: 'Weekly', category: 'macro' as const },
  { id: '1M', label: 'Monthly', category: 'macro' as const },
];


export const MultiTimeframeTrendAnalysis: React.FC<MultiTimeframeTrendAnalysisProps> = ({
  instrument,
  onTrendAnalysisComplete
}) => {
  const [trends, setTrends] = useState<TimeframeTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analyzeTrends = async () => {
    if (!instrument) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-mtf-trend', {
        body: {
          symbol: instrument,
          timeframes: ['5m', '15m', '1h', '4h', '8h', '1d', '1w', '1M']
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Trend analysis function error');
      }

      if (!data?.success) {
        throw new Error(data?.message || data?.error || 'Failed to analyze trends');
      }

      setTrends(data.trends || []);
      setLastUpdated(new Date());
      
      if (onTrendAnalysisComplete) {
        onTrendAnalysisComplete(data.trends || []);
      }

      console.log('MTF Analysis:', data.summary);
    } catch (err) {
      console.error('MTF Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trend data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (instrument) {
      analyzeTrends();
    }
  }, [instrument]);

  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return 'bg-green-500/20 text-green-600 border-green-500/50';
      case 'down':
        return 'bg-red-500/20 text-red-600 border-red-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
    }
  };

  const getTrendLabel = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return 'Bullish';
      case 'down':
        return 'Bearish';
      default:
        return 'Sideways';
    }
  };

  const trendByTimeframe = useMemo(() => {
    const map = new Map<string, TimeframeTrend>();
    for (const t of trends) {
      map.set(t.timeframe, t);
    }
    return map;
  }, [trends]);

  const microTimeframes = TIMEFRAMES.filter((t) => t.category === 'micro');
  const macroTimeframes = TIMEFRAMES.filter((t) => t.category === 'macro');

  const renderTimeframeCard = (tf: (typeof TIMEFRAMES)[number]) => {
    const trend = trendByTimeframe.get(tf.id);

    if (!trend) {
      return (
        <div
          key={tf.id}
          className="flex flex-col items-center gap-1 p-2 rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground"
        >
          <div className="flex items-center gap-1">
            <Minus className="w-4 h-4" />
            <span className="text-xs font-semibold">{tf.label}</span>
          </div>
          <span className="text-sm opacity-80">No data</span>
        </div>
      );
    }

    return (
      <div
        key={trend.timeframe}
        className={`flex flex-col items-center gap-1 p-2 rounded-md border ${getTrendColor(trend.trend)}`}
      >
        <div className="flex items-center gap-1">
          {getTrendIcon(trend.trend)}
          <span className="text-xs font-semibold">{trend.label}</span>
        </div>
        <span className="text-sm opacity-80">{getTrendLabel(trend.trend)}</span>
      </div>
    );
  };

  const getOverallBias = () => {
    if (trends.length === 0) return null;
    
    const upCount = trends.filter(t => t.trend === 'up').length;
    const downCount = trends.filter(t => t.trend === 'down').length;
    const total = trends.length;
    
    if (upCount > total * 0.6) return { bias: 'Bullish', color: 'text-green-600', suggestion: 'Focus on Long patterns' };
    if (downCount > total * 0.6) return { bias: 'Bearish', color: 'text-red-600', suggestion: 'Focus on Short patterns' };
    return { bias: 'Mixed', color: 'text-yellow-600', suggestion: 'Use Bidirectional patterns with caution' };
  };

  const overallBias = getOverallBias();

  if (!instrument) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4 text-center text-muted-foreground text-sm">
          Select an instrument to view multi-timeframe trend analysis
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="bg-gradient-to-br from-card to-muted/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Multi-Timeframe Trend Analysis
                <Badge variant="outline" className="text-xs">
                  {instrument}
                </Badge>
                {overallBias && (
                  <Badge className={`text-xs ${getTrendColor(overallBias.bias === 'Bullish' ? 'up' : overallBias.bias === 'Bearish' ? 'down' : 'flat')}`}>
                    {overallBias.bias} Bias
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground font-normal">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    analyzeTrends();
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 space-y-3">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                {TIMEFRAMES.map((tf) => (
                  <Skeleton key={tf.id} className="h-16 rounded-md" />
                ))}
              </div>
            ) : (
              <>
                {/* Error state - show helpful message for missing data */}
                {error && (
                  <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                    <AlertCircle className="w-3 h-3 mt-[2px] flex-shrink-0" />
                    <div className="space-y-1">
                      <span>MTF analysis unavailable: {error.includes('No cached data') || error.includes('No data available') 
                        ? 'Historical data not yet cached for this symbol.' 
                        : error}
                      </span>
                      <p className="text-muted-foreground">
                        Try popular pairs like EUR/USD, GBP/USD, or symbols like AAPL, SPY, BTCUSD.
                      </p>
                    </div>
                  </div>
                )}

                {/* Only show trends UI when we have data and no error */}
                {!error && trends.length > 0 && (
                  <>
                    {/* Overall suggestion */}
                    {overallBias && (
                      <div className={`text-sm font-medium ${overallBias.color} bg-muted/50 rounded-md px-3 py-2`}>
                        💡 {overallBias.suggestion}
                      </div>
                    )}

                    {/* Macro Trends */}
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Macro Trends (Higher Timeframes)
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {macroTimeframes.map(renderTimeframeCard)}
                      </div>
                    </div>

                    {/* Micro Trends */}
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Micro Trends (Lower Timeframes)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {microTimeframes.map(renderTimeframeCard)}
                      </div>
                    </div>

                    {/* EMA Legend */}
                    <div className="text-sm text-muted-foreground pt-1 border-t">
                      Trend calculated using EMA 20/50 crossover: Price above both EMAs = Bullish, below both = Bearish, between = Sideways
                    </div>
                  </>
                )}

                {/* No data fallback - only when no error and no trends */}
                {!error && trends.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    No trend data cached for this instrument. Try EUR/USD, GBP/USD, AAPL, SPY, or BTC/USD.
                  </div>
                )}

                {/* EMA Legend */}
                <div className="text-sm text-muted-foreground pt-1 border-t">
                  Trend calculated using EMA 20/50 crossover: Price above both EMAs = Bullish, below both = Bearish, between = Sideways
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
