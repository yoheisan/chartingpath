import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WatchlistRow {
  symbol: string;
  gate: "aligned" | "partial" | "conflict";
  source: "AI" | "you";
  pnl: string;
}

const WATCHLIST_DATA: WatchlistRow[] = [
  { symbol: "NVDA", gate: "aligned", source: "AI", pnl: "+2.1R" },
  { symbol: "MSFT", gate: "aligned", source: "AI", pnl: "+1.4R" },
  { symbol: "TSLA", gate: "conflict", source: "you", pnl: "−2.0R" },
  { symbol: "AMD", gate: "partial", source: "AI", pnl: "open" },
  { symbol: "AAPL", gate: "aligned", source: "you", pnl: "queued" },
];

const GATE_STYLES = {
  aligned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  conflict: "bg-red-500/15 text-red-400 border-red-500/20",
} as const;

export function AIGatedWatchlist() {
  const [ticker, setTicker] = useState("");

  const isPnlPositive = (pnl: string) => pnl.startsWith("+");
  const isPnlNegative = (pnl: string) => pnl.startsWith("−") || pnl.startsWith("-");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Watchlist · AI Gate
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-1">
          {WATCHLIST_DATA.map((row) => (
            <div
              key={row.symbol}
              className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <span className="font-mono font-bold text-xs text-foreground w-10">
                {row.symbol}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-1.5 py-0 h-4 font-medium border",
                  GATE_STYLES[row.gate]
                )}
              >
                {row.gate}
              </Badge>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">
                {row.source}
              </span>
              <span
                className={cn(
                  "text-[11px] font-mono font-medium min-w-[40px] text-right",
                  isPnlPositive(row.pnl) && "text-emerald-400",
                  isPnlNegative(row.pnl) && "text-red-400",
                  !isPnlPositive(row.pnl) && !isPnlNegative(row.pnl) && "text-muted-foreground"
                )}
              >
                {row.pnl}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border/40">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="+ Add ticker → runs AI Gate"
          className="w-full bg-muted/30 border border-border/40 rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-blue-500/40 transition-colors"
        />
      </div>
    </div>
  );
}
