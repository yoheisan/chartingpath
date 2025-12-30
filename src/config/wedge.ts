// Crypto TradingView-native Wedge Configuration
// This configuration focuses the product on the primary wedge:
// ICP: Crypto discretionary traders who are TradingView-native
// Primary timeframe: 1H
// Primary loop: Preset → Backtest → Create Alert → Return/Review → Iterate

export const wedgeConfig = {
  // Feature flag to enable wedge mode
  wedgeEnabled: true,
  
  // Primary market focus
  wedgeMarket: 'crypto' as const,
  
  // Primary timeframe
  wedgeTimeframe: '1h' as const,
  
  // Featured crypto symbols
  featuredSymbols: [
    'BTC',
    'ETH', 
    'SOL',
    'BNB',
    'XRP',
    'ADA',
    'AVAX',
    'DOGE',
    'LINK',
    'MATIC'
  ] as const,
  
  // Featured patterns for crypto - directional patterns with explicit sides
  featuredPatterns: [
    'donchian_breakout_long',
    'donchian_breakout_short',
    'double_top',
    'double_bottom', 
    'ascending_triangle',
    'descending_triangle'
  ] as const,
  
  // Symbol suffix for data providers (USDT pairs)
  symbolSuffix: 'USDT',
  
  // Default instrument category
  defaultInstrumentCategory: 'crypto' as const,
  
  // Plan-based alert limits
  alertLimits: {
    free: 1,
    starter: 2,
    pro: 10,
    pro_plus: 25,
    elite: 999999 // Unlimited
  } as const,
  
  // Minimum trades for reliable results
  minTradesThreshold: 20,
};

// Helper to get full symbol with suffix
export const getFullSymbol = (symbol: string): string => {
  if (symbol.includes('USDT') || symbol.includes('USD')) {
    return symbol;
  }
  return `${symbol}${wedgeConfig.symbolSuffix}`;
};

// SUPPORTED WEDGE PATTERN DEFINITIONS
// These are the canonical pattern configs that work with the backtest engine
// Pattern names MUST match what the engine expects
export interface WedgePatternConfig {
  id: string;
  patternType: string;
  name: string; // Must match engine pattern names exactly
  category: string;
  enabled: boolean;
  priority: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  parameters: Record<string, any>;
  riskSettings: {
    riskPerTrade: number;
    stopLossMethod: 'pattern' | 'atr' | 'fixed';
    takeProfitMethod: 'pattern' | 'ratio' | 'fixed';
    maxConcurrentTrades: number;
  };
}

