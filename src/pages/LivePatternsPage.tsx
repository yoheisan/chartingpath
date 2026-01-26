import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Zap, RefreshCw, TrendingUp, TrendingDown, ArrowRight, 
  Filter, Clock, BarChart3, Target, Shield, Lock, Crown
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import FullChartViewer from '@/components/charts/FullChartViewer';
import { CompressedBar, VisualSpec, PatternQuality, SetupWithVisuals } from '@/types/VisualSpec';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatSignalAgeSimple } from '@/utils/formatSignalAge';
import { useScreenerCaps, PATTERN_DISPLAY_NAMES } from '@/hooks/useScreenerCaps';

interface LiveSetup {
  instrument: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  signalTs: string;
  quality: PatternQuality;
  tradePlan: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rr: number;
    entryType?: string;
    stopDistance?: number;
    tpDistance?: number;
    timeStopBars?: number;
    bracketLevelsVersion?: string;
    priceRounding?: { priceDecimals: number; rrDecimals: number };
  };
  bars: CompressedBar[];
  visualSpec: VisualSpec;
  // Price data
  currentPrice?: number;
  prevClose?: number;
  changePercent?: number | null;
}

type AssetType = 'fx' | 'crypto' | 'stocks' | 'commodities';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  fx: 'Forex',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
};

interface ScanResult {
  success: boolean;
  patterns: LiveSetup[];
  assetType?: AssetType;
  scannedAt: string;
  instrumentsScanned: number;
}

// Helper to detect asset type from instrument symbol
function detectAssetTypeFromSymbol(symbol: string): AssetType | null {
  // Commodities end with =F
  if (symbol.endsWith('=F')) return 'commodities';
  // Forex ends with =X
  if (symbol.endsWith('=X')) return 'fx';
  // Crypto contains -USD
  if (symbol.includes('-USD')) return 'crypto';
  // Stocks are plain symbols (AAPL, MSFT, etc.) - harder to detect definitively
  // We'll check against known stock tickers
  const knownStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'JNJ',
    'WMT', 'PG', 'UNH', 'HD', 'BAC', 'MA', 'DIS', 'NFLX', 'ADBE', 'CRM', 'PFE', 'KO', 'PEP', 'MRK', 'CSCO'];
  if (knownStocks.includes(symbol)) return 'stocks';
  return null;
}

