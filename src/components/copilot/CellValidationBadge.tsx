import { ShieldCheck, ShieldAlert, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CellValidation } from "@/hooks/useCellValidation";

/**
 * States the measured evidence behind a trade, inline. Every number carries
 * its sample size; a cell with no measurement says so rather than staying silent.
 */
export function CellValidationBadge({
  cell,
  className,
}: { cell: CellValidation | null; className?: string }) {
  if (!cell || cell.status === "insufficient_sample" || cell.edge_points_test == null) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
        <HelpCircle className="h-3 w-3 shrink-0" />
        Not measured — too few historical occurrences
      </span>
    );
  }

  const pts = Number(cell.edge_points_test);
  const n = Number(cell.n_test ?? 0).toLocaleString();

  if (cell.status === "validated") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400", className)}>
        <ShieldCheck className="h-3 w-3 shrink-0" />
        Validated {pts >= 0 ? "+" : ""}{pts.toFixed(1)}pts (n={n})
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400", className)}>
      <ShieldAlert className="h-3 w-3 shrink-0" />
      Not validated — this combination showed {pts >= 0 ? "+" : ""}{pts.toFixed(1)}pts (n={n})
    </span>
  );
}
