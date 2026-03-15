import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, RefreshCw, Star, StarOff, Loader2, Search, Lock, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { UniversalSymbolSearch } from '@/components/charts/UniversalSymbolSearch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { fetchMarketBars } from '@/lib/fetchMarketBars';
import { symbolDataCache } from '@/lib/symbolDataCache';
import StudyChart, { ChartMarker } from '@/components/charts/StudyChart';
import type { HistoricalPatternOverlay } from '@/components/charts/PatternOverlayRenderer';
import { PATTERN_DISPLAY_NAMES } from '@/hooks/useScreenerCaps';
import { CompressedBar } from '@/types/VisualSpec';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getChartDataLimits, Timeframe } from '@/config/dataCoverageContract';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTradingCopilotContext } from '@/components/copilot';
import { deriveFormationOverlay, FormationOverlayData } from '@/utils/formationOverlay';
import { useAuthGate } from '@/hooks/useAuthGate';
import { AuthGateDialog } from '@/components/AuthGateDialog';
import { deriveLiveOutcome as deriveLiveOutcomeUtil } from '@/utils/deriveLiveOutcome';

/** Last-resort fallback: extract bars embedded in active pattern detections */
async function tryExtractPatternBars(sym: string, tf: string): Promise<CompressedBar[]> {
  try {
    const { data } = await supabase
      .from('live_pattern_detections')
      .select('bars')
      .eq('instrument', sym.toUpperCase())
      .eq('timeframe', tf)
      .eq('status', 'active')
      .order('first_detected_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0 && data[0].bars) {
      const raw = data[0].bars as any[];
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((b: any) => ({
          t: b.t || '',
          o: Number(b.o ?? b.open ?? 0),
          h: Number(b.h ?? b.high ?? 0),
          l: Number(b.l ?? b.low ?? 0),
          c: Number(b.c ?? b.close ?? 0),
          v: Number(b.v ?? b.volume ?? 0),
        }));
      }
    }
  } catch (e) {
    console.warn('[CommandCenterChart] pattern bars fallback failed:', e);
  }
  return [];
}

interface CommandCenterChartProps {
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  onSymbolChange?: (symbol: string) => void;
  onWatchlistChange?: () => void;
}

/** Timeframes that require authentication to access */
export const AUTH_REQUIRED_TIMEFRAMES = new Set(['15m', '1h']);

const TIMEFRAMES = [
  { value: '15m', label: '15m', requiresAuth: true },
  { value: '1h', label: '1H', requiresAuth: true },
  { value: '4h', label: '4H', requiresAuth: false },
  { value: '8h', label: '8H', requiresAuth: false },
  { value: '1d', label: '1D', requiresAuth: false },
  { value: '1wk', label: '1W', requiresAuth: false },
];

