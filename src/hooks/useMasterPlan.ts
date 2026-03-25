import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AssetTradingSchedule {
  is_247: boolean;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  start: string | null; // "HH:MM"
  end: string | null;   // "HH:MM"
}

export type TradingSchedules = Record<string, AssetTradingSchedule>;

export interface MasterPlan {
  id: string;
  name: string;
  raw_nl_input: string | null;
  max_position_pct: number | null;
  max_open_positions: number | null;
  trading_window_start: string | null;
  trading_window_end: string | null;
  stop_loss_rule: string | null;
  excluded_conditions: string[];
  preferred_patterns: string[];
  sector_filters: string[];
  trend_direction: string | null;
  min_market_cap: string | null;
  is_active: boolean;
  plan_order: number;
  timezone: string;
  // Advanced settings
  mtf_required_timeframes: string[];
  mtf_min_aligned: number | null;
  min_agent_score: number | null;
  trend_context_filter: string | null;
  min_confluence_score: number | null;
  // Instrument universe
  asset_classes: string[];
  fx_categories: string[];
  crypto_categories: string[];
  stock_exchanges: string[];
  // Per-asset-class trading schedules
  trading_schedules: TradingSchedules;
}

export interface MandateRule {
  label: string;
  detail: string;
}

export function planToRules(plan: MasterPlan): MandateRule[] {
  const rules: MandateRule[] = [];
  if (plan.max_position_pct != null) {
    rules.push({ label: `${plan.max_position_pct}%`, detail: "max per trade" });
  }
  if (plan.max_open_positions != null) {
    rules.push({ label: `${plan.max_open_positions}`, detail: "max open positions" });
  }
  if (plan.trading_window_start && plan.trading_window_end) {
    rules.push({
      label: `${plan.trading_window_start}–${plan.trading_window_end}`,
      detail: "trading window",
    });
  }
  if (plan.stop_loss_rule) {
    rules.push({ label: plan.stop_loss_rule, detail: "stop loss always" });
  }
  if (plan.excluded_conditions?.length) {
    plan.excluded_conditions.forEach((c) => {
      rules.push({ label: `No ${c}`, detail: "excluded" });
    });
  }
  if (plan.preferred_patterns?.length) {
    plan.preferred_patterns.forEach((p) => {
      rules.push({ label: p, detail: "preferred pattern" });
    });
  }
  if (plan.sector_filters?.length) {
    plan.sector_filters.forEach((s) => {
      rules.push({ label: s, detail: "sector filter" });
    });
  }
  if (plan.trend_direction && plan.trend_direction !== "both") {
    rules.push({ label: plan.trend_direction.replace("_", " "), detail: "direction" });
  }
  if (plan.min_market_cap) {
    rules.push({ label: plan.min_market_cap, detail: "min market cap" });
  }
  // Advanced rules
  if (plan.mtf_required_timeframes?.length && plan.mtf_min_aligned) {
    rules.push({ label: `${plan.mtf_min_aligned}/${plan.mtf_required_timeframes.length} TFs`, detail: "MTF alignment" });
  }
  if (plan.min_agent_score != null) {
    rules.push({ label: `≥${plan.min_agent_score}`, detail: "min agent score" });
  }
  if (plan.trend_context_filter && plan.trend_context_filter !== "any") {
    rules.push({ label: plan.trend_context_filter.replace("_", " "), detail: "trend context" });
  }
  if (plan.min_confluence_score != null) {
    rules.push({ label: `≥${plan.min_confluence_score}%`, detail: "min confluence" });
  }
  // Instrument universe rules
  if (plan.asset_classes?.length) {
    const subDetails: string[] = [];
    if (plan.stock_exchanges?.length) subDetails.push(plan.stock_exchanges.join(", "));
    if (plan.fx_categories?.length) subDetails.push(plan.fx_categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ") + " FX");
    if (plan.crypto_categories?.length) subDetails.push(plan.crypto_categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ") + " crypto");
    const label = plan.asset_classes.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(", ");
    const detail = subDetails.length ? subDetails.join(" · ") : "instrument universe";
    rules.push({ label, detail });
  }
  return rules;
}

export function useMasterPlan() {
  const [plans, setPlans] = useState<MasterPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [rules, setRules] = useState<MandateRule[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) ?? plans[0] ?? null;

  const fetchPlans = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("master_plans" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("plan_order", { ascending: true });

    if (!error && data && (data as any[]).length > 0) {
      const allPlans = data as any as MasterPlan[];
      setPlans(allPlans);
      // Keep selection if still valid, otherwise select first
      if (!selectedPlanId || !allPlans.find(p => p.id === selectedPlanId)) {
        setSelectedPlanId(allPlans[0].id);
        setRules(planToRules(allPlans[0]));
      } else {
        const current = allPlans.find(p => p.id === selectedPlanId)!;
        setRules(planToRules(current));
      }
    } else {
      setPlans([]);
      setSelectedPlanId(null);
      setRules([]);
    }
    setLoading(false);
  }, [selectedPlanId]);

  useEffect(() => {
    fetchPlans();
    const handler = () => fetchPlans();
    window.addEventListener("mandate-saved", handler);
    return () => window.removeEventListener("mandate-saved", handler);
  }, [fetchPlans]);

  const selectPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    const p = plans.find(pl => pl.id === planId);
    if (p) setRules(planToRules(p));
  }, [plans]);

  const refreshPlan = useCallback(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plan: selectedPlan,
    plans,
    rules,
    loading,
    refreshPlan,
    hasPlan: plans.length > 0,
    selectedPlanId,
    selectPlan,
  };
}
