import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FlaskConical, AlertCircle, Loader2, Coins, Database, TrendingUp, TrendingDown, Lock, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { UniversalSymbolSearch } from '@/components/charts/UniversalSymbolSearch';
import InstrumentLogo from '@/components/charts/InstrumentLogo';
import { PLANS_CONFIG, TIER_DISPLAY, type PlanTier } from '@/config/plans';

// Pattern options - matches screener's pattern registry
const PATTERNS = [
  // Base Patterns
  { id: 'double-bottom', name: 'Double Bottom', direction: 'bullish' },
  { id: 'double-top', name: 'Double Top', direction: 'bearish' },
  { id: 'triple-bottom', name: 'Triple Bottom', direction: 'bullish' },
  { id: 'triple-top', name: 'Triple Top', direction: 'bearish' },
  { id: 'ascending-triangle', name: 'Ascending Triangle', direction: 'bullish' },
  { id: 'descending-triangle', name: 'Descending Triangle', direction: 'bearish' },
  { id: 'symmetrical-triangle', name: 'Symmetrical Triangle', direction: 'neutral' },
  // Extended Patterns
  { id: 'head-and-shoulders', name: 'Head & Shoulders', direction: 'bearish' },
  { id: 'inverse-head-and-shoulders', name: 'Inverse Head & Shoulders', direction: 'bullish' },
  { id: 'rising-wedge', name: 'Rising Wedge', direction: 'bearish' },
  { id: 'falling-wedge', name: 'Falling Wedge', direction: 'bullish' },
  // Premium Patterns
  { id: 'bullish-flag', name: 'Bull Flag', direction: 'bullish' },
  { id: 'bearish-flag', name: 'Bear Flag', direction: 'bearish' },
  { id: 'cup-and-handle', name: 'Cup & Handle', direction: 'bullish' },
  { id: 'inverse-cup-and-handle', name: 'Inverse Cup & Handle', direction: 'bearish' },
  { id: 'donchian-breakout-long', name: 'Donchian Breakout (Long)', direction: 'bullish' },
  { id: 'donchian-breakout-short', name: 'Donchian Breakout (Short)', direction: 'bearish' },
];

