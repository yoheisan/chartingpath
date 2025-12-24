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
  
  // Featured patterns for crypto
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
};

// Helper to get full symbol with suffix
export const getFullSymbol = (symbol: string): string => {
  if (symbol.includes('USDT') || symbol.includes('USD')) {
    return symbol;
  }
  return `${symbol}${wedgeConfig.symbolSuffix}`;
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
