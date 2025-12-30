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
import { ArrowLeft, Zap, TrendingUp, AlertCircle, Loader2, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Pattern options matching server registry
const PATTERNS = [
  { id: 'donchian-breakout-long', name: 'Donchian Breakout (Long)', direction: 'bullish' },
  { id: 'donchian-breakout-short', name: 'Donchian Breakout (Short)', direction: 'bearish' },
  { id: 'double-top', name: 'Double Top (Short)', direction: 'bearish' },
  { id: 'double-bottom', name: 'Double Bottom (Long)', direction: 'bullish' },
  { id: 'ascending-triangle', name: 'Ascending Triangle (Long)', direction: 'bullish' },
  { id: 'descending-triangle', name: 'Descending Triangle (Short)', direction: 'bearish' },
];

const UNIVERSES: Record<string, { value: string; label: string }[]> = {
  crypto: [{ value: 'top10', label: 'Top 10 Crypto' }],
  fx: [{ value: 'majors', label: 'Major Pairs' }],
  stocks: [{ value: 'sp500_leaders', label: 'S&P 500 Leaders' }],
};

const TIMEFRAMES = [
  { value: '4h', label: '4 Hour' },
  { value: '1d', label: 'Daily' },
];

const SetupFinderWizard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Form state
  const [assetClass, setAssetClass] = useState('crypto');
  const [universe, setUniverse] = useState('top10');
  const [timeframe, setTimeframe] = useState('4h');
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['donchian-breakout-long']);
  const [riskPerTrade, setRiskPerTrade] = useState(1);
  
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
  } | null>(null);
  
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
  }, [assetClass, universe, selectedPatterns, timeframe]);
  
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
    
    if (selectedPatterns.length === 0) {
      toast.error('Please select at least one pattern');
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
            projectType: 'setup_finder',
            inputs: {
              assetClass,
              universe,
              patterns: selectedPatterns,
              timeframe,
              riskPerTrade,
            },
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start run');
      }
      
      toast.success(`Found ${data.setupsFound} setups!`);
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
                
                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-full sm:w-48">
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
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {estimate.creditsEstimated}
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
                        <span>Your Balance</span>
                        <span className="font-medium text-foreground">{estimate.creditsBalance}</span>
                      </div>
                    </div>
                    
                    {!estimate.allowed && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {estimate.reason === 'insufficient_credits'
                            ? 'Not enough credits. Please upgrade your plan.'
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
                
                <Button
                  onClick={handleRun}
                  disabled={isRunning || selectedPatterns.length === 0 || (estimate && !estimate.allowed)}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
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
