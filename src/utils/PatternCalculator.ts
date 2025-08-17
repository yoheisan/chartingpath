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
      // Target projection
      {
        type: 'target',
        points: [{ x: 22, y: necklineLevel }, { x: 22, y: basePrice - 20 }],
        label: 'Target: ' + (basePrice - 20).toFixed(0),
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
        target: basePrice - 20,
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
      // Target projection
      {
        type: 'target',
        points: [{ x: 22, y: necklineLevel }, { x: 22, y: basePrice + 20 }],
        label: 'Target: ' + (basePrice + 20).toFixed(0),
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
        target: basePrice + 20,
        stopLoss: rightShoulderLow - 1
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
      case 'hammer':
        return this.generateHammer();
      case 'shooting-star':
        return this.generateShootingStar();
      default:
        return this.generateHeadAndShoulders();
    }
  }
}