/**
 * Format signal age based on timeframe.
 * 
 * For daily data: Shows calendar days elapsed (0d, 1d, 2d...) including weekends.
 * For intraday: Shows wall-clock time (5m, 2h...).
 * 
 * This avoids misleading minute-level precision for daily data while still
 * counting all calendar time (weekends included) since pattern formation.
 */
export function formatSignalAge(signalTs: string, timeframe: string = '1d'): { label: string; isFresh: boolean } {
  const signalDate = new Date(signalTs);
  const now = new Date();
  
  // For daily timeframe, calculate in calendar days (weekends count)
  if (timeframe === '1d' || timeframe === 'D' || timeframe === 'daily') {
    // Get just the date parts (ignore time)
    const signalDay = new Date(signalDate.getFullYear(), signalDate.getMonth(), signalDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffMs = today.getTime() - signalDay.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Show consistent "Xd" format - 0d means formed on today's bar
    if (diffDays < 7) {
      return { label: `${diffDays}d`, isFresh: diffDays <= 2 };
    }
    return { label: `${Math.floor(diffDays / 7)}w`, isFresh: false };
  }
  
  // For intraday timeframes, use wall-clock time
  const diffMs = now.getTime() - signalDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) {
    return { label: `${diffMins}m`, isFresh: true };
  }
  if (diffHours < 24) {
    return { label: `${diffHours}h`, isFresh: true };
  }
  if (diffDays < 7) {
    return { label: `${diffDays}d`, isFresh: diffDays <= 2 };
  }
  return { label: `${Math.floor(diffDays / 7)}w`, isFresh: false };
}

/**
 * Simple string version for components that don't need isFresh.
 * Defaults to daily timeframe since that's what the scanner uses.
 */
export function formatSignalAgeSimple(signalTs: string, timeframe: string = '1d'): string {
  return formatSignalAge(signalTs, timeframe).label;
}
