/**
 * ============================================
 * ONE-TIMEFRAME PLAYBOOK CONTRACT
 * ============================================
 * 
 * This module defines the canonical PlaybookAST schema that enforces
 * strict single-timeframe semantics for backtest ↔ export parity.
 * 
 * RULES:
 * 1. A Playbook has exactly ONE timeframe: playbook.timeframe
 * 2. All indicators, filters, and entry/exit rules compute on this timeframe
 * 3. Evaluation is "bar-close only": signals on close of each bar
 * 4. No intrabar triggers in v1
 * 5. No higher-timeframe confirmation in v1
 * 6. Backtest simulates orders after bar close
 * 7. Exported scripts follow same bar-close evaluation timing
 * 
 * FILL MODEL (Option 1 - Recommended):
 * - Signal computed on bar close (bar[i])
 * - Entry filled at next bar open (bar[i+1].open)
 * - This ensures realistic simulation and parity across engines
 */

import { z } from 'zod';

// ============================================
// VALID TIMEFRAMES (strict enum)
// ============================================

export const VALID_TIMEFRAMES = [
  '1m', '3m', '5m', '15m', '30m',  // Intraday
  '1h', '2h', '4h',                // Intraday/Swing
  '1D', '1W', '1M'                 // Daily+
] as const;

export type PlaybookTimeframe = typeof VALID_TIMEFRAMES[number];

// MT4/MT5 timeframe mapping
export const MT_TIMEFRAME_MAP: Record<PlaybookTimeframe, string> = {
  '1m': 'PERIOD_M1',
  '3m': 'PERIOD_M3',
  '5m': 'PERIOD_M5',
  '15m': 'PERIOD_M15',
  '30m': 'PERIOD_M30',
  '1h': 'PERIOD_H1',
  '2h': 'PERIOD_H2',
  '4h': 'PERIOD_H4',
  '1D': 'PERIOD_D1',
  '1W': 'PERIOD_W1',
  '1M': 'PERIOD_MN1'
};

// Pine Script timeframe mapping
export const PINE_TIMEFRAME_MAP: Record<PlaybookTimeframe, string> = {
  '1m': '1',
  '3m': '3',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '2h': '120',
  '4h': '240',
  '1D': 'D',
  '1W': 'W',
  '1M': 'M'
};

// ============================================
// INDICATOR SCHEMA (No per-condition timeframe)
// ============================================

const IndicatorSchema = z.object({
  id: z.string(),
  type: z.enum([
    'ema', 'sma', 'rsi', 'macd', 'bollinger_bands', 
    'atr', 'stoch', 'adx', 'cci', 'obv', 'vwap'
  ]),
  name: z.string(),
  parameters: z.record(z.any()),
  // NOTE: No "timeframe" field - inherits from playbook.timeframe
});

export type PlaybookIndicator = z.infer<typeof IndicatorSchema>;

// ============================================
// CONDITION SCHEMA (No MTF allowed)
// ============================================

const ConditionSchema = z.object({
  id: z.string(),
  type: z.enum(['indicator', 'price_action', 'time']),
  lhs: z.object({
    indicator: z.string(),
    parameters: z.record(z.any()).optional(),
    // NOTE: No "timeframe" field - forbidden in v1
  }).optional(),
  operator: z.enum([
    'crosses_above', 'crosses_below', 
    'greater_than', 'less_than', 'equals',
    'above', 'below'
  ]),
  rhs: z.union([
    z.object({
      indicator: z.string(),
      parameters: z.record(z.any()).optional(),
      // NOTE: No "timeframe" field - forbidden in v1
    }),
    z.object({
      value: z.number()
    })
  ]).optional(),
  label: z.string().optional(),
});

export type PlaybookCondition = z.infer<typeof ConditionSchema>;

// ============================================
// RISK MANAGEMENT SCHEMA
// ============================================

const RiskManagementSchema = z.object({
  stopLoss: z.object({
    type: z.enum(['atr', 'percentage', 'fixed_points']),
    value: z.number().positive(),
    atrMultiplier: z.number().optional(), // Only for ATR type
  }),
  takeProfit: z.object({
    type: z.enum(['atr', 'percentage', 'fixed_points', 'risk_reward']),
    value: z.number().positive(),
  }),
  trailingStop: z.object({
    enabled: z.boolean(),
    type: z.enum(['atr', 'percentage', 'fixed_points']).optional(),
    value: z.number().optional(),
    activationProfit: z.number().optional(), // % profit before trailing activates
  }).optional(),
  breakeven: z.object({
    enabled: z.boolean(),
    activationProfit: z.number().optional(), // % profit to move SL to breakeven
    offset: z.number().optional(), // Additional pips above entry
  }).optional(),
});

