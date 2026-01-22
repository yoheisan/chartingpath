import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Zap, TrendingUp, AlertCircle, Loader2, Coins, Database, Clock, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PLANS_CONFIG } from '@/config/plans';

// Pattern options matching server registry
const PATTERNS = [
  { id: 'donchian-breakout-long', name: 'Donchian Breakout (Long)', direction: 'bullish' },
  { id: 'donchian-breakout-short', name: 'Donchian Breakout (Short)', direction: 'bearish' },
  { id: 'double-top', name: 'Double Top (Short)', direction: 'bearish' },
  { id: 'double-bottom', name: 'Double Bottom (Long)', direction: 'bullish' },
  { id: 'ascending-triangle', name: 'Ascending Triangle (Long)', direction: 'bullish' },
  { id: 'descending-triangle', name: 'Descending Triangle (Short)', direction: 'bearish' },
];

const UNIVERSES: Record<string, { value: string; label: string; count: number }[]> = {
  crypto: [
    { value: 'top10', label: 'Top 10 Crypto', count: 10 },
    { value: 'top25', label: 'Top 25 Crypto', count: 25 },
  ],
  fx: [
    { value: 'majors', label: 'Major Pairs', count: 8 },
    { value: 'majors_crosses', label: 'Majors + Crosses', count: 20 },
  ],
  stocks: [
    { value: 'sp500_leaders', label: 'S&P 500 Leaders', count: 25 },
    { value: 'sp500_50', label: 'S&P 500 Top 50', count: 50 },
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
];

const SetupFinderWizard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Form state
  const [assetClass, setAssetClass] = useState('crypto');
  const [universe, setUniverse] = useState('top10');
  const [timeframe, setTimeframe] = useState('1d');
  const [lookbackYears, setLookbackYears] = useState(1);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['donchian-breakout-long']);
  const [riskPerTrade, setRiskPerTrade] = useState(1);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // UI state
  const [isEstimating, setIsEstimating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [estimate, setEstimate] = useState<{
    creditsEstimated: number;
    instrumentCount: number;
    patternCount: number;
    allowed: boolean;
    reason: string | null;
    creditsBalance: number;
    cacheHitRatio: number;
    tier?: string;
    tierCaps?: {
      maxInstruments: number;
      maxLookbackYears: number;
      maxPatterns: number;
      allowedTimeframes: string[];
    };
  } | null>(null);
  
  // Check auth status on mount and listen for changes
  useEffect(() => {
    // Set up auth state listener FIRST to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[SetupFinder] Auth state changed:', event, !!session?.user);
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        setTimeout(() => {
          supabase.rpc('is_admin', { _user_id: session.user.id }).then(({ data }) => {
            setIsAdmin(data === true);
          });
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[SetupFinder] Initial session check:', !!session?.user);
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        supabase.rpc('is_admin', { _user_id: session.user.id }).then(({ data }) => {
          setIsAdmin(data === true);
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Update universe when asset class changes
  useEffect(() => {
    const defaultUniverse = UNIVERSES[assetClass]?.[0]?.value || '';
    setUniverse(defaultUniverse);
  }, [assetClass]);
  
  // Fetch estimate when inputs change
  useEffect(() => {
    const fetchEstimate = async () => {
      if (selectedPatterns.length === 0) {
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
              assetClass,
              universe,
              patterns: selectedPatterns,
              timeframe,
              lookbackYears,
            }),
          }
        );
        
        const data = await response.json();
        setEstimate(data);
      } catch (error) {
        console.error('Estimate error:', error);
      } finally {
        setIsEstimating(false);
      }
    };
    
    const debounce = setTimeout(fetchEstimate, 300);
    return () => clearTimeout(debounce);
  }, [assetClass, universe, selectedPatterns, timeframe, lookbackYears]);
  
  const handlePatternToggle = (patternId: string) => {
    setSelectedPatterns(prev => 
      prev.includes(patternId)
        ? prev.filter(p => p !== patternId)
        : [...prev, patternId]
    );
  };
  
  const handleRun = async () => {
    console.log('[SetupFinder] handleRun clicked');
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[SetupFinder] Session:', session ? 'authenticated' : 'not authenticated');
    
    if (!session) {
      toast.error('Please sign in to run projects');
      navigate('/auth');
      return;
    }
    
    if (selectedPatterns.length === 0) {
      toast.error('Please select at least one pattern');
      return;
    }
    
    setIsRunning(true);
    console.log('[SetupFinder] Starting run with:', { assetClass, universe, patterns: selectedPatterns, timeframe, lookbackYears });
    
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
            projectType: 'setup_finder',
            inputs: {
              assetClass,
              universe,
              patterns: selectedPatterns,
              timeframe,
              lookbackYears,
              riskPerTrade,
            },
          }),
        }
      );
      
      console.log('[SetupFinder] Response status:', response.status);
      const data = await response.json();
      console.log('[SetupFinder] Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start run');
      }
      
      toast.success(`Found ${data.setupsFound || 0} setups!`);
      navigate(`/projects/runs/${data.runId}`);
    } catch (error) {
      console.error('[SetupFinder] Run error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start run');
    } finally {
      setIsRunning(false);
    }
  };

  const universeCount = UNIVERSES[assetClass]?.find(u => u.value === universe)?.count || 0;
  
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
          
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Setup Finder</h1>
                <p className="text-muted-foreground">
                  Scan markets for pattern-based trade setups
                </p>
              </div>
            </div>
            
            {/* Auth/Admin Status */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                  Admin
                </Badge>
              )}
              {!isAuthenticated && (
                <Badge variant="outline" className="text-orange-500 border-orange-500">
                  Not signed in
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Class */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Market Selection</CardTitle>
                <CardDescription>Choose the market and universe to scan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Asset Class</Label>
                    <Select value={assetClass} onValueChange={setAssetClass}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        <SelectItem value="fx">Forex</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Universe</Label>
                    <Select value={universe} onValueChange={setUniverse}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIVERSES[assetClass]?.map(u => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Timeframe</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEFRAMES.map(tf => (
                          <SelectItem 
                            key={tf.value} 
                            value={tf.value}
                            disabled={estimate?.tierCaps && !estimate.tierCaps.allowedTimeframes.includes(tf.value)}
                          >
                            {tf.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Lookback Period</Label>
                      <span 
                        className="text-muted-foreground cursor-help" 
                        title="How much historical data to analyze. More data = better pattern detection accuracy, but slower processing."
                      >
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <Select value={String(lookbackYears)} onValueChange={(v) => setLookbackYears(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOOKBACK_OPTIONS.map(lb => (
                          <SelectItem 
                            key={lb.value} 
                            value={String(lb.value)}
                            disabled={estimate?.tierCaps && lb.value > estimate.tierCaps.maxLookbackYears}
                          >
                            {lb.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The scanner uses this historical data to detect patterns. <strong>Only recent signals</strong> (within the last few days) are shown as actionable setups.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Patterns */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Pattern Selection</CardTitle>
                <CardDescription>Select patterns to scan for</CardDescription>
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
                      <Badge variant={pattern.direction === 'bullish' ? 'default' : 'secondary'} className="text-xs">
                        {pattern.direction === 'bullish' ? 'Long' : 'Short'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Risk Settings */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Risk Settings</CardTitle>
                <CardDescription>Configure position sizing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Risk per Trade</Label>
                      <span className="text-sm font-medium text-primary">{riskPerTrade}%</span>
                    </div>
                    <Slider
                      value={[riskPerTrade]}
                      onValueChange={([v]) => setRiskPerTrade(v)}
                      min={0.5}
                      max={5}
                      step={0.5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 1-2% per trade for conservative risk management
                    </p>
                  </div>
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
                    {/* Admin indicator */}
                    {(estimate.tier === 'TEAM' || isAdmin) && (
                      <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-md px-3 py-2 mb-3 border border-yellow-500/30">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span className="text-yellow-600 font-medium">Admin: Unlimited access</span>
                      </div>
                    )}
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {isAdmin ? '∞' : estimate.creditsEstimated}
                      </span>
                      <span className="text-muted-foreground">credits</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Instruments</span>
                        <span className="font-medium text-foreground">{estimate.instrumentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Patterns</span>
                        <span className="font-medium text-foreground">{estimate.patternCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lookback</span>
                        <span className="font-medium text-foreground">{lookbackYears} year{lookbackYears > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                        <span>Your Balance</span>
                        <span className="font-medium text-foreground">
                          {isAdmin ? '∞' : estimate.creditsBalance}
                        </span>
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
                          {estimate.reason === 'insufficient_credits'
                            ? 'Not enough credits. Upgrade your plan.'
                            : estimate.reason === 'exceeds_instrument_cap'
                            ? `Max ${estimate.tierCaps?.maxInstruments} instruments on your plan.`
                            : estimate.reason === 'exceeds_lookback_cap'
                            ? `Max ${estimate.tierCaps?.maxLookbackYears} year lookback on your plan.`
                            : estimate.reason === 'exceeds_pattern_cap'
                            ? `Max ${estimate.tierCaps?.maxPatterns} patterns on your plan.`
                            : 'This configuration exceeds your plan limits.'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select patterns to see estimate
                  </p>
                )}
                
                {/* Sign in prompt for unauthenticated users */}
                {!isAuthenticated && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto" 
                        onClick={() => navigate('/auth')}
                      >
                        Sign in
                      </Button>
                      {' '}to run projects
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button
                  onClick={handleRun}
                  disabled={isRunning || selectedPatterns.length === 0 || (!isAdmin && estimate && !estimate.allowed)}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Sign in to Run
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Run Setup Finder
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

export default SetupFinderWizard;
