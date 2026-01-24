/**
 * Format signal age as wall-clock time (minutes, hours, days).
 * Shows actual elapsed time since pattern formation.
 */
export function formatSignalAge(signalTs: string): { label: string; isFresh: boolean } {
  const signalDate = new Date(signalTs);
  const now = new Date();
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
 * Simple string version for components that don't need isFresh
 */
export function formatSignalAgeSimple(signalTs: string): string {
  return formatSignalAge(signalTs).label;
}
