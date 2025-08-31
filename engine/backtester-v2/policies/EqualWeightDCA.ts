import { SignalSet } from "../exec/execution";
import { Rebalancer, calculateEqualWeights } from "../core/rebalance";

export interface EqualWeightDCAParams {
  symbols: string[];
  contributionAmount: number; // Monthly contribution
  contributionFrequency: "weekly" | "monthly" | "quarterly";
  rebalanceFrequency: "none" | "monthly" | "quarterly" | "annually";
  driftThreshold: number; // Rebalance if weight drifts more than this
  tradingCost: number;
}

export class EqualWeightDCAPolicy {
  private rebalancer = new Rebalancer();
  private lastContributionDate?: string;
  private targetWeights: Record<string, number>;

  constructor(private params: EqualWeightDCAParams) {
    this.targetWeights = calculateEqualWeights(params.symbols);
  }

  generateSignals(
    date: string,
    prices: Record<string, number>,
    portfolioValue: number,
    currentWeights: Record<string, number>
  ): SignalSet {
    const signals: SignalSet = { signals: [] };

    // Check for contribution
    if (this.shouldContribute(date)) {
      signals.signals.push(...this.generateContributionSignals(prices));
      this.lastContributionDate = date;
    }

    // Check for rebalancing
    if (this.shouldRebalance(date, currentWeights)) {
      signals.signals.push(...this.generateRebalanceSignals(
        currentWeights,
        portfolioValue,
        prices
      ));
    }

    return signals;
  }

  private shouldContribute(currentDate: string): boolean {
    if (!this.lastContributionDate) return true;

    const daysSince = this.daysBetween(this.lastContributionDate, currentDate);
    
    switch (this.params.contributionFrequency) {
      case "weekly":
        return daysSince >= 7;
      case "monthly":
        return daysSince >= 30;
      case "quarterly":
        return daysSince >= 90;
      default:
        return false;
    }
  }

  private shouldRebalance(currentDate: string, currentWeights: Record<string, number>): boolean {
    if (this.params.rebalanceFrequency === "none") return false;

    // Check drift threshold
    return this.rebalancer.shouldRebalance(
      currentWeights,
      this.targetWeights,
      currentDate,
      {
        targetWeights: this.targetWeights,
        driftThreshold: this.params.driftThreshold,
        minRebalanceInterval: this.getRebalanceIntervalDays()
      }
    );
  }

  private getRebalanceIntervalDays(): number {
    switch (this.params.rebalanceFrequency) {
      case "monthly":
        return 30;
      case "quarterly":
        return 90;
      case "annually":
        return 365;
      default:
        return 0;
    }
  }

  private generateContributionSignals(prices: Record<string, number>) {
    const signals = [];
    const contributionPerSymbol = this.params.contributionAmount / this.params.symbols.length;

    for (const symbol of this.params.symbols) {
      const price = prices[symbol];
      if (price) {
        const quantity = Math.round(contributionPerSymbol / price);
        if (quantity > 0) {
          signals.push({
            symbol,
            action: "BUY" as const,
            quantity,
            tag: "dca_contribution"
          });
        }
      }
    }

    return signals;
  }

  private generateRebalanceSignals(
    currentWeights: Record<string, number>,
    portfolioValue: number,
    prices: Record<string, number>
  ) {
    const signals = [];

    for (const symbol of this.params.symbols) {
      const currentWeight = currentWeights[symbol] || 0;
      const targetWeight = this.targetWeights[symbol];
      const targetValue = portfolioValue * targetWeight;
      const currentValue = portfolioValue * currentWeight;
      const deltaValue = targetValue - currentValue;
      
      const price = prices[symbol];
      if (price && Math.abs(deltaValue) > 100) { // Only rebalance if delta > $100
        const quantity = Math.round(deltaValue / price);
        signals.push({
          symbol,
          action: quantity > 0 ? "BUY" as const : "SELL" as const,
          quantity: Math.abs(quantity),
          tag: "rebalance"
        });
      }
    }

    return signals;
  }

  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getTargetWeights(): Record<string, number> {
    return { ...this.targetWeights };
  }

  updateTargetWeights(weights: Record<string, number>): void {
    this.targetWeights = { ...weights };
  }
}