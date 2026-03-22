import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS_CONFIG, PlanTier, TIER_DISPLAY } from "@/config/plans";

export interface CreditsInfo {
  balance: number;
  monthlyAllocation: number;
  planTier: PlanTier;
  planName: string;
  usagePercent: number;
  isLow: boolean;       // < 20% remaining
  isExhausted: boolean;  // 0 credits
  loading: boolean;
}

const PLAN_MAP: Record<string, PlanTier> = {
  free: 'FREE',
  starter: 'LITE',
  pro: 'PRO',
  pro_plus: 'PRO',
  elite: 'ELITE',
};

export function useCredits(): CreditsInfo & { refetch: () => Promise<void> } {
  const { user } = useAuth();
  const [balance, setBalance] = useState(50);
  const [planTierRaw, setPlanTierRaw] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setPlanTierRaw('free');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('usage_credits')
        .select('credits_balance, plan_tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setBalance(data.credits_balance ?? 0);
        setPlanTierRaw(data.plan_tier || 'free');
      } else {
        setBalance(50);
        setPlanTierRaw('free');
      }
    } catch {
      setBalance(50);
      setPlanTierRaw('free');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const planTier = PLAN_MAP[planTierRaw] || 'FREE';
  const monthlyAllocation = PLANS_CONFIG.tiers[planTier]?.monthlyCredits || 50;
  const usagePercent = monthlyAllocation > 0 ? Math.round((balance / monthlyAllocation) * 100) : 0;

  return {
    balance,
    monthlyAllocation,
    planTier,
    planName: TIER_DISPLAY[planTier]?.name || 'Free',
    usagePercent: Math.min(usagePercent, 100),
    isLow: usagePercent > 0 && usagePercent <= 20,
    isExhausted: balance <= 0,
    loading,
    refetch: fetchCredits,
  };
}
