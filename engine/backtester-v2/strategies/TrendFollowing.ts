import { SignalSet } from '../exec/execution';

export interface TrendFollowingParams {
  tradableSymbol: string;
  fastMA: number;
  slowMA: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
  useMACD: boolean;
}

export class TrendFollowingStrategy {
  private position: "LONG" | "SHORT" | "FLAT" = "FLAT";
  private priceHistory: number[] = [];
  private entryPrice?: number;
  private macdLine: number[] = [];
  private macdSignalLine: number[] = [];

  constructor(private params: TrendFollowingParams) {}

  generateSignals(
    date: string,
    prices: Record<string, number>,
    indicators?: Record<string, number>
  ): SignalSet {
    const price = prices[this.params.tradableSymbol];
    if (!price) return new SignalSet();

    this.priceHistory.push(price);
    
    // Keep only necessary history for calculations
    const maxPeriod = Math.max(this.params.slowMA, this.params.macdSlow);
    if (this.priceHistory.length > maxPeriod + 50) {
      this.priceHistory = this.priceHistory.slice(-maxPeriod - 50);
    }

    const signals = new SignalSet();

    // Calculate Moving Averages
    if (this.priceHistory.length >= this.params.slowMA) {
      const fastMA = this.calculateSMA(this.params.fastMA);
      const slowMA = this.calculateSMA(this.params.slowMA);
      
      let signal = '';

      if (this.params.useMACD && this.priceHistory.length >= this.params.macdSlow) {
        // MACD Strategy
        signal = this.generateMACDSignal();
      } else {
        // Moving Average Crossover Strategy
        const prevFastMA = this.calculateSMA(this.params.fastMA, 1);
        const prevSlowMA = this.calculateSMA(this.params.slowMA, 1);

        // Golden Cross (bullish)
        if (fastMA > slowMA && prevFastMA <= prevSlowMA && this.position !== "LONG") {
          signal = 'BUY';
        }
        // Death Cross (bearish)
        else if (fastMA < slowMA && prevFastMA >= prevSlowMA && this.position !== "SHORT") {
          signal = 'SELL';
        }
      }

      // Execute signals
      if (signal === 'BUY' && this.position !== "LONG") {
        if (this.position === "SHORT") {
          signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
        }
        signals.addSignal(this.params.tradableSymbol, "BUY", this.params.positionSize);
        this.position = "LONG";
        this.entryPrice = price;
      } else if (signal === 'SELL' && this.position !== "SHORT") {
        if (this.position === "LONG") {
          signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
        }
        signals.addSignal(this.params.tradableSymbol, "SELL", this.params.positionSize);
        this.position = "SHORT";
        this.entryPrice = price;
      }

      // Stop Loss / Take Profit
      if (this.position !== "FLAT" && this.entryPrice) {
        const pnlPercent = this.position === "LONG" 
          ? (price - this.entryPrice) / this.entryPrice
          : (this.entryPrice - price) / this.entryPrice;

        if (this.params.stopLoss && pnlPercent <= -this.params.stopLoss / 100) {
          signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
          this.position = "FLAT";
          this.entryPrice = undefined;
        } else if (this.params.takeProfit && pnlPercent >= this.params.takeProfit / 100) {
          signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
          this.position = "FLAT";
          this.entryPrice = undefined;
        }
      }
    }

    return signals;
  }

  private calculateSMA(period: number, offset: number = 0): number {
    if (this.priceHistory.length < period + offset) return 0;
    
    const endIndex = this.priceHistory.length - offset;
    const startIndex = endIndex - period;
    const slice = this.priceHistory.slice(startIndex, endIndex);
    
    return slice.reduce((sum, price) => sum + price, 0) / slice.length;
  }

  private calculateEMA(period: number): number {
    if (this.priceHistory.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = this.priceHistory[0];
    
    for (let i = 1; i < this.priceHistory.length; i++) {
      ema = (this.priceHistory[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private generateMACDSignal(): string {
    const fastEMA = this.calculateEMA(this.params.macdFast);
    const slowEMA = this.calculateEMA(this.params.macdSlow);
    const macdLine = fastEMA - slowEMA;
    
    this.macdLine.push(macdLine);
    
    // Calculate MACD Signal Line (EMA of MACD Line)
    if (this.macdLine.length >= this.params.macdSignal) {
      const signalEMA = this.calculateEMAFromArray(this.macdLine, this.params.macdSignal);
      this.macdSignalLine.push(signalEMA);
      
      // Keep history manageable
      if (this.macdLine.length > 100) {
        this.macdLine = this.macdLine.slice(-100);
        this.macdSignalLine = this.macdSignalLine.slice(-100);
      }
      
      // MACD Crossover signals
      if (this.macdSignalLine.length >= 2) {
        const currentMACD = this.macdLine[this.macdLine.length - 1];
        const currentSignal = this.macdSignalLine[this.macdSignalLine.length - 1];
        const prevMACD = this.macdLine[this.macdLine.length - 2];
        const prevSignal = this.macdSignalLine[this.macdSignalLine.length - 2];
        
        // Bullish crossover
        if (currentMACD > currentSignal && prevMACD <= prevSignal) {
          return 'BUY';
        }
        // Bearish crossover
        else if (currentMACD < currentSignal && prevMACD >= prevSignal) {
          return 'SELL';
        }
      }
    }
    
    return '';
  }

  private calculateEMAFromArray(data: number[], period: number): number {
    if (data.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = data[data.length - period];
    
    for (let i = data.length - period + 1; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  getPosition(): string {
    return this.position;
  }

  getCurrentMetrics() {
    if (this.priceHistory.length === 0) return null;
    
    return {
      fastMA: this.calculateSMA(this.params.fastMA),
      slowMA: this.calculateSMA(this.params.slowMA),
      macd: this.macdLine[this.macdLine.length - 1] || 0,
      signal: this.macdSignalLine[this.macdSignalLine.length - 1] || 0,
      position: this.position
    };
  }

  reset(): void {
    this.position = "FLAT";
    this.priceHistory = [];
    this.entryPrice = undefined;
    this.macdLine = [];
    this.macdSignalLine = [];
  }
}
