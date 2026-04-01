import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TradeEntryParams {
  ticker: string;
  setup_type?: string;
  timeframe?: string;
  direction?: string;
  entry_price?: number;
  stop_price?: number;
  target_price?: number;
  gate_result?: "aligned" | "partial" | "conflict";
  gate_reason?: string;
  gate_evaluation_id?: string;
  agent_score?: number;
  source?: "copilot" | "override" | "manual";
  override_reason?: string;
}

export interface PendingConflictTrade {
  params: TradeEntryParams;
  label: string;
  reason: string;
}

export function usePaperTradeEntry() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingConflict, setPendingConflict] = useState<PendingConflictTrade | null>(null);

  const enterTrade = useCallback(
    async (params: TradeEntryParams, attribution: "ai_approved" | "human_overwrite") => {
      if (!user?.id) {
        toast.error("Sign in to place paper trades");
        return false;
      }

      setIsSubmitting(true);
      try {
        // Get active master plan — required for paper trading
        const { data: plan } = await supabase
          .from("master_plans" as any)
          .select("id, max_position_pct")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!plan) {
          toast.error("Create a Trading Plan first", {
            description: "Paper trading requires an active Master Plan to track performance accurately.",
          });
          return false;
        }

        const positionPct = (plan as any)?.max_position_pct ?? 2;
        const entryPrice = params.entry_price ?? 100;
        const rUnit = entryPrice * (positionPct / 100);
        const stopPrice = params.stop_price ?? (entryPrice - 2 * rUnit);
        const targetPrice = params.target_price ?? (entryPrice + 3 * rUnit);

        // Determine source based on attribution and explicit param
        let tradeSource = params.source || "manual";
        if (attribution === "ai_approved" && !params.source) {
          tradeSource = "copilot";
        } else if (attribution === "human_overwrite" && !params.source) {
          tradeSource = "override";
        }

        const insertData: Record<string, any> = {
          user_id: user.id,
          master_plan_id: (plan as any)?.id ?? null,
          gate_evaluation_id: params.gate_evaluation_id ?? null,
          ticker: params.ticker,
          entry_price: entryPrice,
          position_size_pct: positionPct,
          setup_type: params.setup_type ?? null,
          stop_price: stopPrice,
          target_price: targetPrice,
          entry_time: new Date().toISOString(),
          source: tradeSource,
          gate_result: params.gate_result ?? "aligned",
          gate_reason: params.gate_reason ?? null,
          user_action: attribution === "ai_approved" ? "auto" : "overwrite",
          attribution,
          outcome: "open",
        };

        if (params.override_reason) {
          insertData.override_reason = params.override_reason;
        }

        const { error } = await supabase.from("paper_trades" as any).insert(insertData);

        if (error) {
          console.error("Paper trade insert error:", error);
          toast.error("Failed to open paper trade");
          return false;
        }

        toast.success(`Paper trade opened: ${params.ticker}`);
        return true;
      } catch (err) {
        console.error("Paper trade entry error:", err);
        toast.error("Failed to open paper trade");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id]
  );

  /**
   * Smart entry — checks gate result and either enters directly (aligned)
   * or surfaces a pendingConflict for the UI to render as a guarded modal.
   */
  const tradeWithGateCheck = useCallback(
    (params: TradeEntryParams) => {
      const gate = params.gate_result ?? "aligned";

      if (gate === "aligned") {
        enterTrade(params, "ai_approved");
      } else {
        const label = gate === "conflict" ? "Conflicts with your plan" : "Partial match with your plan";
        const reason = params.gate_reason || `${params.ticker} is a ${gate} setup.`;
        setPendingConflict({ params, label, reason });
      }
    },
    [enterTrade]
  );

  const confirmConflictTrade = useCallback((overrideReason?: string) => {
    if (!pendingConflict) return;
    enterTrade(
      {
        ...pendingConflict.params,
        source: "override",
        override_reason: overrideReason,
      },
      "human_overwrite"
    );
    setPendingConflict(null);
  }, [pendingConflict, enterTrade]);

  const dismissConflict = useCallback(() => {
    setPendingConflict(null);
  }, []);

  return { enterTrade, tradeWithGateCheck, isSubmitting, pendingConflict, confirmConflictTrade, dismissConflict };
}
