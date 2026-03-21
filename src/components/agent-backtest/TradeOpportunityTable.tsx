import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { usePaperTradeEntry } from '@/hooks/usePaperTradeEntry';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AgentWeights } from '../../../engine/backtester-v2/agents/types';
import { Brain, Shield, Clock, TrendingUp, TrendingDown, Minus, Play, Info, Plus, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LiveDetectionRow } from '@/hooks/useAgentScoringDetections';
import { AgentScoreRow } from '@/hooks/useAgentScoringDetections';
import { useTranslation } from 'react-i18next';
import { UpcomingEconomicEvent, computeTimingFromEvents } from '@/hooks/useUpcomingEconomicEvents';
import { computePortfolioScore } from '@/hooks/usePortfolioExposure';
import { formatDistanceToNow } from 'date-fns';

const PATTERN_NAME_TO_ID: Record<string, string> = {
  'Bull Flag': 'bull_flag',
  'Bear Flag': 'bear_flag',
  'Ascending Triangle': 'ascending_triangle',
  'Descending Triangle': 'descending_triangle',
  'Head & Shoulders': 'head_and_shoulders',
  'Inv Head & Shoulders': 'inverse_head_and_shoulders',
  'Double Top': 'double_top',
  'Double Bottom': 'double_bottom',
  'Cup & Handle': 'cup_and_handle',
  'Rising Wedge': 'rising_wedge',
  'Descending Wedge': 'falling_wedge',
  'Falling Wedge': 'falling_wedge',
  'Donchian Breakout': 'donchian_breakout_long',
  'Donchian Breakout Long': 'donchian_breakout_long',
  'Donchian Breakout Short': 'donchian_breakout_short',
  'Symmetrical Triangle': 'ascending_triangle',
  'Bull Pennant': 'bull_flag',
  'Triple Top': 'triple_top',
  'Triple Bottom': 'triple_bottom',
};

const PROOF_GATE_MIN_SAMPLE = 15;
const PROOF_GATE_MIN_WIN_RATE = 0.45;

export function isProven(d: LiveDetectionRow): boolean {
  const hp = d.historical_performance as any;
  if (!hp) return false;
  const sampleSize = hp.sampleSize ?? hp.sample_size ?? 0;
  const winRate = hp.winRate ?? hp.win_rate ?? 0;
  return sampleSize >= PROOF_GATE_MIN_SAMPLE && winRate >= PROOF_GATE_MIN_WIN_RATE;
}

export interface TradeSetup {
  symbol: string;
  patternId: string;
  pattern: string;
  timeframe: string;
  assetType?: string;
}

export type AssetClassFilter = 'all' | 'stocks' | 'crypto' | 'forex' | 'commodities';

interface Props {
  weights: AgentWeights;
  takeCutoff: number;
  watchCutoff: number;
  detections: LiveDetectionRow[];
  isLoading?: boolean;
  onSendToBacktest?: (setup: TradeSetup) => void;
  basketSelections?: string[];
  onToggleBasket?: (selectionKey: string) => void;
  economicEvents?: UpcomingEconomicEvent[];
  agentScores?: AgentScoreRow[];
  lastScoredAt?: string;
}

export interface ScoringContext {
  economicEvents: UpcomingEconomicEvent[];
  basketSelectionKeys: string[];
  allDetections: LiveDetectionRow[];
}

export const buildDetectionSelectionKey = (d: Pick<LiveDetectionRow, 'instrument' | 'pattern_id' | 'direction' | 'timeframe'>): string => {
  return `${d.instrument}__${d.pattern_id}__${(d.direction || '').toLowerCase()}__${d.timeframe}`;
};

