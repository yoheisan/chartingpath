import { Portfolio } from "./accounting";

export interface RebalanceParams {
  targetWeights: Record<string, number>;
  driftThreshold?: number; // e.g., 0.05 for 5%
  minRebalanceInterval?: number; // days
}

export class Rebalancer {
  private lastRebalanceDate?: string;

  shouldRebalance(
    currentWeights: Record<string, number>,
    targetWeights: Record<string, number>,
    currentDate: string,
    params: RebalanceParams
  ): boolean {
    // Check minimum interval
    if (params.minRebalanceInterval && this.lastRebalanceDate) {
      const daysSinceLastRebalance = this.daysBetween(this.lastRebalanceDate, currentDate);
      if (daysSinceLastRebalance < params.minRebalanceInterval) {
        return false;
      }
    }

    // Check drift threshold
    if (params.driftThreshold) {
      for (const symbol of Object.keys(targetWeights)) {
        const currentWeight = currentWeights[symbol] || 0;
        const targetWeight = targetWeights[symbol] || 0;
        const drift = Math.abs(currentWeight - targetWeight);
        
        if (drift > params.driftThreshold) {
          return true;
        }
      }
    }

    return false;
  }

  rebalance(
    portfolio: Portfolio,
    targetWeights: Record<string, number>,
    prices: Record<string, number>,
    currentDate: string,
    tradingCost: number = 0.001 // 0.1% default
  ): void {
    const totalValue = portfolio.getTotalValue(prices);
    const currentWeights = portfolio.getWeights(totalValue);

    for (const symbol of Object.keys(targetWeights)) {
      const targetWeight = targetWeights[symbol];
      const currentWeight = currentWeights[symbol] || 0;
      const targetValue = totalValue * targetWeight;
      const currentPos = portfolio.getPosition(symbol);
      const currentValue = currentPos ? currentPos.marketValue : 0;
      
      const deltaValue = targetValue - currentValue;
      const price = prices[symbol];
      
      if (Math.abs(deltaValue) > 100 && price) { // Only trade if delta > $100
        const deltaShares = Math.round(deltaValue / price);
        const cost = Math.abs(deltaValue) * tradingCost;
        
        portfolio.executeTrade(
          currentDate,
          symbol,
          deltaShares,
          price,
          cost,
          "rebalance"
        );
      }
    }

    this.lastRebalanceDate = currentDate;
  }

  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}

export function calculateEqualWeights(symbols: string[]): Record<string, number> {
  const weight = 1 / symbols.length;
  const weights: Record<string, number> = {};
  for (const symbol of symbols) {
    weights[symbol] = weight;
  }
  return weights;
}

export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((sum, w) => sum + Math.abs(w), 0);
  if (total === 0) return weights;
  
  const normalized: Record<string, number> = {};
  for (const [symbol, weight] of Object.entries(weights)) {
    normalized[symbol] = weight / total;
  }
  return normalized;
}