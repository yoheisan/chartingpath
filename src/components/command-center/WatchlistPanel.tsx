import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Search,
  Activity,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { cn } from '@/lib/utils';

interface WatchlistPanelProps {
  userId?: string;
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}

interface LivePattern {
  id: string;
  instrument: string;
  pattern_name: string;
  direction: string;
  quality_score: string | null;
  current_price: number | null;
  change_percent: number | null;
  timeframe: string;
}

interface WatchlistItem {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  hasPattern?: boolean;
}

// Default watchlist for demo
const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'ETH-USD', name: 'Ethereum' },
  { symbol: 'EURUSD=X', name: 'EUR/USD' },
  { symbol: 'GC=F', name: 'Gold Futures' },
];

export function WatchlistPanel({
  userId,
  selectedSymbol,
  onSymbolSelect,
}: WatchlistPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);
  const [activePatterns, setActivePatterns] = useState<LivePattern[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActivePatterns();
  }, []);

  const fetchActivePatterns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_pattern_detections')
        .select('id, instrument, pattern_name, direction, quality_score, current_price, change_percent, timeframe')
        .eq('status', 'active')
        .order('last_confirmed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivePatterns(data || []);
    } catch (err) {
      console.error('[WatchlistPanel] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWatchlist = watchlist.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPatternName = (name: string) => {
    return name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            Watchlist
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="watchlist" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b px-2 h-8">
          <TabsTrigger value="watchlist" className="text-xs h-6 px-2">
            <Star className="h-3 w-3 mr-1" />
            My List
          </TabsTrigger>
          <TabsTrigger value="patterns" className="text-xs h-6 px-2">
            <Activity className="h-3 w-3 mr-1" />
            Active Patterns
          </TabsTrigger>
        </TabsList>

        {/* Watchlist Tab */}
        <TabsContent value="watchlist" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-1">
              {filteredWatchlist.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => onSymbolSelect(item.symbol)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-muted/50 transition-colors',
                    selectedSymbol === item.symbol && 'bg-muted'
                  )}
                >
                  <InstrumentLogo instrument={item.symbol} size="sm" showName={false} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{item.symbol}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.name}</div>
                  </div>
                  {item.change !== undefined && (
                    <span
                      className={cn(
                        'text-xs',
                        item.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                      )}
                    >
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Active Patterns Tab */}
        <TabsContent value="patterns" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-1">
              {loading ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Loading patterns...
                </div>
              ) : activePatterns.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No active patterns detected
                </div>
              ) : (
                activePatterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => onSymbolSelect(pattern.instrument)}
                    className={cn(
                      'w-full flex flex-col gap-1 px-2 py-2 rounded-md text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0',
                      selectedSymbol === pattern.instrument && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <InstrumentLogo instrument={pattern.instrument} size="sm" showName={false} />
                      <span className="text-xs font-medium">{pattern.instrument}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] px-1 py-0',
                          pattern.direction === 'bullish'
                            ? 'border-emerald-500/50 text-emerald-600'
                            : 'border-red-500/50 text-red-600'
                        )}
                      >
                        {pattern.direction === 'bullish' ? (
                          <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                        )}
                        {pattern.direction}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        {formatPatternName(pattern.pattern_name)}
                      </span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        {pattern.timeframe}
                      </Badge>
                    </div>
                    {pattern.current_price && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span>${pattern.current_price.toFixed(2)}</span>
                        {pattern.change_percent !== null && (
                          <span
                            className={
                              pattern.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'
                            }
                          >
                            {pattern.change_percent >= 0 ? '+' : ''}
                            {pattern.change_percent.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
