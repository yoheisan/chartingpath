/**
 * Maps options strategy article slugs to their payoff diagram configurations.
 * Based on research from tastytrade, Option Alpha, and ProjectOption.
 * 
 * Each configuration provides realistic example parameters for educational visualization.
 */

import { OptionsPayoffConfig, OptionsStrategyType } from '@/components/charts/OptionsPayoffChart';

export interface OptionsArticleConfig {
  configs: OptionsPayoffConfig[];
  greeksTable?: GreeksTableData;
  educationalNotes?: string[];
}

export interface GreeksTableData {
  delta: { value: string; impact: string };
  gamma: { value: string; impact: string };
  theta: { value: string; impact: string };
  vega: { value: string; impact: string };
}

/**
 * Mapping of article slugs to options payoff configurations.
 * Uses realistic example values based on a $100 stock.
 */
export const OPTIONS_STRATEGY_MAPPING: Record<string, OptionsArticleConfig> = {
  // ===== COVERED CALL =====
  'covered-call': {
    configs: [
      {
        strategy: 'covered-call',
        stockPrice: 100,
        strikes: [105],
        premium: 2.50,
        daysToExpiration: 30,
        title: 'Covered Call Payoff Diagram',
        description: 'Stock at $100, selling $105 call for $2.50 premium. Max profit capped at strike price.',
      },
    ],
    greeksTable: {
      delta: { value: '0.65-0.70', impact: 'Reduced upside exposure from short call' },
      gamma: { value: 'Negative', impact: 'Delta changes work against you above strike' },
      theta: { value: 'Positive', impact: 'Time decay benefits the position daily' },
      vega: { value: 'Negative', impact: 'Rising IV hurts; falling IV helps' },
    },
    educationalNotes: [
      'Max profit = (Strike − Stock Price + Premium) × 100',
      'Break-even = Stock Price − Premium Received',
      'Best for: Generating income on existing holdings',
      'Risk: Full downside exposure on stock minus premium',
    ],
  },

  // ===== IRON CONDOR =====
  'iron-condor': {
    configs: [
      {
        strategy: 'iron-condor',
        stockPrice: 100,
        strikes: [85, 90, 110, 115],
        premium: 3.00,
        daysToExpiration: 45,
        title: 'Iron Condor Payoff Diagram',
        description: 'Selling 90/85 put spread and 110/115 call spread for $3.00 credit. Profits if stock stays between short strikes.',
      },
    ],
    greeksTable: {
      delta: { value: 'Near Zero', impact: 'Market neutral at entry; shifts as stock moves' },
      gamma: { value: 'Negative', impact: 'Position loses as stock moves toward either wing' },
      theta: { value: 'Positive', impact: 'Primary profit driver - time decay benefits' },
      vega: { value: 'Negative', impact: 'IV spike hurts; IV crush helps' },
    },
    educationalNotes: [
      'Max profit = Net credit received × 100',
      'Max loss = (Wing width − Net credit) × 100',
      'Break-evens: Short put − credit, Short call + credit',
      'Best for: Range-bound, low volatility environments',
    ],
  },

  // ===== STRADDLES AND STRANGLES =====
  'straddle-strangle': {
    configs: [
      {
        strategy: 'straddle',
        stockPrice: 100,
        strikes: [100],
        premium: 8.00,
        daysToExpiration: 30,
        title: 'Long Straddle Payoff',
        description: 'Buying ATM call and put at $100 strike for $8.00 total. Profits from large price movement.',
      },
      {
        strategy: 'strangle',
        stockPrice: 100,
        strikes: [95, 105],
        premium: 5.00,
        daysToExpiration: 30,
        title: 'Long Strangle Payoff',
        description: 'Buying $95 put and $105 call for $5.00 total. Lower cost but requires larger move.',
      },
    ],
    greeksTable: {
      delta: { value: 'Near Zero', impact: 'Neutral at entry; becomes directional with movement' },
      gamma: { value: 'Positive', impact: 'Delta accelerates in your favor with movement' },
      theta: { value: 'Negative', impact: 'Time decay works against you daily' },
      vega: { value: 'Positive', impact: 'IV expansion helps; IV crush hurts' },
    },
    educationalNotes: [
      'Straddle: Same strike for both legs (ATM)',
      'Strangle: Different strikes (OTM options)',
      'Max loss = Total premium paid',
      'Best before: Earnings, FDA decisions, major events',
    ],
  },

  // ===== BUTTERFLY SPREAD =====
  'butterfly-spread': {
    configs: [
      {
        strategy: 'butterfly',
        stockPrice: 100,
        strikes: [95, 100, 105],
        premium: 1.50,
        daysToExpiration: 30,
        title: 'Butterfly Spread Payoff',
        description: 'Buy $95 call, sell 2× $100 calls, buy $105 call. Max profit if stock expires exactly at $100.',
      },
    ],
    greeksTable: {
      delta: { value: 'Near Zero', impact: 'Neutral at entry, changes near wings' },
      gamma: { value: 'Mixed', impact: 'Negative at middle strike, positive at wings' },
      theta: { value: 'Positive', impact: 'Benefits as expiration approaches at middle' },
      vega: { value: 'Negative', impact: 'Lower IV helps reach max profit' },
    },
    educationalNotes: [
      'Max profit = Width of wings − Net debit',
      'Max loss = Net debit paid',
      'Sweet spot: Stock at middle strike at expiration',
      'Best for: Pinpointing expected price level',
    ],
  },

  // ===== CALENDAR/TIME SPREAD =====
  'time-spread': {
    configs: [
      {
        strategy: 'calendar-spread',
        stockPrice: 100,
        strikes: [100],
        premium: 2.00,
        daysToExpiration: 30,
        title: 'Calendar Spread Payoff',
        description: 'Sell near-term $100 call, buy longer-term $100 call. Profits from differential time decay.',
      },
    ],
    greeksTable: {
      delta: { value: 'Near Zero', impact: 'Slightly positive or negative based on skew' },
      gamma: { value: 'Mixed', impact: 'Short near-term, long far-term gamma' },
      theta: { value: 'Positive', impact: 'Near-term option decays faster (profit)' },
      vega: { value: 'Positive', impact: 'Rising IV helps the longer-dated option more' },
    },
    educationalNotes: [
      'Also called "Time Spread" or "Horizontal Spread"',
      'Profits from theta differential between expirations',
      'Max profit when stock at strike at front-month expiry',
      'Best for: Low-movement periods with IV expansion',
    ],
  },

  // ===== DELTA NEUTRAL HEDGING =====
  'delta-neutral-hedging': {
    configs: [
      {
        strategy: 'delta-neutral',
        stockPrice: 100,
        strikes: [100],
        premium: 4.00,
        daysToExpiration: 30,
        title: 'Delta Neutral Position',
        description: 'Hedged position that profits from movement regardless of direction. Requires active rebalancing.',
      },
    ],
    greeksTable: {
      delta: { value: '0 (hedged)', impact: 'No directional exposure initially' },
      gamma: { value: 'Positive', impact: 'Creates delta as price moves (profit opportunity)' },
      theta: { value: 'Negative', impact: 'Ongoing cost of maintaining the hedge' },
      vega: { value: 'Positive', impact: 'Higher volatility = more rebalancing profits' },
    },
    educationalNotes: [
      'Requires continuous delta rebalancing',
      'Profits from realized volatility exceeding implied',
      'Transaction costs are a major consideration',
      'Best for: High-frequency, systematic traders',
    ],
  },

  // ===== GAMMA SCALPING =====
  'gamma-scalping': {
    configs: [
      {
        strategy: 'gamma-scalp',
        stockPrice: 100,
        strikes: [100],
        premium: 5.00,
        daysToExpiration: 14,
        title: 'Gamma Scalping Strategy',
        description: 'Long options with delta hedging. Scalps profits as gamma creates delta from price movement.',
      },
    ],
    greeksTable: {
      delta: { value: '0 (continuously hedged)', impact: 'Rebalanced to neutral after each move' },
      gamma: { value: 'Positive (high)', impact: 'Creates tradeable delta from movement' },
      theta: { value: 'Negative (high)', impact: 'Daily decay cost that must be overcome' },
      vega: { value: 'Positive', impact: 'Benefits from volatility spikes' },
    },
    educationalNotes: [
      'Buy high-gamma options, continuously hedge delta',
      'Profit = Scalped gains − Theta decay − Transaction costs',
      'Requires significant intraday price movement',
      'Best for: Active traders in volatile markets',
    ],
  },
};

/**
 * Get options payoff configuration for a given article slug.
 */
export function getOptionsStrategyConfig(slug: string): OptionsArticleConfig | null {
  return OPTIONS_STRATEGY_MAPPING[slug] || null;
}

/**
 * Check if an article has options payoff visualizations.
 */
export function hasOptionsPayoffChart(slug: string): boolean {
  return slug in OPTIONS_STRATEGY_MAPPING;
}

/**
 * Get all options strategy article slugs.
 */
export function getOptionsStrategySlugs(): string[] {
  return Object.keys(OPTIONS_STRATEGY_MAPPING);
}
