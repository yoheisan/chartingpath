import { SignalSet } from "../exec/execution";

export interface TrianglePatternsParams {
  symbol: string;
  lookbackPeriod: number;
  minTrendlineTouches: number; // Minimum touches for valid trendline (typically 2-3)
  trendlineTolerance: number; // % price can deviate from trendline
  breakoutConfirmation: number; // Bars to confirm breakout
  volumeConfirmation: boolean;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
}

type TriangleType = "ascending" | "descending" | "symmetrical";

interface TrendLine {
  slope: number;
  intercept: number;
  touches: number[];
}

interface PatternData {
  type: TriangleType;
  upperTrendline: TrendLine;
  lowerTrendline: TrendLine;
  apexIndex: number; // Where trendlines converge
  baseWidth: number;
  currentWidth: number;
}

export class TrianglePatternsStrategy {
  private position: "LONG" | "SHORT" | "FLAT" = "FLAT";
  private entryPrice?: number;
  private priceHistory: Array<{ high: number; low: number; close: number; volume?: number }> = [];
  private currentPattern?: PatternData;
  private confirmationBars: number = 0;

  constructor(private params: TrianglePatternsParams) {}

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

    // Detect triangle pattern
    if (this.position === "FLAT" && this.priceHistory.length >= 25) {
      const pattern = this.detectTriangle();
      
      if (pattern) {
        this.currentPattern = pattern;
        this.confirmationBars = 0;
      }
    }

    // Check for breakout
    if (this.currentPattern && this.position === "FLAT") {
      const currentIdx = this.priceHistory.length - 1;
      const currentBar = this.priceHistory[currentIdx];
      const upperLevel = this.getTrendlineValue(this.currentPattern.upperTrendline, currentIdx);
      const lowerLevel = this.getTrendlineValue(this.currentPattern.lowerTrendline, currentIdx);
      
      // Check for breakout above upper trendline
      if (currentBar.close > upperLevel) {
        this.confirmationBars++;
        
        if (this.confirmationBars >= this.params.breakoutConfirmation) {
          const volumeOk = !this.params.volumeConfirmation || this.checkVolumeIncrease();
          
          if (volumeOk) {
            const tag = `${this.currentPattern.type}_triangle_breakout_long`;
            signals.signals.push({
              symbol: this.params.symbol,
              action: "BUY",
              quantity: this.params.positionSize,
              tag
            });
            this.position = "LONG";
            this.entryPrice = currentBar.close;
          }
        }
      }
      // Check for breakdown below lower trendline
      else if (currentBar.close < lowerLevel) {
        this.confirmationBars++;
        
        if (this.confirmationBars >= this.params.breakoutConfirmation) {
          const volumeOk = !this.params.volumeConfirmation || this.checkVolumeIncrease();
          
          if (volumeOk) {
            const tag = `${this.currentPattern.type}_triangle_breakout_short`;
            signals.signals.push({
              symbol: this.params.symbol,
              action: "SELL",
              quantity: this.params.positionSize,
              tag
            });
            this.position = "SHORT";
            this.entryPrice = currentBar.close;
          }
        }
      } else {
        this.confirmationBars = 0;
      }
    }