export const CommandCenterChart = memo(function CommandCenterChart({
  symbol,
  timeframe,
  onTimeframeChange,
  onSymbolChange,
  onWatchlistChange,
}: CommandCenterChartProps) {
  const { profile, user } = useUserProfile();
  const isMobile = useIsMobile();
  const copilot = useTradingCopilotContext();
  const { showAuthDialog, setShowAuthDialog, requireAuth } = useAuthGate("intraday charts");
  const userId = user?.id;
  const [bars, setBars] = useState<CompressedBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ current: number; change: number; changePct: number } | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [autoPatterns, setAutoPatterns] = useState<any[]>([]);
  const [selectedPatternIndex, setSelectedPatternIndex] = useState<number>(0);
  const [patternOverlayVisible, setPatternOverlayVisible] = useState(true);

  // Check if user is on a paid plan
  const isPaidUser = profile?.subscription_plan && 
    !['free', 'starter'].includes(profile.subscription_plan);

  // Check if symbol is in user's watchlist
  const checkWatchlistStatus = useCallback(async () => {
    if (!userId || !isPaidUser) {
      setIsInWatchlist(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('symbol', symbol.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      setIsInWatchlist(!!data);
    } catch (err) {
      console.error('[CommandCenterChart] watchlist check error:', err);
    }
  }, [userId, isPaidUser, symbol]);

  useEffect(() => {
    checkWatchlistStatus();
  }, [checkWatchlistStatus]);

  // Add to watchlist
  const addToWatchlist = async () => {
    if (!userId) {
      toast.error('Please sign in to add to watchlist');
      return;
    }
    if (!isPaidUser) {
      toast.error('Upgrade to a paid plan to create custom watchlists');
      return;
    }

    setWatchlistLoading(true);
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({
          user_id: userId,
          symbol: symbol.toUpperCase(),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Symbol already in watchlist');
        } else {
          throw error;
        }
      } else {
        toast.success(`${symbol} added to watchlist`);
        setIsInWatchlist(true);
        onWatchlistChange?.();
      }
    } catch (err) {
      console.error('[CommandCenterChart] add to watchlist error:', err);
      toast.error('Failed to add to watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async () => {
    if (!userId) return;

    setWatchlistLoading(true);
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', symbol.toUpperCase());

      if (error) throw error;
      toast.success(`${symbol} removed from watchlist`);
      setIsInWatchlist(false);
      onWatchlistChange?.();
    } catch (err) {
      console.error('[CommandCenterChart] remove from watchlist error:', err);
      toast.error('Failed to remove from watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Whether current timeframe is gated and user is not authenticated
  const isTimeframeGated = AUTH_REQUIRED_TIMEFRAMES.has(timeframe) && !userId;

  const fetchChartData = useCallback(async () => {
    // Don't fetch data for auth-gated timeframes
    if (AUTH_REQUIRED_TIMEFRAMES.has(timeframe) && !userId) {
      setLoading(false);
      setError(null);
      setBars([]);
      return;
    }

    const cacheKey = `${symbol}:${timeframe}`;
    
    // 1. Check in-memory LRU cache first — instant switch
    const cached = symbolDataCache.get(cacheKey);
    if (cached && cached.length > 0) {
      console.log(`[CommandCenterChart] Cache HIT for ${cacheKey} (${cached.length} bars)`);
      setBars(cached);
      updatePriceData(cached);
      setLoading(false);
      setError(null);
      // No immediate background revalidation — the 60s polling handles staleness
      return;
    }

    console.log(`[CommandCenterChart] Cache MISS for ${cacheKey}`);
    setLoading(true);
    setError(null);

    try {
      // Use centralized DATA_COVERAGE limits
      const chartLimits = getChartDataLimits(timeframe as Timeframe);
      const { barLimit, minBarsRequired, daysBack } = chartLimits;

      console.log(`[CommandCenterChart] Fetching ${symbol} ${timeframe}: barLimit=${barLimit}, minBarsRequired=${minBarsRequired}, daysBack=${daysBack}`);

      // Fetch from historical_prices table
      const { data, error: dbError } = await supabase
        .from('historical_prices')
        .select('date, open, high, low, close, volume')
        .eq('symbol', symbol)
        .eq('timeframe', timeframe)
        .order('date', { ascending: true })
        .limit(barLimit);

      if (dbError) throw dbError;

      // Only use DB data if we have enough bars
      const hasEnoughData = data && data.length >= minBarsRequired;
      console.log(`[CommandCenterChart] DB returned ${data?.length || 0} bars, hasEnoughData=${hasEnoughData}`);

      if (!hasEnoughData) {
        // EODHD-first, Yahoo-fallback
        const isHourlyAggregated = ['4h', '8h'].includes(timeframe);
        const lookbackDays = isHourlyAggregated ? 60 : daysBack;
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - lookbackDays);
        
        console.log(`[CommandCenterChart] Using EODHD→Yahoo fallback: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (${lookbackDays} days)`);

        // 8s timeout to fail fast to fallback
        const fetchWithTimeout = Promise.race([
          fetchMarketBars({
            symbol,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            interval: timeframe,
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout fetching market data')), 8000)),
        ]);

        let fetchedBars: CompressedBar[] = [];
        try {
          fetchedBars = await fetchWithTimeout;
        } catch (fetchErr) {
          console.warn('[CommandCenterChart] fetchMarketBars failed/timed out:', fetchErr);
        }

        // Retry with shorter range for intraday if first attempt returned 0
        if (fetchedBars.length === 0 && ['5m', '15m', '30m'].includes(timeframe)) {
          const shortStart = new Date();
          shortStart.setDate(endDate.getDate() - 8);
          console.log(`[CommandCenterChart] Retrying with 8-day range for ${timeframe}`);
          try {
            fetchedBars = await Promise.race([
              fetchMarketBars({
                symbol,
                startDate: shortStart.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                interval: timeframe,
              }),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000)),
            ]);
          } catch (retryErr) {
            console.warn('[CommandCenterChart] Short-range retry also failed:', retryErr);
          }
        }

        if (fetchedBars.length === 0) {
          // Last resort: try to use bars embedded in active pattern detections
          const patternBars = await tryExtractPatternBars(symbol, timeframe);
          if (patternBars.length > 0) {
            console.log(`[CommandCenterChart] Using ${patternBars.length} bars from pattern detection as fallback`);
            symbolDataCache.set(cacheKey, patternBars);
            setBars(patternBars);
            updatePriceData(patternBars);
            setLoading(false);
            return;
          }
          throw new Error('No data available for this symbol/timeframe');
        }

        // Cache the result
        symbolDataCache.set(cacheKey, fetchedBars);
        setBars(fetchedBars);
        updatePriceData(fetchedBars);
      } else {
        const mapped = data.map((row) => ({
          t: row.date,
          o: row.open,
          h: row.high,
          l: row.low,
          c: row.close,
          v: row.volume || 0,
        }));

        // Cache the result
        symbolDataCache.set(cacheKey, mapped);
        setBars(mapped);
        updatePriceData(mapped);
      }
    } catch (err: any) {
      console.error('[CommandCenterChart] fetch error:', err);
      setError(err.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, userId]);

  const updatePriceData = (chartBars: CompressedBar[]) => {
    if (chartBars.length < 2) return;
    
    const latest = chartBars[chartBars.length - 1];
    const prev = chartBars[chartBars.length - 2];
    const change = latest.c - prev.c;
    const changePct = (change / prev.c) * 100;

    setPriceData({
      current: latest.c,
      change,
      changePct,
    });
  };

  // Fetch active live patterns + recent historical for this symbol/timeframe
  const fetchAutoPatterns = useCallback(async () => {
    // Skip pattern fetch for auth-gated timeframes
    if (AUTH_REQUIRED_TIMEFRAMES.has(timeframe) && !userId) {
      setAutoPatterns([]);
      return;
    }

    const upperSymbol = symbol.toUpperCase();
    const isResolvedOutcome = (outcome?: string | null) =>
      ['hit_tp', 'hit_sl', 'timeout', 'win', 'loss'].includes(String(outcome || '').toLowerCase());
    const getDetectedAt = (pattern: any) => pattern.last_confirmed_at || pattern.first_detected_at || pattern.detected_at || '';

    try {
      // Fetch recent live patterns (active + expired)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: liveData } = await supabase
        .from('live_pattern_detections')
        .select('id, pattern_id, pattern_name, direction, first_detected_at, last_confirmed_at, current_price, entry_price, stop_loss_price, take_profit_price, visual_spec, bars, status')
        .eq('instrument', upperSymbol)
        .eq('timeframe', timeframe)
        .in('status', ['active', 'expired'])
        .gte('first_detected_at', ninetyDaysAgo.toISOString())
        .order('last_confirmed_at', { ascending: false })
        .limit(20);

      // Fetch historical patterns (last 365 days for full chart coverage)
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      const { data: historicalData } = await supabase
        .from('historical_pattern_occurrences')
        .select('id, pattern_id, pattern_name, direction, detected_at, entry_price, stop_loss_price, take_profit_price, outcome, visual_spec, bars')
        .eq('symbol', upperSymbol)
        .eq('timeframe', timeframe)
        .gte('detected_at', oneYearAgo.toISOString())
        .order('detected_at', { ascending: false })
        .limit(50);

      // Derive outcome for live patterns using shared utility
      const deriveLiveOutcomeForPattern = (p: any, skipStatusCheck = false): string | null => {
        if (!skipStatusCheck && p.status !== 'active' && p.status !== 'expired') return null;
        const currentBars = symbolDataCache.get(`${symbol}:${timeframe}`) || [];
        return deriveLiveOutcomeUtil({
          direction: p.direction,
          entryPrice: Number(p.entry_price),
          stopLossPrice: Number(p.stop_loss_price),
          takeProfitPrice: Number(p.take_profit_price),
          detectedAt: p.last_confirmed_at || p.first_detected_at || '',
          bars: currentBars,
          status: p.status,
        });
      };

      const combinedPatterns = [
        ...(liveData || []).map(p => {
          const derivedOutcome = deriveLiveOutcomeForPattern(p);
          return {
            ...p,
            outcome: derivedOutcome,
            isActive: p.status === 'active' && !derivedOutcome,
            _derivedOutcome: derivedOutcome,
          };
        }),
        ...(historicalData || []).map(p => {
          const existingOutcome = p.outcome;
          const isAlreadyResolved = ['hit_tp', 'hit_sl', 'timeout', 'win', 'loss'].includes(String(existingOutcome || '').toLowerCase());
          const derivedOutcome = isAlreadyResolved ? null : deriveLiveOutcomeForPattern(p, true);
          return {
            ...p,
            outcome: derivedOutcome || existingOutcome,
            isActive: false,
            _derivedOutcome: derivedOutcome,
          };
        }),
      ];

      // Deduplicate same occurrence across live/historical datasets.
      const bySignature = new Map<string, any>();
      for (const pattern of combinedPatterns) {
        const detectedAt = getDetectedAt(pattern);
        const dayKey = detectedAt ? detectedAt.split('T')[0] : 'unknown';
        const key = `${pattern.pattern_id}|${pattern.direction}|${dayKey}`;
        const existing = bySignature.get(key);

        if (!existing) {
          bySignature.set(key, pattern);
          continue;
        }

        if (isResolvedOutcome(pattern.outcome) && !isResolvedOutcome(existing.outcome)) {
          bySignature.set(key, pattern);
        }
      }

      // Filter out patterns whose pivots are too close for this chart timeframe
      const tfMinSeparationMs: Record<string, number> = {
        '15m': 2 * 15 * 60_000,
        '1h': 2 * 60 * 60_000,
        '4h': 2 * 4 * 60 * 60_000,
        '8h': 2 * 8 * 60 * 60_000,
        '1d': 2 * 24 * 60 * 60_000,
        '1wk': 2 * 7 * 24 * 60 * 60_000,
      };
      const minSepMs = tfMinSeparationMs[timeframe] || 2 * 4 * 60 * 60_000;

      const pivotsFitTimeframe = (pattern: any): boolean => {
        const pivots = pattern.visual_spec?.pivots;
        if (!Array.isArray(pivots) || pivots.length < 2) return true;
        const timestamps = pivots
          .map((p: any) => p.timestamp ? new Date(p.timestamp).getTime() : NaN)
          .filter(Number.isFinite)
          .sort((a: number, b: number) => a - b);
        if (timestamps.length < 2) return true;
        const span = timestamps[timestamps.length - 1] - timestamps[0];
        return span >= minSepMs;
      };

      const deduped = [...bySignature.values()]
        .filter(pivotsFitTimeframe)
        .sort(
          (a, b) => new Date(getDetectedAt(b)).getTime() - new Date(getDetectedAt(a)).getTime()
        );

      setAutoPatterns(deduped);
    } catch (err) {
      console.error('[CommandCenterChart] auto-pattern fetch error:', err);
      setAutoPatterns([]);
    }
  }, [symbol, timeframe, userId]);

  // Clear stale overlays immediately when symbol or timeframe changes
  // This prevents rendering old-symbol pattern overlays on new-symbol candles
  useEffect(() => {
    setAutoPatterns([]);
  }, [symbol, timeframe]);

  // Unified fetch: chart data + auto-patterns in parallel, then start polling
  useEffect(() => {
    let intervalId: number | undefined;

    // Fire both in parallel
    Promise.allSettled([fetchChartData(), fetchAutoPatterns()]).then(() => {
      // Start 60s polling AFTER initial fetch settles
      intervalId = window.setInterval(() => {
        fetchAutoPatterns();
      }, 60_000);
    });

    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [fetchChartData, fetchAutoPatterns]);

  const getDetectedAt = (pattern: any) =>
    pattern.last_confirmed_at || pattern.first_detected_at || pattern.detected_at || '';

  const freshnessHoursByTimeframe: Record<string, number> = {
    '15m': 6,
    '1h': 24,
    '4h': 72,
    '8h': 120,
    '1d': 14 * 24,
    '1wk': 60 * 24,
  };

  const maxEntryDriftPctByTimeframe: Record<string, number> = {
    '15m': 2.5,
    '1h': 4,
    '4h': 6,
    '8h': 8,
    '1d': 12,
    '1wk': 20,
  };

  const freshnessWindowMs = (freshnessHoursByTimeframe[timeframe] ?? 24) * 60 * 60 * 1000;
  const freshnessCutoffTs = Date.now() - freshnessWindowMs;
  const maxEntryDriftPct = maxEntryDriftPctByTimeframe[timeframe] ?? 4;

  const isFreshPattern = (pattern: any) => {
    const ts = new Date(getDetectedAt(pattern)).getTime();
    return Number.isFinite(ts) && ts >= freshnessCutoffTs;
  };

  const isEntryStillTradable = (pattern: any) => {
    const entry = Number(pattern?.entry_price);
    const lastBar = bars.length > 0 ? bars[bars.length - 1] : null;
    const latestClose = Number(lastBar?.c);
    const patternCurrent = Number(pattern?.current_price);

    // Prefer the currently rendered chart price as source of truth.
    // This prevents stale backend snapshot prices from forcing off-scale overlays.
    const referencePrice = Number.isFinite(latestClose) && latestClose > 0
      ? latestClose
      : patternCurrent;

    // If we cannot validate either side, fail closed to avoid misaligned visuals.
    if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(referencePrice) || referencePrice <= 0) {
      return false;
    }

    const driftPct = Math.abs((referencePrice - entry) / entry) * 100;
    return driftPct <= maxEntryDriftPct;
  };

  // Chart markers are NOT generated here — StudyChart's internal pattern overlay
  // rendering (zigzag, markers, price lines) is the single source of truth,
  // using the same code path as the Study page. This prevents duplicate/cluttered markers.
  const chartMarkers: ChartMarker[] = [];


  const actionableActivePatterns = useMemo(
    () =>
      autoPatterns.filter(
        (p) => p.isActive && p.status !== 'expired' && isFreshPattern(p) && isEntryStillTradable(p)
      ),
    [autoPatterns, timeframe, bars]
  );

  const sortedPatterns = useMemo(
    () =>
      [...autoPatterns]
        .filter((p) => !!getDetectedAt(p))
        .sort((a, b) => new Date(getDetectedAt(b)).getTime() - new Date(getDetectedAt(a)).getTime()),
    [autoPatterns]
  );

  const isResolvedOutcome = (outcome?: string | null) =>
    ['hit_tp', 'hit_sl', 'timeout', 'win', 'loss'].includes(String(outcome || '').toLowerCase());

  // Pattern source for visual overlays (polyline/zones/TP-SL lines):
  // Only show active patterns or live-derived outcomes (not yet backend-confirmed).
  // Resolved/historical/stale patterns show nothing on chart.
  // Compute chart price range for overlay validation
  const chartPriceRange = useMemo(() => {
    if (bars.length === 0) return null;
    let min = Infinity, max = -Infinity;
    // Use last 120 bars (visible window) for range calculation
    const visibleBars = bars.slice(-120);
    for (const b of visibleBars) {
      if (b.l < min) min = b.l;
      if (b.h > max) max = b.h;
    }
    return Number.isFinite(min) && Number.isFinite(max) && max > min ? { min, max, span: max - min } : null;
  }, [bars]);

  const overlayPattern = useMemo(() => {
    if (sortedPatterns.length === 0) return null;

    const hasPivots = (p: any) => Array.isArray((p.visual_spec as any)?.pivots) && ((p.visual_spec as any).pivots.length >= 2);
    const activePattern = sortedPatterns.find((p) => p.isActive && p.status !== 'expired');
    const derivedOutcomePattern = sortedPatterns.find((p) => !!p._derivedOutcome);
    const isResolved = (o?: string | null) => ['hit_tp', 'hit_sl', 'timeout', 'win', 'loss'].includes(String(o || '').toLowerCase());
    const latestUnresolved = sortedPatterns.find((p) => !isResolved(p.outcome));
    const preferred = activePattern || derivedOutcomePattern || latestUnresolved || sortedPatterns[0];
    if (!preferred) return null;

    // Price-range overlap check: reject patterns whose entry/SL/TP levels
    // fall entirely outside the chart's visible candle range.
    // This catches stale patterns from weeks/months ago where price has moved
    // significantly but the percentage drift is still within naive thresholds.
    if (chartPriceRange) {
      const entry = Number(preferred.entry_price);
      const sl = Number(preferred.stop_loss_price);
      const tp = Number(preferred.take_profit_price);
      
      if (Number.isFinite(entry) && entry > 0) {
        // Allow a margin of 1x the chart's price span above/below the range
        const margin = chartPriceRange.span;
        const extendedMin = chartPriceRange.min - margin;
        const extendedMax = chartPriceRange.max + margin;
        
        // If entry price is outside the extended range, the pattern is clearly stale
        if (entry < extendedMin || entry > extendedMax) {
          console.warn('[CommandCenterChart] overlayPattern rejected: entry outside chart range', {
            symbol, entry, chartRange: `${chartPriceRange.min.toFixed(4)}-${chartPriceRange.max.toFixed(4)}`,
          });
          return null;
        }
        
        // If ALL trade levels (entry, SL, TP) are outside the candle range, suppress
        const levels = [entry, sl, tp].filter(v => Number.isFinite(v) && v > 0);
        const allOutside = levels.every(l => l < chartPriceRange.min || l > chartPriceRange.max);
        if (allOutside && levels.length > 0) {
          console.warn('[CommandCenterChart] overlayPattern rejected: all levels outside visible range', {
            symbol, levels, chartRange: `${chartPriceRange.min.toFixed(4)}-${chartPriceRange.max.toFixed(4)}`,
          });
          return null;
        }
      }
    }

    // Prefer a pivot-bearing pattern so ZigZag/zone can render.
    return hasPivots(preferred) ? preferred : preferred;
  }, [sortedPatterns, bars, symbol, chartPriceRange]);

  // Derive trade plan from the overlay pattern so TP/SL/Entry lines always match the displayed formation
  const tradePlan = useMemo(() => {
    const currentPattern = overlayPattern;
    if (!currentPattern) return undefined;

    // Suppress trade levels for resolved patterns (SL/TP already hit — no longer actionable)
    const resolvedOutcomes = ['hit_tp', 'hit_sl', 'timeout', 'win', 'loss'];
    if (resolvedOutcomes.includes(String(currentPattern.outcome || '').toLowerCase())) return undefined;

    const { entry_price, stop_loss_price, take_profit_price, direction } = currentPattern;
    if (!entry_price || !stop_loss_price || !take_profit_price) return undefined;
    if (![entry_price, stop_loss_price, take_profit_price].every(p => Number.isFinite(p) && p > 0)) return undefined;

    // Per-level distance guard: skip the tradePlan entirely only if entry itself is too far.
    // Individual SL/TP distance is handled by StudyChart's per-level rendering.
    const lastBar = bars.length > 0 ? bars[bars.length - 1] : null;
    const latestClose = Number(lastBar?.c);
    if (Number.isFinite(latestClose) && latestClose > 0) {
      const entryDist = Math.abs((entry_price - latestClose) / latestClose) * 100;
      if (entryDist > 20) return undefined;
    }

    return {
      entry: entry_price,
      stopLoss: stop_loss_price,
      takeProfit: take_profit_price,
      direction: (direction === 'short' || direction === 'bearish' ? 'short' : 'long') as 'long' | 'short',
    };
  }, [overlayPattern, bars]);

  // Derive formation overlays from selected overlay pattern
  // Formation overlays use the pattern's own bars for time mapping, so we validate
  // that pivot prices fall within the chart's visible price range.
  const formationOverlays: FormationOverlayData[] = useMemo(() => {
    if (!overlayPattern || bars.length === 0) return [];

    const vs = overlayPattern.visual_spec as any;
    const pivots = vs?.pivots;

    // Validate pivot prices against chart range to prevent zigzag rendering
    // at completely disconnected price levels
    if (chartPriceRange && Array.isArray(pivots) && pivots.length >= 2) {
      const pivotPrices = pivots.map((p: any) => Number(p.price)).filter(Number.isFinite);
      if (pivotPrices.length > 0) {
        const pivotMin = Math.min(...pivotPrices);
        const pivotMax = Math.max(...pivotPrices);
        const margin = chartPriceRange.span;
        // If the entire pivot range is outside the extended chart range, skip
        if (pivotMax < chartPriceRange.min - margin || pivotMin > chartPriceRange.max + margin) {
          console.warn('[CommandCenterChart] formationOverlay rejected: pivots outside chart range', {
            symbol, pivotRange: `${pivotMin.toFixed(4)}-${pivotMax.toFixed(4)}`,
            chartRange: `${chartPriceRange.min.toFixed(4)}-${chartPriceRange.max.toFixed(4)}`,
          });
          return [];
        }
      }
    }

    const patternBars = overlayPattern.bars as CompressedBar[] | undefined;
    const barsToUse = patternBars && patternBars.length > 0 ? patternBars : bars;
    const formation = deriveFormationOverlay(pivots, barsToUse, vs?.patternId || overlayPattern.pattern_id);

    return formation ? [formation] : [];
  }, [overlayPattern, bars, chartPriceRange]);

  // Pass selected overlay pattern for TP/SL lines, zigzag, and zones
  const historicalPatternOverlays: HistoricalPatternOverlay[] = useMemo(() => {
    if (!overlayPattern) return [];

    return [{
      id: overlayPattern.id,
      patternName: PATTERN_DISPLAY_NAMES[overlayPattern.pattern_id] || overlayPattern.pattern_name,
      patternId: overlayPattern.pattern_id,
      direction: (overlayPattern.direction === 'bullish' ? 'long' : overlayPattern.direction === 'bearish' ? 'short' : overlayPattern.direction) as 'long' | 'short',
      detectedAt: getDetectedAt(overlayPattern),
      entryPrice: overlayPattern.entry_price,
      stopLossPrice: overlayPattern.stop_loss_price,
      takeProfitPrice: overlayPattern.take_profit_price,
      outcome: overlayPattern.outcome ?? null,
      outcomePnlPercent: overlayPattern.outcome_pnl_percent ?? null,
      isActive: !!overlayPattern.isActive,
      status: overlayPattern.status ?? null,
      pivots: (overlayPattern.visual_spec as any)?.pivots,
      bars: overlayPattern.bars,
    }];
  }, [overlayPattern]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
  };

  // getTrendIcon removed — no longer shown in compact header

  const getChangeColor = () => {
    if (!priceData) return 'text-muted-foreground';
    if (priceData.change > 0) return 'text-emerald-500';
    if (priceData.change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chart Header — TradingView-style: compact, information-dense */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <InstrumentLogo instrument={symbol} size="sm" showName={false} />
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold tracking-tight">{symbol}</span>
            {priceData && (
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold font-mono tabular-nums tracking-tight">
                  {formatPrice(priceData.current)}
                </span>
                <span className={`text-[13px] font-bold font-mono tabular-nums ${getChangeColor()}`}>
                  {priceData.change >= 0 ? '+' : ''}{priceData.changePct.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          {onSymbolChange && (
            <UniversalSymbolSearch
              onSelect={(sym) => onSymbolChange(sym)}
              trigger={
                <button className="h-6 px-2 flex items-center gap-1.5 text-[13px] text-muted-foreground/70 hover:text-muted-foreground rounded border border-border/40 hover:border-border transition-colors">
                  <Search className="h-3 w-3" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              }
            />
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Timeframe pills — TradingView style */}
          <div className="flex items-center mr-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => {
                  if (tf.requiresAuth && !userId) {
                    requireAuth(() => onTimeframeChange(tf.value));
                  } else {
                    onTimeframeChange(tf.value);
                  }
                }}
                className={cn(
                  "h-6 px-2 text-[13px] font-semibold rounded transition-colors relative",
                  timeframe === tf.value
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted/30"
                )}
              >
                {tf.label}
                {tf.requiresAuth && !userId && <Lock className="h-2 w-2 absolute -top-0.5 -right-0.5 text-muted-foreground/50" />}
              </button>
            ))}
          </div>

          {/* Watchlist star */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 transition-colors"
                onClick={isInWatchlist ? removeFromWatchlist : addToWatchlist}
                disabled={watchlistLoading}
              >
                {watchlistLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : isInWatchlist ? (
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                ) : (
                  <StarOff className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </TooltipContent>
          </Tooltip>

          {/* Refresh */}
          <button
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/50 transition-colors text-muted-foreground/50 hover:text-muted-foreground"
            onClick={async () => {
              await Promise.all([fetchChartData(), fetchAutoPatterns()]);
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* TradingView link */}
          {!isMobile && (
            <a
              href={`https://www.tradingview.com/chart/?symbol=${symbol}&aff_id=3433`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-6 px-2 flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground rounded hover:bg-muted/30 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              TV
            </a>
          )}
        </div>
      </div>

      {/* Chart Content — maximum space */}
      <div className="flex-1 min-h-0">
        {isTimeframeGated ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3 max-w-sm mx-auto">
              <div className="mx-auto w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Sign in for {timeframe} charts</p>
              <p className="text-xs text-muted-foreground">Intraday timeframes require a free account.</p>
              <Button size="sm" onClick={() => setShowAuthDialog(true)}>
                Sign in
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
            <Skeleton className="h-[60%] w-[80%] rounded" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={fetchChartData} className="text-xs text-muted-foreground hover:text-foreground underline">
                Retry
              </button>
            </div>
          </div>
        ) : bars.length > 0 ? (
          <div className="h-full relative">
            <StudyChart 
              bars={bars} 
              symbol={symbol} 
              timeframe={timeframe}
              autoHeight 
              tradePlan={tradePlan}
              onSendToCopilot={(context, analysis) => copilot.openWithAnalysis(context, analysis)}
              chartMarkers={chartMarkers}
              formationOverlays={formationOverlays}
              historicalPatterns={historicalPatternOverlays}
              initialVisibleBars={
                timeframe === '15m' ? 120 
                : timeframe === '1h' ? 100 
                : timeframe === '4h' ? 80 
                : timeframe === '8h' ? 60 
                : timeframe === '1d' ? 80 
                : timeframe === '1wk' ? 52 
                : 80
              }
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No data available for {symbol}
          </div>
        )}
      </div>
      <AuthGateDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} featureLabel="intraday charts" />
    </div>
  );
});
