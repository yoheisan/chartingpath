import { describe, it, expect } from '@jest/globals';
import { HeadAndShouldersStrategy } from '../../engine/backtester-v2/strategies/HeadAndShoulders';

describe('Head & Shoulders Strategy', () => {
  it('detects regular Head & Shoulders pattern', () => {
    const strategy = new HeadAndShouldersStrategy({
      symbol: 'TEST',
      lookbackPeriod: 50,
      shoulderSymmetryTolerance: 0.03,
      necklineBreakConfirmation: 2,
      volumeConfirmation: false,
      positionSize: 1000
    });

    // Create H&S pattern: shoulder1 -> head -> shoulder2
    const prices: Record<string, number>[] = [];
    
    // Uptrend
    for (let i = 0; i < 10; i++) {
      prices.push({ TEST: 100 + i * 2 });
    }
    
    // Left shoulder (peak at ~120)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 120 + i });
    }
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 125 - i });
    }
    
    // Head (peak at ~130)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 120 + i * 2 });
    }
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 130 - i * 2 });
    }
    
    // Right shoulder (peak at ~122)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 120 + i / 2 });
    }
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 122 - i / 2 });
    }
    
    // Neckline break (downward)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 118 - i * 2 });
    }

    let signals = { signals: [] as any[] };
    for (const priceData of prices) {
      signals = strategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) break;
    }

    expect(signals.signals.length).toBeGreaterThan(0);
    expect(signals.signals[0].action).toBe('SELL');
    expect(signals.signals[0].tag).toContain('hs_neckline_break');
  });

  it('detects Inverse Head & Shoulders pattern', () => {
    const strategy = new HeadAndShouldersStrategy({
      symbol: 'TEST',
      lookbackPeriod: 50,
      shoulderSymmetryTolerance: 0.03,
      necklineBreakConfirmation: 2,
      volumeConfirmation: false,
      positionSize: 1000
    });

    // Create Inverse H&S pattern
    const prices: Record<string, number>[] = [];
    
    // Downtrend
    for (let i = 0; i < 10; i++) {
      prices.push({ TEST: 100 - i * 2 });
    }
    
    // Left shoulder (trough at ~80)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 80 - i });
    }
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 75 + i });
    }
    
    // Head (trough at ~70)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 80 - i * 2 });
    }
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 70 + i * 2 });
    }
    
    // Right shoulder (trough at ~78)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 80 - i / 2 });
    }
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 78 + i / 2 });
    }
    
    // Neckline break (upward)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 82 + i * 2 });
    }

    let signals = { signals: [] as any[] };
    for (const priceData of prices) {
      signals = strategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) break;
    }

    expect(signals.signals.length).toBeGreaterThan(0);
    expect(signals.signals[0].action).toBe('BUY');
    expect(signals.signals[0].tag).toContain('inverse_hs_neckline_break');
  });

  it('respects stop loss', () => {
    const strategy = new HeadAndShouldersStrategy({
      symbol: 'TEST',
      lookbackPeriod: 50,
      shoulderSymmetryTolerance: 0.03,
      necklineBreakConfirmation: 1,
      volumeConfirmation: false,
      positionSize: 1000,
      stopLoss: 0.05
    });

    // Manually set position
    (strategy as any).position = 'LONG';
    (strategy as any).entryPrice = 100;

    // Price drops 6%
    const signals = strategy.generateSignals('2024-01-01', { TEST: 94 });

    expect(signals.signals.length).toBe(1);
    expect(signals.signals[0].action).toBe('CLOSE');
    expect(signals.signals[0].tag).toBe('stop_loss');
  });
});
