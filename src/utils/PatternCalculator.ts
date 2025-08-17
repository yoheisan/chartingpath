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
  
  // Head and Shoulders - precise geometric formation
  static generateHeadAndShoulders(): PatternData {
    const basePrice = 100;
    const leftShoulderHigh = basePrice + 15;
    const headHigh = basePrice + 25;
    const rightShoulderHigh = basePrice + 14;
    const necklineLevel = basePrice + 5;
    
    const candles: CandlestickData[] = [
      // Setup phase
      { open: basePrice, high: basePrice + 3, low: basePrice - 2, close: basePrice + 2, volume: 1000 },
      { open: basePrice + 2, high: basePrice + 5, low: basePrice + 1, close: basePrice + 4, volume: 1100 },
      
      // Left shoulder formation
      { open: basePrice + 4, high: basePrice + 8, low: basePrice + 3, close: basePrice + 7, volume: 1300 },
      { open: basePrice + 7, high: leftShoulderHigh, low: basePrice + 6, close: basePrice + 13, volume: 1600 },
      { open: basePrice + 13, high: leftShoulderHigh + 1, low: basePrice + 11, close: basePrice + 12, volume: 1400 },
      
      // Decline to neckline
      { open: basePrice + 12, high: basePrice + 13, low: basePrice + 8, close: basePrice + 9, volume: 1200 },
      { open: basePrice + 9, high: basePrice + 10, low: necklineLevel, close: necklineLevel + 1, volume: 1000 },
      { open: necklineLevel + 1, high: basePrice + 8, low: necklineLevel - 1, close: necklineLevel + 2, volume: 900 },
      
      // Head formation - highest volume
      { open: necklineLevel + 2, high: basePrice + 12, low: necklineLevel + 1, close: basePrice + 10, volume: 1500 },
      { open: basePrice + 10, high: basePrice + 18, low: basePrice + 9, close: basePrice + 16, volume: 2000 },
      { open: basePrice + 16, high: headHigh, low: basePrice + 15, close: basePrice + 23, volume: 2200 }, // Head peak
      { open: basePrice + 23, high: headHigh + 1, low: basePrice + 20, close: basePrice + 21, volume: 1900 },
      
      // Decline from head to neckline
      { open: basePrice + 21, high: basePrice + 22, low: basePrice + 16, close: basePrice + 17, volume: 1600 },
      { open: basePrice + 17, high: basePrice + 19, low: basePrice + 12, close: basePrice + 13, volume: 1400 },
      { open: basePrice + 13, high: basePrice + 15, low: necklineLevel, close: necklineLevel + 2, volume: 1200 },
      { open: necklineLevel + 2, high: basePrice + 8, low: necklineLevel - 1, close: necklineLevel + 1, volume: 1000 },
      
      // Right shoulder - lower volume
      { open: necklineLevel + 1, high: basePrice + 10, low: necklineLevel, close: basePrice + 8, volume: 1100 },
      { open: basePrice + 8, high: basePrice + 14, low: basePrice + 7, close: basePrice + 12, volume: 1300 },
      { open: basePrice + 12, high: basePrice + 13, low: basePrice + 11, close: basePrice + 12.5, volume: 1150 }, 
      { open: basePrice + 12.5, high: rightShoulderHigh, low: basePrice + 11, close: basePrice + 13, volume: 1200 }, // Right shoulder peak
      
      // Final decline and neckline break
      { open: basePrice + 11, high: basePrice + 12, low: basePrice + 6, close: basePrice + 7, volume: 1500 },
      { open: basePrice + 7, high: basePrice + 9, low: necklineLevel - 1, close: necklineLevel, volume: 1400 },
      { open: necklineLevel, high: necklineLevel + 2, low: basePrice - 2, close: basePrice - 1, volume: 1800 }, // Neckline break
      { open: basePrice - 1, high: basePrice + 1, low: basePrice - 5, close: basePrice - 4, volume: 2000 },
    ];

    const annotations: PatternAnnotation[] = [
      // Left Shoulder marker
      {
        type: 'peak',
        points: [{ x: 3, y: leftShoulderHigh }],
        label: 'Left Shoulder',
        color: '#FF6B6B',
        style: 'solid'
      },
      // Head marker
      {
        type: 'peak', 
        points: [{ x: 10, y: headHigh }],
        label: 'Head',
        color: '#4ECDC4',
        style: 'solid'
      },
      // Right Shoulder marker
      {
        type: 'peak',
        points: [{ x: 18, y: rightShoulderHigh }],
        label: 'Right Shoulder', 
        color: '#45B7D1',
        style: 'solid'
      },
      // Neckline
      {
        type: 'neckline',
        points: [{ x: 6, y: necklineLevel }, { x: 15, y: necklineLevel }, { x: 21, y: necklineLevel }],
        label: 'Neckline',
        color: '#FFD700',
        style: 'dashed'
      },
      // Target projection - correct H&S methodology  
      {
        type: 'target',
        points: [{ x: 22, y: necklineLevel }, { x: 22, y: necklineLevel - (headHigh - necklineLevel) }],
        label: 'Target: ' + (necklineLevel - (headHigh - necklineLevel)).toFixed(0),
        color: '#FF6B6B',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Classic bearish reversal with three peaks - left shoulder, head (highest), right shoulder. Neckline break confirms pattern.",
      keyLevels: {
        breakout: necklineLevel,
        target: necklineLevel - (headHigh - necklineLevel),
        stopLoss: rightShoulderHigh + 1
      }
    };
  }

  // Double Top - precise equal peaks with comprehensive target methodologies
  static generateDoubleTop(): PatternData {
    const basePrice = 100;
    const peakLevel = basePrice + 20;
    const valleyLevel = basePrice + 8;
    
    // Calculate comprehensive targets using new methodology
    const targetAnalysis = DoubleTopTargetMethodologies.calculateTargets(
      peakLevel, 
      valleyLevel, 
      peakLevel + 1
    );
    
    const candles: CandlestickData[] = [
      // Uptrend leading to first peak
      { open: basePrice, high: basePrice + 3, low: basePrice - 1, close: basePrice + 2, volume: 1000 },
      { open: basePrice + 2, high: basePrice + 6, low: basePrice + 1, close: basePrice + 5, volume: 1200 },
      { open: basePrice + 5, high: basePrice + 10, low: basePrice + 4, close: basePrice + 8, volume: 1400 },
      { open: basePrice + 8, high: basePrice + 15, low: basePrice + 7, close: basePrice + 13, volume: 1600 },
      { open: basePrice + 13, high: peakLevel, low: basePrice + 12, close: basePrice + 18, volume: 1800 }, // First peak
      { open: basePrice + 18, high: peakLevel + 1, low: basePrice + 16, close: basePrice + 17, volume: 1600 },
      
      // Decline to valley
      { open: basePrice + 17, high: basePrice + 18, low: basePrice + 13, close: basePrice + 14, volume: 1400 },
      { open: basePrice + 14, high: basePrice + 16, low: basePrice + 11, close: basePrice + 12, volume: 1300 },
      { open: basePrice + 12, high: basePrice + 14, low: valleyLevel, close: valleyLevel + 1, volume: 1200 },
      { open: valleyLevel + 1, high: basePrice + 11, low: valleyLevel - 1, close: valleyLevel + 2, volume: 1000 },
      
      // Recovery to second peak - lower volume (divergence)
      { open: valleyLevel + 2, high: basePrice + 12, low: valleyLevel + 1, close: basePrice + 10, volume: 1100 },
      { open: basePrice + 10, high: basePrice + 15, low: basePrice + 9, close: basePrice + 14, volume: 1300 },
      { open: basePrice + 14, high: basePrice + 18, low: basePrice + 13, close: basePrice + 17, volume: 1400 },
      { open: basePrice + 17, high: peakLevel, low: basePrice + 16, close: basePrice + 19, volume: 1500 }, // Second peak - lower volume
      { open: basePrice + 19, high: peakLevel + 0.5, low: basePrice + 17, close: basePrice + 18, volume: 1300 },
      
      // Final decline and support break
      { open: basePrice + 18, high: basePrice + 19, low: basePrice + 14, close: basePrice + 15, volume: 1600 },
      { open: basePrice + 15, high: basePrice + 17, low: basePrice + 11, close: basePrice + 12, volume: 1500 },
      { open: basePrice + 12, high: basePrice + 14, low: valleyLevel - 1, close: valleyLevel, volume: 1700 },
      { open: valleyLevel, high: valleyLevel + 2, low: basePrice + 3, close: basePrice + 4, volume: 1900 }, // Support break
      { open: basePrice + 4, high: basePrice + 6, low: basePrice, close: basePrice + 1, volume: 2000 },
    ];

    const annotations: PatternAnnotation[] = [
      // First Peak marker
      {
        type: 'peak',
        points: [{ x: 4, y: peakLevel }],
        label: 'First Peak',
        color: '#FF6B6B',
        style: 'solid'
      },
      // Second Peak marker  
      {
        type: 'peak',
        points: [{ x: 13, y: peakLevel }],
        label: 'Second Peak',
        color: '#FF6B6B', 
        style: 'solid'
      },
      // Support level (valley)
      {
        type: 'support',
        points: [{ x: 8, y: valleyLevel }, { x: 17, y: valleyLevel }],
        label: 'Support Level',
        color: '#4ECDC4',
        style: 'solid'
      },
      // Resistance level (peaks)
      {
        type: 'resistance',
        points: [{ x: 4, y: peakLevel }, { x: 13, y: peakLevel }],
        label: 'Double Top Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      // Primary Target (Classic Measured Move)
      {
        type: 'target',
        points: [{ x: 18, y: valleyLevel }, { x: 18, y: targetAnalysis.primaryTarget }],
        label: `Primary Target: ${targetAnalysis.primaryTarget.toFixed(0)}`,
        color: '#FFD700',
        style: 'solid'
      },
      // Conservative Fibonacci Target (61.8%)
      {
        type: 'target',
        points: [{ x: 19, y: valleyLevel }, { x: 19, y: targetAnalysis.alternativeTargets[0].price }],
        label: `Fib 61.8%: ${targetAnalysis.alternativeTargets[0].price.toFixed(0)}`,
        color: '#90EE90',
        style: 'dashed'
      },
      // Aggressive Fibonacci Target (161.8%)
      {
        type: 'target',
        points: [{ x: 20, y: valleyLevel }, { x: 20, y: targetAnalysis.alternativeTargets[2].price }],
        label: `Fib 161.8%: ${targetAnalysis.alternativeTargets[2].price.toFixed(0)}`,
        color: '#FFA500',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: `Bearish reversal with comprehensive target methodologies. Primary: ${targetAnalysis.primaryTarget.toFixed(0)} | Risk/Reward: ${targetAnalysis.riskRewardRatio.toFixed(1)}:1 | Multiple Fibonacci & statistical targets available.`,
      keyLevels: {
        breakout: valleyLevel,
        target: targetAnalysis.primaryTarget,
        stopLoss: peakLevel + 1
      }
    };
  }

  // Ascending Triangle - precise geometric formation
  static generateAscendingTriangle(): PatternData {
    const basePrice = 100;
    const resistanceLevel = basePrice + 15;
    
    const candles: CandlestickData[] = [
      // Initial swing high establishing resistance
      { open: basePrice, high: basePrice + 5, low: basePrice - 2, close: basePrice + 3, volume: 1000 },
      { open: basePrice + 3, high: basePrice + 10, low: basePrice + 2, close: basePrice + 8, volume: 1200 },
      { open: basePrice + 8, high: resistanceLevel, low: basePrice + 7, close: basePrice + 13, volume: 1400 }, // First resistance test
      { open: basePrice + 13, high: resistanceLevel + 1, low: basePrice + 11, close: basePrice + 12, volume: 1300 },
      
      // First pullback
      { open: basePrice + 12, high: basePrice + 14, low: basePrice + 6, close: basePrice + 7, volume: 1100 },
      { open: basePrice + 7, high: basePrice + 9, low: basePrice + 4, close: basePrice + 5, volume: 1000 },
      
      // Second test of resistance - higher low
      { open: basePrice + 5, high: basePrice + 8, low: basePrice + 4, close: basePrice + 7, volume: 900 },
      { open: basePrice + 7, high: basePrice + 12, low: basePrice + 6, close: basePrice + 10, volume: 1100 },
      { open: basePrice + 10, high: resistanceLevel, low: basePrice + 9, close: basePrice + 14, volume: 1200 }, // Second resistance test
      { open: basePrice + 14, high: resistanceLevel + 0.5, low: basePrice + 12, close: basePrice + 13, volume: 1000 },
      
      // Second pullback - higher low
      { open: basePrice + 13, high: basePrice + 14, low: basePrice + 8, close: basePrice + 9, volume: 900 },
      { open: basePrice + 9, high: basePrice + 11, low: basePrice + 7, close: basePrice + 8, volume: 800 },
      
      // Third test - higher low, decreasing volume
      { open: basePrice + 8, high: basePrice + 10, low: basePrice + 7, close: basePrice + 9, volume: 700 },
      { open: basePrice + 9, high: basePrice + 13, low: basePrice + 8, close: basePrice + 12, volume: 800 },
      { open: basePrice + 12, high: resistanceLevel, low: basePrice + 11, close: basePrice + 14, volume: 900 }, // Third resistance test
      
      // Breakout with volume spike
      { open: basePrice + 14, high: basePrice + 18, low: basePrice + 13, close: basePrice + 17, volume: 1500 }, // Breakout
      { open: basePrice + 17, high: basePrice + 22, low: basePrice + 16, close: basePrice + 20, volume: 1800 },
      { open: basePrice + 20, high: basePrice + 25, low: basePrice + 19, close: basePrice + 23, volume: 1600 },
    ];

    const annotations: PatternAnnotation[] = [
      // Resistance line
      {
        type: 'resistance',
        points: [{ x: 2, y: resistanceLevel }, { x: 14, y: resistanceLevel }],
        label: 'Horizontal Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      // Ascending support line
      {
        type: 'trendline',
        points: [{ x: 5, y: basePrice + 4 }, { x: 11, y: basePrice + 7 }, { x: 13, y: basePrice + 8 }],
        label: 'Rising Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      // Target projection
      {
        type: 'target',
        points: [{ x: 15, y: resistanceLevel }, { x: 15, y: resistanceLevel + 15 }],
        label: 'Target: ' + (resistanceLevel + 15).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Bullish continuation pattern with horizontal resistance and ascending support. Breakout confirms upward momentum.",
      keyLevels: {
        breakout: resistanceLevel,
        target: resistanceLevel + 15,
        stopLoss: basePrice + 7
      }
    };
  }

  // Hammer candlestick - precise formation
  static generateHammer(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      // Downtrend context
      { open: basePrice + 15, high: basePrice + 17, low: basePrice + 12, close: basePrice + 13, volume: 1000 },
      { open: basePrice + 13, high: basePrice + 14, low: basePrice + 9, close: basePrice + 10, volume: 1200 },
      { open: basePrice + 10, high: basePrice + 12, low: basePrice + 6, close: basePrice + 7, volume: 1400 },
      { open: basePrice + 7, high: basePrice + 8, low: basePrice + 3, close: basePrice + 4, volume: 1600 },
      
      // Hammer formation - long lower shadow, small body at top
      { open: basePrice + 4, high: basePrice + 5, low: basePrice - 8, close: basePrice + 3.5, volume: 2000 }, // Perfect Hammer
      
      // Confirmation candles
      { open: basePrice + 3.5, high: basePrice + 8, low: basePrice + 2, close: basePrice + 7, volume: 1800 },
      { open: basePrice + 7, high: basePrice + 12, low: basePrice + 6, close: basePrice + 11, volume: 1600 },
      { open: basePrice + 11, high: basePrice + 16, low: basePrice + 10, close: basePrice + 15, volume: 1400 },
    ];

    const annotations: PatternAnnotation[] = [
      // Support level where hammer formed
      {
        type: 'support',
        points: [{ x: 4, y: basePrice - 8 }, { x: 7, y: basePrice - 8 }],
        label: 'Hammer Support',
        color: '#4ECDC4',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Bullish reversal candlestick with long lower shadow and small body. Shows rejection of lower prices.",
      keyLevels: {
        entry: basePrice + 5,
        stopLoss: basePrice - 9,
        target: basePrice + 15
      }
    };
  }

  // Double Bottom - precise equal troughs
  static generateDoubleBottom(): PatternData {
    const basePrice = 100;
    const troughLevel = basePrice - 15;
    const peakLevel = basePrice + 5;
    
    const candles: CandlestickData[] = [
      // Downtrend leading to first trough
      { open: basePrice + 10, high: basePrice + 12, low: basePrice + 8, close: basePrice + 9, volume: 1000 },
      { open: basePrice + 9, high: basePrice + 10, low: basePrice + 4, close: basePrice + 5, volume: 1200 },
      { open: basePrice + 5, high: basePrice + 7, low: basePrice - 2, close: basePrice - 1, volume: 1400 },
      { open: basePrice - 1, high: basePrice + 2, low: troughLevel, close: troughLevel + 2, volume: 1800 }, // First trough
      { open: troughLevel + 2, high: basePrice - 5, low: troughLevel - 1, close: troughLevel + 1, volume: 1600 },
      
      // Recovery to peak
      { open: troughLevel + 1, high: basePrice - 2, low: troughLevel, close: basePrice - 3, volume: 1400 },
      { open: basePrice - 3, high: basePrice + 2, low: basePrice - 4, close: basePrice, volume: 1300 },
      { open: basePrice, high: peakLevel, low: basePrice - 1, close: peakLevel - 1, volume: 1200 },
      { open: peakLevel - 1, high: peakLevel + 1, low: basePrice + 2, close: basePrice + 3, volume: 1000 },
      
      // Decline to second trough - lower volume (divergence)
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 1, close: basePrice, volume: 1100 },
      { open: basePrice, high: basePrice + 2, low: basePrice - 5, close: basePrice - 3, volume: 1300 },
      { open: basePrice - 3, high: basePrice - 1, low: troughLevel, close: troughLevel + 1, volume: 1500 }, // Second trough - lower volume
      { open: troughLevel + 1, high: basePrice - 8, low: troughLevel - 0.5, close: troughLevel + 2, volume: 1300 },
      
      // Final recovery and resistance break
      { open: troughLevel + 2, high: basePrice - 2, low: troughLevel + 1, close: basePrice - 4, volume: 1600 },
      { open: basePrice - 4, high: basePrice + 1, low: basePrice - 5, close: basePrice - 1, volume: 1500 },
      { open: basePrice - 1, high: peakLevel + 1, low: basePrice - 2, close: peakLevel, volume: 1700 },
      { open: peakLevel, high: basePrice + 10, low: peakLevel - 1, close: basePrice + 8, volume: 1900 }, // Resistance break
      { open: basePrice + 8, high: basePrice + 15, low: basePrice + 6, close: basePrice + 12, volume: 2000 },
    ];

    const annotations: PatternAnnotation[] = [
      // Resistance level (peak)
      {
        type: 'resistance',
        points: [{ x: 7, y: peakLevel }, { x: 15, y: peakLevel }],
        label: 'Resistance Level',
        color: '#FF6B6B',
        style: 'solid'
      },
      // Support level (troughs)
      {
        type: 'support',
        points: [{ x: 3, y: troughLevel }, { x: 11, y: troughLevel }],
        label: 'Double Bottom Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      // Target
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
      description: "Bullish reversal with two equal troughs. Volume expansion on breakout confirms strength.",
      keyLevels: {
        breakout: peakLevel,
        target: peakLevel + (peakLevel - troughLevel),
        stopLoss: troughLevel - 1
      }
    };
  }

  // Shooting Star candlestick - precise formation
  static generateShootingStar(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      // Uptrend context
      { open: basePrice - 10, high: basePrice - 8, low: basePrice - 12, close: basePrice - 9, volume: 1000 },
      { open: basePrice - 9, high: basePrice - 6, low: basePrice - 10, close: basePrice - 7, volume: 1200 },
      { open: basePrice - 7, high: basePrice - 3, low: basePrice - 8, close: basePrice - 4, volume: 1400 },
      { open: basePrice - 4, high: basePrice, low: basePrice - 5, close: basePrice - 1, volume: 1600 },
      
      // Shooting Star formation - long upper shadow, small body at bottom
      { open: basePrice - 1, high: basePrice + 12, low: basePrice - 2, close: basePrice - 1.5, volume: 2000 }, // Perfect Shooting Star
      
      // Confirmation candles
      { open: basePrice - 1.5, high: basePrice, low: basePrice - 6, close: basePrice - 5, volume: 1800 },
      { open: basePrice - 5, high: basePrice - 3, low: basePrice - 9, close: basePrice - 8, volume: 1600 },
      { open: basePrice - 8, high: basePrice - 6, low: basePrice - 12, close: basePrice - 11, volume: 1400 },
    ];

    const annotations: PatternAnnotation[] = [
      // Resistance level where shooting star formed
      {
        type: 'resistance',
        points: [{ x: 4, y: basePrice + 12 }, { x: 7, y: basePrice + 12 }],
        label: 'Shooting Star Resistance',
        color: '#FF6B6B',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Bearish reversal candlestick with long upper shadow and small body. Shows rejection of higher prices.",
      keyLevels: {
        entry: basePrice - 2,
        stopLoss: basePrice + 13,
        target: basePrice - 15
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
      // Setup phase
      { open: basePrice, high: basePrice + 2, low: basePrice - 3, close: basePrice - 2, volume: 1000 },
      { open: basePrice - 2, high: basePrice - 1, low: basePrice - 5, close: basePrice - 4, volume: 1100 },
      
      // Left shoulder formation
      { open: basePrice - 4, high: basePrice - 3, low: basePrice - 8, close: basePrice - 7, volume: 1300 },
      { open: basePrice - 7, high: basePrice - 6, low: leftShoulderLow, close: basePrice - 13, volume: 1600 },
      { open: basePrice - 13, high: basePrice - 11, low: leftShoulderLow - 1, close: basePrice - 12, volume: 1400 },
      
      // Rise to neckline
      { open: basePrice - 12, high: basePrice - 8, low: basePrice - 13, close: basePrice - 9, volume: 1200 },
      { open: basePrice - 9, high: necklineLevel, low: basePrice - 10, close: necklineLevel - 1, volume: 1000 },
      { open: necklineLevel - 1, high: necklineLevel + 1, low: basePrice - 8, close: necklineLevel - 2, volume: 900 },
      
      // Head formation - highest volume
      { open: necklineLevel - 2, high: necklineLevel - 1, low: basePrice - 12, close: basePrice - 10, volume: 1500 },
      { open: basePrice - 10, high: basePrice - 9, low: basePrice - 18, close: basePrice - 16, volume: 2000 },
      { open: basePrice - 16, high: basePrice - 15, low: headLow, close: basePrice - 23, volume: 2200 }, // Head bottom
      { open: basePrice - 23, high: basePrice - 20, low: headLow - 1, close: basePrice - 21, volume: 1900 },
      
      // Rise from head to neckline
      { open: basePrice - 21, high: basePrice - 16, low: basePrice - 22, close: basePrice - 17, volume: 1600 },
      { open: basePrice - 17, high: basePrice - 12, low: basePrice - 19, close: basePrice - 13, volume: 1400 },
      { open: basePrice - 13, high: necklineLevel, low: basePrice - 15, close: necklineLevel - 2, volume: 1200 },
      { open: necklineLevel - 2, high: necklineLevel + 1, low: basePrice - 8, close: necklineLevel - 1, volume: 1000 },
      
      // Right shoulder - lower volume
      { open: necklineLevel - 1, high: necklineLevel, low: basePrice - 10, close: basePrice - 8, volume: 1100 },
      { open: basePrice - 8, high: basePrice - 7, low: basePrice - 14, close: basePrice - 12, volume: 1300 },
      { open: basePrice - 12, high: basePrice - 11, low: basePrice - 13, close: basePrice - 12.5, volume: 1150 }, 
      { open: basePrice - 12.5, high: basePrice - 11, low: rightShoulderLow, close: basePrice - 13, volume: 1200 }, // Right shoulder bottom
      
      // Final rise and neckline break
      { open: basePrice - 11, high: basePrice - 6, low: basePrice - 12, close: basePrice - 7, volume: 1500 },
      { open: basePrice - 7, high: necklineLevel + 1, low: basePrice - 9, close: necklineLevel, volume: 1400 },
      { open: necklineLevel, high: basePrice + 2, low: necklineLevel - 2, close: basePrice + 1, volume: 1800 }, // Neckline break
      { open: basePrice + 1, high: basePrice + 5, low: basePrice - 1, close: basePrice + 4, volume: 2000 },
    ];

    const annotations: PatternAnnotation[] = [
      // Left Shoulder marker
      {
        type: 'peak',
        points: [{ x: 3, y: leftShoulderLow }],
        label: 'Left Shoulder',
        color: '#FF6B6B',
        style: 'solid'
      },
      // Head marker
      {
        type: 'peak', 
        points: [{ x: 10, y: headLow }],
        label: 'Head',
        color: '#4ECDC4',
        style: 'solid'
      },
      // Right Shoulder marker
      {
        type: 'peak',
        points: [{ x: 19, y: rightShoulderLow }],
        label: 'Right Shoulder', 
        color: '#45B7D1',
        style: 'solid'
      },
      // Neckline
      {
        type: 'neckline',
        points: [{ x: 6, y: necklineLevel }, { x: 15, y: necklineLevel }, { x: 21, y: necklineLevel }],
        label: 'Neckline',
        color: '#FFD700',
        style: 'dashed'
      },
      // Target projection - correct methodology
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
      description: "Classic bullish reversal with three troughs - left shoulder, head (lowest), right shoulder. Neckline break confirms pattern.",
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
      // Initial swing low establishing support
      { open: basePrice + 10, high: basePrice + 15, low: basePrice + 8, close: basePrice + 12, volume: 1000 },
      { open: basePrice + 12, high: basePrice + 14, low: basePrice + 5, close: basePrice + 7, volume: 1200 },
      { open: basePrice + 7, high: basePrice + 9, low: supportLevel, close: supportLevel + 2, volume: 1400 }, // First support test
      { open: supportLevel + 2, high: basePrice - 5, low: supportLevel - 1, close: supportLevel + 1, volume: 1300 },
      
      // First rally - creates high point
      { open: supportLevel + 1, high: basePrice + 8, low: supportLevel, close: basePrice + 6, volume: 1200 },
      { open: basePrice + 6, high: basePrice + 12, low: basePrice + 5, close: basePrice + 10, volume: 1100 },
      
      // Second test of support - lower high
      { open: basePrice + 10, high: basePrice + 11, low: basePrice + 4, close: basePrice + 5, volume: 1000 },
      { open: basePrice + 5, high: basePrice + 7, low: supportLevel + 1, close: supportLevel + 3, volume: 900 }, // Second support test
      { open: supportLevel + 3, high: basePrice - 6, low: supportLevel, close: supportLevel + 2, volume: 800 },
      
      // Second rally - lower high
      { open: supportLevel + 2, high: basePrice + 4, low: supportLevel + 1, close: basePrice + 2, volume: 900 },
      { open: basePrice + 2, high: basePrice + 8, low: basePrice + 1, close: basePrice + 6, volume: 800 },
      
      // Third test - lower high, decreasing volume
      { open: basePrice + 6, high: basePrice + 7, low: basePrice, close: basePrice + 1, volume: 700 },
      { open: basePrice + 1, high: basePrice + 3, low: supportLevel + 1, close: supportLevel + 2, volume: 600 }, // Third support test
      { open: supportLevel + 2, high: basePrice - 5, low: supportLevel, close: supportLevel + 1, volume: 500 },
      
      // Fourth rally - even lower high
      { open: supportLevel + 1, high: basePrice + 2, low: supportLevel, close: basePrice - 1, volume: 600 },
      
      // Breakdown with volume spike
      { open: basePrice - 1, high: basePrice + 1, low: basePrice - 8, close: basePrice - 6, volume: 1500 }, // Breakdown
      { open: basePrice - 6, high: basePrice - 4, low: basePrice - 12, close: basePrice - 10, volume: 1800 },
      { open: basePrice - 10, high: basePrice - 8, low: basePrice - 16, close: basePrice - 14, volume: 1600 },
    ];

    const annotations: PatternAnnotation[] = [
      // Support line
      {
        type: 'support',
        points: [{ x: 2, y: supportLevel }, { x: 14, y: supportLevel }],
        label: 'Horizontal Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      // Descending resistance line
      {
        type: 'trendline',
        points: [{ x: 5, y: basePrice + 10 }, { x: 10, y: basePrice + 6 }, { x: 14, y: basePrice - 1 }],
        label: 'Falling Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      // Target projection
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
      description: "Bearish continuation pattern with horizontal support and descending resistance. Breakdown confirms downward momentum.",
      keyLevels: {
        breakout: supportLevel,
        target: supportLevel - 10,
        stopLoss: basePrice + 2
      }
    };
  }

  // Triple Top - three equal peaks
  static generateTripleTop(): PatternData {
    const basePrice = 100;
    const peakLevel = basePrice + 20;
    const valleyLevel = basePrice + 8;
    
    const candles: CandlestickData[] = [
      // First peak
      { open: basePrice, high: basePrice + 5, low: basePrice - 2, close: basePrice + 3, volume: 1000 },
      { open: basePrice + 3, high: basePrice + 10, low: basePrice + 2, close: basePrice + 8, volume: 1200 },
      { open: basePrice + 8, high: peakLevel, low: basePrice + 7, close: basePrice + 18, volume: 1600 }, // First peak
      
      // Decline to valley
      { open: basePrice + 18, high: basePrice + 19, low: basePrice + 12, close: basePrice + 13, volume: 1400 },
      { open: basePrice + 13, high: basePrice + 15, low: valleyLevel, close: valleyLevel + 1, volume: 1200 },
      
      // Second peak
      { open: valleyLevel + 1, high: basePrice + 12, low: valleyLevel, close: basePrice + 10, volume: 1300 },
      { open: basePrice + 10, high: peakLevel, low: basePrice + 9, close: basePrice + 19, volume: 1500 }, // Second peak
      
      // Decline to valley
      { open: basePrice + 19, high: basePrice + 20, low: basePrice + 13, close: basePrice + 14, volume: 1300 },
      { open: basePrice + 14, high: basePrice + 16, low: valleyLevel, close: valleyLevel + 2, volume: 1100 },
      
      // Third peak - lower volume
      { open: valleyLevel + 2, high: basePrice + 11, low: valleyLevel + 1, close: basePrice + 9, volume: 1200 },
      { open: basePrice + 9, high: peakLevel, low: basePrice + 8, close: basePrice + 18, volume: 1300 }, // Third peak - declining volume
      
      // Final breakdown
      { open: basePrice + 18, high: basePrice + 19, low: basePrice + 10, close: basePrice + 12, volume: 1600 },
      { open: basePrice + 12, high: basePrice + 14, low: valleyLevel - 1, close: valleyLevel, volume: 1800 },
      { open: valleyLevel, high: valleyLevel + 2, low: basePrice - 2, close: basePrice - 1, volume: 2000 }, // Support break
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 2, y: peakLevel }, { x: 6, y: peakLevel }, { x: 10, y: peakLevel }],
        label: 'Triple Top',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'support',
        points: [{ x: 4, y: valleyLevel }, { x: 8, y: valleyLevel }],
        label: 'Support',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 13, y: valleyLevel }, { x: 13, y: valleyLevel - (peakLevel - valleyLevel) }],
        label: 'Target: ' + (valleyLevel - (peakLevel - valleyLevel)).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Strong bearish reversal with three equal peaks. More reliable than double top.",
      keyLevels: {
        breakout: valleyLevel,
        target: valleyLevel - (peakLevel - valleyLevel),
        stopLoss: peakLevel + 1
      }
    };
  }

  // Triple Bottom - three equal troughs
  static generateTripleBottom(): PatternData {
    const basePrice = 100;
    const troughLevel = basePrice - 20;
    const peakLevel = basePrice - 8;
    
    const candles: CandlestickData[] = [
      // First trough
      { open: basePrice, high: basePrice + 2, low: basePrice - 5, close: basePrice - 3, volume: 1000 },
      { open: basePrice - 3, high: basePrice - 2, low: basePrice - 10, close: basePrice - 8, volume: 1200 },
      { open: basePrice - 8, high: basePrice - 7, low: troughLevel, close: troughLevel + 2, volume: 1600 }, // First trough
      
      // Rise to peak
      { open: troughLevel + 2, high: basePrice - 12, low: troughLevel + 1, close: basePrice - 13, volume: 1400 },
      { open: basePrice - 13, high: peakLevel, low: basePrice - 15, close: peakLevel - 1, volume: 1200 },
      
      // Second trough
      { open: peakLevel - 1, high: peakLevel, low: basePrice - 12, close: basePrice - 10, volume: 1300 },
      { open: basePrice - 10, high: basePrice - 9, low: troughLevel, close: troughLevel + 1, volume: 1500 }, // Second trough
      
      // Rise to peak
      { open: troughLevel + 1, high: basePrice - 13, low: troughLevel, close: basePrice - 14, volume: 1300 },
      { open: basePrice - 14, high: peakLevel, low: basePrice - 16, close: peakLevel - 2, volume: 1100 },
      
      // Third trough - lower volume
      { open: peakLevel - 2, high: peakLevel - 1, low: basePrice - 11, close: basePrice - 9, volume: 1200 },
      { open: basePrice - 9, high: basePrice - 8, low: troughLevel, close: troughLevel + 2, volume: 1300 }, // Third trough - declining volume
      
      // Final breakout
      { open: troughLevel + 2, high: basePrice - 10, low: troughLevel + 1, close: basePrice - 12, volume: 1600 },
      { open: basePrice - 12, high: peakLevel + 1, low: basePrice - 14, close: peakLevel, volume: 1800 },
      { open: peakLevel, high: basePrice + 2, low: peakLevel - 2, close: basePrice + 1, volume: 2000 }, // Resistance break
    ];

    const annotations: PatternAnnotation[] = [
      {
        type: 'peak',
        points: [{ x: 2, y: troughLevel }, { x: 6, y: troughLevel }, { x: 10, y: troughLevel }],
        label: 'Triple Bottom',
        color: '#4ECDC4',
        style: 'solid'
      },
      {
        type: 'resistance',
        points: [{ x: 4, y: peakLevel }, { x: 8, y: peakLevel }],
        label: 'Resistance',
        color: '#FF6B6B',
        style: 'solid'
      },
      {
        type: 'target',
        points: [{ x: 13, y: peakLevel }, { x: 13, y: peakLevel + (peakLevel - troughLevel) }],
        label: 'Target: ' + (peakLevel + (peakLevel - troughLevel)).toFixed(0),
        color: '#FFD700',
        style: 'dashed'
      }
    ];

    return {
      candles,
      annotations,
      description: "Strong bullish reversal with three equal troughs. More reliable than double bottom.",
      keyLevels: {
        breakout: peakLevel,
        target: peakLevel + (peakLevel - troughLevel),
        stopLoss: troughLevel - 1
      }
    };
  }

  // Symmetrical Triangle
  static generateSymmetricalTriangle(): PatternData {
    const basePrice = 100;
    
    const candles: CandlestickData[] = [
      // Initial wide swings
      { open: basePrice, high: basePrice + 10, low: basePrice - 2, close: basePrice + 8, volume: 1000 },
      { open: basePrice + 8, high: basePrice + 12, low: basePrice + 2, close: basePrice + 4, volume: 1100 },
      { open: basePrice + 4, high: basePrice + 6, low: basePrice - 8, close: basePrice - 6, volume: 1200 },
      { open: basePrice - 6, high: basePrice - 4, low: basePrice - 10, close: basePrice - 2, volume: 1000 },
      
      // Narrowing swings
      { open: basePrice - 2, high: basePrice + 6, low: basePrice - 3, close: basePrice + 4, volume: 900 },
      { open: basePrice + 4, high: basePrice + 5, low: basePrice - 4, close: basePrice - 2, volume: 800 },
      { open: basePrice - 2, high: basePrice + 3, low: basePrice - 3, close: basePrice + 1, volume: 700 },
      { open: basePrice + 1, high: basePrice + 2, low: basePrice - 2, close: basePrice - 1, volume: 600 },
      
      // Final compression
      { open: basePrice - 1, high: basePrice + 1, low: basePrice - 1.5, close: basePrice, volume: 500 },
      
      // Breakout
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
      description: "Neutral triangle with converging trend lines. Breakout direction determines trend.",
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
      // Strong uptrend (flagpole)
      { open: basePrice - 15, high: basePrice - 12, low: basePrice - 16, close: basePrice - 13, volume: 1000 },
      { open: basePrice - 13, high: basePrice - 8, low: basePrice - 14, close: basePrice - 10, volume: 1200 },
      { open: basePrice - 10, high: basePrice - 3, low: basePrice - 11, close: basePrice - 5, volume: 1500 },
      { open: basePrice - 5, high: basePrice + 2, low: basePrice - 6, close: basePrice, volume: 1800 },
      { open: basePrice, high: basePrice + 8, low: basePrice - 1, close: basePrice + 6, volume: 2000 },
      { open: basePrice + 6, high: flagTop, low: basePrice + 5, close: basePrice + 16, volume: 2200 }, // Flagpole peak
      
      // Flag consolidation - parallel downward sloping channel
      { open: basePrice + 16, high: basePrice + 17, low: flagBottom, close: basePrice + 13, volume: 1000 },
      { open: basePrice + 13, high: basePrice + 16, low: basePrice + 11, close: basePrice + 14, volume: 900 },
      { open: basePrice + 14, high: basePrice + 15, low: basePrice + 10, close: basePrice + 11, volume: 800 },
      { open: basePrice + 11, high: basePrice + 14, low: basePrice + 9, close: basePrice + 12, volume: 700 },
      { open: basePrice + 12, high: basePrice + 13, low: basePrice + 8, close: basePrice + 10, volume: 650 },
      
      // Breakout continuation
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
      description: "Bullish continuation pattern. Brief consolidation in strong uptrend with parallel lines.",
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
      // Strong downtrend (flagpole)
      { open: basePrice + 15, high: basePrice + 16, low: basePrice + 12, close: basePrice + 13, volume: 1000 },
      { open: basePrice + 13, high: basePrice + 14, low: basePrice + 8, close: basePrice + 10, volume: 1200 },
      { open: basePrice + 10, high: basePrice + 11, low: basePrice + 3, close: basePrice + 5, volume: 1500 },
      { open: basePrice + 5, high: basePrice + 6, low: basePrice - 2, close: basePrice, volume: 1800 },
      { open: basePrice, high: basePrice + 1, low: basePrice - 8, close: basePrice - 6, volume: 2000 },
      { open: basePrice - 6, high: basePrice - 5, low: flagBottom, close: basePrice - 16, volume: 2200 }, // Flagpole low
      
      // Flag consolidation - parallel upward sloping channel
      { open: basePrice - 16, high: flagTop, low: basePrice - 17, close: basePrice - 13, volume: 1000 },
      { open: basePrice - 13, high: basePrice - 11, low: basePrice - 16, close: basePrice - 14, volume: 900 },
      { open: basePrice - 14, high: basePrice - 10, low: basePrice - 15, close: basePrice - 11, volume: 800 },
      { open: basePrice - 11, high: basePrice - 9, low: basePrice - 14, close: basePrice - 12, volume: 700 },
      { open: basePrice - 12, high: basePrice - 8, low: basePrice - 13, close: basePrice - 10, volume: 650 },
      
      // Breakdown continuation
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
      description: "Bearish continuation pattern. Brief consolidation in strong downtrend with parallel lines.",
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
      // Strong move (flagpole)
      { open: basePrice - 10, high: basePrice - 8, low: basePrice - 12, close: basePrice - 9, volume: 1000 },
      { open: basePrice - 9, high: basePrice - 3, low: basePrice - 10, close: basePrice - 5, volume: 1500 },
      { open: basePrice - 5, high: basePrice + 2, low: basePrice - 6, close: basePrice, volume: 2000 },
      { open: basePrice, high: basePrice + 8, low: basePrice - 1, close: basePrice + 6, volume: 2200 },
      { open: basePrice + 6, high: basePrice + 12, low: basePrice + 5, close: basePrice + 10, volume: 2500 }, // Flagpole peak
      
      // Small triangular pennant
      { open: basePrice + 10, high: basePrice + 11, low: basePrice + 6, close: basePrice + 7, volume: 800 },
      { open: basePrice + 7, high: basePrice + 9, low: basePrice + 6.5, close: basePrice + 8, volume: 700 },
      { open: basePrice + 8, high: basePrice + 8.5, low: basePrice + 7, close: basePrice + 7.5, volume: 600 },
      { open: basePrice + 7.5, high: basePrice + 8, low: basePrice + 7.2, close: basePrice + 7.8, volume: 500 },
      
      // Breakout continuation
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
      description: "Small symmetrical triangle after strong move. Similar to flag but triangular shape.",
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
      // Left side of cup
      { open: basePrice + 15, high: rimLevel, low: basePrice + 13, close: basePrice + 14, volume: 1000 },
      { open: basePrice + 14, high: basePrice + 15, low: basePrice + 10, close: basePrice + 11, volume: 1100 },
      { open: basePrice + 11, high: basePrice + 12, low: basePrice + 6, close: basePrice + 7, volume: 1200 },
      { open: basePrice + 7, high: basePrice + 8, low: basePrice + 2, close: basePrice + 3, volume: 1300 },
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 2, close: basePrice - 1, volume: 1400 },
      
      // Bottom of cup (rounded)
      { open: basePrice - 1, high: basePrice + 1, low: basePrice - 3, close: basePrice - 2, volume: 1200 },
      { open: basePrice - 2, high: basePrice - 1, low: basePrice - 4, close: basePrice - 2, volume: 1100 },
      { open: basePrice - 2, high: basePrice, low: basePrice - 3, close: basePrice - 1, volume: 1000 },
      
      // Right side of cup
      { open: basePrice - 1, high: basePrice + 2, low: basePrice - 2, close: basePrice + 1, volume: 1100 },
      { open: basePrice + 1, high: basePrice + 5, low: basePrice, close: basePrice + 4, volume: 1200 },
      { open: basePrice + 4, high: basePrice + 8, low: basePrice + 3, close: basePrice + 7, volume: 1300 },
      { open: basePrice + 7, high: basePrice + 12, low: basePrice + 6, close: basePrice + 11, volume: 1400 },
      { open: basePrice + 11, high: rimLevel, low: basePrice + 10, close: basePrice + 14, volume: 1500 }, // Back to rim
      
      // Handle formation (small downward drift)
      { open: basePrice + 14, high: basePrice + 15, low: basePrice + 11, close: basePrice + 12, volume: 800 },
      { open: basePrice + 12, high: basePrice + 13, low: basePrice + 10, close: basePrice + 11, volume: 700 },
      { open: basePrice + 11, high: basePrice + 12, low: basePrice + 9, close: basePrice + 10, volume: 600 },
      
      // Breakout
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
      description: "Bullish continuation resembling a cup with rounded bottom followed by small handle.",
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
      // Uptrend leading to exhaustion gap
      { open: basePrice - 10, high: basePrice - 8, low: basePrice - 12, close: basePrice - 9, volume: 1000 },
      { open: basePrice - 9, high: basePrice - 5, low: basePrice - 10, close: basePrice - 6, volume: 1200 },
      { open: basePrice - 6, high: basePrice - 2, low: basePrice - 7, close: basePrice - 3, volume: 1400 },
      { open: basePrice - 3, high: basePrice + 2, low: basePrice - 4, close: basePrice, volume: 1600 },
      
      // Exhaustion gap up (island formation starts)
      { open: basePrice + 5, high: basePrice + 10, low: basePrice + 4, close: basePrice + 8, volume: 2000 }, // Gap up
      { open: basePrice + 8, high: basePrice + 12, low: basePrice + 7, close: basePrice + 10, volume: 1800 }, // Island candle 1
      { open: basePrice + 10, high: basePrice + 13, low: basePrice + 9, close: basePrice + 11, volume: 1600 }, // Island candle 2
      { open: basePrice + 11, high: basePrice + 12, low: basePrice + 8, close: basePrice + 9, volume: 1400 }, // Island candle 3
      
      // Breakaway gap down (island formation ends)
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 1, close: basePrice + 1, volume: 2200 }, // Gap down
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
      description: "Gap-based reversal pattern isolated by exhaustion and breakaway gaps.",
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
      // Phase 1: Lead-in (normal trend)
      { open: basePrice - 20, high: basePrice - 18, low: basePrice - 22, close: basePrice - 19, volume: 1000 },
      { open: basePrice - 19, high: basePrice - 15, low: basePrice - 20, close: basePrice - 16, volume: 1100 },
      { open: basePrice - 16, high: basePrice - 12, low: basePrice - 17, close: basePrice - 13, volume: 1200 },
      { open: basePrice - 13, high: basePrice - 9, low: basePrice - 14, close: basePrice - 10, volume: 1300 },
      { open: basePrice - 10, high: basePrice - 6, low: basePrice - 11, close: basePrice - 7, volume: 1400 },
      
      // Phase 2: Bump (acceleration)
      { open: basePrice - 7, high: basePrice - 2, low: basePrice - 8, close: basePrice - 3, volume: 1800 },
      { open: basePrice - 3, high: basePrice + 3, low: basePrice - 4, close: basePrice + 1, volume: 2200 },
      { open: basePrice + 1, high: basePrice + 8, low: basePrice, close: basePrice + 6, volume: 2600 },
      { open: basePrice + 6, high: basePrice + 15, low: basePrice + 5, close: basePrice + 12, volume: 3000 }, // Peak acceleration
      { open: basePrice + 12, high: basePrice + 18, low: basePrice + 11, close: basePrice + 16, volume: 2800 },
      
      // Phase 3: Run (reversal decline)
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
      description: "Three-phase reversal: lead-in trend, acceleration bump, then sharp reversal run.",
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
      // Uptrend context
      { open: basePrice - 15, high: basePrice - 12, low: basePrice - 16, close: basePrice - 13, volume: 1000 },
      { open: basePrice - 13, high: basePrice - 9, low: basePrice - 14, close: basePrice - 10, volume: 1200 },
      { open: basePrice - 10, high: basePrice - 6, low: basePrice - 11, close: basePrice - 7, volume: 1400 },
      { open: basePrice - 7, high: basePrice - 3, low: basePrice - 8, close: basePrice - 4, volume: 1600 },
      
      // Hanging Man formation - long lower shadow, small body at top (at high)
      { open: basePrice - 4, high: basePrice - 3, low: basePrice - 12, close: basePrice - 4.5, volume: 2000 }, // Hanging Man
      
      // Confirmation candles - decline
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
      description: "Bearish reversal candlestick with long lower shadow appearing at top of uptrend.",
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
      // Market context
      { open: basePrice - 5, high: basePrice - 3, low: basePrice - 7, close: basePrice - 4, volume: 1000 },
      { open: basePrice - 4, high: basePrice - 1, low: basePrice - 5, close: basePrice - 2, volume: 1200 },
      { open: basePrice - 2, high: basePrice + 1, low: basePrice - 3, close: basePrice, volume: 1400 },
      
      // Doji formation - equal open/close with shadows
      { open: basePrice, high: basePrice + 4, low: basePrice - 4, close: basePrice, volume: 1600 }, // Perfect Doji
      
      // Post-doji uncertainty
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
      description: "Indecision candlestick with equal open and close prices. Shows market uncertainty.",
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
      // Downtrend context
      { open: basePrice + 10, high: basePrice + 12, low: basePrice + 7, close: basePrice + 8, volume: 1000 },
      { open: basePrice + 8, high: basePrice + 9, low: basePrice + 4, close: basePrice + 5, volume: 1200 },
      { open: basePrice + 5, high: basePrice + 6, low: basePrice + 1, close: basePrice + 2, volume: 1400 },
      
      // Large bearish candle (mother)
      { open: basePrice + 2, high: basePrice + 3, low: basePrice - 6, close: basePrice - 5, volume: 1800 }, // Mother candle
      
      // Small candle inside mother (harami)
      { open: basePrice - 3, high: basePrice - 2, low: basePrice - 4, close: basePrice - 2.5, volume: 800 }, // Harami (baby)
      
      // Confirmation
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
      description: "Small candle inside previous large bearish candle. Potential bullish reversal signal.",
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
      // Uptrend context
      { open: basePrice - 10, high: basePrice - 7, low: basePrice - 12, close: basePrice - 8, volume: 1000 },
      { open: basePrice - 8, high: basePrice - 4, low: basePrice - 9, close: basePrice - 5, volume: 1200 },
      { open: basePrice - 5, high: basePrice - 1, low: basePrice - 6, close: basePrice - 2, volume: 1400 },
      
      // Large bullish candle (mother)
      { open: basePrice - 2, high: basePrice + 6, low: basePrice - 3, close: basePrice + 5, volume: 1800 }, // Mother candle
      
      // Small candle inside mother (harami)
      { open: basePrice + 3, high: basePrice + 4, low: basePrice + 2, close: basePrice + 2.5, volume: 800 }, // Harami (baby)
      
      // Confirmation
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
      description: "Small candle inside previous large bullish candle. Potential bearish reversal signal.",
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
      // Downtrend context
      { open: basePrice + 8, high: basePrice + 10, low: basePrice + 5, close: basePrice + 6, volume: 1000 },
      { open: basePrice + 6, high: basePrice + 7, low: basePrice + 2, close: basePrice + 3, volume: 1200 },
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 1, close: basePrice, volume: 1400 },
      
      // Small bearish candle
      { open: basePrice, high: basePrice + 1, low: basePrice - 2, close: basePrice - 1.5, volume: 1200 }, // Small bearish
      
      // Large bullish engulfing candle
      { open: basePrice - 3, high: basePrice + 4, low: basePrice - 4, close: basePrice + 3.5, volume: 2000 }, // Engulfing
      
      // Confirmation
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
      description: "Large bullish candle completely engulfing previous bearish candle. Strong reversal signal.",
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
      // Uptrend context
      { open: basePrice - 8, high: basePrice - 5, low: basePrice - 10, close: basePrice - 6, volume: 1000 },
      { open: basePrice - 6, high: basePrice - 2, low: basePrice - 7, close: basePrice - 3, volume: 1200 },
      { open: basePrice - 3, high: basePrice + 1, low: basePrice - 4, close: basePrice, volume: 1400 },
      
      // Small bullish candle
      { open: basePrice, high: basePrice + 2, low: basePrice - 1, close: basePrice + 1.5, volume: 1200 }, // Small bullish
      
      // Large bearish engulfing candle
      { open: basePrice + 3, high: basePrice + 4, low: basePrice - 4, close: basePrice - 3.5, volume: 2000 }, // Engulfing
      
      // Confirmation
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
      // Market context
      { open: basePrice - 3, high: basePrice - 1, low: basePrice - 5, close: basePrice - 2, volume: 1000 },
      { open: basePrice - 2, high: basePrice + 1, low: basePrice - 3, close: basePrice, volume: 1200 },
      { open: basePrice, high: basePrice + 2, low: basePrice - 1, close: basePrice + 1, volume: 1400 },
      
      // Spinning Top formation - small body with long shadows
      { open: basePrice + 1, high: basePrice + 5, low: basePrice - 3, close: basePrice + 0.5, volume: 1600 }, // Spinning Top
      
      // Post spinning top uncertainty
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
      description: "Small body with long upper and lower shadows indicating indecision and potential reversal.",
      keyLevels: {
        entry: basePrice + 2,
        stopLoss: basePrice - 4,
        target: basePrice + 6
      }
    };
  }

  static getPatternData(patternKey: string): PatternData {
    switch (patternKey) {
      case 'head-shoulders':
        return this.generateHeadAndShoulders();
      case 'inverted-head-shoulders':
        return this.generateInvertedHeadAndShoulders();
      case 'double-top':
        return this.generateDoubleTop();
      case 'double-bottom':
        return this.generateDoubleBottom();
      case 'ascending-triangle':
        return this.generateAscendingTriangle();
      case 'descending-triangle':
        return this.generateDescendingTriangle();
      case 'triple-top':
        return this.generateTripleTop();
      case 'triple-bottom':
        return this.generateTripleBottom();
      case 'bump-run-reversal':
        return this.generateBumpRunReversal();
      case 'island-reversal':
        return this.generateIslandReversal();
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
      case 'hanging-man':
        return this.generateHangingMan();
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
      case 'hammer':
        return this.generateHammer();
      case 'shooting-star':
        return this.generateShootingStar();
      default:
        return this.generateHeadAndShoulders();
    }
  }
}