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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Select Your Financial Instrument & Timeframe
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>Search any financial instrument</strong> by typing the ticker symbol (e.g., EURUSD, BTC/USD, SPY). 
                    Then <strong>select your timeframe</strong> which determines your trade duration and monitoring frequency.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Asset Class Selector */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              Select Asset Class
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Choose your asset type. Stocks include NYSE, NASDAQ, S&P 500, Russell 2000, and Dow Jones. All data is free via Yahoo Finance.
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant={selectedInstrumentType === 'stocks' ? 'default' : 'outline'}
                onClick={() => handleInstrumentTypeChange('stocks')}
                className="flex flex-col items-start gap-1 h-auto py-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Stocks</span>
                </div>
                <Badge variant="secondary" className="text-xs">500+ symbols</Badge>
              </Button>
              <Button
                variant={selectedInstrumentType === 'forex' ? 'default' : 'outline'}
                onClick={() => handleInstrumentTypeChange('forex')}
                className="flex flex-col items-start gap-1 h-auto py-3"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Forex</span>
                </div>
                <Badge variant="secondary" className="text-xs">Major pairs</Badge>
              </Button>
              <Button
                variant={selectedInstrumentType === 'crypto' ? 'default' : 'outline'}
                onClick={() => handleInstrumentTypeChange('crypto')}
                className="flex flex-col items-start gap-1 h-auto py-3"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Crypto</span>
                </div>
                <Badge variant="secondary" className="text-xs">Top coins</Badge>
              </Button>
              <Button
                variant={selectedInstrumentType === 'indices' ? 'default' : 'outline'}
                onClick={() => handleInstrumentTypeChange('indices')}
                className="flex flex-col items-start gap-1 h-auto py-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">ETFs</span>
                </div>
                <Badge variant="secondary" className="text-xs">Indices</Badge>
              </Button>
            </div>
          </div>

          {/* Search & Select Instrument */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search & Select Financial Instrument
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    {selectedInstrumentType === 'stocks' 
                      ? 'Search from NYSE, NASDAQ, S&P 500, Russell 2000, and Dow Jones stocks. Includes 500+ symbols.'
                      : 'Browse available instruments in the selected category'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>

            {selectedInstrumentType === 'stocks' ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stocks by symbol or name (e.g., AAPL, Apple, Microsoft)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-2">
                    {filteredStocks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {searchQuery ? 'No stocks found. Try a different search term.' : 'Start typing to search stocks...'}
                      </p>
                    ) : (
                      filteredStocks.map((stock) => (
                        <div
                          key={stock.symbol}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                            currentAnswers.instrument === stock.symbol
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 hover:bg-muted'
                          )}
                          onClick={() => handleInstrumentChange(stock.symbol)}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold">{stock.symbol}</span>
                            <span className="text-sm opacity-80">{stock.name}</span>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            {stock.exchange && (
                              <Badge variant="outline" className="text-xs">
                                {stock.exchange}
                              </Badge>
                            )}
                            {stock.sector && (
                              <Badge variant="secondary" className="text-xs">
                                {stock.sector}
                              </Badge>
                            )}
                            {stock.index && (
                              <Badge variant="secondary" className="text-xs">
                                {stock.index}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {!searchQuery && (
                  <p className="text-xs text-muted-foreground">
                    💡 Showing popular stocks. Search to browse 500+ stocks from NYSE, NASDAQ, S&P 500, Russell 2000, and Dow Jones.
                  </p>
                )}
              </div>
            ) : (
              <Select value={currentAnswers.instrument} onValueChange={handleInstrumentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  {getOtherInstruments().map((instrument) => (
                    <SelectItem key={instrument.symbol} value={instrument.symbol}>
                      {instrument.symbol} - {instrument.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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