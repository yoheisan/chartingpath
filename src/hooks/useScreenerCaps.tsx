import { useMemo } from 'react';
import { PLANS_CONFIG, PlanTier, ScreenerCaps } from '@/config/plans';
import { useUserProfile } from './useUserProfile';

/**
 * Default screener caps for anonymous/FREE users
 */
const DEFAULT_SCREENER_CAPS: ScreenerCaps = {
  maxTickersPerClass: 25,
  allowedPatterns: [
    'donchian-breakout-long', 'donchian-breakout-short',
    'double-top', 'double-bottom',
    'ascending-triangle', 'descending-triangle'
  ]
};

/**
 * All possible patterns for display purposes
 */
export const ALL_PATTERN_IDS = [
  // Base (FREE)
  'donchian-breakout-long', 'donchian-breakout-short',
  'double-top', 'double-bottom',
  'ascending-triangle', 'descending-triangle',
  // Extended (PLUS+)
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'rising-wedge', 'falling-wedge',
  // Premium (PRO/TEAM)
  'bull-flag', 'bear-flag', 'cup-and-handle', 'triple-top', 'triple-bottom'
];

/**
 * Pattern display names
 */
export const PATTERN_DISPLAY_NAMES: Record<string, string> = {
  'donchian-breakout-long': 'Donchian Breakout (Long)',
  'donchian-breakout-short': 'Donchian Breakout (Short)',
  'double-top': 'Double Top',
  'double-bottom': 'Double Bottom',
  'ascending-triangle': 'Ascending Triangle',
  'descending-triangle': 'Descending Triangle',
  'head-and-shoulders': 'Head & Shoulders',
  'inverse-head-and-shoulders': 'Inverse Head & Shoulders',
  'rising-wedge': 'Rising Wedge',
  'falling-wedge': 'Falling Wedge',
  'bull-flag': 'Bull Flag',
  'bear-flag': 'Bear Flag',
  'cup-and-handle': 'Cup & Handle',
  'triple-top': 'Triple Top',
  'triple-bottom': 'Triple Bottom'
};

/**
 * Hook to get screener caps based on user's subscription tier
 */
export function useScreenerCaps() {
  const { profile, loading: profileLoading } = useUserProfile();
  
  const caps = useMemo(() => {
    if (!profile?.subscription_plan) {
      return DEFAULT_SCREENER_CAPS;
    }
    
    // Map subscription_plan to PlanTier
    const planMapping: Record<string, PlanTier> = {
      'starter': 'FREE',
      'free': 'FREE',
      'plus': 'PLUS',
      'pro': 'PRO',
      'elite': 'TEAM',
      'team': 'TEAM'
    };
    
    const tier = planMapping[profile.subscription_plan.toLowerCase()] || 'FREE';
    return PLANS_CONFIG.tiers[tier]?.screener || DEFAULT_SCREENER_CAPS;
  }, [profile?.subscription_plan]);
  
  const tier = useMemo(() => {
    if (!profile?.subscription_plan) return 'FREE' as PlanTier;
    
    const planMapping: Record<string, PlanTier> = {
      'starter': 'FREE',
      'free': 'FREE',
      'plus': 'PLUS',
      'pro': 'PRO',
      'elite': 'TEAM',
      'team': 'TEAM'
    };
    
    return planMapping[profile.subscription_plan.toLowerCase()] || 'FREE';
  }, [profile?.subscription_plan]);
  
  // Locked patterns are those not in the user's allowed list
  const lockedPatterns = useMemo(() => {
    return ALL_PATTERN_IDS.filter(p => !caps.allowedPatterns.includes(p));
  }, [caps.allowedPatterns]);
  
  // Calculate upgrade incentive text
  const upgradeIncentive = useMemo(() => {
    if (tier === 'TEAM') return null;
    
    const nextTierPatterns = tier === 'FREE' 
      ? PLANS_CONFIG.tiers.PLUS.screener.allowedPatterns.length 
      : tier === 'PLUS' 
        ? PLANS_CONFIG.tiers.PRO.screener.allowedPatterns.length 
        : PLANS_CONFIG.tiers.TEAM.screener.allowedPatterns.length;
    
    const nextTierTickers = tier === 'FREE' 
      ? PLANS_CONFIG.tiers.PLUS.screener.maxTickersPerClass 
      : tier === 'PLUS' 
        ? PLANS_CONFIG.tiers.PRO.screener.maxTickersPerClass 
        : PLANS_CONFIG.tiers.TEAM.screener.maxTickersPerClass;
    
    const nextTierName = tier === 'FREE' ? 'Plus' : tier === 'PLUS' ? 'Pro' : 'Team';
    
    return {
      tierName: nextTierName,
      patternsUnlocked: nextTierPatterns,
      tickersUnlocked: nextTierTickers,
      additionalPatterns: nextTierPatterns - caps.allowedPatterns.length,
      additionalTickers: nextTierTickers - caps.maxTickersPerClass
    };
  }, [tier, caps]);
  
  return {
    caps,
    tier,
    loading: profileLoading,
    lockedPatterns,
    upgradeIncentive,
    isPatternLocked: (patternId: string) => !caps.allowedPatterns.includes(patternId)
  };
}
