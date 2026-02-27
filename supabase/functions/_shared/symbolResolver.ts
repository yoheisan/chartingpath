// =============================================================================
// SYMBOL RESOLVER - Converts internal symbols to Yahoo Finance format
// =============================================================================

/**
 * Common crypto tickers that need -USD suffix
 */
const CRYPTO_TICKERS = new Set([
  'BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'DOGE', 'TRX', 'AVAX', 'LINK',
  'DOT', 'MATIC', 'SHIB', 'LTC', 'BCH', 'UNI', 'XLM', 'ATOM', 'XMR', 'ETC',
  'FIL', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'AAVE', 'MKR', 'ALGO', 'VET',
  'SAND', 'MANA', 'AXS', 'FTM', 'THETA', 'EGLD', 'FLOW', 'XTZ', 'EOS', 'CHZ',
  'CRV', 'LDO', 'PEPE', 'IMX', 'RNDR', 'GRT', 'RUNE', 'SUI', 'SEI', 'WLD',
  'STX', 'KAS', 'BONK', 'FLOKI', 'ORDI', 'WIF', 'BEAM', 'JUP', 'PYTH', 'TIA',
  'CAKE', 'GALA', 'ENJ', 'BLUR', 'OCEAN', 'FET', 'JASMY', 'RAY', 'SNX', 'COMP',
  'ZEC', 'DASH', 'NEO', 'WAVES', 'ZIL', 'IOTA', 'KAVA', 'ONE', 'CELO', 'ICX',
  'QTUM', 'OMG', 'BAT', 'ZRX', 'SC', 'RVN', 'HBAR', 'XDC', 'ROSE', 'GMT',
  'APE', 'DYDX', 'MAGIC', 'GMX', 'MINA', 'RPL', 'SSV', 'SUPER', 'ACH', 'API3',
]);

/**
 * Common forex base currencies that form pairs
 */
const FOREX_CURRENCIES = new Set([
  'EUR', 'GBP', 'USD', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD',
  'SEK', 'NOK', 'DKK', 'PLN', 'HUF', 'CZK', 'TRY', 'ZAR',
  'MXN', 'SGD', 'HKD', 'CNH', 'CNY', 'RUB', 'INR', 'BRL',
  'KRW', 'TWD', 'THB', 'IDR', 'MYR', 'PHP', 'VND', 'PKR',
  'BDT', 'LKR', 'AED', 'SAR', 'ILS', 'EGP', 'KES', 'NGN'
]);

/**
 * Resolves an internal symbol to its Yahoo Finance format
 * 
 * Examples:
 * - BTCUSD → BTC-USD (crypto)
 * - BTC/USD → BTC-USD (crypto with slash)
 * - EURUSD → EURUSD=X (forex)
 * - EUR/USD → EURUSD=X (forex with slash)
 * - GC=F → GC=F (commodity - already correct)
 * - AAPL → AAPL (stock - no change)
 * - ^GSPC → ^GSPC (index - no change)
 */
export function resolveToYahooSymbol(symbol: string): string {
  if (!symbol) return symbol;
  
  // Already has Yahoo suffix - return as-is
  if (symbol.includes('=') || symbol.includes('-USD') || symbol.startsWith('^')) {
    return symbol;
  }
  
  // Remove slash if present (BTC/USD → BTCUSD)
  const normalized = symbol.replace('/', '');
  
  // Check if it's a crypto symbol (ends with USD and base is a known crypto)
  const cryptoMatch = normalized.match(/^([A-Z]{2,10})(USD)$/);
  if (cryptoMatch) {
    const base = cryptoMatch[1];
    if (CRYPTO_TICKERS.has(base)) {
      return `${base}-USD`;
    }
  }
  
  // Check if it's a forex pair (6-char combo of known currencies)
  if (normalized.length === 6) {
    const base = normalized.slice(0, 3);
    const quote = normalized.slice(3, 6);
    if (FOREX_CURRENCIES.has(base) && FOREX_CURRENCIES.has(quote)) {
      return `${normalized}=X`;
    }
  }
  
  // Check for other forex patterns (e.g., EURTRY, USDZAR)
  if (normalized.length >= 6 && normalized.length <= 8) {
    const potentialBase = normalized.slice(0, 3);
    const potentialQuote = normalized.slice(3);
    if (FOREX_CURRENCIES.has(potentialBase) && FOREX_CURRENCIES.has(potentialQuote)) {
      return `${normalized}=X`;
    }
  }
  
  // Default: return as-is (stocks, indices, etc.)
  return symbol;
}

/**
 * Attempts multiple symbol formats until one works
 * Returns the formats to try in order of likelihood
 */
export function getSymbolVariants(symbol: string): string[] {
  const resolved = resolveToYahooSymbol(symbol);
  
  // If resolution changed it, try both
  if (resolved !== symbol) {
    return [resolved, symbol];
  }
  
  // For unknown symbols, try common suffixes
  const variants = [symbol];
  
  // Try crypto format — but NOT for indices (^) or known non-crypto symbols
  if (!symbol.includes('-') && !symbol.includes('=') && !symbol.startsWith('^')) {
    const base = symbol.replace(/USD$/, '');
    if (base.length >= 2 && base.length <= 10) {
      variants.push(`${base}-USD`);
    }
  }
  
  return variants;
}

/**
 * Detects asset type from symbol format
 */
export function detectAssetType(symbol: string): 'crypto' | 'forex' | 'commodity' | 'stock' | 'index' | 'etf' {
  if (symbol.startsWith('^')) return 'index';
  if (symbol.endsWith('-USD')) return 'crypto';
  if (symbol.endsWith('=X')) return 'forex';
  if (symbol.endsWith('=F')) return 'commodity';
  
  // APAC exchange suffixes → stock
  if (symbol.endsWith('.HK') || symbol.endsWith('.SI') || symbol.endsWith('.BK')) return 'stock';
  
  // Shanghai/Shenzhen indices
  if (symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return 'index';
  
  // Check known ETFs
  const etfSymbols = ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'VXX', 'GLD', 'SLV', 'TLT', 'XLF', 'XLK'];
  if (etfSymbols.includes(symbol)) return 'etf';
  
  return 'stock';
}
