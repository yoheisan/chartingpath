/**
 * Forex pip calculation utilities.
 * Used across paper trading P&L calculations for =X pairs.
 */

export function isForexSymbol(symbol: string): boolean {
  return symbol.endsWith('=X');
}

export function getForexPipSize(symbol: string): number {
  return symbol.toUpperCase().includes('JPY') ? 0.01 : 0.0001;
}

export function priceToPips(symbol: string, priceMove: number): number {
  return priceMove / getForexPipSize(symbol);
}

/**
 * Pip value = pipSize × lotUnits
 * lotSize 0.01 = micro lot = 1,000 units
 * lotSize 0.1  = mini lot  = 10,000 units
 * lotSize 1.0  = standard  = 100,000 units
 */
export function getForexPipValue(symbol: string, lotSize: number): number {
  const pipSize = getForexPipSize(symbol);
  const lotUnits = lotSize * 100_000;
  return pipSize * lotUnits;
}

/**
 * Calculate forex P&L: pips × pipValue
 * priceMove should be signed (positive = profit direction)
 */
export function calcForexPnl(symbol: string, priceMove: number, lotSize: number): number {
  const pips = priceToPips(symbol, Math.abs(priceMove));
  const pipValue = getForexPipValue(symbol, lotSize);
  return (priceMove >= 0 ? 1 : -1) * pips * pipValue;
}
