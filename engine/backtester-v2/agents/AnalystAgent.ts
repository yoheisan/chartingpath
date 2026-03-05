import { AgentScore, PatternStatEntry } from "./types";

export interface AnalystConfig {
  /** Minimum sample size to trust the stat */
  minSampleSize: number; // default 30
}

const DEFAULT_ANALYST_CONFIG: AnalystConfig = {
  minSampleSize: 30,
};

/**
 * Analyst Agent — scores based on pre-computed pattern hit-rate data.
 * Pure data lookup, no indicators computed at runtime.
 *
 * Scoring (0–25):
 *  - Win-rate component:  up to 10 pts  (winRate * 10, capped)
 *  - Expectancy component: up to 10 pts (expectancyR mapped 0→0, ≥1→10)
 *  - Sample confidence:    up to 5 pts  (log scale of sample size)
 */
export class AnalystAgent {
  private config: AnalystConfig;

  constructor(config?: Partial<AnalystConfig>) {
    this.config = { ...DEFAULT_ANALYST_CONFIG, ...config };
  }

  evaluate(
    symbol: string,
    patternStats: Record<string, PatternStatEntry>
  ): AgentScore {
    const stat = patternStats[symbol];

    if (!stat || stat.sampleSize < this.config.minSampleSize) {
      // No reliable data — neutral score
      return {
        score: 12,
        maxScore: 25,
        details: { reason: "insufficient_data", sampleSize: stat?.sampleSize ?? 0 },
      };
    }

    // Win-rate component (0–10)
    const winRateScore = Math.min(10, stat.winRate * 10);

    // Expectancy component (0–10): expectancyR of 1.0+ → full marks
    const expectancyScore = Math.min(10, Math.max(0, stat.expectancyR) * 10);

    // Sample confidence (0–5): log2 scale, 30→~2.5, 100→~3.3, 500→~4.5
    const confidenceScore = Math.min(
      5,
      Math.log2(stat.sampleSize / this.config.minSampleSize + 1) * 2
    );

    const score = Math.round((winRateScore + expectancyScore + confidenceScore) * 100) / 100;

    return {
      score: Math.min(25, score),
      maxScore: 25,
      details: {
        winRate: stat.winRate,
        expectancyR: stat.expectancyR,
        sampleSize: stat.sampleSize,
        winRateScore: Math.round(winRateScore * 100) / 100,
        expectancyScore: Math.round(expectancyScore * 100) / 100,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
      },
    };
  }
}
