import { SignalSet } from "../exec/execution";

export interface PairZScoreParams {
  symbolA: string;
  symbolB: string;
  lookbackPeriod: number; // For rolling correlation/beta
  zScoreEntry: number; // e.g., 2.0
  zScoreExit: number; // e.g., 0.5
  betaNeutral: boolean; // Use beta-neutral sizing
  maxLeverage: number; // Maximum total leverage
  borrowCost: number; // Annual cost for short positions
}

export class PairZScoreStrategy {
  private priceHistoryA: number[] = [];
  private priceHistoryB: number[] = [];
  private position: "LONG_A_SHORT_B" | "LONG_B_SHORT_A" | "FLAT" = "FLAT";
  private currentBeta: number = 1;
  private currentZScore: number = 0;

  constructor(private params: PairZScoreParams) {}

  generateSignals(
    date: string,
    prices: Record<string, number>,
    portfolioValue: number
  ): SignalSet {
    const priceA = prices[this.params.symbolA];
    const priceB = prices[this.params.symbolB];

    if (!priceA || !priceB) {
      return { signals: [] };
    }

    // Update price history
    this.priceHistoryA.push(priceA);
    this.priceHistoryB.push(priceB);

    // Keep only lookback period
    if (this.priceHistoryA.length > this.params.lookbackPeriod) {
      this.priceHistoryA.shift();
      this.priceHistoryB.shift();
    }

    // Need enough history for meaningful statistics
    if (this.priceHistoryA.length < Math.min(20, this.params.lookbackPeriod)) {
      return { signals: [] };
    }

    // Calculate rolling beta and z-score
    const { beta, zScore } = this.calculateZScore();
    this.currentBeta = beta;
    this.currentZScore = zScore;

    const signals: SignalSet = { 
      signals: [],
      meta: { beta, zScore, position: this.position }
    };

    // Generate trading signals based on z-score
    switch (this.position) {
      case "FLAT":
        if (Math.abs(zScore) > this.params.zScoreEntry) {
          const isLongA = zScore > 0; // A is overvalued relative to B
          signals.signals.push(...this.generatePairTrade(
            isLongA ? "LONG_B_SHORT_A" : "LONG_A_SHORT_B",
            portfolioValue,
            priceA,
            priceB,
            beta
          ));
          this.position = isLongA ? "LONG_B_SHORT_A" : "LONG_A_SHORT_B";
        }
        break;

      case "LONG_A_SHORT_B":
      case "LONG_B_SHORT_A":
        if (Math.abs(zScore) < this.params.zScoreExit) {
          signals.signals.push({
            symbol: this.params.symbolA,
            action: "CLOSE",
            tag: "pair_exit"
          });
          signals.signals.push({
            symbol: this.params.symbolB,
            action: "CLOSE",
            tag: "pair_exit"
          });
          this.position = "FLAT";
        }
        break;
    }

    return signals;
  }

  private calculateZScore(): { beta: number, zScore: number } {
    if (this.priceHistoryA.length < 10) {
      return { beta: 1, zScore: 0 };
    }

    // Calculate returns
    const returnsA = this.calculateReturns(this.priceHistoryA);
    const returnsB = this.calculateReturns(this.priceHistoryB);

    // Calculate beta using linear regression (A on B)
    const beta = this.calculateBeta(returnsA, returnsB);

    // Calculate hedge ratio and spread
    const spreadHistory: number[] = [];
    for (let i = 0; i < this.priceHistoryA.length; i++) {
      const spread = this.priceHistoryA[i] - beta * this.priceHistoryB[i];
      spreadHistory.push(spread);
    }

    // Calculate z-score of current spread
    const currentSpread = spreadHistory[spreadHistory.length - 1];
    const meanSpread = spreadHistory.reduce((a, b) => a + b, 0) / spreadHistory.length;
    const stdSpread = this.calculateStdDev(spreadHistory, meanSpread);

    const zScore = stdSpread > 0 ? (currentSpread - meanSpread) / stdSpread : 0;

    return { beta, zScore };
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    return returns;
  }

  private calculateBeta(returnsA: number[], returnsB: number[]): number {
    if (returnsA.length !== returnsB.length || returnsA.length === 0) {
      return 1;
    }

    const meanA = returnsA.reduce((a, b) => a + b, 0) / returnsA.length;
    const meanB = returnsB.reduce((a, b) => a + b, 0) / returnsB.length;

    let covariance = 0;
    let varianceB = 0;

    for (let i = 0; i < returnsA.length; i++) {
      const devA = returnsA[i] - meanA;
      const devB = returnsB[i] - meanB;
      covariance += devA * devB;
      varianceB += devB * devB;
    }

    return varianceB > 0 ? covariance / varianceB : 1;
  }

  private calculateStdDev(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private generatePairTrade(
    direction: "LONG_A_SHORT_B" | "LONG_B_SHORT_A",
    portfolioValue: number,
    priceA: number,
    priceB: number,
    beta: number
  ) {
    const maxCapitalPerLeg = portfolioValue * this.params.maxLeverage / 4; // 25% per leg for 2x leverage

    let qtyA: number, qtyB: number;

    if (this.params.betaNeutral) {
      // Beta-neutral sizing: $1 of A hedged with $beta of B
      qtyB = Math.round(maxCapitalPerLeg / priceB);
      qtyA = Math.round((qtyB * priceB * beta) / priceA);
    } else {
      // Equal dollar sizing
      qtyA = Math.round(maxCapitalPerLeg / priceA);
      qtyB = Math.round(maxCapitalPerLeg / priceB);
    }

    const signals = [];

    if (direction === "LONG_A_SHORT_B") {
      signals.push({
        symbol: this.params.symbolA,
        action: "BUY" as const,
        quantity: qtyA,
        tag: "pair_long_A"
      });
      signals.push({
        symbol: this.params.symbolB,
        action: "SELL" as const,
        quantity: qtyB,
        tag: "pair_short_B"
      });
    } else {
      signals.push({
        symbol: this.params.symbolA,
        action: "SELL" as const,
        quantity: qtyA,
        tag: "pair_short_A"
      });
      signals.push({
        symbol: this.params.symbolB,
        action: "BUY" as const,
        quantity: qtyB,
        tag: "pair_long_B"
      });
    }

    return signals;
  }

  getCurrentMetrics() {
    return {
      beta: this.currentBeta,
      zScore: this.currentZScore,
      position: this.position
    };
  }

  reset(): void {
    this.priceHistoryA = [];
    this.priceHistoryB = [];
    this.position = "FLAT";
    this.currentBeta = 1;
    this.currentZScore = 0;
  }
}
