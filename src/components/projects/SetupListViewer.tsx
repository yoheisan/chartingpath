import { useState, useMemo, useCallback } from 'react';
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
  Loader2,
  BarChart3,
  Expand,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/services/analytics';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import FullChartViewer from '@/components/charts/FullChartViewer';
import SetupFilters, { SortOption, DirectionFilter } from './SetupFilters';
import { SetupGridSkeleton } from './SetupCardSkeleton';
import { SetupWithVisuals, CompressedBar, VisualSpec, PatternQuality } from '@/types/VisualSpec';
import { DISCLAIMERS } from '@/constants/disclaimers';
import DisclaimerBanner from '@/components/DisclaimerBanner';

// Legacy interface support for backward compatibility
interface LegacySetup {
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
  visualSpec?: VisualSpec | null;
  bars?: CompressedBar[];
}

type Setup = LegacySetup | SetupWithVisuals;

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
  isLoading?: boolean;
}

// Visual data presence check (note: legacy setups may also include bars/visualSpec)
function hasVisualData(setup: Setup): boolean {
  return !!(setup.bars && setup.bars.length > 0 && setup.visualSpec);
}

const normalizeQuality = (quality: any): PatternQuality => {
  // Already in the new format
  if (quality && typeof quality.score === 'number' && typeof quality.grade === 'string') {
    return quality as PatternQuality;
  }

  // Legacy format: quality.score is letter grade (A/B/C) + reasons[]
  const legacyGrade = typeof quality?.score === 'string' ? quality.score : 'C';
  const grade = (['A', 'B', 'C', 'D', 'F'].includes(legacyGrade) ? legacyGrade : 'C') as PatternQuality['grade'];

  const score =
    grade === 'A' ? 9.0 :
    grade === 'B' ? 7.5 :
    grade === 'C' ? 6.0 :
    grade === 'D' ? 4.5 :
    3.0;

  return {
    score,
    grade,
    confidence: 60,
    reasons: Array.isArray(quality?.reasons) ? quality.reasons : [],
    warnings: [],
    tradeable: true,
  };
};

const toViewerSetup = (setup: Setup): SetupWithVisuals | null => {
  if (!hasVisualData(setup)) return null;

  // If it's already a SetupWithVisuals, just ensure the quality object is compatible
  return {
    ...(setup as any),
    bars: (setup as any).bars,
    visualSpec: (setup as any).visualSpec,
    quality: normalizeQuality((setup as any).quality),
  } as SetupWithVisuals;
};

