import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Activity,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { cn } from '@/lib/utils';

interface MarketOverviewPanelProps {
  onSymbolSelect: (symbol: string) => void;
}

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Major indices and market benchmarks
const MARKET_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^VIX', name: 'VIX' },
  { symbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'ETH-USD', name: 'Ethereum' },
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'CL=F', name: 'Crude Oil' },
  { symbol: 'EURUSD=X', name: 'EUR/USD' },
  { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
];

export function MarketOverviewPanel({ onSymbolSelect }: MarketOverviewPanelProps) {
  const [indicesData, setIndicesData] = useState<Record<string, { price: number; change: number }>>({});
  const [topGainers, setTopGainers] = useState<MarketMover[]>([]);
  const [topLosers, setTopLosers] = useState<MarketMover[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      // Fetch from live_pattern_detections for price data
      const { data: patterns, error } = await supabase
        .from('live_pattern_detections')
        .select('instrument, current_price, change_percent')
        .eq('status', 'active')
        .not('current_price', 'is', null)
        .not('change_percent', 'is', null)
        .order('change_percent', { ascending: false });

      if (error) throw error;

      // Build indices data map from patterns that match our MARKET_INDICES
      const indicesSymbols = MARKET_INDICES.map((i) => i.symbol);
      const indicesMap: Record<string, { price: number; change: number }> = {};
      
      if (patterns && patterns.length > 0) {
        for (const p of patterns) {
          if (indicesSymbols.includes(p.instrument) && !indicesMap[p.instrument]) {
            indicesMap[p.instrument] = {
              price: p.current_price || 0,
              change: p.change_percent || 0,
            };
          }
        }
      }

      // For indices not in live_pattern_detections, fetch latest from historical_prices
      const missingIndices = indicesSymbols.filter((s) => !indicesMap[s]);
      if (missingIndices.length > 0) {
        const { data: historicalData } = await supabase
          .from('historical_prices')
          .select('symbol, close, open')
          .in('symbol', missingIndices)
          .eq('timeframe', '1d')
          .order('date', { ascending: false })
          .limit(missingIndices.length * 2);

        if (historicalData) {
          // Get most recent price per symbol
          for (const h of historicalData) {
            if (!indicesMap[h.symbol]) {
              const change = h.open > 0 ? ((h.close - h.open) / h.open) * 100 : 0;
              indicesMap[h.symbol] = {
                price: h.close,
                change: change,
              };
            }
          }
        }
      }

      setIndicesData(indicesMap);

      // Top gainers (unique symbols)
      if (patterns && patterns.length > 0) {
        const seen = new Set<string>();
        const gainers = patterns
          .filter((p) => {
            if (seen.has(p.instrument) || (p.change_percent || 0) <= 0) return false;
            seen.add(p.instrument);
            return true;
          })
          .slice(0, 5)
          .map((p) => ({
            symbol: p.instrument,
            name: p.instrument,
            price: p.current_price || 0,
            change: 0,
            changePercent: p.change_percent || 0,
          }));
        setTopGainers(gainers);

        // Top losers (unique symbols)
        const seenLosers = new Set<string>();
        const sortedLosers = [...patterns].sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0));
        const losers = sortedLosers
          .filter((p) => {
            if (seenLosers.has(p.instrument) || (p.change_percent || 0) >= 0) return false;
            seenLosers.add(p.instrument);
            return true;
          })
          .slice(0, 5)
          .map((p) => ({
            symbol: p.instrument,
            name: p.instrument,
            price: p.current_price || 0,
            change: 0,
            changePercent: p.change_percent || 0,
          }));
        setTopLosers(losers);
      }
    } catch (err) {
      console.error('[MarketOverviewPanel] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Globe className="h-4 w-4" />
          Market Overview
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={fetchMarketData}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="indices" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b px-2 h-8">
          <TabsTrigger value="indices" className="text-xs h-6 px-2">
            <Activity className="h-3 w-3 mr-1" />
            Indices
          </TabsTrigger>
          <TabsTrigger value="movers" className="text-xs h-6 px-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            Movers
          </TabsTrigger>
        </TabsList>

        {/* Indices Tab */}
        <TabsContent value="indices" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {MARKET_INDICES.map((index) => (
                <button
                  key={index.symbol}
                  onClick={() => onSymbolSelect(index.symbol)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <InstrumentLogo instrument={index.symbol} size="sm" showName={false} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-medium">{index.name}</div>
                    <div className="text-[10px] text-muted-foreground">{index.symbol}</div>
                  </div>
                  <div className="text-right">
                    {indicesData[index.symbol] ? (
                      <>
                        <div className="text-xs font-medium">
                          {formatPrice(indicesData[index.symbol].price)}
                        </div>
                        <div
                          className={cn(
                            'text-[10px]',
                            indicesData[index.symbol].change >= 0
                              ? 'text-emerald-500'
                              : 'text-red-500'
                          )}
                        >
                          {indicesData[index.symbol].change >= 0 ? '+' : ''}
                          {indicesData[index.symbol].change.toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">--</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Movers Tab */}
        <TabsContent value="movers" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2">
              {/* Top Gainers */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Top Gainers
                </h4>
                {topGainers.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground px-2">No data available</p>
                ) : (
                  <div className="space-y-1">
                    {topGainers.map((mover) => (
                      <button
                        key={mover.symbol}
                        onClick={() => onSymbolSelect(mover.symbol)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <InstrumentLogo instrument={mover.symbol} size="sm" showName={false} />
                        <span className="text-xs font-medium flex-1 text-left">{mover.symbol}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">
                          +{mover.changePercent.toFixed(2)}%
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Losers */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Top Losers
                </h4>
                {topLosers.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground px-2">No data available</p>
                ) : (
                  <div className="space-y-1">
                    {topLosers.map((mover) => (
                      <button
                        key={mover.symbol}
                        onClick={() => onSymbolSelect(mover.symbol)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <InstrumentLogo instrument={mover.symbol} size="sm" showName={false} />
                        <span className="text-xs font-medium flex-1 text-left">{mover.symbol}</span>
                        <Badge className="bg-red-500/10 text-red-600 border-0 text-[10px]">
                          {mover.changePercent.toFixed(2)}%
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
