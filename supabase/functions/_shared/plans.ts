/**
 * Plan Caps Configuration
 * 
 * SINGLE SOURCE OF TRUTH for tier limits and credit allocations.
 * 
 * ARCHITECTURE NOTE: Due to Deno bundling constraints, this file is duplicated:
 * - Frontend: src/config/plans.ts
 * - Edge functions: supabase/functions/_shared/plans.ts (this file)
 * 
 * BOTH FILES MUST BE IDENTICAL (except for the header comment).
 * A sync test verifies they match.
 */

export type PlanTier = 'FREE' | 'PLUS' | 'PRO' | 'TEAM';
export type ProjectType = 'setup_finder' | 'pattern_lab' | 'portfolio_checkup' | 'portfolio_sim';

export interface SetupFinderCaps {
  maxInstruments: number;
  maxLookbackYears: number;
  maxPatterns: number;
  allowedTimeframes: string[];
}

export interface PatternLabCaps {
  enabled: boolean;
  maxInstruments?: number;
  maxLookbackYears?: number;
  maxPatterns?: number;
  maxSweeps?: number;
  allowedTimeframes?: string[];
}

export interface PortfolioCheckupCaps {
  maxHoldings: number;
  maxLookbackYears: number;
  allowedTimeframes: string[];
}

export interface PortfolioSimCaps {
  maxHoldings: number;
  maxLookbackYears: number;
  rebalanceOptions: string[];
  allowedTimeframes: string[];
}

export interface ProjectCaps {
  setup_finder: SetupFinderCaps;
  pattern_lab: PatternLabCaps;
  portfolio_checkup: PortfolioCheckupCaps;
  portfolio_sim: PortfolioSimCaps;
}

export interface TierConfig {
  monthlyCredits: number;
  dailyRunCap: number;
  maxConcurrentRuns: number;
  maxActiveAlerts: number;
  projects: ProjectCaps;
}

export interface PlansConfig {
  tiers: Record<PlanTier, TierConfig>;
}

export const PLANS_CONFIG: PlansConfig = {
  tiers: {
    FREE: {
      monthlyCredits: 25,
      dailyRunCap: 1,
      maxConcurrentRuns: 1,
      maxActiveAlerts: 3,
      projects: {
        setup_finder: { maxInstruments: 10, maxLookbackYears: 1, maxPatterns: 3, allowedTimeframes: ['1d'] },
        pattern_lab: { enabled: false },
        portfolio_checkup: { maxHoldings: 10, maxLookbackYears: 1, allowedTimeframes: ['1d'] },
        portfolio_sim: { maxHoldings: 10, maxLookbackYears: 3, rebalanceOptions: ['yearly'], allowedTimeframes: ['1d'] }
      }
    },
    PLUS: {
      monthlyCredits: 300,
      dailyRunCap: 3,
      maxConcurrentRuns: 1,
      maxActiveAlerts: 25,
      projects: {
        setup_finder: { maxInstruments: 30, maxLookbackYears: 3, maxPatterns: 6, allowedTimeframes: ['4h', '1d'] },
        pattern_lab: { enabled: true, maxInstruments: 5, maxLookbackYears: 5, maxPatterns: 4, maxSweeps: 1, allowedTimeframes: ['1d'] },
        portfolio_checkup: { maxHoldings: 50, maxLookbackYears: 3, allowedTimeframes: ['1d', '4h'] },
        portfolio_sim: { maxHoldings: 20, maxLookbackYears: 10, rebalanceOptions: ['monthly', 'quarterly', 'yearly'], allowedTimeframes: ['1d'] }
      }
    },
    PRO: {
      monthlyCredits: 900,
      dailyRunCap: 10,
      maxConcurrentRuns: 1,
      maxActiveAlerts: 100,
      projects: {
        setup_finder: { maxInstruments: 50, maxLookbackYears: 5, maxPatterns: 8, allowedTimeframes: ['4h', '1d'] },
        pattern_lab: { enabled: true, maxInstruments: 10, maxLookbackYears: 7, maxPatterns: 6, maxSweeps: 3, allowedTimeframes: ['4h', '1d'] },
        portfolio_checkup: { maxHoldings: 100, maxLookbackYears: 5, allowedTimeframes: ['1d', '4h'] },
        portfolio_sim: { maxHoldings: 30, maxLookbackYears: 15, rebalanceOptions: ['monthly', 'quarterly', 'yearly'], allowedTimeframes: ['1d'] }
      }
    },
    TEAM: {
      monthlyCredits: 3000,
      dailyRunCap: 30,
      maxConcurrentRuns: 2,
      maxActiveAlerts: 300,
      projects: {
        setup_finder: { maxInstruments: 100, maxLookbackYears: 7, maxPatterns: 10, allowedTimeframes: ['4h', '1d'] },
        pattern_lab: { enabled: true, maxInstruments: 25, maxLookbackYears: 10, maxPatterns: 8, maxSweeps: 5, allowedTimeframes: ['4h', '1d'] },
        portfolio_checkup: { maxHoldings: 250, maxLookbackYears: 10, allowedTimeframes: ['1d', '4h'] },
        portfolio_sim: { maxHoldings: 100, maxLookbackYears: 20, rebalanceOptions: ['monthly', 'quarterly', 'yearly'], allowedTimeframes: ['1d'] }
      }
    }
  }
};

