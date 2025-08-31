import { Portfolio } from "../core/accounting";
import { PriceFrame } from "../data/types";

export interface ExecutionEngine {
  execute(
    date: string,
    signals: SignalSet,
    portfolio: Portfolio,
    prices: Record<string, number>
  ): void;
}

export interface Signal {
  symbol: string;
  action: "BUY" | "SELL" | "CLOSE";
  quantity?: number;
  weight?: number; // For portfolio rebalancing
  tag?: string;
}

export interface SignalSet {
  signals: Signal[];
  meta?: Record<string, any>;
}

export class SimpleExecutionEngine implements ExecutionEngine {
  constructor(
    private tradingCost: number = 0.001, // 0.1% default
    private slippage: number = 0.0005 // 0.05% default
  ) {}

  execute(
    date: string,
    signals: SignalSet,
    portfolio: Portfolio,
    prices: Record<string, number>
  ): void {
    for (const signal of signals.signals) {
      const price = prices[signal.symbol];
      if (!price) continue;

      // Apply slippage
      const adjustedPrice = signal.action === "BUY" 
        ? price * (1 + this.slippage)
        : price * (1 - this.slippage);

      let quantity = signal.quantity || 0;
      
      // Handle weight-based signals
      if (signal.weight && !signal.quantity) {
        const totalValue = portfolio.getTotalValue(prices);
        const targetValue = totalValue * signal.weight;
        quantity = Math.round(targetValue / adjustedPrice);
      }

      // Handle close signals
      if (signal.action === "CLOSE") {
        const position = portfolio.getPosition(signal.symbol);
        if (position) {
          quantity = -position.qty; // Close entire position
        }
      } else if (signal.action === "SELL" && quantity > 0) {
        quantity = -quantity; // Convert to negative for sell
      }

      if (quantity !== 0) {
        const cost = Math.abs(quantity * adjustedPrice) * this.tradingCost;
        portfolio.executeTrade(
          date,
          signal.symbol,
          quantity,
          adjustedPrice,
          cost,
          signal.tag
        );
      }
    }
  }
}

export function alignPriceData(frame: PriceFrame, symbols: string[]): Record<string, Record<string, number>> {
  const aligned: Record<string, Record<string, number>> = {};
  
  for (let i = 0; i < frame.index.length; i++) {
    const date = frame.index[i];
    aligned[date] = {};
    
    for (let j = 0; j < frame.columns.length; j++) {
      const symbol = frame.columns[j];
      if (symbols.includes(symbol)) {
        aligned[date][symbol] = frame.data[i][j];
      }
    }
  }
  
  return aligned;
}

export function forwardFillPrices(
  alignedData: Record<string, Record<string, number>>,
  symbols: string[]
): Record<string, Record<string, number>> {
  const dates = Object.keys(alignedData).sort();
  const lastValidPrices: Record<string, number> = {};
  
  for (const date of dates) {
    for (const symbol of symbols) {
      const price = alignedData[date][symbol];
      if (!isNaN(price) && price > 0) {
        lastValidPrices[symbol] = price;
      } else if (lastValidPrices[symbol]) {
        alignedData[date][symbol] = lastValidPrices[symbol];
      }
    }
  }
  
  return alignedData;
}