import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, TrendingUp, TrendingDown, Zap, RefreshCw, 
  ChevronUp, ChevronDown, ArrowUpDown, Clock
} from 'lucide-react';
import { formatSignalAgeSimple } from '@/utils/formatSignalAge';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LiveSetup {
  instrument: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  signalTs: string;
  quality: { score: string; reasons: string[] };
  tradePlan: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rr: number;
  };
  bars: any[];
  visualSpec: any;
}

interface ScanResult {
  success: boolean;
  patterns: LiveSetup[];
  scannedAt: string;
  instrumentsScanned: number;
  assetType: string;
  marketOpen?: boolean;
  marketStatus?: 'open' | 'closed';
}

type AssetType = 'fx' | 'crypto' | 'stocks' | 'commodities';
type SortKey = 'instrument' | 'direction' | 'rr' | 'signal';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  fx: 'Forex',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
};


function cleanInstrumentName(instrument: string): string {
  return instrument.replace('-USD', '').replace('=X', '').replace('/USD', '').replace('=F', '');
}

// Full names for commodities and other assets
const INSTRUMENT_FULL_NAMES: Record<string, string> = {
  // Commodities - Metals
  'GC': 'Gold',
  'SI': 'Silver',
  'HG': 'Copper',
  'PL': 'Platinum',
  'PA': 'Palladium',
  // Commodities - Energy
  'CL': 'Crude Oil (WTI)',
  'NG': 'Natural Gas',
  'RB': 'Gasoline',
  'HO': 'Heating Oil',
  // Commodities - Agriculture
  'ZC': 'Corn',
  'ZW': 'Wheat',
  'ZS': 'Soybeans',
  'KC': 'Coffee',
  'SB': 'Sugar',
  'CC': 'Cocoa',
  'CT': 'Cotton',
  'ZO': 'Oats',
  'ZR': 'Rice',
  'ZL': 'Soybean Oil',
  // Commodities - Livestock
  'LE': 'Live Cattle',
  'HE': 'Lean Hogs',
  'GF': 'Feeder Cattle',
  // Crypto (popular ones)
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'BNB': 'Binance Coin',
  'XRP': 'Ripple',
  'ADA': 'Cardano',
  'AVAX': 'Avalanche',
  'DOGE': 'Dogecoin',
  'LINK': 'Chainlink',
  'MATIC': 'Polygon',
  'DOT': 'Polkadot',
  'SHIB': 'Shiba Inu',
  'LTC': 'Litecoin',
  'UNI': 'Uniswap',
  'ATOM': 'Cosmos',
  'XLM': 'Stellar',
  'NEAR': 'NEAR Protocol',
  'APT': 'Aptos',
  'ARB': 'Arbitrum',
  'OP': 'Optimism',
  'FIL': 'Filecoin',
  'INJ': 'Injective',
  'AAVE': 'Aave',
  'MKR': 'Maker',
  'SAND': 'The Sandbox',
};

function getInstrumentFullName(instrument: string): string | null {
  const ticker = cleanInstrumentName(instrument);
  return INSTRUMENT_FULL_NAMES[ticker] || null;
}


export default function PatternScreenerTable() {
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<AssetType>('fx');
  const [sortKey, setSortKey] = useState<SortKey>('signal');
  const [sortAsc, setSortAsc] = useState(false);
  const [marketOpen, setMarketOpen] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchLivePatterns = async (isRefresh = false, selectedAssetType?: AssetType) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    const typeToFetch = selectedAssetType ?? assetType;
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke<ScanResult>('scan-live-patterns', {
        body: { assetType: typeToFetch, limit: 30 },
      });
      
      if (fnError) throw fnError;
      
      if (data?.success && data.patterns) {
        setPatterns(data.patterns);
        setLastScanned(data.scannedAt);
        setMarketOpen(data.marketOpen ?? true);
      } else {
        setPatterns([]);
        setMarketOpen(data?.marketOpen ?? true);
      }
    } catch (err: any) {
      console.error('[PatternScreenerTable] Error:', err);
      setError('Failed to load patterns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLivePatterns(false, assetType);
  }, [assetType]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Group by pattern, then sort within groups
  const groupedPatterns = useMemo(() => {
    const grouped = patterns.reduce((acc, setup) => {
      const key = setup.patternName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(setup);
      return acc;
    }, {} as Record<string, LiveSetup[]>);

    // Sort each group internally
    Object.values(grouped).forEach(group => {
      group.sort((a, b) => {
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
          default:
            cmp = 0;
        }
        return sortAsc ? cmp : -cmp;
      });
    });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [patterns, sortKey, sortAsc]);

  const handleRowClick = (setup: LiveSetup) => {
    navigate(`/patterns/live?highlight=${encodeURIComponent(setup.instrument)}`);
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortAsc ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  if (loading) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Zap className="h-3 w-3 mr-1" />
                  Active Pattern Screener
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">Live Pattern Signals</h2>
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
              {!marketOpen && assetType !== 'crypto' && (
                <Badge variant="secondary" className="text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Market Closed
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {lastScanned ? `Updated ${new Date(lastScanned).toLocaleTimeString()}` : 'Just now'}
              </span>
            </div>
            <h2 className="text-2xl font-bold">Active Pattern Screener</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {!marketOpen && assetType !== 'crypto' 
                ? 'Showing patterns from last trading session (Friday close)'
                : 'Click any row to view the full chart'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchLivePatterns(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/patterns/live">
              <Button variant="outline" size="sm">
                Full Screener
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchLivePatterns(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {!error && groupedPatterns.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No patterns detected for {ASSET_TYPE_LABELS[assetType]} at this time.
              {!marketOpen && assetType !== 'crypto' && ' (Market currently closed)'}
            </p>
            <Button variant="outline" onClick={() => fetchLivePatterns(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}

        {!error && groupedPatterns.length > 0 && (
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
                    <TableHead 
                      className="cursor-pointer select-none text-right whitespace-nowrap"
                      onClick={() => handleSort('rr')}
                    >
                      <div className="flex items-center justify-end">
                        R:R
                        <SortIcon columnKey="rr" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      TF
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
                        <TableCell colSpan={6} className="py-2">
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
                        // Fresh if less than 2 days old
                        const isFresh = signalAge.endsWith('m') || signalAge.endsWith('h') || signalAge === '1d';
                        
                        return (
                          <TableRow 
                            key={`${setup.instrument}-${setup.patternId}-${idx}`}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleRowClick(setup)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                  {cleanInstrumentName(setup.instrument).slice(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground">
                                    {cleanInstrumentName(setup.instrument)}
                                  </span>
                                  {getInstrumentFullName(setup.instrument) && (
                                    <span className="text-xs text-muted-foreground">
                                      {getInstrumentFullName(setup.instrument)}
                                    </span>
                                  )}
                                </div>
                              </div>
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
                              <span className={`font-semibold ${
                                setup.tradePlan.rr >= 2 ? 'text-green-500' : 'text-muted-foreground'
                              }`}>
                                {setup.tradePlan.rr.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs font-mono">
                                D
                              </Badge>
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

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            For educational purposes only. Past patterns don't guarantee future results.
          </p>
          <Link to="/patterns/live">
            <Button variant="link" size="sm" className="text-primary">
              View full screener
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
