/**
 * TradingView Deep Link Utility
 * Generates correct TradingView symbol format for different asset classes
 */

// Exchange mapping for crypto pairs - comprehensive list
const CRYPTO_EXCHANGES: Record<string, string> = {
  'BTC': 'BINANCE',
  'ETH': 'BINANCE',
  'SOL': 'BINANCE',
  'XRP': 'BINANCE',
  'ADA': 'BINANCE',
  'DOGE': 'BINANCE',
  'AVAX': 'BINANCE',
  'DOT': 'BINANCE',
  'LINK': 'BINANCE',
  'MATIC': 'BINANCE',
  'LTC': 'BINANCE',
  'ATOM': 'BINANCE',
  'UNI': 'BINANCE',
  'NEAR': 'BINANCE',
  'APT': 'BINANCE',
  'ARB': 'BINANCE',
  'OP': 'BINANCE',
  'INJ': 'BINANCE',
  'SUI': 'BINANCE',
  'SEI': 'BINANCE',
  'BNB': 'BINANCE',
  'SHIB': 'BINANCE',
  'TRX': 'BINANCE',
  'TON': 'BINANCE',
  'PEPE': 'BINANCE',
  'FET': 'BINANCE',
  'RENDER': 'BINANCE',
  'FIL': 'BINANCE',
  'TAO': 'BINANCE',
  'HBAR': 'BINANCE',
  'IMX': 'BINANCE',
  'AAVE': 'BINANCE',
  'GRT': 'BINANCE',
  'ICP': 'BINANCE',
  'THETA': 'BINANCE',
  'VET': 'BINANCE',
  'RUNE': 'BINANCE',
  'MKR': 'BINANCE',
  'LDO': 'BINANCE',
  'STX': 'BINANCE',
  'ALGO': 'BINANCE',
  'XLM': 'BINANCE',
  'EOS': 'BINANCE',
  'SAND': 'BINANCE',
  'MANA': 'BINANCE',
  'CRV': 'BINANCE',
  'EGLD': 'BINANCE',
  'FTM': 'BINANCE',
  'XTZ': 'BINANCE',
  'FLOW': 'BINANCE',
  'AXS': 'BINANCE',
  'GALA': 'BINANCE',
  'KAVA': 'BINANCE',
  'ROSE': 'BINANCE',
  'CHZ': 'BINANCE',
  'COMP': 'BINANCE',
  'SNX': 'BINANCE',
  'ZEC': 'BINANCE',
  'DASH': 'BINANCE',
  'ETC': 'BINANCE',
  'XMR': 'KRAKEN',
  'BCH': 'BINANCE',
};

/**
 * Converts a ChartingPath symbol to TradingView format
 * @param symbol - The symbol from ChartingPath (e.g., BTCUSDT, BTC, ETH)
 * @param instrumentCategory - The category of the instrument
 * @returns TradingView formatted symbol (e.g., BINANCE:BTCUSDT)
 */
export function toTradingViewSymbol(
  symbol: string,
  instrumentCategory: 'crypto' | 'stocks' | 'forex' | 'commodities' = 'crypto'
): string {
  // Normalize: remove dashes (Yahoo format like ETH-USD -> ETHUSD)
  const cleanSymbol = symbol.toUpperCase().trim().replace(/-/g, '');

  if (instrumentCategory === 'crypto') {
    // Extract base currency
    let base = cleanSymbol;
    if (cleanSymbol.endsWith('USDT')) {
      base = cleanSymbol.replace('USDT', '');
    } else if (cleanSymbol.endsWith('USD')) {
      base = cleanSymbol.replace('USD', '');
    } else if (cleanSymbol.endsWith('BUSD')) {
      base = cleanSymbol.replace('BUSD', '');
    }

    const exchange = CRYPTO_EXCHANGES[base] || 'BINANCE';
    
    // Convert to USDT pair for TradingView (more liquidity)
    const pair = `${base}USDT`;

    return `${exchange}:${pair}`;
  }

  if (instrumentCategory === 'forex') {
    // Forex pairs go to OANDA or FX
    return `FX:${cleanSymbol}`;
  }

  if (instrumentCategory === 'stocks') {
    // US stocks - most common
    if (!cleanSymbol.includes(':')) {
      return `NASDAQ:${cleanSymbol}`;
    }
    return cleanSymbol;
  }

  if (instrumentCategory === 'commodities') {
    // Common commodities
    const commodityMap: Record<string, string> = {
      'GOLD': 'TVC:GOLD',
      'XAUUSD': 'TVC:GOLD',
      'SILVER': 'TVC:SILVER',
      'XAGUSD': 'TVC:SILVER',
      'OIL': 'TVC:USOIL',
      'WTI': 'TVC:USOIL',
      'BRENT': 'TVC:UKOIL',
    };
    return commodityMap[cleanSymbol] || `TVC:${cleanSymbol}`;
  }

  return cleanSymbol;
}

/**
 * Generates the full TradingView chart URL
 * @param symbol - ChartingPath symbol
 * @param instrumentCategory - Instrument category
 * @param interval - Timeframe (e.g., '1h', '4h', '1d')
 * @returns Full TradingView URL
 */
export function getTradingViewUrl(
  symbol: string,
  instrumentCategory: 'crypto' | 'stocks' | 'forex' | 'commodities' = 'crypto',
  interval: string = '1h'
): string {
  const tvSymbol = toTradingViewSymbol(symbol, instrumentCategory);
  
  // Map our intervals to TradingView intervals
  const intervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    'D': 'D',
    '1w': 'W',
    '1M': 'M',
  };

  const tvInterval = intervalMap[interval] || '60';

  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}&interval=${tvInterval}`;
}

/**
 * Opens TradingView in a new tab
 */
export function openTradingView(
  symbol: string,
  instrumentCategory: 'crypto' | 'stocks' | 'forex' | 'commodities' = 'crypto',
  interval: string = '1h'
): void {
  const url = getTradingViewUrl(symbol, instrumentCategory, interval);
  window.open(url, '_blank', 'noopener,noreferrer');
}
