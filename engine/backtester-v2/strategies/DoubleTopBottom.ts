import { SignalSet } from "../exec/execution";

export interface DoubleTopBottomParams {
  symbol: string;
  lookbackPeriod: number; // Bars to analyze
  peakSimilarityTolerance: number; // % tolerance for peak/trough equality (e.g., 0.02 = 2%)
  minBarsBetweenPeaks: number; // Minimum separation between tops/bottoms
  necklineBreakConfirmation: number; // Bars to confirm break
  volumeConfirmation: boolean;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface PatternData {
  firstPeakIdx: number;
  secondPeakIdx: number;
  necklineLevel: number;
  patternHeight: number;
  isDoubleBottom: boolean; // true = bullish, false = bearish double top
}

export class DoubleTopBottomStrategy {
  private position: "LONG" | "SHORT" | "FLAT" = "FLAT";
  private entryPrice?: number;
  private priceHistory: Array<{ high: number; low: number; close: number; volume?: number }> = [];
  private currentPattern?: PatternData;
  private confirmationBars: number = 0;

  constructor(private params: DoubleTopBottomParams) {}

  generateSignals(
    date: string,
    prices: Record<string, number>,
    indicators?: Record<string, number>
  ): SignalSet {
    const price = prices[this.params.symbol];
    if (!price) return { signals: [] };

    const volume = indicators?.volume;
    this.priceHistory.push({
      high: price * (1 + Math.random() * 0.002),
      low: price * (1 - Math.random() * 0.002),
      close: price,
      volume
    });

    if (this.priceHistory.length > this.params.lookbackPeriod) {
      this.priceHistory.shift();
    }

    const signals: SignalSet = { signals: [] };

    // Exit logic
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

    // Detect pattern
    if (this.position === "FLAT" && this.priceHistory.length >= 20) {
      const pattern = this.detectDoubleTopBottom();
      
      if (pattern) {
        this.currentPattern = pattern;
        this.confirmationBars = 0;
      }
    }

    // Check for neckline break
    if (this.currentPattern && this.position === "FLAT") {
      const currentPrice = this.priceHistory[this.priceHistory.length - 1].close;
      const neckline = this.currentPattern.necklineLevel;
      
      if (this.currentPattern.isDoubleBottom) {
        // Double Bottom: bullish, look for upward break
        if (currentPrice > neckline) {
          this.confirmationBars++;
          
          if (this.confirmationBars >= this.params.necklineBreakConfirmation) {
            const volumeOk = !this.params.volumeConfirmation || this.checkVolumeIncrease();
            
            if (volumeOk) {
              signals.signals.push({
                symbol: this.params.symbol,
                action: "BUY",
                quantity: this.params.positionSize,
                tag: "double_bottom_break"
              });
              this.position = "LONG";
              this.entryPrice = currentPrice;
            }
          }
        } else {
          this.confirmationBars = 0;
        }
      } else {
        // Double Top: bearish, look for downward break
        if (currentPrice < neckline) {
          this.confirmationBars++;
          
          if (this.confirmationBars >= this.params.necklineBreakConfirmation) {
            const volumeOk = !this.params.volumeConfirmation || this.checkVolumeIncrease();
            
            if (volumeOk) {
              signals.signals.push({
                symbol: this.params.symbol,
                action: "SELL",
                quantity: this.params.positionSize,
                tag: "double_top_break"
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

  private detectDoubleTopBottom(): PatternData | null {
    const highs = this.priceHistory.map(p => p.high);
    const lows = this.priceHistory.map(p => p.low);
    
    // Try to detect Double Top (bearish)
    const doubleTop = this.findDoublePattern(highs, false);
    if (doubleTop) return doubleTop;
    
    // Try to detect Double Bottom (bullish)
    const doubleBottom = this.findDoublePattern(lows, true);
    return doubleBottom;
  }

  private findDoublePattern(data: number[], isBottom: boolean): PatternData | null {
    const peaks = this.findPeaks(data, isBottom);
    
    if (peaks.length < 2) return null;

    // Check most recent pairs of peaks
    for (let i = peaks.length - 1; i >= 1; i--) {
      const secondPeakIdx = peaks[i];
      const firstPeakIdx = peaks[i - 1];
      
      // Check minimum separation
      if (secondPeakIdx - firstPeakIdx < this.params.minBarsBetweenPeaks) continue;
      
      const firstPeakValue = data[firstPeakIdx];
      const secondPeakValue = data[secondPeakIdx];
      
      // Check if peaks are similar in height
      const peakDiff = Math.abs(firstPeakValue - secondPeakValue) / firstPeakValue;
      if (peakDiff > this.params.peakSimilarityTolerance) continue;
      
      // Find neckline (support/resistance between the two peaks)
      const necklineLevel = this.calculateNeckline(firstPeakIdx, secondPeakIdx, isBottom);
      
      // Calculate pattern height
      const avgPeakValue = (firstPeakValue + secondPeakValue) / 2;
      const patternHeight = Math.abs(avgPeakValue - necklineLevel);
      
      // Validate pattern structure
      if (isBottom) {
        // For double bottom, neckline should be above the lows
        if (necklineLevel <= avgPeakValue) continue;
      } else {
        // For double top, neckline should be below the highs
        if (necklineLevel >= avgPeakValue) continue;
      }
      
      return {
        firstPeakIdx,
        secondPeakIdx,
        necklineLevel,
        patternHeight,
        isDoubleBottom: isBottom
      };
    }
    
    return null;
  }

  private findPeaks(data: number[], findValleys: boolean): number[] {
    const peaks: number[] = [];
    const windowSize = 3;
    
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

  private calculateNeckline(firstIdx: number, secondIdx: number, isBottom: boolean): number {
    // Find the peak/trough between the two main peaks
    const dataToCheck = isBottom ? 
      this.priceHistory.map(p => p.high) : 
      this.priceHistory.map(p => p.low);
    
    const betweenPoints = dataToCheck.slice(firstIdx, secondIdx + 1);
    
    if (isBottom) {
      // For double bottom, neckline is the high (resistance) between the lows
      return Math.max(...betweenPoints);
    } else {
      // For double top, neckline is the low (support) between the highs
      return Math.min(...betweenPoints);
    }
  }

  private checkVolumeIncrease(): boolean {
    if (this.priceHistory.length < 5) return false;
    
    const recentVolumes = this.priceHistory.slice(-5).map(p => p.volume || 0);
    const avgVolume = recentVolumes.slice(0, -1).reduce((a, b) => a + b, 0) / 4;
    const currentVolume = recentVolumes[recentVolumes.length - 1];
    
    return currentVolume > avgVolume * 1.2;
  }

  getPosition(): string {
    return this.position;
  }

  getCurrentMetrics() {
    if (!this.currentPattern) return null;
    
    return {
      position: this.position,
      patternType: this.currentPattern.isDoubleBottom ? "Double Bottom" : "Double Top",
      necklineLevel: this.currentPattern.necklineLevel,
      patternHeight: this.currentPattern.patternHeight,
      measuredMoveTarget: this.currentPattern.isDoubleBottom ?
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