export type PlaybookRiskManagement = z.infer<typeof RiskManagementSchema>;

// ============================================
// POSITION SIZING SCHEMA
// ============================================

const PositionSizingSchema = z.object({
  method: z.enum(['fixed_percent', 'fixed_lots', 'risk_based']),
  riskPerTrade: z.number().min(0.1).max(10), // % of account
  maxPositions: z.number().min(1).max(10),
  maxDailyLoss: z.number().optional(), // % of account - kill switch
  maxDrawdown: z.number().optional(), // % of account - kill switch
});

export type PlaybookPositionSizing = z.infer<typeof PositionSizingSchema>;

// ============================================
// EXECUTION MODEL SCHEMA
// ============================================

const ExecutionModelSchema = z.object({
  // Fill model: signal on bar close, fill at next bar open
  fillModel: z.literal('next_bar_open').default('next_bar_open'),
  // Entry type
  entryType: z.enum(['market', 'limit', 'stop']).default('market'),
  // Slippage assumption (pips/points)
  slippagePoints: z.number().default(0),
  // Commission per lot
  commissionPerLot: z.number().default(0),
});

export type PlaybookExecutionModel = z.infer<typeof ExecutionModelSchema>;

// ============================================
// MAIN PLAYBOOK AST SCHEMA
// ============================================

