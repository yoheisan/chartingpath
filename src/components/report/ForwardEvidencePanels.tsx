import { Link } from "react-router-dom";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForwardEvidence } from "@/hooks/useForwardEvidence";
import { MIN_FORWARD_SAMPLE, MIN_DECAY_SAMPLE } from "@/config/sampleSize";

const pretty = (s: string) => s.replace(/[-_]/g, " ");
const pts = (v: number | null) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${Number(v).toFixed(1)}pts`);

/**
 * The only question that matters: are validated cells performing as predicted?
 * Every number here carries its sample size, and nothing is printed below the
 * sample floor.
 */
export function ForwardEvidencePanels({ userId }: { userId?: string }) {
  const { cells, split, loading } = useForwardEvidence(userId);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const validatedCells = cells.filter(c => c.validation_status === "validated");
  const decayed = validatedCells.filter(
    c => c.n_forward >= MIN_DECAY_SAMPLE && (c.realised_edge_points ?? 0) < 0
  );
  const validatedBucket = split.find(s => s.bucket === "validated");
  const unvalidatedBucket = split.find(s => s.bucket !== "validated");

  return (
    <div className="space-y-6">
      {/* Panel 1 — forward vs predicted */}
      <section className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Forward record vs predicted edge</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Predicted edge is the out-of-sample measurement that qualified the cell. Realised edge is what
          actually happened once we traded it. A cell needs {MIN_FORWARD_SAMPLE} resolved forward trades
          before we print a rate. <Link to="/methodology" className="text-primary underline underline-offset-2">Methodology</Link>.
        </p>

        {validatedCells.length === 0 ? (
          <p className="text-xs text-muted-foreground">No validated cells have been traded yet.</p>
        ) : (
          <div className="rounded-md border border-border/50 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-medium text-muted-foreground">
              <span>Cell</span>
              <span className="text-right">Predicted</span>
              <span className="text-right">Realised</span>
              <span className="text-right">n</span>
            </div>
            <div className="divide-y divide-border/40">
              {validatedCells.map(c => {
                const enough = c.n_forward >= MIN_FORWARD_SAMPLE;
                return (
                  <div key={`${c.pattern_id}-${c.timeframe}-${c.asset_type}-${c.direction}`}
                       className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-xs">
                    <span className="truncate text-foreground">
                      {pretty(c.pattern_id)}
                      <span className="text-muted-foreground"> · {c.timeframe.toUpperCase()} · {c.asset_type} · {c.direction === "bullish" ? "long" : "short"}</span>
                    </span>
                    <span className="text-right text-muted-foreground">{pts(c.predicted_edge_points)}</span>
                    <span className={cn("text-right font-medium",
                      !enough ? "text-muted-foreground"
                        : (c.realised_edge_points ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                      {enough ? pts(c.realised_edge_points) : `building record — ${c.n_forward} trade${c.n_forward === 1 ? "" : "s"}`}
                    </span>
                    <span className="text-right text-muted-foreground">{c.n_forward}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Panel 2 — validated vs unvalidated */}
      <section className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Validated vs unvalidated trades</h3>
        <p className="text-xs text-muted-foreground">
          The honesty check on our own claim. If unvalidated trades perform as well, the validation is not
          doing any work.
        </p>
        {split.length === 0 ? (
          <p className="text-xs text-muted-foreground">No resolved trades yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[validatedBucket, unvalidatedBucket].map((b, i) => (
              <div key={i} className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {i === 0 ? "Validated cells" : "Unvalidated cells"}
                </p>
                {!b || b.n_trades === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">No trades</p>
                ) : (
                  <>
                    <p className="text-lg font-semibold tabular-nums text-foreground mt-0.5">
                      {b.avg_r == null ? "—" : `${Number(b.avg_r) >= 0 ? "+" : ""}${Number(b.avg_r).toFixed(2)}R`}
                      <span className="text-xs font-normal text-muted-foreground"> avg</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      n={b.n_trades}
                      {b.n_trades < MIN_FORWARD_SAMPLE && " — below the 30-trade floor, treat as provisional"}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Panel 3 — cell decay */}
      <section className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Cell decay</h3>
        <p className="text-xs text-muted-foreground">
          Validated cells whose forward edge has gone negative over {MIN_DECAY_SAMPLE}+ trades. These are
          flagged for suspension.
        </p>
        {decayed.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No validated cell has {MIN_DECAY_SAMPLE}+ forward trades with negative edge.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {decayed.map(c => (
              <li key={`${c.pattern_id}-${c.timeframe}-${c.asset_type}-${c.direction}`}
                  className="flex items-center gap-2 text-xs rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-foreground">
                  {pretty(c.pattern_id)} · {c.timeframe.toUpperCase()} · {c.asset_type} · {c.direction === "bullish" ? "long" : "short"}
                </span>
                <span className="ml-auto text-amber-600 dark:text-amber-400">
                  forward {pts(c.realised_edge_points)} on n={c.n_forward} (predicted {pts(c.predicted_edge_points)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
