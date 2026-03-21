import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useBrokerConnection } from "@/hooks/useBrokerConnection";
import { useCopilotTrades } from "@/hooks/useCopilotTrades";

interface CopilotStatusIndicatorProps {
  className?: string;
}

export function CopilotStatusIndicator({ className }: CopilotStatusIndicatorProps) {
  const { user } = useAuth();
  const { connection } = useBrokerConnection(user?.id);
  const { todayTrades } = useCopilotTrades(user?.id);

  const isLive = connection?.is_live ?? false;
  const isPaused = connection?.is_paused ?? false;

  let dotColor = "bg-emerald-500";
  let pingColor = "bg-emerald-400";
  let statusLabel = "Paper running";
  let showPing = true;

  if (isLive && isPaused) {
    dotColor = "bg-amber-500";
    pingColor = "bg-amber-400";
    statusLabel = "Paused";
  } else if (isLive) {
    dotColor = "bg-blue-500";
    pingColor = "bg-blue-400";
    statusLabel = "Live — Alpaca";
  } else if (!isLive && connection) {
    dotColor = "bg-muted-foreground/50";
    statusLabel = "Offline";
    showPing = false;
  }

  const tradeCount = todayTrades.length;

  return (
    <div
      className={cn(
        "hidden lg:flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs",
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {showPing && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", pingColor)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)} />
      </span>

      <span className="text-muted-foreground whitespace-nowrap">{statusLabel}</span>

      <span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-sm font-semibold leading-none whitespace-nowrap">
        {tradeCount} trades
      </span>
    </div>
  );
}
