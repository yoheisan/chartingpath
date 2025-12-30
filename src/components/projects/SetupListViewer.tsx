import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/services/analytics';

interface Setup {
  instrument: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  signalTs: string;
  quality: { score: string; reasons: string[] };
  tradePlan: {
    entryType: string;
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rr: number;
    stopDistance: number;
    tpDistance: number;
    timeStopBars: number;
    bracketLevelsVersion: string;
    priceRounding: { priceDecimals: number; rrDecimals: number };
  };
  visualSpec: null;
}

interface SetupArtifact {
  projectType: string;
  timeframe: string;
  generatedAt: string;
  executionAssumptions: {
    bracketLevelsVersion: string;
    priceRounding: { priceDecimals: number; rrDecimals: number };
  };
  setups: Setup[];
}

interface SetupListViewerProps {
  artifact: SetupArtifact;
  runId: string;
}

const TradePlanCard = ({ 
  setup, 
  onCopy, 
  onCreateAlert,
  isCreatingAlert 
}: { 
  setup: Setup; 
  onCopy: () => void;
  onCreateAlert: () => void;
  isCreatingAlert: boolean;
}) => {
  const { tradePlan, direction, patternName, instrument } = setup;
  const isLong = direction === 'long';
  
  const formatPrice = (price: number) => {
    const decimals = tradePlan.priceRounding?.priceDecimals || 2;
    return price.toFixed(Math.min(decimals, 6));
  };
  
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLong ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {isLong ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{instrument}</CardTitle>
              <p className="text-sm text-muted-foreground">{patternName}</p>
            </div>
          </div>
          <Badge 
            variant="outline"
            className={`font-semibold ${
              setup.quality.score === 'A' 
                ? 'border-green-500/50 text-green-500' 
                : setup.quality.score === 'B'
                  ? 'border-yellow-500/50 text-yellow-500'
                  : 'border-muted-foreground/50'
            }`}
          >
            Grade {setup.quality.score}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Trade Levels */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Entry
            </div>
            <p className="font-mono font-semibold">{formatPrice(tradePlan.entry)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldAlert className="h-3 w-3 text-red-500" />
              Stop Loss
            </div>
            <p className="font-mono font-semibold text-red-500">{formatPrice(tradePlan.stopLoss)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Take Profit
            </div>
            <p className="font-mono font-semibold text-green-500">{formatPrice(tradePlan.takeProfit)}</p>
          </div>
        </div>
        
        <Separator />
        
        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">R:R</span>
              <span className="ml-1 font-semibold text-primary">{tradePlan.rr.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{tradePlan.timeStopBars} bars</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            v{tradePlan.bracketLevelsVersion}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCopy}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Plan
          </Button>
          <Button 
            size="sm" 
            onClick={onCreateAlert}
            disabled={isCreatingAlert}
            className="flex-1"
          >
            {isCreatingAlert ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Create Alert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SetupListViewer = ({ artifact, runId }: SetupListViewerProps) => {
  const [creatingAlertFor, setCreatingAlertFor] = useState<string | null>(null);
  
  const handleCopyTradePlan = async (setup: Setup) => {
    const { tradePlan, instrument, patternName, direction } = setup;
    
    const text = `
📊 ${instrument} - ${patternName}
Direction: ${direction.toUpperCase()}

Entry: ${tradePlan.entry}
Stop Loss: ${tradePlan.stopLoss}
Take Profit: ${tradePlan.takeProfit}
R:R: ${tradePlan.rr.toFixed(2)}
Time Stop: ${tradePlan.timeStopBars} bars

Bracket Engine: v${tradePlan.bracketLevelsVersion}
Generated: ${new Date(artifact.generatedAt).toLocaleString()}
`.trim();
    
    await navigator.clipboard.writeText(text);
    toast.success('Trade plan copied to clipboard');
    
    // Track analytics
    track('trade_plan_copied', {
      projectType: 'setup_finder',
      instrument,
      pattern: setup.patternId,
      timeframe: artifact.timeframe,
    });
  };
  
  const handleCreateAlert = async (setup: Setup) => {
    setCreatingAlertFor(setup.instrument);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to create alerts');
        return;
      }
      
      // Get user profile for plan info
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('user_id', session.user.id)
        .single();
      
      const response = await supabase.functions.invoke('create-alert', {
        body: {
          action: 'create',
          symbol: setup.instrument,
          pattern: setup.patternId,
          timeframe: artifact.timeframe === '4h' ? '4H' : '1D',
          wedgeEnabled: true,
          // Include bracket levels in metadata (stored in pattern_data when alert triggers)
          bracketLevels: {
            entry: setup.tradePlan.entry,
            stopLoss: setup.tradePlan.stopLoss,
            takeProfit: setup.tradePlan.takeProfit,
            rr: setup.tradePlan.rr,
            stopDistance: setup.tradePlan.stopDistance,
            tpDistance: setup.tradePlan.tpDistance,
            bracketLevelsVersion: setup.tradePlan.bracketLevelsVersion,
          },
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create alert');
      }
      
      toast.success(`Alert created for ${setup.instrument}`);
      
      // Track analytics
      track('alert_created', {
        symbol: setup.instrument,
        pattern: setup.patternId,
        timeframe: artifact.timeframe,
        plan_tier: profile?.subscription_plan || 'free',
      });
      
      // Also emit project-specific event
      await supabase.from('analytics_events').insert({
        user_id: session.user.id,
        event_name: 'alert_created_from_project',
        properties: {
          projectType: 'setup_finder',
          runId,
          instrument: setup.instrument,
          patternId: setup.patternId,
          bracketLevelsVersion: setup.tradePlan.bracketLevelsVersion,
        },
      });
      
    } catch (error) {
      console.error('Create alert error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create alert');
    } finally {
      setCreatingAlertFor(null);
    }
  };
  
  const longSetups = artifact.setups.filter(s => s.direction === 'long');
  const shortSetups = artifact.setups.filter(s => s.direction === 'short');
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Setup Results</CardTitle>
            <Badge variant="outline">{artifact.setups.length} setups found</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Timeframe</p>
              <p className="font-medium">{artifact.timeframe.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Long Setups</p>
              <p className="font-medium text-green-500">{longSetups.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Short Setups</p>
              <p className="font-medium text-red-500">{shortSetups.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Generated</p>
              <p className="font-medium">{new Date(artifact.generatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Setup Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {artifact.setups.map((setup, index) => (
          <TradePlanCard
            key={`${setup.instrument}-${setup.patternId}-${index}`}
            setup={setup}
            onCopy={() => handleCopyTradePlan(setup)}
            onCreateAlert={() => handleCreateAlert(setup)}
            isCreatingAlert={creatingAlertFor === setup.instrument}
          />
        ))}
      </div>
    </div>
  );
};

export default SetupListViewer;
