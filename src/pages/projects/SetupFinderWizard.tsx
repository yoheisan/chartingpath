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
import { ArrowLeft, Zap, AlertCircle, Loader2, Coins, Database, Clock, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PLANS_CONFIG } from '@/config/plans';
import { UniversalSymbolSearch } from '@/components/charts/UniversalSymbolSearch';
import InstrumentLogo from '@/components/charts/InstrumentLogo';
import { useAuth } from '@/contexts/AuthContext';

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


const SetupFinderWizard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Form state
  const [assetClass, setAssetClass] = useState('crypto');
  const [universe, setUniverse] = useState('top10');
  const [timeframe, setTimeframe] = useState('1d');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['donchian-breakout-long']);
  
  // Use centralized auth context instead of local state
  const { isAuthenticated, isAuthLoading, isAdmin, session } = useAuth();
  
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
  
  // Update universe when asset class changes
  useEffect(() => {
    const defaultUniverse = UNIVERSES[assetClass]?.[0]?.value || '';
    setUniverse(defaultUniverse);
  }, [assetClass]);
  
  // Fetch estimate when inputs change
  useEffect(() => {
    const fetchEstimate = async () => {
      if (selectedPatterns.length === 0 || selectedInstruments.length === 0) {
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
              projectType: 'setup_finder',
              instruments: selectedInstruments,
              patterns: selectedPatterns,
              timeframe,
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
  }, [selectedInstruments, selectedPatterns, timeframe, session]);
  
  const handlePatternToggle = (patternId: string) => {
    setSelectedPatterns(prev => 
      prev.includes(patternId)
        ? prev.filter(p => p !== patternId)
        : [...prev, patternId]
    );
  };
  
  const handleRun = async () => {
    console.log('[SetupFinder] handleRun clicked');
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
    
    if (selectedInstruments.length === 0) {
      toast.error('Please select at least one instrument');
      return;
    }
    
    setIsRunning(true);
    console.log('[SetupFinder] Starting run with:', { instruments: selectedInstruments, patterns: selectedPatterns, timeframe });
    
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
              instruments: selectedInstruments,
              patterns: selectedPatterns,
              timeframe,
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
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Search className="h-6 w-6 text-emerald-500" />
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
              {!isAuthLoading && !isAuthenticated && (
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
            {/* Instruments */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Market Selection</CardTitle>
                <CardDescription>Search and add instruments to scan</CardDescription>
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
                
                {/* Timeframe */}
                <div className="space-y-2 pt-2 border-t border-border/50">
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
                {!isAuthLoading && !isAuthenticated && (
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
                  disabled={isRunning || isAuthLoading || selectedPatterns.length === 0 || (!isAdmin && estimate && !estimate.allowed)}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : isAuthLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
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
