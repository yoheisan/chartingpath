import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus, Bell, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UniversalSymbolSearch } from "@/components/charts/UniversalSymbolSearch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { MasterPlan } from "@/hooks/useMasterPlan";

interface AlertRow {
  id: string;
  symbol: string;
  pattern: string;
  timeframe: string;
  status: string;
  auto_paper_trade: boolean;
}

interface MyAlertsPanelProps {
  activePlan: MasterPlan | null;
}

const DEFAULT_TIMEFRAME = "1d";

export function MyAlertsPanel({ activePlan }: MyAlertsPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("alerts")
      .select("id, symbol, pattern, timeframe, status, auto_paper_trade")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) setAlerts(data as AlertRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Group alerts by symbol for compact display
  const grouped = alerts.reduce<Record<string, AlertRow[]>>((acc, a) => {
    (acc[a.symbol] ??= []).push(a);
    return acc;
  }, {});

  const handleAddTicker = useCallback(async (symbol: string) => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol || !user) return;

    if (!activePlan) {
      toast.error(t('copilot.noPlanForAlert', 'Create a Trading Plan first to add alerts'));
      return;
    }

    const patterns = activePlan.preferred_patterns?.length
      ? activePlan.preferred_patterns
      : ["double_bottom"]; // fallback default

    const timeframe = activePlan.mtf_required_timeframes?.[0] || DEFAULT_TIMEFRAME;

    // Check if alerts already exist for this symbol
    const existingPatterns = (grouped[cleanSymbol] || []).map(a => a.pattern);
    const newPatterns = patterns.filter(p => !existingPatterns.includes(p));

    if (newPatterns.length === 0) {
      toast.info(t('copilot.alertsAlreadyExist', `Alerts already exist for ${cleanSymbol}`));
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-alert", {
        body: {
          symbol: cleanSymbol,
          patterns: newPatterns,
          timeframe,
          action: "create",
          auto_paper_trade: true,
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.code === "ALERT_LIMIT") {
          toast.error(t('copilot.alertLimitReached', `Alert limit reached (${data.current}/${data.max}). Upgrade to add more.`));
        } else {
          toast.error(data.error);
        }
        return;
      }

      toast.success(
        t('copilot.alertsCreated', `${newPatterns.length} alert(s) created for ${cleanSymbol}`)
      );
      fetchAlerts();
    } catch (err: any) {
      console.error("Create alert error:", err);
      toast.error(t('copilot.alertCreateFailed', 'Failed to create alerts'));
    } finally {
      setCreating(false);
    }
  }, [user, activePlan, grouped, fetchAlerts, t]);

  const handleDelete = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from("alerts")
      .update({ status: "deleted" })
      .eq("id", alertId);

    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success(t('copilot.alertRemoved', 'Alert removed'));
    }
  }, [t]);

  if (!user) {
    return (
      <div className="flex flex-col px-3 py-4">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('copilot.myAlerts', 'My Alerts')}
        </span>
        <p className="text-sm text-muted-foreground/60 mt-2">
          {t('copilot.signInForAlerts', 'Sign in to manage alerts')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" />
          {t('copilot.myAlerts', 'My Alerts')}
        </span>
        <Badge variant="secondary" className="text-sm h-5 px-1.5">
          {alerts.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-1">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-sm text-muted-foreground/60 px-2 py-3">
              {t('copilot.noAlerts', 'No active alerts. Add a ticker below.')}
            </p>
          ) : (
            Object.entries(grouped).map(([symbol, symbolAlerts]) => (
              <div
                key={symbol}
                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/30 transition-colors group"
              >
                <span className="font-mono font-bold text-sm text-foreground w-14 truncate">
                  {symbol}
                </span>
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {symbolAlerts.slice(0, 2).map(a => (
                    <Badge
                      key={a.id}
                      variant="outline"
                      className="text-[11px] px-1.5 py-0 h-5 font-medium border border-primary/20 text-primary/80 truncate max-w-[80px]"
                      title={`${a.pattern} · ${a.timeframe}`}
                    >
                      {a.pattern.replace(/_/g, ' ').slice(0, 10)}
                    </Badge>
                  ))}
                  {symbolAlerts.length > 2 && (
                    <Badge variant="outline" className="text-[11px] px-1 py-0 h-5">
                      +{symbolAlerts.length - 2}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => symbolAlerts.forEach(a => handleDelete(a.id))}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all"
                  title={t('copilot.removeAlerts', 'Remove alerts')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border/40">
        <UniversalSymbolSearch
          onSelect={(symbol) => handleAddTicker(symbol)}
          trigger={
            <button
              disabled={creating}
              className="w-full flex items-center gap-2 bg-muted/30 border border-border/40 rounded-md px-2.5 py-2 text-sm text-muted-foreground/50 hover:border-primary/40 hover:text-muted-foreground transition-colors disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {t('copilot.addTickerCreateAlerts', 'Add ticker → auto-create alerts')}
            </button>
          }
        />
      </div>
    </div>
  );
}
