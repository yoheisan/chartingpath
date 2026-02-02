import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, TrendingUp, AlertCircle, Loader2, Coins, Plus, X, RefreshCw, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PLANS_CONFIG, type PlanTier } from '@/config/plans';
import { 
  DATA_COVERAGE, 
  getValidLookbackOptions, 
  getCoverageInfo,
  type Timeframe 
} from '@/config/dataCoverageContract';

const POPULAR_ETFS = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'Nasdaq 100' },
  { symbol: 'VTI', name: 'Total Market' },
  { symbol: 'BND', name: 'Total Bond' },
  { symbol: 'GLD', name: 'Gold' },
  { symbol: 'VNQ', name: 'Real Estate' },
  { symbol: 'VWO', name: 'Emerging Markets' },
  { symbol: 'VEA', name: 'Developed Markets' },
];

const REBALANCE_OPTIONS = [
  { value: 'never', label: 'Never (Buy & Hold)' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
];

// LOOKBACK_OPTIONS - Portfolio Sim uses daily data (5 years max from provider)
// But for simulations, we can use available historical data up to 5 years reliably
const LOOKBACK_OPTIONS = [
  { value: 3, label: '3 Years' },
  { value: 5, label: '5 Years' },
];

interface Holding {
  symbol: string;
  weight: number;
}

interface EstimateResult {
  creditsEstimated: number;
  instrumentCount: number;
  allowed: boolean;
  reason: string | null;
  errors: string[];
  creditsBalance: number;
  tier: PlanTier;
}

const PortfolioSimulatorWizard = () => {
  const navigate = useNavigate();
  
  const [holdings, setHoldings] = useState<Holding[]>([
    { symbol: 'SPY', weight: 0.6 },
    { symbol: 'BND', weight: 0.3 },
    { symbol: 'GLD', weight: 0.1 },
  ]);
  const [newSymbol, setNewSymbol] = useState('');
  const [lookbackYears, setLookbackYears] = useState(5);
  const [rebalanceFrequency, setRebalanceFrequency] = useState('quarterly');
  const [initialValue, setInitialValue] = useState(10000);
  const [dcaEnabled, setDcaEnabled] = useState(false);
  const [dcaAmount, setDcaAmount] = useState(500);
  
  const [isEstimating, setIsEstimating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [userTier, setUserTier] = useState<PlanTier>('FREE');
  
  // Safely access caps with fallback
  const tierConfig = PLANS_CONFIG.tiers[userTier];
  const caps = tierConfig?.projects?.portfolio_sim ?? {
    maxHoldings: 5,
    maxLookbackYears: 5,
    rebalanceOptions: ['never', 'yearly', 'quarterly'],
  };
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  
  useEffect(() => {
    const fetchEstimate = async () => {
      if (holdings.length === 0) {
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
              projectType: 'portfolio_sim',
              holdings,
              instruments: holdings.map(h => h.symbol),
              patterns: [],
              timeframe: '1d',
              lookbackYears,
              rebalancePerYear: rebalanceFrequency === 'monthly' ? 12 : rebalanceFrequency === 'quarterly' ? 4 : rebalanceFrequency === 'yearly' ? 1 : 0,
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
  }, [holdings, lookbackYears, rebalanceFrequency]);
  
  const addHolding = () => {
    const symbol = newSymbol.toUpperCase().trim();
    if (symbol && !holdings.find(h => h.symbol === symbol) && holdings.length < caps.maxHoldings) {
      setHoldings([...holdings, { symbol, weight: 0.1 }]);
      setNewSymbol('');
    }
  };
  
  const removeHolding = (symbol: string) => {
    setHoldings(holdings.filter(h => h.symbol !== symbol));
  };
  
  const updateWeight = (symbol: string, weight: number) => {
    setHoldings(holdings.map(h => h.symbol === symbol ? { ...h, weight } : h));
  };
  
  const equalizeWeights = () => {
    const weight = 1 / holdings.length;
    setHoldings(holdings.map(h => ({ ...h, weight })));
  };
  
  const addPopularHolding = (symbol: string) => {
    if (!holdings.find(h => h.symbol === symbol) && holdings.length < caps.maxHoldings) {
      setHoldings([...holdings, { symbol, weight: 0.1 }]);
    }
  };
  
  const handleRun = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error('Please sign in to run projects');
      navigate('/auth');
      return;
    }
    
    if (holdings.length === 0) {
      toast.error('Please add at least one holding');
      return;
    }
    
    if (Math.abs(totalWeight - 1) > 0.01) {
      toast.error('Weights must sum to 100%');
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
            projectType: 'portfolio_sim',
            inputs: {
              instruments: holdings.map(h => h.symbol),
              holdings,
              timeframe: '1d',
              lookbackYears,
              rebalanceFrequency,
              initialValue,
              dcaAmount: dcaEnabled ? dcaAmount : 0,
              dcaFrequency: 'monthly',
            },
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start run');
      }
      
      toast.success('Portfolio simulation started!');
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
            <div className="p-3 rounded-xl bg-sky-500/10">
              <TrendingUp className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Portfolio Simulator</h1>
              <p className="text-muted-foreground">Test DCA, rebalancing, and allocation strategies</p>
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Holdings */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Portfolio Allocation</CardTitle>
                    <CardDescription>Max {caps.maxHoldings} holdings</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={equalizeWeights}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Equal Weight
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter symbol (e.g., VTI)"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && addHolding()}
                    className="flex-1"
                  />
                  <Button onClick={addHolding} disabled={holdings.length >= caps.maxHoldings}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {holdings.map(holding => (
                    <div key={holding.symbol} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="font-medium w-16">{holding.symbol}</div>
                      <Slider
                        value={[holding.weight * 100]}
                        onValueChange={([v]) => updateWeight(holding.symbol, v / 100)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <div className="w-16 text-right font-mono text-sm">
                        {(holding.weight * 100).toFixed(0)}%
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeHolding(holding.symbol)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {Math.abs(totalWeight - 1) > 0.01 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Weights sum to {(totalWeight * 100).toFixed(0)}% - must equal 100%
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="pt-4 border-t border-border/50">
                  <Label className="text-xs text-muted-foreground mb-2 block">Quick Add ETFs:</Label>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_ETFS.filter(e => !holdings.find(h => h.symbol === e.symbol)).slice(0, 6).map(e => (
                      <Button
                        key={e.symbol}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addPopularHolding(e.symbol)}
                      >
                        {e.symbol}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Simulation Parameters */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Simulation Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Initial Investment</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={initialValue}
                        onChange={(e) => setInitialValue(Number(e.target.value))}
                        className="pl-9"
                      />
                    </div>
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
                            disabled={lb.value > caps.maxLookbackYears}
                          >
                            {lb.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Rebalancing Frequency</Label>
                  <Select value={rebalanceFrequency} onValueChange={setRebalanceFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REBALANCE_OPTIONS.map(opt => (
                        <SelectItem 
                          key={opt.value} 
                          value={opt.value}
                          disabled={!caps.rebalanceOptions.includes(opt.value) && opt.value !== 'never'}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable DCA</Label>
                      <p className="text-xs text-muted-foreground">Monthly contributions</p>
                    </div>
                    <Switch checked={dcaEnabled} onCheckedChange={setDcaEnabled} />
                  </div>
                  
                  {dcaEnabled && (
                    <div className="space-y-2">
                      <Label>Monthly Contribution</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={dcaAmount}
                          onChange={(e) => setDcaAmount(Number(e.target.value))}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  )}
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
                      <div className="flex justify-between">
                        <span>Lookback</span>
                        <span className="font-medium text-foreground">{lookbackYears} years</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                        <span>Your Balance</span>
                        <span className="font-medium text-foreground">{estimate.creditsBalance}</span>
                      </div>
                    </div>
                    
                    {!estimate.allowed && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{estimate.errors?.[0] || 'Cannot run'}</AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Add holdings to see estimate</p>
                )}
                
                <Button
                  onClick={handleRun}
                  disabled={isRunning || !estimate?.allowed || holdings.length === 0 || Math.abs(totalWeight - 1) > 0.01}
                  className="w-full"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Run Simulation
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

export default PortfolioSimulatorWizard;
