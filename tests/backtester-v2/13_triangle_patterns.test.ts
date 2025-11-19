import { describe, it, expect } from '@jest/globals';
import { TrianglePatternsStrategy } from '../../engine/backtester-v2/strategies/TrianglePatterns';

describe('Triangle Patterns Strategy', () => {
  it('detects Ascending Triangle pattern', () => {
    const strategy = new TrianglePatternsStrategy({
      symbol: 'TEST',
      lookbackPeriod: 50,
      minTrendlineTouches: 2,
      trendlineTolerance: 0.03,
      breakoutConfirmation: 2,
      volumeConfirmation: false,
      positionSize: 1000
    });

    const prices: Record<string, number>[] = [];
    
    // Create ascending triangle: flat resistance ~120, rising support
    for (let i = 0; i < 30; i++) {
      if (i % 8 === 0 || i % 8 === 1) {
        // Touch resistance at 120
        prices.push({ TEST: 119 + Math.random() });
      } else if (i % 8 === 4 || i % 8 === 5) {
        // Rising support
        prices.push({ TEST: 110 + (i / 30) * 8 });
      } else {
        // Price oscillation between trendlines
        prices.push({ TEST: 115 + (i / 30) * 3 + Math.random() * 2 });
      }
    }
    
    // Breakout above resistance
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 120 + i * 2 });
    }

    let signals = { signals: [] as any[] };
    for (const priceData of prices) {
      signals = strategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) break;
    }

    expect(signals.signals.length).toBeGreaterThan(0);
    expect(signals.signals[0].action).toBe('BUY');
    expect(signals.signals[0].tag).toContain('triangle_breakout_long');
  });

  it('detects Descending Triangle pattern', () => {
    const strategy = new TrianglePatternsStrategy({
      symbol: 'TEST',
      lookbackPeriod: 50,
      minTrendlineTouches: 2,
      trendlineTolerance: 0.03,
      breakoutConfirmation: 2,
      volumeConfirmation: false,
      positionSize: 1000
    });

    const prices: Record<string, number>[] = [];
    
    // Create descending triangle: flat support ~80, falling resistance
    for (let i = 0; i < 30; i++) {
      if (i % 8 === 0 || i % 8 === 1) {
        // Touch support at 80
        prices.push({ TEST: 80 + Math.random() });
      } else if (i % 8 === 4 || i % 8 === 5) {
        // Falling resistance
        prices.push({ TEST: 95 - (i / 30) * 10 });
      } else {
        // Price oscillation
        prices.push({ TEST: 87 - (i / 30) * 5 + Math.random() * 2 });
      }
    }
    
    // Breakdown below support
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 80 - i * 2 });
    }

    let signals = { signals: [] as any[] };
    for (const priceData of prices) {
      signals = strategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) break;
    }

    expect(signals.signals.length).toBeGreaterThan(0);
    expect(signals.signals[0].action).toBe('SELL');
    expect(signals.signals[0].tag).toContain('triangle_breakout_short');
  });

  it('detects Symmetrical Triangle pattern', () => {
    const strategy = new TrianglePatternsStrategy({
      symbol: 'TEST',
      lookbackPeriod: 50,
      minTrendlineTouches: 2,
      trendlineTolerance: 0.04,
      breakoutConfirmation: 2,
      volumeConfirmation: false,
      positionSize: 1000
    });

    const prices: Record<string, number>[] = [];
    
    // Create symmetrical triangle: converging trendlines
    for (let i = 0; i < 30; i++) {
      const convergence = 1 - (i / 30) * 0.6;
      if (i % 6 === 0) {
        // Upper trendline touch
        prices.push({ TEST: 100 + 10 * convergence });
      } else if (i % 6 === 3) {
        // Lower trendline touch
        prices.push({ TEST: 100 - 10 * convergence });
      } else {
        // Between trendlines
        prices.push({ TEST: 100 + (Math.random() - 0.5) * 10 * convergence });
      }
    }
    
    // Breakout (can go either way in symmetrical)
    for (let i = 0; i < 5; i++) {
      prices.push({ TEST: 105 + i * 2 });
    }

    let signals = { signals: [] as any[] };
    for (const priceData of prices) {
      signals = strategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) break;
    }

    expect(signals.signals.length).toBeGreaterThan(0);
    expect(['BUY', 'SELL']).toContain(signals.signals[0].action);
    expect(signals.signals[0].tag).toContain('symmetrical_triangle_breakout');
  });

  it('requires minimum trendline touches', () => {
    const strictStrategy = new TrianglePatternsStrategy({
      symbol: 'TEST',
      lookbackPeriod: 50,
      minTrendlineTouches: 3, // Require 3 touches
      trendlineTolerance: 0.03,
      breakoutConfirmation: 1,
      volumeConfirmation: false,
      positionSize: 1000
    });

    const prices: Record<string, number>[] = [];
    
    // Create pattern with only 2 touches (insufficient)
    for (let i = 0; i < 20; i++) {
      if (i === 5 || i === 15) {
        prices.push({ TEST: 120 });
      } else {
        prices.push({ TEST: 110 + Math.random() * 8 });
      }
    }

    let signalFound = false;
    for (const priceData of prices) {
      const signals = strictStrategy.generateSignals('2024-01-01', priceData);
      if (signals.signals.length > 0) {
        signalFound = true;
        break;
      }
    }

    expect(signalFound).toBe(false);
  });
});
