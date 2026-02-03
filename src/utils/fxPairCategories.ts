// FX Pair Category Classification
// Major pairs: USD paired with major currencies (EUR, GBP, JPY, CHF, CAD, AUD, NZD)
// Minor pairs (Crosses): Major currencies paired with each other (no USD)
// Exotic pairs: Major currency paired with emerging market currency

export type FXPairCategory = 'all' | 'major' | 'minor' | 'exotic';

// Major currencies
const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'];

// Exotic/emerging market currencies
const EXOTIC_CURRENCIES = [
  // European
  'PLN', 'HUF', 'CZK', 'RON', 'BGN', 'HRK', 'RSD', 'UAH', 'RUB', 'TRY', 'NOK', 'SEK', 'DKK', 'ISK',
  // Asian
  'CNY', 'CNH', 'HKD', 'SGD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'KRW', 'TWD', 'INR', 'PKR', 'BDT', 'LKR',
  // Middle East / Africa
  'ZAR', 'EGP', 'NGN', 'KES', 'GHS', 'TZS', 'UGX', 'MAD', 'TND', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'ILS',
  // Americas
  'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'VES',
  // Oceania
  'FJD', 'PGK', 'XPF',
];

// Major pairs (always USD on one side with major currency)
export const MAJOR_PAIRS = [
  'EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
];

// Minor/Cross pairs (major currencies paired without USD)
export const MINOR_PAIRS = [
  // EUR crosses
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
  // GBP crosses
  'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',
  // JPY crosses
  'AUDJPY', 'CADJPY', 'NZDJPY', 'CHFJPY',
  // Other crosses
  'AUDNZD', 'AUDCAD', 'AUDCHF', 'CADCHF', 'NZDCAD', 'NZDCHF',
];

/**
 * Extract currency pair from symbol (handles =X suffix)
 */
function extractCurrencies(symbol: string): { base: string; quote: string } | null {
  // Remove =X suffix if present
  const clean = symbol.replace('=X', '').toUpperCase();
  
  // Standard 6-character format (e.g., EURUSD)
  if (clean.length === 6) {
    return {
      base: clean.slice(0, 3),
      quote: clean.slice(3, 6),
    };
  }
  
  return null;
}

/**
 * Classify an FX pair into Major, Minor, or Exotic category
 */
export function classifyFXPair(symbol: string): FXPairCategory {
  const currencies = extractCurrencies(symbol);
  if (!currencies) return 'exotic'; // Unknown format
  
  const { base, quote } = currencies;
  const cleanSymbol = `${base}${quote}`;
  
  // Check if it's a known major pair
  if (MAJOR_PAIRS.includes(cleanSymbol)) {
    return 'major';
  }
  
  // Check if it's a known minor pair
  if (MINOR_PAIRS.includes(cleanSymbol)) {
    return 'minor';
  }
  
  // Both currencies are major but not in our lists (reverse order check)
  const bothMajor = MAJOR_CURRENCIES.includes(base) && MAJOR_CURRENCIES.includes(quote);
  if (bothMajor) {
    // If USD is involved, it's major
    if (base === 'USD' || quote === 'USD') {
      return 'major';
    }
    // Otherwise it's a minor/cross pair
    return 'minor';
  }
  
  // Any exotic currency involved = exotic pair
  if (EXOTIC_CURRENCIES.includes(base) || EXOTIC_CURRENCIES.includes(quote)) {
    return 'exotic';
  }
  
  // Default to exotic for unknown pairs
  return 'exotic';
}

/**
 * Filter patterns by FX pair category
 */
export function filterByFXCategory<T extends { instrument: string }>(
  patterns: T[],
  category: FXPairCategory
): T[] {
  if (category === 'all') return patterns;
  
  return patterns.filter(p => {
    const pairCategory = classifyFXPair(p.instrument);
    return pairCategory === category;
  });
}

/**
 * Get FX category counts from patterns
 */
export function getFXCategoryCounts(patterns: { instrument: string }[]): {
  major: number;
  minor: number;
  exotic: number;
} {
  let major = 0;
  let minor = 0;
  let exotic = 0;
  
  patterns.forEach(p => {
    const category = classifyFXPair(p.instrument);
    if (category === 'major') major++;
    else if (category === 'minor') minor++;
    else exotic++;
  });
  
  return { major, minor, exotic };
}

export const FX_CATEGORY_LABELS: Record<FXPairCategory, string> = {
  all: 'All Pairs',
  major: 'Major',
  minor: 'Minor',
  exotic: 'Exotic',
};
