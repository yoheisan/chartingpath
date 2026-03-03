import { useState, useEffect } from 'react';
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
  risk_reward_ratio: number;
  timeframe: string;
  trend_alignment: string | null;
}

const BRIEFING_CACHE_KEY = 'cp-morning-briefing';
const BRIEFING_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

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
    // Stale after 30 minutes
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

  // Get unique symbol+timeframe combos
  const combos = [...new Set(patterns.map(p => `${p.instrument}|${p.timeframe}`))];
  const symbols = [...new Set(patterns.map(p => p.instrument))];
  const timeframes = [...new Set(patterns.map(p => p.timeframe))];

  // Check which symbols have data in historical_prices for their timeframe
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


  const { t } = useTranslation();
  const [setups, setSetups] = useState<BriefingSetup[]>(() => getCachedBriefing()?.setups || []);
  const [loading, setLoading] = useState(!getCachedBriefing());
  const [collapsed, setCollapsed] = useState(false);

  const fetchBriefing = async (force = false) => {
    if (!force && getCachedBriefing()) {
      setSetups(getCachedBriefing()!.setups);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('live_pattern_detections')
        .select('id, instrument, pattern_name, direction, quality_score, entry_price, risk_reward_ratio, timeframe, trend_alignment, trend_indicators')
        .eq('status', 'active')
        .in('quality_score', ['A', 'B'])
        .order('first_detected_at', { ascending: false })
        .limit(50);

      let rawPatterns: any[] = [];

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
            .select('id, instrument, pattern_name, direction, quality_score, entry_price, risk_reward_ratio, timeframe, trend_alignment, trend_indicators')
            .eq('status', 'active')
            .in('quality_score', ['A', 'B'])
            .in('instrument', watchlistSymbols)
            .order('first_detected_at', { ascending: false })
            .limit(20);

          if (wlPatterns && wlPatterns.length >= 3) {
            rawPatterns = wlPatterns;
          }
        }
      }

      if (rawPatterns.length === 0) {
        const { data, error } = await query;
        if (error) throw error;
        rawPatterns = data || [];
      }

      // Filter to only setups that have seeded price data in the DB
      const seededPatterns = await filterSeededSetups(rawPatterns);

      const scored = scoreAndSort(seededPatterns);
      const top = scored.slice(0, 5);
      setSetups(top);
      setCachedBriefing(top);
    } catch (err) {
      console.error('[MorningBriefing] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
    // Auto-refresh every 30 minutes to match the 1H live-scan cadence
    const interval = setInterval(() => fetchBriefing(true), BRIEFING_REFRESH_MS);
    return () => clearInterval(interval);
  }, [userId]);

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
      {/* Header — minimal */}
      <div className="flex items-center justify-between px-3 h-7">
        <div className="flex items-center gap-1.5">
          <Sunrise className="h-3 w-3 text-amber-500/70" />
          <span className="text-xs font-medium text-muted-foreground">{t('dashboard.morningBriefing', "Today's Setups")}</span>
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
                  <span className="text-[13px] font-medium">{setup.instrument}</span>
                  {setup.direction === 'long' ? (
                    <TrendingUp className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5 text-red-500 shrink-0" />
                  )}
                  <span className={cn(
                    "text-xs font-mono",
                    setup.quality_score === 'A' ? "text-emerald-500" : "text-blue-500",
                  )}>
                    {setup.quality_score}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/60 truncate max-w-[120px]">
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
        risk_reward_ratio: p.risk_reward_ratio,
        timeframe: p.timeframe,
        trend_alignment: p.trend_alignment,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}
