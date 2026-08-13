import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Info, Play, RefreshCw, XCircle } from "lucide-react";

interface CheckRow {
  check_name: string;
  severity: string;
  description: string | null;
  expected_result: string | null;
  is_enabled: boolean;
}

interface ResultRow {
  id: string;
  check_name: string;
  passed: boolean;
  observed_value: string | null;
  detail: unknown;
  run_at: string;
  duration_ms: number | null;
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };

function severityBadge(severity: string) {
  if (severity === "critical") return <Badge variant="destructive">critical</Badge>;
  if (severity === "warning")
    return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">warning</Badge>;
  return <Badge variant="secondary">info</Badge>;
}

/** 30-day pass/fail history: one bar per day, newest on the right. */
function Sparkline({ history }: { history: { day: string; passed: boolean }[] }) {
  if (history.length === 0) {
    return <span className="text-xs text-muted-foreground">no history</span>;
  }
  return (
    <div className="flex items-end gap-[2px]" aria-label="30 day history">
      {history.map((h) => (
        <span
          key={h.day}
          title={`${h.day}: ${h.passed ? "pass" : "fail"}`}
          className={`h-4 w-[3px] rounded-sm ${h.passed ? "bg-emerald-500/70" : "bg-destructive"}`}
        />
      ))}
    </div>
  );
}

export function DataHealthDashboard() {
  const [checks, setChecks] = useState<CheckRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [checksRes, resultsRes] = await Promise.all([
      supabase.from("data_health_checks").select("*").order("severity"),
      supabase
        .from("data_health_results")
        .select("id, check_name, passed, observed_value, detail, run_at, duration_ms")
        .gte("run_at", since)
        .order("run_at", { ascending: false })
        .limit(1000),
    ]);
    if (checksRes.error || resultsRes.error) {
      toast({
        title: "Could not load data health",
        description: checksRes.error?.message ?? resultsRes.error?.message,
        variant: "destructive",
      });
    }
    setChecks((checksRes.data ?? []) as CheckRow[]);
    setResults((resultsRes.data ?? []) as ResultRow[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const byCheck = useMemo(() => {
    const map = new Map<string, ResultRow[]>();
    for (const r of results) {
      const list = map.get(r.check_name) ?? [];
      list.push(r);
      map.set(r.check_name, list);
    }
    return map;
  }, [results]);

  const rows = useMemo(() => {
    return [...checks]
      .sort(
        (a, b) =>
          (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3) ||
          a.check_name.localeCompare(b.check_name),
      )
      .map((c) => {
        const runs = byCheck.get(c.check_name) ?? [];
        const latest = runs[0];
        // One entry per day: the worst outcome that day, oldest first.
        const dayMap = new Map<string, boolean>();
        for (const r of [...runs].reverse()) {
          const day = r.run_at.slice(0, 10);
          dayMap.set(day, (dayMap.get(day) ?? true) && r.passed);
        }
        return {
          check: c,
          latest,
          history: [...dayMap.entries()].map(([day, passed]) => ({ day, passed })),
        };
      });
  }, [checks, byCheck]);

  const failing = rows.filter((r) => r.latest && !r.latest.passed);
  const criticalFailing = failing.filter((r) => r.check.severity === "critical");
  const lastRun = results[0]?.run_at;

  const runChecks = async (checkName?: string) => {
    setRunning(checkName ?? "all");
    try {
      const { error } = await supabase.functions.invoke("run-data-health-checks", {
        body: { manual: true, ...(checkName ? { check_name: checkName } : {}) },
      });
      if (error) throw error;
      await load();
      toast({ title: checkName ? `Ran ${checkName}` : "Ran all checks" });
    } catch (e) {
      toast({
        title: "Run failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Data Health
              {criticalFailing.length > 0 ? (
                <Badge variant="destructive">{criticalFailing.length} critical</Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
                  no critical failures
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              These checks detect and report only. Nothing here changes data — the single
              automatic actor is the write-time guard that refuses an impossible trade close.
              Last run: {lastRun ? new Date(lastRun).toLocaleString() : "never"}.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" disabled={running !== null} onClick={() => void runChecks()}>
              <Play className="mr-2 h-4 w-4" />
              {running === "all" ? "Running…" : "Run all checks"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {failing.length} of {rows.length} checks are currently failing. A check can only
            catch what it was told to assert — a clean board is not proof the data is right.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map(({ check, latest, history }) => {
          const passed = latest?.passed ?? null;
          const isOpen = expanded === check.check_name;
          return (
            <Card
              key={check.check_name}
              className={
                passed === false && check.severity === "critical" ? "border-destructive/50" : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {passed === null ? (
                    <Info className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : passed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : check.severity === "critical" ? (
                    <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                  )}

                  <div className="min-w-[220px] flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{check.check_name}</span>
                      {severityBadge(check.severity)}
                      {!check.is_enabled && <Badge variant="outline">disabled</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{check.description}</p>
                  </div>

                  <div className="min-w-[200px] text-sm">
                    <div className={passed === false ? "text-destructive" : ""}>
                      {latest?.observed_value ?? "never run"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {latest ? new Date(latest.run_at).toLocaleString() : ""}
                      {latest?.duration_ms != null ? ` · ${latest.duration_ms} ms` : ""}
                    </div>
                  </div>

                  <Sparkline history={history} />

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(isOpen ? null : check.check_name)}
                    >
                      {isOpen ? "Hide" : "Details"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={running !== null}
                      onClick={() => void runChecks(check.check_name)}
                    >
                      {running === check.check_name ? "Running…" : "Run"}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-2 rounded-md bg-muted/40 p-3 text-xs">
                    <div>
                      <span className="font-medium">Expected: </span>
                      {check.expected_result ?? "n/a"}
                    </div>
                    {latest?.detail != null && (
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(latest.detail, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default DataHealthDashboard;
