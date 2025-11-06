import { DoubleTopTargetMethodologies } from './TargetMethodologies';

interface CandlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PatternAnnotation {
  type: 'trendline' | 'support' | 'resistance' | 'neckline' | 'target' | 'peak';
  points: { x: number; y: number }[];
  label?: string;
  color: string;
  style: 'solid' | 'dashed';
}

interface PatternData {
  candles: CandlestickData[];
  annotations: PatternAnnotation[];
  description: string;
  keyLevels: {
    entry?: number;
    stopLoss?: number;
    target?: number;
    breakout?: number;
  };
}

export class PatternCalculator {
  
  // Head and Shoulders - Based on Thomas N. Bulkowski's "Encyclopedia of Chart Patterns" (85% historical accuracy)
  // Educational data only - past performance does not guarantee future results
  static generateHeadAndShoulders(): PatternData {
    const basePrice = 100;
    const leftShoulderHigh = basePrice + 18;
    const headHigh = basePrice + 28;
    const rightShoulderHigh = basePrice + 17;
    const necklineLevel = basePrice + 8;
    
    const candles: CandlestickData[] = [
      // Pre-pattern uptrend
      { open: basePrice - 5, high: basePrice, low: basePrice - 8, close: basePrice - 2, volume: 800 },
      { open: basePrice - 2, high: basePrice + 4, low: basePrice - 3, close: basePrice + 2, volume: 1000 },
      { open: basePrice + 2, high: basePrice + 8, low: basePrice + 1, close: basePrice + 6, volume: 1200 },
      
      // Left shoulder formation
      { open: basePrice + 6, high: basePrice + 12, low: basePrice + 5, close: basePrice + 10, volume: 1400 },
      { open: basePrice + 10, high: leftShoulderHigh, low: basePrice + 9, close: basePrice + 16, volume: 1800 },
      { open: basePrice + 16, high: leftShoulderHigh + 1, low: basePrice + 14, close: basePrice + 15, volume: 1600 },
      
      // Decline to neckline
      { open: basePrice + 15, high: basePrice + 16, low: basePrice + 11, close: basePrice + 12, volume: 1400 },
      { open: basePrice + 12, high: basePrice + 14, low: necklineLevel, close: necklineLevel + 2, volume: 1200 },
      { open: necklineLevel + 2, high: basePrice + 11, low: necklineLevel - 1, close: necklineLevel + 1, volume: 1000 },
      
      // Head formation
      { open: necklineLevel + 1, high: basePrice + 14, low: necklineLevel, close: basePrice + 12, volume: 1600 },
      { open: basePrice + 12, high: basePrice + 20, low: basePrice + 11, close: basePrice + 18, volume: 2200 },
      { open: basePrice + 18, high: headHigh, low: basePrice + 17, close: basePrice + 26, volume: 2600 },
      { open: basePrice + 26, high: headHigh + 1, low: basePrice + 24, close: basePrice + 25, volume: 2400 },
      
      // Decline from head to neckline
      { open: basePrice + 25, high: basePrice + 26, low: basePrice + 20, close: basePrice + 21, volume: 2000 },
      { open: basePrice + 21, high: basePrice + 23, low: basePrice + 16, close: basePrice + 17, volume: 1800 },
      { open: basePrice + 17, high: basePrice + 19, low: necklineLevel, close: necklineLevel + 3, volume: 1500 },
      { open: necklineLevel + 3, high: basePrice + 12, low: necklineLevel - 1, close: necklineLevel + 2, volume: 1200 },
      
      // Right shoulder formation (lower volume)
      { open: necklineLevel + 2, high: basePrice + 12, low: necklineLevel + 1, close: basePrice + 10, volume: 1100 },
      { open: basePrice + 10, high: basePrice + 16, low: basePrice + 9, close: basePrice + 14, volume: 1300 },
      { open: basePrice + 14, high: rightShoulderHigh, low: basePrice + 13, close: basePrice + 16, volume: 1200 },
      { open: basePrice + 16, high: rightShoulderHigh + 0.5, low: basePrice + 15, close: basePrice + 15.5, volume: 1000 },
      
      // Neckline break
      { open: basePrice + 15.5, high: basePrice + 16, low: basePrice + 10, close: basePrice + 11, volume: 1600 },
      { open: basePrice + 11, high: basePrice + 13, low: necklineLevel - 1, close: necklineLevel, volume: 1800 },
      { open: necklineLevel, high: necklineLevel + 3, low: basePrice - 1, close: basePrice, volume: 2400 },
      { open: basePrice, high: basePrice + 2, low: basePrice - 6, close: basePrice - 4, volume: 2800 },
    ];

    const headToNecklineDistance = headHigh - necklineLevel;
    const primaryTarget = necklineLevel - headToNecklineDistance;

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 4, y: leftShoulderHigh }],
        label: 'Left Shoulder',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'peak', 
        points: [{ x: 11, y: headHigh }],
        label: 'Head (Highest)',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 19, y: rightShoulderHigh }],
        label: 'Right Shoulder', 
        color: '#45B7D1',
        style: 'solid'
      },
      {
        type: 'neckline',
        points: [{ x: 7, y: necklineLevel }, { x: 16, y: necklineLevel }],
        label: 'Neckline',
        color: '#FFD700',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 23, y: necklineLevel }, { x: 23, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)}`,
        color: '#FF6B6B',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 85% historical accuracy | Bearish reversal | Enter on candle close below neckline with volume 1.5x average. Head higher than shoulders, volume decline at right shoulder. Average decline: 14% | Risk 1-2% of account per trade",
      keyLevels: {
        breakout: necklineLevel,
        target: primaryTarget,
        stopLoss: rightShoulderHigh + 1,
        entry: necklineLevel - 0.5
      }
    };
  }

  // Double Top - Based on Thomas N. Bulkowski (78% historical accuracy, 22% failure rate)
  static generateDoubleTop(): PatternData {
    const basePrice = 100;
    const peakLevel = basePrice + 22;
    const secondPeakLevel = basePrice + 21.5;
    const valleyLevel = basePrice + 9;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 8, high: basePrice - 5, low: basePrice - 10, close: basePrice - 6, volume: 800 },
      { open: basePrice - 6, high: basePrice - 2, low: basePrice - 7, close: basePrice - 3, volume: 1000 },
      { open: basePrice - 3, high: basePrice + 2, low: basePrice - 4, close: basePrice, volume: 1200 },
      { open: basePrice, high: basePrice + 6, low: basePrice - 1, close: basePrice + 4, volume: 1400 },
      { open: basePrice + 4, high: basePrice + 10, low: basePrice + 3, close: basePrice + 8, volume: 1600 },
      { open: basePrice + 8, high: basePrice + 15, low: basePrice + 7, close: basePrice + 13, volume: 2000 },
      { open: basePrice + 13, high: peakLevel, low: basePrice + 12, close: basePrice + 20, volume: 2400 },
      { open: basePrice + 20, high: peakLevel + 1, low: basePrice + 18, close: basePrice + 19, volume: 2200 },
      { open: basePrice + 19, high: basePrice + 20, low: basePrice + 15, close: basePrice + 16, volume: 1800 },
      { open: basePrice + 16, high: basePrice + 18, low: basePrice + 12, close: basePrice + 13, volume: 1600 },
      { open: basePrice + 13, high: basePrice + 15, low: valleyLevel, close: valleyLevel + 2, volume: 1400 },
      { open: valleyLevel + 2, high: basePrice + 12, low: valleyLevel - 1, close: valleyLevel + 1, volume: 1200 },
      { open: valleyLevel + 1, high: basePrice + 11, low: valleyLevel, close: basePrice + 10, volume: 1100 },
      { open: basePrice + 10, high: basePrice + 13, low: basePrice + 9, close: basePrice + 11, volume: 1000 },
      { open: basePrice + 11, high: basePrice + 16, low: basePrice + 10, close: basePrice + 15, volume: 1300 },
      { open: basePrice + 15, high: basePrice + 19, low: basePrice + 14, close: basePrice + 18, volume: 1600 },
      { open: basePrice + 18, high: secondPeakLevel, low: basePrice + 17, close: basePrice + 20, volume: 1800 },
      { open: basePrice + 20, high: secondPeakLevel + 0.5, low: basePrice + 19, close: basePrice + 19.5, volume: 1500 },
      { open: basePrice + 19.5, high: basePrice + 20, low: basePrice + 15, close: basePrice + 16, volume: 1900 },
      { open: basePrice + 16, high: basePrice + 18, low: basePrice + 12, close: basePrice + 13, volume: 2100 },
      { open: basePrice + 13, high: basePrice + 15, low: valleyLevel - 1, close: valleyLevel, volume: 2300 },
      { open: valleyLevel, high: valleyLevel + 3, low: basePrice + 2, close: basePrice + 3, volume: 2800 },
      { open: basePrice + 3, high: basePrice + 5, low: basePrice - 2, close: basePrice - 1, volume: 3000 },
    ];

    const peakToValley = peakLevel - valleyLevel;
    const primaryTarget = valleyLevel - peakToValley;
    const conservativeTarget = valleyLevel - (peakToValley * 0.618);
    const aggressiveTarget = valleyLevel - (peakToValley * 1.618);

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 6, y: peakLevel }],
        label: 'First Peak (High Vol)',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 16, y: secondPeakLevel }],
        label: 'Second Peak (Lower Vol)',
        color: '#FF6B6B', 
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 10, y: valleyLevel }, { x: 20, y: valleyLevel }],
        label: 'Confirmation Line',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'resistance',
        points: [{ x: 6, y: peakLevel }, { x: 16, y: secondPeakLevel }],
        label: 'Double Top Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 21, y: valleyLevel }, { x: 21, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)} (${peakToValley.toFixed(0)} pts)`,
        color: '#FFD700',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 16, y: secondPeakLevel - 2 }],
        label: 'Volume Divergence',
        color: '#FFA500',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 78% historical accuracy | Bearish reversal | Enter on candle close below support with volume 1.5-2x average. Peaks within 3% from highest high, volume divergence at 2nd peak. Average decline: 20% | Position size for 1-2% account risk",
      keyLevels: {
        breakout: valleyLevel,
        target: primaryTarget,
        stopLoss: Math.max(peakLevel, secondPeakLevel) + 1,
        entry: valleyLevel - 0.5
      }
    };
  }

  // Ascending Triangle - Based on Thomas N. Bulkowski (83% historical accuracy)
  static generateAscendingTriangle(): PatternData {
    const basePrice = 100;
    const resistanceLevel = basePrice + 18;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 5, high: basePrice, low: basePrice - 8, close: basePrice - 2, volume: 800 },
      { open: basePrice - 2, high: basePrice + 4, low: basePrice - 3, close: basePrice + 2, volume: 1000 },
      { open: basePrice + 2, high: basePrice + 8, low: basePrice + 1, close: basePrice + 6, volume: 1200 },
      { open: basePrice + 6, high: resistanceLevel, low: basePrice + 5, close: basePrice + 16, volume: 1500 },
      { open: basePrice + 16, high: resistanceLevel + 1, low: basePrice + 14, close: basePrice + 15, volume: 1400 },
      { open: basePrice + 15, high: basePrice + 16, low: basePrice + 8, close: basePrice + 9, volume: 1200 },
      { open: basePrice + 9, high: basePrice + 11, low: basePrice + 6, close: basePrice + 7, volume: 1100 },
      { open: basePrice + 7, high: basePrice + 10, low: basePrice + 6, close: basePrice + 9, volume: 1000 },
      { open: basePrice + 9, high: basePrice + 14, low: basePrice + 8, close: basePrice + 12, volume: 1200 },
      { open: basePrice + 12, high: resistanceLevel, low: basePrice + 11, close: basePrice + 16, volume: 1400 },
      { open: basePrice + 16, high: resistanceLevel + 0.5, low: basePrice + 14, close: basePrice + 15, volume: 1300 },
      { open: basePrice + 15, high: basePrice + 16, low: basePrice + 10, close: basePrice + 11, volume: 1100 },
      { open: basePrice + 11, high: basePrice + 13, low: basePrice + 9, close: basePrice + 10, volume: 1000 },
      { open: basePrice + 10, high: basePrice + 12, low: basePrice + 9, close: basePrice + 11, volume: 900 },
      { open: basePrice + 11, high: basePrice + 15, low: basePrice + 10, close: basePrice + 14, volume: 1000 },
      { open: basePrice + 14, high: resistanceLevel, low: basePrice + 13, close: basePrice + 16, volume: 1100 },
      { open: basePrice + 16, high: basePrice + 17, low: basePrice + 12, close: basePrice + 13, volume: 900 },
      { open: basePrice + 13, high: basePrice + 14, low: basePrice + 11, close: basePrice + 12, volume: 800 },
      { open: basePrice + 12, high: basePrice + 16, low: basePrice + 11, close: basePrice + 15, volume: 1000 },
      { open: basePrice + 15, high: basePrice + 22, low: basePrice + 14, close: basePrice + 20, volume: 2000 },
      { open: basePrice + 20, high: basePrice + 26, low: basePrice + 19, close: basePrice + 24, volume: 2200 },
      { open: basePrice + 24, high: basePrice + 30, low: basePrice + 23, close: basePrice + 28, volume: 1900 },
    ];

    const triangleHeight = resistanceLevel - (basePrice + 7);
    const primaryTarget = resistanceLevel + triangleHeight;

    const annotations: PatternAnnotation[] = [
      {
        type: 'resistance',
        points: [{ x: 3, y: resistanceLevel }, { x: 15, y: resistanceLevel }],
        label: 'Horizontal Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'trendline',
        points: [{ x: 6, y: basePrice + 7 }, { x: 11, y: basePrice + 10 }, { x: 16, y: basePrice + 12 }],
        label: 'Ascending Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 18, y: resistanceLevel }, { x: 18, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)} (+${triangleHeight.toFixed(0)} pts)`,
        color: '#FFD700',
        style: 'dashed'
      },
      {
        type: 'peak',
        points: [{ x: 19, y: basePrice + 22 }],
        label: 'Volume Breakout',
        color: '#90EE90',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 83% historical accuracy | Bullish continuation | Enter on candle close above resistance with volume 1.5x average. Breakout typically at 2/3 pattern width. Min 2 touches of resistance, ascending support. Average rise: 38% | Risk 1-2% of account",
      keyLevels: {
        breakout: resistanceLevel,
        target: primaryTarget,
        stopLoss: basePrice + 11,
        entry: resistanceLevel + 0.5
      }
    };
  }

  // Rectangle - Based on Thomas N. Bulkowski (86% historical accuracy for continuation)
  static generateRectangle(): PatternData {
    const basePrice = 100;
    const resistanceLevel = basePrice + 15;
    const supportLevel = basePrice + 5;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 3, high: basePrice + 2, low: basePrice - 5, close: basePrice, volume: 1000 },
      { open: basePrice, high: basePrice + 8, low: basePrice - 1, close: basePrice + 6, volume: 1200 },
      { open: basePrice + 6, high: resistanceLevel, low: basePrice + 5, close: basePrice + 13, volume: 1400 },
      { open: basePrice + 13, high: resistanceLevel + 1, low: basePrice + 11, close: basePrice + 12, volume: 1300 },
      { open: basePrice + 12, high: basePrice + 14, low: basePrice + 8, close: basePrice + 9, volume: 1200 },
      { open: basePrice + 9, high: basePrice + 11, low: supportLevel, close: supportLevel + 2, volume: 1100 },
      { open: supportLevel + 2, high: basePrice + 8, low: supportLevel - 1, close: supportLevel + 1, volume: 1000 },
      { open: supportLevel + 1, high: basePrice + 9, low: supportLevel, close: basePrice + 7, volume: 1000 },
      { open: basePrice + 7, high: basePrice + 12, low: basePrice + 6, close: basePrice + 11, volume: 1100 },
      { open: basePrice + 11, high: resistanceLevel, low: basePrice + 10, close: basePrice + 14, volume: 1200 },
      { open: basePrice + 14, high: basePrice + 15, low: basePrice + 9, close: basePrice + 10, volume: 1100 },
      { open: basePrice + 10, high: basePrice + 12, low: supportLevel, close: supportLevel + 3, volume: 1000 },
      { open: supportLevel + 3, high: basePrice + 11, low: supportLevel + 2, close: basePrice + 8, volume: 900 },
      { open: basePrice + 8, high: basePrice + 13, low: basePrice + 7, close: basePrice + 12, volume: 950 },
      { open: basePrice + 12, high: resistanceLevel, low: basePrice + 11, close: basePrice + 13, volume: 1000 },
      { open: basePrice + 13, high: basePrice + 14, low: basePrice + 8, close: basePrice + 9, volume: 900 },
      { open: basePrice + 9, high: basePrice + 11, low: supportLevel + 1, close: supportLevel + 2, volume: 850 },
      { open: supportLevel + 2, high: basePrice + 10, low: supportLevel + 1, close: basePrice + 9, volume: 800 },
      { open: basePrice + 9, high: basePrice + 14, low: basePrice + 8, close: basePrice + 13, volume: 900 },
      { open: basePrice + 13, high: basePrice + 19, low: basePrice + 12, close: basePrice + 17, volume: 1600 },
      { open: basePrice + 17, high: basePrice + 22, low: basePrice + 16, close: basePrice + 20, volume: 1800 },
      { open: basePrice + 20, high: basePrice + 25, low: basePrice + 19, close: basePrice + 23, volume: 1600 },
    ];

    const rectangleHeight = resistanceLevel - supportLevel;
    const primaryTarget = resistanceLevel + rectangleHeight;

    const annotations: PatternAnnotation[] = [
      {
        type: 'resistance',
        points: [{ x: 2, y: resistanceLevel }, { x: 18, y: resistanceLevel }],
        label: 'Rectangle Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 5, y: supportLevel }, { x: 16, y: supportLevel }],
        label: 'Rectangle Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 20, y: resistanceLevel }, { x: 20, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)} (+${rectangleHeight.toFixed(0)} pts)`,
        color: '#FFD700',
        style: 'dashed'
      },
      {
        type: 'peak',
        points: [{ x: 12, y: basePrice + 10 }],
        label: 'Consolidation Zone',
        color: '#DDA0DD',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 86% historical accuracy | Continuation | Enter on candle close above resistance with volume 1.5-2x average. Min 3 weeks duration, horizontal S&R. Avg move: 20-30% | Position size for 1-2% account risk",
      keyLevels: {
        breakout: resistanceLevel,
        target: primaryTarget,
        stopLoss: supportLevel - 1,
        entry: resistanceLevel + 0.5
      }
    };
  }

  // Rising Wedge - Based on Thomas N. Bulkowski (88% historical accuracy as reversal)
  static generateRisingWedge(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 8, high: basePrice - 5, low: basePrice - 10, close: basePrice - 6, volume: 1000 },
      { open: basePrice - 6, high: basePrice - 2, low: basePrice - 7, close: basePrice - 3, volume: 1200 },
      { open: basePrice - 3, high: basePrice + 2, low: basePrice - 4, close: basePrice, volume: 1400 },
      { open: basePrice, high: basePrice + 6, low: basePrice - 1, close: basePrice + 4, volume: 1600 },
      { open: basePrice + 4, high: basePrice + 10, low: basePrice + 3, close: basePrice + 8, volume: 1800 },
      { open: basePrice + 8, high: basePrice + 9, low: basePrice + 2, close: basePrice + 3, volume: 1500 },
      { open: basePrice + 3, high: basePrice + 5, low: basePrice + 1, close: basePrice + 2, volume: 1300 },
      { open: basePrice + 2, high: basePrice + 7, low: basePrice + 1, close: basePrice + 6, volume: 1400 },
      { open: basePrice + 6, high: basePrice + 12, low: basePrice + 5, close: basePrice + 10, volume: 1600 },
      { open: basePrice + 10, high: basePrice + 15, low: basePrice + 9, close: basePrice + 13, volume: 1500 },
      { open: basePrice + 13, high: basePrice + 14, low: basePrice + 6, close: basePrice + 7, volume: 1300 },
      { open: basePrice + 7, high: basePrice + 9, low: basePrice + 5, close: basePrice + 6, volume: 1200 },
      { open: basePrice + 6, high: basePrice + 10, low: basePrice + 5, close: basePrice + 9, volume: 1100 },
      { open: basePrice + 9, high: basePrice + 14, low: basePrice + 8, close: basePrice + 12, volume: 1300 },
      { open: basePrice + 12, high: basePrice + 17, low: basePrice + 11, close: basePrice + 15, volume: 1200 },
      { open: basePrice + 15, high: basePrice + 16, low: basePrice + 9, close: basePrice + 10, volume: 1100 },
      { open: basePrice + 10, high: basePrice + 12, low: basePrice + 8, close: basePrice + 9, volume: 1000 },
      { open: basePrice + 9, high: basePrice + 13, low: basePrice + 8, close: basePrice + 12, volume: 900 },
      { open: basePrice + 12, high: basePrice + 16, low: basePrice + 11, close: basePrice + 14, volume: 800 },
      { open: basePrice + 14, high: basePrice + 15, low: basePrice + 6, close: basePrice + 7, volume: 1800 },
      { open: basePrice + 7, high: basePrice + 9, low: basePrice, close: basePrice + 1, volume: 2200 },
      { open: basePrice + 1, high: basePrice + 3, low: basePrice - 6, close: basePrice - 4, volume: 2000 },
    ];

    const wedgeHeight = (basePrice + 17) - (basePrice + 2);
    const breakdownPoint = basePrice + 7;
    const primaryTarget = breakdownPoint - wedgeHeight;

    const annotations: PatternAnnotation[] = [
      {
        type: 'resistance',
        points: [{ x: 4, y: basePrice + 8 }, { x: 9, y: basePrice + 13 }, { x: 14, y: basePrice + 15 }, { x: 18, y: basePrice + 16 }],
        label: 'Rising Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 6, y: basePrice + 2 }, { x: 11, y: basePrice + 6 }, { x: 16, y: basePrice + 9 }],
        label: 'Rising Support (Steeper)',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 4, y: basePrice + 8 }],
        label: 'Peak 1 (High Vol)',
        color: '#90EE90',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 9, y: basePrice + 13 }],
        label: 'Peak 2 (Lower Vol)',
        color: '#FFA500',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 14, y: basePrice + 15 }],
        label: 'Peak 3 (Lowest Vol)',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 20, y: breakdownPoint }, { x: 20, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)} (-${wedgeHeight.toFixed(0)} pts)`,
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 88% historical accuracy | Bearish reversal | Enter on candle close below support with volume 1.5x average. Converging upward lines, declining volume at each peak. Failure rate: 12% | Risk 1-2% of account",
      keyLevels: {
        breakout: breakdownPoint,
        target: primaryTarget,
        stopLoss: basePrice + 17,
        entry: breakdownPoint - 0.5
      }
    };
  }

  // Falling Wedge - Based on Thomas N. Bulkowski (88% historical accuracy as reversal)
  static generateFallingWedge(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice + 10, high: basePrice + 12, low: basePrice + 6, close: basePrice + 7, volume: 1000 },
      { open: basePrice + 7, high: basePrice + 9, low: basePrice + 3, close: basePrice + 4, volume: 1200 },
      { open: basePrice + 4, high: basePrice + 6, low: basePrice - 2, close: basePrice - 1, volume: 1400 },
      { open: basePrice - 1, high: basePrice + 2, low: basePrice - 6, close: basePrice - 4, volume: 1600 },
      { open: basePrice - 4, high: basePrice - 2, low: basePrice - 10, close: basePrice - 8, volume: 1800 },
      { open: basePrice - 8, high: basePrice - 2, low: basePrice - 9, close: basePrice - 3, volume: 1500 },
      { open: basePrice - 3, high: basePrice + 1, low: basePrice - 5, close: basePrice, volume: 1300 },
      { open: basePrice, high: basePrice + 1, low: basePrice - 7, close: basePrice - 6, volume: 1400 },
      { open: basePrice - 6, high: basePrice - 4, low: basePrice - 12, close: basePrice - 9, volume: 1600 },
      { open: basePrice - 9, high: basePrice - 7, low: basePrice - 15, close: basePrice - 13, volume: 1500 },
      { open: basePrice - 13, high: basePrice - 6, low: basePrice - 14, close: basePrice - 7, volume: 1300 },
      { open: basePrice - 7, high: basePrice - 3, low: basePrice - 9, close: basePrice - 4, volume: 1200 },
      { open: basePrice - 4, high: basePrice - 2, low: basePrice - 10, close: basePrice - 9, volume: 1100 },
      { open: basePrice - 9, high: basePrice - 6, low: basePrice - 14, close: basePrice - 12, volume: 1300 },
      { open: basePrice - 12, high: basePrice - 10, low: basePrice - 17, close: basePrice - 15, volume: 1200 },
      { open: basePrice - 15, high: basePrice - 9, low: basePrice - 16, close: basePrice - 10, volume: 1100 },
      { open: basePrice - 10, high: basePrice - 6, low: basePrice - 12, close: basePrice - 7, volume: 1000 },
      { open: basePrice - 7, high: basePrice - 5, low: basePrice - 11, close: basePrice - 8, volume: 900 },
      { open: basePrice - 8, high: basePrice - 4, low: basePrice - 12, close: basePrice - 6, volume: 800 },
      { open: basePrice - 6, high: basePrice + 2, low: basePrice - 7, close: basePrice, volume: 1800 },
      { open: basePrice, high: basePrice + 8, low: basePrice - 1, close: basePrice + 6, volume: 2200 },
      { open: basePrice + 6, high: basePrice + 14, low: basePrice + 5, close: basePrice + 12, volume: 2000 },
    ];

    const wedgeHeight = (basePrice + 1) - (basePrice - 15);
    const breakoutPoint = basePrice - 4;
    const primaryTarget = breakoutPoint + wedgeHeight;

    const annotations: PatternAnnotation[] = [
      {
        type: 'resistance',
        points: [{ x: 6, y: basePrice }, { x: 11, y: basePrice - 4 }, { x: 16, y: basePrice - 7 }],
        label: 'Falling Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 4, y: basePrice - 8 }, { x: 9, y: basePrice - 13 }, { x: 14, y: basePrice - 15 }],
        label: 'Falling Support (Less Steep)',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 4, y: basePrice - 8 }],
        label: 'Trough 1',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 9, y: basePrice - 13 }],
        label: 'Trough 2 (Higher)',
        color: '#90EE90',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 14, y: basePrice - 15 }],
        label: 'Trough 3 (Highest)',
        color: '#FFD700',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 20, y: breakoutPoint }, { x: 20, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)} (+${wedgeHeight.toFixed(0)} pts)`,
        color: '#4ECDC4',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 88% historical accuracy | Bullish reversal | Enter on candle close above resistance with volume 2x average. Converging downward lines, volume breakout confirms strength. Average rise: 38% | Risk 1-2% of account",
      keyLevels: {
        breakout: breakoutPoint,
        target: primaryTarget,
        stopLoss: basePrice - 17,
        entry: breakoutPoint + 0.5
      }
    };
  }

  // Double Bottom - precise equal troughs
  static generateDoubleBottom(): PatternData {
    const basePrice = 100;
    const troughLevel = basePrice - 15;
    const peakLevel = basePrice + 5;
    
    const candles: CandlestickData[] = [
      { open: basePrice + 10, high: basePrice + 12, low: basePrice + 8, close: basePrice + 9, volume: 1000 },
      { open: basePrice + 9, high: basePrice + 10, low: basePrice + 4, close: basePrice + 5, volume: 1200 },
      { open: basePrice + 5, high: basePrice + 7, low: basePrice - 2, close: basePrice - 1, volume: 1400 },
      { open: basePrice - 1, high: basePrice + 2, low: troughLevel, close: troughLevel + 2, volume: 1800 },
      { open: troughLevel + 2, high: basePrice - 5, low: troughLevel - 1, close: troughLevel + 1, volume: 1600 },
      { open: troughLevel + 1, high: basePrice - 2, low: troughLevel, close: basePrice - 3, volume: 1400 },
      { open: basePrice - 3, high: basePrice + 2, low: basePrice - 4, close: basePrice, volume: 1300 },
      { open: basePrice, high: peakLevel, low: basePrice - 1, close: peakLevel - 1, volume: 1200 },
      { open: peakLevel - 1, high: peakLevel + 1, low: basePrice + 2, close: basePrice + 3, volume: 1000 },
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 1, close: basePrice, volume: 1100 },
      { open: basePrice, high: basePrice + 2, low: basePrice - 5, close: basePrice - 3, volume: 1300 },
      { open: basePrice - 3, high: basePrice - 1, low: troughLevel, close: troughLevel + 1, volume: 1500 },
      { open: troughLevel + 1, high: basePrice - 8, low: troughLevel - 0.5, close: troughLevel + 2, volume: 1300 },
      { open: troughLevel + 2, high: basePrice - 2, low: troughLevel + 1, close: basePrice - 4, volume: 1600 },
      { open: basePrice - 4, high: basePrice + 1, low: basePrice - 5, close: basePrice - 1, volume: 1500 },
      { open: basePrice - 1, high: peakLevel + 1, low: basePrice - 2, close: peakLevel, volume: 1700 },
      { open: peakLevel, high: basePrice + 10, low: peakLevel - 1, close: basePrice + 8, volume: 1900 },
      { open: basePrice + 8, high: basePrice + 15, low: basePrice + 6, close: basePrice + 12, volume: 2000 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'resistance',
        points: [{ x: 7, y: peakLevel }, { x: 15, y: peakLevel }],
        label: 'Resistance Level',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 3, y: troughLevel }, { x: 11, y: troughLevel }],
        label: 'Double Bottom Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 16, y: peakLevel }, { x: 16, y: peakLevel + (peakLevel - troughLevel) }],
        label: 'Target: ' + (peakLevel + (peakLevel - troughLevel)).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 78% historical accuracy | Bullish reversal | Enter on candle close above resistance with volume 1.5-2x average. Troughs within 3% from lowest low. Average rise: 45% | Position size for 1-2% account risk",
      keyLevels: {
        breakout: peakLevel,
        target: peakLevel + (peakLevel - troughLevel),
        stopLoss: troughLevel - 1
      }
    };
  }

  // Inverted Head and Shoulders - precise geometric formation
  static generateInvertedHeadAndShoulders(): PatternData {
    const basePrice = 100;
    const leftShoulderLow = basePrice - 15;
    const headLow = basePrice - 25;
    const rightShoulderLow = basePrice - 14;
    const necklineLevel = basePrice - 5;
    
    const candles: CandlestickData[] = [
      { open: basePrice, high: basePrice + 2, low: basePrice - 3, close: basePrice - 2, volume: 1000 },
      { open: basePrice - 2, high: basePrice - 1, low: basePrice - 5, close: basePrice - 4, volume: 1100 },
      { open: basePrice - 4, high: basePrice - 3, low: basePrice - 8, close: basePrice - 7, volume: 1300 },
      { open: basePrice - 7, high: basePrice - 6, low: leftShoulderLow, close: basePrice - 13, volume: 1600 },
      { open: basePrice - 13, high: basePrice - 11, low: leftShoulderLow - 1, close: basePrice - 12, volume: 1400 },
      { open: basePrice - 12, high: basePrice - 8, low: basePrice - 13, close: basePrice - 9, volume: 1200 },
      { open: basePrice - 9, high: necklineLevel, low: basePrice - 10, close: necklineLevel - 1, volume: 1000 },
      { open: necklineLevel - 1, high: necklineLevel + 1, low: basePrice - 8, close: necklineLevel - 2, volume: 900 },
      { open: necklineLevel - 2, high: necklineLevel - 1, low: basePrice - 12, close: basePrice - 10, volume: 1500 },
      { open: basePrice - 10, high: basePrice - 9, low: basePrice - 18, close: basePrice - 16, volume: 2000 },
      { open: basePrice - 16, high: basePrice - 15, low: headLow, close: basePrice - 23, volume: 2200 },
      { open: basePrice - 23, high: basePrice - 20, low: headLow - 1, close: basePrice - 21, volume: 1900 },
      { open: basePrice - 21, high: basePrice - 16, low: basePrice - 22, close: basePrice - 17, volume: 1600 },
      { open: basePrice - 17, high: basePrice - 12, low: basePrice - 19, close: basePrice - 13, volume: 1400 },
      { open: basePrice - 13, high: necklineLevel, low: basePrice - 15, close: necklineLevel - 2, volume: 1200 },
      { open: necklineLevel - 2, high: necklineLevel + 1, low: basePrice - 8, close: necklineLevel - 1, volume: 1000 },
      { open: necklineLevel - 1, high: necklineLevel, low: basePrice - 10, close: basePrice - 8, volume: 1100 },
      { open: basePrice - 8, high: basePrice - 7, low: basePrice - 14, close: basePrice - 12, volume: 1300 },
      { open: basePrice - 12, high: basePrice - 11, low: basePrice - 13, close: basePrice - 12.5, volume: 1150 },
      { open: basePrice - 12.5, high: basePrice - 11, low: rightShoulderLow, close: basePrice - 13, volume: 1200 },
      { open: basePrice - 11, high: basePrice - 6, low: basePrice - 12, close: basePrice - 7, volume: 1500 },
      { open: basePrice - 7, high: necklineLevel + 1, low: basePrice - 9, close: necklineLevel, volume: 1400 },
      { open: necklineLevel, high: basePrice + 2, low: necklineLevel - 2, close: basePrice + 1, volume: 1800 },
      { open: basePrice + 1, high: basePrice + 5, low: basePrice - 1, close: basePrice + 4, volume: 2000 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 3, y: leftShoulderLow }],
        label: 'Left Shoulder',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'peak', 
        points: [{ x: 10, y: headLow }],
        label: 'Head',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 19, y: rightShoulderLow }],
        label: 'Right Shoulder', 
        color: '#45B7D1',
        style: 'solid'
      },
      {
        type: 'neckline',
        points: [{ x: 6, y: necklineLevel }, { x: 15, y: necklineLevel }, { x: 21, y: necklineLevel }],
        label: 'Neckline',
        color: '#FFD700',
        style: 'dashed'
      },
      {
        type: 'target',
        points: [{ x: 22, y: necklineLevel }, { x: 22, y: necklineLevel + (necklineLevel - headLow) }],
        label: 'Target: ' + (necklineLevel + (necklineLevel - headLow)).toFixed(0),
        color: '#4ECDC4',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 85% historical accuracy | Bullish reversal | Enter on candle close above neckline with volume 2x average. Right shoulder higher than left, volume increases through formation. Average rise: 45% | Risk 1-2% of account",
      keyLevels: {
        breakout: necklineLevel,
        target: necklineLevel + (necklineLevel - headLow),
        stopLoss: rightShoulderLow - 1
      }
    };
  }

  // Descending Triangle - precise geometric formation
  static generateDescendingTriangle(): PatternData {
    const basePrice = 100;
    const supportLevel = basePrice - 10;
    
    const candles: CandlestickData[] = [
      { open: basePrice + 10, high: basePrice + 15, low: basePrice + 8, close: basePrice + 12, volume: 1000 },
      { open: basePrice + 12, high: basePrice + 14, low: basePrice + 5, close: basePrice + 7, volume: 1200 },
      { open: basePrice + 7, high: basePrice + 9, low: supportLevel, close: supportLevel + 2, volume: 1400 },
      { open: supportLevel + 2, high: basePrice - 5, low: supportLevel - 1, close: supportLevel + 1, volume: 1300 },
      { open: supportLevel + 1, high: basePrice + 8, low: supportLevel, close: basePrice + 6, volume: 1200 },
      { open: basePrice + 6, high: basePrice + 12, low: basePrice + 5, close: basePrice + 10, volume: 1100 },
      { open: basePrice + 10, high: basePrice + 11, low: basePrice + 4, close: basePrice + 5, volume: 1000 },
      { open: basePrice + 5, high: basePrice + 7, low: supportLevel + 1, close: supportLevel + 3, volume: 900 },
      { open: supportLevel + 3, high: basePrice - 6, low: supportLevel, close: supportLevel + 2, volume: 800 },
      { open: supportLevel + 2, high: basePrice + 4, low: supportLevel + 1, close: basePrice + 2, volume: 900 },
      { open: basePrice + 2, high: basePrice + 8, low: basePrice + 1, close: basePrice + 6, volume: 800 },
      { open: basePrice + 6, high: basePrice + 7, low: basePrice, close: basePrice + 1, volume: 700 },
      { open: basePrice + 1, high: basePrice + 3, low: supportLevel + 1, close: supportLevel + 2, volume: 600 },
      { open: supportLevel + 2, high: basePrice - 5, low: supportLevel, close: supportLevel + 1, volume: 500 },
      { open: supportLevel + 1, high: basePrice + 2, low: supportLevel, close: basePrice - 1, volume: 600 },
      { open: basePrice - 1, high: basePrice + 1, low: basePrice - 8, close: basePrice - 6, volume: 1500 },
      { open: basePrice - 6, high: basePrice - 4, low: basePrice - 12, close: basePrice - 10, volume: 1800 },
      { open: basePrice - 10, high: basePrice - 8, low: basePrice - 16, close: basePrice - 14, volume: 1600 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'support',
        points: [{ x: 2, y: supportLevel }, { x: 14, y: supportLevel }],
        label: 'Horizontal Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'trendline',
        points: [{ x: 5, y: basePrice + 10 }, { x: 10, y: basePrice + 6 }, { x: 14, y: basePrice - 1 }],
        label: 'Falling Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 15, y: supportLevel }, { x: 15, y: supportLevel - 10 }],
        label: 'Target: ' + (supportLevel - 10).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 83% historical accuracy | Bearish continuation | Enter on candle close below support with volume 1.5x average. Breakout typically at 2/3 pattern width. Horizontal support, descending resistance. Average decline: 20% | Risk 1-2% of account",
      keyLevels: {
        breakout: supportLevel,
        target: supportLevel - 10,
        stopLoss: basePrice + 2
      }
    };
  }

  // Symmetrical Triangle
  static generateSymmetricalTriangle(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice, high: basePrice + 10, low: basePrice - 2, close: basePrice + 8, volume: 1000 },
      { open: basePrice + 8, high: basePrice + 12, low: basePrice + 2, close: basePrice + 4, volume: 1100 },
      { open: basePrice + 4, high: basePrice + 6, low: basePrice - 8, close: basePrice - 6, volume: 1200 },
      { open: basePrice - 6, high: basePrice - 4, low: basePrice - 10, close: basePrice - 2, volume: 1000 },
      { open: basePrice - 2, high: basePrice + 6, low: basePrice - 3, close: basePrice + 4, volume: 900 },
      { open: basePrice + 4, high: basePrice + 5, low: basePrice - 4, close: basePrice - 2, volume: 800 },
      { open: basePrice - 2, high: basePrice + 3, low: basePrice - 3, close: basePrice + 1, volume: 700 },
      { open: basePrice + 1, high: basePrice + 2, low: basePrice - 2, close: basePrice - 1, volume: 600 },
      { open: basePrice - 1, high: basePrice + 1, low: basePrice - 1.5, close: basePrice, volume: 500 },
      { open: basePrice, high: basePrice + 8, low: basePrice - 1, close: basePrice + 6, volume: 1500 },
      { open: basePrice + 6, high: basePrice + 12, low: basePrice + 5, close: basePrice + 10, volume: 1800 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'trendline',
        points: [{ x: 0, y: basePrice + 10 }, { x: 4, y: basePrice + 4 }, { x: 8, y: basePrice + 1 }],
        label: 'Upper Trendline',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'trendline',
        points: [{ x: 2, y: basePrice - 8 }, { x: 5, y: basePrice - 2 }, { x: 8, y: basePrice - 1 }],
        label: 'Lower Trendline',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 9, y: basePrice }, { x: 9, y: basePrice + 18 }],
        label: 'Target: ' + (basePrice + 18).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 75% historical accuracy | Continuation/Reversal | Enter on candle close breakout with volume 1.5-2x average. Breakout at 2/3-3/4 pattern width. Converging trendlines show indecision. Average move: 15-25% | Position size for 1-2% account risk",
      keyLevels: {
        breakout: basePrice,
        target: basePrice + 18,
        stopLoss: basePrice - 2
      }
    };
  }

  // Bull Flag
  static generateBullFlag(): PatternData {
    const basePrice = 100;
    const flagTop = basePrice + 18;
    const flagBottom = basePrice + 12;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 15, high: basePrice - 12, low: basePrice - 16, close: basePrice - 13, volume: 1000 },
      { open: basePrice - 13, high: basePrice - 8, low: basePrice - 14, close: basePrice - 10, volume: 1200 },
      { open: basePrice - 10, high: basePrice - 3, low: basePrice - 11, close: basePrice - 5, volume: 1500 },
      { open: basePrice - 5, high: basePrice + 2, low: basePrice - 6, close: basePrice, volume: 1800 },
      { open: basePrice, high: basePrice + 8, low: basePrice - 1, close: basePrice + 6, volume: 2000 },
      { open: basePrice + 6, high: flagTop, low: basePrice + 5, close: basePrice + 16, volume: 2200 },
      { open: basePrice + 16, high: basePrice + 17, low: flagBottom, close: basePrice + 13, volume: 1000 },
      { open: basePrice + 13, high: basePrice + 16, low: basePrice + 11, close: basePrice + 14, volume: 900 },
      { open: basePrice + 14, high: basePrice + 15, low: basePrice + 10, close: basePrice + 11, volume: 800 },
      { open: basePrice + 11, high: basePrice + 14, low: basePrice + 9, close: basePrice + 12, volume: 700 },
      { open: basePrice + 12, high: basePrice + 13, low: basePrice + 8, close: basePrice + 10, volume: 650 },
      { open: basePrice + 10, high: basePrice + 19, low: basePrice + 9, close: basePrice + 17, volume: 1800 },
      { open: basePrice + 17, high: basePrice + 25, low: basePrice + 16, close: basePrice + 23, volume: 2000 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'trendline',
        points: [{ x: 6, y: flagTop }, { x: 10, y: basePrice + 13 }],
        label: 'Flag Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'trendline',
        points: [{ x: 6, y: flagBottom }, { x: 10, y: basePrice + 8 }],
        label: 'Flag Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 11, y: flagTop }, { x: 11, y: flagTop + 18 }],
        label: 'Target: ' + (flagTop + 18).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 82% historical accuracy | Bullish continuation | Enter on candle close above flag with volume 2x average. Flagpole height = minimum target. Brief consolidation after strong uptrend. Average rise: 35% | Risk 1-2% of account",
      keyLevels: {
        breakout: flagTop,
        target: flagTop + 18,
        stopLoss: flagBottom - 2
      }
    };
  }

  // Bear Flag  
  static generateBearFlag(): PatternData {
    const basePrice = 100;
    const flagTop = basePrice - 12;
    const flagBottom = basePrice - 18;
    
    const candles: CandlestickData[] = [
      { open: basePrice + 15, high: basePrice + 16, low: basePrice + 12, close: basePrice + 13, volume: 1000 },
      { open: basePrice + 13, high: basePrice + 14, low: basePrice + 8, close: basePrice + 10, volume: 1200 },
      { open: basePrice + 10, high: basePrice + 11, low: basePrice + 3, close: basePrice + 5, volume: 1500 },
      { open: basePrice + 5, high: basePrice + 6, low: basePrice - 2, close: basePrice, volume: 1800 },
      { open: basePrice, high: basePrice + 1, low: basePrice - 8, close: basePrice - 6, volume: 2000 },
      { open: basePrice - 6, high: basePrice - 5, low: flagBottom, close: basePrice - 16, volume: 2200 },
      { open: basePrice - 16, high: flagTop, low: basePrice - 17, close: basePrice - 13, volume: 1000 },
      { open: basePrice - 13, high: basePrice - 11, low: basePrice - 16, close: basePrice - 14, volume: 900 },
      { open: basePrice - 14, high: basePrice - 10, low: basePrice - 15, close: basePrice - 11, volume: 800 },
      { open: basePrice - 11, high: basePrice - 9, low: basePrice - 14, close: basePrice - 12, volume: 700 },
      { open: basePrice - 12, high: basePrice - 8, low: basePrice - 13, close: basePrice - 10, volume: 650 },
      { open: basePrice - 10, high: basePrice - 9, low: basePrice - 19, close: basePrice - 17, volume: 1800 },
      { open: basePrice - 17, high: basePrice - 16, low: basePrice - 25, close: basePrice - 23, volume: 2000 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'trendline',
        points: [{ x: 6, y: flagTop }, { x: 10, y: basePrice - 8 }],
        label: 'Flag Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'trendline',
        points: [{ x: 6, y: flagBottom }, { x: 10, y: basePrice - 13 }],
        label: 'Flag Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 11, y: flagBottom }, { x: 11, y: flagBottom - 18 }],
        label: 'Target: ' + (flagBottom - 18).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 82% historical accuracy | Bearish continuation | Enter on candle close below flag with volume 2x average. Flagpole height = minimum target. Brief consolidation after strong downtrend. Average decline: 25% | Risk 1-2% of account",
      keyLevels: {
        breakout: flagBottom,
        target: flagBottom - 18,
        stopLoss: flagTop + 2
      }
    };
  }

  // Pennant
  static generatePennant(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 10, high: basePrice - 8, low: basePrice - 12, close: basePrice - 9, volume: 1000 },
      { open: basePrice - 9, high: basePrice - 3, low: basePrice - 10, close: basePrice - 5, volume: 1500 },
      { open: basePrice - 5, high: basePrice + 2, low: basePrice - 6, close: basePrice, volume: 2000 },
      { open: basePrice, high: basePrice + 8, low: basePrice - 1, close: basePrice + 6, volume: 2200 },
      { open: basePrice + 6, high: basePrice + 12, low: basePrice + 5, close: basePrice + 10, volume: 2500 },
      { open: basePrice + 10, high: basePrice + 11, low: basePrice + 6, close: basePrice + 7, volume: 800 },
      { open: basePrice + 7, high: basePrice + 9, low: basePrice + 6.5, close: basePrice + 8, volume: 700 },
      { open: basePrice + 8, high: basePrice + 8.5, low: basePrice + 7, close: basePrice + 7.5, volume: 600 },
      { open: basePrice + 7.5, high: basePrice + 8, low: basePrice + 7.2, close: basePrice + 7.8, volume: 500 },
      { open: basePrice + 7.8, high: basePrice + 15, low: basePrice + 7.5, close: basePrice + 13, volume: 2000 },
      { open: basePrice + 13, high: basePrice + 20, low: basePrice + 12, close: basePrice + 18, volume: 2300 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'trendline',
        points: [{ x: 5, y: basePrice + 11 }, { x: 8, y: basePrice + 8 }],
        label: 'Pennant Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'trendline',
        points: [{ x: 5, y: basePrice + 6 }, { x: 8, y: basePrice + 7.2 }],
        label: 'Pennant Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 9, y: basePrice + 10 }, { x: 9, y: basePrice + 22 }],
        label: 'Target: ' + (basePrice + 22).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 84% historical accuracy | Continuation | Enter on candle close breakout with volume 1.5-2x average. Small symmetrical triangle after strong move. Target equals prior move (flagpole). Average move: 30% | Position size for 1-2% account risk",
      keyLevels: {
        breakout: basePrice + 10,
        target: basePrice + 22,
        stopLoss: basePrice + 6
      }
    };
  }

  // Cup with Handle
  static generateCupHandle(): PatternData {
    const basePrice = 100;
    const rimLevel = basePrice + 15;
    
    const candles: CandlestickData[] = [
      { open: basePrice + 15, high: rimLevel, low: basePrice + 13, close: basePrice + 14, volume: 1000 },
      { open: basePrice + 14, high: basePrice + 15, low: basePrice + 10, close: basePrice + 11, volume: 1100 },
      { open: basePrice + 11, high: basePrice + 12, low: basePrice + 6, close: basePrice + 7, volume: 1200 },
      { open: basePrice + 7, high: basePrice + 8, low: basePrice + 2, close: basePrice + 3, volume: 1300 },
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 2, close: basePrice - 1, volume: 1400 },
      { open: basePrice - 1, high: basePrice + 1, low: basePrice - 3, close: basePrice - 2, volume: 1200 },
      { open: basePrice - 2, high: basePrice - 1, low: basePrice - 4, close: basePrice - 2, volume: 1100 },
      { open: basePrice - 2, high: basePrice, low: basePrice - 3, close: basePrice - 1, volume: 1000 },
      { open: basePrice - 1, high: basePrice + 2, low: basePrice - 2, close: basePrice + 1, volume: 1100 },
      { open: basePrice + 1, high: basePrice + 5, low: basePrice, close: basePrice + 4, volume: 1200 },
      { open: basePrice + 4, high: basePrice + 8, low: basePrice + 3, close: basePrice + 7, volume: 1300 },
      { open: basePrice + 7, high: basePrice + 12, low: basePrice + 6, close: basePrice + 11, volume: 1400 },
      { open: basePrice + 11, high: rimLevel, low: basePrice + 10, close: basePrice + 14, volume: 1500 },
      { open: basePrice + 14, high: basePrice + 15, low: basePrice + 11, close: basePrice + 12, volume: 800 },
      { open: basePrice + 12, high: basePrice + 13, low: basePrice + 10, close: basePrice + 11, volume: 700 },
      { open: basePrice + 11, high: basePrice + 12, low: basePrice + 9, close: basePrice + 10, volume: 600 },
      { open: basePrice + 10, high: basePrice + 18, low: basePrice + 9, close: basePrice + 16, volume: 2000 },
      { open: basePrice + 16, high: basePrice + 22, low: basePrice + 15, close: basePrice + 20, volume: 2200 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'resistance',
        points: [{ x: 0, y: rimLevel }, { x: 12, y: rimLevel }],
        label: 'Cup Rim',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 5, y: basePrice - 4 }, { x: 7, y: basePrice - 4 }],
        label: 'Cup Bottom',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 17, y: rimLevel }, { x: 17, y: rimLevel + 15 }],
        label: 'Target: ' + (rimLevel + 15).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 80% historical accuracy | Bullish continuation | Enter on candle close above rim with volume 1.5x average. Rounded bottom (cup) followed by small downward handle. Min 7 weeks formation. Average rise: 45% | Risk 1-2% of account",
      keyLevels: {
        breakout: rimLevel,
        target: rimLevel + 15,
        stopLoss: basePrice + 8
      }
    };
  }

  // Island Reversal
  static generateIslandReversal(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 10, high: basePrice - 8, low: basePrice - 12, close: basePrice - 9, volume: 1000 },
      { open: basePrice - 9, high: basePrice - 5, low: basePrice - 10, close: basePrice - 6, volume: 1200 },
      { open: basePrice - 6, high: basePrice - 2, low: basePrice - 7, close: basePrice - 3, volume: 1400 },
      { open: basePrice - 3, high: basePrice + 2, low: basePrice - 4, close: basePrice, volume: 1600 },
      { open: basePrice + 5, high: basePrice + 10, low: basePrice + 4, close: basePrice + 8, volume: 2000 },
      { open: basePrice + 8, high: basePrice + 12, low: basePrice + 7, close: basePrice + 10, volume: 1800 },
      { open: basePrice + 10, high: basePrice + 13, low: basePrice + 9, close: basePrice + 11, volume: 1600 },
      { open: basePrice + 11, high: basePrice + 12, low: basePrice + 8, close: basePrice + 9, volume: 1400 },
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 1, close: basePrice + 1, volume: 2200 },
      { open: basePrice + 1, high: basePrice + 2, low: basePrice - 3, close: basePrice - 2, volume: 2000 },
      { open: basePrice - 2, high: basePrice - 1, low: basePrice - 6, close: basePrice - 5, volume: 1800 },
      { open: basePrice - 5, high: basePrice - 4, low: basePrice - 9, close: basePrice - 8, volume: 1600 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 5, y: basePrice + 13 }],
        label: 'Island Top',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 11, y: basePrice }, { x: 11, y: basePrice - 15 }],
        label: 'Target: ' + (basePrice - 15).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 72% historical accuracy | Reversal | Enter on gap fill with volume confirmation. Gap-isolated pattern (exhaustion gap + breakaway gap). Rare but reliable. Average move: 18-25% | Position size for 1-2% account risk",
      keyLevels: {
        breakout: basePrice,
        target: basePrice - 15,
        stopLoss: basePrice + 14
      }
    };
  }

  // Bump and Run Reversal
  static generateBumpRunReversal(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 20, high: basePrice - 18, low: basePrice - 22, close: basePrice - 19, volume: 1000 },
      { open: basePrice - 19, high: basePrice - 15, low: basePrice - 20, close: basePrice - 16, volume: 1100 },
      { open: basePrice - 16, high: basePrice - 12, low: basePrice - 17, close: basePrice - 13, volume: 1200 },
      { open: basePrice - 13, high: basePrice - 9, low: basePrice - 14, close: basePrice - 10, volume: 1300 },
      { open: basePrice - 10, high: basePrice - 6, low: basePrice - 11, close: basePrice - 7, volume: 1400 },
      { open: basePrice - 7, high: basePrice - 2, low: basePrice - 8, close: basePrice - 3, volume: 1800 },
      { open: basePrice - 3, high: basePrice + 3, low: basePrice - 4, close: basePrice + 1, volume: 2200 },
      { open: basePrice + 1, high: basePrice + 8, low: basePrice, close: basePrice + 6, volume: 2600 },
      { open: basePrice + 6, high: basePrice + 15, low: basePrice + 5, close: basePrice + 12, volume: 3000 },
      { open: basePrice + 12, high: basePrice + 18, low: basePrice + 11, close: basePrice + 16, volume: 2800 },
      { open: basePrice + 16, high: basePrice + 17, low: basePrice + 10, close: basePrice + 12, volume: 2200 },
      { open: basePrice + 12, high: basePrice + 14, low: basePrice + 5, close: basePrice + 7, volume: 2000 },
      { open: basePrice + 7, high: basePrice + 9, low: basePrice - 1, close: basePrice + 1, volume: 1800 },
      { open: basePrice + 1, high: basePrice + 3, low: basePrice - 6, close: basePrice - 4, volume: 1600 },
      { open: basePrice - 4, high: basePrice - 2, low: basePrice - 12, close: basePrice - 10, volume: 1400 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'trendline',
        points: [{ x: 0, y: basePrice - 20 }, { x: 5, y: basePrice - 7 }],
        label: 'Lead-in Trend',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'trendline',
        points: [{ x: 5, y: basePrice - 7 }, { x: 9, y: basePrice + 16 }],
        label: 'Bump (Acceleration)',
        color: '#FFD700',
        style: 'solid'
      },
      {
        type: 'trendline',
        points: [{ x: 9, y: basePrice + 16 }, { x: 14, y: basePrice - 10 }],
        label: 'Run (Reversal)',
        color: '#FF6B6B',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 70% historical accuracy | Advanced reversal | Three phases: lead-in (30-45° trend), bump (acceleration above trend), run (sharp reversal). Measure lead-in angle for confirmation. Average decline: 35% | Risk 1-2% of account",
      keyLevels: {
        breakout: basePrice + 5,
        target: basePrice - 15,
        stopLoss: basePrice + 19
      }
    };
  }

  // Hanging Man
  static generateHangingMan(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 15, high: basePrice - 12, low: basePrice - 16, close: basePrice - 13, volume: 1000 },
      { open: basePrice - 13, high: basePrice - 9, low: basePrice - 14, close: basePrice - 10, volume: 1200 },
      { open: basePrice - 10, high: basePrice - 6, low: basePrice - 11, close: basePrice - 7, volume: 1400 },
      { open: basePrice - 7, high: basePrice - 3, low: basePrice - 8, close: basePrice - 4, volume: 1600 },
      { open: basePrice - 4, high: basePrice - 3, low: basePrice - 12, close: basePrice - 4.5, volume: 2000 },
      { open: basePrice - 4.5, high: basePrice - 2, low: basePrice - 8, close: basePrice - 7, volume: 1800 },
      { open: basePrice - 7, high: basePrice - 6, low: basePrice - 12, close: basePrice - 11, volume: 1600 },
      { open: basePrice - 11, high: basePrice - 10, low: basePrice - 16, close: basePrice - 15, volume: 1400 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'resistance',
        points: [{ x: 4, y: basePrice - 3 }, { x: 7, y: basePrice - 3 }],
        label: 'Hanging Man Resistance',
        color: '#FF6B6B',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 68% historical accuracy | Bearish reversal | Enter on next candle confirmation below low. Long lower shadow (2-3x body) at uptrend top. Small body at upper range. Average decline: 12% | Position size for 1-2% account risk",
      keyLevels: {
        entry: basePrice - 5,
        stopLoss: basePrice - 2,
        target: basePrice - 18
      }
    };
  }

  // Doji
  static generateDoji(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 5, high: basePrice - 3, low: basePrice - 7, close: basePrice - 4, volume: 1000 },
      { open: basePrice - 4, high: basePrice - 1, low: basePrice - 5, close: basePrice - 2, volume: 1200 },
      { open: basePrice - 2, high: basePrice + 1, low: basePrice - 3, close: basePrice, volume: 1400 },
      { open: basePrice, high: basePrice + 4, low: basePrice - 4, close: basePrice, volume: 1600 },
      { open: basePrice, high: basePrice + 2, low: basePrice - 2, close: basePrice + 1, volume: 1200 },
      { open: basePrice + 1, high: basePrice + 3, low: basePrice - 1, close: basePrice - 0.5, volume: 1100 },
      { open: basePrice - 0.5, high: basePrice + 1, low: basePrice - 3, close: basePrice - 2, volume: 1300 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 3, y: basePrice }],
        label: 'Doji - Indecision',
        color: '#FFD700',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 65% historical accuracy | Indecision/Reversal | Enter on next candle breakout. Equal or nearly equal open/close prices. Long shadows both ways show uncertainty. Effectiveness decreases on lower timeframes | Risk 1-2% of account",
      keyLevels: {
        entry: basePrice + 2,
        stopLoss: basePrice - 5,
        target: basePrice + 8
      }
    };
  }

  // Bullish Harami
  static generateBullishHarami(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice + 10, high: basePrice + 12, low: basePrice + 7, close: basePrice + 8, volume: 1000 },
      { open: basePrice + 8, high: basePrice + 9, low: basePrice + 4, close: basePrice + 5, volume: 1200 },
      { open: basePrice + 5, high: basePrice + 6, low: basePrice + 1, close: basePrice + 2, volume: 1400 },
      { open: basePrice + 2, high: basePrice + 3, low: basePrice - 6, close: basePrice - 5, volume: 1800 },
      { open: basePrice - 3, high: basePrice - 2, low: basePrice - 4, close: basePrice - 2.5, volume: 800 },
      { open: basePrice - 2.5, high: basePrice + 1, low: basePrice - 3, close: basePrice, volume: 1600 },
      { open: basePrice, high: basePrice + 4, low: basePrice - 1, close: basePrice + 3, volume: 1400 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 4, y: basePrice - 2.5 }],
        label: 'Bullish Harami',
        color: '#4ECDC4',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 66% historical accuracy | Bullish reversal | Enter on next candle above high. Small candle inside previous large bearish candle shows selling exhaustion. Requires confirmation. Average rise: 12% | Position size for 1-2% account risk",
      keyLevels: {
        entry: basePrice - 1,
        stopLoss: basePrice - 7,
        target: basePrice + 8
      }
    };
  }

  // Bearish Harami
  static generateBearishHarami(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 10, high: basePrice - 7, low: basePrice - 12, close: basePrice - 8, volume: 1000 },
      { open: basePrice - 8, high: basePrice - 4, low: basePrice - 9, close: basePrice - 5, volume: 1200 },
      { open: basePrice - 5, high: basePrice - 1, low: basePrice - 6, close: basePrice - 2, volume: 1400 },
      { open: basePrice - 2, high: basePrice + 6, low: basePrice - 3, close: basePrice + 5, volume: 1800 },
      { open: basePrice + 3, high: basePrice + 4, low: basePrice + 2, close: basePrice + 2.5, volume: 800 },
      { open: basePrice + 2.5, high: basePrice + 3, low: basePrice - 1, close: basePrice, volume: 1600 },
      { open: basePrice, high: basePrice + 1, low: basePrice - 4, close: basePrice - 3, volume: 1400 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 4, y: basePrice + 2.5 }],
        label: 'Bearish Harami',
        color: '#FF6B6B',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 66% historical accuracy | Bearish reversal | Enter on next candle below low. Small candle inside previous large bullish candle shows buying exhaustion. Requires confirmation. Average decline: 12% | Position size for 1-2% account risk",
      keyLevels: {
        entry: basePrice + 1,
        stopLoss: basePrice + 7,
        target: basePrice - 8
      }
    };
  }

  // Bullish Engulfing
  static generateBullishEngulfing(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice + 8, high: basePrice + 10, low: basePrice + 5, close: basePrice + 6, volume: 1000 },
      { open: basePrice + 6, high: basePrice + 7, low: basePrice + 2, close: basePrice + 3, volume: 1200 },
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 1, close: basePrice, volume: 1400 },
      { open: basePrice, high: basePrice + 1, low: basePrice - 2, close: basePrice - 1.5, volume: 1200 },
      { open: basePrice - 3, high: basePrice + 4, low: basePrice - 4, close: basePrice + 3.5, volume: 2000 },
      { open: basePrice + 3.5, high: basePrice + 7, low: basePrice + 2, close: basePrice + 6, volume: 1800 },
      { open: basePrice + 6, high: basePrice + 10, low: basePrice + 5, close: basePrice + 9, volume: 1600 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 4, y: basePrice + 3.5 }],
        label: 'Bullish Engulfing',
        color: '#4ECDC4',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 75% historical accuracy | Bullish reversal | Enter on candle close or next candle open. Large green candle completely engulfs previous red candle body. Strong reversal signal. Average rise: 18% | Risk 1-2% of account",
      keyLevels: {
        entry: basePrice + 2,
        stopLoss: basePrice - 5,
        target: basePrice + 12
      }
    };
  }

  // Bearish Engulfing
  static generateBearishEngulfing(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 8, high: basePrice - 5, low: basePrice - 10, close: basePrice - 6, volume: 1000 },
      { open: basePrice - 6, high: basePrice - 2, low: basePrice - 7, close: basePrice - 3, volume: 1200 },
      { open: basePrice - 3, high: basePrice + 1, low: basePrice - 4, close: basePrice, volume: 1400 },
      { open: basePrice, high: basePrice + 2, low: basePrice - 1, close: basePrice + 1.5, volume: 1200 },
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 4, close: basePrice - 3.5, volume: 2000 },
      { open: basePrice - 3.5, high: basePrice - 2, low: basePrice - 7, close: basePrice - 6, volume: 1800 },
      { open: basePrice - 6, high: basePrice - 5, low: basePrice - 10, close: basePrice - 9, volume: 1600 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 4, y: basePrice - 3.5 }],
        label: 'Bearish Engulfing',
        color: '#FF6B6B',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Large bearish candle completely engulfing previous bullish candle. Strong reversal signal.",
      keyLevels: {
        entry: basePrice - 2,
        stopLoss: basePrice + 5,
        target: basePrice - 12
      }
    };
  }

  // Spinning Top
  static generateSpinningTop(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 3, high: basePrice - 1, low: basePrice - 5, close: basePrice - 2, volume: 1000 },
      { open: basePrice - 2, high: basePrice + 1, low: basePrice - 3, close: basePrice, volume: 1200 },
      { open: basePrice, high: basePrice + 2, low: basePrice - 1, close: basePrice + 1, volume: 1400 },
      { open: basePrice + 1, high: basePrice + 5, low: basePrice - 3, close: basePrice + 0.5, volume: 1600 },
      { open: basePrice + 0.5, high: basePrice + 2, low: basePrice - 2, close: basePrice - 1, volume: 1200 },
      { open: basePrice - 1, high: basePrice + 1, low: basePrice - 3, close: basePrice + 0.5, volume: 1100 },
      { open: basePrice + 0.5, high: basePrice + 2, low: basePrice - 2, close: basePrice - 1.5, volume: 1300 },
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 3, y: basePrice + 0.5 }],
        label: 'Spinning Top - Indecision',
        color: '#FFD700',
        style: 'solid'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 62% historical accuracy | Indecision/Reversal | Enter on next candle breakout. Small body with long shadows (2x+ body length) indicates battle between bulls/bears. Effectiveness decreases on lower timeframes | Position size for 1-2% account risk",
      keyLevels: {
        entry: basePrice + 2,
        stopLoss: basePrice - 4,
        target: basePrice + 6
      }
    };
  }

  // Hammer - Based on Thomas N. Bulkowski (70% historical accuracy as reversal)
  static generateHammer(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice + 18, high: basePrice + 20, low: basePrice + 15, close: basePrice + 16, volume: 1000 },
      { open: basePrice + 16, high: basePrice + 17, low: basePrice + 12, close: basePrice + 13, volume: 1200 },
      { open: basePrice + 13, high: basePrice + 15, low: basePrice + 8, close: basePrice + 9, volume: 1400 },
      { open: basePrice + 9, high: basePrice + 11, low: basePrice + 5, close: basePrice + 6, volume: 1600 },
      { open: basePrice + 6, high: basePrice + 8, low: basePrice + 1, close: basePrice + 2, volume: 1800 },
      { open: basePrice + 2, high: basePrice + 3, low: basePrice - 10, close: basePrice + 2.5, volume: 2200 },
      { open: basePrice + 2.5, high: basePrice + 7, low: basePrice + 1, close: basePrice + 6, volume: 2000 },
      { open: basePrice + 6, high: basePrice + 12, low: basePrice + 5, close: basePrice + 10, volume: 1800 },
      { open: basePrice + 10, high: basePrice + 16, low: basePrice + 9, close: basePrice + 14, volume: 1600 },
    ];

    const hammerLow = basePrice - 10;
    const priorResistance = basePrice + 9;
    const primaryTarget = basePrice + 2.5 + (priorResistance - (basePrice + 2.5));

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 5, y: basePrice + 2.5 }],
        label: 'Hammer (2:1 Shadow Ratio)',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 5, y: hammerLow }, { x: 8, y: hammerLow }],
        label: 'Support (Rejection Level)',
        color: '#4ECDC4',
        style: 'dashed'
      },
      {
        type: 'target',
        points: [{ x: 8, y: basePrice + 2.5 }, { x: 8, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)}`,
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 70% historical accuracy | Bullish reversal | Enter on next candle close above hammer high. Downtrend context required, lower shadow 2-3x body, confirmation candle essential. Average rise: 15% | Risk 1-2% of account",
      keyLevels: {
        entry: basePrice + 3.5,
        stopLoss: hammerLow - 0.5,
        target: primaryTarget,
        breakout: basePrice + 3
      }
    };
  }

  // Shooting Star - Based on Thomas N. Bulkowski (72% historical accuracy as reversal)
  static generateShootingStar(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      { open: basePrice - 18, high: basePrice - 15, low: basePrice - 20, close: basePrice - 16, volume: 1000 },
      { open: basePrice - 16, high: basePrice - 12, low: basePrice - 17, close: basePrice - 13, volume: 1200 },
      { open: basePrice - 13, high: basePrice - 8, low: basePrice - 15, close: basePrice - 9, volume: 1400 },
      { open: basePrice - 9, high: basePrice - 5, low: basePrice - 11, close: basePrice - 6, volume: 1600 },
      { open: basePrice - 6, high: basePrice - 1, low: basePrice - 8, close: basePrice - 2, volume: 1800 },
      { open: basePrice - 2, high: basePrice + 10, low: basePrice - 3, close: basePrice - 2.5, volume: 2200 },
      { open: basePrice - 2.5, high: basePrice, low: basePrice - 7, close: basePrice - 6, volume: 2000 },
      { open: basePrice - 6, high: basePrice - 3, low: basePrice - 12, close: basePrice - 10, volume: 1800 },
      { open: basePrice - 10, high: basePrice - 6, low: basePrice - 16, close: basePrice - 14, volume: 1600 },
    ];

    const shootingStarHigh = basePrice + 10;
    const priorSupport = basePrice - 9;
    const primaryTarget = basePrice - 2.5 - ((basePrice - 2.5) - priorSupport);

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 5, y: basePrice - 2.5 }],
        label: 'Shooting Star (2:1 Shadow Ratio)',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'resistance',
        points: [{ x: 5, y: shootingStarHigh }, { x: 8, y: shootingStarHigh }],
        label: 'Resistance (Rejection Level)',
        color: '#FF6B6B',
        style: 'dashed'
      },
      {
        type: 'target',
        points: [{ x: 8, y: basePrice - 2.5 }, { x: 8, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)}`,
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 72% historical accuracy | Bearish reversal | Enter on next candle close below shooting star low. Uptrend context required, upper shadow 2-3x body, confirmation candle essential. Average decline: 12% | Risk 1-2% of account",
      keyLevels: {
        entry: basePrice - 3.5,
        stopLoss: shootingStarHigh + 0.5,
        target: primaryTarget,
        breakout: basePrice - 3
      }
    };
  }

  // Triple Top - Based on Thomas N. Bulkowski (80% historical accuracy as reversal)
  // Requirements: Three equal peaks, declining volume, support break confirmation
  static generateTripleTop(): PatternData {
    const basePrice = 100;
    const peakLevel = basePrice + 22;
    const valleyLevel = basePrice + 10;
    
    const candles: CandlestickData[] = [
      // Prior uptrend
      { open: basePrice - 5, high: basePrice, low: basePrice - 8, close: basePrice - 2, volume: 1000 },
      { open: basePrice - 2, high: basePrice + 5, low: basePrice - 3, close: basePrice + 3, volume: 1200 },
      
      // First peak formation
      { open: basePrice + 3, high: basePrice + 10, low: basePrice + 2, close: basePrice + 8, volume: 1600 },
      { open: basePrice + 8, high: basePrice + 15, low: basePrice + 7, close: basePrice + 13, volume: 1900 },
      { open: basePrice + 13, high: peakLevel, low: basePrice + 12, close: basePrice + 20, volume: 2200 }, // First peak
      { open: basePrice + 20, high: peakLevel + 1, low: basePrice + 18, close: basePrice + 19, volume: 2000 },
      
      // First decline to valley
      { open: basePrice + 19, high: basePrice + 20, low: basePrice + 15, close: basePrice + 16, volume: 1700 },
      { open: basePrice + 16, high: basePrice + 18, low: valleyLevel, close: valleyLevel + 2, volume: 1500 },
      { open: valleyLevel + 2, high: basePrice + 13, low: valleyLevel - 1, close: valleyLevel + 1, volume: 1300 },
      
      // Second peak formation
      { open: valleyLevel + 1, high: basePrice + 14, low: valleyLevel, close: basePrice + 12, volume: 1400 },
      { open: basePrice + 12, high: basePrice + 18, low: basePrice + 11, close: basePrice + 16, volume: 1800 },
      { open: basePrice + 16, high: peakLevel, low: basePrice + 15, close: basePrice + 20, volume: 2000 }, // Second peak
      { open: basePrice + 20, high: peakLevel + 0.5, low: basePrice + 18, close: basePrice + 19, volume: 1900 },
      
      // Second decline to valley
      { open: basePrice + 19, high: basePrice + 20, low: basePrice + 14, close: basePrice + 15, volume: 1600 },
      { open: basePrice + 15, high: basePrice + 17, low: valleyLevel, close: valleyLevel + 3, volume: 1400 },
      { open: valleyLevel + 3, high: basePrice + 12, low: valleyLevel - 1, close: valleyLevel + 2, volume: 1200 },
      
      // Third peak formation (lower volume - bearish divergence)
      { open: valleyLevel + 2, high: basePrice + 13, low: valleyLevel + 1, close: basePrice + 11, volume: 1300 },
      { open: basePrice + 11, high: basePrice + 17, low: basePrice + 10, close: basePrice + 15, volume: 1600 },
      { open: basePrice + 15, high: peakLevel, low: basePrice + 14, close: basePrice + 20, volume: 1700 }, // Third peak (lowest volume)
      { open: basePrice + 20, high: peakLevel + 0.2, low: basePrice + 18, close: basePrice + 19, volume: 1500 },
      
      // Final breakdown
      { open: basePrice + 19, high: basePrice + 20, low: basePrice + 13, close: basePrice + 14, volume: 1800 },
      { open: basePrice + 14, high: basePrice + 16, low: valleyLevel - 1, close: valleyLevel, volume: 2000 },
      { open: valleyLevel, high: valleyLevel + 2, low: basePrice + 2, close: basePrice + 3, volume: 2400 }, // Support break
      { open: basePrice + 3, high: basePrice + 5, low: basePrice - 2, close: basePrice - 1, volume: 2600 },
    ];

    const patternHeight = peakLevel - valleyLevel;
    const primaryTarget = valleyLevel - patternHeight;

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 4, y: peakLevel }],
        label: 'Peak 1 (High Vol)',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 11, y: peakLevel }],
        label: 'Peak 2 (Med Vol)',
        color: '#FFA500',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 18, y: peakLevel }],
        label: 'Peak 3 (Low Vol)',
        color: '#FFD700',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 7, y: valleyLevel }, { x: 15, y: valleyLevel }],
        label: 'Support Level',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'resistance',
        points: [{ x: 4, y: peakLevel }, { x: 18, y: peakLevel }],
        label: 'Triple Top Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 22, y: valleyLevel }, { x: 22, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)}`,
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 80% historical accuracy | Bearish reversal | Enter on candle close below support with volume 1.5-2x average. 3 equal peaks within 2%, declining volume at peak 3. More reliable than double top. Average decline: 16% | Position size for 1-2% account risk",
      keyLevels: {
        breakout: valleyLevel,
        target: primaryTarget,
        stopLoss: peakLevel + 1,
        entry: valleyLevel - 0.5
      }
    };
  }

  // Triple Bottom - Based on Thomas N. Bulkowski (80% historical accuracy as reversal)
  // Requirements: Three equal troughs, volume expansion on breakout
  static generateTripleBottom(): PatternData {
    const basePrice = 100;
    const troughLevel = basePrice - 22;
    const peakLevel = basePrice - 10;
    
    const candles: CandlestickData[] = [
      // Prior downtrend
      { open: basePrice + 5, high: basePrice + 8, low: basePrice + 2, close: basePrice + 3, volume: 1000 },
      { open: basePrice + 3, high: basePrice + 5, low: basePrice - 3, close: basePrice - 1, volume: 1200 },
      
      // First trough formation
      { open: basePrice - 1, high: basePrice + 2, low: basePrice - 8, close: basePrice - 6, volume: 1600 },
      { open: basePrice - 6, high: basePrice - 3, low: basePrice - 15, close: basePrice - 12, volume: 1900 },
      { open: basePrice - 12, high: basePrice - 10, low: troughLevel, close: basePrice - 20, volume: 2200 }, // First trough
      { open: basePrice - 20, high: basePrice - 18, low: troughLevel - 1, close: basePrice - 19, volume: 2000 },
      
      // First rally to peak
      { open: basePrice - 19, high: basePrice - 15, low: basePrice - 20, close: basePrice - 16, volume: 1700 },
      { open: basePrice - 16, high: peakLevel, low: basePrice - 18, close: peakLevel - 2, volume: 1500 },
      { open: peakLevel - 2, high: peakLevel + 1, low: basePrice - 13, close: peakLevel - 1, volume: 1300 },
      
      // Second trough formation
      { open: peakLevel - 1, high: peakLevel, low: basePrice - 14, close: basePrice - 12, volume: 1400 },
      { open: basePrice - 12, high: basePrice - 11, low: basePrice - 18, close: basePrice - 16, volume: 1800 },
      { open: basePrice - 16, high: basePrice - 15, low: troughLevel, close: basePrice - 20, volume: 2000 }, // Second trough
      { open: basePrice - 20, high: basePrice - 18, low: troughLevel - 0.5, close: basePrice - 19, volume: 1900 },
      
      // Second rally to peak
      { open: basePrice - 19, high: basePrice - 14, low: basePrice - 20, close: basePrice - 15, volume: 1600 },
      { open: basePrice - 15, high: peakLevel, low: basePrice - 17, close: peakLevel - 3, volume: 1400 },
      { open: peakLevel - 3, high: peakLevel + 1, low: basePrice - 12, close: peakLevel - 2, volume: 1200 },
      
      // Third trough formation (lower volume - bullish divergence)
      { open: peakLevel - 2, high: peakLevel - 1, low: basePrice - 13, close: basePrice - 11, volume: 1300 },
      { open: basePrice - 11, high: basePrice - 10, low: basePrice - 17, close: basePrice - 15, volume: 1600 },
      { open: basePrice - 15, high: basePrice - 14, low: troughLevel, close: basePrice - 20, volume: 1700 }, // Third trough (lowest volume)
      { open: basePrice - 20, high: basePrice - 18, low: troughLevel - 0.2, close: basePrice - 19, volume: 1500 },
      
      // Final breakout
      { open: basePrice - 19, high: basePrice - 13, low: basePrice - 20, close: basePrice - 14, volume: 1800 },
      { open: basePrice - 14, high: peakLevel + 1, low: basePrice - 16, close: peakLevel, volume: 2000 },
      { open: peakLevel, high: basePrice - 2, low: peakLevel - 2, close: basePrice - 3, volume: 2400 }, // Resistance break
      { open: basePrice - 3, high: basePrice + 2, low: basePrice - 5, close: basePrice + 1, volume: 2600 },
    ];

    const patternHeight = peakLevel - troughLevel;
    const primaryTarget = peakLevel + patternHeight;

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 4, y: troughLevel }],
        label: 'Trough 1 (High Vol)',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 11, y: troughLevel }],
        label: 'Trough 2 (Med Vol)',
        color: '#90EE90',
        style: 'solid'
      },
      {
        type: 'peak',
        points: [{ x: 18, y: troughLevel }],
        label: 'Trough 3 (Low Vol)',
        color: '#FFD700',
        style: 'solid'
      },
      {
        type: 'resistance',
        points: [{ x: 7, y: peakLevel }, { x: 15, y: peakLevel }],
        label: 'Resistance Level',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 4, y: troughLevel }, { x: 18, y: troughLevel }],
        label: 'Triple Bottom Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 22, y: peakLevel }, { x: 22, y: primaryTarget }],
        label: `Target: ${primaryTarget.toFixed(0)}`,
        color: '#4ECDC4',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Thomas Bulkowski: 80% historical accuracy | Bullish reversal | Enter on candle close above resistance with volume 2x average. 3 equal troughs within 2%, volume expansion on breakout. More reliable than double bottom. Average rise: 18% | Position size for 1-2% account risk",
      keyLevels: {
        breakout: peakLevel,
        target: primaryTarget,
        stopLoss: troughLevel - 1,
        entry: peakLevel + 0.5
      }
    };
  }

  static getPatternData(patternKey: string): PatternData {
    switch (patternKey) {
      case 'head-shoulders':
        return this.generateHeadAndShoulders();
      case 'inverted-head-shoulders':
      case 'inverse-head-shoulders':
        return this.generateInvertedHeadAndShoulders();
      case 'double-top':
        return this.generateDoubleTop();
      case 'double-bottom':
        return this.generateDoubleBottom();
      case 'ascending-triangle':
        return this.generateAscendingTriangle();
      case 'descending-triangle':
        return this.generateDescendingTriangle();
      case 'symmetrical-triangle':
        return this.generateSymmetricalTriangle();
      case 'bull-flag':
        return this.generateBullFlag();
      case 'bear-flag':
        return this.generateBearFlag();
      case 'pennant':
        return this.generatePennant();
      case 'cup-handle':
        return this.generateCupHandle();
      case 'rectangle':
        return this.generateRectangle();
      case 'rising-wedge':
        return this.generateRisingWedge();
      case 'falling-wedge':
        return this.generateFallingWedge();
      case 'triple-top':
        return this.generateTripleTop();
      case 'triple-bottom':
        return this.generateTripleBottom();
      case 'bump-run-reversal':
        return this.generateBumpRunReversal();
      case 'island-reversal':
        return this.generateIslandReversal();
      case 'hammer':
        return this.generateHammer();
      case 'hanging-man':
        return this.generateHangingMan();
      case 'shooting-star':
        return this.generateShootingStar();
      case 'doji':
        return this.generateDoji();
      case 'bullish-harami':
        return this.generateBullishHarami();
      case 'bearish-harami':
        return this.generateBearishHarami();
      case 'bullish-engulfing':
        return this.generateBullishEngulfing();
      case 'bearish-engulfing':
        return this.generateBearishEngulfing();
      case 'spinning-top':
        return this.generateSpinningTop();
      default:
        return this.generateHeadAndShoulders();
    }
  }
}
