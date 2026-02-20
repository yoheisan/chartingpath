import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock,
  ShieldOff, Zap, Droplets, Activity, RotateCcw, Database,
  Timer, CalendarClock, ChevronRight, Info,
} from "lucide-react";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface WorkerRun {
  worker_name: string;
  status: "idle" | "running" | "failed" | "circuit_open";
  last_watermark: string | null;
  last_run_at: string | null;
  last_success_at: string | null;
  consecutive_failures: number;
  circuit_open_until: string | null;
  metadata: {
    last_error?: string;
    last_error_at?: string;
    last_batch_size?: number;
    last_watermark?: string;
    l2_summary?: Record<string, unknown>;
    last_run_result?: string;
    ran_at?: string;
  };
  created_at: string;
  updated_at: string;
}

interface PatternCounts {
  total: number;
  pending: number;
  validated: number;
  coverage_pct: number;
}

// ─────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────
const STATUS = {
  idle: {
    label: "Idle",
    icon: CheckCircle2,
    badge: "bg-green-500/15 text-green-600 border-green-500/25",
    dot: "bg-green-500",
  },
  running: {
    label: "Running",
    icon: Activity,
    badge: "bg-blue-500/15 text-blue-500 border-blue-500/25",
    dot: "bg-blue-500 animate-pulse",
  },
  failed: {
    label: "Failed",
    icon: AlertTriangle,
    badge: "bg-yellow-500/15 text-yellow-600 border-yellow-500/25",
    dot: "bg-yellow-500",
  },
  circuit_open: {
    label: "Circuit Open",
    icon: ShieldOff,
    badge: "bg-destructive/15 text-destructive border-destructive/25",
    dot: "bg-destructive",
  },
} as const;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function relativeTime(ts: string | null) {
  if (!ts) return "—";
  try {
    return formatDistanceToNow(parseISO(ts), { addSuffix: true });
  } catch {
    return "—";
  }
}

