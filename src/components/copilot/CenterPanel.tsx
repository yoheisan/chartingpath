import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import TradeBlotter from './TradeBlotter';
import { useNavigateToDashboard } from '@/hooks/useNavigateToDashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CopilotTrade } from '@/hooks/useCopilotTrades';
import { useScanningCandidates } from '@/hooks/useScanningCandidates';
import type { MasterPlan } from '@/hooks/useMasterPlan';

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

/* ═══ STATE 1 — SCANNING ═══ */
const ScanningState = ({ plan }: { plan: MasterPlan | null }) => {
  const { t } = useTranslation();
  const goToSymbol = useNavigateToDashboard();
  const { candidates, totalScanned, loading, lastScanAt } = useScanningCandidates(plan);

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

          {candidates.map((c) => (
            <Card key={c.id} className="bg-card/60 border-border/40">
              <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-mono font-bold text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
                      onClick={(e) => goToSymbol(c.ticker, e)}
                      title={t('copilotPage.viewOnDashboard', 'View on Dashboard')}
                    >{c.ticker}</span>
                    <span className="text-sm text-muted-foreground">{c.pattern}</span>
                    {c.timeframe && (
                      <span className="text-xs text-muted-foreground/60 font-mono">{c.timeframe}</span>
                    )}
                  </div>
                  {c.score != null && (
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm px-1.5 py-0 rounded font-medium">
                      {t('copilotPage.score', { score: Math.round(c.score) })}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <GateBadge result={c.gate} />
                  <span className="text-sm text-muted-foreground">{c.reason}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="border-t border-border/40 pt-3 mt-1">
            <p className="text-sm text-muted-foreground text-center">
              {t('copilotPage.copilotPaperEnters')}
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

/* ═══ STATE 2 — ACTIVE TRADE ═══ */
const ActiveTradeState = ({ trade, onBack, onFocusNLBar }: {
  trade: CopilotTrade;
  onBack: () => void;
  onFocusNLBar: (prefill?: string) => void;
}) => {
  const { t } = useTranslation();
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const isAi = trade.attribution === 'ai_approved';
  const pnlR = trade.outcome_r ?? 0;
  const entryTime = new Date(trade.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const positionPct = '2.8';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 shrink-0">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> {t('copilotPage.back')}
        </button>
        <span className="text-sm font-mono font-bold text-foreground">{trade.symbol}</span>
        <span className="text-sm font-mono text-foreground">${trade.entry_price?.toFixed(2)}</span>
        <span className={`text-sm font-mono ${pnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          ▲ 1.8%
        </span>
        <Badge className={`text-sm px-1.5 py-0 rounded font-medium ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
          {isAi ? t('copilotPage.aiApproved') : t('copilotPage.humanOverwrite')}
        </Badge>
        <span className="ml-auto text-sm font-mono text-muted-foreground">
          {t('copilotPage.paperTradeEntered', { time: entryTime, pct: positionPct })}
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
        <svg viewBox="0 0 600 300" className="w-full h-full" preserveAspectRatio="none">
          <polyline fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.6"
            points="0,220 50,210 100,200 150,215 180,190 220,170 260,160 300,140 340,130 380,120 420,110 460,100 500,95 540,90 580,85 600,80" />
          <line x1="180" y1="0" x2="180" y2="300" stroke="hsl(210 100% 60%)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <text x="185" y="16" fill="hsl(210 100% 60%)" fontSize="11" fontFamily="monospace">{t('copilotPage.entry')} {entryTime}</text>
          <polyline fill="none" stroke="hsl(0 84% 60%)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"
            points="180,240 260,230 340,220 420,210 500,200 600,195" />
          <text x="510" y="215" fill="hsl(0 84% 60%)" fontSize="11" fontFamily="monospace">{t('copilotPage.stop')} ${(trade.stop_loss ?? 874).toFixed(0)}</text>
          <rect x="0" y="40" width="600" height="35" fill="hsl(142 71% 45%)" opacity="0.06" />
          <text x="510" y="65" fill="hsl(142 71% 45%)" fontSize="11" fontFamily="monospace" opacity="0.5">{t('copilotPage.targetZone')}</text>
        </svg>

        <div className="absolute bottom-6 right-6 w-[210px] rounded-md bg-card/90 border border-border/60 p-3 backdrop-blur-sm">
          <span className="text-sm font-mono uppercase tracking-wider text-blue-400 block mb-1.5">{t('copilotPage.copilotReasoning')}</span>
          <p className="text-sm leading-[1.6] text-muted-foreground mb-2">
            {t('copilotPage.reasoningDetail')}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-sm h-7" onClick={() => onFocusNLBar('Why did you enter ' + trade.symbol + '?')}>
              {t('copilotPage.why')}
            </Button>
            <Button variant="outline" size="sm" className="text-sm h-7 text-amber-400 border-amber-500/30 hover:bg-amber-500/10" onClick={() => setOverrideModalOpen(true)}>
              {t('copilotPage.overrideExit')}
            </Button>
          </div>
        </div>

        {overrideModalOpen && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Card className="w-[320px]">
              <CardContent className="p-4 flex flex-col gap-3">
                <p className="text-sm text-foreground font-medium">{t('copilotPage.overrideExitTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('copilotPage.overrideExitDesc')}</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setOverrideModalOpen(false)}>{t('copilotPage.cancel')}</Button>
                  <Button size="sm" className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30" onClick={() => setOverrideModalOpen(false)}>
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
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> {t('copilotPage.back')}
        </button>
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
const CenterPanel = ({ activeTrade, selectedClosedTrade, onBack, onFocusNLBar, openTrades, selectedTradeId, onSelectTrade, activePlan }: CenterPanelProps) => {
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
      return <ActiveTradeState trade={activeTrade} onBack={onBack} onFocusNLBar={onFocusNLBar} />;
    }
    return <ScanningState />;
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden">
        {mainContent}
      </div>
      <TradeBlotter
        trades={openTrades}
        selectedTradeId={selectedTradeId}
        onSelectTrade={onSelectTrade}
      />
    </div>
  );
};

export default CenterPanel;
