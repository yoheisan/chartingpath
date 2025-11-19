import { SignalSet } from "../exec/execution";

export interface HeadAndShouldersParams {
  symbol: string;
  lookbackPeriod: number; // Bars to analyze for pattern
  shoulderSymmetryTolerance: number; // % tolerance for shoulder heights
  necklineBreakConfirmation: number; // Bars to confirm neckline break
  volumeConfirmation: boolean; // Require volume increase on break
  positionSize: number;
  stopLoss?: number; // % above/below pattern
  takeProfit?: number; // % target (or measured move)
}

interface PatternData {
  leftShoulderIdx: number;
  headIdx: number;
  rightShoulderIdx: number;
  necklineLevel: number;
  patternHeight: number;
  isInverted: boolean;
}

export class HeadAndShouldersStrategy {
  private position: "LONG" | "SHORT" | "FLAT" = "FLAT";
  private entryPrice?: number;
  private priceHistory: Array<{ high: number; low: number; close: number; volume?: number }> = [];
  private currentPattern?: PatternData;
  private confirmationBars: number = 0;

  constructor(private params: HeadAndShouldersParams) {}

  generateSignals(
    date: string,
    prices: Record<string, number>,
    indicators?: Record<string, number>
  ): SignalSet {
    const price = prices[this.params.symbol];
    if (!price) return { signals: [] };

    // Store OHLC data (simulated from close price with realistic variations)
    const volume = indicators?.volume;
    this.priceHistory.push({
      high: price * (1 + Math.random() * 0.002),
      low: price * (1 - Math.random() * 0.002),
      close: price,
      volume
    });

    // Maintain lookback window
    if (this.priceHistory.length > this.params.lookbackPeriod) {
      this.priceHistory.shift();
    }

    const signals: SignalSet = { signals: [] };

    // Exit logic (stop loss / take profit)
    if (this.position !== "FLAT" && this.entryPrice) {
      const currentReturn = (price - this.entryPrice) / this.entryPrice;
      const positionReturn = this.position === "LONG" ? currentReturn : -currentReturn;

      if (this.params.stopLoss && positionReturn <= -this.params.stopLoss) {
        signals.signals.push({
          symbol: this.params.symbol,
          action: "CLOSE",
          tag: "stop_loss"
        });
        this.position = "FLAT";
        this.entryPrice = undefined;
        this.currentPattern = undefined;
        return signals;
      }

      if (this.params.takeProfit && positionReturn >= this.params.takeProfit) {
        signals.signals.push({
          symbol: this.params.symbol,
          action: "CLOSE",
          tag: "take_profit"
        });
        this.position = "FLAT";
        this.entryPrice = undefined;
        this.currentPattern = undefined;
        return signals;
      }
    }

    // Only detect patterns if we have enough data and no position
    if (this.position === "FLAT" && this.priceHistory.length >= 30) {
      const pattern = this.detectHeadAndShoulders();
      
      if (pattern) {
        this.currentPattern = pattern;
        this.confirmationBars = 0;
      }
    }

    // Check for neckline break confirmation
    if (this.currentPattern && this.position === "FLAT") {
      const currentPrice = this.priceHistory[this.priceHistory.length - 1].close;
      const neckline = this.currentPattern.necklineLevel;
      
      if (this.currentPattern.isInverted) {
        // Inverse H&S: bullish pattern, look for upward neckline break
        if (currentPrice > neckline) {
          this.confirmationBars++;
          
          if (this.confirmationBars >= this.params.necklineBreakConfirmation) {
            // Check volume confirmation if required
            const volumeOk = !this.params.volumeConfirmation || this.checkVolumeIncrease();
            
            if (volumeOk) {
              signals.signals.push({
                symbol: this.params.symbol,
                action: "BUY",
                quantity: this.params.positionSize,
                tag: "inverse_hs_neckline_break"
              });
              this.position = "LONG";
              this.entryPrice = currentPrice;
            }
          }
        } else {
          this.confirmationBars = 0;
        }
      } else {
        // Regular H&S: bearish pattern, look for downward neckline break
        if (currentPrice < neckline) {
          this.confirmationBars++;
          
          if (this.confirmationBars >= this.params.necklineBreakConfirmation) {
            const volumeOk = !this.params.volumeConfirmation || this.checkVolumeIncrease();
            
            if (volumeOk) {
              signals.signals.push({
                symbol: this.params.symbol,
                action: "SELL",
                quantity: this.params.positionSize,
                tag: "hs_neckline_break"
              });
              this.position = "SHORT";
              this.entryPrice = currentPrice;
            }
          }
        } else {
          this.confirmationBars = 0;
        }
      }
    }

    return signals;
  }

