import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, X, AlertTriangle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { CopilotAlert } from "@/hooks/useCopilotAlerts";

interface CopilotAlertBubbleProps {
  alert: CopilotAlert;
  onOpenTrade: (alert: CopilotAlert) => void;
  onDismiss: (alertId: string) => void;
  onFollowUpMessage?: (content: string) => void;
}

export function CopilotAlertBubble({ alert, onOpenTrade, onDismiss, onFollowUpMessage }: CopilotAlertBubbleProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isIntervention = alert.alert_type === 'intervention';
  const isConflict = alert.full_context?.gate_result === 'conflict';
  const [addingRule, setAddingRule] = useState(false);

  const ctx = alert.full_context as Record<string, any> | null;

  const handleAddOverrideRule = useCallback(async () => {
    if (!user?.id) return;
    setAddingRule(true);
    try {
      // Fetch current master plan
      const { data: plan } = await supabase
        .from("master_plans" as any)
        .select("id, override_constraints")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan) {
        toast.error("No active trading plan found");
        return;
      }

      // Update with override constraints
      const { error } = await supabase
        .from("master_plans" as any)
        .update({
          override_constraints: {
            require_written_reason: true,
            cooldown_seconds: 30,
          },
        })
        .eq("id", (plan as any).id);

      if (error) throw error;

      onDismiss(alert.id);

      if (onFollowUpMessage) {
        onFollowUpMessage(
          "Done. I've added a 30-second confirmation pause and a required reason field before any override. This gives you a moment to check yourself against the plan."
        );
      }

      toast.success("Override friction rule added");
    } catch (err) {
      console.error("Failed to add override rule:", err);
      toast.error("Failed to add override rule");
    } finally {
      setAddingRule(false);
    }
  }, [user?.id, alert.id, onDismiss, onFollowUpMessage]);

  return (
    <Card className={cn(
      "p-3 border-l-4 animate-in slide-in-from-right-5 fade-in-0 duration-300",
      isIntervention ? "border-l-amber-500 bg-amber-500/5" :
      isConflict ? "border-l-destructive bg-destructive/5" :
      "border-l-accent bg-accent/5"
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {isIntervention ? (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          ) : (
            <TrendingUp className="h-4 w-4 text-accent shrink-0" />
          )}
          <Badge variant="secondary" className="text-xs shrink-0">
            {alert.symbol}
          </Badge>
          {alert.timeframe && (
            <Badge variant="outline" className="text-xs shrink-0">
              {alert.timeframe}
            </Badge>
          )}
          {alert.direction && (
            <Badge variant="outline" className={cn(
              "text-xs shrink-0",
              alert.direction === 'long' ? "text-green-600 border-green-600/30" : "text-red-600 border-red-600/30"
            )}>
              {alert.direction.toUpperCase()}
            </Badge>
          )}
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-sm text-foreground/90 mb-2 leading-relaxed">
        {alert.alert_message}
      </p>

      {/* Intervention breakdown table */}
      {isIntervention && ctx && (
        <div className="mb-3 rounded border border-amber-500/20 overflow-hidden text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-amber-500/10">
                <th className="text-left px-2 py-1 font-medium text-muted-foreground"></th>
                <th className="text-right px-2 py-1 font-medium text-muted-foreground">Copilot</th>
                <th className="text-right px-2 py-1 font-medium text-muted-foreground">Your Overrides</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-amber-500/10">
                <td className="px-2 py-1 text-muted-foreground">Trades</td>
                <td className="text-right px-2 py-1">{ctx.copilot_trades ?? '—'}</td>
                <td className="text-right px-2 py-1">{ctx.override_trades ?? '—'}</td>
              </tr>
              <tr className="border-t border-amber-500/10">
                <td className="px-2 py-1 text-muted-foreground">Total R</td>
                <td className="text-right px-2 py-1 text-green-600">+{Number(ctx.copilot_r ?? 0).toFixed(1)}R</td>
                <td className={cn("text-right px-2 py-1", Number(ctx.override_r ?? 0) < 0 ? "text-red-600" : "text-foreground")}>
                  {Number(ctx.override_r ?? 0).toFixed(1)}R
                </td>
              </tr>
              <tr className="border-t border-amber-500/10">
                <td className="px-2 py-1 text-muted-foreground">Avg / trade</td>
                <td className="text-right px-2 py-1">
                  {ctx.copilot_trades > 0 ? (Number(ctx.copilot_r) / Number(ctx.copilot_trades)).toFixed(2) : '—'}R
                </td>
                <td className="text-right px-2 py-1">
                  {ctx.override_trades > 0 ? (Number(ctx.override_r) / Number(ctx.override_trades)).toFixed(2) : '—'}R
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {!isIntervention && alert.rr_ratio && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          {alert.entry_price && <span>Entry: {Number(alert.entry_price).toFixed(4)}</span>}
          {alert.stop_price && <span>SL: {Number(alert.stop_price).toFixed(4)}</span>}
          {alert.target_price && <span>TP: {Number(alert.target_price).toFixed(4)}</span>}
          <span className="font-medium text-foreground">R:R {Number(alert.rr_ratio).toFixed(1)}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isIntervention ? (
          <Button
            size="sm"
            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleAddOverrideRule}
            disabled={addingRule}
          >
            <Shield className="h-3 w-3 mr-1" />
            {addingRule ? "Adding…" : t('copilot.alerts.addOverrideRule', 'Add override rule')}
          </Button>
        ) : (
          !isConflict && alert.entry_price && (
            <Button
              size="sm"
              className="h-7 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => onOpenTrade(alert)}
            >
              {t('copilot.alerts.openTrade', 'Open Trade')}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onDismiss(alert.id)}
        >
          {t('copilot.alerts.dismiss', 'Dismiss')}
        </Button>
      </div>
    </Card>
  );
}
