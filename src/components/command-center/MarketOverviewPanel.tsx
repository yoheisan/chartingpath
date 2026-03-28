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
  Calendar,
  BarChart3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fetchMarketBars } from '@/lib/fetchMarketBars';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { cn } from '@/lib/utils';
import { EconomicCalendarWidget } from './EconomicCalendarWidget';
import { useMarketDataCache } from '@/hooks/useMarketDataCache';
import { useTranslation } from 'react-i18next';
import { CardCaptureButton } from '@/components/capture';

interface BreadthData {
  advances: number;
  declines: number;
  unchanged: number;
  advanceDeclineRatio: number;
  advanceDeclineLine: number;
  timestamp: string;
  exchange: string;
}

interface BreadthMeta {
  total: number;
  advancePercent: number;
  declinePercent: number;
  sentiment: 'bullish' | 'neutral-bullish' | 'neutral-bearish' | 'bearish';
}

interface BreadthResponse {
  data: BreadthData;
  meta: BreadthMeta;
  dataAvailable?: boolean;
  dataSource?: 'yahoo' | 'finnhub' | 'fallback' | 'unavailable';
  breadthError?: string;
}

interface MarketOverviewPanelProps {
  onSymbolSelect: (symbol: string) => void;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
}

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketDataResponse {
  indicesData: Record<string, { price: number; change: number }>;
  topGainers: MarketMover[];
  topLosers: MarketMover[];
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

// Fetch breadth data from edge function
async function fetchBreadthDataFn(): Promise<BreadthResponse | null> {
  const { data, error } = await supabase.functions.invoke('fetch-market-breadth');
  
  if (error) {
    console.error('[MarketOverviewPanel] Breadth fetch error:', error);
    return null;
  }

  if (data?.success) {
    return {
      data: data.data,
      meta: data.meta,
      dataAvailable: data.dataAvailable ?? true,
      dataSource: data.dataSource ?? 'yahoo',
      breadthError: data.breadthError,
    };
  }
  return null;
}

// Fetch market data from database with fallback chain
async function fetchMarketDataFn(): Promise<MarketDataResponse> {
  const indicesSymbols = MARKET_INDICES.map((i) => i.symbol);
  const indicesMap: Record<string, { price: number; change: number }> = {};
  let topGainers: MarketMover[] = [];
  let topLosers: MarketMover[] = [];

  // Fetch from live_pattern_detections for price data
  const { data: patterns, error } = await supabase
    .from('live_pattern_detections')
    .select('instrument, current_price, change_percent')
    .eq('status', 'active')
    .not('current_price', 'is', null)
    .not('change_percent', 'is', null)
    .order('change_percent', { ascending: false });

  if (!error && patterns && patterns.length > 0) {
    for (const p of patterns) {
      if (indicesSymbols.includes(p.instrument) && !indicesMap[p.instrument]) {
        indicesMap[p.instrument] = {
          price: p.current_price || 0,
          change: p.change_percent || 0,
        };
      }
    }

    // Top gainers (unique symbols)
    const seen = new Set<string>();
    topGainers = patterns
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

    // Top losers (unique symbols)
    const seenLosers = new Set<string>();
    const sortedLosers = [...patterns].sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0));
    topLosers = sortedLosers
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
  }

  // For indices not in live_pattern_detections, fetch latest from historical_prices
  let missingIndices = indicesSymbols.filter((s) => !indicesMap[s]);
  if (missingIndices.length > 0) {
    const { data: historicalData } = await supabase
      .from('historical_prices')
      .select('symbol, close, open')
      .in('symbol', missingIndices)
      .eq('timeframe', '1d')
      .order('date', { ascending: false })
      .limit(missingIndices.length * 3);

    if (historicalData) {
      for (const h of historicalData) {
        if (!indicesMap[h.symbol]) {
          const change = h.open > 0 ? ((h.close - h.open) / h.open) * 100 : 0;
          indicesMap[h.symbol] = {
            price: h.close,
            change,
          };
        }
      }
    }

    // If the DB has no rows, fall back to Yahoo Finance via edge function
    // EODHD-first, Yahoo-fallback for remaining missing indices
    missingIndices = indicesSymbols.filter((s) => !indicesMap[s]);
    if (missingIndices.length > 0) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 10);

      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endDate.toISOString().slice(0, 10);

      const results = await Promise.allSettled(
        missingIndices.map((symbol) =>
          fetchMarketBars({
            symbol,
            startDate: startStr,
            endDate: endStr,
            interval: '1d',
          })
        )
      );

      results.forEach((res, idx) => {
        const symbol = missingIndices[idx];
        if (res.status !== 'fulfilled') return;

        const bars = res.value;
        if (!Array.isArray(bars) || bars.length < 1) return;

        const last = bars[bars.length - 1];
        const prev = bars.length >= 2 ? bars[bars.length - 2] : null;
        const price = Number(last?.c);
        const prevClose = prev ? Number(prev?.c) : NaN;
        if (!Number.isFinite(price) || price === 0) return;

        const changePct = Number.isFinite(prevClose) && prevClose !== 0
          ? ((price - prevClose) / prevClose) * 100
          : 0;

        indicesMap[symbol] = {
          price,
          change: changePct,
        };
      });
    }
  }

  return { indicesData: indicesMap, topGainers, topLosers };
}