export default function LivePatternsPage() {
  const [searchParams] = useSearchParams();
  const highlightSymbol = searchParams.get('highlight');
  
  // Detect initial asset type from highlight symbol if present
  const initialAssetType = highlightSymbol ? (detectAssetTypeFromSymbol(highlightSymbol) || 'fx') : 'fx';
  
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [instrumentsScanned, setInstrumentsScanned] = useState(0);
  
  // Filters - use detected type from highlight or default to 'fx'
  const [assetType, setAssetType] = useState<AssetType>(initialAssetType);
  const [directionFilter, setDirectionFilter] = useState<'all' | 'long' | 'short'>('all');
  const [patternFilter, setPatternFilter] = useState<string>('all');
  
  // Full chart viewer state
  const [selectedSetup, setSelectedSetup] = useState<SetupWithVisuals | null>(null);
  const [chartOpen, setChartOpen] = useState(false);
  
  // Get tier-based screener caps
  const { caps, tier, upgradeIncentive, lockedPatterns } = useScreenerCaps();

  const fetchLivePatterns = async (isRefresh = false, selectedAssetType?: AssetType) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    const typeToFetch = selectedAssetType || assetType;
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke<ScanResult>('scan-live-patterns', {
        body: { 
          assetType: typeToFetch, 
          limit: 50,
          maxTickers: caps.maxTickersPerClass,
          allowedPatterns: caps.allowedPatterns
        },
      });
      
      if (fnError) throw fnError;
      
      if (data?.success && data.patterns) {
        setPatterns(data.patterns);
        setLastScanned(data.scannedAt);
        setInstrumentsScanned(data.instrumentsScanned);
      }
    } catch (err: any) {
      console.error('[LivePatternsPage] Error:', err);
      setError('Failed to load live patterns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssetTypeChange = (newType: AssetType) => {
    setAssetType(newType);
    fetchLivePatterns(false, newType);
  };

  // Fetch on mount
  useEffect(() => {
    fetchLivePatterns();
  }, []);

  // Auto-open chart when highlight param is present and matching pattern is found
  useEffect(() => {
    if (highlightSymbol && patterns.length > 0 && !chartOpen) {
      const matchingSetup = patterns.find(p => 
        p.instrument === highlightSymbol || p.instrument.includes(highlightSymbol)
      );
      if (matchingSetup) {
        handleOpenChart(matchingSetup);
      }
    }
  }, [highlightSymbol, patterns]);

  // Get unique pattern types for filter
  const uniquePatterns = [...new Set(patterns.map(p => p.patternId))];

  // Filter patterns
  const filteredPatterns = patterns.filter(p => {
    if (directionFilter !== 'all' && p.direction !== directionFilter) return false;
    if (patternFilter !== 'all' && p.patternId !== patternFilter) return false;
    return true;
  });

  // Sort highlighted symbol to top
  const sortedPatterns = [...filteredPatterns].sort((a, b) => {
    if (highlightSymbol) {
      if (a.instrument.includes(highlightSymbol)) return -1;
      if (b.instrument.includes(highlightSymbol)) return 1;
    }
    return 0;
  });

  const handleOpenChart = (setup: LiveSetup) => {
    // Convert to SetupWithVisuals format
    const fullSetup: SetupWithVisuals = {
      instrument: setup.instrument,
      patternId: setup.patternId,
      patternName: setup.patternName,
      direction: setup.direction,
      signalTs: setup.signalTs,
      quality: setup.quality,
      tradePlan: {
        entryType: setup.tradePlan.entryType || 'bar_close',
        entry: setup.tradePlan.entry,
        stopLoss: setup.tradePlan.stopLoss,
        takeProfit: setup.tradePlan.takeProfit,
        rr: setup.tradePlan.rr,
        stopDistance: setup.tradePlan.stopDistance || Math.abs(setup.tradePlan.entry - setup.tradePlan.stopLoss),
        tpDistance: setup.tradePlan.tpDistance || Math.abs(setup.tradePlan.takeProfit - setup.tradePlan.entry),
        timeStopBars: setup.tradePlan.timeStopBars || 100,
        bracketLevelsVersion: setup.tradePlan.bracketLevelsVersion || '1.0.0',
        priceRounding: setup.tradePlan.priceRounding || { priceDecimals: 2, rrDecimals: 1 },
      },
      bars: setup.bars,
      visualSpec: setup.visualSpec,
    };
    setSelectedSetup(fullSetup);
    setChartOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            Live
          </Badge>
          {lastScanned && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Updated {new Date(lastScanned).toLocaleTimeString()}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">Active Pattern Screener</h1>
        <p className="text-muted-foreground">
          Real-time pattern detection across {instrumentsScanned} {ASSET_TYPE_LABELS[assetType].toLowerCase()} instruments
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{patterns.length}</span>
            <span className="text-muted-foreground">patterns found</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={assetType} onValueChange={(v) => handleAssetTypeChange(v as AssetType)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Asset Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fx">🌍 Forex</SelectItem>
              <SelectItem value="crypto">₿ Crypto</SelectItem>
              <SelectItem value="stocks">📈 Stocks</SelectItem>
              <SelectItem value="commodities">🛢️ Commodities</SelectItem>
            </SelectContent>
          </Select>

          <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={patternFilter} onValueChange={setPatternFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pattern Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patterns</SelectItem>
              {uniquePatterns.map(p => (
                <SelectItem key={p} value={p}>
                  {patterns.find(pat => pat.patternId === p)?.patternName || p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchLivePatterns(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-8 text-center mb-6">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchLivePatterns()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      )}

      {/* Empty state */}
      {!error && sortedPatterns.length === 0 && (
        <Card className="p-12 text-center">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Patterns Found</h3>
          <p className="text-muted-foreground mb-4">
            {patterns.length > 0 
              ? 'Try adjusting your filters to see more results.'
              : 'No active patterns detected at the moment. Check back soon!'}
          </p>
          {patterns.length > 0 && (
            <Button variant="outline" onClick={() => { setDirectionFilter('all'); setPatternFilter('all'); }}>
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* Patterns Grid */}
      {sortedPatterns.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPatterns.map((setup, idx) => {
            const isHighlighted = highlightSymbol && setup.instrument.includes(highlightSymbol);
            
            return (
              <Card 
                key={`${setup.instrument}-${setup.patternId}-${idx}`}
                className={`overflow-hidden hover:border-primary/50 transition-all group cursor-pointer ${
                  isHighlighted ? 'ring-2 ring-primary border-primary' : ''
                }`}
                onClick={() => handleOpenChart(setup)}
              >
                <div className="h-40 bg-card relative">
                  <ThumbnailChart
                    bars={setup.bars}
                    visualSpec={setup.visualSpec}
                    height={160}
                    instrument={setup.instrument}
                  />
                  {isHighlighted && (
                    <Badge className="absolute top-2 right-2 bg-primary">
                      Selected
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {setup.instrument.replace('-USD', '').replace('=X', '')}
                    </span>
                    <Badge 
                      variant={setup.direction === 'long' ? 'default' : 'secondary'}
                      className={`${
                        setup.direction === 'long' 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' 
                          : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                      }`}
                    >
                      {setup.direction === 'long' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {setup.direction}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {setup.patternName}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/50 rounded px-2 py-1.5 text-center">
                      <div className="text-muted-foreground mb-0.5">Entry</div>
                      <div className="font-medium">${setup.tradePlan.entry.toFixed(2)}</div>
                    </div>
                    <div className="bg-muted/50 rounded px-2 py-1.5 text-center">
                      <div className="text-muted-foreground mb-0.5">R:R</div>
                      <div className="font-medium">{setup.tradePlan.rr.toFixed(1)}</div>
                    </div>
                    <div className="bg-muted/50 rounded px-2 py-1.5 text-center">
                      <div className="text-muted-foreground mb-0.5">Signal</div>
                      <div className="font-medium">{formatSignalAgeSimple(setup.signalTs)}</div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 group-hover:bg-primary/10"
                  >
                    View Full Chart
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CTA Section */}
      <Card className="mt-12 p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Want Deeper Analysis?</h3>
            <p className="text-muted-foreground">
              Run Setup Finder to get historical performance data, quality scores, and more patterns.
            </p>
          </div>
          <Link to="/projects/setup-finder/new">
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
              <Target className="h-5 w-5 mr-2" />
              Run Setup Finder
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="mt-8 flex items-start gap-3 text-sm text-muted-foreground">
        <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Disclaimer:</strong> Patterns shown are for educational purposes only. 
          Past pattern performance does not guarantee future results. Always conduct your own research.
        </p>
      </div>

      {/* Full Chart Viewer */}
      {selectedSetup && (
        <FullChartViewer
          open={chartOpen}
          onOpenChange={setChartOpen}
          setup={selectedSetup}
          onCopyPlan={() => {
            navigator.clipboard.writeText(
              `${selectedSetup.instrument} ${selectedSetup.patternName}\nEntry: ${selectedSetup.tradePlan.entry}\nSL: ${selectedSetup.tradePlan.stopLoss}\nTP: ${selectedSetup.tradePlan.takeProfit}\nR:R ${selectedSetup.tradePlan.rr.toFixed(1)}`
            );
          }}
          onCreateAlert={() => {
            window.location.href = `/members/alerts?symbol=${selectedSetup.instrument}&pattern=${selectedSetup.patternId}`;
          }}
          isCreatingAlert={false}
        />
      )}
    </div>
  );
}
