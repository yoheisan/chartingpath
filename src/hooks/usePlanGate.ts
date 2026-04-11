import { useMemo } from 'react';
import { PLANS_CONFIG, PlanTier } from '@/config/plans';
import { useUserProfile } from './useUserProfile';
import { useAuth } from '@/contexts/AuthContext';

export type EffectiveTier = 'GUEST' | 'FREE' | 'LITE' | 'PRO' | 'ELITE';

export function usePlanGate() {
  const { user, isAuthLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const tier = useMemo((): EffectiveTier => {
    if (!user) return 'GUEST';
    const plan = profile?.subscription_plan?.toLowerCase();
    if (!plan || plan === 'free') return 'FREE';
    if (plan === 'lite') return 'LITE';
    if (plan === 'plus') return 'LITE'; // migrate PLUS → LITE
    if (plan === 'pro') return 'PRO';
    if (plan === 'elite') return 'ELITE';
    return 'FREE';
  }, [user, profile?.subscription_plan]);

  const planTier = tier === 'GUEST' ? 'FREE' : tier as PlanTier;
  const caps = PLANS_CONFIG.tiers[planTier];

  return {
    tier,
    isGuest: tier === 'GUEST',
    loading: isAuthLoading || profileLoading,
    // Feature access flags
    canAccessCopilot: ['PRO', 'ELITE'].includes(tier),
    canAccessEdgeAtlas: !['GUEST', 'FREE'].includes(tier),
    canAccessPatternLab: !['GUEST'].includes(tier),
    canAccessAllTimeframes: ['PRO', 'ELITE'].includes(tier),
    canAccess1hTimeframe: ['PRO', 'ELITE'].includes(tier),
    canAccessAllAssetClasses: ['LITE', 'PRO', 'ELITE'].includes(tier),
    canAccessGradeA: ['PRO', 'ELITE'].includes(tier),
    canAccessFullHistory: ['LITE', 'PRO', 'ELITE'].includes(tier),
    canAccessACS: tier === 'ELITE',
    canAccessAPI: tier === 'ELITE',
    canSetAlerts: tier !== 'GUEST',
    canUsePaperTrading: !['GUEST', 'FREE'].includes(tier),
    // Numeric caps
    maxAlertsPerDay: tier === 'GUEST' ? 0 : tier === 'FREE' ? 3 : tier === 'LITE' ? 10 : 999,
    maxActivePlans: tier === 'GUEST' ? 0 : caps?.maxActivePlans ?? 1,
    maxWatchlistSlots: caps?.maxWatchlistSlots ?? 0,
    // Guest-specific
    guestPatternLimit: 5,
    caps,
  };
}
