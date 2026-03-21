import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MasterPlan {
  id: string;
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
}

export interface MandateRule {
  label: string;
  detail: string;
}

function planToRules(plan: MasterPlan): MandateRule[] {
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
  return rules;
}

export function useMasterPlan() {
  const [plan, setPlan] = useState<MasterPlan | null>(null);
  const [rules, setRules] = useState<MandateRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
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
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const p = data as any as MasterPlan;
      setPlan(p);
      setRules(planToRules(p));
    } else {
      setPlan(null);
      setRules([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const refreshPlan = useCallback(() => {
    fetchPlan();
  }, [fetchPlan]);

  return { plan, rules, loading, refreshPlan, hasPlan: !!plan };
}
