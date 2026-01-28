import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, Search, TrendingUp, TrendingDown, Target, Shield, 
  Clock, BarChart3, List, CalendarDays, CheckCircle, XCircle, Timer,
  ExternalLink, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import InstrumentLogo from '@/components/charts/InstrumentLogo';
import UniversalSymbolSearch from '@/components/charts/UniversalSymbolSearch';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import FullChartViewer from '@/components/charts/FullChartViewer';
import { CompressedBar, VisualSpec, SetupWithVisuals } from '@/types/VisualSpec';
import { PATTERN_DISPLAY_NAMES } from '@/hooks/useScreenerCaps';
import { format, formatDistanceToNow } from 'date-fns';

interface HistoricalPattern {
  id: string;
  symbol: string;
  asset_type: string;
  pattern_id: string;
  pattern_name: string;
  direction: 'bullish' | 'bearish';
  timeframe: string;
  detected_at: string;
  pattern_start_date: string;
  pattern_end_date: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  quality_score: string;
  quality_reasons: string[];
  outcome: string | null;
  outcome_price: number | null;
  outcome_date: string | null;
  outcome_pnl_percent: number | null;
  bars_to_outcome: number | null;
  visual_spec: VisualSpec;
  bars: CompressedBar[];
}

interface LivePattern {
  id: string;
  instrument: string;
  pattern_id: string;
  pattern_name: string;
  direction: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  quality_score: string;
  visual_spec: VisualSpec;
  bars: CompressedBar[];
  first_detected_at: string;
  status: string;
}

// Normalize symbol for comparison (remove suffixes)
function normalizeSymbol(symbol: string): string {
  return symbol
    .replace('=X', '')
    .replace('=F', '')
    .replace('-USD', '')
    .replace('/USD', '')
    .toUpperCase();
}

// Get Yahoo symbol format
function toYahooSymbol(symbol: string, category: string): string {
  const normalized = normalizeSymbol(symbol);
  switch (category) {
    case 'fx':
      return `${normalized}=X`;
    case 'commodities':
      return `${normalized}=F`;
    case 'crypto':
      return `${normalized}-USD`;
    default:
      return normalized;
  }
}

