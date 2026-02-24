import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MapPin, CheckCircle, XCircle, Globe, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LoginAttempt {
  id: string;
  email: string | null;
  success: boolean;
  method: string;
  ip_address: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  user_agent: string | null;
  error_message: string | null;
  created_at: string;
}

export function LoginAttemptsPanel() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("login_attempts" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50) as any;
    setAttempts((data as LoginAttempt[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  const parseUA = (ua: string | null) => {
    if (!ua) return "Unknown";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Other";
  };

  const successCount = attempts.filter((a) => a.success).length;
  const failCount = attempts.filter((a) => !a.success).length;
  const uniqueCountries = [...new Set(attempts.map((a) => a.country).filter(Boolean))];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Login Attempts
          </CardTitle>
          <CardDescription>
            Last 50 login attempts with geolocation data
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{successCount}</div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{failCount}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{uniqueCountries.length}</div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </div>
        </div>

        {/* Table */}
        {attempts.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">No login attempts recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Method</th>
                  <th className="px-3 py-2 text-left font-medium">Location</th>
                  <th className="px-3 py-2 text-left font-medium">IP</th>
                  <th className="px-3 py-2 text-left font-medium">Browser</th>
                  <th className="px-3 py-2 text-left font-medium">Time</th>
                  <th className="px-3 py-2 text-left font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2">
                      {a.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs max-w-[180px] truncate">
                      {a.email || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-xs">{a.method}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {a.city || a.country ? (
                        <span className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {[a.city, a.region, a.country].filter(Boolean).join(", ")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {a.ip_address || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1 text-xs">
                        <Monitor className="h-3 w-3 text-muted-foreground" />
                        {parseUA(a.user_agent)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(a.created_at)}
                    </td>
                    <td className="px-3 py-2 text-xs text-red-500 max-w-[150px] truncate">
                      {a.error_message || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
