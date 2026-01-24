/**
 * Calculate trading bars since pattern formation.
 * Excludes weekends for FX/stocks/commodities.
 * Returns the number of trading sessions since the signal.
 */
export function formatSignalAge(signalTs: string, timeframe: string = '1d'): { label: string; isFresh: boolean } {
  const signalDate = new Date(signalTs);
  const now = new Date();
  
  // Count trading bars between signal and now (excluding weekends)
  let tradingBars = 0;
  const tempDate = new Date(signalDate);
  
  // Move to the next day to start counting
  tempDate.setDate(tempDate.getDate() + 1);
  
  while (tempDate <= now && tradingBars < 30) {
    const dow = tempDate.getUTCDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dow !== 0 && dow !== 6) {
      tradingBars++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  // Pattern formed on most recent trading bar
  if (tradingBars === 0) {
    return { label: '1 bar', isFresh: true };
  }
  
  // Add 1 because we're counting elapsed bars, signal itself is bar 1
  const totalBars = tradingBars + 1;
  
  if (totalBars === 1) {
    return { label: '1 bar', isFresh: true };
  }
  
  // Signals within 3 bars are still considered fresh
  return { label: `${totalBars} bars`, isFresh: totalBars <= 3 };
}

/**
 * Simple string version for components that don't need isFresh
 */
export function formatSignalAgeSimple(signalTs: string, timeframe: string = '1d'): string {
  return formatSignalAge(signalTs, timeframe).label;
}
