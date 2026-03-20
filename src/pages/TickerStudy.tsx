import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, Search, TrendingUp, TrendingDown, Target, Shield, 
  Clock, BarChart3, List, CalendarDays, CheckCircle, XCircle, Timer,
  ExternalLink, ChevronDown, ChevronUp, Filter, X, ChevronRight, Play,
  Eye, EyeOff
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { setViewContext } from '@/lib/copilotEvents';
import InstrumentLogo from '@/components/charts/InstrumentLogo';
import UniversalSymbolSearch from '@/components/charts/UniversalSymbolSearch';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import StudyChart, { ChartMarker } from '@/components/charts/StudyChart';
import type { HistoricalPatternOverlay } from '@/components/charts/PatternOverlayRenderer';
import FullChartViewer from '@/components/charts/FullChartViewer';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { TimeframeSelector, useStudyTimeframes, STUDY_TIMEFRAMES } from '@/components/charts/TimeframeSelector';
import { CompressedBar, VisualSpec, SetupWithVisuals } from '@/types/VisualSpec';
import { PATTERN_DISPLAY_NAMES } from '@/hooks/useScreenerCaps';
import { getChartDataLimits, Timeframe } from '@/config/dataCoverageContract';
import { format, formatDistanceToNow } from 'date-fns';
import { useTradingCopilotContext } from '@/components/copilot';

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

// Active Patterns Accordion Component
interface ActivePatternsAccordionProps {
  livePatterns: LivePattern[];
  onSelectPattern: (pattern: LivePattern) => void;
  timeframeLabel: string;
}

