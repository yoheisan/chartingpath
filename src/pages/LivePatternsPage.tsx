import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Zap, RefreshCw, TrendingUp, TrendingDown, ArrowRight, 
  Filter, Clock, BarChart3, Target, Shield, Lock, Crown, Info, List, ChevronUp, ChevronDown,
  LayoutGrid, ArrowUpDown, Search
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import FullChartViewer from '@/components/charts/FullChartViewer';
import { CompressedBar, VisualSpec, PatternQuality, SetupWithVisuals } from '@/types/VisualSpec';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatSignalAgeSimple } from '@/utils/formatSignalAge';
import { useScreenerCaps, PATTERN_DISPLAY_NAMES } from '@/hooks/useScreenerCaps';
import { withTimeout } from '@/utils/withTimeout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import InstrumentLogo from '@/components/charts/InstrumentLogo';
import UniversalSymbolSearch from '@/components/charts/UniversalSymbolSearch';

// Full list of instruments available per asset class
const AVAILABLE_INSTRUMENTS: Record<string, { symbol: string; name: string }[]> = {
  fx: [
    { symbol: 'EURUSD', name: 'Euro / US Dollar' },
    { symbol: 'GBPUSD', name: 'British Pound / US Dollar' },
    { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen' },
    { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar' },
    { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar' },
    { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar' },
    { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc' },
    { symbol: 'EURGBP', name: 'Euro / British Pound' },
    { symbol: 'EURJPY', name: 'Euro / Japanese Yen' },
    { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen' },
    { symbol: 'AUDJPY', name: 'Australian Dollar / Japanese Yen' },
    { symbol: 'EURAUD', name: 'Euro / Australian Dollar' },
    { symbol: 'EURCHF', name: 'Euro / Swiss Franc' },
    { symbol: 'AUDNZD', name: 'Australian Dollar / New Zealand Dollar' },
    { symbol: 'CADJPY', name: 'Canadian Dollar / Japanese Yen' },
    { symbol: 'NZDJPY', name: 'New Zealand Dollar / Japanese Yen' },
    { symbol: 'GBPAUD', name: 'British Pound / Australian Dollar' },
    { symbol: 'GBPCAD', name: 'British Pound / Canadian Dollar' },
    { symbol: 'AUDCAD', name: 'Australian Dollar / Canadian Dollar' },
    { symbol: 'EURCAD', name: 'Euro / Canadian Dollar' },
    { symbol: 'CHFJPY', name: 'Swiss Franc / Japanese Yen' },
    { symbol: 'GBPCHF', name: 'British Pound / Swiss Franc' },
    { symbol: 'EURNZD', name: 'Euro / New Zealand Dollar' },
    { symbol: 'CADCHF', name: 'Canadian Dollar / Swiss Franc' },
    { symbol: 'AUDCHF', name: 'Australian Dollar / Swiss Franc' },
  ],
  crypto: [
    { symbol: 'BTC/USD', name: 'Bitcoin' },
    { symbol: 'ETH/USD', name: 'Ethereum' },
    { symbol: 'SOL/USD', name: 'Solana' },
    { symbol: 'BNB/USD', name: 'Binance Coin' },
    { symbol: 'XRP/USD', name: 'Ripple' },
    { symbol: 'ADA/USD', name: 'Cardano' },
    { symbol: 'AVAX/USD', name: 'Avalanche' },
    { symbol: 'DOGE/USD', name: 'Dogecoin' },
    { symbol: 'LINK/USD', name: 'Chainlink' },
    { symbol: 'MATIC/USD', name: 'Polygon' },
    { symbol: 'DOT/USD', name: 'Polkadot' },
    { symbol: 'SHIB/USD', name: 'Shiba Inu' },
    { symbol: 'LTC/USD', name: 'Litecoin' },
    { symbol: 'UNI/USD', name: 'Uniswap' },
    { symbol: 'ATOM/USD', name: 'Cosmos' },
    { symbol: 'XLM/USD', name: 'Stellar' },
    { symbol: 'NEAR/USD', name: 'NEAR Protocol' },
    { symbol: 'APT/USD', name: 'Aptos' },
    { symbol: 'ARB/USD', name: 'Arbitrum' },
    { symbol: 'OP/USD', name: 'Optimism' },
    { symbol: 'FIL/USD', name: 'Filecoin' },
    { symbol: 'INJ/USD', name: 'Injective' },
    { symbol: 'AAVE/USD', name: 'Aave' },
    { symbol: 'MKR/USD', name: 'Maker' },
    { symbol: 'SAND/USD', name: 'The Sandbox' },
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'UNH', name: 'UnitedHealth Group' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'BAC', name: 'Bank of America Corp.' },
    { symbol: 'MA', name: 'Mastercard Inc.' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'ADBE', name: 'Adobe Inc.' },
    { symbol: 'CRM', name: 'Salesforce Inc.' },
    { symbol: 'PFE', name: 'Pfizer Inc.' },
    { symbol: 'KO', name: 'Coca-Cola Co.' },
    { symbol: 'PEP', name: 'PepsiCo Inc.' },
    { symbol: 'MRK', name: 'Merck & Co.' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
  ],
  commodities: [
    { symbol: 'GC', name: 'Gold' },
    { symbol: 'SI', name: 'Silver' },
    { symbol: 'CL', name: 'Crude Oil (WTI)' },
    { symbol: 'NG', name: 'Natural Gas' },
    { symbol: 'HG', name: 'Copper' },
    { symbol: 'PL', name: 'Platinum' },
    { symbol: 'PA', name: 'Palladium' },
    { symbol: 'ZC', name: 'Corn' },
    { symbol: 'ZW', name: 'Wheat' },
    { symbol: 'ZS', name: 'Soybeans' },
    { symbol: 'KC', name: 'Coffee' },
    { symbol: 'SB', name: 'Sugar' },
    { symbol: 'CC', name: 'Cocoa' },
    { symbol: 'CT', name: 'Cotton' },
    { symbol: 'LE', name: 'Live Cattle' },
    { symbol: 'HE', name: 'Lean Hogs' },
    { symbol: 'GF', name: 'Feeder Cattle' },
    { symbol: 'ZO', name: 'Oats' },
    { symbol: 'ZR', name: 'Rice' },
    { symbol: 'ZL', name: 'Soybean Oil' },
    { symbol: 'RB', name: 'Gasoline' },
    { symbol: 'HO', name: 'Heating Oil' },
    { symbol: 'BZ', name: 'Brent Crude' },
    { symbol: 'ALI', name: 'Aluminum' },
    { symbol: 'ZN', name: 'US 10-Year Note' },
  ],
};

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
  totalInUniverse?: number;
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
  const navigate = useNavigate();
  
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [instrumentsScanned, setInstrumentsScanned] = useState(0);
  const [totalInUniverse, setTotalInUniverse] = useState(0);
  
  // Filters - use detected type from highlight or default to 'fx'
  const [assetType, setAssetType] = useState<AssetType>(initialAssetType);
  const [directionFilter, setDirectionFilter] = useState<'all' | 'long' | 'short'>('all');
  const [patternFilter, setPatternFilter] = useState<string>('all');
  const [showInstrumentList, setShowInstrumentList] = useState(false);
  
  // View mode toggle: 'list' (table) or 'panel' (cards)
  const [viewMode, setViewMode] = useState<'list' | 'panel'>('panel');
  
  // Sorting for list view
  type SortKey = 'instrument' | 'direction' | 'rr' | 'signal';
  const [sortKey, setSortKey] = useState<SortKey>('signal');
  const [sortAsc, setSortAsc] = useState(true);
  
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
      console.info('[LivePatternsPage] Fetching patterns', {
        assetType: typeToFetch,
        maxTickers: caps.maxTickersPerClass,
        allowedPatterns: caps.allowedPatterns?.length,
        isRefresh,
      });

      // No timeout wrapper needed - edge function now uses fast DB-first path
      // which returns in <1s from cached live_pattern_detections table
      const { data, error: fnError } = await supabase.functions.invoke<ScanResult>('scan-live-patterns', {
        body: {
          assetType: typeToFetch,
          limit: 50,
          maxTickers: caps.maxTickersPerClass,
          allowedPatterns: caps.allowedPatterns,
        },
      });
      
      if (fnError) throw fnError;
      
      if (data?.patterns) {
        setPatterns(data.patterns);
        setLastScanned(data.scannedAt);
        setInstrumentsScanned(data.instrumentsScanned);
        setTotalInUniverse(data.totalInUniverse || data.instrumentsScanned);
      } else {
        // No patterns found but not an error - show empty state
        setPatterns([]);
        setLastScanned(new Date().toISOString());
      }
    } catch (err: any) {
      console.error('[LivePatternsPage] Error:', err);
      setError('Failed to load patterns. Please try again.');
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

  // Sorting logic for list view
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Sort patterns (highlight to top, then by selected key)
  const sortedPatterns = useMemo(() => {
    const sorted = [...filteredPatterns].sort((a, b) => {
      // Always prioritize highlighted symbol
      if (highlightSymbol) {
        if (a.instrument.includes(highlightSymbol)) return -1;
        if (b.instrument.includes(highlightSymbol)) return 1;
      }
      
      // Then apply user-selected sort (for list view)
      if (viewMode === 'list') {
        let cmp = 0;
        switch (sortKey) {
          case 'instrument':
            cmp = a.instrument.localeCompare(b.instrument);
            break;
          case 'direction':
            cmp = a.direction.localeCompare(b.direction);
            break;
          case 'rr':
            cmp = a.tradePlan.rr - b.tradePlan.rr;
            break;
          case 'signal':
            cmp = new Date(b.signalTs).getTime() - new Date(a.signalTs).getTime();
            break;
        }
        return sortAsc ? cmp : -cmp;
      }
      return 0;
    });
    return sorted;
  }, [filteredPatterns, highlightSymbol, viewMode, sortKey, sortAsc]);

  // Group patterns by pattern name for list view (same as homepage)
  const groupedPatterns = useMemo(() => {
    const groups = new Map<string, LiveSetup[]>();
    sortedPatterns.forEach(setup => {
      const name = setup.patternName;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push(setup);
    });
    return Array.from(groups.entries());
  }, [sortedPatterns]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortAsc ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

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
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Active Pattern Screener</h1>
          <UniversalSymbolSearch 
            onSelect={(symbol) => navigate(`/study/${encodeURIComponent(symbol)}`)}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Search className="h-4 w-4" />
                Study Ticker
              </Button>
            }
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm p-3">
                <p className="font-medium mb-2">How This Works</p>
                <p className="text-sm mb-2">
                  We analyze {totalInUniverse || instrumentsScanned} {ASSET_TYPE_LABELS[assetType].toLowerCase()} instruments 
                  for chart patterns using daily timeframe data.
                  {instrumentsScanned < (totalInUniverse || 0) && (
                    <span className="block mt-1 text-xs text-muted-foreground">
                      Your plan has access to {instrumentsScanned} of these instruments.
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Only instruments where an active pattern is detected are displayed below. 
                  No instrument shown means no pattern setup was found in the current scan.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-muted-foreground">
          Analyzing {totalInUniverse || instrumentsScanned} {ASSET_TYPE_LABELS[assetType].toLowerCase()} instruments • 
          Showing {patterns.length} with active patterns
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
          
          {/* View Toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v) => v && setViewMode(v as 'list' | 'panel')}
            className="border rounded-md p-0.5"
          >
            <ToggleGroupItem value="list" aria-label="List view" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="panel" aria-label="Panel view" className="h-8 w-8 p-0">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
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

      {/* Collapsible instrument list */}
      <Collapsible open={showInstrumentList} onOpenChange={setShowInstrumentList}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <List className="h-4 w-4 mr-2" />
            View all {totalInUniverse || instrumentsScanned || AVAILABLE_INSTRUMENTS[assetType]?.length || 25} {ASSET_TYPE_LABELS[assetType].toLowerCase()} instruments we analyze
            {showInstrumentList ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mb-6 p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground mb-3">
              The following {ASSET_TYPE_LABELS[assetType].toLowerCase()} instruments are scanned for chart patterns. 
              Only those with active pattern setups appear below.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {AVAILABLE_INSTRUMENTS[assetType]?.map(({ symbol, name }) => (
                <div 
                  key={symbol}
                  className="flex items-center gap-2 text-sm p-2 rounded bg-background/50 border border-border/50"
                >
                  <span className="font-mono font-medium text-foreground">{symbol}</span>
                  <span className="text-muted-foreground text-xs truncate">{name}</span>
                </div>
              ))}
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>

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

      {/* Patterns - List View */}
      {sortedPatterns.length > 0 && viewMode === 'list' && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort('instrument')}
                  >
                    <div className="flex items-center">
                      Symbol
                      <SortIcon columnKey="instrument" />
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Pattern</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort('direction')}
                  >
                    <div className="flex items-center">
                      Signal
                      <SortIcon columnKey="direction" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-end gap-1 cursor-help">
                            Price
                            <Info className="h-3 w-3 opacity-50" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">Previous session close price. Daily data only.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-end gap-1 cursor-help">
                            Chg %
                            <Info className="h-3 w-3 opacity-50" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">Change from prior session's close.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none text-right whitespace-nowrap"
                    onClick={() => handleSort('rr')}
                  >
                    <div className="flex items-center justify-end">
                      R:R
                      <SortIcon columnKey="rr" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none text-right whitespace-nowrap"
                    onClick={() => handleSort('signal')}
                  >
                    <div className="flex items-center justify-end">
                      Age
                      <SortIcon columnKey="signal" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedPatterns.map(([patternName, setups]) => (
                  <>
                    {/* Pattern Group Header */}
                    <TableRow key={`header-${patternName}`} className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={7} className="py-2">
                        <span className="font-semibold text-sm">{patternName}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {setups.length}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {/* Pattern Rows */}
                    {setups.map((setup, idx) => {
                      const isLong = setup.direction === 'long';
                      const signalAge = formatSignalAgeSimple(setup.signalTs);
                      const isFresh = signalAge.endsWith('m') || signalAge.endsWith('h') || signalAge === '1d';
                      const isHighlighted = highlightSymbol && setup.instrument.includes(highlightSymbol);
                      
                      return (
                        <TableRow 
                          key={`${setup.instrument}-${setup.patternId}-${idx}`}
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                            isHighlighted ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => handleOpenChart(setup)}
                        >
                          <TableCell>
                            <InstrumentLogo instrument={setup.instrument} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {setup.patternName}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={`font-medium ${
                                isLong 
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' 
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                              }`}
                            >
                              {isLong ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {isLong ? 'Long' : 'Short'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-sm">
                              {setup.currentPrice != null 
                                ? setup.currentPrice.toLocaleString(undefined, { 
                                    minimumFractionDigits: setup.currentPrice < 10 ? 4 : 2,
                                    maximumFractionDigits: setup.currentPrice < 10 ? 4 : 2
                                  })
                                : setup.tradePlan.entry.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {setup.changePercent != null ? (
                              <span className={`font-mono text-sm font-medium ${
                                setup.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {setup.changePercent >= 0 ? '+' : ''}{setup.changePercent.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold ${
                              setup.tradePlan.rr >= 2 ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {setup.tradePlan.rr.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-xs ${
                              isFresh ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {signalAge}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Patterns - Panel View (Cards) */}
      {sortedPatterns.length > 0 && viewMode === 'panel' && (
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
