import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useGateEvaluation, GateEvaluation } from "@/hooks/useGateEvaluation";
import { toast } from "sonner";
import { UniversalSymbolSearch } from "@/components/charts/UniversalSymbolSearch";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WatchlistRow {
  symbol: string;
  gate: "aligned" | "partial" | "conflict";
  source: "AI" | "you";
  pnl: string;
  gateReason?: string;
}

const INITIAL_WATCHLIST: WatchlistRow[] = [];

const GATE_STYLES = {
  aligned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  conflict: "bg-red-500/15 text-red-400 border-red-500/20",
} as const;

interface AIGatedWatchlistProps {
  onConflictDetected?: (ticker: string, reason: string) => void;
}

export function AIGatedWatchlist({ onConflictDetected }: AIGatedWatchlistProps) {
  const { t } = useTranslation();
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

  const handleAddTicker = useCallback(async (symbol: string) => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return;

    // Check if already in watchlist
    if (watchlist.some((r) => r.symbol === cleanSymbol)) {
      toast.info(`${cleanSymbol} is already in your watchlist`);
      return;
    }

    // Add with loading state
    setWatchlist((prev) => [
      ...prev,
      { symbol: cleanSymbol, gate: "partial", source: "you", pnl: "scanning" },
    ]);

    // Evaluate gate
    const eval_ = await evaluate(cleanSymbol, undefined, undefined, undefined, "user_selected");
    if (eval_) {
      setWatchlist((prev) =>
        prev.map((r) =>
          r.symbol === cleanSymbol
            ? { ...r, gate: eval_.gate_result, pnl: "queued", gateReason: eval_.gate_reason }
            : r
        )
      );
      if (eval_.gate_result === "conflict" && onConflictDetected) {
        onConflictDetected(cleanSymbol, eval_.gate_reason);
      }
      toast.success(`${cleanSymbol} evaluated: ${eval_.gate_result}`);
    }
  }, [watchlist, evaluate, onConflictDetected]);

  const isPnlPositive = (pnl: string) => pnl.startsWith("+");
  const isPnlNegative = (pnl: string) => pnl.startsWith("−") || pnl.startsWith("-");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('copilot.watchlistAiGate', 'Watchlist · AI Gate')}
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
                {t(`copilot.gate_${row.gate}`, row.gate)}
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
        <UniversalSymbolSearch
          onSelect={(symbol) => handleAddTicker(symbol)}
          trigger={
            <button className="w-full flex items-center gap-2 bg-muted/30 border border-border/40 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground/50 hover:border-primary/40 hover:text-muted-foreground transition-colors">
              <Plus className="h-3 w-3" />
              {t('copilot.addTickerAiGate', 'Add ticker → runs AI Gate')}
            </button>
          }
        />
      </div>
    </div>
  );
}