// ============= CREDIT ESTIMATION =============

/**
 * Bars per year by timeframe
 */
export const BARS_PER_YEAR: Record<string, number> = {
  '1d': 365,
  '4h': 2190,  // 365 * 6
  '1h': 8760,  // 365 * 24
};

/**
 * Credit unit: 1 credit = 100,000 bar-ops
 */
export const CREDIT_UNIT = 100_000;

export interface EstimateCreditsInput {
  projectType: ProjectType;
  instrumentCount: number;
  patternCount: number;
  lookbackYears: number;
  timeframe: string;
  cacheHitRatio?: number;
  rebalancePerYear?: number; // For portfolio_sim
}

export interface EstimateCreditsResult {
  creditsEstimated: number;
  breakdown: {
    base: number;
    scanOps: number;
    planOps: number;
    fetchOps: number;
    simOps: number;
    rebalanceOps: number;
  };
  cacheHitRatio: number;
}

/**
 * Deterministic credit estimation function.
 * This is the single source of truth for credit costs.
 */
export function estimateCredits(input: EstimateCreditsInput): EstimateCreditsResult {
  const {
    projectType,
    instrumentCount,
    patternCount,
    lookbackYears,
    timeframe,
    cacheHitRatio = 0,
    rebalancePerYear = 4 // quarterly default
  } = input;

  const barsPerYear = BARS_PER_YEAR[timeframe] || 365;
  const barsPerInstrument = barsPerYear * lookbackYears;
  const totalBars = instrumentCount * barsPerInstrument;
  const uncachedInstruments = instrumentCount * (1 - cacheHitRatio);

  let base = 2;
  let scanOps = 0;
  let planOps = 0;
  let fetchOps = 0;
  let simOps = 0;
  let rebalanceOps = 0;

  switch (projectType) {
    case 'setup_finder':
      base = 2.0;
      scanOps = totalBars * patternCount * 1.0;
      planOps = instrumentCount * 2000;
      fetchOps = uncachedInstruments * barsPerInstrument * 0.35;
      break;

    case 'pattern_lab':
      base = 4.0;
      scanOps = totalBars * patternCount * 1.0;
      simOps = totalBars * 0.75;
      fetchOps = uncachedInstruments * barsPerInstrument * 0.35;
      break;

    case 'portfolio_checkup':
      base = 1.0;
      simOps = totalBars * 0.20; // stateOps
      fetchOps = uncachedInstruments * barsPerInstrument * 0.25;
      break;

    case 'portfolio_sim':
      base = 3.0;
      simOps = totalBars * 0.60;
      rebalanceOps = (lookbackYears * rebalancePerYear) * 8000;
      fetchOps = uncachedInstruments * barsPerInstrument * 0.30;
      break;
  }

  const totalOps = scanOps + planOps + fetchOps + simOps + rebalanceOps;
  const creditsEstimated = Math.ceil(base + totalOps / CREDIT_UNIT);

  return {
    creditsEstimated,
    breakdown: {
      base,
      scanOps,
      planOps,
      fetchOps,
      simOps,
      rebalanceOps
    },
    cacheHitRatio
  };
}

