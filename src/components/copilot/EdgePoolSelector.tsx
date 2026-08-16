import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Check, Loader2, ShieldCheck, Info } from "lucide-react";
import type { EdgePoolCell, PoolInstrument, PoolFilters } from "@/hooks/useEdgePool";

const ASSET_LABELS: Record<string, string> = {
  stocks: "Stocks", forex: "Forex", crypto: "Crypto",
  commodities: "Commodities", indices: "Indices", etfs: "ETFs",
};

const DIRECTION_OPTIONS = [
  { value: null, label: "Both" },
  { value: "bullish" as const, label: "Long" },
  { value: "bearish" as const, label: "Short" },
];

interface Props {
  cells: EdgePoolCell[];
  loadingPool: boolean;
  totalCellsMeasured?: number;
  filters: PoolFilters;
  onFiltersChange: (next: PoolFilters) => void;
  instruments: PoolInstrument[];
  summary: { cell_count: number; instrument_count: number; avg_edge_points: number | null } | null;
  loadingInstruments: boolean;
  validatedOnly: boolean;
  onValidatedOnlyChange: (next: boolean) => void;
}

export function EdgePoolSelector({
  cells, loadingPool, totalCellsMeasured = 932, filters, onFiltersChange,
  instruments, summary, loadingInstruments, validatedOnly, onValidatedOnlyChange,
}: Props) {
  const assetOptions = useMemo(
    () => Array.from(new Set(cells.map(c => c.asset_type))).sort(),
    [cells]
  );
  const timeframeOptions = useMemo(
    () => Array.from(new Set(cells.map(c => c.timeframe))).sort(),
    [cells]
  );

  const filteredCells = useMemo(() => cells.filter(c =>
    (!filters.assetTypes.length || filters.assetTypes.includes(c.asset_type)) &&
    (!filters.timeframes.length || filters.timeframes.includes(c.timeframe)) &&
    (!filters.direction || c.direction === filters.direction)
  ), [cells, filters]);

  const countFor = (predicate: (c: EdgePoolCell) => boolean) =>
    cells.filter(c =>
      predicate(c) &&
      (!filters.timeframes.length || filters.timeframes.includes(c.timeframe)) &&
      (!filters.direction || c.direction === filters.direction)
    ).length;

  const toggle = (key: "assetTypes" | "timeframes", value: string) => {
    const current = filters[key];
    onFiltersChange({
      ...filters,
      [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
    });
  };

  const shownInstruments = filters.maxInstruments
    ? instruments.slice(0, filters.maxInstruments)
    : instruments;

  return (
    <div className="space-y-5">
      {/* ── The pool ── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">
            {loadingPool ? "Loading the edge pool…" : `${cells.length} combinations currently show measured edge`}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Each row is one pattern × timeframe × asset class × direction that beat its own
          random-walk baseline in both halves of the data. This is the universe your plan trades from.
        </p>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-medium text-muted-foreground">
            <span>Combination</span>
            <span className="text-right">Edge (pts)</span>
            <span className="text-right">n</span>
            <span className="text-right">Net exp.</span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
            {loadingPool && (
              <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            )}
            {!loadingPool && filteredCells.length === 0 && (
              <p className="p-3 text-xs text-muted-foreground">
                No validated combinations match these filters. Widen asset class, timeframe or direction.
              </p>
            )}
            {filteredCells.map(c => (
              <div key={`${c.pattern_id}-${c.timeframe}-${c.asset_type}-${c.direction}`}
                   className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-xs">
                <span className="text-foreground truncate">
                  {(c.pattern_name || c.pattern_id).replace(/[-_]/g, " ")}
                  <span className="text-muted-foreground">
                    {" · "}{c.timeframe.toUpperCase()} · {ASSET_LABELS[c.asset_type] ?? c.asset_type} · {c.direction === "bullish" ? "long" : "short"}
                  </span>
                </span>
                <span className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  +{Number(c.edge_points).toFixed(1)}
                </span>
                <span className="text-right text-muted-foreground">{c.total_trades}</span>
                <span className={cn("text-right font-medium",
                  Number(c.expectancy_r_net) > 0 ? "text-foreground" : "text-muted-foreground")}>
                  {Number(c.expectancy_r_net) > 0 ? "+" : ""}{Number(c.expectancy_r_net).toFixed(3)}R
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Narrow the pool ── */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Narrow it down</h4>

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Asset classes</span>
          <div className="flex flex-wrap gap-1.5">
            {assetOptions.map(a => {
              const selected = filters.assetTypes.includes(a);
              const n = countFor(c => c.asset_type === a);
              return (
                <button key={a} onClick={() => toggle("assetTypes", a)}
                  className={cn("inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all",
                    selected ? "bg-primary/15 border-primary/40 text-primary"
                             : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground")}>
                  {selected && <Check className="h-3 w-3" />}
                  {ASSET_LABELS[a] ?? a}
                  <span className="opacity-60">({n})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Timeframes</span>
          <div className="flex flex-wrap gap-1.5">
            {timeframeOptions.map(tf => {
              const selected = filters.timeframes.includes(tf);
              const n = cells.filter(c => c.timeframe === tf &&
                (!filters.assetTypes.length || filters.assetTypes.includes(c.asset_type)) &&
                (!filters.direction || c.direction === filters.direction)).length;
              return (
                <button key={tf} onClick={() => toggle("timeframes", tf)}
                  className={cn("inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all",
                    selected ? "bg-primary/15 border-primary/40 text-primary"
                             : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground")}>
                  {selected && <Check className="h-3 w-3" />}
                  {tf.toUpperCase()}
                  <span className="opacity-60">({n})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Direction</span>
          <div className="flex gap-2">
            {DIRECTION_OPTIONS.map(opt => (
              <button key={String(opt.value)}
                onClick={() => onFiltersChange({ ...filters, direction: opt.value })}
                className={cn("flex-1 py-2 rounded-md text-xs font-medium border transition-all",
                  filters.direction === opt.value
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground")}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">How many instruments to follow</span>
          <div className="flex gap-1.5">
            {[25, 50, 100, 250, null].map(v => (
              <button key={String(v)}
                onClick={() => onFiltersChange({ ...filters, maxInstruments: v })}
                className={cn("flex-1 py-1.5 rounded-md text-xs font-medium border transition-all",
                  filters.maxInstruments === v
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground")}>
                {v ?? "All"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
          {loadingInstruments ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Resolving instruments…</span>
          ) : (
            <>
              <strong>{summary?.cell_count ?? filteredCells.length}</strong> combinations ·{" "}
              <strong>{shownInstruments.length}</strong> instruments
              {summary?.instrument_count && filters.maxInstruments && summary.instrument_count > shownInstruments.length
                ? ` (top ${shownInstruments.length} of ${summary.instrument_count} by measured edge, then sample size)`
                : ""}
              {summary?.avg_edge_points != null && <> · average edge +{Number(summary.avg_edge_points).toFixed(2)} pts</>}
            </>
          )}
        </div>

        {shownInstruments.length > 0 && (
          <div className="rounded-lg border border-border/50 max-h-40 overflow-y-auto p-2 flex flex-wrap gap-1">
            {shownInstruments.map(i => (
              <span key={i.symbol} className="px-1.5 py-0.5 rounded bg-muted/50 text-[11px] text-muted-foreground">
                {i.symbol}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Honest labelling ── */}
      <section className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">What "validated" means here</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {cells.length} of {totalCellsMeasured} measured combinations passed validation. Validated cells
          average about +5.6 points of edge over chance. A sample of n≥100 can only reliably detect roughly a
          12-point edge, so smaller real effects may be missed or overstated. These results are out-of-sample
          but <strong>not yet forward-tested</strong>. Validated does not mean guaranteed.{" "}
          <Link to="/methodology" className="text-primary underline underline-offset-2">Read the methodology</Link>.
        </p>
      </section>

      {/* ── Deliberate opt-out ── */}
      <label className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!validatedOnly}
          onChange={e => onValidatedOnlyChange(!e.target.checked)}
          className="mt-0.5 rounded border-input"
        />
        <span className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
          Also trade combinations with no measured edge. This samples the full population, most of which
          measured no edge or negative edge, and makes your forward record harder to interpret.
        </span>
      </label>
    </div>
  );
}
