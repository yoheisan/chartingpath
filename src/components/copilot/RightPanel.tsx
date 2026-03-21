import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SessionDebriefPanel } from './SessionDebriefPanel';
import { DeployModal } from './DeployModal';
import { LiveControls } from './LiveControls';
import { DivergenceBanner } from './DivergenceBanner';
import { useCopilotTrades, CopilotTrade } from '@/hooks/useCopilotTrades';
import { useLiveTrades, LiveTrade } from '@/hooks/useLiveTrades';
import { useCopilotInsight } from '@/hooks/useCopilotInsight';
import { useDeployGuardrails } from '@/hooks/useDeployGuardrails';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { useAuth } from '@/contexts/AuthContext';
import type { SelectedClosedTrade } from './CenterPanel';

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

interface RightPanelProps {
  openDebriefOnMount?: boolean;
  onDebriefOpened?: () => void;
  onTradeSelect?: (trade: SelectedClosedTrade) => void;
}

const RightPanel = ({ openDebriefOnMount, onDebriefOpened, onTradeSelect }: RightPanelProps = {}) => {
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'paper' | 'live'>('paper');
  const { user } = useAuth();
  const { todayTrades, stats: paperStats, loading } = useCopilotTrades(user?.id);
  const { trades: liveTrades, stats: liveStats, loading: liveLoading } = useLiveTrades(user?.id);
  const { insight, loading: insightLoading } = useCopilotInsight(user?.id);
  const { checks, allPassed } = useDeployGuardrails(user?.id);
  const { connection, setPaused, setLive } = useBrokerConnection(user?.id);

  const isLive = connection?.is_live ?? false;
  const isPaused = connection?.is_paused ?? false;

  // Default to live tab when live trading is active
  useEffect(() => {
    if (isLive) setActiveTab('live');
  }, [isLive]);

  useEffect(() => {
    if (openDebriefOnMount && !debriefOpen) {
      setDebriefOpen(true);
      onDebriefOpened?.();
    }
  }, [openDebriefOnMount, debriefOpen, onDebriefOpened]);

  const stats = activeTab === 'live' ? liveStats : paperStats;
  const currentTrades = activeTab === 'live' ? liveTrades : todayTrades;
  const isLoading = activeTab === 'live' ? liveLoading : loading;

  // Paper stats for deploy summary
  const deployPaperStats = {
    tradeCount: todayTrades.length,
    winRate: paperStats.aiWinRate,
    totalR: paperStats.aiPnlR + paperStats.humanPnlR,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section 1 — Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <span className="text-sm font-semibold text-foreground">Your Edge</span>
        <span className="text-xs text-muted-foreground cursor-default">Full report</span>
      </div>

      {/* Paper / Live tab toggle */}
      {isLive && (
        <div className="flex border-b border-border/40">
          {(['paper', 'live'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-foreground border-b-2 border-blue-500'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'paper' ? 'Paper' : 'Live'}
            </button>
          ))}
        </div>
      )}

      {/* Divergence banner */}
      <DivergenceBanner userId={user?.id} isLive={isLive} />

      {/* Section 2 — AI vs Human Head-to-Head */}
      <div className="flex border-b border-border/40">
        <div className="flex-1 flex flex-col items-center py-2.5 gap-0.5 min-w-0">
          <span className="text-sm uppercase tracking-wider text-muted-foreground truncate">Copilot</span>
          <span className={`text-base font-bold font-mono ${stats.aiPnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatR(stats.aiPnlR)}
          </span>
          <span className="text-sm font-mono text-muted-foreground truncate">
            {stats.aiWinRate}% · {stats.aiTradeCount} trades
          </span>
        </div>
        <div className="w-px bg-border/40 shrink-0" />
        <div className="flex-1 flex flex-col items-center py-2.5 gap-0.5 min-w-0">
          <span className="text-sm uppercase tracking-wider text-muted-foreground truncate">Overrides</span>
          <span className={`text-base font-bold font-mono ${stats.humanPnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.humanPnlR === 0 ? '0.0R' : formatR(stats.humanPnlR)}
          </span>
          <span className="text-sm font-mono text-muted-foreground truncate">
            {stats.humanWinRate}% · {stats.humanTradeCount} trades
          </span>
        </div>
      </div>

      {/* Section 3 — Metric Cards 2×2 */}
      <div className="grid grid-cols-2 gap-1 p-1.5 border-b border-border/40">
        {[
          { label: 'AI avg R', value: formatR(activeTab === 'paper' ? paperStats.aiAvgR : (liveStats.aiTradeCount > 0 ? liveStats.aiPnlR / liveStats.aiTradeCount : 0)), sub: 'per trade', positive: (activeTab === 'paper' ? paperStats.aiAvgR : liveStats.aiPnlR) >= 0 },
          { label: 'Ovr avg R', value: formatR(activeTab === 'paper' ? paperStats.humanAvgR : (liveStats.humanTradeCount > 0 ? liveStats.humanPnlR / liveStats.humanTradeCount : 0)), sub: 'per trade', positive: (activeTab === 'paper' ? paperStats.humanAvgR : liveStats.humanPnlR) >= 0 },
          { label: 'AI win rate', value: `${stats.aiWinRate}%`, sub: 'today', positive: stats.aiWinRate >= 50 },
          { label: 'Ovr win rate', value: `${stats.humanWinRate}%`, sub: 'today', positive: stats.humanWinRate >= 50 },
        ].map((m) => (
          <div key={m.label} className="rounded-md bg-secondary/50 p-1.5 flex flex-col items-center gap-0.5 min-w-0">
            <span className="text-sm text-muted-foreground truncate w-full text-center">{m.label}</span>
            <span className={`text-sm font-bold font-mono ${m.positive ? 'text-green-500' : 'text-red-500'}`}>
              {m.value}
            </span>
            <span className="text-sm text-muted-foreground">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Section 4 — Insight Card */}
      <div className={`mx-2 my-2 rounded-md bg-secondary/50 border-l-2 border-blue-500 px-2.5 py-2 transition-opacity ${insightLoading ? 'animate-pulse opacity-60' : ''}`}>
        <p className="text-sm leading-[1.6] text-muted-foreground">
          {insight || (currentTrades.length > 0
            ? `Today: ${stats.aiTradeCount} AI trades (${formatR(stats.aiPnlR)}), ${stats.humanTradeCount} overrides (${formatR(stats.humanPnlR)}).`
            : 'No trades yet today. Copilot is scanning for setups matching your plan.')}
        </p>
      </div>

      {/* Section 5 — Trade Log */}
      <div className="flex-1 min-h-0 flex flex-col border-t border-border/40">
        <span className="text-xs font-medium text-muted-foreground px-3 py-1.5">
          Today's trades {activeTab === 'live' && '(live)'}
        </span>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 px-2 pb-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground/50 text-center py-4">Loading…</div>
            ) : currentTrades.length === 0 ? (
              <div className="text-sm text-muted-foreground/50 text-center py-4">No trades today</div>
            ) : activeTab === 'paper' ? (
              (currentTrades as CopilotTrade[]).map((t) => {
                const isAi = t.attribution === 'ai_approved';
                const pnlR = t.outcome_r ?? 0;
                const isPositive = pnlR >= 0;
                const statusLabel = t.status === 'open' ? 'open' : t.close_reason?.toLowerCase().includes('stop') ? 'stopped' : 'closed';
                return (
                  <div key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50 cursor-pointer" onClick={() => {
                    if (t.status === 'closed' && onTradeSelect) {
                      onTradeSelect({
                        id: t.id,
                        ticker: t.symbol,
                        attribution: t.attribution ?? 'ai_approved',
                        entry_price: t.entry_price,
                        exit_price: t.exit_price,
                        entry_time: t.created_at,
                        exit_time: t.closed_at,
                        pnl_r: t.outcome_r ?? 0,
                        duration_mins: t.closed_at ? Math.round((new Date(t.closed_at).getTime() - new Date(t.created_at).getTime()) / 60000) : 0,
                        gate_result: t.gate_result ?? 'aligned',
                        gate_reason: t.close_reason ?? '',
                        setup_type: t.setup_type ?? t.trade_type,
                        copilot_reasoning: t.copilot_reasoning,
                      });
                    }
                  }}>
                    <Badge className={`text-sm px-1.5 py-0 font-medium rounded ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {isAi ? 'AI' : 'You'}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-foreground w-10">{t.symbol}</span>
                    <span className="text-sm text-muted-foreground flex-1 truncate">{t.setup_type || t.trade_type} · {statusLabel}</span>
                    <span className={`text-xs font-mono font-semibold ${t.status === 'open' ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {t.status === 'open' ? 'open' : formatR(pnlR)}
                    </span>
                  </div>
                );
              })
            ) : (
              (currentTrades as LiveTrade[]).map((t) => {
                const isAi = t.attribution === 'ai_approved';
                const pnlR = t.pnl_r ?? 0;
                const isPositive = pnlR >= 0;
                return (
                  <div key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50 cursor-default">
                    <Badge className={`text-sm px-1.5 py-0 font-medium rounded ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {isAi ? 'AI' : 'You'}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-foreground w-10">{t.ticker}</span>
                    <span className="text-sm text-muted-foreground flex-1 truncate">{t.setup_type || 'Trade'} · {t.outcome}</span>
                    <span className={`text-xs font-mono font-semibold ${t.outcome === 'open' ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {t.outcome === 'open' ? 'open' : formatR(pnlR)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Review today button */}
      <div className="px-3 py-2 border-t border-border/40 flex justify-center">
        <button
          onClick={() => setDebriefOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Review today →
        </button>
      </div>

      {/* Live Controls (pause/stop) — only when live */}
      {isLive && (
        <LiveControls
          isPaused={isPaused}
          onPause={() => setPaused(true)}
          onResume={() => setPaused(false)}
        />
      )}

      {/* Section 6 — Deploy Zone */}
      <div className="border-t border-border/40 px-3 py-3 flex flex-col items-center gap-1.5">
        {isLive ? (
          <div className="w-full flex items-center justify-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPaused ? 'bg-amber-400' : 'bg-blue-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-amber-500' : 'bg-blue-500'}`} />
            </span>
            <span className={`text-sm font-medium ${isPaused ? 'text-amber-400' : 'text-blue-400'}`}>
              {isPaused ? 'Paused · Alpaca' : 'Live · Alpaca'}
            </span>
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => allPassed && setDeployOpen(true)}
                  className={`w-full flex items-center justify-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                    allPassed
                      ? 'border-green-500/40 bg-green-500/10 cursor-pointer hover:bg-green-500/20'
                      : 'border-border/40 bg-muted/20 cursor-default opacity-60'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${allPassed ? 'bg-green-400' : 'bg-muted-foreground'} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${allPassed ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                  </span>
                  <span className={`text-sm font-medium ${allPassed ? 'text-green-400' : 'text-muted-foreground'}`}>
                    Deploy to Live · Alpaca
                  </span>
                </button>
              </TooltipTrigger>
              {!allPassed && (
                <TooltipContent side="top" className="max-w-[240px]">
                  <div className="space-y-1">
                    {checks.filter(c => !c.passed).map((c, i) => (
                      <p key={i} className="text-xs">✗ {c.detail}</p>
                    ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="text-sm text-muted-foreground">
          {isLive
            ? `${liveTrades.length} live trades today`
            : todayTrades.length > 0
              ? `${todayTrades.length} trades today · ${formatR(paperStats.aiPnlR + paperStats.humanPnlR)} total`
              : 'Paper running · scanning for setups'}
        </span>
      </div>

      {/* Modals */}
      <SessionDebriefPanel open={debriefOpen} onClose={() => setDebriefOpen(false)} />
      <DeployModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        checks={checks}
        paperStats={deployPaperStats}
      />
    </div>
  );
};

export default RightPanel;
