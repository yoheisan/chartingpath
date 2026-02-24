import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  History, RefreshCw, TrendingUp, TrendingDown, Clock, Target,
  ShieldAlert, CheckCircle2, XCircle, Minus, ChevronDown, ChevronUp,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";

interface AlertLogEntry {
  id: string;
  alert_id: string;
  triggered_at: string | null;
  checked_at: string | null;
  entry_price: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  pattern_data: any;
  price_data: any;
  email_sent: boolean | null;
  outcome_status: string | null;
  outcome_pnl_percent: number | null;
  outcome_price: number | null;
  outcome_r_multiple: number | null;
  outcome_at: string | null;
  // joined from alerts
  alert_symbol?: string;
  alert_pattern?: string;
  alert_timeframe?: string;
}

interface AlertHistoryLogProps {
  userId: string;
}

export function AlertHistoryLog({ userId }: AlertHistoryLogProps) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AlertLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch alerts_log joined with alerts for symbol/pattern info
      const { data, error } = await supabase
        .from("alerts_log")
        .select(`
          id,
          alert_id,
          triggered_at,
          checked_at,
          entry_price,
          stop_loss_price,
          take_profit_price,
          pattern_data,
          price_data,
          email_sent,
          outcome_status,
          outcome_pnl_percent,
          outcome_price,
          outcome_r_multiple,
          outcome_at,
          alerts!inner (
            symbol,
            pattern,
            timeframe,
            user_id
          )
        `)
        .eq("alerts.user_id", userId)
        .order("triggered_at", { ascending: false, nullsFirst: false })
        .limit(100);

      if (error) {
        console.error("AlertHistoryLog fetch error:", error);
        setLogs([]);
        return;
      }

      const mapped = (data || []).map((row: any) => ({
        ...row,
        alert_symbol: row.alerts?.symbol,
        alert_pattern: row.alerts?.pattern,
        alert_timeframe: row.alerts?.timeframe,
      }));
      setLogs(mapped);
    } catch (err) {
      console.error("AlertHistoryLog error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOutcomeBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline" className="text-xs">Pending</Badge>;
    switch (status) {
      case "hit_tp":
        return (
          <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" /> TP Hit
          </Badge>
        );
      case "hit_sl":
        return (
          <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-xs">
            <XCircle className="h-3 w-3 mr-1" /> SL Hit
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="secondary" className="text-xs">
            <Minus className="h-3 w-3 mr-1" /> Expired
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getDirectionFromPattern = (pattern: string | undefined) => {
    if (!pattern) return null;
    const longPatterns = ["double-bottom", "ascending-triangle", "inverse-head-and-shoulders", "falling-wedge", "bull-flag", "cup-and-handle", "donchian-breakout-long", "hammer", "bullish_engulfing", "morning_star", "inverted_hammer"];
    const shortPatterns = ["double-top", "descending-triangle", "head-and-shoulders", "rising-wedge", "bear-flag", "donchian-breakout-short", "bearish_engulfing", "evening_star"];
    if (longPatterns.some((p) => pattern.includes(p))) return "long";
    if (shortPatterns.some((p) => pattern.includes(p))) return "short";
    return null;
  };

  const visibleLogs = showAll ? logs : logs.slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Alert History
          </CardTitle>
          <CardDescription>
            Past notifications — when your alerts were triggered
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10">
            <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No triggered alerts yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              When your alerts match a detected pattern, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleLogs.map((log) => {
              const direction = getDirectionFromPattern(log.alert_pattern);
              const isExpanded = expandedId === log.id;
              const patternData = typeof log.pattern_data === "object" ? log.pattern_data : null;

              return (
                <div
                  key={log.id}
                  className="border rounded-lg transition-colors hover:bg-muted/20"
                >
                  {/* Main row */}
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    {/* Direction icon */}
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      direction === "long"
                        ? "bg-green-500/10 text-green-500"
                        : direction === "short"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {direction === "long" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : direction === "short" ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{log.alert_symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.alert_pattern?.replace(/-/g, " ").replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {log.alert_timeframe}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {log.triggered_at
                          ? formatDistanceToNow(new Date(log.triggered_at), { addSuffix: true })
                          : "—"}
                        {log.entry_price && (
                          <span className="ml-2">
                            Entry: <span className="text-foreground font-medium">${log.entry_price.toFixed(2)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Outcome */}
                    <div className="shrink-0 flex items-center gap-2">
                      {getOutcomeBadge(log.outcome_status)}
                      {log.outcome_pnl_percent != null && (
                        <span className={`text-xs font-semibold ${
                          log.outcome_pnl_percent >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {log.outcome_pnl_percent >= 0 ? "+" : ""}{log.outcome_pnl_percent.toFixed(1)}%
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0">
                      <Separator className="mb-3" />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Triggered</span>
                          <span className="font-medium">{formatDate(log.triggered_at)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Entry Price</span>
                          <span className="font-medium">
                            {log.entry_price ? `$${log.entry_price.toFixed(4)}` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Stop Loss</span>
                          <span className="font-medium text-red-500">
                            {log.stop_loss_price ? `$${log.stop_loss_price.toFixed(4)}` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Take Profit</span>
                          <span className="font-medium text-green-500">
                            {log.take_profit_price ? `$${log.take_profit_price.toFixed(4)}` : "—"}
                          </span>
                        </div>
                        {log.outcome_status && (
                          <>
                            <div>
                              <span className="text-muted-foreground block">Outcome</span>
                              {getOutcomeBadge(log.outcome_status)}
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Exit Price</span>
                              <span className="font-medium">
                                {log.outcome_price ? `$${log.outcome_price.toFixed(4)}` : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">P&L</span>
                              <span className={`font-medium ${
                                (log.outcome_pnl_percent || 0) >= 0 ? "text-green-500" : "text-red-500"
                              }`}>
                                {log.outcome_pnl_percent != null
                                  ? `${log.outcome_pnl_percent >= 0 ? "+" : ""}${log.outcome_pnl_percent.toFixed(2)}%`
                                  : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">R Multiple</span>
                              <span className="font-medium">
                                {log.outcome_r_multiple != null
                                  ? `${log.outcome_r_multiple >= 0 ? "+" : ""}${log.outcome_r_multiple.toFixed(2)}R`
                                  : "—"}
                              </span>
                            </div>
                          </>
                        )}
                        {log.email_sent && (
                          <div>
                            <span className="text-muted-foreground block">Email</span>
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Sent
                            </Badge>
                          </div>
                        )}
                      </div>
                      {patternData?.quality_score && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Quality: <span className="font-medium text-foreground capitalize">{patternData.quality_score}</span>
                          </span>
                          {patternData.trend_alignment && (
                            <span className="text-muted-foreground">
                              • Trend: <span className="font-medium text-foreground capitalize">{patternData.trend_alignment}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show more */}
            {logs.length > 10 && !showAll && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setShowAll(true)}
              >
                Show all {logs.length} entries
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            )}
            {showAll && logs.length > 10 && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setShowAll(false)}
              >
                Show less
                <ChevronUp className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
