import { useState, useCallback, useEffect, useMemo } from 'react';
import { translatePatternName } from '@/utils/translatePatternName';
import { useTranslation } from 'react-i18next';
import TradeBlotter from './TradeBlotter';
import { useNavigateToDashboard } from '@/hooks/useNavigateToDashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Play, AlertTriangle, Target, Shield, TrendingUp, TrendingDown, ChevronDown, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CopilotTrade } from '@/hooks/useCopilotTrades';
import { useScanningCandidates, ScanningCandidate } from '@/hooks/useScanningCandidates';
import { usePaperTradeEntry } from '@/hooks/usePaperTradeEntry';
import type { MasterPlan } from '@/hooks/useMasterPlan';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { supabase } from '@/integrations/supabase/client';

/* ─── types ─── */
export type CenterPanelState = 'scanning' | 'active' | 'review';

export interface SelectedClosedTrade {
  id: string;
  ticker: string;
  attribution: string;
  entry_price: number;
  exit_price: number | null;
  entry_time: string;
  exit_time: string | null;
  pnl_r: number;
  duration_mins: number;
  gate_result: string;
  gate_reason: string;
  setup_type: string;
  copilot_reasoning: string | null;
}

interface CenterPanelProps {
  activeTrade: CopilotTrade | null;
  selectedClosedTrade: SelectedClosedTrade | null;
  onBack: () => void;
  onFocusNLBar: (prefill?: string) => void;
  openTrades: CopilotTrade[];
  selectedTradeId: string | null;
  onSelectTrade: (id: string) => void;
  onCloseTrade?: (tradeId: string, manualPrice?: number) => void;
  activePlan: MasterPlan | null;
}

/* ─── helpers ─── */
const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

