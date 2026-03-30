import { useState, useEffect, useMemo, useRef, Fragment, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Zap, RefreshCw, TrendingUp, TrendingDown, ArrowRight, 
  Filter, Clock, BarChart3, Target, Shield, Lock, Crown, Info, ChevronUp, ChevronDown,
  ArrowUpDown, Search, ArrowUpRight, ArrowDownRight, Minus, Settings2, Activity, FlaskConical, FileText
} from 'lucide-react';
import { DataVersionBadge } from '@/components/platform/DataVersionBadge';
import { cn } from '@/lib/utils';
import { setViewContext } from '@/lib/copilotEvents';
import { useAuth } from '@/contexts/AuthContext';
import { GuestScreenerOverlay } from '@/components/screener/GuestScreenerOverlay';
import WelcomeBackBanner from '@/components/WelcomeBackBanner';
import { PageMeta } from '@/components/PageMeta';
import { useGateEvaluation } from '@/hooks/useGateEvaluation';
import { usePaperTradeEntry } from '@/hooks/usePaperTradeEntry';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

import { GradeBadge } from '@/components/ui/GradeBadge';
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

import FullChartViewer from '@/components/charts/FullChartViewer';
import { CompressedBar, VisualSpec, PatternQuality, SetupWithVisuals } from '@/types/VisualSpec';
import { translatePatternName } from '@/utils/translatePatternName';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatSignalAgeSimple } from '@/utils/formatSignalAge';
import { useScreenerCaps, PATTERN_DISPLAY_NAMES, ALL_PATTERN_IDS } from '@/hooks/useScreenerCaps';
import { SupportedPatternsList } from '@/components/screener/SupportedPatternsList';
import { withTimeout } from '@/utils/withTimeout';
import { usePatternPrefetch, clearPrefetchCache } from '@/hooks/usePatternPrefetch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import InstrumentLogo from '@/components/charts/InstrumentLogo';
import UniversalSymbolSearch from '@/components/charts/UniversalSymbolSearch';
import { TrendIndicatorSettings, loadTrendConfig, TrendIndicatorConfig } from '@/components/TrendIndicatorSettings';
import { 
  ScreenerFilters, 
  ScreenerFiltersState, 
  DEFAULT_SCREENER_FILTERS,
  calculateAgeStats,
  filterByAge,
  recalculateTradePlan,
  DEFAULT_RR,
  calculateProjectedExpectancy,
  filterByFXCategory,
  getFXCategoryCounts
} from '@/components/screener/ScreenerFilters';

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

import { useTranslation } from 'react-i18next';
import type { LiveSetup } from '@/types/screener';
import { GRADE_ORDER as SHARED_GRADE_ORDER, getPatternGrade as sharedGetPatternGrade } from '@/types/screener';
import { filterActiveTradesOnly } from '@/utils/tradeOutcomeFilter';
import { useIsMobile } from '@/hooks/use-mobile';

type AssetType = 'fx' | 'crypto' | 'stocks' | 'commodities' | 'indices' | 'etfs';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  fx: 'Forex',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
  indices: 'Indices',
  etfs: 'ETFs',
};

interface ScanResult {
  success: boolean;
  patterns: LiveSetup[];
  assetType?: AssetType;
  scannedAt: string;
  instrumentsScanned: number;
  totalInUniverse?: number;
}

interface PatternDetailsResponse {
  success: boolean;
  pattern?: LiveSetup;
  error?: string;
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const highlightSymbol = searchParams.get('highlight');
  const openPatternId = searchParams.get('openPattern');
  const urlAssetType = searchParams.get('assetType') as AssetType | null;
  const urlPattern = searchParams.get('pattern');
  const urlTimeframe = searchParams.get('timeframe') as '1h' | '4h' | '8h' | '1d' | '1wk' | null;
  
  // Detect initial asset type: prefer explicit URL param, then detect from highlight symbol, then default to 'fx'
  const initialAssetType: AssetType = urlAssetType || (highlightSymbol ? (detectAssetTypeFromSymbol(highlightSymbol) || 'fx') : 'fx');
  const navigate = useNavigate();
  
  const isMobile = useIsMobile();
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [instrumentsScanned, setInstrumentsScanned] = useState(0);
  const [totalInUniverse, setTotalInUniverse] = useState(0);
  
  // Filters - use detected type from highlight or default to 'fx'
  // Initialize pattern filter and timeframe from Edge Atlas URL params when present
  const [assetType, setAssetType] = useState<AssetType>(initialAssetType);
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '8h' | '1d' | '1wk'>(urlTimeframe || '1h');
  const [filters, setFilters] = useState<ScreenerFiltersState>(() => ({
    ...DEFAULT_SCREENER_FILTERS,
    ...(urlPattern ? { pattern: urlPattern } : {}),
  }));
  const [showInstrumentList, setShowInstrumentList] = useState(false);

  // Sorting for list view
  type SortKey = 'instrument' | 'direction' | 'rr' | 'signal' | 'grade' | 'winRate' | 'expectancy' | 'rot';
  const [sortKey, setSortKey] = useState<SortKey>('signal');
  const [sortAsc, setSortAsc] = useState(true);
  