    return signals;
  }

  private detectTriangle(): PatternData | null {
    const highs = this.priceHistory.map(p => p.high);
    const lows = this.priceHistory.map(p => p.low);
    
    // Find swing highs and lows
    const swingHighs = this.findSwingPoints(highs, false);
    const swingLows = this.findSwingPoints(lows, true);
    
    if (swingHighs.length < this.params.minTrendlineTouches || 
        swingLows.length < this.params.minTrendlineTouches) {
      return null;
    }
    
    // Fit trendlines to swing points
    const upperTrendline = this.fitTrendline(swingHighs, highs);
    const lowerTrendline = this.fitTrendline(swingLows, lows);
    
    if (!upperTrendline || !lowerTrendline) return null;
    
    // Determine triangle type based on trendline slopes
    const type = this.classifyTriangle(upperTrendline, lowerTrendline);
    
    // Calculate apex (where trendlines converge)
    const apexIndex = this.calculateApex(upperTrendline, lowerTrendline);
    
    // Validate pattern is forming (not already broken out)
    if (apexIndex <= this.priceHistory.length) {
      const baseWidth = this.calculateBaseWidth(swingHighs, swingLows);
      const currentWidth = this.getCurrentWidth(upperTrendline, lowerTrendline);
      
      // Triangle should be narrowing
      if (currentWidth < baseWidth * 0.8) {
        return {
          type,
          upperTrendline,
          lowerTrendline,
          apexIndex,
          baseWidth,
          currentWidth
        };
      }
    }
    
    return null;
  }

  private findSwingPoints(data: number[], findLows: boolean): number[] {
    const swings: number[] = [];
    const windowSize = 3;
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      let isSwing = true;
      
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j === i) continue;
        
        if (findLows) {
          if (data[i] >= data[j]) {
            isSwing = false;
            break;
          }
        } else {
          if (data[i] <= data[j]) {
            isSwing = false;
            break;
          }
        }
      }
      
      if (isSwing) swings.push(i);
    }
    
    return swings;
  }

  private fitTrendline(swingIndices: number[], priceData: number[]): TrendLine | null {
    if (swingIndices.length < 2) return null;
    
    // Use last N swing points for trendline
    const recentSwings = swingIndices.slice(-Math.max(this.params.minTrendlineTouches, 3));
    
    // Linear regression
    const n = recentSwings.length;
    const sumX = recentSwings.reduce((a, b) => a + b, 0);
    const sumY = recentSwings.reduce((a, b) => a + priceData[b], 0);
    const sumXY = recentSwings.reduce((a, idx) => a + idx * priceData[idx], 0);
    const sumX2 = recentSwings.reduce((a, idx) => a + idx * idx, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Validate touches within tolerance
    const validTouches = recentSwings.filter(idx => {
      const expectedPrice = slope * idx + intercept;
      const actualPrice = priceData[idx];
      const deviation = Math.abs(actualPrice - expectedPrice) / expectedPrice;
      return deviation <= this.params.trendlineTolerance;
    });
    
    if (validTouches.length < this.params.minTrendlineTouches) return null;
    
    return {
      slope,
      intercept,
      touches: validTouches
    };
  }

  private classifyTriangle(upper: TrendLine, lower: TrendLine): TriangleType {
    const upperSlope = upper.slope;
    const lowerSlope = lower.slope;
    
    const slopeThreshold = 0.05; // Slope tolerance for horizontal lines
    
    if (Math.abs(upperSlope) < slopeThreshold && lowerSlope > slopeThreshold) {
      return "ascending"; // Flat resistance, rising support
    } else if (Math.abs(lowerSlope) < slopeThreshold && upperSlope < -slopeThreshold) {
      return "descending"; // Flat support, falling resistance
    } else {
      return "symmetrical"; // Both converging
    }
  }

  private calculateApex(upper: TrendLine, lower: TrendLine): number {
    // Find where trendlines intersect
    // upper.slope * x + upper.intercept = lower.slope * x + lower.intercept
    const x = (lower.intercept - upper.intercept) / (upper.slope - lower.slope);
    return Math.round(x);
  }

  private getTrendlineValue(trendline: TrendLine, index: number): number {
    return trendline.slope * index + trendline.intercept;
  }

  private calculateBaseWidth(swingHighs: number[], swingLows: number[]): number {
    const firstHighIdx = Math.min(...swingHighs);
    const firstLowIdx = Math.min(...swingLows);
    const startIdx = Math.min(firstHighIdx, firstLowIdx);
    
    const upperValue = this.getTrendlineValue(this.currentPattern!.upperTrendline, startIdx);
    const lowerValue = this.getTrendlineValue(this.currentPattern!.lowerTrendline, startIdx);
    
    return Math.abs(upperValue - lowerValue);
  }

  private getCurrentWidth(upper: TrendLine, lower: TrendLine): number {
    const currentIdx = this.priceHistory.length - 1;
    const upperValue = this.getTrendlineValue(upper, currentIdx);
    const lowerValue = this.getTrendlineValue(lower, currentIdx);
    return Math.abs(upperValue - lowerValue);
  }

  private checkVolumeIncrease(): boolean {
    if (this.priceHistory.length < 5) return false;
    
    const recentVolumes = this.priceHistory.slice(-5).map(p => p.volume || 0);
    const avgVolume = recentVolumes.slice(0, -1).reduce((a, b) => a + b, 0) / 4;
    const currentVolume = recentVolumes[recentVolumes.length - 1];
    
    return currentVolume > avgVolume * 1.3; // 30% increase for breakout
  }

  getPosition(): string {
    return this.position;
  }

  getCurrentMetrics() {
    if (!this.currentPattern) return null;
    
    const currentIdx = this.priceHistory.length - 1;
    const upperLevel = this.getTrendlineValue(this.currentPattern.upperTrendline, currentIdx);
    const lowerLevel = this.getTrendlineValue(this.currentPattern.lowerTrendline, currentIdx);
    
    return {
      position: this.position,
      patternType: `${this.currentPattern.type} triangle`,
      upperTrendline: upperLevel,
      lowerTrendline: lowerLevel,
      currentWidth: this.currentPattern.currentWidth,
      baseWidth: this.currentPattern.baseWidth,
      compressionRatio: this.currentPattern.currentWidth / this.currentPattern.baseWidth,
      barsToApex: Math.max(0, this.currentPattern.apexIndex - currentIdx),
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
