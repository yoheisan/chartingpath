import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Sunrise, TrendingUp, TrendingDown, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
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
}

const BRIEFING_CACHE_KEY = 'cp-morning-briefing-v2';
const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes for instant paint
const MAX_SETUPS = 8;

// Minimum quality: A, B, C allowed. Never D.
const ALLOWED_QUALITY = ['A', 'B', 'C'];

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
    if (Date.now() - parsed.ts > CACHE_VALIDITY_MS) return null;
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

function clearCachedBriefing() {
  try { localStorage.removeItem(BRIEFING_CACHE_KEY); } catch {}
}

/** Score patterns by quality + trend + R:R and sort best-first */
function scoreAndSort(patterns: any[]): BriefingSetup[] {
  return patterns
    .map((p) => {
      let score = 0;
      // Quality weighting: A >> B > C
      if (p.quality_score === 'A') score += 40;
      else if (p.quality_score === 'B') score += 25;
      else if (p.quality_score === 'C') score += 10;
      // Trend alignment
      if (p.trend_alignment === 'with_trend') score += 25;
      else if (p.trend_alignment === 'neutral') score += 10;
      // R:R bonus (capped)
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
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Fetch top active setups from DB.
 * Prioritizes A/B quality, fills with C if needed. Never D.
 * Diversifies across asset types for better coverage.
 */
async function fetchTopSetups(userId?: string): Promise<BriefingSetup[]> {
  const selectCols = 'id, instrument, pattern_name, direction, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, timeframe, trend_alignment, first_detected_at, last_confirmed_at, asset_type';

  let rawPatterns: any[] = [];

  // 1. Try watchlist-first for logged-in users
  if (userId) {
    const { data: wl } = await supabase
      .from('user_watchlist')
      .select('symbol')
      .eq('user_id', userId)
      .limit(30);

    const watchlistSymbols = (wl || []).map((w: any) => w.symbol);

    if (watchlistSymbols.length > 0) {
      const { data: wlPatterns } = await supabase
        .from('live_pattern_detections')
        .select(selectCols)
        .eq('status', 'active')
        .in('quality_score', ALLOWED_QUALITY)
        .in('instrument', watchlistSymbols)
        .order('first_detected_at', { ascending: false })
        .limit(30);

      if (wlPatterns && wlPatterns.length >= 3) {
        rawPatterns = wlPatterns;
      }
    }
  }

  // 2. Fallback: global top setups across asset types
  if (rawPatterns.length === 0) {
    // Fetch a larger pool to allow quality-based sorting
    const { data, error } = await supabase
      .from('live_pattern_detections')
      .select(selectCols)
      .eq('status', 'active')
      .in('quality_score', ALLOWED_QUALITY)
      .order('first_detected_at', { ascending: false })
      .limit(80);

    if (error) throw error;
    rawPatterns = data || [];
  }

  // 3. Diversify: max 2 setups per asset_type to spread across markets
  const byAsset = new Map<string, any[]>();
  for (const p of rawPatterns) {
    const at = p.asset_type || 'unknown';
    if (!byAsset.has(at)) byAsset.set(at, []);
    byAsset.get(at)!.push(p);
  }

  // Round-robin pick from each asset type, best quality first within each
  const diversified: any[] = [];
  const maxPerAsset = 3;
  let round = 0;
  while (diversified.length < 30 && round < maxPerAsset) {
    for (const [, patterns] of byAsset) {
      if (round < patterns.length && diversified.length < 30) {
        diversified.push(patterns[round]);
      }
    }
    round++;
  }

  // 4. Score, sort, and take top N
  const scored = scoreAndSort(diversified);
  return scored.slice(0, MAX_SETUPS);
}

export function MorningBriefing({ userId, onSymbolSelect, onPatternClick }: MorningBriefingProps) {
  const { t } = useTranslation();
  const [setups, setSetups] = useState<BriefingSetup[]>(() => getCachedBriefing()?.setups || []);
  const [loading, setLoading] = useState(!getCachedBriefing());
  const [collapsed, setCollapsed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef = useRef(false);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const loadSetups = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;

    // Use cache if valid and not forced
    if (!force) {
      const cached = getCachedBriefing();
      if (cached) {
        setSetups(cached.setups);
        setLoading(false);
        return;
      }
    }

    if (force) clearCachedBriefing();

    fetchingRef.current = true;
    setLoading(true);
    try {
      const fresh = await fetchTopSetups(userIdRef.current);
      setSetups(fresh);
      setCachedBriefing(fresh);
      console.log(`[MorningBriefing] Loaded ${fresh.length} setups (force=${force})`);
    } catch (err) {
      console.error('[MorningBriefing] fetch error:', err);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh interval
  useEffect(() => {
    loadSetups();
    intervalRef.current = setInterval(() => loadSetups(true), AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadSetups]);

  // Manual refresh — bypass guard by resetting it first
  const handleRefresh = useCallback(() => {
    fetchingRef.current = false;
    loadSetups(true);
  }, [loadSetups]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 px-3 h-6 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors border-b border-border/30 w-full shrink-0"
      >
        <Sparkles className="h-2.5 w-2.5" />
        <span>{t('dashboard.showBriefing', 'Show briefing')}</span>
        <span className="text-xs ml-auto tabular-nums">{setups.length}</span>
      </button>
    );
  }

  return (
    <div className="border-b border-border/30 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-7">
        <div className="flex items-center gap-1.5">
          <Sunrise className="h-3 w-3 text-amber-500/70" />
          <span className="text-xs font-medium text-muted-foreground">
            {t('dashboard.morningBriefing', "Today's Top Setups")}
          </span>
          <span className="text-[10px] text-muted-foreground/50 ml-1">
            {setups.length} active
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted/30 transition-colors text-muted-foreground/50 hover:text-muted-foreground"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh setups"
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
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 shrink-0 rounded" />
          ))
        ) : setups.length === 0 ? (
          <div className="flex items-center gap-2 py-1">
            <p className="text-xs text-muted-foreground/60">{t('dashboard.noSetups', 'No active setups')}</p>
            <button
              onClick={handleRefresh}
              className="text-xs text-primary hover:underline"
            >
              Refresh
            </button>
          </div>
        ) : (
          setups.map((setup) => (
            <button
              key={setup.id}
              onClick={() => {
                onSymbolSelect(setup.instrument);
                onPatternClick?.(setup);
              }}
              className="shrink-0 flex items-center gap-2 rounded border border-border/30 hover:border-border/60 hover:bg-muted/20 transition-colors px-2 py-1 text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-medium">
                    {setup.instrument}
                  </span>
                  {setup.direction === 'long' ? (
                    <TrendingUp className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 text-red-500 shrink-0" />
                  )}
                  <span className={cn(
                    "text-xs font-mono",
                    setup.quality_score === 'A' ? "text-emerald-500" :
                    setup.quality_score === 'B' ? "text-primary" :
                    "text-muted-foreground",
                  )}>
                    {setup.quality_score}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/60 truncate max-w-[140px]">
                  {setup.pattern_name.replace(/-/g, ' ')} · {setup.timeframe}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
