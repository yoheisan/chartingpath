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
import { ArrowLeft, FlaskConical, AlertCircle, Loader2, Coins, Database, TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PLANS_CONFIG, TIER_DISPLAY, type PlanTier } from '@/config/plans';

// Pattern options
const PATTERNS = [
  { id: 'donchian-breakout-long', name: 'Donchian Breakout (Long)', direction: 'bullish' },
  { id: 'donchian-breakout-short', name: 'Donchian Breakout (Short)', direction: 'bearish' },
  { id: 'double-top', name: 'Double Top (Short)', direction: 'bearish' },
  { id: 'double-bottom', name: 'Double Bottom (Long)', direction: 'bullish' },
  { id: 'ascending-triangle', name: 'Ascending Triangle (Long)', direction: 'bullish' },
  { id: 'descending-triangle', name: 'Descending Triangle (Short)', direction: 'bearish' },
];

const INSTRUMENTS: Record<string, { symbol: string; name: string }[]> = {
  crypto: [
    { symbol: 'BTCUSDT', name: 'Bitcoin' },
    { symbol: 'ETHUSDT', name: 'Ethereum' },
    { symbol: 'SOLUSDT', name: 'Solana' },
    { symbol: 'BNBUSDT', name: 'BNB' },
    { symbol: 'XRPUSDT', name: 'XRP' },
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Google' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'TSLA', name: 'Tesla' },
  ],
  fx: [
    { symbol: 'EURUSD=X', name: 'EUR/USD' },
    { symbol: 'GBPUSD=X', name: 'GBP/USD' },
    { symbol: 'USDJPY=X', name: 'USD/JPY' },
    { symbol: 'AUDUSD=X', name: 'AUD/USD' },
  ],
};

const TIMEFRAMES = [
  { value: '1d', label: 'Daily' },
  { value: '4h', label: '4 Hour' },
];

const LOOKBACK_OPTIONS = [
  { value: 1, label: '1 Year' },
  { value: 2, label: '2 Years' },
  { value: 3, label: '3 Years' },
  { value: 5, label: '5 Years' },
  { value: 7, label: '7 Years' },
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
  
  // Form state
  const [assetClass, setAssetClass] = useState('crypto');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['BTCUSDT']);
  const [timeframe, setTimeframe] = useState('1d');
  const [lookbackYears, setLookbackYears] = useState(3);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['donchian-breakout-long']);
  
  // UI state
  const [isEstimating, setIsEstimating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [userTier, setUserTier] = useState<PlanTier>('FREE');
  
  // Check if Pattern Lab is enabled for user's tier
  const patternLabCaps = PLANS_CONFIG.tiers[userTier].projects.pattern_lab;
  const isEnabled = patternLabCaps.enabled;
  
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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
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
                <CardDescription>Select instruments to backtest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Asset Class</Label>
                  <Select value={assetClass} onValueChange={(v) => {
                    setAssetClass(v);
                    setSelectedInstruments([]);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="fx">Forex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2 sm:grid-cols-2">
                  {INSTRUMENTS[assetClass]?.map(inst => (
                    <div
                      key={inst.symbol}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedInstruments.includes(inst.symbol)
                          ? 'border-primary bg-primary/5'
                          : 'border-border/50 hover:border-border'
                      }`}
                      onClick={() => handleInstrumentToggle(inst.symbol)}
                    >
                      <Checkbox
                        checked={selectedInstruments.includes(inst.symbol)}
                        onCheckedChange={() => handleInstrumentToggle(inst.symbol)}
                      />
                      <div>
                        <div className="font-medium text-sm">{inst.symbol}</div>
                        <div className="text-xs text-muted-foreground">{inst.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Timeframe & Lookback */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Backtest Parameters</CardTitle>
                <CardDescription>Configure timeframe and data range</CardDescription>
              </CardHeader>
              <CardContent>
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
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Lookback Period</Label>
                    <Select value={String(lookbackYears)} onValueChange={(v) => setLookbackYears(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOOKBACK_OPTIONS.map(lb => (
                          <SelectItem 
                            key={lb.value} 
                            value={String(lb.value)}
                            disabled={patternLabCaps.maxLookbackYears !== undefined && lb.value > patternLabCaps.maxLookbackYears}
                          >
                            {lb.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
          
          {/* Sidebar - Credits & Run */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-4">
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 mt-3">
                        <Database className="h-3 w-3" />
                        <span>{Math.round(estimate.cacheHitRatio * 100)}% data cached</span>
                      </div>
                    )}
                    
                    {!estimate.allowed && (
                      <Alert variant="destructive" className="mt-4">
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
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleRun}
                  disabled={
                    isRunning || 
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
              </CardContent>
            </Card>
            
            {/* What you get */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">What You'll Get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Win rate & expectancy per pattern</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Regime breakdown (trend + volatility)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Do-not-trade rules (low-edge regimes)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Full trade log with R-multiples</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Equity curve & drawdown chart</span>
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
