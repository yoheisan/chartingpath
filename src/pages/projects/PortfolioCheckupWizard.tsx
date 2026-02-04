import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, PieChart, AlertCircle, Loader2, Coins, Plus, X, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PLANS_CONFIG, type PlanTier } from '@/config/plans';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DATA_COVERAGE, 
  getValidLookbackOptions, 
  getDefaultLookback, 
  getCoverageInfo,
  clampLookback,
  type Timeframe 
} from '@/config/dataCoverageContract';

const POPULAR_HOLDINGS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'BRK-B', name: 'Berkshire B' },
  { symbol: 'JPM', name: 'JPMorgan' },
  { symbol: 'V', name: 'Visa' },
];

const TIMEFRAMES = [
  { value: '1d', label: 'Daily' },
  { value: '4h', label: '4 Hour' },
];

// LOOKBACK_OPTIONS now derived from dataCoverageContract

interface EstimateResult {
  creditsEstimated: number;
  instrumentCount: number;
  allowed: boolean;
  reason: string | null;
  errors: string[];
  creditsBalance: number;
  cacheHitRatio: number;
  tier: PlanTier;
}

const PortfolioCheckupWizard = () => {
  const navigate = useNavigate();
  const { session, isAuthenticated, isAuthLoading } = useAuth();
  
  const [holdings, setHoldings] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL']);
  const [newSymbol, setNewSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [lookbackYears, setLookbackYears] = useState(1);
  
  const [isEstimating, setIsEstimating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [userTier, setUserTier] = useState<PlanTier>('FREE');
  
  // Safely access caps with fallback
  const tierConfig = PLANS_CONFIG.tiers[userTier];
  const caps = tierConfig?.projects?.portfolio_checkup ?? {
    maxHoldings: 10,
    maxLookbackYears: 1,
  };
  
  useEffect(() => {
    const fetchEstimate = async () => {
      if (holdings.length === 0) {
        setEstimate(null);
        return;
      }
      
      setIsEstimating(true);
      try {
        const response = await fetch(
          'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/projects-run/estimate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
            },
            body: JSON.stringify({
              projectType: 'portfolio_checkup',
              instruments: holdings,
              patterns: [],
              timeframe,
              lookbackYears,
            }),
          }
        );
        
        const data = await response.json();
        setEstimate(data);
        if (data.tier) setUserTier(data.tier);
      } catch (error) {
        console.error('Estimate error:', error);
      } finally {
        setIsEstimating(false);
      }
    };
    
    const debounce = setTimeout(fetchEstimate, 300);
    return () => clearTimeout(debounce);
  }, [holdings, timeframe, lookbackYears, session]);
  
  const addHolding = () => {
    const symbol = newSymbol.toUpperCase().trim();
    if (symbol && !holdings.includes(symbol) && holdings.length < caps.maxHoldings) {
      setHoldings([...holdings, symbol]);
      setNewSymbol('');
    }
  };
  
  const removeHolding = (symbol: string) => {
    setHoldings(holdings.filter(h => h !== symbol));
  };
  
  const addPopularHolding = (symbol: string) => {
    if (!holdings.includes(symbol) && holdings.length < caps.maxHoldings) {
      setHoldings([...holdings, symbol]);
    }
  };
  
  const handleRun = async () => {
    if (!session) {
      toast.error('Please sign in to run projects');
      navigate('/auth');
      return;
    }
    
    if (holdings.length === 0) {
      toast.error('Please add at least one holding');
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
            projectType: 'portfolio_checkup',
            inputs: {
              instruments: holdings,
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
      
      toast.success('Portfolio checkup started!');
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
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <PieChart className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Portfolio Checkup</h1>
              <p className="text-muted-foreground">Analyze your holdings with pattern detection</p>
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Holdings Input */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Your Holdings</CardTitle>
                <CardDescription>Add the symbols in your portfolio (max {caps.maxHoldings})</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter symbol (e.g., AAPL)"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && addHolding()}
                    className="flex-1"
                  />
                  <Button onClick={addHolding} disabled={holdings.length >= caps.maxHoldings}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {holdings.map(symbol => (
                    <Badge key={symbol} variant="secondary" className="px-3 py-1.5 text-sm">
                      {symbol}
                      <button onClick={() => removeHolding(symbol)} className="ml-2 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <Label className="text-xs text-muted-foreground mb-2 block">Quick Add Popular:</Label>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_HOLDINGS.filter(h => !holdings.includes(h.symbol)).slice(0, 6).map(h => (
                      <Button
                        key={h.symbol}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addPopularHolding(h.symbol)}
                      >
                        {h.symbol}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Parameters */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Analysis Parameters</CardTitle>
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
                          <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
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
                        {getValidLookbackOptions(timeframe as Timeframe).map(lb => (
                          <SelectItem 
                            key={lb.value} 
                            value={String(lb.value)}
                            disabled={lb.value > caps.maxLookbackYears}
                          >
                            {lb.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Data coverage: {getCoverageInfo(timeframe as Timeframe)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
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
                  </div>
                ) : estimate ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">{estimate.creditsEstimated}</span>
                      <span className="text-muted-foreground">credits</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Holdings</span>
                        <span className="font-medium text-foreground">{holdings.length}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                        <span>Your Balance</span>
                        <span className="font-medium text-foreground">{estimate.creditsBalance}</span>
                      </div>
                    </div>
                    
                    {!estimate.allowed && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{estimate.errors?.[0] || 'Cannot run project'}</AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Add holdings to see estimate</p>
                )}
                
                <Button
                  onClick={handleRun}
                  disabled={isRunning || !estimate?.allowed || holdings.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Run Checkup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCheckupWizard;
