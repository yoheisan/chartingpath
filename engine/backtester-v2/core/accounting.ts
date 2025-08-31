export interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

export interface Trade {
  date: string;
  symbol: string;
  qty: number;
  price: number;
  cost: number;
  side: "OPEN" | "CLOSE";
  tag?: string;
}

export class Portfolio {
  private positions: Map<string, Position> = new Map();
  public cash: number;
  public trades: Trade[] = [];
  
  constructor(initialCash: number = 100000) {
    this.cash = initialCash;
  }

  executeTrade(date: string, symbol: string, qty: number, price: number, cost: number = 0, tag?: string): void {
    const existingPos = this.positions.get(symbol);
    
    if (!existingPos && qty === 0) return;
    
    if (!existingPos) {
      // New position
      this.positions.set(symbol, {
        symbol,
        qty,
        avgPrice: price,
        marketValue: qty * price,
        unrealizedPnL: 0
      });
      this.cash -= (qty * price + cost);
      this.trades.push({ date, symbol, qty, price, cost, side: "OPEN", tag });
    } else {
      const newQty = existingPos.qty + qty;
      
      if (newQty === 0) {
        // Close position
        const realizedPnL = qty * (price - existingPos.avgPrice);
        this.cash += (qty * price - cost);
        this.positions.delete(symbol);
        this.trades.push({ date, symbol, qty, price, cost, side: "CLOSE", tag });
      } else if ((existingPos.qty > 0 && newQty > 0) || (existingPos.qty < 0 && newQty < 0)) {
        // Add to position
        const totalCost = existingPos.avgPrice * existingPos.qty + price * qty;
        existingPos.avgPrice = totalCost / newQty;
        existingPos.qty = newQty;
        this.cash -= (qty * price + cost);
        this.trades.push({ date, symbol, qty, price, cost, side: existingPos.qty > 0 ? "OPEN" : "CLOSE", tag });
      } else {
        // Partial close
        const closedQty = Math.min(Math.abs(qty), Math.abs(existingPos.qty));
        const realizedPnL = closedQty * (price - existingPos.avgPrice) * Math.sign(existingPos.qty);
        existingPos.qty = newQty;
        this.cash += (qty * price - cost);
        this.trades.push({ date, symbol, qty, price, cost, side: "CLOSE", tag });
      }
    }
  }

  updateMarketValues(prices: Record<string, number>): void {
    for (const [symbol, position] of this.positions) {
      const currentPrice = prices[symbol];
      if (currentPrice !== undefined) {
        position.marketValue = position.qty * currentPrice;
        position.unrealizedPnL = (currentPrice - position.avgPrice) * position.qty;
      }
    }
  }

  getTotalValue(prices: Record<string, number>): number {
    this.updateMarketValues(prices);
    const positionsValue = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.marketValue, 0);
    return this.cash + positionsValue;
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  getAllPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getExposures(): Record<string, number> {
    const exposures: Record<string, number> = {};
    for (const [symbol, position] of this.positions) {
      exposures[symbol] = position.marketValue;
    }
    return exposures;
  }

  getWeights(totalValue: number): Record<string, number> {
    const weights: Record<string, number> = {};
    if (totalValue === 0) return weights;
    
    for (const [symbol, position] of this.positions) {
      weights[symbol] = position.marketValue / totalValue;
    }
    return weights;
  }
}