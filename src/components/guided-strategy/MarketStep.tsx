import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Minus, Globe, Clock, Zap, HelpCircle, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';
import { POPULAR_STOCKS, searchStocks, StockSymbol } from '@/data/stockSymbols';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { wedgeConfig, getFullSymbol } from '@/config/wedge';

interface MarketStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

// Forex, Crypto, and Indices instruments (non-stock assets)
const otherInstrumentCategories = {
  forex: {
    label: 'Foreign Exchange (FX)',
    icon: Globe,
    instruments: [
      { symbol: 'EUR/USD', name: 'Euro/US Dollar' },
      { symbol: 'GBP/USD', name: 'British Pound/US Dollar' },
      { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen' },
      { symbol: 'USD/CHF', name: 'US Dollar/Swiss Franc' },
      { symbol: 'AUD/USD', name: 'Australian Dollar/US Dollar' },
      { symbol: 'USD/CAD', name: 'US Dollar/Canadian Dollar' },
      { symbol: 'NZD/USD', name: 'New Zealand Dollar/US Dollar' },
      { symbol: 'EUR/GBP', name: 'Euro/British Pound' },
      { symbol: 'EUR/JPY', name: 'Euro/Japanese Yen' },
      { symbol: 'GBP/JPY', name: 'British Pound/Japanese Yen' },
    ]
  },
  crypto: {
    label: 'Cryptocurrencies',
    icon: Zap,
    instruments: [
      { symbol: 'BTC/USD', name: 'Bitcoin/US Dollar' },
      { symbol: 'ETH/USD', name: 'Ethereum/US Dollar' },
      { symbol: 'ADA/USD', name: 'Cardano/US Dollar' },
      { symbol: 'SOL/USD', name: 'Solana/US Dollar' },
      { symbol: 'LINK/USD', name: 'Chainlink/US Dollar' },
      { symbol: 'DOT/USD', name: 'Polkadot/US Dollar' },
      { symbol: 'UNI/USD', name: 'Uniswap/US Dollar' },
      { symbol: 'AVAX/USD', name: 'Avalanche/US Dollar' },
    ]
  },
  indices: {
    label: 'ETFs & Indices',
    icon: TrendingUp,
    instruments: [
      { symbol: 'SPY', name: 'S&P 500 ETF' },
      { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
      { symbol: 'IWM', name: 'Russell 2000 ETF' },
      { symbol: 'EFA', name: 'MSCI EAFE ETF' },
      { symbol: 'VTI', name: 'Total Stock Market ETF' },
      { symbol: 'DIA', name: 'Dow Jones ETF' },
      { symbol: 'EWZ', name: 'Brazil ETF' },
      { symbol: 'FXI', name: 'China Large Cap ETF' },
      { symbol: 'GLD', name: 'Gold ETF' },
      { symbol: 'SLV', name: 'Silver ETF' },
      { symbol: 'TLT', name: 'Treasury Bond ETF' },
      { symbol: 'VNQ', name: 'Real Estate ETF' },
    ]
  }
};

const timeframes = [
  { id: '1m', label: '1 Minute', category: 'scalping' },
  { id: '5m', label: '5 Minutes', category: 'scalping' },
  { id: '15m', label: '15 Minutes', category: 'intraday' },
  { id: '1h', label: '1 Hour', category: 'intraday' },
  { id: '4h', label: '4 Hours', category: 'swing' },
  { id: '1d', label: '1 Day', category: 'swing' },
  { id: '1w', label: '1 Week', category: 'position' },
];

// MTF Analysis timeframes
const MTF_TIMEFRAMES = [
  { id: '5m', label: '5M', category: 'micro' as const },
  { id: '15m', label: '15M', category: 'micro' as const },
  { id: '1h', label: '1H', category: 'micro' as const },
  { id: '4h', label: '4H', category: 'micro' as const },
  { id: '8h', label: '8H', category: 'micro' as const },
  { id: '1d', label: 'D', category: 'macro' as const },
  { id: '1w', label: 'W', category: 'macro' as const },
  { id: '1M', label: 'M', category: 'macro' as const },
];

// Horizontal Trend Analysis Component - uses real data from edge function
const HorizontalTrendAnalysis: React.FC<{ instrument: string }> = ({ instrument }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trends, setTrends] = useState<Array<{ id: string; label: string; trend: 'up' | 'down' | 'flat'; category: 'micro' | 'macro' }>>([]);

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('analyze-mtf-trend', {
          body: { 
            symbol: instrument,
            timeframes: ['5m', '15m', '1h', '4h', '8h', '1d', '1w', '1M']
          }
        });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || 'Failed to analyze');

        const mapped = data.trends.map((t: any) => ({
          id: t.timeframe,
          label: t.label,
          trend: t.trend,
          category: t.category
        }));
        setTrends(mapped);
      } catch (err) {
        console.error('MTF trend error:', err);
        setError('Unable to fetch live data');
        setTrends([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (instrument) {
      fetchTrends();
    }
  }, [instrument]);

  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3" />;
      case 'down': return <TrendingDown className="w-3 h-3" />;
      default: return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up': return 'bg-green-500/20 text-green-600 border-green-500/50';
      case 'down': return 'bg-red-500/20 text-red-600 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
    }
  };

  const upCount = trends.filter(t => t.trend === 'up').length;
  const downCount = trends.filter(t => t.trend === 'down').length;
  const bias = upCount > trends.length * 0.5 ? 'Bullish' : downCount > trends.length * 0.5 ? 'Bearish' : 'Mixed';

  return (
    <div className="mt-4 p-3 bg-muted/30 rounded-lg border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 text-primary" />
          Multi-Timeframe Trend
          <Badge variant="outline" className="text-xs">{instrument}</Badge>
        </div>
        {!isLoading && trends.length > 0 && (
          <Badge className={`text-xs ${getTrendColor(bias === 'Bullish' ? 'up' : bias === 'Bearish' ? 'down' : 'flat')}`}>
            {bias} Bias
          </Badge>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex gap-1">
          {MTF_TIMEFRAMES.map(tf => (
            <Skeleton key={tf.id} className="h-8 w-10 rounded" />
          ))}
        </div>
      ) : error ? (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          {error}
        </div>
      ) : trends.length > 0 ? (
        <div className="flex gap-1 flex-wrap">
          {trends.map(tf => (
            <div
              key={tf.id}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${getTrendColor(tf.trend)}`}
            >
              {getTrendIcon(tf.trend)}
              <span>{tf.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">No trend data available</div>
      )}
      
      <p className="text-sm text-muted-foreground">
        EMA 20/50 trend analysis (live data) • {bias === 'Bullish' ? 'Consider Long patterns' : bias === 'Bearish' ? 'Consider Short patterns' : 'Use caution with pattern selection'}
      </p>
    </div>
  );
};

export const MarketStep: React.FC<MarketStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  // Wedge-mode: force crypto and 1H
  const isWedgeMode = wedgeConfig.wedgeEnabled;
  const wedgeDefaultInstrument = getFullSymbol(wedgeConfig.featuredSymbols[0]);
  const wedgeDefaultTimeframe = wedgeConfig.wedgeTimeframe;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<'stocks' | 'forex' | 'crypto' | 'indices'>(
    isWedgeMode ? 'crypto' : 'stocks'
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  
  const currentAnswers = answers.market || {
    instrumentCategory: isWedgeMode ? 'crypto' : 'stocks',
    instrument: isWedgeMode ? wedgeDefaultInstrument : 'AAPL',
    timeframes: [isWedgeMode ? wedgeDefaultTimeframe : '1h'],
    tradingHours: isWedgeMode ? 'round-the-clock' : 'london-ny'
  };

  // Guard: in wedge mode, enforce crypto category
  useEffect(() => {
    if (isWedgeMode) {
      if (selectedInstrumentType !== 'crypto') {
        setSelectedInstrumentType('crypto');
      }
    }
  }, [isWedgeMode, selectedInstrumentType]);

  // Search and filter stocks
  const filteredStocks = useMemo(() => {
    if (selectedInstrumentType !== 'stocks') {
      return [];
    }
    return searchStocks(searchQuery, 100);
  }, [searchQuery, selectedInstrumentType]);

  // Get other instruments (forex, crypto, indices)
  const getOtherInstruments = () => {
    if (selectedInstrumentType === 'forex') {
      return otherInstrumentCategories.forex.instruments;
    }
    if (selectedInstrumentType === 'crypto') {
      return otherInstrumentCategories.crypto.instruments;
    }
    if (selectedInstrumentType === 'indices') {
      return otherInstrumentCategories.indices.instruments;
    }
    return [];
  };

  const handleInstrumentTypeChange = (type: 'stocks' | 'forex' | 'crypto' | 'indices') => {
    setSelectedInstrumentType(type);
    setSearchQuery('');
    
    // Set default instrument based on type
    let defaultInstrument = '';
    if (type === 'stocks') {
      defaultInstrument = 'AAPL';
    } else if (type === 'forex') {
      defaultInstrument = otherInstrumentCategories.forex.instruments[0]?.symbol || '';
    } else if (type === 'crypto') {
      defaultInstrument = otherInstrumentCategories.crypto.instruments[0]?.symbol || '';
    } else if (type === 'indices') {
      defaultInstrument = otherInstrumentCategories.indices.instruments[0]?.symbol || '';
    }
    
    onAnswersChange('market', { 
      ...currentAnswers, 
      instrumentCategory: type,
      instrument: defaultInstrument
    });
  };

  const handleInstrumentChange = async (instrument: string) => {
    onAnswersChange('market', {
      ...currentAnswers,
      instrument
    });
    setIsSearchOpen(false);
    
    // Track instrument selection
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('instrument_search_analytics').insert({
        user_id: user?.id || null,
        search_query: searchQuery || '',
        instrument_type: selectedInstrumentType,
        selected_instrument: instrument,
        session_id: sessionIdRef.current
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
    
    setSearchQuery('');
  };

  // Track search queries with debounce
  useEffect(() => {
    if (searchQuery.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('instrument_search_analytics').insert({
            user_id: user?.id || null,
            search_query: searchQuery,
            instrument_type: selectedInstrumentType,
            selected_instrument: null,
            session_id: sessionIdRef.current
          });
        } catch (error) {
          console.error('Failed to track search:', error);
        }
      }, 2000); // Track after 2 seconds of no typing
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedInstrumentType]);

  const handleTimeframeChange = (value: string) => {
    onAnswersChange('market', {
      ...currentAnswers,
      timeframes: [value]
    });
  };
  
  const isComplete = currentAnswers.instrument && currentAnswers.timeframes?.length > 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="border-2 border-primary/30 shadow-xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Select Your Financial Instrument & Timeframe
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>Search any financial instrument</strong> by typing the ticker symbol. 
                    Then <strong>select your timeframe</strong> for your trading strategy.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          {/* TradingView-style Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {!isSearchOpen && currentAnswers.instrument ? (
              <div
                onClick={() => setIsSearchOpen(true)}
                className="pl-10 pr-4 h-11 bg-muted/30 border-2 border-primary/40 rounded-md flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{currentAnswers.instrument}</span>
                  <Badge variant="secondary" className="text-xs">{selectedInstrumentType}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">Click to change</span>
              </div>
            ) : (
              <Input
                placeholder="Symbol, ISIN, or CUSIP"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="pl-10 pr-20 h-11 bg-muted/30 border-2 border-primary/20 focus:bg-background focus:border-primary/40"
              />
            )}
            {isSearchOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            )}
          </div>

          {/* Filter Pills & Results - Only show when search is open */}
          {isSearchOpen && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Filter Pills - Hidden in wedge mode (crypto-only) */}
              {!isWedgeMode && (
                <div className="flex gap-2 flex-wrap pb-2 border-b border-border/50">
                  <Button
                    variant={selectedInstrumentType === 'stocks' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleInstrumentTypeChange('stocks')}
                    className="rounded-full h-8 px-4 text-xs"
                  >
                    Stocks
                  </Button>
                  <Button
                    variant={selectedInstrumentType === 'forex' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleInstrumentTypeChange('forex')}
                    className="rounded-full h-8 px-4 text-xs"
                  >
                    Forex
                  </Button>
                  <Button
                    variant={selectedInstrumentType === 'crypto' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleInstrumentTypeChange('crypto')}
                    className="rounded-full h-8 px-4 text-xs"
                  >
                    Crypto
                  </Button>
                  <Button
                    variant={selectedInstrumentType === 'indices' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleInstrumentTypeChange('indices')}
                    className="rounded-full h-8 px-4 text-xs"
                  >
                    Indices
                  </Button>
                </div>
              )}
              {isWedgeMode && (
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Badge variant="default" className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Crypto Only
                  </Badge>
                  <span className="text-xs text-muted-foreground">Select from popular cryptocurrencies</span>
                </div>
              )}

              {/* Results List */}
              <div className="space-y-2">
                {selectedInstrumentType === 'stocks' ? (
                  <ScrollArea className="h-[400px] border-2 rounded-lg p-2 bg-card/50">
                    <div className="space-y-1 pr-4">
                      {filteredStocks.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-sm text-muted-foreground">
                            {searchQuery ? 'No stocks found. Try a different search term.' : 'Start typing to search 500+ stocks...'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            NYSE • NASDAQ • S&P 500 • Russell 2000 • Dow Jones
                          </p>
                        </div>
                      ) : (
                        filteredStocks.map((stock) => (
                          <div
                            key={stock.symbol}
                            className={cn(
                              'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all group border-2',
                              currentAnswers.instrument === stock.symbol
                                ? 'bg-primary/10 border-primary shadow-sm'
                                : 'hover:bg-muted/50 border-border/30 hover:border-primary/40'
                            )}
                            onClick={() => handleInstrumentChange(stock.symbol)}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                              {stock.symbol.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate">{stock.name}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {stock.exchange || 'stock'}
                              </span>
                              {stock.index && (
                                <Badge variant="secondary" className="text-xs h-5">
                                  {stock.index}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="h-[400px] border-2 rounded-lg p-2 bg-card/50">
                    <div className="space-y-1 pr-4">
                      {getOtherInstruments().map((instrument) => {
                        const Icon = selectedInstrumentType === 'forex' ? Globe : 
                                     selectedInstrumentType === 'crypto' ? Zap : TrendingUp;
                        return (
                          <div
                            key={instrument.symbol}
                            className={cn(
                              'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border-2',
                              currentAnswers.instrument === instrument.symbol
                                ? 'bg-primary/10 border-primary shadow-sm'
                                : 'hover:bg-muted/50 border-border/30 hover:border-primary/40'
                            )}
                            onClick={() => handleInstrumentChange(instrument.symbol)}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">{instrument.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate">{instrument.name}</div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {selectedInstrumentType}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

          {/* Timeframe Selection */}
          <div className="space-y-3">
            <Label htmlFor="timeframe-select" className="text-base font-medium">
              Select Your Trading Timeframe
            </Label>
            <Select 
              value={currentAnswers.timeframes?.[0] || ""} 
              onValueChange={handleTimeframeChange}
            >
              <SelectTrigger 
                id="timeframe-select" 
                className="w-full bg-background border-input hover:bg-accent/50 focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <SelectValue placeholder="Choose a timeframe for your strategy" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover border-border shadow-lg">
                {['scalping', 'intraday', 'swing', 'position'].map((category) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {category} Trading
                    </div>
                    {timeframes
                      .filter(tf => tf.category === category)
                      .map((timeframe) => (
                        <SelectItem 
                          key={timeframe.id} 
                          value={timeframe.id}
                          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {timeframe.label}
                          </div>
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the time interval that matches your trading style and availability.
            </p>
          </div>

          {/* Inline Multi-Timeframe Trend Analysis */}
          {currentAnswers.instrument && currentAnswers.timeframes?.[0] && (
            <HorizontalTrendAnalysis instrument={currentAnswers.instrument} />
          )}

        </CardContent>
      </Card>

    </div>
    </TooltipProvider>
  );
};