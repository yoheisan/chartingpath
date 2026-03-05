import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Sunrise, TrendingUp, TrendingDown, ChevronRight, Sparkles, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface MorningBriefingProps {
  userId?: string;
  onSymbolSelect: (symbol: string) => void;
  onPatternClick?: (pattern: BriefingSetup) => void;
}

export interface BriefingSetup {
  id: string;
  instrument: string;
  pattern_name: string;
  direction: string;
  quality_score: string | null;
  confidence: number;
  entry_price: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  risk_reward_ratio: number;
  timeframe: string;
  trend_alignment: string | null;
  /** Client-derived outcome: 'hit_sl' | 'hit_tp' | null (still active) */
  liveOutcome?: string | null;
}

const BRIEFING_CACHE_KEY = 'cp-morning-briefing';
const BRIEFING_REFRESH_MS = 5 * 60 * 1000; // 5 minutes — matches scan cadence
const LIVE_CHECK_MS = 60 * 1000; // Check SL/TP every 60 seconds

interface CachedBriefing {
  date: string;
  setups: BriefingSetup[];
  ts: number;
}

function getCachedBriefing(): CachedBriefing | null {
  try {
    const raw = localStorage.getItem(BRIEFING_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedBriefing = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.date !== today) return null;
    if (Date.now() - parsed.ts > BRIEFING_REFRESH_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedBriefing(setups: BriefingSetup[]) {
  try {
    const entry: CachedBriefing = {
      date: new Date().toISOString().slice(0, 10),
      setups,
      ts: Date.now(),
    };
    localStorage.setItem(BRIEFING_CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

/** Filter setups to only those with seeded price data in historical_prices */
async function filterSeededSetups(patterns: any[]): Promise<any[]> {
  if (patterns.length === 0) return [];
  const symbols = [...new Set(patterns.map(p => p.instrument))];
  const timeframes = [...new Set(patterns.map(p => p.timeframe))];
  const { data: seeded } = await supabase
    .from('historical_prices')
    .select('symbol, timeframe')
    .in('symbol', symbols)
    .in('timeframe', timeframes)
    .limit(500);

  if (!seeded || seeded.length === 0) {
    console.warn('[MorningBriefing] No seeded data found, hiding all setups');
    return [];
  }

  const seededSet = new Set(seeded.map(s => `${s.symbol}|${s.timeframe}`));
  const filtered = patterns.filter(p => seededSet.has(`${p.instrument}|${p.timeframe}`));
  console.log(`[MorningBriefing] ${patterns.length} setups → ${filtered.length} with seeded data`);
  return filtered;
}

/**
 * Check if current price has breached SL or TP for a setup.
 * Returns 'hit_sl', 'hit_tp', or null.
 */
async function checkLiveOutcomes(setups: BriefingSetup[]): Promise<BriefingSetup[]> {
  if (setups.length === 0) return setups;

  // Batch fetch latest price for each unique symbol+timeframe
  const combos = [...new Set(setups.map(s => `${s.instrument}|${s.timeframe}`))];
  const priceMap = new Map<string, { high: number; low: number; close: number }>();

  await Promise.all(
    combos.map(async (combo) => {
      const [symbol, tf] = combo.split('|');
      const { data } = await supabase
        .from('historical_prices')
        .select('high, low, close')
        .eq('symbol', symbol)
        .eq('timeframe', tf)
        .order('date', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        // Check across last 5 bars for breach
        let maxHigh = -Infinity;
        let minLow = Infinity;
        for (const bar of data) {
          maxHigh = Math.max(maxHigh, bar.high);
          minLow = Math.min(minLow, bar.low);
        }
        priceMap.set(combo, { high: maxHigh, low: minLow, close: data[0].close });
      }
    })
  );

  return setups.map((setup) => {
    const key = `${setup.instrument}|${setup.timeframe}`;
    const price = priceMap.get(key);
    if (!price) return { ...setup, liveOutcome: null };

    const sl = Number(setup.stop_loss_price);
    const tp = Number(setup.take_profit_price);
    const isLong = setup.direction === 'long' || setup.direction === 'bullish';

    if (isLong) {
      if (Number.isFinite(sl) && price.low <= sl) return { ...setup, liveOutcome: 'hit_sl' };
      if (Number.isFinite(tp) && price.high >= tp) return { ...setup, liveOutcome: 'hit_tp' };
    } else {
      if (Number.isFinite(sl) && price.high >= sl) return { ...setup, liveOutcome: 'hit_sl' };
      if (Number.isFinite(tp) && price.low <= tp) return { ...setup, liveOutcome: 'hit_tp' };
    }

    return { ...setup, liveOutcome: null };
  });
}

export function MorningBriefing({ userId, onSymbolSelect, onPatternClick }: MorningBriefingProps) {
  const { t } = useTranslation();
  const [setups, setSetups] = useState<BriefingSetup[]>(() => getCachedBriefing()?.setups || []);
  const [loading, setLoading] = useState(!getCachedBriefing());
  const [collapsed, setCollapsed] = useState(false);

  const fetchBriefing = useCallback(async (force = false) => {
    if (!force && getCachedBriefing()) {
      const cached = getCachedBriefing()!.setups;
      // Still run live outcome check on cached data, then keep only active setups
      const withOutcomes = await checkLiveOutcomes(cached);
      const actionable = withOutcomes.filter(s => !s.liveOutcome);
      setSetups(actionable);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let rawPatterns: any[] = [];

      // If user has a watchlist, try watchlist-first
      if (userId) {
        const { data: wl } = await supabase
          .from('user_watchlist')
          .select('symbol')
          .eq('user_id', userId)
          .limit(30);

        const watchlistSymbols = (wl || []).map(w => w.symbol);

        if (watchlistSymbols.length > 0) {
          const { data: wlPatterns } = await supabase
            .from('live_pattern_detections')
            .select('id, instrument, pattern_name, direction, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, timeframe, trend_alignment, trend_indicators, first_detected_at, last_confirmed_at')
            .eq('status', 'active')
            .in('quality_score', ['A', 'B', 'C'])
            .in('instrument', watchlistSymbols)
            .order('first_detected_at', { ascending: false })
            .limit(20);

          if (wlPatterns && wlPatterns.length >= 3) {
            rawPatterns = wlPatterns;
          }
        }
      }

      // Fallback: global top setups — prefer A/B but include C for pool depth
      if (rawPatterns.length === 0) {
        // First try A/B only
        const { data: abData } = await supabase
          .from('live_pattern_detections')
          .select('id, instrument, pattern_name, direction, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, timeframe, trend_alignment, trend_indicators, first_detected_at, last_confirmed_at')
          .eq('status', 'active')
          .in('quality_score', ['A', 'B'])
          .order('first_detected_at', { ascending: false })
          .limit(50);

        rawPatterns = abData || [];

        // If fewer than 5 A/B setups, widen to include C
        if (rawPatterns.length < 5) {
          const { data: abcData } = await supabase
            .from('live_pattern_detections')
            .select('id, instrument, pattern_name, direction, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, timeframe, trend_alignment, trend_indicators, first_detected_at, last_confirmed_at')
            .eq('status', 'active')
            .in('quality_score', ['A', 'B', 'C'])
            .order('first_detected_at', { ascending: false })
            .limit(50);
          rawPatterns = abcData || [];
        }
      }

      const seededPatterns = await filterSeededSetups(rawPatterns);
      const scored = scoreAndSort(seededPatterns);
      const top = scored.slice(0, 5);
      
      // Check live outcomes, then keep only active setups (hide resolved SL/TP)
      const withOutcomes = await checkLiveOutcomes(top);
      const actionable = withOutcomes.filter(s => !s.liveOutcome);
      setSetups(actionable);
      setCachedBriefing(actionable);
    } catch (err) {
      console.error('[MorningBriefing] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Periodic live outcome check (every 60s) — lightweight, just checks latest prices
  const refreshOutcomes = useCallback(async () => {
    if (setups.length === 0) return;
    const updated = await checkLiveOutcomes(setups);
    const actionable = updated.filter(s => !s.liveOutcome);
    // Only update state if visible active setups changed
    const changed = actionable.length !== setups.length || actionable.some((s, i) => s.id !== setups[i]?.id);
    if (changed) {
      setSetups(actionable);
      console.log('[MorningBriefing] Active setup set changed, updating strip');
    }
  }, [setups]);

  useEffect(() => {
    fetchBriefing();
    // Full refresh every 30 minutes
    const fullInterval = setInterval(() => fetchBriefing(true), BRIEFING_REFRESH_MS);
    // Lightweight SL/TP check every 60 seconds
    const liveInterval = setInterval(refreshOutcomes, LIVE_CHECK_MS);
    return () => {
      clearInterval(fullInterval);
      clearInterval(liveInterval);
    };
  }, [fetchBriefing, refreshOutcomes]);

  // Count active (non-resolved) setups
  const activeSetups = setups.filter(s => !s.liveOutcome);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 px-3 h-6 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors border-b border-border/30 w-full shrink-0"
      >
        <Sparkles className="h-2.5 w-2.5" />
        <span>{t('dashboard.showBriefing', 'Show briefing')}</span>
        <span className="text-xs ml-auto tabular-nums">{activeSetups.length}</span>
      </button>
    );
  }

  return (
    <div className="border-b border-border/30 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-7">
        <div className="flex items-center gap-1.5">
          <Sunrise className="h-3 w-3 text-amber-500/70" />
          <span className="text-xs font-medium text-muted-foreground">{t('dashboard.morningBriefing', "Today's Setups")}</span>
          {setups.some(s => s.liveOutcome) && (
            <span className="text-[10px] text-muted-foreground/50 ml-1">
              {activeSetups.length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted/30 transition-colors text-muted-foreground/50"
            onClick={() => fetchBriefing(true)}
            disabled={loading}
          >
            <RefreshCw className={cn("h-2.5 w-2.5", loading && "animate-spin")} />
          </button>
          <button
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted/30 transition-colors text-muted-foreground/50"
            onClick={() => setCollapsed(true)}
          >
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* Setups — compact horizontal strip */}
      <div className="flex gap-1.5 px-3 pb-1.5 overflow-x-auto scrollbar-thin">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 shrink-0 rounded" />
          ))
        ) : setups.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-1">{t('dashboard.noSetups', 'No setups today')}</p>
        ) : (
          setups.map((setup) => {
            const isHitSl = setup.liveOutcome === 'hit_sl';
            const isHitTp = setup.liveOutcome === 'hit_tp';
            const isResolved = isHitSl || isHitTp;

            return (
              <button
                key={setup.id}
                onClick={() => {
                  onSymbolSelect(setup.instrument);
                  onPatternClick?.(setup);
                }}
                className={cn(
                  "shrink-0 flex items-center gap-2 rounded border transition-colors px-2 py-1 text-left relative",
                  isResolved
                    ? "border-border/20 opacity-60 hover:opacity-80"
                    : "border-border/30 hover:border-border/60 hover:bg-muted/20"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-[13px] font-medium",
                      isResolved && "line-through decoration-1"
                    )}>
                      {setup.instrument}
                    </span>
                    {isResolved ? (
                      isHitTp ? (
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-2.5 w-2.5 text-red-500 shrink-0" />
                      )
                    ) : setup.direction === 'long' ? (
                      <TrendingUp className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 text-red-500 shrink-0" />
                    )}
                    {!isResolved && (
                      <span className={cn(
                        "text-xs font-mono",
                        setup.quality_score === 'A' ? "text-emerald-500" : "text-blue-500",
                      )}>
                        {setup.quality_score}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60 truncate max-w-[120px]">
                    {isResolved
                      ? (isHitTp ? 'TP Hit ✓' : 'SL Hit ✗')
                      : `${setup.pattern_name.replace(/-/g, ' ')} · ${setup.timeframe}`
                    }
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/** Score patterns by quality + trend + R:R and sort descending */
function scoreAndSort(patterns: any[]): BriefingSetup[] {
  return patterns
    .map((p) => {
      let score = 0;
      if (p.quality_score === 'A') score += 30;
      else if (p.quality_score === 'B') score += 20;
      if (p.trend_alignment === 'with_trend') score += 25;
      else if (p.trend_alignment === 'neutral') score += 10;
      score += Math.min(20, (p.risk_reward_ratio || 2) * 5);
      const confidence = Math.min(100, Math.round(score * 1.2));

      return {
        id: p.id,
        instrument: p.instrument,
        pattern_name: p.pattern_name,
        direction: p.direction,
        quality_score: p.quality_score,
        confidence,
        entry_price: p.entry_price,
        stop_loss_price: p.stop_loss_price,
        take_profit_price: p.take_profit_price,
        risk_reward_ratio: p.risk_reward_ratio,
        timeframe: p.timeframe,
        trend_alignment: p.trend_alignment,
        liveOutcome: null,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}