export function MarketOverviewPanel({ onSymbolSelect, defaultTab = 'indices', onTabChange }: MarketOverviewPanelProps) {
  const { t } = useTranslation();
  // Use caching for market data - shows cached immediately, refreshes in background if stale
  const { 
    data: marketData, 
    loading: marketLoading, 
    refresh: refreshMarket,
  } = useMarketDataCache({
    cacheKey: 'market-indices',
    staleTime: 60_000, // 1 minute
    maxAge: 300_000, // 5 minutes
    fetchFn: fetchMarketDataFn,
  });

  // Use caching for breadth data
  const {
    data: breadthResponse,
    loading: breadthLoading,
    refresh: refreshBreadth,
  } = useMarketDataCache({
    cacheKey: 'market-breadth',
    staleTime: 60_000,
    maxAge: 300_000,
    fetchFn: fetchBreadthDataFn,
  });

  const indicesData = marketData?.indicesData || {};
  const topGainers = marketData?.topGainers || [];
  const topLosers = marketData?.topLosers || [];
  const breadthData = breadthResponse?.data || null;
  const breadthMeta = breadthResponse?.meta || null;
  const breadthDataSource = breadthResponse?.dataSource ?? 'yahoo';
  const breadthDataAvailable = breadthResponse?.dataAvailable ?? true;
  const breadthErrorMsg = breadthResponse?.breadthError;
  const loading = marketLoading;

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  return (
    <div className="h-full flex flex-col" data-capture-target>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Globe className="h-4 w-4" />
          {t('commandCenter.marketOverview')}
        </h3>
        <div className="flex items-center gap-1">
          <CardCaptureButton label="Market Overview" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={refreshMarket}
            disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b px-2 h-8">
          <TabsTrigger value="indices" className="text-sm h-6 px-2">
            <Activity className="h-3 w-3 mr-1" />
            {t('commandCenter.indices')}
          </TabsTrigger>
          <TabsTrigger value="breadth" className="text-sm h-6 px-2">
            <BarChart3 className="h-3 w-3 mr-1" />
            {t('commandCenter.breadth')}
          </TabsTrigger>
          <TabsTrigger value="movers" className="text-sm h-6 px-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            {t('commandCenter.movers')}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-sm h-6 px-2">
            <Calendar className="h-3 w-3 mr-1" />
            {t('commandCenter.calendar')}
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
                    <div className="text-sm font-medium">{index.name}</div>
                    <div className="text-xs text-muted-foreground">{index.symbol}</div>
                  </div>
                  <div className="text-right">
                    {indicesData[index.symbol] ? (
                      <>
                        <div className="text-sm font-medium">
                          {formatPrice(indicesData[index.symbol].price)}
                        </div>
                        <div
                          className={cn(
                            'text-xs',
                            indicesData[index.symbol].change >= 0
                              ? 'text-bullish'
                              : 'text-bearish'
                          )}
                        >
                          {indicesData[index.symbol].change >= 0 ? '+' : ''}
                          {indicesData[index.symbol].change.toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Breadth Tab */}
        <TabsContent value="breadth" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {breadthLoading && !breadthData ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : breadthData ? (
                <>
                  {/* Sentiment Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">{t('commandCenter.nyseMarketBreadth')}</span>
                    <Badge 
                      className={cn(
                        'text-xs border-0',
                        breadthMeta?.sentiment === 'bullish' && 'bg-bullish/10 text-bullish',
                        breadthMeta?.sentiment === 'neutral-bullish' && 'bg-bullish/10 text-bullish',
                        breadthMeta?.sentiment === 'neutral-bearish' && 'bg-bearish/10 text-bearish',
                        breadthMeta?.sentiment === 'bearish' && 'bg-bearish/10 text-bearish'
                      )}
                    >
                      {breadthMeta?.sentiment === 'bullish' && '🟢 Bullish'}
                      {breadthMeta?.sentiment === 'neutral-bullish' && '🟡 Neutral-Bullish'}
                      {breadthMeta?.sentiment === 'neutral-bearish' && '🟠 Neutral-Bearish'}
                      {breadthMeta?.sentiment === 'bearish' && '🔴 Bearish'}
                    </Badge>
                  </div>

                  {/* A/D Ratio Display */}
                  <div className="rounded-lg border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('commandCenter.advanceDeclineRatio')}</span>
                      <span className={cn(
                        'text-lg font-bold',
                        breadthData.advanceDeclineRatio >= 1 ? 'text-bullish' : 'text-bearish'
                      )}>
                        {breadthData.advanceDeclineRatio.toFixed(2)}
                      </span>
                    </div>

                    {/* Visual Bar */}
                    <div className="space-y-1">
                       <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="text-bullish">{t('market.advancing', 'Advancing')}: {breadthData.advances.toLocaleString()}</span>
                        <span className="text-bearish">{t('market.declining', 'Declining')}: {breadthData.declines.toLocaleString()}</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                        <div 
                          className="bg-bullish transition-all"
                          style={{ width: `${breadthMeta?.advancePercent || 50}%` }}
                        />
                        <div 
                          className="bg-bearish transition-all"
                          style={{ width: `${breadthMeta?.declinePercent || 50}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{breadthMeta?.advancePercent}%</span>
                        <span>{breadthMeta?.declinePercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border p-2.5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{t('commandCenter.adLine')}</div>
                      <div className={cn(
                        'text-sm font-semibold',
                        breadthData.advanceDeclineLine >= 0 ? 'text-bullish' : 'text-bearish'
                      )}>
                        {breadthData.advanceDeclineLine >= 0 ? '+' : ''}
                        {breadthData.advanceDeclineLine.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-2.5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{t('commandCenter.unchanged')}</div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {breadthData.unchanged.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {breadthData.advanceDeclineRatio >= 2 && 
                        "Strong bullish breadth — broad participation confirms uptrend strength."}
                      {breadthData.advanceDeclineRatio >= 1.5 && breadthData.advanceDeclineRatio < 2 && 
                        "Healthy bullish breadth — more stocks advancing than declining."}
                      {breadthData.advanceDeclineRatio >= 1 && breadthData.advanceDeclineRatio < 1.5 && 
                        "Neutral-bullish breadth — slight edge to advancing issues."}
                      {breadthData.advanceDeclineRatio >= 0.67 && breadthData.advanceDeclineRatio < 1 && 
                        "Neutral-bearish breadth — slight edge to declining issues."}
                      {breadthData.advanceDeclineRatio < 0.67 && 
                        "Weak breadth — broad selling pressure across the market."}
                    </p>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Exchange: {breadthData.exchange}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs"
                      onClick={refreshBreadth}
                      disabled={breadthLoading}
                    >
                      <RefreshCw className={cn('h-3 w-3 mr-1', breadthLoading && 'animate-spin')} />
                       {t('commandCenter.refresh')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">{t('commandCenter.breadthUnavailable')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={refreshBreadth}
                  >
                    {t('commandCenter.retry')}
                  </Button>
                </div>
              )}
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
                  <TrendingUp className="h-3 w-3 text-bullish" />
                  {t('commandCenter.topGainers')}
                </h4>
                {topGainers.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2">{t('commandCenter.noDataAvailable')}</p>
                ) : (
                  <div className="space-y-1">
                    {topGainers.map((mover) => (
                      <button
                        key={mover.symbol}
                        onClick={() => onSymbolSelect(mover.symbol)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <InstrumentLogo instrument={mover.symbol} size="sm" showName={false} />
                        <span className="text-sm font-medium flex-1 text-left">{mover.symbol}</span>
                        <Badge className="bg-bullish/10 text-bullish border-0 text-sm">
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
                  <TrendingDown className="h-3 w-3 text-bearish" />
                  {t('commandCenter.topLosers')}
                </h4>
                {topLosers.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2">{t('commandCenter.noDataAvailable')}</p>
                ) : (
                  <div className="space-y-1">
                    {topLosers.map((mover) => (
                      <button
                        key={mover.symbol}
                        onClick={() => onSymbolSelect(mover.symbol)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <InstrumentLogo instrument={mover.symbol} size="sm" showName={false} />
                        <span className="text-sm font-medium flex-1 text-left">{mover.symbol}</span>
                        <Badge className="bg-bearish/10 text-bearish border-0 text-sm">
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

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden">
          <EconomicCalendarWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
}
