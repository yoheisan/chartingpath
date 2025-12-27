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
  
  // Featured patterns for crypto (display names)
  featuredPatterns: [
    'Breakout',
    'DoubleTopBottom', 
    'Triangle'
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

// Canonical supported patterns for wedge mode
// Pattern names match the backtest engine expectations
export const SUPPORTED_WEDGE_PATTERNS: WedgePatternConfig[] = [
  {
    id: 'breakout_wedge',
    patternType: 'donchian_breakout',
    name: 'Breakout', // Engine uses this name
    category: 'breakout',
    enabled: false,
    priority: 1,
    direction: 'neutral',
    parameters: {
      channelPeriod: 20,
      exitPeriod: 10,
      atrMultiplier: 2.0,
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'atr',
      takeProfitMethod: 'ratio',
      maxConcurrentTrades: 1,
    },
  },
  {
    id: 'double_top_bottom_wedge',
    patternType: 'double_top',
    name: 'DoubleTopBottom', // Engine uses this name
    category: 'classical',
    enabled: false,
    priority: 2,
    direction: 'neutral',
    parameters: {
      peakSimilarityTolerance: 2,
      minBarsBetweenPeaks: 10,
      necklineBreakConfirmation: 2,
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'pattern',
      takeProfitMethod: 'pattern',
      maxConcurrentTrades: 1,
    },
  },
  {
    id: 'triangle_wedge',
    patternType: 'ascending_triangle',
    name: 'Triangle', // Engine uses this name
    category: 'classical',
    enabled: false,
    priority: 3,
    direction: 'neutral',
    parameters: {
      minTouchPoints: 3,
      trendlineDeviation: 1.5,
      breakoutConfirmation: 2,
    },
    riskSettings: {
      riskPerTrade: 2,
      stopLossMethod: 'pattern',
      takeProfitMethod: 'pattern',
      maxConcurrentTrades: 1,
    },
  },
];

// Map preset pattern names to internal pattern objects
export const getPatternConfigByName = (patternName: string): WedgePatternConfig | undefined => {
  return SUPPORTED_WEDGE_PATTERNS.find(p => p.name === patternName);
};

// Create a fresh pattern instance with unique ID
export const createWedgePatternInstance = (patternName: string, enabled: boolean = true): WedgePatternConfig | null => {
  const template = getPatternConfigByName(patternName);
  if (!template) return null;
  
  return {
    ...template,
    id: `${template.patternType}_${Date.now()}`,
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
  const supportedNames = SUPPORTED_WEDGE_PATTERNS.map(p => p.name);
  const unsupportedPatterns: string[] = [];
  const enabledNames: string[] = [];
  
  patterns.forEach(p => {
    if (!supportedNames.includes(p.name)) {
      unsupportedPatterns.push(p.name);
    }
    if (p.enabled) {
      enabledNames.push(p.name);
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
    // Return default Breakout pattern enabled
    const breakout = createWedgePatternInstance('Breakout', true);
    return breakout ? [breakout] : [];
  }
  
  const supportedNames = SUPPORTED_WEDGE_PATTERNS.map(p => p.name);
  const sanitized = patterns.filter(p => supportedNames.includes(p.name));
  
  // If no valid patterns remain, add default Breakout
  if (sanitized.length === 0) {
    const breakout = createWedgePatternInstance('Breakout', true);
    return breakout ? [breakout] : [];
  }
  
  // Ensure at least one pattern is enabled
  const hasEnabled = sanitized.some(p => p.enabled);
  if (!hasEnabled && sanitized.length > 0) {
    sanitized[0].enabled = true;
  }
  
  return sanitized;
};

// Featured presets for quick loading
export const featuredPresets = [
  { symbol: 'BTC', pattern: 'Breakout', label: 'BTC 1H Breakout' },
  { symbol: 'ETH', pattern: 'Breakout', label: 'ETH 1H Breakout' },
  { symbol: 'SOL', pattern: 'Breakout', label: 'SOL 1H Breakout' },
  { symbol: 'BTC', pattern: 'DoubleTopBottom', label: 'BTC 1H Double Top/Bottom' },
  { symbol: 'ETH', pattern: 'DoubleTopBottom', label: 'ETH 1H Double Top/Bottom' },
  { symbol: 'BTC', pattern: 'Triangle', label: 'BTC 1H Triangle' },
  { symbol: 'ETH', pattern: 'Triangle', label: 'ETH 1H Triangle' },
  { symbol: 'SOL', pattern: 'Triangle', label: 'SOL 1H Triangle' },
  { symbol: 'BNB', pattern: 'Breakout', label: 'BNB 1H Breakout' },
  { symbol: 'XRP', pattern: 'Breakout', label: 'XRP 1H Breakout' },
  { symbol: 'ADA', pattern: 'Triangle', label: 'ADA 1H Triangle' },
  { symbol: 'AVAX', pattern: 'Breakout', label: 'AVAX 1H Breakout' },
  { symbol: 'DOGE', pattern: 'DoubleTopBottom', label: 'DOGE 1H Double Top/Bottom' },
  { symbol: 'LINK', pattern: 'Breakout', label: 'LINK 1H Breakout' },
  { symbol: 'MATIC', pattern: 'Triangle', label: 'MATIC 1H Triangle' },
] as const;

export type WedgeSymbol = typeof wedgeConfig.featuredSymbols[number];
export type WedgePattern = typeof wedgeConfig.featuredPatterns[number];
