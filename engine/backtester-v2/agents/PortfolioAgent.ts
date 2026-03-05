import { AgentScore } from "./types";

export interface PortfolioConfig {
  /** Max weight any single position should have */
  maxConcentration: number; // default 0.25 (25%)
  /** Max total portfolio heat (sum of risk across all positions) */
  maxPortfolioHeat: number; // default 0.10 (10% of portfolio at risk)
  /** Max directional skew (all-long or all-short) */
  maxDirectionalSkew: number; // default 0.80
}

const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  maxConcentration: 0.25,
  maxPortfolioHeat: 0.10,
  maxDirectionalSkew: 0.80,
};

/**
 * Portfolio Agent — evaluates current portfolio state for new position suitability.
 *
 * Scoring (0–25):
 *  - Concentration risk:  up to 10 pts (less concentrated → higher)
 *  - Directional balance:  up to 8 pts (more balanced → higher)
 *  - Portfolio heat room:  up to 7 pts (more room → higher)
 */
export class PortfolioAgent {
  private config: PortfolioConfig;

  constructor(config?: Partial<PortfolioConfig>) {
    this.config = { ...DEFAULT_PORTFOLIO_CONFIG, ...config };
  }

  evaluate(
    symbol: string,
    currentWeights: Record<string, number>,
    portfolioValue: number,
    openPositionCount: number
  ): AgentScore {
    const symbolWeight = currentWeights[symbol] || 0;
    const totalWeightAbs = Object.values(currentWeights).reduce(
      (sum, w) => sum + Math.abs(w),
      0
    );

    // --- Concentration (0–10) ---
    // If adding this symbol would exceed maxConcentration, penalize
    const worstConcentration = Math.max(
      symbolWeight,
      ...Object.values(currentWeights).map(Math.abs)
    );
    const concentrationRatio = worstConcentration / this.config.maxConcentration;
    const concentrationScore = Math.max(0, 10 * (1 - Math.min(1, concentrationRatio)));

    // --- Directional balance (0–8) ---
    const longWeight = Object.values(currentWeights)
      .filter((w) => w > 0)
      .reduce((s, w) => s + w, 0);
    const shortWeight = Math.abs(
      Object.values(currentWeights)
        .filter((w) => w < 0)
        .reduce((s, w) => s + w, 0)
    );
    const totalDirectional = longWeight + shortWeight;
    const skew = totalDirectional > 0
      ? Math.max(longWeight, shortWeight) / totalDirectional
      : 0;
    const skewRatio = skew / this.config.maxDirectionalSkew;
    const directionalScore = Math.max(0, 8 * (1 - Math.min(1, skewRatio - 0.5)));

    // --- Portfolio heat (0–7) ---
    // Simplified: total invested weight as proxy for heat
    const heatRatio = totalWeightAbs / (this.config.maxPortfolioHeat * 10); // normalize
    const heatScore = Math.max(0, 7 * (1 - Math.min(1, heatRatio)));

    const score = Math.round(
      (concentrationScore + directionalScore + heatScore) * 100
    ) / 100;

    return {
      score: Math.min(25, score),
      maxScore: 25,
      details: {
        symbolWeight: Math.round(symbolWeight * 10000) / 100,
        worstConcentration: Math.round(worstConcentration * 10000) / 100,
        longWeight: Math.round(longWeight * 10000) / 100,
        shortWeight: Math.round(shortWeight * 10000) / 100,
        skew: Math.round(skew * 100) / 100,
        openPositions: openPositionCount,
        concentrationScore: Math.round(concentrationScore * 100) / 100,
        directionalScore: Math.round(directionalScore * 100) / 100,
        heatScore: Math.round(heatScore * 100) / 100,
      },
    };
  }
}
