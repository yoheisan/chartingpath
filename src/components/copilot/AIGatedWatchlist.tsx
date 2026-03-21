import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useGateEvaluation, GateEvaluation } from "@/hooks/useGateEvaluation";
import { toast } from "sonner";

interface WatchlistRow {
  symbol: string;
  gate: "aligned" | "partial" | "conflict";
  source: "AI" | "you";
  pnl: string;
  gateReason?: string;
}

const INITIAL_WATCHLIST: WatchlistRow[] = [
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

interface AIGatedWatchlistProps {
  onConflictDetected?: (ticker: string, reason: string) => void;
}

export function AIGatedWatchlist({ onConflictDetected }: AIGatedWatchlistProps) {
  const [ticker, setTicker] = useState("");
  const [watchlist, setWatchlist] = useState<WatchlistRow[]>(INITIAL_WATCHLIST);
  const { evaluate, getEvaluation, isLoading } = useGateEvaluation();

  // Evaluate initial watchlist on mount
  useEffect(() => {
    INITIAL_WATCHLIST.forEach((row) => {
      evaluate(row.symbol, undefined, undefined, undefined, "ai_scan").then((eval_) => {
        if (eval_) {
          setWatchlist((prev) =>
            prev.map((r) =>
              r.symbol === row.symbol
                ? { ...r, gate: eval_.gate_result, gateReason: eval_.gate_reason }
                : r
            )
          );
          // Notify parent of conflicts
          if (eval_.gate_result === "conflict" && onConflictDetected) {
            onConflictDetected(row.symbol, eval_.gate_reason);
          }
        }
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddTicker = useCallback(async () => {
    if (!ticker.trim()) return;
    const symbol = ticker.trim().toUpperCase();

    // Check if already in watchlist
    if (watchlist.some((r) => r.symbol === symbol)) {
      toast.info(`${symbol} is already in your watchlist`);
      setTicker("");
      return;
    }

    // Add with loading state
    setWatchlist((prev) => [
      ...prev,
      { symbol, gate: "partial", source: "you", pnl: "scanning" },
    ]);
    setTicker("");

    // Evaluate gate
    const eval_ = await evaluate(symbol, undefined, undefined, undefined, "user_selected");
    if (eval_) {
      setWatchlist((prev) =>
        prev.map((r) =>
          r.symbol === symbol
            ? { ...r, gate: eval_.gate_result, pnl: "queued", gateReason: eval_.gate_reason }
            : r
        )
      );
      if (eval_.gate_result === "conflict" && onConflictDetected) {
        onConflictDetected(symbol, eval_.gate_reason);
      }
      toast.success(`${symbol} evaluated: ${eval_.gate_result}`);
    }
  }, [ticker, watchlist, evaluate, onConflictDetected]);

  const isPnlPositive = (pnl: string) => pnl.startsWith("+");
  const isPnlNegative = (pnl: string) => pnl.startsWith("−") || pnl.startsWith("-");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Watchlist · AI Gate
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-1">
          {watchlist.map((row) => (
            <div
              key={row.symbol}
              className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer group"
            >
              <span className="font-mono font-bold text-xs text-foreground w-10">
                {row.symbol}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-1.5 py-0 h-4 font-medium border",
                  GATE_STYLES[row.gate]
                )}
                title={row.gateReason}
              >
                {row.gate}
              </Badge>
              <span className="text-sm text-muted-foreground/60 ml-auto">
                {row.source}
              </span>
              <span
                className={cn(
                  "text-sm font-mono font-medium min-w-[40px] text-right",
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
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddTicker();
          }}
          placeholder="+ Add ticker → runs AI Gate"
          className="w-full bg-muted/30 border border-border/40 rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-blue-500/40 transition-colors"
        />
      </div>
    </div>
  );
}
