import { cn } from "@/lib/utils";

interface CopilotStatusIndicatorProps {
  isActive?: boolean;
  statusLabel?: string;
  tradeCount?: number;
  className?: string;
}

export function CopilotStatusIndicator({
  isActive = true,
  statusLabel = "Paper running",
  tradeCount = 47,
  className,
}: CopilotStatusIndicatorProps) {
  return (
    <div
      className={cn(
        "hidden lg:flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs",
        className
      )}
    >
      {/* Pulsing status dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        {isActive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isActive ? "bg-emerald-500" : "bg-muted-foreground/50"
          )}
        />
      </span>

      <span className="text-muted-foreground whitespace-nowrap">{statusLabel}</span>

      <span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-sm font-semibold leading-none whitespace-nowrap">
        {tradeCount} trades
      </span>
    </div>
  );
}
