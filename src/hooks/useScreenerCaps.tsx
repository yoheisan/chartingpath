import { useMemo } from 'react';
import { PLANS_CONFIG } from '@/config/plans';
import { usePlanGate } from './usePlanGate';

/**
 * All possible patterns for display purposes
 */
export const ALL_PATTERN_IDS = [
  // Base (FREE)
  'donchian-breakout-long', 'donchian-breakout-short',
  'double-top', 'double-bottom',
  'ascending-triangle', 'descending-triangle', 'symmetrical-triangle',
  // Extended (LITE+)
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
  'symmetrical-triangle': 'Symmetrical Triangle',
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

export function useScreenerCaps() {
  const { tier, isGuest, guestPatternLimit } = usePlanGate();

  const planTier = isGuest ? 'FREE' : tier as any;
  const caps = PLANS_CONFIG.tiers[planTier]?.screener ?? PLANS_CONFIG.tiers.FREE.screener;

  // Guests see only 5 patterns max (blur gate handled in UI)
  const effectiveCaps = isGuest
    ? { ...PLANS_CONFIG.tiers.FREE.screener, maxTickersPerClass: guestPatternLimit }
    : caps;

  const lockedPatterns = useMemo(
    () => ALL_PATTERN_IDS.filter(id => !effectiveCaps.allowedPatterns.includes(id)),
    [effectiveCaps.allowedPatterns]
  );

  const upgradeIncentive = useMemo(() => {
    if (lockedPatterns.length === 0) return null;
    const nextTier = isGuest || tier === 'FREE' ? 'Lite' : tier === 'LITE' ? 'Pro' : null;
    if (!nextTier) return null;
    return `Upgrade to ${nextTier} to unlock ${lockedPatterns.slice(0, 2).map(id => PATTERN_DISPLAY_NAMES[id]).join(', ')} and more`;
  }, [lockedPatterns, tier, isGuest]);

  return {
    caps: effectiveCaps,
    tier,
    loading: false,
    lockedPatterns,
    upgradeIncentive,
    isPatternLocked: (patternId: string) => !effectiveCaps.allowedPatterns.includes(patternId),
  };
}