export function deriveRawScores(d: LiveDetectionRow, ctx?: ScoringContext) {
  const hp = d.historical_performance as any;
  const winRate = hp?.winRate ?? hp?.win_rate ?? 0.5;
  const sampleSize = hp?.sampleSize ?? hp?.sample_size ?? 10;
  // Analyst: 3-component score matching AnalystAgent engine logic
  // Win-rate component (0–10)
  const winRateScore = Math.min(10, winRate * 10);
  // Expectancy component (0–10): avgRMultiple of 1.0+ → full marks
  const expectancyR = hp?.avgRMultiple ?? hp?.expectancyR ?? 0;
  const expectancyScore = Math.min(10, Math.max(0, expectancyR) * 10);
  // Sample confidence (0–5): log2 scale matching AnalystAgent
  const MIN_SAMPLE = 30;
  const confidenceScore = sampleSize >= MIN_SAMPLE
    ? Math.min(5, Math.log2(sampleSize / MIN_SAMPLE + 1) * 2)
    : Math.min(5, Math.log2(sampleSize / MIN_SAMPLE + 1) * 2) * 0.5;
  // Normalise to 0–1 (max possible = 25)
  const analystRaw = Math.min(1, (winRateScore + expectancyScore + confidenceScore) / 25);

  // Risk: 3-component score matching RiskAgent engine logic
  const MIN_RR = 1.5;
  const KELLY_CAP = 0.25;
  // R:R adequacy (0–10): RR >= MIN_RR*2 → 10, == MIN_RR → 5
  const rrRatio = d.risk_reward_ratio / MIN_RR;
  const rrScore = Math.min(10, Math.max(0, rrRatio * 5));
  // ATR stability proxy (0–8): use stop distance as volatility proxy
  // tighter stop relative to price = more stable = higher score
  const stopDist = Math.abs(d.entry_price - d.stop_loss_price) / d.entry_price;
  const stabilityScore = Math.max(0, 8 * (1 - Math.min(1, stopDist / 0.05)));
  // Kelly sizing (0–7): Kelly = winRate - (1-winRate) / RR
  const kelly = d.risk_reward_ratio > 0
    ? winRate - (1 - winRate) / d.risk_reward_ratio
    : 0;
  const cappedKelly = Math.min(KELLY_CAP, Math.max(0, kelly));
  const kellyScore = (cappedKelly / KELLY_CAP) * 7;
  // Normalise to 0–1 (max possible = 25)
  const riskRaw = Math.min(1, (rrScore + stabilityScore + kellyScore) / 25);

  const trendScore = d.trend_alignment === 'with_trend' ? 0.85 : d.trend_alignment === 'counter_trend' ? 0.3 : 0.55;
  let timingRaw = trendScore;
  let timingDetails: { eventCount?: number; highCount?: number; nearestEvent?: string | null } = {};
  if (ctx?.economicEvents && ctx.economicEvents.length > 0) {
    const eventTiming = computeTimingFromEvents(d.instrument, d.asset_type, ctx.economicEvents);
    timingRaw = trendScore * 0.5 + eventTiming.score * 0.5;
    timingDetails = { eventCount: eventTiming.eventCount, highCount: eventTiming.highCount, nearestEvent: eventTiming.nearestEvent };
  }

  let portfolioRaw: number | null;
  let portfolioDetails: any = {};
  if (ctx && ctx.basketSelectionKeys.length > 1) {
    const selectedKeySet = new Set(ctx.basketSelectionKeys);
    const selectedDetections = ctx.allDetections.filter((det) => selectedKeySet.has(buildDetectionSelectionKey(det)));
    const portfolioResult = computePortfolioScore(
      d.instrument,
      d.direction,
      d.asset_type,
      selectedDetections.map(det => ({ instrument: det.instrument, direction: det.direction, asset_type: det.asset_type }))
    );
    portfolioRaw = portfolioResult.score;
    portfolioDetails = portfolioResult.details;
  } else {
    // No basket or single selection — portfolio agent not applicable
    portfolioRaw = null;
  }

  return { analystRaw, riskRaw, timingRaw, portfolioRaw, timingDetails, portfolioDetails };
}

const HeaderWithInfo = ({ icon, label, tooltip }: { icon?: React.ReactNode; label: string; tooltip: string }) => (
  <span className="inline-flex items-center gap-1 justify-center">
    {icon} {label}
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm whitespace-normal text-xs leading-relaxed font-normal">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </span>
);

type SortKey = 'symbol' | 'pattern' | 'direction' | 'timeframe' | 'rr' | 'analystScore' | 'riskScore' | 'timingScore' | 'composite' | 'verdict';
type SortDir = 'asc' | 'desc';