function absoluteTime(ts: string | null) {
  if (!ts) return null;
  try {
    return format(parseISO(ts), "yyyy-MM-dd HH:mm:ss 'UTC'");
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function StatRow({ label, value, hint, mono = false }: {
  label: string;
  value: string | number | null;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/40 last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
        {label}
        {hint && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 opacity-50" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{hint}</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className={cn("text-sm text-right break-all", mono && "font-mono text-xs")}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function WorkerCard({ worker, onReset }: { worker: WorkerRun; onReset: () => void }) {
  const cfg = STATUS[worker.status] ?? STATUS.idle;
  const StatusIcon = cfg.icon;

  const isCircuitOpen = worker.circuit_open_until && new Date(worker.circuit_open_until) > new Date();
  const circuitResetsIn = isCircuitOpen
    ? formatDistanceToNow(parseISO(worker.circuit_open_until!), { addSuffix: true })
    : null;

  return (
    <Card className={cn(
      "border transition-all duration-200",
      worker.status === "circuit_open" && "border-destructive/40 bg-destructive/5",
      worker.status === "failed" && "border-yellow-500/30",
      worker.status === "running" && "border-blue-500/30",
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full shrink-0 mt-0.5", cfg.dot)} />
            <CardTitle className="text-base font-mono">{worker.worker_name}</CardTitle>
          </div>
          <Badge variant="outline" className={cn("text-xs shrink-0", cfg.badge)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {cfg.label}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Updated {relativeTime(worker.updated_at)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-0.5">
        {/* Circuit breaker alert */}
        {isCircuitOpen && (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            <ShieldOff className="h-4 w-4 shrink-0" />
            <span>Circuit open — resets {circuitResetsIn}</span>
          </div>
        )}

        {/* Failure alert */}
        {worker.consecutive_failures > 0 && !isCircuitOpen && (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{worker.consecutive_failures} consecutive failure{worker.consecutive_failures > 1 ? "s" : ""} — circuit opens at 3</span>
          </div>
        )}

        <StatRow
          label="Status"
          value={cfg.label}
        />
        <StatRow
          label="Consecutive failures"
          value={`${worker.consecutive_failures} / 3`}
          hint="Circuit opens after 3 consecutive failures and stays open for 30 minutes."
        />
        <StatRow
          label="Watermark"
          value={absoluteTime(worker.last_watermark) ?? "Not started"}
          hint="The created_at timestamp of the last successfully processed record. Backfill resumes after this point on next run."
          mono
        />
        <StatRow
          label="Last run"
          value={relativeTime(worker.last_run_at)}
        />
        <StatRow
          label="Last success"
          value={relativeTime(worker.last_success_at)}
        />
        {worker.circuit_open_until && (
          <StatRow
            label="Circuit resets"
            value={absoluteTime(worker.circuit_open_until)}
            mono
          />
        )}
        {worker.metadata?.last_error && (
          <StatRow
            label="Last error"
            value={worker.metadata.last_error}
            mono
          />
        )}
        {worker.metadata?.last_batch_size != null && (
          <StatRow
            label="Last batch size"
            value={`${worker.metadata.last_batch_size} records`}
          />
        )}
        {worker.metadata?.last_run_result && (
          <StatRow
            label="Last result"
            value={worker.metadata.last_run_result}
          />
        )}

        {/* Reset button */}
        {(worker.status === "circuit_open" || worker.consecutive_failures > 0) && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={onReset}
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Reset Circuit Breaker
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export function PipelineHealthDashboard() {
  const [resetting, setResetting] = useState<string | null>(null);

  // Fetch all worker states
  const { data: workers, isLoading: workersLoading, refetch: refetchWorkers } = useQuery({
    queryKey: ["worker-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worker_runs" as any)
        .select("*")
        .order("worker_name");
      if (error) throw error;
      return (data ?? []) as unknown as WorkerRun[];
    },
    refetchInterval: 15_000, // auto-refresh every 15s
  });

  // Fetch validation coverage counts
  const { data: counts, isLoading: countsLoading, refetch: refetchCounts } = useQuery({
    queryKey: ["validation-coverage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historical_pattern_occurrences")
        .select("validation_status");

      if (error) throw error;

      const rows = data ?? [];
      const total = rows.length;
      const validated = rows.filter((r: any) => r.validation_status === "validated").length;
      const pending = rows.filter((r: any) =>
        r.validation_status === "pending" || r.validation_status == null
      ).length;

      return {
        total,
        validated,
        pending,
        coverage_pct: total > 0 ? Math.round((validated / total) * 100) : 0,
      } as PatternCounts;
    },
    refetchInterval: 30_000,
  });

  const handleReset = async (workerName: string) => {
    setResetting(workerName);
    try {
      const { error } = await supabase
        .from("worker_runs" as any)
        .update({
          status: "idle",
          consecutive_failures: 0,
          circuit_open_until: null,
        })
        .eq("worker_name", workerName);

      if (error) throw error;
      toast.success(`Circuit breaker reset for ${workerName}`);
      refetchWorkers();
    } catch (e: any) {
      toast.error(`Reset failed: ${e.message}`);
    } finally {
      setResetting(null);
    }
  };

  const handleRefresh = () => {
    refetchWorkers();
    refetchCounts();
  };

  const isLoading = workersLoading || countsLoading;

  // Derive overall pipeline health
  const anyCircuitOpen = workers?.some(w => w.status === "circuit_open");
  const anyFailed = workers?.some(w => w.status === "failed");
  const allIdle = workers?.every(w => w.status === "idle" || w.status === "running");

  const overallStatus = anyCircuitOpen
    ? { label: "Degraded", icon: ShieldOff, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" }
    : anyFailed
    ? { label: "Warning", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" }
    : { label: "Healthy", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" };

  const OverallIcon = overallStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Pipeline Health
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Worker coordination state, circuit breakers, and validation coverage
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Overview strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall status */}
        <Card className={cn("border", overallStatus.bg)}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <OverallIcon className={cn("h-5 w-5", overallStatus.color)} />
              <div>
                <p className="text-xs text-muted-foreground">Overall</p>
                <p className={cn("font-semibold text-sm", overallStatus.color)}>{overallStatus.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total patterns */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total patterns</p>
                {countsLoading ? (
                  <Skeleton className="h-5 w-20 mt-0.5" />
                ) : (
                  <p className="font-semibold text-sm">{(counts?.total ?? 0).toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validated */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Validated</p>
                {countsLoading ? (
                  <Skeleton className="h-5 w-20 mt-0.5" />
                ) : (
                  <p className="font-semibold text-sm">{(counts?.validated ?? 0).toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pending validation</p>
                {countsLoading ? (
                  <Skeleton className="h-5 w-20 mt-0.5" />
                ) : (
                  <p className="font-semibold text-sm">{(counts?.pending ?? 0).toLocaleString()}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage bar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Validation Coverage
            </CardTitle>
            {!countsLoading && (
              <span className="text-sm font-mono font-bold text-primary">
                {counts?.coverage_pct ?? 0}%
              </span>
            )}
          </div>
          <CardDescription className="text-xs">
            Proportion of historical patterns enriched by Layer 2/3 validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {countsLoading ? (
            <Skeleton className="h-3 w-full" />
          ) : (
            <Progress
              value={counts?.coverage_pct ?? 0}
              className="h-3"
            />
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {(counts?.validated ?? 0).toLocaleString()} of {(counts?.total ?? 0).toLocaleString()} patterns validated
          </p>
        </CardContent>
      </Card>

      {/* Seeding window notice */}
      {(() => {
        const hourUtc = new Date().getUTCHours();
        const inSeedingWindow = hourUtc >= 5 && hourUtc < 12;
        if (!inSeedingWindow) return null;
        return (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-500/5 border-blue-500/20 text-sm text-blue-700 dark:text-blue-400">
            <Timer className="h-4 w-4 shrink-0" />
            <span>
              <strong>Seeding window active</strong> (05:00–12:00 UTC) — backfill-validation is automatically paused
              to prevent collisions with the daily seeding pipeline.
            </span>
          </div>
        );
      })()}

      {/* Worker cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Worker States
        </h3>
        {workersLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : !workers || workers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No worker states found in <code className="font-mono text-xs">worker_runs</code>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {workers.map(worker => (
              <WorkerCard
                key={worker.worker_name}
                worker={worker}
                onReset={() => handleReset(worker.worker_name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh note */}
      <p className="text-xs text-muted-foreground text-center">
        <CalendarClock className="inline h-3 w-3 mr-1 opacity-60" />
        Worker states refresh every 15 s · Coverage counts refresh every 30 s
      </p>
    </div>
  );
}
