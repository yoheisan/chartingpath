import { useState, useEffect, useCallback, memo } from 'react';
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
import { ExternalLink, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StudyChart from '@/components/charts/StudyChart';
import { CompressedBar } from '@/types/VisualSpec';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';

interface CommandCenterChartProps {
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

const TIMEFRAMES = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1wk', label: '1W' },
];

export const CommandCenterChart = memo(function CommandCenterChart({
  symbol,
  timeframe,
  onTimeframeChange,
}: CommandCenterChartProps) {
  const [bars, setBars] = useState<CompressedBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ current: number; change: number; changePct: number } | null>(null);

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch from historical_prices table
      const { data, error: dbError } = await supabase
        .from('historical_prices')
        .select('date, open, high, low, close, volume')
        .eq('symbol', symbol)
        .eq('timeframe', timeframe)
        .order('date', { ascending: true })
        .limit(200);

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        // Fallback to edge function
        const { data: fnData, error: fnError } = await supabase.functions.invoke('fetch-yahoo-finance', {
          body: { symbol, range: '1y', interval: timeframe === '1d' ? '1d' : timeframe },
        });

        if (fnError) throw fnError;
        
        const fetchedBars: CompressedBar[] = (fnData?.bars || []).map((b: any) => ({
          t: b.date || (typeof b.t === 'number' ? new Date(b.t * 1000).toISOString() : b.t),
          o: b.open || b.o,
          h: b.high || b.h,
          l: b.low || b.l,
          c: b.close || b.c,
          v: b.volume || b.v,
        }));

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
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <InstrumentLogo instrument={symbol} size="md" showName={false} />
          <div>
            <h2 className="text-lg font-semibold">{symbol}</h2>
            {priceData && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{formatPrice(priceData.current)}</span>
                <span className={getChangeColor()}>
                  {priceData.change >= 0 ? '+' : ''}{formatPrice(priceData.change)} ({priceData.changePct >= 0 ? '+' : ''}{priceData.changePct.toFixed(2)}%)
                </span>
                {getTrendIcon()}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <Select value={timeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-20 h-8">
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

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchChartData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

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
            <StudyChart bars={bars} symbol={symbol} height={undefined} />
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