const SortableHeader: React.FC<{
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ sortKey, currentSort, currentDir, onSort, children, className = '' }) => (
  <th
    className={`px-4 py-3 font-medium cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
    onClick={() => onSort(sortKey)}
  >
    <span className="inline-flex items-center gap-1">
      {children}
      {currentSort === sortKey ? (
        currentDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </span>
  </th>
);

export const TradeOpportunityTable: React.FC<Props> = ({ weights, takeCutoff, watchCutoff, detections, isLoading, onSendToBacktest, basketSelections = [], onToggleBasket, economicEvents = [], agentScores, lastScoredAt }) => {
  const { t } = useTranslation();
  const { tradeWithGateCheck, isSubmitting: isPaperSubmitting } = usePaperTradeEntry();
  const [sortKey, setSortKey] = useState<SortKey>('composite');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showEmerging, setShowEmerging] = useState(false);

  const scoreMap = useMemo(() => {
    const map = new Map<string, AgentScoreRow>();
    agentScores?.forEach(s => map.set(s.detection_id, s));
    return map;
  }, [agentScores]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const scoringCtx: ScoringContext = useMemo(() => ({
    economicEvents,
    basketSelectionKeys: basketSelections,
    allDetections: detections,
  }), [economicEvents, basketSelections, detections]);

  const { scoredProven, emergingDetections } = useMemo(() => {
    const provenDetections = detections.filter(d => {
      const precomputed = scoreMap.get(d.id);
      return precomputed ? precomputed.is_proven : isProven(d);
    });
    const emerging = detections.filter(d => {
      const precomputed = scoreMap.get(d.id);
      return precomputed ? !precomputed.is_proven : !isProven(d);
    });

    const scored = provenDetections.map((d) => {
      const precomputed = scoreMap.get(d.id);
      let analystRaw: number, riskRaw: number, timingRaw: number, portfolioRaw: number | null;

      if (precomputed) {
        // Use pre-computed scores from edge function
        analystRaw = precomputed.analyst_raw;
        riskRaw = precomputed.risk_raw;
        timingRaw = precomputed.timing_raw;
        // Always recalculate portfolio live (basket context is per-user)
        const fullScores = deriveRawScores(d, scoringCtx);
        portfolioRaw = fullScores.portfolioRaw;
      } else {
        // Fallback to full inline calculation
        const fullScores = deriveRawScores(d, scoringCtx);
        analystRaw = fullScores.analystRaw;
        riskRaw = fullScores.riskRaw;
        timingRaw = fullScores.timingRaw;
        portfolioRaw = fullScores.portfolioRaw;
      }
      const hasBasket = portfolioRaw !== null;
      let composite: number;
      if (hasBasket) {
        // Portfolio agent active — use all 4 weights as-is
        composite = analystRaw * weights.analyst + riskRaw * weights.risk + timingRaw * weights.timing + portfolioRaw * weights.portfolio;
      } else {
        // No basket — redistribute portfolio weight proportionally to other 3 agents
        const baseSum = weights.analyst + weights.risk + weights.timing;
        const scale = baseSum > 0 ? (baseSum + weights.portfolio) / baseSum : 1;
        composite = (analystRaw * weights.analyst + riskRaw * weights.risk + timingRaw * weights.timing) * scale;
      }
      const analystScore = analystRaw * weights.analyst;
      const riskScore = riskRaw * weights.risk;
      const timingScore = timingRaw * weights.timing;
      const verdict = composite >= takeCutoff ? 'TAKE' : composite >= watchCutoff ? 'WATCH' : 'SKIP';
      const direction: 'Long' | 'Short' = d.direction?.toLowerCase().includes('short') ? 'Short' : 'Long';
      // Determine analyst data source from precomputed details or detection
      const analystDetails = precomputed?.analyst_details as any;
      const analystSource = analystDetails?.source || 'per_symbol';

      return {
        id: d.id,
        symbol: d.instrument,
        pattern: d.pattern_name,
        patternId: d.pattern_id,
        selectionKey: buildDetectionSelectionKey(d),
        direction,
        timeframe: d.timeframe,
        rr: d.risk_reward_ratio,
        assetType: d.asset_type,
        analystRaw, riskRaw, timingRaw,
        analystScore, riskScore, timingScore, composite, verdict,
        analystSource,
      };
    });

    const verdictOrder: Record<string, number> = { TAKE: 3, WATCH: 2, SKIP: 1 };
    const mul = sortDir === 'asc' ? 1 : -1;
    scored.sort((a, b) => {
      const av = a[sortKey as keyof typeof a];
      const bv = b[sortKey as keyof typeof b];
      if (sortKey === 'verdict') return mul * ((verdictOrder[a.verdict] || 0) - (verdictOrder[b.verdict] || 0));
      if (typeof av === 'string' && typeof bv === 'string') return mul * av.localeCompare(bv);
      if (typeof av === 'number' && typeof bv === 'number') return mul * (av - bv);
      return 0;
    });

    // Map emerging detections for table display
    const emergingMapped = emerging.map((d) => {
      const { riskRaw, timingRaw } = deriveRawScores(d, scoringCtx);
      const riskScore = riskRaw * weights.risk;
      const timingScore = timingRaw * weights.timing;
      const direction: 'Long' | 'Short' = d.direction?.toLowerCase().includes('short') ? 'Short' : 'Long';
      return {
        id: d.id,
        symbol: d.instrument,
        pattern: d.pattern_name,
        patternId: d.pattern_id,
        selectionKey: buildDetectionSelectionKey(d),
        direction,
        timeframe: d.timeframe,
        rr: d.risk_reward_ratio,
        assetType: d.asset_type,
        riskScore, timingScore,
      };
    });

    return { scoredProven: scored, emergingDetections: emergingMapped };
  }, [detections, weights, takeCutoff, watchCutoff, sortKey, sortDir, scoringCtx, scoreMap]);

  const counts = useMemo(() => {
    const c = { TAKE: 0, WATCH: 0, SKIP: 0 };
    scoredProven.forEach((t) => c[t.verdict as keyof typeof c]++);
    return c;
  }, [scoredProven]);

  const verdictStyles: Record<string, string> = {
    TAKE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    WATCH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    SKIP: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const rowBg: Record<string, string> = {
    TAKE: 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.07]',
    WATCH: 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]',
    SKIP: 'opacity-40 hover:opacity-60',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{t('agentScoring.loadingDetections')}</span>
      </div>
    );
  }

  if (detections.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">{t('agentScoring.noDetections')}</p>
        <p className="text-xs mt-1">{t('agentScoring.noDetectionsHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{t('agentScoring.opportunitiesScored', { count: scoredProven.length })}</span>
        {lastScoredAt && (
          <span className="text-sm text-muted-foreground ml-auto">
            Scored {formatDistanceToNow(new Date(lastScoredAt))} ago
          </span>
        )}
        {!lastScoredAt && <span className="ml-auto" />}
        <Badge variant="outline" className={`text-xs ${verdictStyles.TAKE}`}>
          <TrendingUp className="h-3.5 w-3.5 mr-1" />TAKE: {counts.TAKE}
        </Badge>
        <Badge variant="outline" className={`text-xs ${verdictStyles.WATCH}`}>
          <Minus className="h-3.5 w-3.5 mr-1" />WATCH: {counts.WATCH}
        </Badge>
        <Badge variant="outline" className={`text-xs ${verdictStyles.SKIP}`}>
          <TrendingDown className="h-3.5 w-3.5 mr-1" />SKIP: {counts.SKIP}
        </Badge>
        <button
          onClick={() => setShowEmerging(v => !v)}
          className="text-xs text-muted-foreground border border-border/50 rounded px-2 py-0.5 hover:border-border transition-colors"
        >
          Emerging: {emergingDetections.length} {showEmerging ? '↑' : '↓'}
        </button>
      </div>

      {/* Proven signals table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 text-muted-foreground text-left">
              {onToggleBasket && <th className="px-3 py-3 font-medium text-center w-10">
                <HeaderWithInfo label="" tooltip={t('agentScoring.basketTooltip')} />
              </th>}
              <SortableHeader sortKey="symbol" currentSort={sortKey} currentDir={sortDir} onSort={handleSort}>{t('agentScoring.symbol')}</SortableHeader>
              <SortableHeader sortKey="pattern" currentSort={sortKey} currentDir={sortDir} onSort={handleSort}>{t('setupFilters.pattern')}</SortableHeader>
              <SortableHeader sortKey="direction" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center">{t('agentScoring.dir')}</SortableHeader>
              <SortableHeader sortKey="timeframe" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center">TF</SortableHeader>
              <SortableHeader sortKey="rr" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center">
                <HeaderWithInfo label="R:R" tooltip={t('agentScoring.rrTooltip')} />
              </SortableHeader>
              <SortableHeader sortKey="analystScore" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center">
                <HeaderWithInfo icon={<Brain className="h-3.5 w-3.5 inline text-blue-400" />} label={t('agentScoring.analyst')} tooltip={t('agentScoring.analystHeaderTooltip')} />
              </SortableHeader>
              <SortableHeader sortKey="riskScore" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center">
                <HeaderWithInfo icon={<Shield className="h-3.5 w-3.5 inline text-amber-400" />} label={t('agentScoring.riskMgr')} tooltip={t('agentScoring.riskHeaderTooltip')} />
              </SortableHeader>
              <SortableHeader sortKey="timingScore" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center">
                <HeaderWithInfo icon={<Clock className="h-3.5 w-3.5 inline text-purple-400" />} label={t('agentScoring.timing')} tooltip={t('agentScoring.timingHeaderTooltip')} />
              </SortableHeader>
              <SortableHeader sortKey="composite" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center">
                <HeaderWithInfo label={t('agentScoring.score')} tooltip={t('agentScoring.scoreTooltip')} />
              </SortableHeader>
              <SortableHeader sortKey="verdict" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="text-center">
                <HeaderWithInfo label={t('agentScoring.verdict')} tooltip={t('agentScoring.verdictTooltip')} />
              </SortableHeader>
              {onSendToBacktest && <th className="px-4 py-3 font-medium text-center w-16"></th>}
            </tr>
          </thead>
          <tbody>
            {scoredProven.length === 0 ? (
              <tr>
                <td colSpan={99} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  No proven signals found. {emergingDetections.length > 0 && 'Check emerging signals below.'}
                </td>
              </tr>
            ) : (
              scoredProven.map((trade) => (
                <tr
                  key={trade.id}
                  className={`border-t border-border/50 transition-all duration-500 ${rowBg[trade.verdict]}`}
                >
                  {onToggleBasket && (
                    <td className="px-3 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 rounded-full transition-all ${
                          basketSelections.includes(trade.selectionKey)
                            ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        onClick={() => {
                          onToggleBasket(trade.selectionKey);
                          if (trade.verdict === 'TAKE') {
                            toast.success('Added to paper ✓');
                          } else if (trade.verdict === 'WATCH') {
                            toast('Partial match with your plan. Add anyway?', {
                              duration: 10000,
                              action: { label: 'Add anyway', onClick: () => toast.success('Added to paper ✓') },
                              cancel: { label: 'Skip', onClick: () => {} },
                            });
                          } else {
                            toast('Conflicts with your plan. Add anyway?', {
                              duration: 10000,
                              action: { label: 'Add anyway', onClick: () => toast.success('Added to paper ✓') },
                              cancel: { label: 'Skip', onClick: () => {} },
                            });
                          }
                        }}
                      >
                        {basketSelections.includes(trade.selectionKey) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      </Button>
                    </td>
                  )}
                  <td className="px-4 py-3 font-semibold text-foreground">{trade.symbol}</td>
                  <td className="px-4 py-3 text-muted-foreground">{trade.pattern}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={trade.direction === 'Long' ? 'text-emerald-400' : 'text-red-400'}>
                      {trade.direction === 'Long' ? '▲' : '▼'} {trade.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{trade.timeframe}</td>
                  <td className="px-4 py-3 text-center font-mono">{trade.rr.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell score={trade.analystScore} max={weights.analyst} color="blue" estimated={trade.analystSource === 'pattern_aggregate' || trade.analystSource === 'bayesian_prior'} estimatedLabel={trade.analystSource === 'bayesian_prior' ? 'Prior' : 'Est.'} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell score={trade.riskScore} max={weights.risk} color="amber" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell score={trade.timingScore} max={weights.timing} color="purple" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono font-bold text-base ${
                      trade.verdict === 'TAKE' ? 'text-emerald-400' :
                      trade.verdict === 'WATCH' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {trade.composite.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={`text-xs ${verdictStyles[trade.verdict]}`}>
                      {trade.verdict}
                    </Badge>
                  </td>
                  {onSendToBacktest && (
                    <td className="px-4 py-3 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => onSendToBacktest({
                              symbol: trade.symbol,
                              patternId: PATTERN_NAME_TO_ID[trade.pattern] || trade.patternId || 'bull_flag',
                              pattern: trade.pattern,
                              timeframe: trade.timeframe,
                              assetType: trade.assetType,
                            })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          {t('agentScoring.sendToStrategyBuilder')}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Emerging Signals section */}
      {showEmerging && emergingDetections.length > 0 && (
        <div className="space-y-2">
          <div className="px-1">
            <h3 className="text-sm font-medium text-muted-foreground">Emerging Signals — No Historical Edge Yet</h3>
            <p className="text-xs text-muted-foreground/70">
              These patterns lack sufficient trade history (&lt;{PROOF_GATE_MIN_SAMPLE} trades or win rate &lt;{Math.round(PROOF_GATE_MIN_WIN_RATE * 100)}%). Send to Pattern Lab to investigate.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/20 text-muted-foreground text-left">
                  {onToggleBasket && <th className="px-3 py-3 font-medium text-center w-10"></th>}
                  <th className="px-4 py-3 font-medium">{t('agentScoring.symbol')}</th>
                  <th className="px-4 py-3 font-medium">{t('setupFilters.pattern')}</th>
                  <th className="px-4 py-3 font-medium text-center">{t('agentScoring.dir')}</th>
                  <th className="px-4 py-3 font-medium text-center">TF</th>
                  <th className="px-4 py-3 font-medium text-center">R:R</th>
                  <th className="px-4 py-3 font-medium text-center">
                    <Brain className="h-3.5 w-3.5 inline text-blue-400/50" /> {t('agentScoring.analyst')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center">
                    <Shield className="h-3.5 w-3.5 inline text-amber-400/50" /> {t('agentScoring.riskMgr')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center">
                    <Clock className="h-3.5 w-3.5 inline text-purple-400/50" /> {t('agentScoring.timing')}
                  </th>
                  <th className="px-4 py-3 font-medium text-center">{t('agentScoring.score')}</th>
                  <th className="px-4 py-3 font-medium text-center">{t('agentScoring.verdict')}</th>
                  {onSendToBacktest && <th className="px-4 py-3 font-medium text-center w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {emergingDetections.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-t border-border/30 opacity-50 hover:opacity-70 transition-opacity"
                  >
                    {onToggleBasket && (
                      <td className="px-3 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 rounded-full transition-all ${
                            basketSelections.includes(trade.selectionKey)
                              ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          onClick={() => {
                            onToggleBasket(trade.selectionKey);
                            toast.success('Added to paper ✓');
                          }}
                        >
                          {basketSelections.includes(trade.selectionKey) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </Button>
                      </td>
                    )}
                    <td className="px-4 py-3 font-semibold text-foreground">{trade.symbol}</td>
                    <td className="px-4 py-3 text-muted-foreground">{trade.pattern}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={trade.direction === 'Long' ? 'text-emerald-400' : 'text-red-400'}>
                        {trade.direction === 'Long' ? '▲' : '▼'} {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{trade.timeframe}</td>
                    <td className="px-4 py-3 text-center font-mono">{trade.rr.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-muted-foreground/50 font-mono">—</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell score={trade.riskScore} max={weights.risk} color="amber" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreCell score={trade.timingScore} max={weights.timing} color="purple" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-muted-foreground/50 font-mono">—</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                        UNPROVEN
                      </Badge>
                    </td>
                    {onSendToBacktest && (
                      <td className="px-4 py-3 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => onSendToBacktest({
                                symbol: trade.symbol,
                                patternId: PATTERN_NAME_TO_ID[trade.pattern] || trade.patternId || 'bull_flag',
                                pattern: trade.pattern,
                                timeframe: trade.timeframe,
                                assetType: trade.assetType,
                              })}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            {t('agentScoring.sendToStrategyBuilder')}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ScoreCell: React.FC<{ score: number; max: number; color: string; estimated?: boolean; estimatedLabel?: string }> = ({ score, max, color, estimated, estimatedLabel }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColors: Record<string, string> = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
  };
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className={`w-14 h-2 rounded-full bg-muted/40 overflow-hidden ${estimated ? 'opacity-60' : ''}`}>
        <div
          className={`h-full rounded-full ${barColors[color]} transition-all duration-500 ${estimated ? 'opacity-70' : ''}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="font-mono text-muted-foreground w-6 text-right text-sm">{score.toFixed(0)}</span>
      {estimated && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground/70 bg-muted/50 rounded px-1 py-0.5 cursor-help">{estimatedLabel || 'Est.'}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {estimatedLabel === 'Prior' 
                ? 'Based on Bayesian prior (no historical data for this pattern). Score is neutral (~40%).'
                : 'Based on pattern-level aggregate across all instruments, not per-symbol data.'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