// Canonical supported patterns for wedge mode - WITH EXPLICIT DIRECTIONS
// Each pattern has a clear direction (long/short) for trade clarity
export const SUPPORTED_WEDGE_PATTERNS: WedgePatternConfig[] = [
  {
    id: 'donchian_breakout_long',
    patternType: 'donchian_breakout',
    name: 'Donchian Breakout (Long)',
    category: 'breakout',
    enabled: false,
    priority: 1,
    direction: 'bullish',
    parameters: {
      channelPeriod: 20,
      exitPeriod: 10,
      atrMultiplier: 2.0,
      side: 'long',
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'atr',
      takeProfitMethod: 'ratio',
      maxConcurrentTrades: 1,
    },
  },
  {
    id: 'donchian_breakout_short',
    patternType: 'donchian_breakout',
    name: 'Donchian Breakout (Short)',
    category: 'breakout',
    enabled: false,
    priority: 2,
    direction: 'bearish',
    parameters: {
      channelPeriod: 20,
      exitPeriod: 10,
      atrMultiplier: 2.0,
      side: 'short',
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'atr',
      takeProfitMethod: 'ratio',
      maxConcurrentTrades: 1,
    },
  },
  {
    id: 'double_top',
    patternType: 'double_top',
    name: 'Double Top (Short)',
    category: 'classical',
    enabled: false,
    priority: 3,
    direction: 'bearish',
    parameters: {
      peakSimilarityTolerance: 2,
      minBarsBetweenPeaks: 10,
      necklineBreakConfirmation: 2,
      side: 'short',
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'pattern',
      takeProfitMethod: 'pattern',
      maxConcurrentTrades: 1,
    },
  },
  {
    id: 'double_bottom',
    patternType: 'double_bottom',
    name: 'Double Bottom (Long)',
    category: 'classical',
    enabled: false,
    priority: 4,
    direction: 'bullish',
    parameters: {
      peakSimilarityTolerance: 2,
      minBarsBetweenPeaks: 10,
      necklineBreakConfirmation: 2,
      side: 'long',
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'pattern',
      takeProfitMethod: 'pattern',
      maxConcurrentTrades: 1,
    },
  },
  {
    id: 'ascending_triangle',
    patternType: 'ascending_triangle',
    name: 'Ascending Triangle (Long)',
    category: 'classical',
    enabled: false,
    priority: 5,
    direction: 'bullish',
    parameters: {
      minTouchPoints: 3,
      trendlineDeviation: 1.5,
      breakoutConfirmation: 2,
      side: 'long',
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'pattern',
      takeProfitMethod: 'pattern',
      maxConcurrentTrades: 1,
    },
  },
  {
    id: 'descending_triangle',
    patternType: 'descending_triangle',
    name: 'Descending Triangle (Short)',
    category: 'classical',
    enabled: false,
    priority: 6,
    direction: 'bearish',
    parameters: {
      minTouchPoints: 3,
      trendlineDeviation: 1.5,
      breakoutConfirmation: 2,
      side: 'short',
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'pattern',
      takeProfitMethod: 'pattern',
      maxConcurrentTrades: 1,
    },
  },
];

// Canonical mapping: Pattern IDs → Display names with direction
// This is the single source of truth for which patterns are supported in wedge mode
export const WEDGE_PATTERN_ID_MAP: Record<string, string> = {
  'donchian_breakout_long': 'Donchian Breakout (Long)',
  'donchian_breakout_short': 'Donchian Breakout (Short)',
  'double_top': 'Double Top (Short)',
  'double_bottom': 'Double Bottom (Long)',
  'ascending_triangle': 'Ascending Triangle (Long)',
  'descending_triangle': 'Descending Triangle (Short)',
};

// Set of all supported pattern IDs for O(1) lookup
export const SUPPORTED_WEDGE_PATTERN_IDS = new Set(Object.keys(WEDGE_PATTERN_ID_MAP));

// Get pattern config by ID (not name)
export const getPatternConfigById = (patternId: string): WedgePatternConfig | undefined => {
  return SUPPORTED_WEDGE_PATTERNS.find(p => p.id === patternId);
};

// Check if a pattern ID is supported in wedge mode
export const isPatternIdSupportedInWedge = (patternId: string): boolean => {
  if (!wedgeConfig.wedgeEnabled) return true;
  return SUPPORTED_WEDGE_PATTERN_IDS.has(patternId);
};

// Map preset pattern names to internal pattern objects
export const getPatternConfigByName = (patternName: string): WedgePatternConfig | undefined => {
  return SUPPORTED_WEDGE_PATTERNS.find(p => p.name === patternName);
};

// Create a fresh pattern instance by ID (preferred) or name
export const createWedgePatternInstance = (patternIdOrName: string, enabled: boolean = true): WedgePatternConfig | null => {
  // First try by ID
  let template = getPatternConfigById(patternIdOrName);
  // Fallback to name lookup
  if (!template) {
    template = getPatternConfigByName(patternIdOrName);
  }
  if (!template) return null;
  
  return {
    ...template,
    id: `${template.id}_${Date.now()}`,
    enabled,
  };
};

