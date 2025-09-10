import { SignalSet } from '../exec/execution';

export interface MeanReversionParams {
  tradableSymbol: string;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  bbPeriod: number;
  bbStdDev: number;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
  useRSI: boolean;
  useBollingerBands: boolean;
}

export class MeanReversionStrategy {
  private position: "LONG" | "SHORT" | "FLAT" = "FLAT";
  private priceHistory: number[] = [];
  private entryPrice?: number;

  constructor(private params: MeanReversionParams) {}

  generateSignals(
    date: string,
    prices: Record<string, number>,
    indicators?: Record<string, number>
  ): SignalSet {
    const price = prices[this.params.tradableSymbol];
    if (!price) return new SignalSet();

    this.priceHistory.push(price);
    
    // Keep only necessary history
    const maxPeriod = Math.max(this.params.rsiPeriod, this.params.bbPeriod);
    if (this.priceHistory.length > maxPeriod + 50) {
      this.priceHistory = this.priceHistory.slice(-maxPeriod - 50);
    }

    const signals = new SignalSet();

    if (this.priceHistory.length >= Math.max(this.params.rsiPeriod, this.params.bbPeriod)) {
      let buySignal = false;
      let sellSignal = false;

      // RSI Strategy
      if (this.params.useRSI && this.priceHistory.length >= this.params.rsiPeriod + 1) {
        const rsi = this.calculateRSI();
        if (rsi <= this.params.rsiOversold && this.position !== "LONG") {
          buySignal = true;
        } else if (rsi >= this.params.rsiOverbought && this.position !== "SHORT") {
          sellSignal = true;
        }
      }

      // Bollinger Bands Strategy
      if (this.params.useBollingerBands && this.priceHistory.length >= this.params.bbPeriod) {
        const { upper, lower, middle } = this.calculateBollingerBands();
        
        // Price below lower band - oversold
        if (price <= lower && this.position !== "LONG") {
          buySignal = true;
        }
        // Price above upper band - overbought
        else if (price >= upper && this.position !== "SHORT") {
          sellSignal = true;
        }
        // Mean reversion to middle band
        else if (this.position === "LONG" && price >= middle) {
          signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
          this.position = "FLAT";
          this.entryPrice = undefined;
        } else if (this.position === "SHORT" && price <= middle) {
          signals.addSignal(this.params.tradableSymbol, "CLOSE", 0);
          this.position = "FLAT";
          this.entryPrice = undefined;
        }
      }

      // Combined signal logic (both RSI and BB must agree if both are enabled)
      if (this.params.useRSI && this.params.useBollingerBands) {
        // Both indicators must confirm the signal
        const rsi = this.calculateRSI();
        const { upper, lower } = this.calculateBollingerBands();
        
        buySignal = (rsi <= this.params.rsiOversold && price <= lower && this.position !== "LONG");
        sellSignal = (rsi >= this.params.rsiOverbought && price >= upper && this.position !== "SHORT");
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

  private calculateRSI(): number {
    if (this.priceHistory.length < this.params.rsiPeriod + 1) return 50;
    
    const period = this.params.rsiPeriod;
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = this.priceHistory.length - period; i < this.priceHistory.length; i++) {
      const change = this.priceHistory[i] - this.priceHistory[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate average gains and losses
    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateBollingerBands(): { upper: number; lower: number; middle: number } {
    if (this.priceHistory.length < this.params.bbPeriod) {
      const lastPrice = this.priceHistory[this.priceHistory.length - 1];
      return { upper: lastPrice, lower: lastPrice, middle: lastPrice };
    }
    
    const period = this.params.bbPeriod;
    const recentPrices = this.priceHistory.slice(-period);
    
    // Calculate Simple Moving Average (middle band)
    const middle = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    // Calculate Standard Deviation
    const variance = recentPrices.reduce((sum, price) => {
      return sum + Math.pow(price - middle, 2);
    }, 0) / period;
    
    const stdDev = Math.sqrt(variance);
    
    // Calculate upper and lower bands
    const upper = middle + (this.params.bbStdDev * stdDev);
    const lower = middle - (this.params.bbStdDev * stdDev);
    
    return { upper, lower, middle };
  }

  getPosition(): string {
    return this.position;
  }

  getCurrentMetrics() {
    if (this.priceHistory.length === 0) return null;
    
    const rsi = this.calculateRSI();
    const bb = this.calculateBollingerBands();
    
    return {
      rsi,
      bollingerUpper: bb.upper,
      bollingerMiddle: bb.middle,
      bollingerLower: bb.lower,
      position: this.position,
      currentPrice: this.priceHistory[this.priceHistory.length - 1]
    };
  }

  reset(): void {
    this.position = "FLAT";
    this.priceHistory = [];
    this.entryPrice = undefined;
  }
}