  // Grade order for sorting (A is highest, F is lowest)
  const GRADE_ORDER: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5 };
  
  // Retry counter for refresh
  const [retryCount, setRetryCount] = useState(0);
  
  // Full chart viewer state
  const [selectedSetup, setSelectedSetup] = useState<SetupWithVisuals | null>(null);
  const [chartOpen, setChartOpen] = useState(false);
  const [loadingChartDetails, setLoadingChartDetails] = useState(false);

  // Emit view context when a setup is selected so the Copilot knows what the user is looking at
  useEffect(() => {
    if (!selectedSetup) return;
    setViewContext({
      page: 'screener',
      instrument: selectedSetup.instrument,
      patternName: selectedSetup.patternName,
      patternId: selectedSetup.patternId,
      timeframe: selectedSetup.visualSpec?.timeframe,
      direction: selectedSetup.direction,
      grade: selectedSetup.quality?.grade,
    });
  }, [selectedSetup]);
  const [creatingAlertInline, setCreatingAlertInline] = useState(false);
  // Prevent stale/overlapping detail fetches from leaving the modal stuck in a loading state.
  const chartDetailsRequestIdRef = useRef(0);
  
  // Hover prefetch hook for instant chart loading
  const { onRowHover, cancelPrefetch, getAndConsume, getCached } = usePatternPrefetch();

  // Gate evaluation hook for live AI gate badges
  const { evaluate, evaluateBatch, getEvaluation, isLoading: isGateLoading } = useGateEvaluation();
  const { tradeWithGateCheck, isSubmitting: isPaperSubmitting } = usePaperTradeEntry();

  // Safety: if details loading somehow never resolves (network hang, aborted request, etc.),
  // ensure the UI doesn't stay stuck forever.
  useEffect(() => {
    if (!loadingChartDetails) return;
    const requestId = chartDetailsRequestIdRef.current;
    const timeoutId = window.setTimeout(() => {
      if (chartDetailsRequestIdRef.current !== requestId) return;
      console.warn('[LivePatternsPage] Details load watchdog fired; clearing loading state', { requestId });
      setLoadingChartDetails(false);
    }, 80_000);

    return () => window.clearTimeout(timeoutId);
  }, [loadingChartDetails]);
  
  // Trend indicator configuration
  const [trendConfig, setTrendConfig] = useState<TrendIndicatorConfig>(() => loadTrendConfig());
  
  // Get tier-based screener caps - but don't block on loading
  const screenerCapsResult = useScreenerCaps();
  const { caps, tier, upgradeIncentive, lockedPatterns, loading: capsLoading } = screenerCapsResult;
  
  // Use full caps immediately for all users - free tier now has full access
  // IMPORTANT: Default to ALL patterns so we don't filter out results during caps loading
  const DEFAULT_CAPS = {
    maxTickersPerClass: 100,
    allowedPatterns: ALL_PATTERN_IDS // Use all patterns to avoid filtering during loading
  };
  const effectiveCaps = capsLoading ? DEFAULT_CAPS : caps;

  const fetchLivePatterns = async (
    isRefresh = false,
    selectedAssetType?: AssetType,
    selectedTimeframe?: string,
    includeDetailsOverride?: boolean,
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    const typeToFetch = selectedAssetType || assetType;
    const tfToFetch = selectedTimeframe || timeframe;
    const includeDetails = includeDetailsOverride ?? false;
    
    // Use the provided caps or fall back to effective caps
    const capsToUse = effectiveCaps;
    
    const invokeScan = async (forceRefresh: boolean, timeoutMs: number, tfToFetch: string) => {
      return await withTimeout(
        supabase.functions.invoke<ScanResult>('scan-live-patterns', {
          body: {
            assetType: typeToFetch,
            timeframe: tfToFetch,
            limit: 50,
            maxTickers: capsToUse.maxTickersPerClass,
            allowedPatterns: capsToUse.allowedPatterns,
            forceRefresh, // only true when we explicitly want a full rescan
            includeDetails,
            topNWithBars: 10, // Embed bars for first 10 patterns for instant chart loading
          },
        }),
        timeoutMs,
        'scan-live-patterns'
      );
    };

    try {
      console.info('[LivePatternsPage] Fetching patterns', {
        assetType: typeToFetch,
        timeframe: tfToFetch,
        maxTickers: capsToUse.maxTickersPerClass,
        allowedPatterns: capsToUse.allowedPatterns?.length,
        isRefresh,
        includeDetails,
      });

      // Fast path returns quickly; forced refresh can be slower.
      // If a forced refresh times out, we fall back to fetching cached results
      // (often the scan completed and persisted, but the response didn't make it back in time).
      let data: ScanResult | null = null;
      let fnError: any = null;
      let lastError: any = null;

      // Retry logic - ALWAYS use cached path for speed; forceRefresh disabled for UI
      // Full scans happen via background cron only to prevent timeout issues
      // Increased timeouts to handle edge function cold starts gracefully
      // First attempt: 40s to handle worst-case cold starts
      // Second attempt: 50s for additional buffer
      const attempts = [
        { forceRefresh: false, timeout: 40_000 },  // Fast path: read from DB cache (generous for cold start)
        { forceRefresh: false, timeout: 50_000 },  // Retry with even longer timeout
      ];

      for (let i = 0; i < attempts.length; i++) {
        const { forceRefresh: fr, timeout } = attempts[i];
        try {
          console.info(`[LivePatternsPage] Attempt ${i + 1}/${attempts.length}`, { forceRefresh: fr, timeout });
          const res = await invokeScan(fr, timeout, tfToFetch);
          data = res.data ?? null;
          fnError = res.error ?? null;
          if (data?.patterns) {
            // Success - if this was a fallback, inform user
            if (isRefresh && i > 0) {
              setError('Refresh completed. Showing the latest results.');
            }
            break;
          }
        } catch (err: any) {
          lastError = err;
          const isTimeout = typeof err?.message === 'string' && err.message.includes('timed out');
          console.warn(`[LivePatternsPage] Attempt ${i + 1} failed`, { isTimeout, message: err.message });
          // Continue to next attempt if we have more
          if (i === attempts.length - 1) {
            throw err; // Last attempt failed
          }
          // Small delay before retry to allow cold start to complete
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      if (fnError) throw fnError;
      
      if (data?.patterns) {
        // Filter out patterns where the trade has already ended (SL/TP breached)
        const activeOnly = filterActiveTradesOnly(data.patterns);
        setPatterns(activeOnly);
        setLastScanned(data.scannedAt);
        setInstrumentsScanned(data.instrumentsScanned);
        setTotalInUniverse(data.totalInUniverse || data.instrumentsScanned);

        // Trigger batch gate evaluations for loaded patterns
        const items = activeOnly.slice(0, 20).map((s: any) => ({
          ticker: s.instrument,
          setup_type: s.patternName,
          timeframe: tfToFetch,
          direction: s.direction,
        }));
        evaluateBatch(items).catch(console.error);
      } else {
        // No patterns found but not an error - show empty state
        setPatterns([]);
        setLastScanned(new Date().toISOString());
      }
    } catch (err: any) {
      console.error('[LivePatternsPage] Error:', err);
      // Provide more specific error message
      const message = err.message?.includes('timed out') 
        ? 'Scan is taking longer than expected. The scanner may be processing a large dataset. Please try again.'
        : 'Failed to load patterns. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssetTypeChange = (newType: AssetType) => {
    setAssetType(newType);
    setPatterns([]); // Clear patterns immediately for visual feedback
    setError(null);  // Clear any previous errors
    clearPrefetchCache(); // Clear prefetch cache on asset type change
    fetchLivePatterns(false, newType, timeframe);
  };

  const handleTimeframeChange = (newTf: '1h' | '4h' | '8h' | '1d' | '1wk') => {
    setTimeframe(newTf);
    setPatterns([]); // Clear patterns immediately for visual feedback
    setError(null);  // Clear any previous errors
    clearPrefetchCache(); // Clear prefetch cache on timeframe change
    fetchLivePatterns(false, assetType, newTf);
  };

  // Track if we've already fetched patterns
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  
  // Fetch immediately on mount - don't wait for auth
  useEffect(() => {
    if (!hasFetchedInitial) {
      setHasFetchedInitial(true);
      fetchLivePatterns();
    }
  }, []);
  
  // Re-fetch if caps change after auth loads (upgraded user scenario)
  useEffect(() => {
    if (!capsLoading && hasFetchedInitial) {
      // Only re-fetch if caps are different from defaults (user is authenticated with better tier)
      const isDifferent = effectiveCaps.maxTickersPerClass !== DEFAULT_CAPS.maxTickersPerClass ||
        effectiveCaps.allowedPatterns.length !== DEFAULT_CAPS.allowedPatterns.length;
      if (isDifferent) {
        console.info('[LivePatternsPage] Caps upgraded, re-fetching');
        fetchLivePatterns();
      }
    }
  }, [capsLoading, tier]);

  // Auto-open chart when navigated with highlight/openPattern params
  const autoOpenTriggeredRef = useRef(false);
  useEffect(() => {
    if (autoOpenTriggeredRef.current || chartOpen) return;
    if (!highlightSymbol && !openPatternId) return;
    // Wait until initial fetch completes
    if (loading) return;

    // Try matching in loaded patterns first
    if (patterns.length > 0) {
      let matchingSetup: LiveSetup | undefined;
      if (openPatternId) {
        matchingSetup = patterns.find(p => p.dbId === openPatternId);
      }
      if (!matchingSetup && highlightSymbol) {
        matchingSetup = patterns.find(p => 
          p.instrument === highlightSymbol || p.instrument.includes(highlightSymbol)
        );
      }
      if (matchingSetup) {
        autoOpenTriggeredRef.current = true;
        handleOpenChart(matchingSetup);
        return;
      }
    }

    // Pattern not in screener results — fetch directly
    if (openPatternId || highlightSymbol) {
      autoOpenTriggeredRef.current = true;
      (async () => {
        try {
          setChartOpen(true);
          setLoadingChartDetails(true);

          // If we have a specific pattern ID, fetch by ID
          if (openPatternId) {
            const res = await withTimeout(
              supabase.functions.invoke('get-live-pattern-details', {
                body: { id: openPatternId },
              }),
              30_000,
              'get-live-pattern-details'
            );
            if (res.error || !res.data?.success || !res.data.pattern) {
              console.warn('[LivePatternsPage] Failed to load openPattern directly', res.error);
              setChartOpen(false);
              return;
            }
            const setup = mapApiResponseToLiveSetup(res.data.pattern);
            setSelectedSetup(toSetupWithVisuals(setup));
            return;
          }

          // Fallback: query live_pattern_detections directly for the highlighted instrument
          if (highlightSymbol) {
            const { data, error } = await supabase
              .from('live_pattern_detections')
              .select('*')
              .or(`instrument.eq.${highlightSymbol},instrument.ilike.%${highlightSymbol}%`)
              .in('status', ['active', 'pending'])
              .order('last_confirmed_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (error || !data) {
              console.warn('[LivePatternsPage] No pattern found for highlight symbol', highlightSymbol, error);
              setChartOpen(false);
              return;
            }
            const setup = mapApiResponseToLiveSetup(data);
            setSelectedSetup(toSetupWithVisuals(setup));
          }
        } catch (err) {
          console.error('[LivePatternsPage] Error fetching pattern for highlight/openPattern', err);
          setChartOpen(false);
        } finally {
          setLoadingChartDetails(false);
        }
      })();
    }
  }, [highlightSymbol, openPatternId, patterns, loading, chartOpen]);

  // Get unique pattern types for filter dropdown
  const patternOptions = useMemo(() => {
    const counts = new Map<string, number>();
    patterns.forEach(p => {
      counts.set(p.patternId, (counts.get(p.patternId) || 0) + 1);
    });
    return [...new Set(patterns.map(p => p.patternId))].map(id => ({
      id,
      name: patterns.find(p => p.patternId === id)?.patternName || id,
      count: counts.get(id) || 0,
    }));
  }, [patterns]);

  // Helper to extract grade from pattern
  const getPatternGrade = (p: LiveSetup): string => {
    return p.quality?.grade || p.quality?.score?.toString() || 'C';
  };

  // Calculate filter stats
  const filterStats = useMemo(() => {
    const longCount = patterns.filter(p => p.direction === 'long').length;
    const shortCount = patterns.filter(p => p.direction === 'short').length;
    const withTrend = patterns.filter(p => p.trendAlignment === 'with_trend').length;
    const counterTrend = patterns.filter(p => p.trendAlignment === 'counter_trend').length;
    const neutral = patterns.filter(p => p.trendAlignment === 'neutral' || !p.trendAlignment).length;
    const ageStats = calculateAgeStats(patterns);
    
    // Calculate grade counts
    const gradeA = patterns.filter(p => getPatternGrade(p) === 'A').length;
    const gradeB = patterns.filter(p => getPatternGrade(p) === 'B').length;
    const gradeC = patterns.filter(p => getPatternGrade(p) === 'C').length;
    const gradeD = patterns.filter(p => getPatternGrade(p) === 'D').length;
    const gradeF = patterns.filter(p => getPatternGrade(p) === 'F').length;
    
    // Calculate FX category counts (only relevant for FX asset type)
    const fxCounts = assetType === 'fx' ? getFXCategoryCounts(patterns) : { major: 0, minor: 0, exotic: 0 };
    
    return {
      total: patterns.length,
      filtered: 0, // Will be updated after filtering
      longCount,
      shortCount,
      withTrend,
      counterTrend,
      neutral,
      gradeA,
      gradeB,
      gradeC,
      gradeD,
      gradeF,
      fxMajor: fxCounts.major,
      fxMinor: fxCounts.minor,
      fxExotic: fxCounts.exotic,
      ...ageStats,
    };
  }, [patterns, assetType]);

  // Filter patterns with new filter system
  const filteredPatterns = useMemo(() => {
    let result = patterns.filter(p => {
      if (filters.direction !== 'all' && p.direction !== filters.direction) return false;
      if (filters.pattern !== 'all' && p.patternId !== filters.pattern) return false;
      if (filters.trend !== 'all' && p.trendAlignment !== filters.trend) return false;
      if (filters.grade !== 'all' && getPatternGrade(p) !== filters.grade) return false;
      return true;
    });
    
    // Apply age filter
    result = filterByAge(result, filters.age) as typeof result;
    
    // Apply FX category filter (only for FX asset type)
    if (assetType === 'fx' && filters.fxCategory && filters.fxCategory !== 'all') {
      result = filterByFXCategory(result, filters.fxCategory) as typeof result;
    }
    
    return result;
  }, [patterns, filters, assetType]);

  // Update filtered count in stats
  const fullFilterStats = useMemo(() => ({
    ...filterStats,
    filtered: filteredPatterns.length,
  }), [filterStats, filteredPatterns.length]);

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
      
      // Apply user-selected sort
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
        case 'grade':
          const gradeA = GRADE_ORDER[a.quality?.grade || a.quality?.score || 'C'] || 3;
          const gradeB = GRADE_ORDER[b.quality?.grade || b.quality?.score || 'C'] || 3;
          cmp = gradeA - gradeB; // Lower number = higher grade (A=1, F=5)
          break;
        case 'winRate': {
          const winA = a.historicalPerformance?.winRate ?? -1;
          const winB = b.historicalPerformance?.winRate ?? -1;
          cmp = winB - winA;
          break;
        }
        case 'expectancy': {
          const expA = a.historicalPerformance?.winRate != null
            ? calculateProjectedExpectancy(a.historicalPerformance.winRate, DEFAULT_RR)
            : -999;
          const expB = b.historicalPerformance?.winRate != null
            ? calculateProjectedExpectancy(b.historicalPerformance.winRate, DEFAULT_RR)
            : -999;
          cmp = expB - expA;
          break;
        }
        case 'rot': {
          const getROT = (s: LiveSetup) => {
            const perf = s.historicalPerformance;
            if (perf?.avgRMultiple && perf?.avgDurationBars && perf.avgDurationBars > 0) {
              return perf.avgRMultiple / perf.avgDurationBars;
            }
            return -999;
          };
          cmp = getROT(b) - getROT(a);
          break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [filteredPatterns, highlightSymbol, sortKey, sortAsc]);

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

  // Guest preview: show first 5 rows clearly, blur rest
  const { isAuthenticated: isAuthed } = useAuth();
  const totalRowCount = sortedPatterns.length;
  const GUEST_VISIBLE = 5;
  const guestLimited = !isAuthed && totalRowCount > GUEST_VISIBLE;

  // For guests, show ALL groups (no truncation) — blur is applied per-row in the table
  const visibleGroupedPatterns = groupedPatterns;

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortAsc ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const buildFallbackVisualSpec = (setup: LiveSetup): VisualSpec => {
    const entry = setup?.tradePlan?.entry ?? 0;
    return {
      version: '2.0.0',
      symbol: setup.instrument,
      timeframe: (setup as any)?.visualSpec?.timeframe || timeframe,
      patternId: setup.patternId,
      signalTs: setup.signalTs,
      window: {
        startTs: setup.signalTs,
        endTs: setup.signalTs,
      },
      yDomain: {
        min: entry,
        max: entry,
      },
      overlays: [],
    };
  };

  // Map snake_case API response (from get-live-pattern-details edge function) to camelCase LiveSetup
  const mapApiResponseToLiveSetup = (apiPattern: any): LiveSetup => {
    // Check if we need to convert (snake_case) or if it's already camelCase
    const needsConversion = apiPattern.pattern_name || apiPattern.entry_price;
    
    if (!needsConversion) {
      // Already in camelCase format (from scan-live-patterns)
      return apiPattern as LiveSetup;
    }
    
    // Map letter grade to numeric score
    const gradeToScore: Record<string, number> = { A: 9, B: 7, C: 5, D: 3, F: 1 };
    const rawGrade = (apiPattern.quality_score || 'C').toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'F';
    const numericScore = gradeToScore[rawGrade] ?? 5;
    
    // Convert snake_case to camelCase
    return {
      dbId: apiPattern.id,
      instrument: apiPattern.instrument,
      patternId: apiPattern.pattern_id || apiPattern.visual_spec?.patternId || 'unknown',
      patternName: apiPattern.pattern_name,
      direction: apiPattern.direction === 'bullish' ? 'long' : apiPattern.direction === 'bearish' ? 'short' : apiPattern.direction,
      signalTs: apiPattern.first_detected_at,
      quality: {
        score: numericScore,
        grade: rawGrade,
        confidence: numericScore * 10,
        reasons: apiPattern.quality_reasons || ['Pattern detected'],
        warnings: [],
        tradeable: numericScore >= 3,
      },
      tradePlan: {
        entry: apiPattern.entry_price,
        stopLoss: apiPattern.stop_loss_price,
        takeProfit: apiPattern.take_profit_price,
        rr: apiPattern.risk_reward_ratio || 2,
        entryType: 'bar_close',
        stopDistance: Math.abs(apiPattern.entry_price - apiPattern.stop_loss_price),
        tpDistance: Math.abs(apiPattern.take_profit_price - apiPattern.entry_price),
      },
      bars: (apiPattern.bars || []).map((b: any) => ({
        t: b.t || b.date,
        o: b.o || b.open,
        h: b.h || b.high,
        l: b.l || b.low,
        c: b.c || b.close,
        v: b.v || b.volume || 0,
      })),
      visualSpec: apiPattern.visual_spec,
      currentPrice: apiPattern.current_price,
      prevClose: apiPattern.prev_close,
      changePercent: apiPattern.change_percent,
      trendAlignment: apiPattern.trend_alignment,
      trendIndicators: apiPattern.trend_indicators,
    };
  };

  const toSetupWithVisuals = (setup: LiveSetup): SetupWithVisuals & {
    currentPrice?: number;
    prevClose?: number;
    changePercent?: number | null;
    trendAlignment?: LiveSetup['trendAlignment'];
    trendIndicators?: LiveSetup['trendIndicators'];
  } => {
    const visualSpec = setup.visualSpec || buildFallbackVisualSpec(setup);
    
    // Use default R:R tier for trade plan calculation
    const baseTradePlan = {
      entry: setup.tradePlan.entry,
      stopLoss: setup.tradePlan.stopLoss,
      takeProfit: setup.tradePlan.takeProfit,
      rr: setup.tradePlan.rr,
      stopDistance: setup.tradePlan.stopDistance || Math.abs(setup.tradePlan.entry - setup.tradePlan.stopLoss),
      tpDistance: setup.tradePlan.tpDistance || Math.abs(setup.tradePlan.takeProfit - setup.tradePlan.entry),
    };
    
    // Apply default R:R recalculation
    const recalculated = recalculateTradePlan(baseTradePlan, setup.direction, DEFAULT_RR);

    return {
      dbId: setup.dbId,
      instrument: setup.instrument,
      patternId: setup.patternId,
      patternName: setup.patternName,
      direction: setup.direction,
      signalTs: setup.signalTs,
      quality: setup.quality as PatternQuality,
      tradePlan: {
        entryType: setup.tradePlan.entryType || 'bar_close',
        entry: recalculated.entry,
        stopLoss: recalculated.stopLoss,
        takeProfit: recalculated.takeProfit,
        rr: recalculated.rr,
        stopDistance: recalculated.stopDistance,
        tpDistance: recalculated.tpDistance,
        timeStopBars: setup.tradePlan.timeStopBars || 100,
        bracketLevelsVersion: setup.tradePlan.bracketLevelsVersion || '1.0.0',
        priceRounding: setup.tradePlan.priceRounding || { priceDecimals: 2, rrDecimals: 1 },
      },
      bars: Array.isArray(setup.bars) ? setup.bars : [],
      visualSpec,
      // passthrough optional enrichment fields for the viewer
      currentPrice: setup.currentPrice,
      prevClose: setup.prevClose,
      changePercent: setup.changePercent,
      trendAlignment: setup.trendAlignment,
      trendIndicators: setup.trendIndicators,
    };
  };

  const handlePaperTrade = async (setup: LiveSetup) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('Please log in to paper trade'); return; }

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('auto-paper-trade', {
        body: {
          user_id: session.user.id,
          symbol: setup.instrument,
          direction: setup.direction,
          entry_price: setup.tradePlan.entry,
          stop_loss_price: setup.tradePlan.stopLoss,
          take_profit_price: setup.tradePlan.takeProfit,
          risk_percent: 1,
          pattern: setup.patternId,
          timeframe: timeframe,
          detection_id: setup.dbId || null,
        },
      });

      if (invokeError) throw invokeError;

      if (data?.success) {
        // Record signal action
        await supabase.from('user_signal_actions').insert({
          user_id: session.user.id,
          detection_id: setup.dbId || null,
          instrument: setup.instrument,
          pattern_id: setup.patternId,
          timeframe: timeframe,
          action: 'paper_trade',
          paper_trade_id: data.trade_id || null,
        });
        toast.success(`Paper trade opened: ${setup.direction.toUpperCase()} ${setup.instrument}`);
      } else if (data?.skipped) {
        toast.info(data.reason === 'duplicate_open_trade' 
          ? `Already have an open trade on ${setup.instrument}` 
          : 'Trade skipped: position too large');
      } else {
        toast.error(data?.error || 'Failed to open paper trade');
      }
    } catch (err: any) {
      console.error('[LivePatternsPage] Paper trade error:', err);
      toast.error('Failed to open paper trade');
    }
  };

  const handleOpenChart = async (setup: LiveSetup) => {
    const requestId = ++chartDetailsRequestIdRef.current;

    console.debug('[LivePatternsPage] Open chart', {
      requestId,
      dbId: setup.dbId,
      instrument: setup.instrument,
      patternId: setup.patternId,
    });

    // Open immediately with a loading overlay; then lazy-load full bars/VisualSpec.
    setChartOpen(true);
    setLoadingChartDetails(true);

    try {
      // Ensure we have at least a minimal setup so the dialog header renders.
      setSelectedSetup(toSetupWithVisuals(setup));

      const hasBars = Array.isArray(setup.bars) && setup.bars.length > 0;
      const hasOverlays =
        Array.isArray(setup.visualSpec?.overlays) && (setup.visualSpec?.overlays?.length || 0) > 0;
      let needsDetails = !hasBars || !hasOverlays;

      console.debug('[LivePatternsPage] Detail check', {
        requestId,
        hasBars,
        hasOverlays,
        needsDetails,
      });

      // Check prefetch cache first (instant if user hovered)
      if (needsDetails && setup.dbId) {
        const cached = getAndConsume(setup.dbId);
        if (cached) {
          console.debug('[LivePatternsPage] Using prefetched data', { requestId, dbId: setup.dbId });
          setSelectedSetup(toSetupWithVisuals(mapApiResponseToLiveSetup(cached)));
          return; // Done! No network request needed
        }
      }

      if (!needsDetails) return;

      if (!setup.dbId) {
        console.warn('[LivePatternsPage] Missing dbId; cannot load detailed chart data');
        return;
      }

      // This function can cold-start; allow one retry with a longer timeout.
      const timeouts = [25_000, 45_000] as const;
      let lastErr: any = null;

      for (let i = 0; i < timeouts.length; i++) {
        try {
          const res = await withTimeout(
            supabase.functions.invoke<PatternDetailsResponse>('get-live-pattern-details', {
              body: { id: setup.dbId },
            }),
            timeouts[i],
            'get-live-pattern-details'
          );

          console.debug('[LivePatternsPage] Details response received', {
            requestId,
            attempt: i + 1,
            ok: !res.error,
            hasData: Boolean(res.data),
          });

          if (res.error) throw res.error;

          if (!res.data?.success || !res.data.pattern) {
            throw new Error(res.data?.error || 'Failed to load pattern details');
          }

          // Ignore stale responses if user opened a different setup while this was in-flight.
          if (chartDetailsRequestIdRef.current !== requestId) return;

          setSelectedSetup(toSetupWithVisuals(mapApiResponseToLiveSetup(res.data.pattern)));
          return;
        } catch (err: any) {
          lastErr = err;
          console.warn('[LivePatternsPage] Details attempt failed', {
            requestId,
            attempt: i + 1,
            message: err?.message || String(err),
          });
          // Small delay before retry to allow cold start to finish.
          if (i < timeouts.length - 1) {
            await new Promise((r) => setTimeout(r, 750));
          }
        }
      }

      throw lastErr;
    } catch (err: any) {
      console.error('[LivePatternsPage] Failed to load chart details:', err?.message || err);
      // Keep the dialog open with a readable fallback state in the viewer.
    } finally {
      // Only the latest request should be allowed to clear the loading overlay.
      if (chartDetailsRequestIdRef.current === requestId) {
        console.debug('[LivePatternsPage] Clearing details loading', { requestId });
        setLoadingChartDetails(false);
      }
    }
  };

  // Progressive loading: Show UI shell immediately, data loads in place
  const showSkeletonCards = loading && patterns.length === 0;

  // First-visit welcome banner
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('screener_visited');
  });
  
  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('screener_visited', '1');
  };

  return (
    <div className="min-h-screen bg-background">
      <WelcomeBackBanner />
      <PageMeta
        title="Live Chart Pattern Signals — Real-Time Detections | ChartingPath"
        description="Browse live chart pattern detections across 800+ instruments. Bull flags, ascending triangles, head and shoulders and 14 more patterns updated every hour."
        canonicalPath="/patterns/live"
      />

      <div className="flex-1 min-w-0">
    <div className="w-full px-4 md:px-6 lg:px-8 pt-6 pb-12">
      {/* First-visit guidance banner */}
      {showWelcome && !loading && patterns.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/5 relative">
          <button 
            onClick={dismissWelcome}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-sm"
          >
            ✕
          </button>
          <h3 className="font-semibold text-sm mb-1">{t('screener.welcomeTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('screener.welcomeBody', { count: totalInUniverse || instrumentsScanned })}
            {' '}<strong className="text-foreground">{t('screener.welcomeClickRow')}</strong> {t('screener.welcomeClickRowSuffix')}
            {' '}{t('screener.welcomeLookFor')} <strong className="text-foreground">{t('screener.welcomeGrade')}</strong> {t('screener.welcomeGradeSuffix')}
          </p>
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            Live
          </Badge>
           {lastScanned && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t('screener.updatedAt', { time: new Date(lastScanned).toLocaleTimeString() })}
            </span>
          )}
          <DataVersionBadge />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-amber-500" />
          <h1 className="text-3xl font-bold">{t('livePatterns.title')}</h1>
          <UniversalSymbolSearch 
            onSelect={(symbol) => navigate('/members/dashboard', { state: { initialSymbol: symbol.toUpperCase() } })}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
               <Search className="h-4 w-4" />
                {t('livePatterns.studyTicker')}
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
                <p className="font-medium mb-2">{t('livePatterns.howThisWorks')}</p>
                <p className="text-sm mb-2">
                  We analyze {totalInUniverse || instrumentsScanned} {ASSET_TYPE_LABELS[assetType].toLowerCase()} instruments 
                  for chart patterns using {timeframe === '1h' ? '1-hour' : timeframe === '4h' ? '4-hour' : timeframe === '8h' ? '8-hour' : timeframe === '1wk' ? 'weekly' : 'daily'} timeframe data.
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
          {t('screener.analyzing', { 
            count: totalInUniverse || instrumentsScanned, 
            assetType: ASSET_TYPE_LABELS[assetType].toLowerCase(),
            timeframe: timeframe === '1h' ? '1H' : timeframe === '4h' ? '4H' : timeframe === '8h' ? '8H' : timeframe === '1wk' ? t('screener.weekly') : t('screener.daily'),
            active: patterns.length
          })}
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{patterns.length}</span>
            <span className="text-muted-foreground">{t('livePatterns.patternsFound')}</span>
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
              <SelectItem value="indices">📊 Indices</SelectItem>
              <SelectItem value="etfs">💼 ETFs</SelectItem>
            </SelectContent>
          </Select>

          {/* Timeframe Selector */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Select value={timeframe} onValueChange={(v) => handleTimeframeChange(v as '1h' | '4h' | '8h' | '1d' | '1wk')}>
                    <SelectTrigger className="w-24">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1H</SelectItem>
                      <SelectItem value="4h">4H</SelectItem>
                      <SelectItem value="8h">8H</SelectItem>
                      <SelectItem value="1d">{t('screener.daily')}</SelectItem>
                      <SelectItem value="1wk">{t('screener.weekly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs p-3">
                <p className="font-medium mb-1">{t('screener.chartTimeframeDesc').split('.')[0]}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('screener.chartTimeframeDesc')}
                </p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div><span className="font-medium">1H:</span> {t('screener.tf1hDesc')}</div>
                  <div><span className="font-medium">4H:</span> {t('screener.tf4hDesc')}</div>
                  <div><span className="font-medium">8H:</span> {t('screener.tf8hDesc')}</div>
                  <div><span className="font-medium">{t('screener.daily')}:</span> {t('screener.tfDailyDesc')}</div>
                  <div><span className="font-medium">{t('screener.weekly')}:</span> {t('screener.tfWeeklyDesc')}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Trend Indicator Settings */}
          <TrendIndicatorSettings 
            onConfigChange={(config) => {
              setTrendConfig(config);
              // Trigger a refresh to recalculate with new settings
            }}
            trigger={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Trend Indicator Settings">
                <Settings2 className="h-4 w-4" />
              </Button>
            }
          />
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setRetryCount(0);
              fetchLivePatterns(true);
            }}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('livePatterns.refresh')}
          </Button>
        </div>
      </div>

      {/* Trader-Focused Filters */}
      <Card className="mb-6 p-4">
        <ScreenerFilters
          patterns={patternOptions}
          filters={filters}
          stats={fullFilterStats}
          showFXFilters={assetType === 'fx'}
          onChange={(partial) => setFilters(prev => ({ ...prev, ...partial }))}
          onClear={() => setFilters(DEFAULT_SCREENER_FILTERS)}
        />
      </Card>

      {/* Collapsible instrument list */}
      <Collapsible open={showInstrumentList} onOpenChange={setShowInstrumentList}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('screener.viewAllInstruments', { count: totalInUniverse || instrumentsScanned || AVAILABLE_INSTRUMENTS[assetType]?.length || 25, assetType: ASSET_TYPE_LABELS[assetType].toLowerCase() })}
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
               {t('screener.instrumentsDesc', { assetType: ASSET_TYPE_LABELS[assetType].toLowerCase() })}
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

      {/* Supported Patterns Overview */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('livePatterns.patternsWeDetect')}</span>
             <Badge variant="secondary" className="text-sm">
               {ALL_PATTERN_IDS.length} {t('screener.types')}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {t('livePatterns.clickToFilter')}
          </span>
        </div>
        <SupportedPatternsList
          patternCounts={ALL_PATTERN_IDS.map(patternId => {
            const matching = patterns.filter(p => p.patternId === patternId);
            return {
              patternId,
              count: matching.length,
              longCount: matching.filter(p => p.direction === 'long').length,
              shortCount: matching.filter(p => p.direction === 'short').length,
            };
          })}
          lockedPatterns={lockedPatterns}
          compact={false}
          selectedPattern={filters.pattern !== 'all' ? filters.pattern : undefined}
          blurEdgeMetrics={false}
          onPatternClick={(patternId) => {
            if (filters.pattern === patternId) {
              setFilters(prev => ({ ...prev, pattern: 'all' }));
            } else {
              setFilters(prev => ({ ...prev, pattern: patternId }));
            }
          }}
        />
      </Card>

      {/* Error state */}
      {error && (
        <Card className="p-8 text-center mb-6">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchLivePatterns(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('livePatterns.tryAgain')}
          </Button>
        </Card>
      )}

      {/* Loading state - inline skeleton cards */}
      {showSkeletonCards && (
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
      )}

      {/* Empty state */}
      {!error && !showSkeletonCards && sortedPatterns.length === 0 && (
        <Card className="p-12 text-center">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('livePatterns.noPatternsFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {filters.trend !== 'all' && fullFilterStats.withTrend === 0 && fullFilterStats.counterTrend === 0
              ? t('screener.noTrendData')
              : patterns.length > 0 
                ? t('screener.adjustFilters')
                : t('screener.noActivePatterns')}
          </p>
          {patterns.length > 0 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setFilters(DEFAULT_SCREENER_FILTERS)}>
                {t('livePatterns.clearFilters')}
              </Button>
              {filters.trend !== 'all' && fullFilterStats.withTrend === 0 && fullFilterStats.counterTrend === 0 && (
                <Button variant="default" onClick={() => fetchLivePatterns(true)} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {t('screener.calculateTrendData')}
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Patterns - List View */}
      {sortedPatterns.length > 0 && (
        <>
          {/* Data Coverage Notice */}
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-foreground">{t('screener.dataCoverage')}:</span>{' '}
                {t('screener.dataCoverageDesc')}{' '}
                <Link to="/projects/pattern-lab/new" className="text-primary hover:underline">{t('screener.patternLab')}</Link>.
              </div>
            </div>
          </div>
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
                     {t('screener.symbol')}
                      <SortIcon columnKey="instrument" />
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">{t('screener.pattern')}</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none text-center whitespace-nowrap"
                    onClick={() => handleSort('grade')}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-center gap-1">
                           {t('screener.grade')}
                            <SortIcon columnKey="grade" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <p className="text-xs">{t('screener.gradeTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort('direction')}
                  >
                    <div className="flex items-center">
                     {t('screener.signal')}
                      <SortIcon columnKey="direction" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none text-right whitespace-nowrap"
                    onClick={() => handleSort('winRate')}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-end gap-1">
                            {t('screener.winPercent')}
                            <SortIcon columnKey="winRate" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{t('screener.winRateTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none text-right whitespace-nowrap"
                    onClick={() => handleSort('expectancy')}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-end gap-1 cursor-help text-xs">
                            {t('screener.expectancy')}
                            <Info className="h-3 w-3 opacity-50" />
                            <SortIcon columnKey="expectancy" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="end" className="max-w-[360px] whitespace-normal break-words text-left">
                          <p className="text-xs">{t('screener.expectancyTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none text-right whitespace-nowrap"
                    onClick={() => handleSort('rot')}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center justify-end gap-1 cursor-help">
                            ROT
                            <Info className="h-3 w-3 opacity-50" />
                            <SortIcon columnKey="rot" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm whitespace-normal">
                          <p className="text-xs">{t('screener.rotTooltip', 'Return on Time — R earned per bar of exposure. Higher = more capital-efficient.')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none text-right whitespace-nowrap"
                    onClick={() => handleSort('signal')}
                  >
                    <div className="flex items-center justify-end">
                     {t('screener.age')}
                      <SortIcon columnKey="signal" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap w-16">
                    <span className="inline-flex items-center gap-1">
                      Gate
                      <InfoTooltip content="The AI Gate checks each setup against your trading plan. Aligned = matches your rules. Partial = some rules match. Conflict = breaks your plan rules." />
                    </span>
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap w-10">
                  </TableHead>
                  <TableHead className="whitespace-nowrap w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let rowIndex = 0;
                  return visibleGroupedPatterns.map(([patternName, setups]) => (
                    <Fragment key={patternName}>
                      {/* Pattern Group Header */}
                      <TableRow key={`header-${patternName}`} className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={11} className="py-2">
                          <span className="font-semibold text-sm">{translatePatternName(patternName)}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {setups.length}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {/* Pattern Rows */}
                      {setups.map((setup, idx) => {
                        const currentRow = rowIndex++;
                        const isBlurred = guestLimited && currentRow >= GUEST_VISIBLE;
                        const isLong = setup.direction === 'long';
                        const signalAge = formatSignalAgeSimple(setup.signalTs);
                        const isFresh = signalAge.endsWith('m') || signalAge.endsWith('h') || signalAge === '1d';
                        const isHighlighted = highlightSymbol && setup.instrument.includes(highlightSymbol);
                        // Check if this pattern has bars embedded (instant load) or is prefetched
                        const hasBarsReady = (setup.bars?.length ?? 0) > 0 || (setup.dbId && getCached(setup.dbId));
                        
                        return (
                          <TableRow 
                            key={`${setup.instrument}-${setup.patternId}-${idx}`}
                            className={`${isBlurred ? 'pointer-events-none select-none' : 'cursor-pointer'} hover:bg-muted/50 transition-colors ${
                              isHighlighted ? 'bg-primary/5' : ''
                            }`}
                            style={isBlurred ? { filter: 'blur(4px)' } : undefined}
                            onClick={isBlurred ? undefined : () => handleOpenChart(setup)}
                            onMouseEnter={isBlurred ? undefined : () => {
                              // Prefetch pattern details on hover for instant chart loading
                              if (!hasBarsReady && setup.dbId) {
                                onRowHover(setup.dbId);
                              }
                            }}
                            onMouseLeave={isBlurred ? undefined : cancelPrefetch}
                          >
                            <TableCell>
                              <InstrumentLogo instrument={setup.instrument} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {translatePatternName(setup.patternName)}
                            </TableCell>
                            <TableCell className="text-center">
                              <GradeBadge quality={setup.quality} />
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
                                {isLong ? t('screener.long') : t('screener.short')}
                              </Badge>
                              {/* Trend Alignment Badge */}
                              {setup.trendAlignment && setup.trendAlignment !== 'neutral' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex align-middle">
                                      <Badge 
                                        variant="outline"
                                        className={`ml-1.5 text-sm px-1.5 py-0 cursor-help ${
                                          setup.trendAlignment === 'with_trend' 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                        }`}
                                      >
                                        {setup.trendAlignment === 'with_trend' ? (
                                          <ArrowUpRight className="h-2.5 w-2.5" />
                                        ) : (
                                          <ArrowDownRight className="h-2.5 w-2.5" />
                                        )}
                                      </Badge>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-sm whitespace-normal text-xs">
                                    {setup.trendAlignment === 'with_trend' 
                                      ? 'With Trend — pattern direction aligns with the higher-timeframe trend (EMA 50/200, MACD, RSI, ADX)'
                                      : 'Counter Trend — pattern direction opposes the prevailing trend. Higher risk.'}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {setup.historicalPerformance?.winRate != null ? (
                                <span className={`font-mono text-sm font-medium ${
                                  setup.historicalPerformance.winRate >= 50 ? 'text-green-500' : 'text-amber-500'
                                }`}>
                                  {setup.historicalPerformance.winRate.toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            {/* Projected Expectancy based on default R:R */}
                            <TableCell className="text-right">
                              {setup.historicalPerformance?.winRate != null ? (() => {
                                const expectancy = calculateProjectedExpectancy(
                                  setup.historicalPerformance.winRate, 
                                  DEFAULT_RR
                                );
                                return (
                                  <span className={`font-mono text-xs font-medium ${
                                    expectancy >= 0 ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    {expectancy >= 0 ? '+' : ''}{expectancy.toFixed(2)}R
                                  </span>
                                );
                              })() : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            {/* ROT - Return on Time */}
                            <TableCell className="text-right">
                              {(() => {
                                const perf = setup.historicalPerformance;
                                if (perf && perf.avgRMultiple && perf.avgDurationBars && perf.avgDurationBars > 0) {
                                  const rot = perf.avgRMultiple / perf.avgDurationBars;
                                  const isHighEfficiency = rot >= 0.01;
                                  return (
                                    <span className={cn(
                                      'font-mono text-xs font-medium',
                                      isHighEfficiency ? 'text-amber-500' : 'text-muted-foreground'
                                    )}>
                                      {rot.toFixed(4)}
                                    </span>
                                  );
                                }
                                return <span className="text-muted-foreground text-xs">—</span>;
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`text-xs ${
                                isFresh ? 'text-green-500' : 'text-muted-foreground'
                              }`}>
                                {signalAge}
                              </span>
                            </TableCell>
                            {/* Gate Badge */}
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                const gateEval = getEvaluation(setup.instrument, setup.patternName, timeframe, setup.direction);
                                const gateLoading = isGateLoading(setup.instrument, setup.patternName, timeframe, setup.direction);
                                if (gateLoading) {
                                  return <Badge variant="outline" className="text-sm px-1.5 py-0 bg-muted/30 text-muted-foreground border-border/30 animate-pulse">…</Badge>;
                                }
                                const gateType = gateEval?.gate_result || (currentRow < 3 ? 'aligned' : currentRow < 5 ? 'partial' : 'conflict');
                                const styles = {
                                  aligned: 'bg-green-500/10 text-green-500 border-green-500/30',
                                  partial: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                                  conflict: 'bg-red-500/10 text-red-500 border-red-500/30',
                                };
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className={`text-sm px-1.5 py-0 cursor-help ${styles[gateType as keyof typeof styles] || styles.partial}`}>
                                        {gateType}
                                      </Badge>
                                    </TooltipTrigger>
                                    {gateEval?.gate_reason && (
                                      <TooltipContent side="left" className="max-w-xs text-xs">
                                        {gateEval.gate_reason}
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                );
                              })()}
                            </TableCell>
                            {/* Trade button */}
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap disabled:opacity-50"
                                disabled={isPaperSubmitting}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const gateEval = getEvaluation(setup.instrument, setup.patternName, timeframe, setup.direction);
                                  tradeWithGateCheck({
                                    ticker: setup.instrument,
                                    setup_type: setup.patternName,
                                    timeframe,
                                    direction: setup.direction,
                                    entry_price: setup.currentPrice,
                                    gate_result: gateEval?.gate_result ?? 'aligned',
                                    gate_reason: gateEval?.gate_reason,
                                    gate_evaluation_id: gateEval?.evaluation_id ?? undefined,
                                    agent_score: gateEval?.agent_score ?? undefined,
                                  });
                                }}
                              >
                                Trade
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </Fragment>
                  ));
                })()}
              </TableBody>
            </Table>
          </div>

          {/* Guest overlay when rows are limited */}
          {guestLimited && (
            <GuestScreenerOverlay totalCount={totalRowCount} visibleCount={GUEST_VISIBLE} />
          )}
        </div>
        </>
      )}


      {/* CTA Section */}
      <Card className="mt-12 p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">{t('livePatterns.wantDeeperAnalysis')}</h3>
            <p className="text-muted-foreground">
              {t('livePatterns.deeperAnalysisDesc')}
            </p>
          </div>
          <Link to="/projects/pattern-lab/new">
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
              <FlaskConical className="h-5 w-5 mr-2" />
              {t('livePatterns.openPatternLab')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="mt-8 flex items-start gap-3 text-sm text-muted-foreground">
        <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <p>
          <strong>{t('common.disclaimer')}:</strong> {t('screener.disclaimer')}
        </p>
      </div>

      {/* Full Chart Viewer */}
      {selectedSetup && (
        <FullChartViewer
          open={chartOpen}
          onOpenChange={(nextOpen) => {
            setChartOpen(nextOpen);
            if (!nextOpen) {
              // Cancel any in-flight detail request and ensure we don't reopen stuck in loading.
              chartDetailsRequestIdRef.current += 1;
              setLoadingChartDetails(false);
            }
          }}
          setup={selectedSetup}
          loading={loadingChartDetails}
          selectedRR={DEFAULT_RR}
          onCreateAlert={async () => {
            setCreatingAlertInline(true);
            try {
              const { data, error } = await supabase.functions.invoke('create-alert', {
                body: {
                  symbol: selectedSetup.instrument,
                  pattern: selectedSetup.patternId,
                  timeframe: selectedSetup.visualSpec?.timeframe || '1d',
                  action: 'create',
                },
              });
              if (error) throw error;
              if (data?.code === 'ALERT_LIMIT') {
                toast.error(data.message || 'Alert limit reached for your plan');
              } else if (data?.error) {
                toast.error(data.error);
              } else {
                toast.success(`Alert created for ${selectedSetup.instrument} — ${selectedSetup.patternName}`, {
                  duration: 8000,
                  action: {
                    label: '⚡ Generate Script',
                    onClick: () => {
                      window.location.href = `/members/scripts?symbol=${selectedSetup.instrument}&pattern=${selectedSetup.patternId}&timeframe=${selectedSetup.visualSpec?.timeframe || '1d'}`;
                    },
                  },
                });
              }
            } catch (err: any) {
              console.error('Create alert error:', err);
              const msg = err?.message || '';
              if (msg.includes('401') || msg.includes('Unauthorized') || err?.status === 401) {
                toast.error('Please log in to set alerts');
              } else {
                toast.error(msg || 'Failed to create alert');
              }
            } finally {
              setCreatingAlertInline(false);
            }
          }}
          isCreatingAlert={creatingAlertInline}
        />
      )}
    </div>
      </div>

    </div>
  );
}
