import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sunrise, TrendingUp, TrendingDown, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
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

export function MorningBriefing({ userId, onSymbolSelect, onPatternClick }: MorningBriefingProps) {
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
      // Get top active patterns sorted by quality + trend alignment
      let query = supabase
        .from('live_pattern_detections')
        .select('id, instrument, pattern_name, direction, quality_score, entry_price, risk_reward_ratio, timeframe, trend_alignment, trend_indicators')
        .eq('status', 'active')
        .in('quality_score', ['A', 'B'])
        .order('first_detected_at', { ascending: false })
        .limit(50);

      // If user has watchlist, prefer their symbols
      if (userId) {
        const { data: wl } = await supabase
          .from('user_watchlist')
          .select('symbol')
          .eq('user_id', userId)
          .limit(30);
        
        const watchlistSymbols = (wl || []).map(w => w.symbol);
        
        if (watchlistSymbols.length > 0) {
          // First try watchlist-only
          const { data: wlPatterns } = await supabase
            .from('live_pattern_detections')
            .select('id, instrument, pattern_name, direction, quality_score, entry_price, risk_reward_ratio, timeframe, trend_alignment, trend_indicators')
            .eq('status', 'active')
            .in('quality_score', ['A', 'B'])
            .in('instrument', watchlistSymbols)
            .order('first_detected_at', { ascending: false })
            .limit(20);

          if (wlPatterns && wlPatterns.length >= 3) {
            const scored = scoreAndSort(wlPatterns);
            setSetups(scored.slice(0, 5));
            setCachedBriefing(scored.slice(0, 5));
            setLoading(false);
            return;
          }
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const scored = scoreAndSort(data || []);
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
  }, [userId]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border w-full"
      >
        <Sparkles className="h-3 w-3 text-amber-500" />
        <span>{t('dashboard.showBriefing', 'Show morning briefing')}</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">{setups.length}</Badge>
      </button>
    );
  }

  return (
    <div className="border-b border-border bg-gradient-to-r from-amber-500/5 via-transparent to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold">{t('dashboard.morningBriefing', "Today's Top Setups")}</span>
          <Badge variant="secondary" className="text-[10px]">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => fetchBriefing(true)}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCollapsed(true)}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Setups */}
      <div className="flex gap-2 px-3 pb-2 overflow-x-auto scrollbar-thin">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-40 shrink-0 rounded-lg" />
          ))
        ) : setups.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">{t('dashboard.noSetups', 'No high-quality setups detected today')}</p>
        ) : (
          setups.map((setup) => (
            <button
              key={setup.id}
              onClick={() => {
                onSymbolSelect(setup.instrument);
                onPatternClick?.(setup);
              }}
              className="shrink-0 flex items-start gap-2 rounded-lg border border-border bg-card/50 hover:bg-accent/50 transition-colors p-2 text-left min-w-[160px] max-w-[200px]"
            >
              <InstrumentLogo symbol={setup.instrument} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold truncate">{setup.instrument}</span>
                  {setup.direction === 'long' ? (
                    <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {setup.pattern_name.replace(/-/g, ' ')}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1 py-0 h-4",
                      setup.quality_score === 'A' && "border-green-500/50 text-green-600",
                      setup.quality_score === 'B' && "border-blue-500/50 text-blue-600",
                    )}
                  >
                    {setup.quality_score}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">{setup.timeframe}</span>
                  {setup.trend_alignment === 'with_trend' && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">↑ Trend</Badge>
                  )}
                  <span className="text-[9px] font-mono text-muted-foreground ml-auto">
                    {setup.confidence}/100
                  </span>
                </div>
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
      // Quality: A=30, B=20
      if (p.quality_score === 'A') score += 30;
      else if (p.quality_score === 'B') score += 20;
      // Trend alignment: with_trend=25
      if (p.trend_alignment === 'with_trend') score += 25;
      else if (p.trend_alignment === 'neutral') score += 10;
      // R:R bonus
      score += Math.min(20, (p.risk_reward_ratio || 2) * 5);
      // Normalize to 0-100
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
