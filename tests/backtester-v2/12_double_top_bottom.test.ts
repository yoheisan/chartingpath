import { describe, it, expect } from '@jest/globals';
import { DoubleTopBottomStrategy } from '../../engine/backtester-v2/strategies/DoubleTopBottom';

describe('Double Top/Bottom Strategy', () => {
  it('detects Double Top pattern', () => {
    const strategy = new DoubleTopBottomStrategy({
      symbol: 'TEST',
      lookbackPeriod: 40,
      peakSimilarityTolerance: 0.02,
      minBarsBetweenPeaks: 5,
      necklineBreakConfirmation: 2,
      volumeConfirmation: false,
      positionSize: 1000
    });

    const prices: Record<string, number>[] = [];
    
    // Uptrend
    for (let i = 0; i < 10; i++) {
      prices.push({ TEST: 100 + i * 2 });
    }
    
    // First peak at ~120
    for (let i = 0; i < 3; i++) {
      prices.push({ TEST: 120 + i });
    }
    for (let i = 0; i < 3; i++) {
      prices.push({ TEST: 123 - i });
    }
    
    // Retracement to ~115
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 120 - i });
    }
    
    // Second peak at ~121 (similar to first)
    for (let i = 0; i < 3; i++) {
      prices.push({ TEST: 115 + i * 2 });
    }
    for (let i = 0; i < 3; i++) {
      prices.push({ TEST: 121 - i * 2 });
    }
    
    // Break below neckline
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 114 - i * 2 });
    }

    let signals = { signals: [] as any[] };
    for (const priceData of prices) {
      signals = strategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) break;
    }

    expect(signals.signals.length).toBeGreaterThan(0);
    expect(signals.signals[0].action).toBe('SELL');
    expect(signals.signals[0].tag).toContain('double_top_break');
  });

  it('detects Double Bottom pattern', () => {
    const strategy = new DoubleTopBottomStrategy({
      symbol: 'TEST',
      lookbackPeriod: 40,
      peakSimilarityTolerance: 0.02,
      minBarsBetweenPeaks: 5,
      necklineBreakConfirmation: 2,
      volumeConfirmation: false,
      positionSize: 1000
    });

    const prices: Record<string, number>[] = [];
    
    // Downtrend
    for (let i = 0; i < 10; i++) {
      prices.push({ TEST: 100 - i * 2 });
    }
    
    // First trough at ~80
    for (let i = 0; i < 3; i++) {
      prices.push({ TEST: 80 - i });
    }
    for (let i = 0; i < 3; i++) {
      prices.push({ TEST: 77 + i });
    }
    
    // Bounce to ~85
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 80 + i });
    }
    
    // Second trough at ~79 (similar to first)
    for (let i = 0; i < 3; i++) {
      prices.push({ TEST: 85 - i * 2 });
    }
    for (let i = 0; i < 3; i++) {
      prices.push({ TEST: 79 + i * 2 });
    }
    
    // Break above neckline
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 86 + i * 2 });
    }

    let signals = { signals: [] as any[] };
    for (const priceData of prices) {
      signals = strategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) break;
    }

    expect(signals.signals.length).toBeGreaterThan(0);
    expect(signals.signals[0].action).toBe('BUY');
    expect(signals.signals[0].tag).toContain('double_bottom_break');
  });

  it('validates peak similarity tolerance', () => {
    const strictStrategy = new DoubleTopBottomStrategy({
      symbol: 'TEST',
      lookbackPeriod: 40,
      peakSimilarityTolerance: 0.01, // 1% tolerance
      minBarsBetweenPeaks: 5,
      necklineBreakConfirmation: 1,
      volumeConfirmation: false,
      positionSize: 1000
    });

    const prices: Record<string, number>[] = [];
    
    // Create pattern with peaks 3% apart (should not trigger)
    for (let i = 0; i < 10; i++) {
      prices.push({ TEST: 100 + i });
    }
    
    // First peak at 110
    prices.push({ TEST: 110 });
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 110 - i });
    }
    
    // Second peak at 113 (3% difference)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 105 + i * 1.6 });
    }
    prices.push({ TEST: 113 });
    
    // Break
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 113 - i * 2 });
    }

    let signalFound = false;
    for (const priceData of prices) {
      const signals = strictStrategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) {
        signalFound = true;
        break;
      }
    }

    // Should not detect pattern due to strict tolerance
    expect(signalFound).toBe(false);
  });
});