// Validate if patterns array contains only supported patterns
export const validateWedgePatterns = (patterns: any[]): { 
  valid: boolean; 
  unsupportedPatterns: string[];
  enabledCount: number;
  enabledNames: string[];
} => {
  const supportedIds = Array.from(SUPPORTED_WEDGE_PATTERN_IDS);
  const unsupportedPatterns: string[] = [];
  const enabledNames: string[] = [];
  
  patterns.forEach(p => {
    // Check if pattern ID starts with any supported ID (handles timestamped IDs)
    const isSupported = supportedIds.some(id => p.id === id || p.id?.startsWith(`${id}_`));
    if (!isSupported) {
      unsupportedPatterns.push(p.name || p.id);
    }
    if (p.enabled) {
      enabledNames.push(p.name || p.id);
    }
  });
  
  return {
    valid: unsupportedPatterns.length === 0,
    unsupportedPatterns,
    enabledCount: enabledNames.length,
    enabledNames,
  };
};

// Sanitize patterns for wedge mode - keep only supported patterns
export const sanitizeWedgePatterns = (patterns: any[]): WedgePatternConfig[] => {
  if (!patterns || patterns.length === 0) {
    // Return default Donchian Breakout Long pattern enabled
    const breakout = createWedgePatternInstance('donchian_breakout_long', true);
    return breakout ? [breakout] : [];
  }
  
  const supportedIds = Array.from(SUPPORTED_WEDGE_PATTERN_IDS);
  const sanitized = patterns.filter(p => {
    // Check if pattern ID starts with any supported ID (handles timestamped IDs)
    return supportedIds.some(id => p.id === id || p.id?.startsWith(`${id}_`));
  });
  
  // If no valid patterns remain, add default Donchian Breakout Long
  if (sanitized.length === 0) {
    const breakout = createWedgePatternInstance('donchian_breakout_long', true);
    return breakout ? [breakout] : [];
  }
  
  // Ensure at least one pattern is enabled
  const hasEnabled = sanitized.some(p => p.enabled);
  if (!hasEnabled && sanitized.length > 0) {
    sanitized[0].enabled = true;
  }
  
  return sanitized;
};

// Featured presets for quick loading - WITH EXPLICIT DIRECTIONS
// patternId must match SUPPORTED_WEDGE_PATTERN_IDS exactly
export const featuredPresets = [
  { symbol: 'BTC', patternId: 'donchian_breakout_long', label: 'BTC 1H Donchian Breakout (Long)' },
  { symbol: 'BTC', patternId: 'donchian_breakout_short', label: 'BTC 1H Donchian Breakout (Short)' },
  { symbol: 'ETH', patternId: 'donchian_breakout_long', label: 'ETH 1H Donchian Breakout (Long)' },
  { symbol: 'ETH', patternId: 'donchian_breakout_short', label: 'ETH 1H Donchian Breakout (Short)' },
  { symbol: 'BTC', patternId: 'double_top', label: 'BTC 1H Double Top (Short)' },
  { symbol: 'BTC', patternId: 'double_bottom', label: 'BTC 1H Double Bottom (Long)' },
  { symbol: 'ETH', patternId: 'double_top', label: 'ETH 1H Double Top (Short)' },
  { symbol: 'ETH', patternId: 'double_bottom', label: 'ETH 1H Double Bottom (Long)' },
  { symbol: 'BTC', patternId: 'ascending_triangle', label: 'BTC 1H Ascending Triangle (Long)' },
  { symbol: 'BTC', patternId: 'descending_triangle', label: 'BTC 1H Descending Triangle (Short)' },
] as const;

export type WedgeSymbol = typeof wedgeConfig.featuredSymbols[number];
export type WedgePatternId = typeof wedgeConfig.featuredPatterns[number];

// Get dropdown options for Quick Start pattern selector
export const getQuickStartPatternOptions = () => {
  return SUPPORTED_WEDGE_PATTERNS.map(p => ({
    id: p.id,
    label: p.name,
    direction: p.direction,
  }));
};