// ============= TIER DISPLAY HELPERS =============

export interface TierDisplayInfo {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  dailyRunCap: number;
  maxActiveAlerts: number;
  bestFor: string;
  color: string;
}

export const TIER_DISPLAY: Record<PlanTier, TierDisplayInfo> = {
  FREE: {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCredits: 25,
    dailyRunCap: 1,
    maxActiveAlerts: 3,
    bestFor: 'Exploring pattern recognition basics',
    color: 'text-muted-foreground'
  },
  PLUS: {
    name: 'Plus',
    monthlyPrice: 29,
    annualPrice: 290,
    monthlyCredits: 300,
    dailyRunCap: 3,
    maxActiveAlerts: 25,
    bestFor: 'Active traders building systematic edge',
    color: 'text-blue-500'
  },
  PRO: {
    name: 'Pro',
    monthlyPrice: 79,
    annualPrice: 790,
    monthlyCredits: 900,
    dailyRunCap: 10,
    maxActiveAlerts: 100,
    bestFor: 'Professional traders with diverse portfolios',
    color: 'text-violet-500'
  },
  TEAM: {
    name: 'Team',
    monthlyPrice: 199,
    annualPrice: 1990,
    monthlyCredits: 3000,
    dailyRunCap: 30,
    maxActiveAlerts: 300,
    bestFor: 'Trading teams and prop desks',
    color: 'text-amber-500'
  }
};

export function getTierCaps(tier: PlanTier): TierConfig {
  return PLANS_CONFIG.tiers[tier] || PLANS_CONFIG.tiers.FREE;
}

export function getProjectCaps(tier: PlanTier, projectType: ProjectType) {
  return PLANS_CONFIG.tiers[tier]?.projects[projectType];
}

export function validateProjectInputs(
  tier: PlanTier,
  projectType: ProjectType,
  inputs: { instrumentCount?: number; lookbackYears?: number; patternCount?: number; timeframe?: string }
): { valid: boolean; errors: string[] } {
  const caps = getProjectCaps(tier, projectType);
  const errors: string[] = [];

  if (!caps) {
    return { valid: false, errors: ['Project type not available for your tier'] };
  }

  if ('enabled' in caps && !caps.enabled) {
    return { valid: false, errors: ['This project is not available on your plan'] };
  }

  if ('maxInstruments' in caps && inputs.instrumentCount && inputs.instrumentCount > caps.maxInstruments) {
    errors.push(`Maximum ${caps.maxInstruments} instruments allowed on ${tier} plan`);
  }

  if ('maxLookbackYears' in caps && inputs.lookbackYears && inputs.lookbackYears > caps.maxLookbackYears) {
    errors.push(`Maximum ${caps.maxLookbackYears} years lookback allowed on ${tier} plan`);
  }

  if ('maxPatterns' in caps && inputs.patternCount && inputs.patternCount > (caps as SetupFinderCaps).maxPatterns) {
    errors.push(`Maximum ${(caps as SetupFinderCaps).maxPatterns} patterns allowed on ${tier} plan`);
  }

  if ('allowedTimeframes' in caps && inputs.timeframe && !caps.allowedTimeframes.includes(inputs.timeframe)) {
    errors.push(`${inputs.timeframe} timeframe not available on ${tier} plan. Allowed: ${caps.allowedTimeframes.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Plans config version for sync verification
 */
export const PLANS_CONFIG_VERSION = '1.0.0';
