import { SignalSet } from '../exec/execution';

export interface BreakoutParams {
  tradableSymbol: string;
  lookbackPeriod: number;
  volatilityPeriod: number;
  volatilityThreshold: number;
  atrMultiplier: number;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
  useVolatilityFilter: boolean;
  usePriceBreakout: boolean;
}

export class BreakoutStrategy {
  private position: "LONG" | "SHORT" | "FLAT" = "FLAT";
  private priceHistory: number[] = [];
  private highHistory: number[] = [];
  private lowHistory: number[] = [];
  private entryPrice?: number;

  constructor(private params: BreakoutParams) {}

  generateSignals(
    date: string,
    prices: Record<string, number>,
    indicators?: Record<string, number>
  ): SignalSet {
    const price = prices[this.params.tradableSymbol];
    if (!price) return new SignalSet();

    // For simplicity, assuming OHLC data isn't available, use price as close
    // In real implementation, you'd want separate high/low data
    this.priceHistory.push(price);
    this.highHistory.push(price * 1.002); // Simulate high
    this.lowHistory.push(price * 0.998);   // Simulate low
    
    // Keep only necessary history
    const maxPeriod = Math.max(this.params.lookbackPeriod, this.params.volatilityPeriod);
    if (this.priceHistory.length > maxPeriod + 50) {
      this.priceHistory = this.priceHistory.slice(-maxPeriod - 50);
      this.highHistory = this.highHistory.slice(-maxPeriod - 50);
      this.lowHistory = this.lowHistory.slice(-maxPeriod - 50);
    }

    const signals = new SignalSet();

    if (this.priceHistory.length >= Math.max(this.params.lookbackPeriod, this.params.volatilityPeriod)) {
      let buySignal = false;
      let sellSignal = false;

      // Price Breakout Strategy
      if (this.params.usePriceBreakout) {
        const { resistance, support } = this.calculateSupportResistance();
        
        // Bullish breakout above resistance
        if (price > resistance && this.position !== "LONG") {
          buySignal = true;
        }
        // Bearish breakout below support
        else if (price < support && this.position !== "SHORT") {
          sellSignal = true;
        }
      }

      // Volatility Breakout Strategy
      if (this.params.useVolatilityFilter) {
        const atr = this.calculateATR();
        const volatility = this.calculateVolatility();
        
        // Only trade if volatility is above threshold
        if (volatility > this.params.volatilityThreshold) {
          const upperBand = this.priceHistory[this.priceHistory.length - 1] + (atr * this.params.atrMultiplier);
          const lowerBand = this.priceHistory[this.priceHistory.length - 1] - (atr * this.params.atrMultiplier);
          
          if (price > upperBand && this.position !== "LONG") {
            buySignal = true;
          } else if (price < lowerBand && this.position !== "SHORT") {
            sellSignal = true;
          }
        }
      }

      // Combined breakout logic
      if (this.params.usePriceBreakout && this.params.useVolatilityFilter) {
        const { resistance, support } = this.calculateSupportResistance();
        const volatility = this.calculateVolatility();
        
        // Both price breakout and volatility condition must be met
        buySignal = (price > resistance && volatility > this.params.volatilityThreshold && this.position !== "LONG");
        sellSignal = (price < support && volatility > this.params.volatilityThreshold && this.position !== "SHORT");
      }

      // Execute signals
      if (buySignal) {
        if (this.position === "SHORT") {
          signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
        }
        signals.addSignal(this.params.tradableSymbol, "BUY", this.params.positionSize);
        this.position = "LONG";
        this.entryPrice = price;
      } else if (sellSignal) {
        if (this.position === "LONG") {
          signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
        }
        signals.addSignal(this.params.tradableSymbol, "SELL", this.params.positionSize);
        this.position = "SHORT";
        this.entryPrice = price;
      }

      // Stop Loss / Take Profit using ATR
      if (this.position !== "FLAT" && this.entryPrice) {
        const atr = this.calculateATR();
        const atrStopDistance = atr * 2; // 2 ATR stop loss
        
        if (this.position === "LONG") {
          const stopPrice = this.entryPrice - atrStopDistance;
          const targetPrice = this.entryPrice + (atrStopDistance * 2); // 2:1 R:R
          
          if (price <= stopPrice || (this.params.stopLoss && price <= this.entryPrice * (1 - this.params.stopLoss / 100))) {
            signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
            this.position = "FLAT";
            this.entryPrice = undefined;
          } else if (price >= targetPrice || (this.params.takeProfit && price >= this.entryPrice * (1 + this.params.takeProfit / 100))) {
            signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
            this.position = "FLAT";
            this.entryPrice = undefined;
          }
        } else if (this.position === "SHORT") {
          const stopPrice = this.entryPrice + atrStopDistance;
          const targetPrice = this.entryPrice - (atrStopDistance * 2);
          
          if (price >= stopPrice || (this.params.stopLoss && price >= this.entryPrice * (1 + this.params.stopLoss / 100))) {
            signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
            this.position = "FLAT";
            this.entryPrice = undefined;
          } else if (price <= targetPrice || (this.params.takeProfit && price <= this.entryPrice * (1 - this.params.takeProfit / 100))) {
            signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
            this.position = "FLAT";
            this.entryPrice = undefined;
          }
        }
      }
    }

    return signals;
  }

  private calculateSupportResistance(): { support: number; resistance: number } {
    if (this.priceHistory.length < this.params.lookbackPeriod) {
      const lastPrice = this.priceHistory[this.priceHistory.length - 1];
      return { support: lastPrice * 0.99, resistance: lastPrice * 1.01 };
    }
    
    const period = this.params.lookbackPeriod;
    const recentHighs = this.highHistory.slice(-period);
    const recentLows = this.lowHistory.slice(-period);
    
    const resistance = Math.max(...recentHighs);
    const support = Math.min(...recentLows);
    
    return { support, resistance };
  }

  private calculateATR(): number {
    if (this.priceHistory.length < this.params.lookbackPeriod) return 0.01;
    
    const period = Math.min(this.params.lookbackPeriod, this.priceHistory.length - 1);
    const trueRanges: number[] = [];
    
    for (let i = this.priceHistory.length - period; i < this.priceHistory.length; i++) {
      const high = this.highHistory[i];
      const low = this.lowHistory[i];
      const prevClose = this.priceHistory[i - 1];
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  }

  private calculateVolatility(): number {
    if (this.priceHistory.length < this.params.volatilityPeriod) return 0;
    
    const period = this.params.volatilityPeriod;
    const recentPrices = this.priceHistory.slice(-period);
    const returns: number[] = [];
    
    for (let i = 1; i < recentPrices.length; i++) {
      returns.push((recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1]);
    }
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  getPosition(): string {
    return this.position;
  }

  getCurrentMetrics() {
    if (this.priceHistory.length === 0) return null;
    
    const { support, resistance } = this.calculateSupportResistance();
    const atr = this.calculateATR();
    const volatility = this.calculateVolatility();
    
    return {
      support,
      resistance,
      atr,
      volatility,
      position: this.position,
      currentPrice: this.priceHistory[this.priceHistory.length - 1]
    };
  }

  reset(): void {
    this.position = "FLAT";
    this.priceHistory = [];
    this.highHistory = [];
    this.lowHistory = [];
    this.entryPrice = undefined;
  }
}
