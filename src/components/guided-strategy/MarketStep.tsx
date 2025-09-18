import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Globe, Clock, Zap, HelpCircle, Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface MarketStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

const instrumentCategories = {
  forex: {
    label: 'Foreign Exchange (FX)',
    icon: TrendingUp,
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
    label: 'Major Indices',
    icon: Globe,
    instruments: [
      { symbol: 'SPY', name: 'S&P 500 ETF' },
      { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
      { symbol: 'IWM', name: 'Russell 2000 ETF' },
      { symbol: 'EFA', name: 'MSCI EAFE ETF' },
      { symbol: 'VTI', name: 'Total Stock Market ETF' },
      { symbol: 'DIA', name: 'Dow Jones ETF' },
      { symbol: 'EWZ', name: 'Brazil ETF' },
      { symbol: 'FXI', name: 'China Large Cap ETF' },
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
  const [instrumentSearchOpen, setInstrumentSearchOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  
  const currentAnswers = answers.market || {
    instrumentCategory: '',
    instrument: '',
    timeframes: []
  };

  const handleInstrumentCategoryChange = (category: string) => {
    onAnswersChange('market', {
      ...currentAnswers,
      instrumentCategory: category,
      instrument: '', // Reset instrument when category changes
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

  const selectedCategory = currentAnswers.instrumentCategory;
  const availableInstruments = selectedCategory ? instrumentCategories[selectedCategory as keyof typeof instrumentCategories]?.instruments || [] : [];
  
  // Create a comprehensive list of all instruments for global search
  const allInstruments = Object.values(instrumentCategories).flatMap(category => 
    category.instruments.map(instrument => ({
      ...instrument,
      category: category.label
    }))
  );
  
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
          {/* Unified Instrument Search - Primary Interface */}
          <div className="space-y-3">
            <Label htmlFor="instrument-select" className="text-base font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search & Select Financial Instrument
            </Label>
            <Popover open={instrumentSearchOpen} onOpenChange={setInstrumentSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={instrumentSearchOpen}
                  className="w-full justify-between bg-background hover:bg-accent/50"
                >
                  {currentAnswers.instrument ? (
                    <div className="flex items-center gap-2 flex-1 text-left">
                      <span className="font-medium">{currentAnswers.instrument}</span>
                      <span className="text-xs text-muted-foreground">
                        {allInstruments.find(
                          (instrument) => instrument.symbol === currentAnswers.instrument
                        )?.name}
                      </span>
                      <span className="ml-auto text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {allInstruments.find(
                          (instrument) => instrument.symbol === currentAnswers.instrument
                        )?.category}
                      </span>
                    </div>
                  ) : (
                    "Search any instrument by ticker (e.g., EURUSD, BTC/USD, SPY)..."
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Type ticker symbol or instrument name..." 
                    className="h-9" 
                  />
                  
                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
                    <Button
                      type="button"
                      variant={selectedCategoryFilter === 'ALL' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategoryFilter('ALL')}
                      className="h-7 px-3 text-xs"
                    >
                      All
                    </Button>
                    {Object.entries(instrumentCategories).map(([key, category]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={selectedCategoryFilter === key ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedCategoryFilter(key)}
                        className="h-7 px-3 text-xs"
                      >
                        {category.label.replace('Foreign Exchange', 'Forex')}
                      </Button>
                    ))}
                  </div>
                  
                  <CommandList>
                    <CommandEmpty>No instruments found. Try searching by ticker symbol.</CommandEmpty>
                    {selectedCategoryFilter === 'ALL' 
                      ? Object.entries(instrumentCategories).map(([categoryKey, category]) => (
                          <CommandGroup key={categoryKey} heading={category.label}>
                            {category.instruments.map((instrument) => (
                              <CommandItem
                                key={instrument.symbol}
                                value={`${instrument.symbol} ${instrument.name}`}
                                onSelect={() => {
                                  // Auto-set category when instrument is selected
                                  handleInstrumentCategoryChange(categoryKey);
                                  handleInstrumentChange(instrument.symbol);
                                  setInstrumentSearchOpen(false);
                                }}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{instrument.symbol}</span>
                                    <span className="text-xs text-muted-foreground">{instrument.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                                      {category.label}
                                    </span>
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        currentAnswers.instrument === instrument.symbol
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))
                      : instrumentCategories[selectedCategoryFilter as keyof typeof instrumentCategories] && (
                          <CommandGroup heading={instrumentCategories[selectedCategoryFilter as keyof typeof instrumentCategories].label}>
                            {instrumentCategories[selectedCategoryFilter as keyof typeof instrumentCategories].instruments.map((instrument) => (
                              <CommandItem
                                key={instrument.symbol}
                                value={`${instrument.symbol} ${instrument.name}`}
                                onSelect={() => {
                                  // Auto-set category when instrument is selected
                                  handleInstrumentCategoryChange(selectedCategoryFilter);
                                  handleInstrumentChange(instrument.symbol);
                                  setInstrumentSearchOpen(false);
                                }}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{instrument.symbol}</span>
                                    <span className="text-xs text-muted-foreground">{instrument.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                                      {instrumentCategories[selectedCategoryFilter as keyof typeof instrumentCategories].label}
                                    </span>
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        currentAnswers.instrument === instrument.symbol
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )
                    }
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
              Search across all markets: Foreign Exchange, Cryptocurrencies, and Major Indices. Just start typing the ticker symbol.
            </p>
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