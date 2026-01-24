/**
 * Format signal age as bar-based periods instead of wall-clock time.
 * This avoids confusion on weekends when markets are closed.
 * For daily timeframe: shows "Current bar", "1 bar ago", etc.
 */
export function formatSignalAge(signalTs: string, timeframe: string = '1d'): { label: string; isFresh: boolean } {
  const signalDate = new Date(signalTs);
  const now = new Date();
  const diffMs = now.getTime() - signalDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // If signal is from today, it's current
  if (diffDays === 0) {
    return { label: 'Current bar', isFresh: true };
  }
  
  // Calculate approximate trading bars (exclude weekends)
  let tradingBars = 0;
  const tempDate = new Date(signalDate);
  while (tempDate < now && tradingBars < 10) {
    tempDate.setDate(tempDate.getDate() + 1);
    const dow = tempDate.getUTCDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dow !== 0 && dow !== 6) {
      tradingBars++;
    }
  }
  
  // If we're on a weekend and signal is from Friday, show as current
  if (tradingBars === 0) {
    return { label: 'Current bar', isFresh: true };
  }
  
  if (tradingBars === 1) {
    return { label: '1 bar ago', isFresh: true };
  }
  
  // Signals older than 3 bars are not considered fresh
  return { label: `${tradingBars} bars ago`, isFresh: tradingBars <= 3 };
}

/**
 * Simple string version for components that don't need isFresh
 */
export function formatSignalAgeSimple(signalTs: string, timeframe: string = '1d'): string {
  return formatSignalAge(signalTs, timeframe).label;
}
