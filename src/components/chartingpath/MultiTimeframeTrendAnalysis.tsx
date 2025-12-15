import React, { useState, useEffect } from 'react';
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

  const microTrends = trends.filter(t => t.category === 'micro');
  const macroTrends = trends.filter(t => t.category === 'macro');

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
                {/* Error state */}
                {error && (
                  <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                    <AlertCircle className="w-3 h-3 mt-[2px]" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Overall suggestion (only when we actually have trends) */}
                {overallBias && trends.length > 0 && (
                  <div className={`text-sm font-medium ${overallBias.color} bg-muted/50 rounded-md px-3 py-2`}>
                    💡 {overallBias.suggestion}
                  </div>
                )}

                {/* Macro Trends */}
                {macroTrends.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Macro Trends (Higher Timeframes)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {macroTrends.map((trend) => (
                        <div
                          key={trend.timeframe}
                          className={`flex flex-col items-center gap-1 p-2 rounded-md border ${getTrendColor(trend.trend)}`}
                        >
                          <div className="flex items-center gap-1">
                            {getTrendIcon(trend.trend)}
                            <span className="text-xs font-semibold">{trend.label}</span>
                          </div>
                          <span className="text-[10px] opacity-80">{getTrendLabel(trend.trend)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Micro Trends */}
                {microTrends.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Micro Trends (Lower Timeframes)
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {microTrends.map((trend) => (
                        <div
                          key={trend.timeframe}
                          className={`flex flex-col items-center gap-1 p-2 rounded-md border ${getTrendColor(trend.trend)}`}
                        >
                          <div className="flex items-center gap-1">
                            {getTrendIcon(trend.trend)}
                            <span className="text-xs font-semibold">{trend.label}</span>
                          </div>
                          <span className="text-[10px] opacity-80">{getTrendLabel(trend.trend)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No data fallback */}
                {!error && trends.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    No trend data is cached yet for this instrument and timeframes. Try a major FX pair like EUR/USD or GBP/USD, or a popular symbol such as AAPL, SPY, or BTC/USD.
                  </div>
                )}

                {/* EMA Legend */}
                <div className="text-[10px] text-muted-foreground pt-1 border-t">
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