const SetupCard = ({ 
  setup, 
  onCopy, 
  onCreateAlert,
  onViewFull,
  isCreatingAlert 
}: { 
  setup: Setup; 
  onCopy: () => void;
  onCreateAlert: () => void;
  onViewFull: () => void;
  isCreatingAlert: boolean;
}) => {
  const { tradePlan, direction, patternName, instrument, quality } = setup;
  const isLong = direction === 'long';
  const hasChart = hasVisualData(setup);
  
  const formatPrice = (price: number) => {
    const decimals = tradePlan.priceRounding?.priceDecimals || 2;
    return price.toFixed(Math.min(decimals, 6));
  };
  
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all group">
      {/* Thumbnail Chart */}
      {hasChart && (
        <div className="relative">
          <ThumbnailChart 
            bars={setup.bars!} 
            visualSpec={setup.visualSpec!} 
            height={100}
            onClick={onViewFull}
          />
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-6 w-6"
              onClick={(e) => { e.stopPropagation(); onViewFull(); }}
            >
              <Expand className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      {/* No chart fallback */}
      {!hasChart && (
        <div className="h-[100px] bg-muted/30 flex items-center justify-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 opacity-50" />
        </div>
      )}
      
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isLong ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {isLong ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{instrument}</CardTitle>
              <p className="text-xs text-muted-foreground">{patternName}</p>
            </div>
          </div>
          <Badge 
            variant="outline"
            className={`text-xs font-semibold ${
              quality.score === 'A' 
                ? 'border-green-500/50 text-green-500' 
                : quality.score === 'B'
                  ? 'border-yellow-500/50 text-yellow-500'
                  : 'border-muted-foreground/50'
            }`}
          >
            {quality.score}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {/* Compact Trade Levels */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-2.5 w-2.5" />
              Entry
            </div>
            <p className="font-mono font-semibold">{formatPrice(tradePlan.entry)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <ShieldAlert className="h-2.5 w-2.5 text-red-500" />
              SL
            </div>
            <p className="font-mono font-semibold text-red-500">{formatPrice(tradePlan.stopLoss)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
              TP
            </div>
            <p className="font-mono font-semibold text-green-500">{formatPrice(tradePlan.takeProfit)}</p>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">R:R {tradePlan.rr.toFixed(2)}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {tradePlan.timeStopBars} bars
          </div>
        </div>
        
        <Separator />
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCopy}
            className="flex-1 h-8 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button 
            size="sm" 
            onClick={onCreateAlert}
            disabled={isCreatingAlert}
            className="flex-1 h-8 text-xs"
          >
            {isCreatingAlert ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Bell className="h-3 w-3 mr-1" />
            )}
            Alert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SetupListViewer = ({ artifact, runId, isLoading = false }: SetupListViewerProps) => {
  const [creatingAlertFor, setCreatingAlertFor] = useState<string | null>(null);
  const [selectedSetup, setSelectedSetup] = useState<SetupWithVisuals | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPattern, setSelectedPattern] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState<DirectionFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Extract unique patterns and timeframes
  const uniquePatterns = useMemo(() => 
    [...new Set(artifact.setups.map(s => s.patternId))],
    [artifact.setups]
  );
  
  const uniqueTimeframes = useMemo(() => 
    [...new Set([artifact.timeframe])],
    [artifact.timeframe]
  );
  
  // Apply filters and sorting
  const filteredAndSortedSetups = useMemo(() => {
    let result = [...artifact.setups];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.instrument.toLowerCase().includes(query) ||
        s.patternName.toLowerCase().includes(query)
      );
    }
    
    // Pattern filter
    if (selectedPattern !== 'all') {
      result = result.filter(s => s.patternId === selectedPattern);
    }
    
    // Direction filter
    if (selectedDirection !== 'all') {
      result = result.filter(s => s.direction === selectedDirection);
    }
    
    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.signalTs).getTime() - new Date(a.signalTs).getTime();
        case 'rr_high':
          return b.tradePlan.rr - a.tradePlan.rr;
        case 'rr_low':
          return a.tradePlan.rr - b.tradePlan.rr;
        case 'quality':
          const scoreOrder: Record<string, number> = { 'A': 3, 'B': 2, 'C': 1 };
          return (scoreOrder[b.quality.score] || 0) - (scoreOrder[a.quality.score] || 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [artifact.setups, searchQuery, selectedPattern, selectedDirection, sortBy]);
  
  const longSetups = useMemo(() => filteredAndSortedSetups.filter(s => s.direction === 'long'), [filteredAndSortedSetups]);
  const shortSetups = useMemo(() => filteredAndSortedSetups.filter(s => s.direction === 'short'), [filteredAndSortedSetups]);
  
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedPattern('all');
    setSelectedTimeframe('all');
    setSelectedDirection('all');
  }, []);
  
  const handleCopyTradePlan = useCallback(async (setup: Setup) => {
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

⚠️ For educational purposes only. Not financial advice.
`.trim();
    
    await navigator.clipboard.writeText(text);
    toast.success('Trade plan copied to clipboard');
    
    track('trade_plan_copied', {
      projectType: 'setup_finder',
      instrument,
      pattern: setup.patternId,
      timeframe: artifact.timeframe,
    });
  }, [artifact.generatedAt, artifact.timeframe]);
  
  const handleCreateAlert = useCallback(async (setup: Setup) => {
    setCreatingAlertFor(setup.instrument);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to create alerts');
        return;
      }
      
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
      
      track('alert_created', {
        symbol: setup.instrument,
        pattern: setup.patternId,
        timeframe: artifact.timeframe,
        plan_tier: profile?.subscription_plan || 'free',
      });
      
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
  }, [artifact.timeframe, runId]);
  
  const handleViewFull = useCallback((setup: Setup) => {
    const viewerSetup = toViewerSetup(setup);
    if (viewerSetup) {
      setSelectedSetup(viewerSetup);
      setIsViewerOpen(true);
      track('thumbnail_opened', {
        projectType: 'setup_finder',
        instrument: setup.instrument,
        pattern: setup.patternId,
      });
    }
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Loading Results...</CardTitle>
            </div>
          </CardHeader>
        </Card>
        <SetupGridSkeleton count={6} />
      </div>
    );
  }
  
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
      
      {/* Filters */}
      {artifact.setups.length > 0 && (
        <SetupFilters
          patterns={uniquePatterns}
          timeframes={uniqueTimeframes}
          searchQuery={searchQuery}
          selectedPattern={selectedPattern}
          selectedTimeframe={selectedTimeframe}
          selectedDirection={selectedDirection}
          sortBy={sortBy}
          onSearchChange={setSearchQuery}
          onPatternChange={setSelectedPattern}
          onTimeframeChange={setSelectedTimeframe}
          onDirectionChange={setSelectedDirection}
          onSortChange={setSortBy}
          onClearFilters={clearFilters}
          filteredCount={filteredAndSortedSetups.length}
          totalCount={artifact.setups.length}
        />
      )}
      
      {/* Setup Grid - 2/3 columns responsive */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedSetups.map((setup, index) => (
          <SetupCard
            key={`${setup.instrument}-${setup.patternId}-${index}`}
            setup={setup}
            onCopy={() => handleCopyTradePlan(setup)}
            onCreateAlert={() => handleCreateAlert(setup)}
            onViewFull={() => handleViewFull(setup)}
            isCreatingAlert={creatingAlertFor === setup.instrument}
          />
        ))}
      </div>
      
      {/* No results after filtering */}
      {artifact.setups.length > 0 && filteredAndSortedSetups.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No setups match your filters</p>
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Empty state - no setups at all */}
      {artifact.setups.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No setups found for the selected criteria</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your patterns or universe selection</p>
          </CardContent>
        </Card>
      )}
      
      {/* Disclaimer */}
      {artifact.setups.length > 0 && (
        <DisclaimerBanner variant="compact" />
      )}
      
      {/* Full Chart Viewer Modal */}
      <FullChartViewer
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        setup={selectedSetup}
        onCopyPlan={() => selectedSetup && handleCopyTradePlan(selectedSetup)}
        onCreateAlert={() => selectedSetup && handleCreateAlert(selectedSetup)}
        isCreatingAlert={!!creatingAlertFor}
      />
    </div>
  );
};

export default SetupListViewer;