// Instrument universe - synced with screenerInstruments.ts
const INSTRUMENTS: Record<string, { symbol: string; yahooSymbol: string; name: string }[]> = {
  fx: [
    { symbol: 'EUR/USD', yahooSymbol: 'EURUSD=X', name: 'Euro / US Dollar' },
    { symbol: 'GBP/USD', yahooSymbol: 'GBPUSD=X', name: 'British Pound / US Dollar' },
    { symbol: 'USD/JPY', yahooSymbol: 'USDJPY=X', name: 'US Dollar / Japanese Yen' },
    { symbol: 'USD/CHF', yahooSymbol: 'USDCHF=X', name: 'US Dollar / Swiss Franc' },
    { symbol: 'AUD/USD', yahooSymbol: 'AUDUSD=X', name: 'Australian Dollar / US Dollar' },
    { symbol: 'USD/CAD', yahooSymbol: 'USDCAD=X', name: 'US Dollar / Canadian Dollar' },
    { symbol: 'NZD/USD', yahooSymbol: 'NZDUSD=X', name: 'New Zealand Dollar / US Dollar' },
    { symbol: 'EUR/GBP', yahooSymbol: 'EURGBP=X', name: 'Euro / British Pound' },
    { symbol: 'EUR/JPY', yahooSymbol: 'EURJPY=X', name: 'Euro / Japanese Yen' },
    { symbol: 'GBP/JPY', yahooSymbol: 'GBPJPY=X', name: 'British Pound / Japanese Yen' },
    { symbol: 'AUD/JPY', yahooSymbol: 'AUDJPY=X', name: 'Australian Dollar / Japanese Yen' },
    { symbol: 'EUR/AUD', yahooSymbol: 'EURAUD=X', name: 'Euro / Australian Dollar' },
  ],
  crypto: [
    { symbol: 'BTC/USD', yahooSymbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH/USD', yahooSymbol: 'ETH-USD', name: 'Ethereum' },
    { symbol: 'BNB/USD', yahooSymbol: 'BNB-USD', name: 'BNB' },
    { symbol: 'XRP/USD', yahooSymbol: 'XRP-USD', name: 'XRP' },
    { symbol: 'SOL/USD', yahooSymbol: 'SOL-USD', name: 'Solana' },
    { symbol: 'ADA/USD', yahooSymbol: 'ADA-USD', name: 'Cardano' },
    { symbol: 'DOGE/USD', yahooSymbol: 'DOGE-USD', name: 'Dogecoin' },
    { symbol: 'AVAX/USD', yahooSymbol: 'AVAX-USD', name: 'Avalanche' },
    { symbol: 'LINK/USD', yahooSymbol: 'LINK-USD', name: 'Chainlink' },
    { symbol: 'DOT/USD', yahooSymbol: 'DOT-USD', name: 'Polkadot' },
    { symbol: 'MATIC/USD', yahooSymbol: 'MATIC-USD', name: 'Polygon' },
    { symbol: 'LTC/USD', yahooSymbol: 'LTC-USD', name: 'Litecoin' },
  ],
  stocks: [
    { symbol: 'AAPL', yahooSymbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', yahooSymbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', yahooSymbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', yahooSymbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', yahooSymbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', yahooSymbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', yahooSymbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'JPM', yahooSymbol: 'JPM', name: 'JPMorgan Chase' },
    { symbol: 'V', yahooSymbol: 'V', name: 'Visa Inc.' },
    { symbol: 'UNH', yahooSymbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: 'HD', yahooSymbol: 'HD', name: 'Home Depot' },
    { symbol: 'PG', yahooSymbol: 'PG', name: 'Procter & Gamble' },
  ],
  commodities: [
    { symbol: 'GC=F', yahooSymbol: 'GC=F', name: 'Gold Futures' },
    { symbol: 'SI=F', yahooSymbol: 'SI=F', name: 'Silver Futures' },
    { symbol: 'CL=F', yahooSymbol: 'CL=F', name: 'Crude Oil WTI' },
    { symbol: 'NG=F', yahooSymbol: 'NG=F', name: 'Natural Gas' },
    { symbol: 'HG=F', yahooSymbol: 'HG=F', name: 'Copper' },
    { symbol: 'PL=F', yahooSymbol: 'PL=F', name: 'Platinum' },
    { symbol: 'PA=F', yahooSymbol: 'PA=F', name: 'Palladium' },
    { symbol: 'ZC=F', yahooSymbol: 'ZC=F', name: 'Corn Futures' },
    { symbol: 'ZW=F', yahooSymbol: 'ZW=F', name: 'Wheat Futures' },
    { symbol: 'ZS=F', yahooSymbol: 'ZS=F', name: 'Soybean Futures' },
  ],
  indices: [
    { symbol: '^GSPC', yahooSymbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', yahooSymbol: '^DJI', name: 'Dow Jones Industrial' },
    { symbol: '^IXIC', yahooSymbol: '^IXIC', name: 'NASDAQ Composite' },
    { symbol: '^RUT', yahooSymbol: '^RUT', name: 'Russell 2000' },
    { symbol: '^VIX', yahooSymbol: '^VIX', name: 'VIX Volatility' },
    { symbol: '^FTSE', yahooSymbol: '^FTSE', name: 'FTSE 100' },
    { symbol: '^GDAXI', yahooSymbol: '^GDAXI', name: 'DAX 40' },
    { symbol: '^N225', yahooSymbol: '^N225', name: 'Nikkei 225' },
    { symbol: '^HSI', yahooSymbol: '^HSI', name: 'Hang Seng' },
  ],
  etfs: [
    { symbol: 'SPY', yahooSymbol: 'SPY', name: 'SPDR S&P 500 ETF' },
    { symbol: 'QQQ', yahooSymbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'IWM', yahooSymbol: 'IWM', name: 'iShares Russell 2000' },
    { symbol: 'DIA', yahooSymbol: 'DIA', name: 'SPDR Dow Jones ETF' },
    { symbol: 'GLD', yahooSymbol: 'GLD', name: 'SPDR Gold Shares' },
    { symbol: 'SLV', yahooSymbol: 'SLV', name: 'iShares Silver Trust' },
    { symbol: 'USO', yahooSymbol: 'USO', name: 'United States Oil Fund' },
    { symbol: 'TLT', yahooSymbol: 'TLT', name: 'iShares 20+ Year Treasury' },
    { symbol: 'XLF', yahooSymbol: 'XLF', name: 'Financial Select Sector' },
    { symbol: 'XLE', yahooSymbol: 'XLE', name: 'Energy Select Sector' },
    { symbol: 'ARKK', yahooSymbol: 'ARKK', name: 'ARK Innovation ETF' },
  ],
};

// Asset class display names
const ASSET_CLASS_LABELS: Record<string, string> = {
  fx: 'Forex',
  crypto: 'Cryptocurrency',
  stocks: 'Stocks',
  commodities: 'Commodities',
  indices: 'Indices',
  etfs: 'ETFs',
};

// Timeframes - synced with screener (1h, 4h, 1d, 1wk)
const TIMEFRAMES = [
  { value: '1h', label: '1 Hour', intradayLimit: '30 days' },
  { value: '4h', label: '4 Hour', intradayLimit: '30 days' },
  { value: '1d', label: 'Daily', intradayLimit: null },
  { value: '1wk', label: 'Weekly', intradayLimit: null },
];

const LOOKBACK_OPTIONS = [
  { value: 1, label: '1 Year' },
  { value: 2, label: '2 Years' },
  { value: 3, label: '3 Years' },
  { value: 5, label: '5 Years' },
  { value: 7, label: '7 Years' },
  { value: 10, label: '10 Years' },
];

interface EstimateResult {
  creditsEstimated: number;
  instrumentCount: number;
  patternCount: number;
  allowed: boolean;
  reason: string | null;
  errors: string[];
  creditsBalance: number;
  cacheHitRatio: number;
  tier: PlanTier;
}

const PatternLabWizard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Form state - defaults synced with screener
  const [assetClass, setAssetClass] = useState('fx');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['EURUSD=X']);
  const [timeframe, setTimeframe] = useState('1d');
  const [lookbackYears, setLookbackYears] = useState(3);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['double-bottom']);
  
  // UI state
  const [isEstimating, setIsEstimating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [userTier, setUserTier] = useState<PlanTier>('FREE');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Check if Pattern Lab is enabled for user's tier
  const patternLabCaps = PLANS_CONFIG.tiers[userTier].projects.pattern_lab;
  const isEnabled = patternLabCaps.enabled;
  
  // Auth state listener - sync with site-wide auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      setIsAuthLoading(false);
    });
    
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setIsAuthLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Fetch estimate when inputs change
  useEffect(() => {
    const fetchEstimate = async () => {
      if (selectedPatterns.length === 0 || selectedInstruments.length === 0) {
        setEstimate(null);
        return;
      }
      
      setIsEstimating(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(
          'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/estimate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
            },
            body: JSON.stringify({
              projectType: 'pattern_lab',
              instruments: selectedInstruments,
              patterns: selectedPatterns,
              timeframe,
              lookbackYears,
            }),
          }
        );
        
        const data = await response.json();
        setEstimate(data);
        if (data.tier) {
          setUserTier(data.tier);
        }
      } catch (error) {
        console.error('Estimate error:', error);
      } finally {
        setIsEstimating(false);
      }
    };
    
    const debounce = setTimeout(fetchEstimate, 300);
    return () => clearTimeout(debounce);
  }, [selectedInstruments, selectedPatterns, timeframe, lookbackYears]);
  
  const handleInstrumentToggle = (symbol: string) => {
    setSelectedInstruments(prev => 
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };
  
  const handlePatternToggle = (patternId: string) => {
    setSelectedPatterns(prev => 
      prev.includes(patternId)
        ? prev.filter(p => p !== patternId)
        : [...prev, patternId]
    );
  };
  
  const handleRun = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to run projects');
      navigate('/auth');
      return;
    }
    
    if (!isEnabled) {
      toast.error('Pattern Lab requires Plus plan or higher');
      navigate('/pricing');
      return;
    }
    
    if (selectedPatterns.length === 0 || selectedInstruments.length === 0) {
      toast.error('Please select at least one instrument and pattern');
      return;
    }
    
    // Get fresh session for the API call
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Session expired. Please sign in again.');
      navigate('/auth');
      return;
    }
    
    setIsRunning(true);
    try {
      const response = await fetch(
        'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/run',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            projectType: 'pattern_lab',
            inputs: {
              instruments: selectedInstruments,
              patterns: selectedPatterns,
              timeframe,
              lookbackYears,
            },
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start run');
      }
      
      toast.success('Pattern Lab backtest started!');
      navigate(`/projects/runs/${data.runId}`);
    } catch (error) {
      console.error('Run error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start run');
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/projects')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <FlaskConical className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pattern Lab</h1>
              <p className="text-muted-foreground">
                Deep backtest patterns with regime analysis
              </p>
            </div>
            {!isEnabled && (
              <Badge variant="secondary" className="ml-auto">
                <Lock className="h-3 w-3 mr-1" />
                Plus+ Required
              </Badge>
            )}
          </div>
        </div>
        
        {/* Tier gate */}
        {!isEnabled && (
          <Alert className="mb-6 border-violet-500/30 bg-violet-500/5">
            <Lock className="h-4 w-4 text-violet-500" />
            <AlertDescription>
              Pattern Lab is available on Plus, Pro, and Team plans.{' '}
              <Button variant="link" className="p-0 h-auto text-violet-500" onClick={() => navigate('/pricing')}>
                Upgrade to unlock
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className={`lg:col-span-2 space-y-6 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Instruments */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Instruments</CardTitle>
                <CardDescription>Search and add instruments to backtest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Symbol Search Button */}
                <UniversalSymbolSearch
                  onSelect={(symbol, name, category) => {
                    if (!selectedInstruments.includes(symbol)) {
                      setSelectedInstruments(prev => [...prev, symbol]);
                      // Update asset class to match selected category
                      const categoryMap: Record<string, string> = {
                        'stocks': 'stocks',
                        'crypto': 'crypto',
                        'fx': 'fx',
                        'commodities': 'commodities',
                        'indices': 'indices',
                        'etfs': 'etfs',
                      };
                      if (categoryMap[category]) {
                        setAssetClass(categoryMap[category]);
                      }
                    }
                  }}
                  trigger={
                    <Button variant="outline" className="w-full justify-start gap-2 h-11">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Search for instruments...</span>
                    </Button>
                  }
                />
                
                {/* Selected Instruments */}
                {selectedInstruments.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Selected ({selectedInstruments.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedInstruments.map(symbol => (
                        <Badge
                          key={symbol}
                          variant="secondary"
                          className="flex items-center gap-1.5 pl-1 pr-1 py-1"
                        >
                          <InstrumentLogo instrument={symbol} size="sm" showName={false} />
                          <span className="font-medium">
                            {symbol.replace('=X', '').replace('=F', '').replace('-USD', '')}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                            onClick={() => setSelectedInstruments(prev => prev.filter(s => s !== symbol))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded-lg">
                    No instruments selected. Use the search above to add instruments.
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Timeframe & Lookback */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Backtest Parameters</CardTitle>
                <CardDescription>Configure timeframe and data range</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Timeframe</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEFRAMES.map(tf => (
                          <SelectItem key={tf.value} value={tf.value}>
                            {tf.label}
                            {tf.intradayLimit && (
                              <span className="text-muted-foreground ml-2">({tf.intradayLimit} max)</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Lookback Period</Label>
                    <Select 
                      value={String(lookbackYears)} 
                      onValueChange={(v) => setLookbackYears(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOOKBACK_OPTIONS.map(lb => {
                          // Intraday timeframes are limited to 30 days
                          const isIntraday = timeframe === '1h' || timeframe === '4h';
                          const disabled = isIntraday || 
                            (patternLabCaps.maxLookbackYears !== undefined && lb.value > patternLabCaps.maxLookbackYears);
                          return (
                            <SelectItem 
                              key={lb.value} 
                              value={String(lb.value)}
                              disabled={disabled && lb.value > 1}
                            >
                              {lb.label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Intraday limitation notice */}
                {(timeframe === '1h' || timeframe === '4h') && (
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-sm">
                      Intraday data ({timeframe}) is limited to 30 days history due to data provider constraints.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Patterns */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Pattern Selection</CardTitle>
                <CardDescription>Select patterns to backtest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PATTERNS.map(pattern => (
                    <div
                      key={pattern.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPatterns.includes(pattern.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border/50 hover:border-border'
                      }`}
                      onClick={() => handlePatternToggle(pattern.id)}
                    >
                      <Checkbox
                        checked={selectedPatterns.includes(pattern.id)}
                        onCheckedChange={() => handlePatternToggle(pattern.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{pattern.name}</div>
                      </div>
                      {pattern.direction === 'bullish' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar - Credits & Run - Clean inline layout (no sticky floating) */}
          <div className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Run Estimate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEstimating ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : estimate ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {estimate.creditsEstimated}
                      </span>
                      <span className="text-muted-foreground">credits</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Instruments</span>
                        <span className="font-medium text-foreground">{selectedInstruments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Patterns</span>
                        <span className="font-medium text-foreground">{selectedPatterns.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lookback</span>
                        <span className="font-medium text-foreground">{lookbackYears} year{lookbackYears > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                        <span>Your Balance</span>
                        <span className="font-medium text-foreground">{estimate.creditsBalance}</span>
                      </div>
                    </div>
                    
                    {/* Cache indicator */}
                    {estimate.cacheHitRatio > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                        <Database className="h-3 w-3" />
                        <span>{Math.round(estimate.cacheHitRatio * 100)}% data cached</span>
                      </div>
                    )}
                    
                    {!estimate.allowed && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {estimate.errors?.[0] || estimate.reason || 'Cannot run this configuration'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select instruments and patterns to see estimate
                  </p>
                )}
                
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRun}
                  disabled={
                    isRunning || 
                    isAuthLoading ||
                    !isEnabled ||
                    selectedInstruments.length === 0 || 
                    selectedPatterns.length === 0 ||
                    (estimate && !estimate.allowed)
                  }
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : isAuthLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <FlaskConical className="h-4 w-4 mr-2" />
                      Sign in to Run
                    </>
                  ) : !isEnabled ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Upgrade to Run
                    </>
                  ) : (
                    <>
                      <FlaskConical className="h-4 w-4 mr-2" />
                      Run Backtest
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Estimated runtime: 1-3 minutes
                </p>
                
                {/* What you'll get - integrated inline */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-3">What You'll Get</p>
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-green-500 flex-shrink-0" />
                      <span>Win rate & expectancy per pattern</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-green-500 flex-shrink-0" />
                      <span>Regime breakdown (trend + volatility)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-green-500 flex-shrink-0" />
                      <span>Do-not-trade rules (low-edge regimes)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-green-500 flex-shrink-0" />
                      <span>Full trade log with R-multiples</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-green-500 flex-shrink-0" />
                      <span>Equity curve & drawdown chart</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternLabWizard;
