import { useMemo } from 'react';
import { PLANS_CONFIG, PlanTier, ScreenerCaps } from '@/config/plans';
import { useUserProfile } from './useUserProfile';

/**
 * All possible patterns for display purposes
 */
export const ALL_PATTERN_IDS = [
  // Base (FREE)
  'donchian-breakout-long', 'donchian-breakout-short',
  'double-top', 'double-bottom',
  'ascending-triangle', 'descending-triangle', 'symmetrical-triangle',
  // Extended (PLUS+)
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'rising-wedge', 'falling-wedge',
  // Premium (PRO/ELITE)
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
 * Full access screener caps - all patterns unlocked for all users
 */
const FULL_ACCESS_SCREENER_CAPS: ScreenerCaps = {
  maxTickersPerClass: 100,
  allowedPatterns: ALL_PATTERN_IDS
};

/**
 * Hook to get screener caps based on user's subscription tier
 * NOTE: Currently all patterns are unlocked for all users (free tier included)
 */
export function useScreenerCaps() {
  const { profile, loading: profileLoading } = useUserProfile();
  
  // All users get full access to all patterns
  const caps = FULL_ACCESS_SCREENER_CAPS;
  
  const tier = useMemo(() => {
    if (!profile?.subscription_plan) return 'FREE' as PlanTier;
    
    const planMapping: Record<string, PlanTier> = {
      'starter': 'FREE',
      'free': 'FREE',
      'plus': 'PLUS',
      'pro': 'PRO',
      'elite': 'ELITE',
      'team': 'ELITE'
    };
    
    return planMapping[profile.subscription_plan.toLowerCase()] || 'FREE';
  }, [profile?.subscription_plan]);
  
  // No locked patterns - everything is available to all users
  const lockedPatterns: string[] = [];
  
  // No upgrade incentive needed since everything is unlocked
  const upgradeIncentive = null;
  
  return {
    caps,
    tier,
    loading: profileLoading,
    lockedPatterns,
    upgradeIncentive,
    isPatternLocked: () => false // Nothing is locked
  };
}
