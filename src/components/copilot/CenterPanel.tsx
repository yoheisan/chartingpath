import { useState, useCallback, useEffect, useMemo } from 'react';
import TradeBlotter from './TradeBlotter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { CopilotTrade } from '@/hooks/useCopilotTrades';

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
}

/* ─── helpers ─── */
const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

const GateBadge = ({ result }: { result: string }) => {
  const colors: Record<string, string> = {
    aligned: 'bg-green-500/20 text-green-400 border-green-500/30',
    partial: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    conflict: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <Badge className={`text-sm px-1.5 py-0 rounded font-medium ${colors[result] ?? colors.aligned}`}>
      {result}
    </Badge>
  );
};

const CopilotAvatar = () => (
  <Avatar className="h-6 w-6">
    <AvatarFallback className="bg-blue-500/20 text-blue-400 text-sm font-bold">C</AvatarFallback>
  </Avatar>
);

/* ═══ STATE 1 — SCANNING ═══ */
const ScanningState = () => {
  const candidates = [
    { ticker: 'NVDA', pattern: 'Donchian Breakout Long', score: 76, gate: 'aligned', reason: 'Waiting for breakout confirmation' },
    { ticker: 'MSFT', pattern: 'Ascending Triangle', score: 72, gate: 'aligned', reason: 'Volume below threshold — monitoring' },
    { ticker: 'EURUSD', pattern: 'Bull Flag', score: 68, gate: 'partial', reason: 'Outside trading window in 18 min' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Context Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/5 border-b border-blue-500/20 shrink-0">
        <CopilotAvatar />
        <p className="text-sm text-muted-foreground">
          Running your trading plan on paper · Scanning 94 candidates · 3 setups shortlisted — waiting for breakout confirmation on NVDA.
        </p>
      </div>

      {/* Shortlist Panel */}
      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Copilot is watching</span>
            <span className="text-sm font-mono text-muted-foreground">Next scan in 4:32</span>
          </div>

          {candidates.map((c) => (
            <Card key={c.ticker} className="bg-card/60 border-border/40">
              <CardContent className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-foreground">{c.ticker}</span>
                    <span className="text-sm text-muted-foreground">{c.pattern}</span>
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm px-1.5 py-0 rounded font-medium">
                    Score {c.score}
                  </Badge>
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
              Copilot paper-enters when conditions are met. You review results and decide when to go live.
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
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const isAi = trade.attribution === 'ai_approved';
  const pnlR = trade.outcome_r ?? 0;
  const entryTime = new Date(trade.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const positionPct = '2.8';

  return (
    <div className="flex flex-col h-full">
      {/* Ticker Header Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 shrink-0">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span className="text-sm font-mono font-bold text-foreground">{trade.symbol}</span>
        <span className="text-sm font-mono text-foreground">${trade.entry_price?.toFixed(2)}</span>
        <span className={`text-sm font-mono ${pnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          ▲ 1.8%
        </span>
        <Badge className={`text-sm px-1.5 py-0 rounded font-medium ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
          {isAi ? 'AI-Approved' : 'Human-Overwrite'}
        </Badge>
        <span className="ml-auto text-sm font-mono text-muted-foreground">
          Paper trade · Entered {entryTime} · Position {positionPct}%
        </span>
      </div>

      {/* Context Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/5 border-b border-blue-500/20 shrink-0">
        <CopilotAvatar />
        <p className="text-sm text-muted-foreground">
          Paper trade open · {trade.symbol} · {formatR(pnlR)} · {trade.copilot_reasoning ?? `Your plan is being tested live — entered at ${entryTime} on a breakout above VWAP. Trailing 2R stop active at $${(trade.stop_loss ?? trade.entry_price * 0.98).toFixed(2)}.`}
        </p>
      </div>

      {/* Chart Area (placeholder SVG) */}
      <div className="flex-1 relative p-4">
        <svg viewBox="0 0 600 300" className="w-full h-full" preserveAspectRatio="none">
          {/* Price line */}
          <polyline
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            opacity="0.6"
            points="0,220 50,210 100,200 150,215 180,190 220,170 260,160 300,140 340,130 380,120 420,110 460,100 500,95 540,90 580,85 600,80"
          />
          {/* Entry line */}
          <line x1="180" y1="0" x2="180" y2="300" stroke="hsl(210 100% 60%)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <text x="185" y="16" fill="hsl(210 100% 60%)" fontSize="11" fontFamily="monospace">Entry {entryTime}</text>
          {/* Stop line (trailing) */}
          <polyline
            fill="none"
            stroke="hsl(0 84% 60%)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
            points="180,240 260,230 340,220 420,210 500,200 600,195"
          />
          <text x="510" y="215" fill="hsl(0 84% 60%)" fontSize="11" fontFamily="monospace">Stop ${(trade.stop_loss ?? 874).toFixed(0)}</text>
          {/* Target zone */}
          <rect x="0" y="40" width="600" height="35" fill="hsl(142 71% 45%)" opacity="0.06" />
          <text x="510" y="65" fill="hsl(142 71% 45%)" fontSize="11" fontFamily="monospace" opacity="0.5">Target zone</text>
        </svg>

        {/* Reasoning card */}
        <div className="absolute bottom-6 right-6 w-[210px] rounded-md bg-card/90 border border-border/60 p-3 backdrop-blur-sm">
          <span className="text-sm font-mono uppercase tracking-wider text-blue-400 block mb-1.5">Copilot reasoning</span>
          <p className="text-sm leading-[1.6] text-muted-foreground mb-2">
            Breakout above VWAP at open. Volume 2.3× avg. Sector momentum positive. No earnings within 14 days.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-sm h-7" onClick={() => onFocusNLBar('Why did you enter ' + trade.symbol + '?')}>
              Why?
            </Button>
            <Button variant="outline" size="sm" className="text-sm h-7 text-amber-400 border-amber-500/30 hover:bg-amber-500/10" onClick={() => setOverrideModalOpen(true)}>
              Override exit
            </Button>
          </div>
        </div>

        {/* Override confirmation modal */}
        {overrideModalOpen && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Card className="w-[320px]">
              <CardContent className="p-4 flex flex-col gap-3">
                <p className="text-sm text-foreground font-medium">Override Copilot's exit decision?</p>
                <p className="text-sm text-muted-foreground">This trade will be logged as a human override.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setOverrideModalOpen(false)}>Cancel</Button>
                  <Button size="sm" className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30" onClick={() => setOverrideModalOpen(false)}>
                    Confirm override
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
  const [questionInput, setQuestionInput] = useState('');
  const isAi = trade.attribution === 'ai_approved';
  const isPositive = trade.pnl_r >= 0;
  const exitTime = trade.exit_time ? new Date(trade.exit_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  const entryTime = new Date(trade.entry_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const isOverride = !isAi;

  const chips = [
    'Why did Copilot flag this?',
    'What would have happened if I held?',
    'Show me similar trades',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Ticker Header Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 shrink-0">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span className="text-sm font-mono font-bold text-foreground">{trade.ticker}</span>
        <Badge className={`text-sm px-1.5 py-0 rounded font-medium ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
          {isAi ? 'AI-Approved' : 'Human-Overwrite'}
        </Badge>
        <span className={`ml-auto text-sm font-mono font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          Closed {exitTime} · {formatR(trade.pnl_r)}
        </span>
      </div>

      {/* Context Bar — amber for overrides, blue for AI */}
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b shrink-0 ${isOverride ? 'bg-amber-500/5 border-amber-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
        <CopilotAvatar />
        <p className="text-sm text-muted-foreground">
          {isOverride
            ? `You added ${trade.ticker} despite a conflict flag. It stopped out at ${formatR(trade.pnl_r)} at ${exitTime}. Copilot would have skipped this setup.`
            : trade.copilot_reasoning ?? `${trade.ticker} closed at ${exitTime} for ${formatR(trade.pnl_r)}. ${isPositive ? 'Setup played out as expected.' : 'Stop hit — conditions deteriorated.'}`}
        </p>
      </div>

      {/* Trade Breakdown */}
      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-4">
          <Card className="bg-card/60 border-border/40">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Entry</span>
                  <span className="ml-3 font-mono text-foreground">${trade.entry_price.toFixed(2)} at {entryTime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Exit</span>
                  <span className="ml-3 font-mono text-foreground">${trade.exit_price?.toFixed(2) ?? '—'} at {exitTime} (stop hit)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Result</span>
                  <span className={`ml-3 font-mono font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{formatR(trade.pnl_r)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <span className="ml-3 font-mono text-foreground">{trade.duration_mins} minutes</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gate</span>
                  <span className="ml-3"><GateBadge result={trade.gate_result} /></span>
                  <span className="ml-2 text-muted-foreground">{trade.gate_reason}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Decision</span>
                  <span className="ml-3 text-foreground">{isAi ? 'AI-approved' : 'Human overwrite'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ask section */}
          <div className="border-t border-border/40 pt-4">
            <span className="text-sm font-semibold text-foreground block mb-2">Ask Copilot about this trade</span>
            <Input
              value={questionInput}
              onChange={e => setQuestionInput(e.target.value)}
              placeholder="What would have happened if I held?"
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
const CenterPanel = ({ activeTrade, selectedClosedTrade, onBack, onFocusNLBar }: CenterPanelProps) => {
  const state: CenterPanelState = useMemo(() => {
    if (selectedClosedTrade) return 'review';
    if (activeTrade) return 'active';
    return 'scanning';
  }, [selectedClosedTrade, activeTrade]);

  if (state === 'review' && selectedClosedTrade) {
    return <ReviewState trade={selectedClosedTrade} onBack={onBack} onFocusNLBar={onFocusNLBar} />;
  }

  if (state === 'active' && activeTrade) {
    return <ActiveTradeState trade={activeTrade} onBack={onBack} onFocusNLBar={onFocusNLBar} />;
  }

  return <ScanningState />;
};

export default CenterPanel;
