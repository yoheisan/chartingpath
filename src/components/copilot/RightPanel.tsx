import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SessionDebriefPanel } from './SessionDebriefPanel';
import { useCopilotTrades, CopilotTrade } from '@/hooks/useCopilotTrades';
import { useCopilotInsight } from '@/hooks/useCopilotInsight';
import { useAuth } from '@/contexts/AuthContext';

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

interface RightPanelProps {
  openDebriefOnMount?: boolean;
  onDebriefOpened?: () => void;
}

const RightPanel = ({ openDebriefOnMount, onDebriefOpened }: RightPanelProps = {}) => {
  const [debriefOpen, setDebriefOpen] = useState(false);
  const { user } = useAuth();
  const { todayTrades, stats, loading } = useCopilotTrades(user?.id);
  const { insight, loading: insightLoading } = useCopilotInsight(user?.id);

  return (
    <div className="flex flex-col h-full">
      {/* Section 1 — Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <span className="text-sm font-semibold text-foreground">Your Edge</span>
        <span className="text-xs text-muted-foreground cursor-default">Full report</span>
      </div>

      {/* Section 2 — AI vs Human Head-to-Head */}
      <div className="flex border-b border-border/40">
        <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
          <span className="text-sm uppercase tracking-wider text-muted-foreground">Copilot</span>
          <span className={`text-lg font-bold font-mono ${stats.aiPnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatR(stats.aiPnlR)}
          </span>
          <span className="text-sm font-mono text-muted-foreground">
            {stats.aiWinRate}% · {stats.aiTradeCount} trade{stats.aiTradeCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="w-px bg-border/40" />
        <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
          <span className="text-sm uppercase tracking-wider text-muted-foreground">Your overrides</span>
          <span className={`text-lg font-bold font-mono ${stats.humanPnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.humanPnlR === 0 ? '0.0R' : formatR(stats.humanPnlR)}
          </span>
          <span className="text-sm font-mono text-muted-foreground">
            {stats.humanWinRate}% · {stats.humanTradeCount} trade{stats.humanTradeCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Section 3 — Metric Cards 2×2 */}
      <div className="grid grid-cols-2 gap-1.5 p-2 border-b border-border/40">
        {[
          { label: 'AI avg R', value: formatR(stats.aiAvgR), sub: 'per trade', positive: stats.aiAvgR >= 0 },
          { label: 'Override avg R', value: formatR(stats.humanAvgR), sub: 'per trade', positive: stats.humanAvgR >= 0 },
          { label: 'AI win rate', value: `${stats.aiWinRate}%`, sub: 'today', positive: stats.aiWinRate >= 50 },
          { label: 'Override win rate', value: `${stats.humanWinRate}%`, sub: 'today', positive: stats.humanWinRate >= 50 },
        ].map((m) => (
          <div key={m.label} className="rounded-md bg-secondary/50 p-2 flex flex-col items-center gap-0.5">
            <span className="text-sm text-muted-foreground">{m.label}</span>
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
          {insight || (todayTrades.length > 0
            ? `Today: ${stats.aiTradeCount} AI trades (${formatR(stats.aiPnlR)}), ${stats.humanTradeCount} overrides (${formatR(stats.humanPnlR)}).`
            : 'No trades yet today. Copilot is scanning for setups matching your plan.')}
        </p>
      </div>

      {/* Section 5 — Trade Log */}
      <div className="flex-1 min-h-0 flex flex-col border-t border-border/40">
        <span className="text-xs font-medium text-muted-foreground px-3 py-1.5">Today's trades</span>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 px-2 pb-2">
            {loading ? (
              <div className="text-sm text-muted-foreground/50 text-center py-4">Loading…</div>
            ) : todayTrades.length === 0 ? (
              <div className="text-sm text-muted-foreground/50 text-center py-4">No trades today</div>
            ) : (
              todayTrades.map((t: CopilotTrade) => {
                const isAi = t.attribution === 'ai_approved';
                const pnlR = t.outcome_r ?? 0;
                const isPositive = pnlR >= 0;
                const statusLabel = t.status === 'open'
                  ? 'open'
                  : t.close_reason?.toLowerCase().includes('stop')
                    ? 'stopped'
                    : 'closed';

                return (
                  <div key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50 cursor-default">
                    <Badge
                      className={`text-sm px-1.5 py-0 font-medium rounded ${
                        isAi
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isAi ? 'AI' : 'You'}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-foreground w-10">{t.symbol}</span>
                    <span className="text-sm text-muted-foreground flex-1 truncate">
                      {t.setup_type || t.trade_type} · {statusLabel}
                    </span>
                    <span className={`text-xs font-mono font-semibold ${
                      t.status === 'open' ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {t.status === 'open' ? 'open' : formatR(pnlR)}
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

      {/* Section 6 — Deploy Zone */}
      <div className="border-t border-border/40 px-3 py-3 flex flex-col items-center gap-1.5">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-full flex items-center justify-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-sm font-medium text-green-400">Deploy to Live · Alpaca</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Complete 20 paper trades with positive expectancy to unlock</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-sm text-muted-foreground">
          {todayTrades.length > 0
            ? `${todayTrades.length} trades today · ${formatR(stats.aiPnlR + stats.humanPnlR)} total`
            : 'Paper running · scanning for setups'}
        </span>
      </div>

      {/* Session Debrief slide-in */}
      <SessionDebriefPanel open={debriefOpen} onClose={() => setDebriefOpen(false)} />
    </div>
  );
};

export default RightPanel;
