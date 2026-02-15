import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock,
  Database, Wifi, Server, TrendingUp, BarChart3
} from "lucide-react";

interface ServiceCheck {
  service_name: string;
  status: string;
  latency_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  checked_at: string;
}

interface ServiceInfo {
  service_name: string;
  display_name: string;
  category: string;
  description: string | null;
  is_active: boolean;
}

interface SeedingStatus {
  source: string;
  asset_class: string;
  total_tickers: number;
  seeded_tickers: number;
  failed_tickers: number;
  last_seed_at: string | null;
  last_error: string | null;
  checked_at: string;
}

const statusConfig = {
  up: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", label: "Healthy" },
  down: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Down" },
  degraded: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Degraded" },
  timeout: { icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Timeout" },
} as const;

const categoryIcons = {
  core: Server,
  data: Database,
  analytics: BarChart3,
};

export function ServiceHealthDashboard() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [latestChecks, setLatestChecks] = useState<Record<string, ServiceCheck>>({});
  const [recentLogs, setRecentLogs] = useState<ServiceCheck[]>([]);
  const [seedingStatus, setSeedingStatus] = useState<SeedingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch services, latest checks, and seeding status in parallel
      const [svcRes, checksRes, seedRes] = await Promise.all([
        (supabase as any).from("service_registry").select("*").eq("is_active", true).order("category"),
        (supabase as any).from("service_health_checks").select("*").order("checked_at", { ascending: false }).limit(200),
        (supabase as any).from("data_seeding_status").select("*").order("checked_at", { ascending: false }),
      ]);

      if (svcRes.data) setServices(svcRes.data as ServiceInfo[]);
      if (seedRes.data) setSeedingStatus(seedRes.data as SeedingStatus[]);

      if (checksRes.data) {
        const checks = checksRes.data as ServiceCheck[];
        // Get latest check per service
        const latest: Record<string, ServiceCheck> = {};
        for (const c of checks) {
          if (!latest[c.service_name]) latest[c.service_name] = c;
        }
        setLatestChecks(latest);
        setRecentLogs(checks.slice(0, 50));
      }
    } catch (err) {
      console.error("Failed to fetch health data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const triggerPing = async () => {
    setPinging(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(
        "https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/service-health-ping",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
        }
      );
      // Wait a moment then refresh
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error("Ping failed:", err);
    } finally {
      setPinging(false);
    }
  };

  const getOverallStatus = () => {
    const checks = Object.values(latestChecks);
    if (checks.length === 0) return "unknown";
    const downCount = checks.filter((c) => c.status === "down").length;
    const degradedCount = checks.filter((c) => c.status === "degraded" || c.status === "timeout").length;
    if (downCount > 0) return "critical";
    if (degradedCount > 0) return "degraded";
    return "healthy";
  };

  const overallStatus = getOverallStatus();
  const groupedServices = services.reduce((acc, svc) => {
    acc[svc.category] = acc[svc.category] || [];
    acc[svc.category].push(svc);
    return acc;
  }, {} as Record<string, ServiceInfo[]>);

  const filteredLogs = selectedService
    ? recentLogs.filter((l) => l.service_name === selectedService)
    : recentLogs;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <Card className={
        overallStatus === "healthy" ? "border-green-500/30 bg-green-500/5" :
        overallStatus === "degraded" ? "border-yellow-500/30 bg-yellow-500/5" :
        overallStatus === "critical" ? "border-destructive/30 bg-destructive/5" :
        "border-border"
      }>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className={`h-6 w-6 ${
                overallStatus === "healthy" ? "text-green-500" :
                overallStatus === "degraded" ? "text-yellow-500" : "text-destructive"
              }`} />
              <div>
                <h3 className="font-semibold text-lg">
                  {overallStatus === "healthy" ? "All Systems Operational" :
                   overallStatus === "degraded" ? "Some Services Degraded" :
                   overallStatus === "critical" ? "Service Outage Detected" :
                   "No Health Data"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {Object.keys(latestChecks).length} services monitored •
                  Last check: {Object.values(latestChecks)[0]
                    ? new Date(Object.values(latestChecks)[0].checked_at).toLocaleTimeString()
                    : "Never"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerPing}
              disabled={pinging}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${pinging ? "animate-spin" : ""}`} />
              {pinging ? "Pinging..." : "Run Health Check"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Cards by Category */}
      {Object.entries(groupedServices).map(([category, svcs]) => {
        const CatIcon = categoryIcons[category as keyof typeof categoryIcons] || Server;
        return (
          <div key={category}>
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              <CatIcon className="h-4 w-4" />
              {category} Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {svcs.map((svc) => {
                const check = latestChecks[svc.service_name];
                const st = check ? statusConfig[check.status as keyof typeof statusConfig] : null;
                const StIcon = st?.icon || Wifi;

                return (
                  <Card
                    key={svc.service_name}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedService === svc.service_name ? "ring-2 ring-primary" : ""
                    } ${st ? `${st.border} ${st.bg}` : "border-border/50"}`}
                    onClick={() => setSelectedService(
                      selectedService === svc.service_name ? null : svc.service_name
                    )}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{svc.display_name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{svc.service_name}</p>
                        </div>
                        {st ? (
                          <Badge className={`${st.bg} ${st.color} ${st.border} shrink-0`}>
                            <StIcon className="h-3 w-3 mr-1" />
                            {st.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No data</Badge>
                        )}
                      </div>
                      {check && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>{check.latency_ms != null ? `${check.latency_ms}ms` : "-"}</span>
                          <span>HTTP {check.status_code || "-"}</span>
                          <span>{new Date(check.checked_at).toLocaleTimeString()}</span>
                        </div>
                      )}
                      {check?.error_message && (
                        <p className="text-xs text-destructive mt-2 truncate">{check.error_message}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Data Seeding Health */}
      {seedingStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Seeding Coverage
            </CardTitle>
            <CardDescription>Ticker data availability by asset class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {seedingStatus.map((s) => (
                <div key={`${s.source}-${s.asset_class}`} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">{s.asset_class}</span>
                    <Badge variant="outline" className="text-xs">{s.source}</Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {s.total_tickers > 0
                      ? `${Math.round((s.seeded_tickers / s.total_tickers) * 100)}%`
                      : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.seeded_tickers}/{s.total_tickers} tickers
                  </p>
                  {s.last_seed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last: {new Date(s.last_seed_at).toLocaleString()}
                    </p>
                  )}
                  {s.last_error && (
                    <p className="text-xs text-destructive mt-1 truncate">{s.last_error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Health Check Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Health Check Logs
            {selectedService && (
              <Badge variant="secondary" className="ml-2">
                {selectedService}
                <button
                  className="ml-1 hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); setSelectedService(null); }}
                >
                  ×
                </button>
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedService ? `Showing logs for ${selectedService}` : "Recent checks across all services"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No health check logs yet. Click "Run Health Check" to start monitoring.
              </p>
            ) : (
              filteredLogs.map((log, i) => {
                const st = statusConfig[log.status as keyof typeof statusConfig];
                const StIcon = st?.icon || Wifi;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 px-3 rounded text-sm hover:bg-muted/50 transition-colors"
                  >
                    <StIcon className={`h-4 w-4 shrink-0 ${st?.color || "text-muted-foreground"}`} />
                    <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">
                      {new Date(log.checked_at).toLocaleTimeString()}
                    </span>
                    <span className="font-medium w-48 truncate shrink-0">{log.service_name}</span>
                    <span className="text-muted-foreground w-16 shrink-0">
                      {log.latency_ms != null ? `${log.latency_ms}ms` : "-"}
                    </span>
                    {log.error_message && (
                      <span className="text-destructive text-xs truncate">{log.error_message}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
