import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BenchmarkData {
  symbol: string;
  displayName: string;
  data: { date: string; value: number }[];
  color: string;
  returnPercent: number;
}

interface BenchmarkSelectorProps {
  /** Date range from equity curve */
  startDate: string;
  endDate: string;
  /** Initial capital to normalize benchmark to */
  initialCapital: number;
  /** Callback when benchmark data changes */
  onBenchmarkChange: (benchmarks: BenchmarkData[]) => void;
}

const POPULAR_BENCHMARKS = [
  { symbol: 'SPY', name: 'S&P 500 (SPY)' },
  { symbol: 'QQQ', name: 'NASDAQ 100 (QQQ)' },
  { symbol: 'DIA', name: 'Dow Jones (DIA)' },
  { symbol: 'IWM', name: 'Russell 2000 (IWM)' },
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'GLD', name: 'Gold (GLD)' },
];

const BENCHMARK_COLORS = [
  'hsl(220, 70%, 60%)', // Blue
  'hsl(280, 70%, 60%)', // Purple
  'hsl(45, 90%, 55%)',  // Gold
  'hsl(160, 60%, 50%)', // Teal
];

const BenchmarkSelector = ({ 
  startDate, 
  endDate, 
  initialCapital,
  onBenchmarkChange 
}: BenchmarkSelectorProps) => {
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>([]);
  const [benchmarkData, setBenchmarkData] = useState<Map<string, BenchmarkData>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [customSymbol, setCustomSymbol] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Fetch benchmark data when selection changes
  const fetchBenchmark = async (symbol: string) => {
    if (benchmarkData.has(symbol)) return;
    
    setLoading(prev => new Set(prev).add(symbol));
    
    try {
      // Calculate date range - extend slightly beyond equity curve dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Extend start date back a bit to ensure we capture first equity point
      start.setDate(start.getDate() - 7);
      
      let bars: any[] = [];
      
      // Try Alpha Vantage first, then fallback to Yahoo Finance
      try {
        const { data, error } = await supabase.functions.invoke('fetch-alpha-vantage', {
          body: {
            symbol,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            outputSize: 'full',
          }
        });
        
        if (!error && data?.bars?.length) {
          bars = data.bars;
        } else {
          throw new Error('Alpha Vantage failed, trying Yahoo Finance');
        }
      } catch (avError) {
        console.warn('Alpha Vantage failed, falling back to Yahoo Finance:', avError);
        
        // Fallback to Yahoo Finance
        const { data: yahooData, error: yahooError } = await supabase.functions.invoke('fetch-yahoo-finance', {
          body: {
            symbol,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            interval: '1d',
            includeOhlc: true,
          }
        });
        if (yahooError || !yahooData?.bars?.length) {
          console.error('Yahoo Finance also failed:', yahooError);
          throw new Error('Both data providers failed');
        }
        
        bars = yahooData.bars;
      }

      if (!bars.length) {
        console.error('No data returned for benchmark:', symbol);
        setSelectedBenchmarks(prev => prev.filter(s => s !== symbol));
        return;
      }

      // Filter to date range and normalize to initial capital
      const startTs = new Date(startDate).getTime();
      const endTs = new Date(endDate).getTime();
      
      // Bars from edge function use 't' for timestamp and 'c' for close
      const filteredBars = bars.filter((bar: any) => {
        const barDate = bar.t || bar.date || bar.timestamp;
        const barTs = new Date(barDate).getTime();
        return barTs >= startTs && barTs <= endTs;
      });

      if (filteredBars.length === 0) {
        console.error('No data in date range for:', symbol);
        setSelectedBenchmarks(prev => prev.filter(s => s !== symbol));
        return;
      }

      // Normalize: start at initialCapital, scale proportionally
      // Bars use 'c' for close price
      const firstClose = filteredBars[0].c ?? filteredBars[0].close;
      const normalizedData = filteredBars.map((bar: any) => ({
        date: bar.t || bar.date || bar.timestamp,
        value: ((bar.c ?? bar.close) / firstClose) * initialCapital,
      }));

      const lastValue = normalizedData[normalizedData.length - 1].value;
      const returnPercent = ((lastValue - initialCapital) / initialCapital) * 100;

      const colorIndex = selectedBenchmarks.indexOf(symbol) % BENCHMARK_COLORS.length;
      
      const benchmark: BenchmarkData = {
        symbol,
        displayName: POPULAR_BENCHMARKS.find(b => b.symbol === symbol)?.name || symbol,
        data: normalizedData,
        color: BENCHMARK_COLORS[colorIndex],
        returnPercent,
      };

      setBenchmarkData(prev => new Map(prev).set(symbol, benchmark));
    } catch (err) {
      console.error('Error fetching benchmark:', err);
      setSelectedBenchmarks(prev => prev.filter(s => s !== symbol));
    } finally {
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    }
  };

  // Trigger fetch when selection changes
  useEffect(() => {
    selectedBenchmarks.forEach(symbol => {
      if (!benchmarkData.has(symbol)) {
        fetchBenchmark(symbol);
      }
    });
  }, [selectedBenchmarks]);

  // Notify parent of data changes
  useEffect(() => {
    const activeBenchmarks = selectedBenchmarks
      .map(s => benchmarkData.get(s))
      .filter(Boolean) as BenchmarkData[];
    onBenchmarkChange(activeBenchmarks);
  }, [benchmarkData, selectedBenchmarks, onBenchmarkChange]);

  const addBenchmark = (symbol: string) => {
    const normalizedSymbol = symbol.toUpperCase().trim();
    if (!normalizedSymbol || selectedBenchmarks.includes(normalizedSymbol)) return;
    if (selectedBenchmarks.length >= 4) return; // Max 4 benchmarks
    
    setSelectedBenchmarks(prev => [...prev, normalizedSymbol]);
    setCustomSymbol('');
    setPopoverOpen(false);
  };

  const removeBenchmark = (symbol: string) => {
    setSelectedBenchmarks(prev => prev.filter(s => s !== symbol));
    setBenchmarkData(prev => {
      const next = new Map(prev);
      next.delete(symbol);
      return next;
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Compare:</span>
      
      {/* Active benchmarks */}
      {selectedBenchmarks.map((symbol, idx) => {
        const data = benchmarkData.get(symbol);
        const isLoading = loading.has(symbol);
        
        return (
          <Badge 
            key={symbol} 
            variant="outline"
            className="gap-1.5 pr-1"
            style={{ borderColor: BENCHMARK_COLORS[idx % BENCHMARK_COLORS.length] }}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <TrendingUp className="h-3 w-3" style={{ color: BENCHMARK_COLORS[idx % BENCHMARK_COLORS.length] }} />
            )}
            <span>{symbol}</span>
            {data && (
              <span className={`text-xs ${data.returnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.returnPercent >= 0 ? '+' : ''}{data.returnPercent.toFixed(1)}%
              </span>
            )}
            <button 
              onClick={() => removeBenchmark(symbol)}
              className="ml-1 hover:bg-muted rounded p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}

      {/* Add benchmark button */}
      {selectedBenchmarks.length < 4 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1">
              <Plus className="h-3 w-3" />
              Add Benchmark
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <div className="text-sm font-medium">Popular Indices</div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_BENCHMARKS.filter(b => !selectedBenchmarks.includes(b.symbol)).map(b => (
                  <Button
                    key={b.symbol}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addBenchmark(b.symbol)}
                  >
                    {b.symbol}
                  </Button>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">Custom Ticker</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. AAPL, BTC-USD"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBenchmark(customSymbol)}
                    className="h-8 text-sm"
                  />
                  <Button 
                    size="sm" 
                    className="h-8"
                    onClick={() => addBenchmark(customSymbol)}
                    disabled={!customSymbol.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default BenchmarkSelector;