export default function TickerStudy() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [historicalPatterns, setHistoricalPatterns] = useState<HistoricalPattern[]>([]);
  const [livePatterns, setLivePatterns] = useState<LivePattern[]>([]);
  const [priceData, setPriceData] = useState<CompressedBar[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<HistoricalPattern | LivePattern | null>(null);
  const [patternFilter, setPatternFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [expandedView, setExpandedView] = useState(false);

  const displaySymbol = symbol ? normalizeSymbol(decodeURIComponent(symbol)) : '';
  
  // Fetch historical patterns and price data
  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      setLoading(true);
      const decodedSymbol = decodeURIComponent(symbol);
      const normalized = normalizeSymbol(decodedSymbol);

      try {
        // Fetch historical patterns - try multiple symbol formats
        const symbolVariants = [
          normalized,
          `${normalized}=X`,
          `${normalized}=F`,
          `${normalized}-USD`,
          `${normalized}/USD`,
          decodedSymbol,
        ];

        const { data: historicalData, error: historicalError } = await supabase
          .from('historical_pattern_occurrences')
          .select('*')
          .in('symbol', symbolVariants)
          .order('detected_at', { ascending: false })
          .limit(100);

        if (historicalError) {
          console.error('Error fetching historical patterns:', historicalError);
        } else if (historicalData) {
          // Map database JSON to typed interface
          const mapped: HistoricalPattern[] = historicalData.map((row: any) => ({
            ...row,
            visual_spec: row.visual_spec as VisualSpec,
            bars: row.bars as CompressedBar[],
          }));
          setHistoricalPatterns(mapped);
        }

        // Fetch live patterns
        const { data: liveData, error: liveError } = await supabase
          .from('live_pattern_detections')
          .select('*')
          .in('instrument', symbolVariants)
          .eq('status', 'active')
          .order('first_detected_at', { ascending: false });

        if (liveError) {
          console.error('Error fetching live patterns:', liveError);
        } else if (liveData) {
          const mappedLive: LivePattern[] = liveData.map((row: any) => ({
            ...row,
            visual_spec: row.visual_spec as VisualSpec,
            bars: row.bars as CompressedBar[],
          }));
          setLivePatterns(mappedLive);
        }

        // Fetch historical price data for chart
        const { data: pricesData, error: pricesError } = await supabase
          .from('historical_prices')
          .select('*')
          .in('symbol', symbolVariants)
          .eq('timeframe', '1d')
          .order('date', { ascending: true })
          .limit(500);

        if (pricesError) {
          console.error('Error fetching prices:', pricesError);
        } else if (pricesData) {
          const bars: CompressedBar[] = pricesData.map(p => ({
            t: new Date(p.date).toISOString(),
            o: Number(p.open),
            h: Number(p.high),
            l: Number(p.low),
            c: Number(p.close),
            v: Number(p.volume || 0),
          }));
          setPriceData(bars);
        }
      } catch (err) {
        console.error('Error loading ticker data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  // Filter patterns
  const filteredHistoricalPatterns = useMemo(() => {
    let results = historicalPatterns;
    
    if (patternFilter !== 'all') {
      results = results.filter(p => p.pattern_id === patternFilter);
    }
    
    if (outcomeFilter !== 'all') {
      results = results.filter(p => p.outcome === outcomeFilter);
    }
    
    return results;
  }, [historicalPatterns, patternFilter, outcomeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const withOutcome = historicalPatterns.filter(p => p.outcome && p.outcome !== 'pending');
    const wins = withOutcome.filter(p => p.outcome === 'hit_tp');
    const losses = withOutcome.filter(p => p.outcome === 'hit_sl');
    const totalPnl = withOutcome.reduce((sum, p) => sum + (p.outcome_pnl_percent || 0), 0);
    
    return {
      totalPatterns: historicalPatterns.length,
      activePatterns: livePatterns.length,
      winRate: withOutcome.length > 0 ? (wins.length / withOutcome.length * 100) : 0,
      avgPnl: withOutcome.length > 0 ? totalPnl / withOutcome.length : 0,
      wins: wins.length,
      losses: losses.length,
    };
  }, [historicalPatterns, livePatterns]);

  // Unique pattern types for filter
  const patternTypes = useMemo(() => {
    const types = new Set(historicalPatterns.map(p => p.pattern_id));
    return Array.from(types);
  }, [historicalPatterns]);

  const handleSymbolSelect = (newSymbol: string, name: string, category: string) => {
    navigate(`/study/${encodeURIComponent(newSymbol)}`);
  };

  const getOutcomeIcon = (outcome: string | null) => {
    switch (outcome) {
      case 'hit_tp': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'hit_sl': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout': return <Timer className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getOutcomeLabel = (outcome: string | null) => {
    switch (outcome) {
      case 'hit_tp': return 'Target Hit';
      case 'hit_sl': return 'Stop Hit';
      case 'timeout': return 'Timeout';
      case 'pending': return 'Pending';
      case 'invalidated': return 'Invalidated';
      default: return 'Unknown';
    }
  };

  if (!symbol) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Study a Ticker</CardTitle>
            <p className="text-muted-foreground">
              Search for any instrument to view its historical pattern occurrences
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <UniversalSymbolSearch 
              onSelect={handleSymbolSelect}
              trigger={
                <Button size="lg" className="gap-2">
                  <Search className="h-5 w-5" />
                  Search Instruments
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <InstrumentLogo instrument={displaySymbol} size="lg" showName={false} />
            <div>
              <h1 className="text-2xl font-bold">{displaySymbol}</h1>
              <p className="text-sm text-muted-foreground">Pattern History & Analysis</p>
            </div>
          </div>
        </div>
        
        <UniversalSymbolSearch 
          onSelect={handleSymbolSelect}
          trigger={
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Change Symbol
            </Button>
          }
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.totalPatterns}</p>
            <p className="text-xs text-muted-foreground">Historical Patterns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.activePatterns}</p>
            <p className="text-xs text-muted-foreground">Active Now</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.winRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${stats.avgPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.avgPnl >= 0 ? '+' : ''}{stats.avgPnl.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg P&L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
            <p className="text-xs text-muted-foreground">Losses</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Patterns Section */}
      {livePatterns.length > 0 && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <CardTitle className="text-lg">Active Patterns</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {livePatterns.map((pattern) => (
                <Card 
                  key={pattern.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedPattern(pattern as any)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={pattern.direction === 'bullish' ? 'default' : 'destructive'}>
                        {pattern.direction === 'bullish' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {PATTERN_DISPLAY_NAMES[pattern.pattern_id] || pattern.pattern_name}
                      </Badge>
                      <Badge variant="outline">{pattern.quality_score}</Badge>
                    </div>
                    <div className="h-24">
                      <ThumbnailChart 
                        bars={pattern.bars}
                        visualSpec={pattern.visual_spec}
                        height={96}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Entry</p>
                        <p className="font-medium">${pattern.entry_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-medium text-green-500">${pattern.take_profit_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stop</p>
                        <p className="font-medium text-red-500">${pattern.stop_loss_price.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Patterns Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Historical Pattern Occurrences
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={patternFilter} onValueChange={setPatternFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Patterns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patterns</SelectItem>
                  {patternTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PATTERN_DISPLAY_NAMES[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Outcomes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="hit_tp">Target Hit</SelectItem>
                  <SelectItem value="hit_sl">Stop Hit</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredHistoricalPatterns.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Entry</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Stop</TableHead>
                    <TableHead className="text-center">R:R</TableHead>
                    <TableHead className="text-center">Outcome</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistoricalPatterns.map((pattern) => (
                    <TableRow 
                      key={pattern.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPattern(pattern)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {pattern.direction === 'bullish' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {PATTERN_DISPLAY_NAMES[pattern.pattern_id] || pattern.pattern_name}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {pattern.quality_score}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(pattern.detected_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(pattern.detected_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${pattern.entry_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-500">
                        ${pattern.take_profit_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-500">
                        ${pattern.stop_loss_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {pattern.risk_reward_ratio.toFixed(1)}:1
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {getOutcomeIcon(pattern.outcome)}
                          <span className="text-xs">{getOutcomeLabel(pattern.outcome)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {pattern.outcome_pnl_percent !== null ? (
                          <span className={pattern.outcome_pnl_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {pattern.outcome_pnl_percent >= 0 ? '+' : ''}{pattern.outcome_pnl_percent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Historical Patterns Found</p>
              <p className="text-sm">
                {patternFilter !== 'all' || outcomeFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Pattern history will populate as patterns are detected and resolved'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Chart Viewer Modal */}
      {selectedPattern && (() => {
        // Convert pattern to SetupWithVisuals format
        const setup: SetupWithVisuals = {
          instrument: displaySymbol,
          patternId: selectedPattern.pattern_id,
          patternName: PATTERN_DISPLAY_NAMES[selectedPattern.pattern_id] || selectedPattern.pattern_name,
          direction: selectedPattern.direction === 'bullish' ? 'long' : 'short',
          signalTs: 'detected_at' in selectedPattern ? selectedPattern.detected_at : selectedPattern.first_detected_at,
          quality: {
            score: selectedPattern.quality_score === 'A' ? 9 : selectedPattern.quality_score === 'B' ? 7 : selectedPattern.quality_score === 'C' ? 5 : 3,
            grade: (selectedPattern.quality_score || 'B') as 'A' | 'B' | 'C' | 'D' | 'F',
            confidence: 75,
            reasons: 'quality_reasons' in selectedPattern ? (selectedPattern.quality_reasons || []) : [],
            warnings: [],
            tradeable: true,
          },
          tradePlan: {
            entryType: 'market',
            entry: selectedPattern.entry_price,
            stopLoss: selectedPattern.stop_loss_price,
            takeProfit: selectedPattern.take_profit_price,
            rr: selectedPattern.risk_reward_ratio,
            stopDistance: Math.abs(selectedPattern.entry_price - selectedPattern.stop_loss_price),
            tpDistance: Math.abs(selectedPattern.take_profit_price - selectedPattern.entry_price),
            timeStopBars: 100,
            bracketLevelsVersion: '1.0',
            priceRounding: { priceDecimals: 2, rrDecimals: 1 },
          },
          bars: selectedPattern.bars,
          visualSpec: selectedPattern.visual_spec,
        };
        
        return (
          <FullChartViewer
            open={!!selectedPattern}
            onOpenChange={(open) => !open && setSelectedPattern(null)}
            setup={setup}
            onCopyPlan={() => {
              const plan = `${displaySymbol} ${setup.patternName}\nEntry: $${setup.tradePlan.entry}\nSL: $${setup.tradePlan.stopLoss}\nTP: $${setup.tradePlan.takeProfit}`;
              navigator.clipboard.writeText(plan);
            }}
            onCreateAlert={() => {}}
            isCreatingAlert={false}
          />
        );
      })()}
    </div>
  );
}