  private detectHeadAndShoulders(): PatternData | null {
    const highs = this.priceHistory.map(p => p.high);
    const lows = this.priceHistory.map(p => p.low);
    
    // Detect regular Head & Shoulders (bearish)
    const bearishPattern = this.findHSPattern(highs, lows, false);
    if (bearishPattern) return bearishPattern;
    
    // Detect Inverse Head & Shoulders (bullish)
    const bullishPattern = this.findHSPattern(highs, lows, true);
    return bullishPattern;
  }

  private findHSPattern(highs: number[], lows: number[], isInverted: boolean): PatternData | null {
    const dataPoints = isInverted ? lows : highs;
    const peaks = this.findPeaks(dataPoints, isInverted);
    
    if (peaks.length < 3) return null;

    // Check last 3 peaks for H&S formation
    const recentPeaks = peaks.slice(-3);
    const [leftIdx, headIdx, rightIdx] = recentPeaks;
    
    const leftValue = dataPoints[leftIdx];
    const headValue = dataPoints[headIdx];
    const rightValue = dataPoints[rightIdx];

    // Validate H&S structure
    if (isInverted) {
      // Inverse: head should be lowest, shoulders similar height
      if (headValue >= leftValue || headValue >= rightValue) return null;
    } else {
      // Regular: head should be highest, shoulders similar height
      if (headValue <= leftValue || headValue <= rightValue) return null;
    }

    // Check shoulder symmetry
    const shoulderDiff = Math.abs(leftValue - rightValue) / leftValue;
    if (shoulderDiff > this.params.shoulderSymmetryTolerance) return null;

    // Calculate neckline (support/resistance connecting shoulder troughs/peaks)
    const necklineLevel = this.calculateNeckline(leftIdx, rightIdx, isInverted);
    
    // Calculate pattern height for measured move target
    const patternHeight = Math.abs(headValue - necklineLevel);

    return {
      leftShoulderIdx: leftIdx,
      headIdx,
      rightShoulderIdx: rightIdx,
      necklineLevel,
      patternHeight,
      isInverted
    };
  }

  private findPeaks(data: number[], findValleys: boolean): number[] {
    const peaks: number[] = [];
    const windowSize = 5; // Look 5 bars each side for local extremum
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      let isPeak = true;
      
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j === i) continue;
        
        if (findValleys) {
          if (data[i] >= data[j]) {
            isPeak = false;
            break;
          }
        } else {
          if (data[i] <= data[j]) {
            isPeak = false;
            break;
          }
        }
      }
      
      if (isPeak) peaks.push(i);
    }
    
    return peaks;
  }

  private calculateNeckline(leftIdx: number, rightIdx: number, isInverted: boolean): number {
    // Find the valleys/peaks between shoulders to establish neckline
    const dataPoints = isInverted ? 
      this.priceHistory.map(p => p.high) : 
      this.priceHistory.map(p => p.low);
    
    // Get trough/peak points between shoulders
    const betweenPoints = dataPoints.slice(leftIdx, rightIdx + 1);
    
    if (isInverted) {
      // For inverse H&S, neckline is resistance (peaks between shoulders)
      return Math.max(...betweenPoints);
    } else {
      // For regular H&S, neckline is support (troughs between shoulders)
      return Math.min(...betweenPoints);
    }
  }

  private checkVolumeIncrease(): boolean {
    if (this.priceHistory.length < 5) return false;
    
    const recentVolumes = this.priceHistory.slice(-5).map(p => p.volume || 0);
    const avgVolume = recentVolumes.slice(0, -1).reduce((a, b) => a + b, 0) / 4;
    const currentVolume = recentVolumes[recentVolumes.length - 1];
    
    // Require 20% volume increase on breakout
    return currentVolume > avgVolume * 1.2;
  }

  getPosition(): string {
    return this.position;
  }

  getCurrentMetrics() {
    if (!this.currentPattern) return null;
    
    return {
      position: this.position,
      patternType: this.currentPattern.isInverted ? "Inverse H&S" : "Head & Shoulders",
      necklineLevel: this.currentPattern.necklineLevel,
      patternHeight: this.currentPattern.patternHeight,
      measuredMoveTarget: this.currentPattern.isInverted ?
        this.currentPattern.necklineLevel + this.currentPattern.patternHeight :
        this.currentPattern.necklineLevel - this.currentPattern.patternHeight,
      confirmationBars: this.confirmationBars
    };
  }

  reset(): void {
    this.position = "FLAT";
    this.entryPrice = undefined;
    this.priceHistory = [];
    this.currentPattern = undefined;
    this.confirmationBars = 0;
  }
}
