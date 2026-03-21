import { Button } from "@/components/ui/button";

interface ConflictBannerProps {
  onFocusNLBar: (prefill?: string) => void;
  conflictTicker?: string | null;
  conflictReason?: string | null;
  onDismiss?: () => void;
}

export function ConflictBanner({ onFocusNLBar, conflictTicker, conflictReason, onDismiss }: ConflictBannerProps) {
  // Don't render if no conflict data
  if (!conflictTicker && !conflictReason) {
    return null;
  }

  const ticker = conflictTicker || "TSLA";
  const reason = conflictReason || "Momentum setup — conflicts with your breakout mandate. Adding this goes against your stated edge.";

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
      <p className="text-xs font-semibold text-amber-300">⚠ Copilot flagged {ticker}</p>
      <p className="text-sm text-amber-200/70 leading-relaxed">
        {reason}
      </p>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="h-6 text-sm px-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/20">
          Add anyway
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDismiss}
          className="h-6 text-sm px-2 border-border/60 text-muted-foreground hover:bg-muted/40"
        >
          Skip
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFocusNLBar("Update plan")}
          className="h-6 text-sm px-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
        >
          Update plan
        </Button>
      </div>
    </div>
  );
}
