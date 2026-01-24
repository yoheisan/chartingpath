import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, TrendingUp, TrendingDown, Zap, RefreshCw, 
  ChevronUp, ChevronDown, ExternalLink 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CompressedBar, VisualSpec, PatternQuality } from '@/types/VisualSpec';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  };
  bars: CompressedBar[];
  visualSpec: VisualSpec;
}

interface ScanResult {
  success: boolean;
  patterns: LiveSetup[];
  scannedAt: string;
  instrumentsScanned: number;
}

type SortKey = 'instrument' | 'pattern' | 'direction' | 'rr' | 'signal';
type SortDir = 'asc' | 'desc';

function formatSignalAge(signalTs: string): string {
  const signalDate = new Date(signalTs);
  const now = new Date();
  const diffMs = now.getTime() - signalDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function cleanInstrumentName(instrument: string): string {
  return instrument.replace('-USD', '').replace('=X', '').replace('/USD', '');
}

export default function PatternScreenerTable() {
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('signal');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const navigate = useNavigate();

  const fetchLivePatterns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke<ScanResult>('scan-live-patterns', {
        body: {},
      });
      
      if (fnError) throw fnError;
      
      if (data?.success && data.patterns) {
        setPatterns(data.patterns.slice(0, 12)); // Show up to 12 rows
        setLastScanned(data.scannedAt);
      }
    } catch (err: any) {
      console.error('[PatternScreenerTable] Error:', err);
      setError('Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePatterns();
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedPatterns = [...patterns].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'instrument':
        return dir * a.instrument.localeCompare(b.instrument);
      case 'pattern':
        return dir * a.patternName.localeCompare(b.patternName);
      case 'direction':
        return dir * a.direction.localeCompare(b.direction);
      case 'rr':
        return dir * (a.tradePlan.rr - b.tradePlan.rr);
      case 'signal':
        return dir * (new Date(b.signalTs).getTime() - new Date(a.signalTs).getTime());
      default:
        return 0;
    }
  });

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  };

  const handleRowClick = (setup: LiveSetup) => {
    navigate(`/patterns/live?highlight=${setup.instrument}`);
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
                  Pattern Screener
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">Live Pattern Signals</h2>
            </div>
          </div>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || patterns.length === 0) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Zap className="h-3 w-3 mr-1" />
                  Pattern Screener
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">Live Pattern Signals</h2>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'No active patterns detected. Markets may be quiet—check back soon!'}
            </p>
            <Button variant="outline" onClick={fetchLivePatterns}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
              <span className="text-xs text-muted-foreground">
                {lastScanned ? `Updated ${new Date(lastScanned).toLocaleTimeString()}` : 'Just now'}
              </span>
            </div>
            <h2 className="text-2xl font-bold">Pattern Screener</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Click any row to view the full chart and trade plan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchLivePatterns}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Link to="/patterns/live">
              <Button variant="outline" size="sm">
                Full Screener
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
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
                  <TableHead 
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort('pattern')}
                  >
                    <div className="flex items-center">
                      Pattern
                      <SortIcon columnKey="pattern" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort('direction')}
                  >
                    <div className="flex items-center">
                      Signal
                      <SortIcon columnKey="direction" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">Entry</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Stop Loss</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Take Profit</TableHead>
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
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPatterns.map((setup, idx) => {
                  const isLong = setup.direction === 'long';
                  const signalAge = formatSignalAge(setup.signalTs);
                  const isFresh = signalAge.includes('h') || signalAge === 'Just now';
                  
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
                          <span className="font-semibold text-foreground">
                            {cleanInstrumentName(setup.instrument)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
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
                      <TableCell className="text-right font-mono text-sm">
                        {formatPrice(setup.tradePlan.entry)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-500">
                        {formatPrice(setup.tradePlan.stopLoss)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-green-500">
                        {formatPrice(setup.tradePlan.takeProfit)}
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
                      <TableCell>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            For educational purposes only. Past patterns don't guarantee future results.
          </p>
          <Link to="/patterns/live">
            <Button variant="link" size="sm" className="text-primary">
              View all {patterns.length}+ patterns
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