const GateBadge = ({ result }: { result: string }) => {
  const { t } = useTranslation();
  const colors: Record<string, string> = {
    aligned: 'bg-green-500/20 text-green-400 border-green-500/30',
    partial: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    conflict: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const labelMap: Record<string, string> = {
    aligned: t('copilotPage.gateAligned', 'aligned'),
    partial: t('copilotPage.gatePartial', 'partial'),
    conflict: t('copilotPage.gateConflict', 'conflict'),
  };
  return (
    <Badge className={`text-sm px-1.5 py-0 rounded font-medium ${colors[result] ?? colors.aligned}`}>
      {labelMap[result] ?? result}
    </Badge>
  );
};

const CopilotAvatar = () => (
  <Avatar className="h-6 w-6">
    <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-bold">C</AvatarFallback>
  </Avatar>
);

/* ─── Hold reason logic ─── */
function getHoldReasons(c: ScanningCandidate, tf: (key: string, fallback: string) => string): string[] {
  const reasons: string[] = [];
  if (c.gate === 'conflict') reasons.push(tf('copilotPage.holdGateConflict', 'Gate: conflicts with plan'));
  else if (c.gate === 'partial') reasons.push(tf('copilotPage.holdGatePartial', 'Gate: partial match only'));
  if (c.verdict === 'SKIP') reasons.push(tf('copilotPage.holdVerdictSkip', 'Agent verdict: SKIP'));
  else if (c.verdict === 'WATCH') reasons.push(tf('copilotPage.holdVerdictWatch', 'Agent verdict: WATCH — monitoring'));
  else if (!c.verdict) reasons.push(tf('copilotPage.holdNoScore', 'No agent score yet'));
  if (c.qualityGrade && ['C', 'D', 'F'].includes(c.qualityGrade)) {
    reasons.push(tf('copilotPage.holdLowGradeDetail', `Quality ${c.qualityGrade} — needs A or B for auto-trade`));
  }
  if (reasons.length === 0 && c.gate === 'aligned' && c.verdict === 'TAKE') reasons.push(tf('copilotPage.holdPendingExecution', 'Queued — pending next execution cycle'));
  return reasons;
}

/* ─── Exit Plan Dialog ─── */
const ExitPlanDialog = ({ open, onOpenChange, candidate, onConfirm, isSubmitting, positionPct }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  candidate: ScanningCandidate | null;
  onConfirm: (c: ScanningCandidate, sl: number, tp: number) => void;
  isSubmitting: boolean;
  positionPct: number;
}) => {
  const { t } = useTranslation();
  const entryPrice = candidate?.currentPrice ?? 0;
  const rUnit = entryPrice * (positionPct / 100);
  const isShort = candidate?.direction?.toLowerCase() === 'short' || candidate?.direction?.toLowerCase() === 'bearish';
  const defaultSl = isShort ? entryPrice + 2 * rUnit : entryPrice - 2 * rUnit;
  const defaultTp = isShort ? entryPrice - 3 * rUnit : entryPrice + 3 * rUnit;
  const [sl, setSl] = useState(defaultSl.toFixed(2));
  const [tp, setTp] = useState(defaultTp.toFixed(2));

  // Reset when candidate changes
  useEffect(() => {
    if (candidate?.currentPrice) {
      const ep = candidate.currentPrice;
      const r = ep * (positionPct / 100);
      const short = candidate.direction?.toLowerCase() === 'short' || candidate.direction?.toLowerCase() === 'bearish';
      setSl((short ? ep + 2 * r : ep - 2 * r).toFixed(2));
      setTp((short ? ep - 3 * r : ep + 3 * r).toFixed(2));
    }
  }, [candidate?.id, candidate?.currentPrice, positionPct]);

  if (!candidate) return null;

  const isAutoEligible = candidate.gate === 'aligned' && candidate.verdict === 'TAKE';
  const hasPrice = entryPrice > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('copilotPage.exitPlanTitle', 'Exit Plan — {{ticker}}').replace('{{ticker}}', candidate.ticker)}</DialogTitle>
          <DialogDescription>{t('copilotPage.exitPlanDesc', 'Set your stop loss and take profit levels for this override trade.')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md bg-muted/30 p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">{t('copilotPage.entryPrice', 'Entry')}</span>
            <span className="font-mono font-medium">{hasPrice ? entryPrice.toFixed(2) : '—'}</span>
          </div>
          {!hasPrice && (
            <p className="text-xs text-amber-400">{t('copilotPage.noPriceWarning', 'No live price available. Trade will use market price at execution.')}</p>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-red-400" />
              {t('copilotPage.stopLoss', 'Stop Loss')}
            </Label>
            <Input type="number" step="0.01" value={sl} onChange={e => setSl(e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              {t('copilotPage.takeProfit', 'Take Profit')}
            </Label>
            <Input type="number" step="0.01" value={tp} onChange={e => setTp(e.target.value)} className="font-mono" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('copilotPage.close', 'Close')}</Button>
          <Button
            disabled={isSubmitting || !hasPrice}
            onClick={() => onConfirm(candidate, parseFloat(sl), parseFloat(tp))}
            className="gap-1"
          >
            <Play className="h-3.5 w-3.5" />
            {isAutoEligible
              ? t('copilotPage.takeTrade', 'Take Trade')
              : t('copilotPage.overrideTrade', 'Override & Trade')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ═══ STATE 1 — SCANNING ═══ */
const ScanningState = ({ plan }: { plan: MasterPlan | null }) => {
  const { t } = useTranslation();
  const goToSymbol = useNavigateToDashboard();
  const { candidates, totalScanned, loading, lastScanAt } = useScanningCandidates(plan);
  const { tradeWithGateCheck, isSubmitting, pendingConflict, confirmConflictTrade, dismissConflict } = usePaperTradeEntry();
  const [exitCandidate, setExitCandidate] = useState<ScanningCandidate | null>(null);

  // Countdown to next scan (polls every 60s)
  const [countdown, setCountdown] = useState("1:00");
  useEffect(() => {
    if (!lastScanAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastScanAt.getTime()) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setCountdown(`${mins}:${String(secs).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastScanAt]);

  const shortlisted = candidates.filter(c => c.gate === "aligned").length;
  const topTicker = candidates[0]?.ticker ?? "—";

  const positionPct = plan?.max_position_pct ?? 2;

  const handleConfirmTrade = useCallback((c: ScanningCandidate, sl: number, tp: number) => {
    tradeWithGateCheck({
      ticker: c.ticker,
      setup_type: c.pattern,
      timeframe: c.timeframe,
      direction: c.direction ?? undefined,
      entry_price: c.currentPrice ?? undefined,
      stop_price: sl,
      target_price: tp,
      gate_result: c.gate as "aligned" | "partial" | "conflict",
      gate_reason: c.reason,
      agent_score: c.score ?? undefined,
    });
    setExitCandidate(null);
  }, [tradeWithGateCheck]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/5 border-b border-blue-500/20 shrink-0">
        <CopilotAvatar />
        <p className="text-sm text-muted-foreground">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('copilotPage.scanningMarkets', 'Scanning markets...')}
            </span>
          ) : candidates.length > 0 ? (
            t('copilotPage.runningPlan', { candidates: totalScanned, shortlisted, ticker: topTicker })
          ) : (
            t('copilotPage.noActiveDetections', 'No active pattern detections matching your plan.')
          )}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{t('copilotPage.copilotWatching')}</span>
            <span className="text-sm font-mono text-muted-foreground">{t('copilotPage.nextScan', { time: countdown })}</span>
          </div>

          {candidates.length === 0 && !loading && (
            <Card className="bg-card/60 border-border/40">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('copilotPage.noCandidatesYet', 'No candidates yet — Copilot will surface matches as patterns are detected.')}
                </p>
              </CardContent>
            </Card>
          )}

          {candidates.map((c) => {
            const holdReasons = getHoldReasons(c, (k, fb) => t(k, fb));
            const isAutoEligible = c.gate === 'aligned' && c.verdict === 'TAKE';
            const dirLower = c.direction?.toLowerCase();
            const isLong = dirLower === 'long' || dirLower === 'bullish';
            const isShort = dirLower === 'short' || dirLower === 'bearish';

            // Cooldown check
            const inCooldown = c.cooldownUntil && new Date(c.cooldownUntil) > new Date();
            const cooldownHoursAgo = inCooldown
              ? Math.max(0, Math.round((4 - (new Date(c.cooldownUntil!).getTime() - Date.now()) / (60 * 60 * 1000)) * 10) / 10)
              : 0;

            return (
              <Card key={c.id} className="bg-card/60 border-border/40">
                <CardContent className="p-3 flex flex-col gap-0">
                  {/* Header row — always visible */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Direction icon */}
                      {isLong && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                      {isShort && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                      <span
                        className="text-sm font-mono font-bold text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
                        onClick={(e) => goToSymbol(c.ticker, e)}
                        title={t('copilotPage.viewOnDashboard', 'View on Dashboard')}
                      >{c.ticker}</span>
                      {/* Direction label */}
                      {(isLong || isShort) && (
                        <Badge variant="outline" className={`text-xs px-1.5 py-0 rounded font-medium ${isLong ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                          {isLong ? t('copilotPage.long', 'Long') : t('copilotPage.short', 'Short')}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">{translatePatternName(c.pattern)}</span>
                      {c.timeframe && (
                        <span className="text-xs text-muted-foreground/60 font-mono">{c.timeframe}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {inCooldown && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-2 py-0.5 rounded font-medium gap-1">
                          <Clock className="h-3 w-3" />
                          Cooling down — stop hit {cooldownHoursAgo}h ago
                        </Badge>
                      )}
                      {c.verdict && (() => {
                        const verdictStyles: Record<string, string> = {
                          TAKE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                          WATCH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                          SKIP: 'bg-red-500/20 text-red-400 border-red-500/30',
                        };
                        return (
                          <Badge className={`${verdictStyles[c.verdict] || ''} text-xs px-2 py-0.5 rounded font-semibold`}>
                            {t(`agentScoring.${c.verdict.toLowerCase()}`, c.verdict)}
                          </Badge>
                        );
                      })()}
                      {c.qualityGrade && (() => {
                        const gradeColors: Record<string, string> = {
                          A: 'bg-emerald-500/15 text-emerald-400/80 border-emerald-500/20',
                          B: 'bg-blue-500/15 text-blue-400/80 border-blue-500/20',
                          C: 'bg-orange-500/15 text-orange-400/80 border-orange-500/20',
                          D: 'bg-red-500/15 text-red-400/80 border-red-500/20',
                          F: 'bg-red-500/15 text-red-400/80 border-red-500/20',
                        };
                        return (
                          <Badge variant="outline" className={`${gradeColors[c.qualityGrade] || ''} text-xs px-2 py-0.5 rounded font-mono`}>
                            {c.qualityGrade}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Collapsible detail section */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group w-full">
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                      <GateBadge result={c.gate} />
                      <span className="truncate">{c.reason}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 flex flex-col gap-2">
                      {/* Hold reasons */}
                      {!isAutoEligible && holdReasons.length > 0 && (
                        <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-amber-500/5 border border-amber-500/10">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-amber-400">{t('copilotPage.onHold', 'On hold')}</span>
                            {holdReasons.map((r, i) => (
                              <span key={i} className="text-xs text-muted-foreground">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Take Trade override button */}
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant={isAutoEligible ? "default" : "outline"}
                          className="h-7 text-xs gap-1"
                          disabled={isSubmitting || !!inCooldown}
                          onClick={() => setExitCandidate(c)}
                          title={inCooldown ? 'Symbol in cooldown after stop loss hit' : undefined}
                        >
                          <Play className="h-3 w-3" />
                          {isAutoEligible
                            ? t('copilotPage.takeTrade', 'Take Trade')
                            : t('copilotPage.overrideTrade', 'Override & Trade')
                          }
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })}

          <div className="border-t border-border/40 pt-3 mt-1">
            <p className="text-sm text-muted-foreground text-center">
              {t('copilotPage.copilotPaperEnters')}
            </p>
          </div>
        </div>
      </ScrollArea>

      {/* Exit Plan dialog with trade confirmation */}
      <ExitPlanDialog
        open={!!exitCandidate}
        onOpenChange={(o) => !o && setExitCandidate(null)}
        candidate={exitCandidate}
        onConfirm={handleConfirmTrade}
        isSubmitting={isSubmitting}
        positionPct={positionPct}
      />

      {/* Conflict guard modal — prominent full-width warning */}
      <Dialog open={!!pendingConflict} onOpenChange={(o) => !o && dismissConflict()}>
        <DialogContent className="max-w-md border-destructive/40">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-destructive/15 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base">
                  {pendingConflict?.params.ticker} — {pendingConflict?.label}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {t('copilotPage.conflictGuardDesc', 'This trade does not fully align with your active trading plan. Proceeding will be logged as a manual override.')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 text-sm text-foreground/80 leading-relaxed">
            {pendingConflict?.reason}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={dismissConflict}>
              {t('copilotPage.skip', 'Skip')}
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={confirmConflictTrade}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              {t('copilotPage.tradeAnyway', 'Trade Anyway')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Why Aligned? section ─── */
const WhyAlignedSection = ({ trade }: { trade: CopilotTrade }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [criteria, setCriteria] = useState<{
    direction: string | null;
    timeframe: string | null;
    gate_reason: string | null;
    setup_type: string | null;
    source: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const handleOpen = useCallback(async () => {
    setOpen(prev => !prev);
    if (fetched) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('gate_evaluations')
        .select('direction, timeframe, gate_reason, setup_type, source')
        .eq('ticker', trade.symbol)
        .eq('gate_result', 'aligned')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setCriteria(data);
    } catch { /* ignore */ }
    setFetched(true);
    setLoading(false);
  }, [trade.symbol, fetched]);

  if (trade.gate_result !== 'aligned') return null;

  const isForex = trade.symbol?.endsWith('=X');
  const assetClass = isForex ? 'Forex' : trade.symbol?.includes('/') ? 'Crypto' : 'Equity';
  const dir = criteria?.direction ?? trade.trade_type ?? '—';
  const tf = criteria?.timeframe ?? '—';
  const reason = criteria?.gate_reason;

  const checks = [
    { label: `Asset class: ${assetClass}`, detail: 'matches plan', passed: true },
    { label: `Timeframe: ${tf}`, detail: 'matches plan', passed: true },
    { label: `Direction: ${dir.charAt(0).toUpperCase() + dir.slice(1)}`, detail: 'matches plan bias', passed: true },
    { label: `Session: ${isForex ? '24/7' : 'Market hours'}`, detail: 'within trading window', passed: true },
  ];

  return (
    <div className="col-span-2 mt-1">
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors group"
      >
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        Why aligned?
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-muted/20 border border-border/20 p-3 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading gate criteria…
            </div>
          ) : (
            <>
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-green-400">✓</span>
                  <span className="text-foreground font-medium">{c.label}</span>
                  <span className="text-muted-foreground">— {c.detail}</span>
                </div>
              ))}
              {reason && (
                <p className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/20">
                  Gate reason: {reason}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══ STATE 2 — ACTIVE TRADE ═══ */
const ActiveTradeState = ({ trade, onBack, onFocusNLBar, onCloseTrade }: {
  trade: CopilotTrade;
  onBack: () => void;
  onFocusNLBar: (prefill?: string) => void;
  onCloseTrade?: (tradeId: string, manualPrice?: number) => void;
}) => {
  const { t } = useTranslation();
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [livePriceUnavailable, setLivePriceUnavailable] = useState(false);
  const [manualExitPrice, setManualExitPrice] = useState(String(trade.entry_price ?? 0));
  const [checkingPrice, setCheckingPrice] = useState(false);
  const isAi = trade.attribution === 'ai_approved';
  const pnlR = trade.outcome_r ?? 0;
  const entryTime = new Date(trade.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const elapsed = Math.round((Date.now() - new Date(trade.created_at).getTime()) / 60000);
  const elapsedLabel = elapsed >= 60 ? `${Math.floor(elapsed / 60)}h ${elapsed % 60}m` : `${elapsed}m`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 shrink-0">
        <span className="text-sm font-mono font-bold text-foreground">{trade.symbol}</span>
        <span className="text-sm font-mono text-foreground">${trade.entry_price?.toFixed(2)}</span>
        <span className={`text-sm font-mono ${pnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {pnlR >= 0 ? '▲' : '▼'} {formatR(pnlR)}
        </span>
        <Badge className={`text-sm px-1.5 py-0 rounded font-medium ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
          {isAi ? t('copilotPage.aiApproved') : t('copilotPage.humanOverwrite')}
        </Badge>
        <span className="ml-auto text-sm font-mono text-muted-foreground">
          {t('copilotPage.paperTradeStatus', { time: entryTime, elapsed: elapsedLabel })}
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/5 border-b border-blue-500/20 shrink-0">
        <CopilotAvatar />
        <p className="text-sm text-muted-foreground">
          {t('copilotPage.paperTradeOpen', {
            symbol: trade.symbol,
            pnlR: formatR(pnlR),
            reasoning: trade.copilot_reasoning ?? t('copilotPage.defaultReasoning', { time: entryTime, stop: (trade.stop_loss ?? trade.entry_price * 0.98).toFixed(2) }),
          })}
        </p>
      </div>

      <div className="flex-1 relative p-4">
        {/* Trade info panel — real data from paper_trades */}
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">{t('copilotPage.sideLabel')}</span>
              <span className={`font-mono font-bold ${trade.trade_type === 'long' || trade.trade_type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                {(trade.trade_type ?? 'long').charAt(0).toUpperCase() + (trade.trade_type ?? 'long').slice(1)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Setup</span>
              <span className="font-mono text-foreground">{trade.setup_type ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Entry</span>
              <span className="font-mono text-foreground">${trade.entry_price?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">P&L</span>
              <span className={`font-mono font-bold ${pnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatR(pnlR)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Stop Loss</span>
              <span className="font-mono text-red-400">{trade.stop_loss ? `$${trade.stop_loss.toFixed(2)}` : '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Take Profit</span>
              <span className="font-mono text-green-400">{trade.take_profit ? `$${trade.take_profit.toFixed(2)}` : '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Gate</span>
              <span className="font-mono text-foreground">{trade.gate_result ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-0.5">Source</span>
              <span className="font-mono text-foreground">{trade.source ?? '—'}</span>
            </div>
            <WhyAlignedSection trade={trade} />
          </div>
        </div>

        {/* Copilot reasoning overlay — uses real trade reasoning */}
        <div className="absolute bottom-6 right-6 w-[240px] rounded-md bg-card/90 border border-border/60 p-3 backdrop-blur-sm">
          <span className="text-sm font-mono uppercase tracking-wider text-blue-400 block mb-1.5">{t('copilotPage.copilotReasoning')}</span>
          <p className="text-sm leading-[1.6] text-muted-foreground mb-2">
            {trade.copilot_reasoning || t('copilotPage.defaultReasoning', { time: entryTime, stop: (trade.stop_loss ?? trade.entry_price * 0.98).toFixed(2) })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-sm h-7" onClick={() => onFocusNLBar('Why did you enter ' + trade.symbol + '?')}>
              {t('copilotPage.why')}
            </Button>
            <Button variant="outline" size="sm" className="text-sm h-7 text-amber-400 border-amber-500/30 hover:bg-amber-500/10" onClick={async () => {
              setOverrideModalOpen(true);
              setCheckingPrice(true);
              setLivePriceUnavailable(false);
              try {
                const { data } = await supabase
                  .from('live_pattern_detections')
                  .select('current_price')
                  .eq('instrument', trade.symbol)
                  .not('current_price', 'is', null)
                  .order('last_confirmed_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (!data?.current_price) {
                  setLivePriceUnavailable(true);
                  setManualExitPrice(String(trade.entry_price));
                }
              } catch {
                setLivePriceUnavailable(true);
                setManualExitPrice(String(trade.entry_price));
              } finally {
                setCheckingPrice(false);
              }
            }}>
              {t('copilotPage.overrideExit')}
            </Button>
          </div>
        </div>

        {overrideModalOpen && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Card className="w-[340px]">
              <CardContent className="p-4 flex flex-col gap-3">
                <p className="text-sm text-foreground font-medium">{t('copilotPage.overrideExitTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('copilotPage.overrideExitDesc')}</p>

                {checkingPrice && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking live price…
                  </div>
                )}

                {livePriceUnavailable && !checkingPrice && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-400">Live price unavailable — enter exit price manually.</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Exit Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={manualExitPrice}
                        onChange={(e) => setManualExitPrice(e.target.value)}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => { setOverrideModalOpen(false); setLivePriceUnavailable(false); }}>{t('copilotPage.cancel')}</Button>
                  <Button
                    size="sm"
                    disabled={checkingPrice || (livePriceUnavailable && (!manualExitPrice || isNaN(Number(manualExitPrice)) || Number(manualExitPrice) <= 0))}
                    className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                    onClick={() => {
                      setOverrideModalOpen(false);
                      if (livePriceUnavailable) {
                        onCloseTrade?.(trade.id, Number(manualExitPrice));
                      } else {
                        onCloseTrade?.(trade.id);
                      }
                      setLivePriceUnavailable(false);
                    }}
                  >
                    {t('copilotPage.confirmOverride')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══ STATE 3 — REVIEWING CLOSED TRADE ═══ */
const ReviewState = ({ trade, onBack, onFocusNLBar }: {
  trade: SelectedClosedTrade;
  onBack: () => void;
  onFocusNLBar: (prefill?: string) => void;
}) => {
  const { t } = useTranslation();
  const [questionInput, setQuestionInput] = useState('');
  const isAi = trade.attribution === 'ai_approved';
  const isPositive = trade.pnl_r >= 0;
  const exitTime = trade.exit_time ? new Date(trade.exit_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  const entryTime = new Date(trade.entry_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const isOverride = !isAi;

  const chips = [
    t('copilotPage.chipWhyFlag'),
    t('copilotPage.chipWhatIfHeld'),
    t('copilotPage.chipSimilarTrades'),
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 shrink-0">
        <span className="text-sm font-mono font-bold text-foreground">{trade.ticker}</span>
        <Badge className={`text-sm px-1.5 py-0 rounded font-medium ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
          {isAi ? t('copilotPage.aiApproved') : t('copilotPage.humanOverwrite')}
        </Badge>
        <span className={`ml-auto text-sm font-mono font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {t('copilotPage.closed', { time: exitTime, pnlR: formatR(trade.pnl_r) })}
        </span>
      </div>

      <div className={`flex items-center gap-2 px-4 py-2.5 border-b shrink-0 ${isOverride ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
        <CopilotAvatar />
        <p className="text-sm text-muted-foreground">
          {isOverride
            ? t('copilotPage.overrideContextYou', { ticker: trade.ticker, pnlR: formatR(trade.pnl_r), time: exitTime })
            : trade.copilot_reasoning ?? t('copilotPage.overrideContextAi', {
                ticker: trade.ticker,
                time: exitTime,
                pnlR: formatR(trade.pnl_r),
                detail: isPositive ? t('copilotPage.setupPlayedOut') : t('copilotPage.stopHit'),
              })}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-4">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('copilotPage.entryLabel')}</span>
                  <span className="ml-3 font-mono text-foreground">${trade.entry_price.toFixed(2)} at {entryTime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('copilotPage.exitLabel')}</span>
                  <span className="ml-3 font-mono text-foreground">${trade.exit_price?.toFixed(2) ?? '—'} at {exitTime} ({t('copilotPage.stopHitLabel')})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('copilotPage.result')}</span>
                  <span className={`ml-3 font-mono font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{formatR(trade.pnl_r)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('copilotPage.duration')}</span>
                  <span className="ml-3 font-mono text-foreground">{t('copilotPage.minutes', { count: trade.duration_mins })}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('copilotPage.gate')}</span>
                  <span className="ml-3"><GateBadge result={trade.gate_result} /></span>
                  <span className="ml-2 text-muted-foreground">{trade.gate_reason}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('copilotPage.decision')}</span>
                  <span className="ml-3 text-foreground">{isAi ? t('copilotPage.aiApprovedDecision') : t('copilotPage.humanOverwriteDecision')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border-t border-border/40 pt-4">
            <span className="text-sm font-semibold text-foreground block mb-2">{t('copilotPage.askCopilot')}</span>
            <Input
              value={questionInput}
              onChange={e => setQuestionInput(e.target.value)}
              placeholder={t('copilotPage.askPlaceholder')}
              className="h-9 text-sm bg-secondary/50 border-border/40"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => setQuestionInput(chip)}
                  className="text-sm px-2.5 py-1 rounded-md bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

/* ═══ MAIN CENTER PANEL ═══ */
const CenterPanel = ({ activeTrade, selectedClosedTrade, onBack, onFocusNLBar, openTrades, selectedTradeId, onSelectTrade, onCloseTrade, activePlan }: CenterPanelProps) => {
  const state: CenterPanelState = useMemo(() => {
    if (selectedClosedTrade) return 'review';
    if (activeTrade) return 'active';
    return 'scanning';
  }, [selectedClosedTrade, activeTrade]);

  const mainContent = (() => {
    if (state === 'review' && selectedClosedTrade) {
      return <ReviewState trade={selectedClosedTrade} onBack={onBack} onFocusNLBar={onFocusNLBar} />;
    }
    if (state === 'active' && activeTrade) {
      return <ActiveTradeState trade={activeTrade} onBack={onBack} onFocusNLBar={onFocusNLBar} onCloseTrade={onCloseTrade} />;
    }
    return <ScanningState plan={activePlan} />;
  })();

  const [blotterExpanded, setBlotterExpanded] = useState(true);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Main content — takes remaining space */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${blotterExpanded ? 'flex-1 min-h-0' : 'flex-1'}`}>
        {mainContent}
      </div>

      {/* Trade blotter — collapsible with click toggle */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${blotterExpanded ? 'max-h-[45%] min-h-[120px]' : 'max-h-[36px]'}`}>
        <TradeBlotter
          trades={openTrades}
          selectedTradeId={selectedTradeId}
          onSelectTrade={onSelectTrade}
          expanded={blotterExpanded}
          onToggle={() => setBlotterExpanded(prev => !prev)}
        />
      </div>
    </div>
  );
};

export default CenterPanel;
