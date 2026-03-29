import { AgentScore } from "./types";

export interface RiskConfig {
  minRR: number;           // minimum acceptable R:R, default 1.5
  kellyCap: number;        // max Kelly fraction, default 0.25
  atrPeriod: number;       // ATR lookback, default 14
  atrMultiplier: number;   // stop-loss = entry - ATR * mult, default 2.0
}

const DEFAULT_RISK_CONFIG: RiskConfig = {
  minRR: 1.5,
  kellyCap: 0.25,
  atrPeriod: 14,
  atrMultiplier: 2.0,
};

/**
 * Risk Agent — evaluates position sizing feasibility and bracket validity.
 *
 * Scoring (0–25):
 *  - R:R adequacy:        up to 10 pts
 *  - ATR stability:       up to 8 pts  (low ATR-CV → stable → higher score)
 *  - Kelly sizing room:   up to 7 pts  (positive Kelly → room to size)
 */
export interface OHLCBar {
  high: number;
  low: number;
  close: number;
}

export class RiskAgent {
  private config: RiskConfig;
  private priceHistory: Map<string, OHLCBar[]> = new Map();

  constructor(config?: Partial<RiskConfig>) {
    this.config = { ...DEFAULT_RISK_CONFIG, ...config };
  }

  /** Feed daily bars to build ATR history */
  updatePrice(symbol: string, bar: OHLCBar): void {
    const hist = this.priceHistory.get(symbol) || [];
    hist.push(bar);
    // Keep only what we need
    if (hist.length > this.config.atrPeriod + 5) {
      hist.shift();
    }
    this.priceHistory.set(symbol, hist);
  }

  evaluate(
    symbol: string,
    currentPrice: number,
    winRate: number // from analyst or pattern stats (0–1)
  ): AgentScore {
    const hist = this.priceHistory.get(symbol) || [];

    // --- ATR calculation ---
    const atr = this.calculateATR(hist);
    const stopLoss = atr > 0 ? currentPrice - atr * this.config.atrMultiplier : currentPrice * 0.95;
    const riskPerUnit = currentPrice - stopLoss;
    const takeProfit = currentPrice + riskPerUnit * this.config.minRR;
    const actualRR = riskPerUnit > 0 ? (takeProfit - currentPrice) / riskPerUnit : 0;

    // --- R:R score (0–10) ---
    // actualRR >= minRR*2 → 10, == minRR → 5, < minRR → proportional
    const rrRatio = actualRR / this.config.minRR;
    const rrScore = Math.min(10, Math.max(0, rrRatio * 5));

    // --- ATR stability (0–8) ---
    const atrCV = this.calculateATRCoeffOfVariation(hist);
    // Lower CV → more stable → higher score. CV of 0 → 8, CV of 1+ → 0
    const stabilityScore = Math.max(0, 8 * (1 - Math.min(1, atrCV)));

    // --- Kelly sizing (0–7) ---
    // Kelly = winRate - (1-winRate) / RR
    const kelly = actualRR > 0 ? winRate - (1 - winRate) / actualRR : 0;
    const cappedKelly = Math.min(this.config.kellyCap, Math.max(0, kelly));
    const kellyScore = (cappedKelly / this.config.kellyCap) * 7;

    const score = Math.round((rrScore + stabilityScore + kellyScore) * 100) / 100;

    return {
      score: Math.min(25, score),
      maxScore: 25,
      details: {
        atr,
        stopLoss: Math.round(stopLoss * 100) / 100,
        takeProfit: Math.round(takeProfit * 100) / 100,
        actualRR: Math.round(actualRR * 100) / 100,
        kelly: Math.round(cappedKelly * 1000) / 1000,
        positionSizePct: Math.round(cappedKelly * 100 * 100) / 100,
        rrScore: Math.round(rrScore * 100) / 100,
        stabilityScore: Math.round(stabilityScore * 100) / 100,
        kellyScore: Math.round(kellyScore * 100) / 100,
      },
    };
  }

  private calculateATR(bars: OHLCBar[]): number {
    if (bars.length < 2) return 0;
    const trs: number[] = [];
    for (let i = 1; i < bars.length; i++) {
      const tr = Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close)
      );
      trs.push(tr);
    }
    const period = Math.min(this.config.atrPeriod, trs.length);
    return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  private calculateATRCoeffOfVariation(bars: OHLCBar[]): number {
    if (bars.length < 3) return 0.5; // neutral
    const trs: number[] = [];
    for (let i = 1; i < bars.length; i++) {
      const tr = Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close)
      );
      trs.push(tr);
    }
    const mean = trs.reduce((a, b) => a + b, 0) / trs.length;
    if (mean === 0) return 0;
    const variance = trs.reduce((s, v) => s + (v - mean) ** 2, 0) / trs.length;
    return Math.sqrt(variance) / mean;
  }
}