export const PlaybookASTSchema = z.object({
  // Metadata
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  version: z.literal('1.0.0').default('1.0.0'),
  description: z.string().optional(),
  
  // === SINGLE TIMEFRAME (CRITICAL) ===
  // This is THE timeframe for all evaluation
  timeframe: z.enum(VALID_TIMEFRAMES),
  
  // Instrument
  symbol: z.string().min(1),
  symbolCategory: z.enum(['forex', 'stocks', 'crypto', 'commodities', 'indices']),
  
  // Indicators (all computed on playbook.timeframe)
  indicators: z.array(IndicatorSchema),
  
  // Entry conditions (all evaluated on bar close of playbook.timeframe)
  entryConditions: z.object({
    long: z.array(ConditionSchema),
    short: z.array(ConditionSchema).optional(),
    logic: z.enum(['and', 'or']).default('and'),
  }),
  
  // Exit conditions (optional - SL/TP always apply)
  exitConditions: z.object({
    long: z.array(ConditionSchema).optional(),
    short: z.array(ConditionSchema).optional(),
    logic: z.enum(['and', 'or']).default('or'),
  }).optional(),
  
  // Risk management
  risk: RiskManagementSchema,
  
  // Position sizing
  positionSizing: PositionSizingSchema,
  
  // Execution model
  execution: ExecutionModelSchema.default({
    fillModel: 'next_bar_open',
    entryType: 'market',
    slippagePoints: 0,
    commissionPerLot: 0,
  }),
  
  // Session filter (optional)
  sessionFilter: z.object({
    enabled: z.boolean(),
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
    timezone: z.string().default('UTC'),
    excludeWeekends: z.boolean().default(true),
  }).optional(),
  
  // Created/updated timestamps
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type PlaybookAST = z.infer<typeof PlaybookASTSchema>;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates a PlaybookAST and returns parsed result or errors
 */
export function validatePlaybook(data: unknown): { 
  success: boolean; 
  data?: PlaybookAST; 
  errors?: z.ZodError 
} {
  const result = PlaybookASTSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Asserts no MTF constructs exist in conditions
 * Throws if any condition has a timeframe field
 */
export function assertNoMTF(playbook: PlaybookAST): void {
  const checkConditions = (conditions: PlaybookCondition[], location: string) => {
    for (const condition of conditions) {
      // Check if lhs has timeframe (should not exist, but safety check)
      if ((condition.lhs as any)?.timeframe) {
        throw new Error(
          `MTF violation in ${location}: condition "${condition.label || condition.id}" ` +
          `has lhs.timeframe. Playbooks are single-timeframe in v1.`
        );
      }
      // Check if rhs has timeframe
      if ((condition.rhs as any)?.timeframe) {
        throw new Error(
          `MTF violation in ${location}: condition "${condition.label || condition.id}" ` +
          `has rhs.timeframe. Playbooks are single-timeframe in v1.`
        );
      }
    }
  };
  
  checkConditions(playbook.entryConditions.long, 'entryConditions.long');
  if (playbook.entryConditions.short) {
    checkConditions(playbook.entryConditions.short, 'entryConditions.short');
  }
  if (playbook.exitConditions?.long) {
    checkConditions(playbook.exitConditions.long, 'exitConditions.long');
  }
  if (playbook.exitConditions?.short) {
    checkConditions(playbook.exitConditions.short, 'exitConditions.short');
  }
}

/**
 * Validates timeframe is present and valid
 */
export function assertValidTimeframe(timeframe: string): PlaybookTimeframe {
  if (!VALID_TIMEFRAMES.includes(timeframe as PlaybookTimeframe)) {
    throw new Error(
      `Invalid timeframe "${timeframe}". ` +
      `Valid options: ${VALID_TIMEFRAMES.join(', ')}`
    );
  }
  return timeframe as PlaybookTimeframe;
}

// ============================================
// CONVERSION UTILITIES
// ============================================

/**
 * Converts ChartingPathStrategy to PlaybookAST
 * Enforces single-timeframe and strips MTF fields
 */
export function chartingPathToPlaybook(
  strategy: any, 
  overrideTimeframe?: PlaybookTimeframe
): PlaybookAST {
  // Extract single timeframe (use first if multiple)
  const timeframes = strategy.market?.timeframes || [];
  if (timeframes.length === 0 && !overrideTimeframe) {
    throw new Error('Strategy must have at least one timeframe selected');
  }
  
  const timeframe = overrideTimeframe || assertValidTimeframe(timeframes[0]);
  
  // Warn if multiple timeframes were specified (v1 limitation)
  if (timeframes.length > 1) {
    console.warn(
      `[PlaybookAST] Strategy has ${timeframes.length} timeframes. ` +
      `Only "${timeframe}" will be used (single-timeframe in v1).`
    );
  }
  
  // Build indicators from patterns (simplified for now)
  const indicators: PlaybookIndicator[] = [];
  
  // Build entry conditions
  const longConditions: PlaybookCondition[] = [];
  const shortConditions: PlaybookCondition[] = [];
  
  // Convert pattern-based strategy to indicator conditions
  // (This is a placeholder - full pattern→condition mapping needed)
  if (strategy.patterns?.some((p: any) => p.enabled)) {
    // For now, create a basic condition
    longConditions.push({
      id: 'pattern_signal',
      type: 'price_action',
      operator: 'greater_than',
      label: 'Pattern signal detected',
    });
  }
  
  const playbook: PlaybookAST = {
    name: strategy.name || 'Unnamed Playbook',
    version: '1.0.0',
    description: strategy.description,
    
    // SINGLE TIMEFRAME
    timeframe,
    
    symbol: strategy.market?.instrument || 'EURUSD',
    symbolCategory: mapInstrumentCategory(strategy.market?.instrumentCategory),
    
    indicators,
    
    entryConditions: {
      long: longConditions,
      short: shortConditions.length > 0 ? shortConditions : undefined,
      logic: 'and',
    },
    
    risk: {
      stopLoss: {
        type: 'percentage',
        value: strategy.stopLossPercent || 2,
      },
      takeProfit: {
        type: 'percentage',
        value: strategy.targetGainPercent || 4,
      },
    },
    
    positionSizing: {
      method: strategy.positionSizing?.method || 'risk_based',
      riskPerTrade: strategy.positionSizing?.riskPerTrade || 2,
      maxPositions: strategy.positionSizing?.maxPositions || 3,
      maxDrawdown: strategy.disciplineFilters?.maxDrawdown,
    },
    
    execution: {
      fillModel: 'next_bar_open',
      entryType: 'market',
      slippagePoints: 0,
      commissionPerLot: 0,
    },
  };
  
  // Validate no MTF before returning
  assertNoMTF(playbook);
  
  return playbook;
}

function mapInstrumentCategory(category: string): PlaybookAST['symbolCategory'] {
  const map: Record<string, PlaybookAST['symbolCategory']> = {
    'forex': 'forex',
    'stocks': 'stocks',
    'crypto': 'crypto',
    'commodities': 'commodities',
    'indices': 'indices',
    'etfs': 'stocks',
  };
  return map[category?.toLowerCase()] || 'forex';
}

// ============================================
// EXPORT PARITY HELPERS
// ============================================

/**
 * Returns the MT4/MT5 period constant for this playbook's timeframe
 */
export function getMTTimeframe(playbook: PlaybookAST): string {
  return MT_TIMEFRAME_MAP[playbook.timeframe];
}

/**
 * Returns the Pine Script timeframe string
 */
export function getPineTimeframe(playbook: PlaybookAST): string {
  return PINE_TIMEFRAME_MAP[playbook.timeframe];
}

/**
 * Returns expected bar period in minutes for testing parity
 */
export function getBarPeriodMinutes(timeframe: PlaybookTimeframe): number {
  const map: Record<PlaybookTimeframe, number> = {
    '1m': 1, '3m': 3, '5m': 5, '15m': 15, '30m': 30,
    '1h': 60, '2h': 120, '4h': 240,
    '1D': 1440, '1W': 10080, '1M': 43200
  };
  return map[timeframe];
}
