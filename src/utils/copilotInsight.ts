const NO_DATA_INSIGHT_PATTERNS = [
  /^Currently,\s*there is no performance data to analyze/i,
  /^There is no performance data to analyze/i,
];

export function isNoDataCopilotInsight(insight: string | null | undefined): boolean {
  if (!insight) return false;
  const normalized = insight.trim();
  return NO_DATA_INSIGHT_PATTERNS.some((pattern) => pattern.test(normalized));
}