function ActivePatternsAccordion({ livePatterns, onSelectPattern, timeframeLabel }: ActivePatternsAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();

  return (
    <Card className="border-primary/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <CardTitle className="text-lg">
                  {t('tickerStudy.activePatterns', { count: livePatterns.length })}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {timeframeLabel}
                </Badge>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {livePatterns.map((pattern) => (
                <Card 
                  key={pattern.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onSelectPattern(pattern)}
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
                      <GradeBadge grade={pattern.quality_score} variant="pill" size="sm" showTooltip={false} />
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
                        <p className="text-muted-foreground">{t('tickerStudy.entry')}</p>
                        <p className="font-medium">${pattern.entry_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('tickerStudy.target')}</p>
                        <p className="font-medium text-green-500">${pattern.take_profit_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('tickerStudy.stop')}</p>
                        <p className="font-medium text-red-500">${pattern.stop_loss_price.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function TickerStudy() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [historicalPatterns, setHistoricalPatterns] = useState<HistoricalPattern[]>([]);
  const [livePatterns, setLivePatterns] = useState<LivePattern[]>([]);
  const [priceData, setPriceData] = useState<CompressedBar[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<HistoricalPattern | LivePattern | null>(null);
  
  // Trading Copilot context for chart analysis
  const copilot = useTradingCopilotContext();
  
  // Timeframe selection (paid feature)
  const { allowedTimeframes, isTimeframeAllowed } = useStudyTimeframes();
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1d');
  
  // Multi-select pattern filter
  const [selectedPatternTypes, setSelectedPatternTypes] = useState<string[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [showPatternsOnChart, setShowPatternsOnChart] = useState(true);

  const decodedSymbol = symbol ? decodeURIComponent(symbol) : '';
  const displaySymbol = decodedSymbol.replace('=X', '').replace('=F', '').replace('-USD', '').toUpperCase();

  // Emit view context for Copilot awareness
  useEffect(() => {
    if (!decodedSymbol) return;
    setViewContext({
      page: 'ticker-study',
      instrument: decodedSymbol,
      timeframe: selectedTimeframe,
    });
  }, [decodedSymbol, selectedTimeframe]);

  // Handler for sending chart context to copilot with visual analysis
  const handleSendToCopilot = useCallback((context: string, analysis: import('@/hooks/useChartAnalysis').ChartAnalysisResult) => {
    copilot.openWithAnalysis(context, analysis);
  }, [copilot]);
  
  // Get timeframe label for display
  const timeframeLabel = useMemo(() => {
    return STUDY_TIMEFRAMES.find(tf => tf.value === selectedTimeframe)?.label || 'Daily';
  }, [selectedTimeframe]);

  // Convert selected timeframe to Yahoo interval format
  // 4h/8h are not natively supported by Yahoo — fetch as 1h and aggregate
  const getYahooInterval = useCallback((tf: string) => {
    const mapping: Record<string, string> = {
      '1h': '1h',
      '4h': '1h',  // Fetch 1h, aggregate client-side
      '8h': '1h',  // Fetch 1h, aggregate client-side
      '1d': '1d',
      '1wk': '1wk',
    };
    return mapping[tf] || '1d';
  }, []);

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      setLoading(true);
      setPriceData([]);
      try {
        const normalized = normalizeSymbol(decodedSymbol);
        
        const symbolVariants = [
          decodedSymbol,
          normalized,
          `${normalized}=X`,
          `${normalized}=F`,
          `${normalized}-USD`,
          `${normalized}/USD`,
        ];

        // Fetch historical patterns - filter by timeframe
        const { data: historicalData, error: historicalError } = await supabase
          .from('historical_pattern_occurrences')
          .select('*')
          .in('symbol', symbolVariants)
          .eq('timeframe', selectedTimeframe)
          .eq('validation_status', 'confirmed')
          .order('detected_at', { ascending: false })
          .limit(100);

        if (historicalError) {
          console.error('Error fetching historical patterns:', historicalError);
        }
        
        if (!historicalData || historicalData.length === 0) {
          console.log(`No cached patterns for ${decodedSymbol} on ${selectedTimeframe}, running on-demand detection...`);
          
          try {
            const { data: onDemandData, error: onDemandError } = await supabase.functions.invoke(
              'detect-patterns-ondemand',
              {
                body: {
                  symbol: decodedSymbol,
                  timeframe: selectedTimeframe,
                  lookbackDays: selectedTimeframe === '1h' ? 30 : selectedTimeframe === '4h' ? 60 : 120,
                },
              }
            );
            
            if (onDemandError) {
              console.error('On-demand detection error:', onDemandError);
            } else if (onDemandData?.patterns && Array.isArray(onDemandData.patterns)) {
              console.log(`On-demand detection found ${onDemandData.patterns.length} patterns`);
              
              const mappedOnDemand: HistoricalPattern[] = onDemandData.patterns.map((p: any) => ({
                id: p.id,
                symbol: decodedSymbol,
                asset_type: p.asset_type || (decodedSymbol.includes('-USD') ? 'crypto' : decodedSymbol.includes('=X') ? 'fx' : decodedSymbol.startsWith('^') ? 'index' : 'stock'),
                pattern_id: p.pattern_id,
                pattern_name: p.pattern_name,
                direction: p.direction as 'bullish' | 'bearish',
                timeframe: selectedTimeframe,
                detected_at: p.detected_at,
                pattern_start_date: p.detected_at,
                pattern_end_date: p.detected_at,
                entry_price: p.entry_price,
                stop_loss_price: p.stop_loss_price,
                take_profit_price: p.take_profit_price,
                risk_reward_ratio: p.risk_reward_ratio,
                quality_score: p.quality_score || 'B',
                quality_reasons: p.quality_reasons || [],
                outcome: p.outcome,
                outcome_price: null,
                outcome_date: null,
                outcome_pnl_percent: p.outcome_pnl_percent,
                bars_to_outcome: null,
                visual_spec: p.visual_spec as VisualSpec,
                bars: (p.bars || []).map((b: any) => ({
                  t: b.t || b.date,
                  o: b.o ?? b.open,
                  h: b.h ?? b.high,
                  l: b.l ?? b.low,
                  c: b.c ?? b.close,
                  v: b.v ?? b.volume ?? 0,
                })),
              }));
              setHistoricalPatterns(mappedOnDemand);
            }
          } catch (onDemandErr) {
            console.error('On-demand detection failed:', onDemandErr);
          }
        } else {
          const mappedHistorical: HistoricalPattern[] = historicalData.map((p: any) => ({
            id: p.id,
            symbol: p.symbol,
            asset_type: p.asset_type,
            pattern_id: p.pattern_id,
            pattern_name: p.pattern_name,
            direction: p.direction as 'bullish' | 'bearish',
            timeframe: p.timeframe,
            detected_at: p.detected_at,
            pattern_start_date: p.pattern_start_date,
            pattern_end_date: p.pattern_end_date,
            entry_price: p.entry_price,
            stop_loss_price: p.stop_loss_price,
            take_profit_price: p.take_profit_price,
            risk_reward_ratio: p.risk_reward_ratio,
            quality_score: p.quality_score || 'B',
            quality_reasons: p.quality_reasons || [],
            outcome: p.outcome,
            outcome_price: p.outcome_price,
            outcome_date: p.outcome_date,
            outcome_pnl_percent: p.outcome_pnl_percent,
            bars_to_outcome: p.bars_to_outcome,
            visual_spec: p.visual_spec as VisualSpec,
            bars: (p.bars || []).map((b: any) => ({
              t: b.date || b.t,
              o: b.open ?? b.o,
              h: b.high ?? b.h,
              l: b.low ?? b.l,
              c: b.close ?? b.c,
              v: b.volume ?? b.v ?? 0,
            })),
          }));
          setHistoricalPatterns(mappedHistorical);
        }

        // Fetch live patterns - filter by timeframe
        const { data: liveData, error: liveError } = await supabase
          .from('live_pattern_detections')
          .select('*')
          .in('instrument', symbolVariants)
          .eq('timeframe', selectedTimeframe)
          .eq('status', 'active')
          .order('first_detected_at', { ascending: false });

        if (liveError) {
          console.error('Error fetching live patterns:', liveError);
        } else if (liveData) {
          const mappedLive: LivePattern[] = liveData.map((p: any) => ({
            id: p.id,
            instrument: p.instrument,
            pattern_id: p.pattern_id,
            pattern_name: p.pattern_name,
            direction: p.direction,
            entry_price: p.entry_price,
            stop_loss_price: p.stop_loss_price,
            take_profit_price: p.take_profit_price,
            risk_reward_ratio: p.risk_reward_ratio,
            quality_score: p.quality_score || 'B',
            visual_spec: p.visual_spec as VisualSpec,
            bars: (p.bars || []).map((b: any) => ({
              t: b.date || b.t,
              o: b.open ?? b.o,
              h: b.high ?? b.h,
              l: b.low ?? b.l,
              c: b.close ?? b.c,
              v: b.volume ?? b.v ?? 0,
            })),
            first_detected_at: p.first_detected_at,
            status: p.status,
          }));
          setLivePatterns(mappedLive);
        }

        // Fetch historical price data using centralized DATA_COVERAGE limits
        const chartLimits = getChartDataLimits(selectedTimeframe as Timeframe);
        const { barLimit, minBarsRequired, daysBack } = chartLimits;
        
        const priceSymbols = [decodedSymbol, normalized];
        let pricesData: any[] | null = null;

        for (const sym of priceSymbols) {
          const { data, error } = await supabase
            .from('historical_prices')
            .select('date, open, high, low, close, volume')
            .eq('symbol', sym)
            .eq('timeframe', selectedTimeframe)
            .order('date', { ascending: false })
            .limit(barLimit);

          if (!error && data && data.length > 0) {
            pricesData = data;
            break;
          }
        }

        const hasEnoughData = pricesData && pricesData.length >= minBarsRequired;

        if (hasEnoughData) {
          const bars: CompressedBar[] = pricesData!
            .map((p: any) => ({
              t: new Date(p.date).toISOString(),
              o: Number(p.open),
              h: Number(p.high),
              l: Number(p.low),
              c: Number(p.close),
              v: Number(p.volume || 0),
            }))
            .reverse();
          setPriceData(bars);
        } else {
          const endDate = new Date();
          const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
          const startStr = startDate.toISOString().slice(0, 10);
          const endStr = endDate.toISOString().slice(0, 10);

          const yahooCandidates = Array.from(
            new Set([
              decodedSymbol,
              `${normalized}=X`,
              `${normalized}-USD`,
              `${normalized}=F`,
              normalized,
            ].filter(Boolean))
          );

          for (const yahooSymbol of yahooCandidates) {
            const { data: yfData, error: yfError } = await supabase.functions.invoke(
              'fetch-yahoo-finance',
              {
                body: {
                  symbol: yahooSymbol,
                  startDate: startStr,
                  endDate: endStr,
                  interval: getYahooInterval(selectedTimeframe),
                  includeOhlc: true,
                },
              }
            );

            if (yfError) {
              continue;
            }

            const bars = (yfData as any)?.bars as CompressedBar[] | undefined;
            if (Array.isArray(bars) && bars.length > 0) {
              setPriceData(bars.slice(-barLimit));
              break;
            }

            const idx = (yfData as any)?.index as string[] | undefined;
            const matrix = (yfData as any)?.data as number[][] | undefined;
            if (Array.isArray(idx) && Array.isArray(matrix) && idx.length > 0 && matrix.length > 0) {
              const points = idx
                .map((d, i) => {
                  const ts = new Date(d).getTime();
                  const close = Number(matrix[i]?.[0]);
                  if (!Number.isFinite(ts) || !Number.isFinite(close) || close === 0) return null;
                  return { ts, close };
                })
                .filter((p): p is { ts: number; close: number } => Boolean(p))
                .sort((a, b) => a.ts - b.ts);

              const closeBars: CompressedBar[] = [];
              let prevClose: number | null = null;

              for (const p of points) {
                const iso = new Date(p.ts).toISOString();
                const close = p.close;
                const eps = Math.max(Math.abs(close) * 1e-6, 1e-6);
                const open = prevClose !== null ? prevClose : close - eps;

                closeBars.push({
                  t: iso,
                  o: open,
                  h: Math.max(open, close),
                  l: Math.min(open, close),
                  c: close,
                  v: 0,
                });

                prevClose = close;
              }

              const limitedBars = closeBars.slice(-barLimit);

              if (limitedBars.length > 0) {
                setPriceData(limitedBars);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, selectedTimeframe, getYahooInterval]);

  // Filter patterns based on multi-select and outcome
  const filteredHistoricalPatterns = useMemo(() => {
    let results = historicalPatterns;
    
    if (selectedPatternTypes.length > 0) {
      results = results.filter(p => selectedPatternTypes.includes(p.pattern_id));
    }
    
    if (outcomeFilter !== 'all') {
      results = results.filter(p => p.outcome === outcomeFilter);
    }
    
    return results;
  }, [historicalPatterns, selectedPatternTypes, outcomeFilter]);

  // Calculate stats from FILTERED patterns (dynamic)
  const filteredStats = useMemo(() => {
    const withOutcome = filteredHistoricalPatterns.filter(p => p.outcome && p.outcome !== 'pending');
    const wins = withOutcome.filter(p => p.outcome === 'hit_tp');
    const losses = withOutcome.filter(p => p.outcome === 'hit_sl');
    const totalPnl = withOutcome.reduce((sum, p) => sum + (p.outcome_pnl_percent || 0), 0);
    
    const totalWinPnl = wins.reduce((sum, p) => sum + Math.abs(p.outcome_pnl_percent || 0), 0);
    const totalLossPnl = losses.reduce((sum, p) => sum + Math.abs(p.outcome_pnl_percent || 0), 0);
    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? Infinity : 0;
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, p) => sum + (p.outcome_pnl_percent || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, p) => sum + Math.abs(p.outcome_pnl_percent || 0), 0) / losses.length : 0;
    const winRate = withOutcome.length > 0 ? wins.length / withOutcome.length : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
    
    return {
      totalPatterns: filteredHistoricalPatterns.length,
      activePatterns: livePatterns.length,
      winRate: withOutcome.length > 0 ? (wins.length / withOutcome.length * 100) : 0,
      avgPnl: withOutcome.length > 0 ? totalPnl / withOutcome.length : 0,
      totalPnl,
      wins: wins.length,
      losses: losses.length,
      profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
      expectancy,
      sampleSize: withOutcome.length,
    };
  }, [filteredHistoricalPatterns, livePatterns]);

  // Generate markers for the chart
  const chartMarkers = useMemo(() => {
    if (!showPatternsOnChart) return [];
    
    const markers: ChartMarker[] = [];
    
    // Live patterns
    livePatterns.forEach(p => {
      markers.push({
        time: p.first_detected_at,
        position: p.direction === 'bullish' ? 'belowBar' : 'aboveBar',
        color: p.direction === 'bullish' ? '#22c55e' : '#ef4444',
        shape: p.direction === 'bullish' ? 'arrowUp' : 'arrowDown',
        text: 'Live',
      });
    });

    // Historical patterns (filtered)
    filteredHistoricalPatterns.forEach(p => {
      // Use detected_at or pattern_start_date
      const time = p.detected_at || p.pattern_start_date;
      if (!time) return;

      markers.push({
        time: time,
        position: p.direction === 'bullish' ? 'belowBar' : 'aboveBar',
        color: p.direction === 'bullish' ? '#22c55e' : '#ef4444',
        shape: 'circle',
        text: PATTERN_DISPLAY_NAMES[p.pattern_id] || p.pattern_name,
      });
    });
    
    return markers;
  }, [showPatternsOnChart, livePatterns, filteredHistoricalPatterns]);

  // Convert historical patterns to overlay format for StudyChart
  const historicalPatternOverlays: HistoricalPatternOverlay[] = useMemo(() => {
    if (!showPatternsOnChart) return [];
    return filteredHistoricalPatterns.map(p => ({
      id: p.id,
      patternName: PATTERN_DISPLAY_NAMES[p.pattern_id] || p.pattern_name,
      patternId: p.pattern_id,
      direction: p.direction === 'bullish' ? 'long' as const : 'short' as const,
      detectedAt: p.detected_at,
      entryPrice: p.entry_price,
      stopLossPrice: p.stop_loss_price,
      takeProfitPrice: p.take_profit_price,
      outcome: p.outcome as any,
      outcomePnlPercent: p.outcome_pnl_percent,
      pivots: p.visual_spec?.pivots,
      bars: p.bars,
    }));
  }, [showPatternsOnChart, filteredHistoricalPatterns]);

  // Unique pattern types for filter
  const patternTypes = useMemo(() => {
    const types = new Set(historicalPatterns.map(p => p.pattern_id));
    return Array.from(types);
  }, [historicalPatterns]);

  const handleSymbolSelect = (newSymbol: string, name: string, category: string) => {
    navigate(`/study/${encodeURIComponent(newSymbol)}`);
  };

  const togglePatternType = (patternId: string) => {
    setSelectedPatternTypes(prev => 
      prev.includes(patternId)
        ? prev.filter(id => id !== patternId)
        : [...prev, patternId]
    );
  };

  const clearPatternFilter = () => {
    setSelectedPatternTypes([]);
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
      case 'hit_tp': return t('tickerStudy.targetHit');
      case 'hit_sl': return t('tickerStudy.stopHit');
      case 'timeout': return t('tickerStudy.timeout');
      case 'pending': return t('tickerStudy.pending');
      case 'invalidated': return t('tickerStudy.invalidated');
      default: return t('tickerStudy.unknown');
    }
  };

  if (!symbol) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('tickerStudy.searchTicker')}</CardTitle>
            <p className="text-muted-foreground">
              {t('tickerStudy.searchDescription')}
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <UniversalSymbolSearch 
              onSelect={handleSymbolSelect}
              trigger={
                <Button size="lg" className="gap-2">
                  <Search className="h-5 w-5" />
                  {t('tickerStudy.searchInstruments')}
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
              <p className="text-sm text-muted-foreground">{t('tickerStudy.patternHistoryAnalysis')}</p>
            </div>
          </div>
        </div>
        
        <UniversalSymbolSearch 
          onSelect={handleSymbolSelect}
          trigger={
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              {t('tickerStudy.changeSymbol')}
            </Button>
          }
        />
      </div>

      {/* Price Chart Section with Timeframe Selector */}
      {!loading && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('tickerStudy.priceChart', { timeframe: timeframeLabel, symbol: displaySymbol })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={showPatternsOnChart ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowPatternsOnChart(!showPatternsOnChart)}
                  className="gap-2 h-8"
                >
                  {showPatternsOnChart ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="hidden sm:inline">{t('tickerStudy.patterns', 'Patterns')}</span>
                </Button>
                <TimeframeSelector
                  value={selectedTimeframe}
                  onChange={setSelectedTimeframe}
                  size="sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StudyChart 
              bars={priceData}
              symbol={displaySymbol}
              height={350}
              timeframe={selectedTimeframe}
              onSendToCopilot={handleSendToCopilot}
              chartMarkers={chartMarkers}
              historicalPatterns={historicalPatternOverlays}
            />
          </CardContent>
        </Card>
      )}

      {/* Loading State for Chart */}
      {loading && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('tickerStudy.priceChartLoading', { timeframe: timeframeLabel })}
              </CardTitle>
              <TimeframeSelector
                value={selectedTimeframe}
                onChange={setSelectedTimeframe}
                size="sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      )}


      {/* Active Patterns - Collapsible Accordion */}
      {livePatterns.length > 0 && (
        <ActivePatternsAccordion 
          livePatterns={livePatterns} 
          onSelectPattern={(pattern) => setSelectedPattern(pattern as any)}
          timeframeLabel={timeframeLabel}
        />
      )}

      {/* Performance Metrics */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t('tickerStudy.performanceMetrics')}
              </CardTitle>
              {filteredStats.sampleSize > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('tickerStudy.basedOnTrades', { count: filteredStats.sampleSize })}
                </p>
              )}
            </div>
            
            {/* Filters for immediate feedback */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Multi-select Pattern Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {selectedPatternTypes.length === 0 
                      ? t('tickerStudy.allPatterns') 
                      : t('tickerStudy.selected', { count: selectedPatternTypes.length })}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-64 p-3 bg-popover border border-border shadow-lg z-50" 
                  align="end"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t('tickerStudy.filterByPattern')}</p>
                      {selectedPatternTypes.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={clearPatternFilter}
                        >
                          {t('tickerStudy.clearAll')}
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {patternTypes.map((patternId) => (
                          <div 
                            key={patternId} 
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => togglePatternType(patternId)}
                          >
                            <Checkbox 
                              id={`perf-${patternId}`}
                              checked={selectedPatternTypes.includes(patternId)}
                              onCheckedChange={() => togglePatternType(patternId)}
                            />
                            <label 
                              htmlFor={`perf-${patternId}`} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {PATTERN_DISPLAY_NAMES[patternId] || patternId}
                            </label>
                            <Badge variant="secondary" className="text-[10px]">
                              {historicalPatterns.filter(p => p.pattern_id === patternId).length}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Outcome Filter */}
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder={t('tickerStudy.allOutcomes')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  <SelectItem value="all">{t('tickerStudy.allOutcomes')}</SelectItem>
                  <SelectItem value="hit_tp">{t('tickerStudy.targetHit')}</SelectItem>
                  <SelectItem value="hit_sl">{t('tickerStudy.stopHit')}</SelectItem>
                  <SelectItem value="timeout">{t('tickerStudy.timeout')}</SelectItem>
                  <SelectItem value="pending">{t('tickerStudy.pending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filter Tags */}
          {selectedPatternTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedPatternTypes.map(patternId => (
                <Badge 
                  key={patternId} 
                  variant="secondary" 
                  className="gap-1 cursor-pointer hover:bg-destructive/20"
                  onClick={() => togglePatternType(patternId)}
                >
                  {PATTERN_DISPLAY_NAMES[patternId] || patternId}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold">{filteredStats.totalPatterns}</p>
              <p className="text-xs text-muted-foreground">{t('tickerStudy.patterns')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold text-primary">{filteredStats.activePatterns}</p>
              <p className="text-xs text-muted-foreground">{t('tickerStudy.activeNow')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className={`text-2xl font-bold ${filteredStats.winRate >= 50 ? 'text-green-500' : 'text-amber-500'}`}>
                {filteredStats.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">{t('tickerStudy.winRate')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className={`text-2xl font-bold ${filteredStats.avgPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {filteredStats.avgPnl >= 0 ? '+' : ''}{filteredStats.avgPnl.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">{t('tickerStudy.avgPnl')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className={`text-2xl font-bold ${filteredStats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {filteredStats.totalPnl >= 0 ? '+' : ''}{filteredStats.totalPnl.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">{t('tickerStudy.totalPnl')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className={`text-2xl font-bold ${filteredStats.profitFactor >= 1 ? 'text-green-500' : 'text-red-500'}`}>
                {filteredStats.profitFactor.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{t('tickerStudy.profitFactor')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold text-green-500">{filteredStats.wins}</p>
              <p className="text-xs text-muted-foreground">{t('tickerStudy.wins')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold text-red-500">{filteredStats.losses}</p>
              <p className="text-xs text-muted-foreground">{t('tickerStudy.losses')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Patterns Section */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {t('tickerStudy.historicalPatternOccurrences')}
              <Badge variant="secondary" className="text-xs">
                {timeframeLabel}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('tickerStudy.patternsFound', { count: filteredHistoricalPatterns.length })}
            </p>
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
                    <TableHead>{t('tickerStudy.pattern')}</TableHead>
                    <TableHead className="w-[100px]">{t('tickerStudy.chart')}</TableHead>
                    <TableHead className="w-[90px]">{t('tickerStudy.replay')}</TableHead>
                    <TableHead>{t('tickerStudy.date')}</TableHead>
                    <TableHead className="text-right">{t('tickerStudy.entry')}</TableHead>
                    <TableHead className="text-right">{t('tickerStudy.target')}</TableHead>
                    <TableHead className="text-right">{t('tickerStudy.stop')}</TableHead>
                    <TableHead className="text-center">{t('tickerStudy.rr')}</TableHead>
                    <TableHead className="text-center">{t('tickerStudy.outcome')}</TableHead>
                    <TableHead className="text-right">{t('tickerStudy.pnl')}</TableHead>
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
                          <GradeBadge grade={pattern.quality_score} variant="pill" size="sm" showTooltip={false} className="text-[10px]" />
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPattern(pattern);
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-1.5" />
                          {t('tickerStudy.openChart')}
                        </Button>
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            const setup: SetupWithVisuals = {
                              instrument: displaySymbol,
                              patternId: pattern.pattern_id,
                              patternName: PATTERN_DISPLAY_NAMES[pattern.pattern_id] || pattern.pattern_name,
                              direction: pattern.direction === 'bullish' ? 'long' : 'short',
                              signalTs: pattern.detected_at,
                              quality: {
                                score: pattern.quality_score === 'A' ? 9 : pattern.quality_score === 'B' ? 7 : pattern.quality_score === 'C' ? 5 : 3,
                                grade: (pattern.quality_score || 'B') as 'A' | 'B' | 'C' | 'D' | 'F',
                                confidence: 75,
                                reasons: pattern.quality_reasons || [],
                                warnings: [],
                                tradeable: true,
                              },
                              tradePlan: {
                                entryType: 'market',
                                entry: pattern.entry_price,
                                stopLoss: pattern.stop_loss_price,
                                takeProfit: pattern.take_profit_price,
                                rr: pattern.risk_reward_ratio,
                                stopDistance: Math.abs(pattern.entry_price - pattern.stop_loss_price),
                                tpDistance: Math.abs(pattern.take_profit_price - pattern.entry_price),
                                timeStopBars: 100,
                                bracketLevelsVersion: '1.0',
                                priceRounding: { priceDecimals: 2, rrDecimals: 1 },
                              },
                              bars: pattern.bars,
                              visualSpec: pattern.visual_spec,
                              outcome: pattern.outcome === 'hit_tp' ? 'hit_tp' : pattern.outcome === 'hit_sl' ? 'hit_sl' : pattern.outcome === 'timeout' ? 'timeout' : null,
                              barsToOutcome: pattern.bars_to_outcome,
                            };
                            navigate('/members/dashboard', {
                              state: {
                                playbackPattern: {
                                  occurrenceId: pattern.id,
                                  symbol: displaySymbol,
                                  timeframe: pattern.timeframe || '1d',
                                  patternId: pattern.pattern_id,
                                  patternName: PATTERN_DISPLAY_NAMES[pattern.pattern_id] || pattern.pattern_name,
                                  direction: pattern.direction === 'bullish' ? 'long' : 'short',
                                  setup,
                                  enablePlayback: true,
                                }
                              }
                            });
                          }}
                        >
                          <Play className="h-4 w-4 mr-1.5 fill-current" />
                          {t('tickerStudy.replay')}
                        </Button>
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
              <p className="text-lg font-medium">{t('tickerStudy.noHistoricalPatterns')}</p>
              <p className="text-sm">
                {selectedPatternTypes.length > 0 || outcomeFilter !== 'all' 
                  ? t('tickerStudy.adjustFilters') 
                  : t('tickerStudy.patternsWillPopulate')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Chart Viewer Modal */}
      {selectedPattern && (() => {
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
            onCreateAlert={() => {}}
            isCreatingAlert={false}
          />
        );
      })()}
    </div>
  );
}
