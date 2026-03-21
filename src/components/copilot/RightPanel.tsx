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

const RightPanel = () => {
  const [debriefOpen, setDebriefOpen] = useState(false);
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
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Copilot</span>
          <span className="text-lg font-bold font-mono text-green-500">+3.5R</span>
          <span className="text-[10px] font-mono text-muted-foreground">68% · 3 trades</span>
        </div>
        <div className="w-px bg-border/40" />
        <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Your overrides</span>
          <span className="text-lg font-bold font-mono text-red-500">−2.0R</span>
          <span className="text-[10px] font-mono text-muted-foreground">33% · 1 trade</span>
        </div>
      </div>

      {/* Section 3 — Metric Cards 2×2 */}
      <div className="grid grid-cols-2 gap-1.5 p-2 border-b border-border/40">
        {[
          { label: 'AI avg R', value: '+1.8', sub: 'per trade', positive: true },
          { label: 'Override avg R', value: '−2.0', sub: 'per trade', positive: false },
          { label: 'AI win rate', value: '68%', sub: 'rolling 20', positive: true },
          { label: 'Override win rate', value: '33%', sub: 'rolling 20', positive: false },
        ].map((m) => (
          <div key={m.label} className="rounded-md bg-secondary/50 p-2 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">{m.label}</span>
            <span className={`text-sm font-bold font-mono ${m.positive ? 'text-green-500' : 'text-red-500'}`}>
              {m.value}
            </span>
            <span className="text-[9px] text-muted-foreground">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Section 4 — Insight Card */}
      <div className="mx-2 my-2 rounded-md bg-secondary/50 border-l-2 border-blue-500 px-2.5 py-2">
        <p className="text-[11px] leading-[1.6] text-muted-foreground">
          Your TSLA override lost −2R. Copilot flagged it as a conflict. Momentum overrides win 28% vs Copilot's 61% on the same pattern.
        </p>
      </div>

      {/* Section 5 — Trade Log */}
      <div className="flex-1 min-h-0 flex flex-col border-t border-border/40">
        <span className="text-xs font-medium text-muted-foreground px-3 py-1.5">Today's trades</span>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 px-2 pb-2">
            {[
              { badge: 'AI', ticker: 'NVDA', reason: 'Breakout · open', r: '+2.1R', positive: true },
              { badge: 'AI', ticker: 'MSFT', reason: 'Mean rev · closed', r: '+1.4R', positive: true },
              { badge: 'You', ticker: 'TSLA', reason: 'Override · stopped', r: '−2.0R', positive: false },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50 cursor-default">
                <Badge
                  className={`text-[9px] px-1.5 py-0 font-medium rounded ${
                    t.badge === 'AI'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {t.badge}
                </Badge>
                <span className="text-xs font-mono font-bold text-foreground w-10">{t.ticker}</span>
                <span className="text-[10px] text-muted-foreground flex-1 truncate">{t.reason}</span>
                <span className={`text-xs font-mono font-semibold ${t.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {t.r}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
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
        <span className="text-[10px] text-muted-foreground">47 paper trades · +18.4R track record</span>
      </div>
    </div>
  );
};

export default RightPanel;
