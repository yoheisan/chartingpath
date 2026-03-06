/**
 * Portfolio exposure context for the Portfolio Agent.
 * Tracks basket selections and existing positions to calculate concentration risk.
 */

// Currency correlation groups — pairs within the same group are correlated
const CORRELATION_GROUPS: Record<string, string[]> = {
  USD_LONG: ['EUR/USD', 'GBP/USD', 'AUD/USD', 'NZD/USD'],
  USD_SHORT: ['USD/JPY', 'USD/CHF', 'USD/CAD'],
  RISK_ON: ['AUD', 'NZD', 'BTC', 'ETH', 'SOL'],
  SAFE_HAVEN: ['JPY', 'CHF', 'XAU'],
};

export interface PortfolioExposureContext {
  /** How many positions in the same asset class */
  assetClassConcentration: number;
  /** How many correlated positions (same currency group) */
  correlatedPositions: number;
  /** Total open/basket positions */
  totalPositions: number;
  /** Directional skew: 0 = balanced, 1 = all same direction */
  directionalSkew: number;
}

/**
 * Compute portfolio exposure score (0-1) from basket + current detection context.
 * 1 = well diversified / no concentration risk
 * 0 = heavily concentrated
 */
export function computePortfolioScore(
  symbol: string,
  direction: string,
  assetType: string,
  basketSymbols: string[],
  allDetections: Array<{ instrument: string; direction: string; asset_type: string }>
): { score: number; details: PortfolioExposureContext } {
  // Get basket detections for context
  const basketDetections = allDetections.filter(d => basketSymbols.includes(d.instrument));
  const totalPositions = basketDetections.length;

  if (totalPositions === 0) {
    // No existing positions — no concentration risk
    return {
      score: 1,
      details: {
        assetClassConcentration: 0,
        correlatedPositions: 0,
        totalPositions: 0,
        directionalSkew: 0,
      },
    };
  }

  // 1. Asset class concentration (0-1, lower = more concentrated)
  const sameAssetCount = basketDetections.filter(d => d.asset_type === assetType).length;
  const assetClassConcentration = sameAssetCount / Math.max(totalPositions, 1);
  const concentrationPenalty = Math.min(1, assetClassConcentration * 0.8);

  // 2. Correlation check
  const symbolCurrencies = extractCurrencyExposure(symbol, assetType);
  let correlatedCount = 0;
  for (const bd of basketDetections) {
    const bdCurrencies = extractCurrencyExposure(bd.instrument, bd.asset_type);
    if (symbolCurrencies.some(c => bdCurrencies.includes(c))) {
      correlatedCount++;
    }
  }
  const correlationPenalty = Math.min(1, (correlatedCount / Math.max(totalPositions, 1)) * 0.7);

  // 3. Directional skew
  const isLong = direction.toLowerCase().includes('long') || !direction.toLowerCase().includes('short');
  const longCount = basketDetections.filter(d => {
    const dir = d.direction?.toLowerCase() || '';
    return dir.includes('long') || !dir.includes('short');
  }).length;
  const shortCount = totalPositions - longCount;
  const sameDirectionCount = isLong ? longCount : shortCount;
  const skew = totalPositions > 0 ? sameDirectionCount / totalPositions : 0;
  const skewPenalty = Math.max(0, (skew - 0.5) * 1.5); // Only penalize if >50% same direction

  // 4. Position count penalty (diminishing returns)
  const sizePenalty = Math.min(0.3, totalPositions * 0.03);

  const totalPenalty = Math.min(1, concentrationPenalty * 0.35 + correlationPenalty * 0.35 + skewPenalty * 0.2 + sizePenalty);
  const score = Math.max(0, 1 - totalPenalty);

  return {
    score,
    details: {
      assetClassConcentration: Math.round(assetClassConcentration * 100),
      correlatedPositions: correlatedCount,
      totalPositions,
      directionalSkew: Math.round(skew * 100),
    },
  };
}

function extractCurrencyExposure(symbol: string, assetType: string): string[] {
  if (['forex', 'fx'].includes(assetType)) {
    const clean = symbol.replace('=X', '').replace('/', '');
    if (clean.length === 6) return [clean.slice(0, 3), clean.slice(3, 6)];
  }
  if (['crypto', 'cryptocurrency'].includes(assetType)) {
    const base = symbol.replace(/-USD$/, '').replace(/USD$/, '').replace(/=X$/, '');
    return [base, 'USD'];
  }
  return ['USD'];
}
