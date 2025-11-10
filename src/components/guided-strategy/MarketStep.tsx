import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Globe, Clock, Zap, HelpCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';
import { POPULAR_STOCKS, searchStocks, StockSymbol } from '@/data/stockSymbols';

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

export const MarketStep: React.FC<MarketStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<'stocks' | 'forex' | 'crypto' | 'indices'>('stocks');
  
  const currentAnswers = answers.market || {
    instrumentCategory: 'stocks',
    instrument: 'AAPL',
    timeframes: ['1h'],
    tradingHours: 'london-ny'
  };

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

  const handleInstrumentChange = (instrument: string) => {
    onAnswersChange('market', {
      ...currentAnswers,
      instrument
    });
  };

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
        <Card className="border-border/50">
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
            <Input
              placeholder="Symbol, ISIN, or CUSIP"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20 h-11 bg-muted/30 border-border/50 focus:bg-background"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedInstrumentType === 'stocks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleInstrumentTypeChange('stocks')}
              className="rounded-full h-8 px-4"
            >
              Stocks
            </Button>
            <Button
              variant={selectedInstrumentType === 'forex' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleInstrumentTypeChange('forex')}
              className="rounded-full h-8 px-4"
            >
              Forex
            </Button>
            <Button
              variant={selectedInstrumentType === 'crypto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleInstrumentTypeChange('crypto')}
              className="rounded-full h-8 px-4"
            >
              Crypto
            </Button>
            <Button
              variant={selectedInstrumentType === 'indices' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleInstrumentTypeChange('indices')}
              className="rounded-full h-8 px-4"
            >
              Indices
            </Button>
          </div>

          {/* Results List */}
          <div className="space-y-2">
            {selectedInstrumentType === 'stocks' ? (
              <ScrollArea className="h-[400px]">
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
                          'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all group',
                          currentAnswers.instrument === stock.symbol
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted/50 border border-transparent'
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
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 pr-4">
                  {getOtherInstruments().map((instrument) => {
                    const Icon = selectedInstrumentType === 'forex' ? Globe : 
                                 selectedInstrumentType === 'crypto' ? Zap : TrendingUp;
                    return (
                      <div
                        key={instrument.symbol}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all',
                          currentAnswers.instrument === instrument.symbol
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted/50 border border-transparent'
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
        </CardContent>
      </Card>

      {isComplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Globe className="w-4 h-4" />
              <span className="font-medium">Market Selection Complete!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Trading {currentAnswers.instrument} on {currentAnswers.timeframes?.[0] || 'selected timeframe'} timeframe.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
};