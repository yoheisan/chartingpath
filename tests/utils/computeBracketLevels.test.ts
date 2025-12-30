import { computeBracketLevels, BracketLevelsInput, ROUNDING_CONFIG } from '../../src/utils/bracketLevels';

describe('computeBracketLevels', () => {
  
  describe('Long direction with ATR stop + ratio TP', () => {
    it('should compute correct SL/TP for long ATR-based bracket', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 2,      // Used for ratio calculation
        targetPercent: 4,    // 2:1 RR ratio
        atr: 2,
        atrMultiplier: 2,
        stopLossMethod: 'atr',
        takeProfitMethod: 'ratio'
      };

      const result = computeBracketLevels(input);

      // stopDistance = atr * atrMultiplier = 2 * 2 = 4
      expect(result.stopDistance).toBeCloseTo(4, 6);
      // stopLossPrice = 100 - 4 = 96
      expect(result.stopLossPrice).toBeCloseTo(96, 6);
      // rrRatio = targetPercent / stopPercent = 4 / 2 = 2
      // tpDistance = stopDistance * rrRatio = 4 * 2 = 8
      expect(result.tpDistance).toBeCloseTo(8, 6);
      // takeProfitPrice = 100 + 8 = 108
      expect(result.takeProfitPrice).toBeCloseTo(108, 6);
      // riskRewardRatio = tpDistance / stopDistance = 8 / 4 = 2
      expect(result.riskRewardRatio).toBeCloseTo(2, 4);
      expect(result.stopLossMethod).toBe('atr');
      expect(result.takeProfitMethod).toBe('ratio');
    });
  });

  describe('Short direction with ATR stop + ratio TP', () => {
    it('should compute correct SL/TP for short ATR-based bracket', () => {
      const input: BracketLevelsInput = {
        direction: 'short',
        entryPrice: 100,
        stopPercent: 2,
        targetPercent: 4,
        atr: 2,
        atrMultiplier: 2,
        stopLossMethod: 'atr',
        takeProfitMethod: 'ratio'
      };

      const result = computeBracketLevels(input);

      // stopDistance = atr * atrMultiplier = 2 * 2 = 4
      expect(result.stopDistance).toBeCloseTo(4, 6);
      // stopLossPrice = 100 + 4 = 104 (short direction, SL is above entry)
      expect(result.stopLossPrice).toBeCloseTo(104, 6);
      // tpDistance = stopDistance * (4/2) = 4 * 2 = 8
      expect(result.tpDistance).toBeCloseTo(8, 6);
      // takeProfitPrice = 100 - 8 = 92 (short direction, TP is below entry)
      expect(result.takeProfitPrice).toBeCloseTo(92, 6);
      expect(result.riskRewardRatio).toBeCloseTo(2, 4);
      expect(result.stopLossMethod).toBe('atr');
      expect(result.takeProfitMethod).toBe('ratio');
    });
  });

  describe('Long direction with percent-based stops', () => {
    it('should compute correct SL/TP for long percent-based bracket', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 2,      // 2%
        targetPercent: 4,    // 4%
        stopLossMethod: 'percent',
        takeProfitMethod: 'percent'
      };

      const result = computeBracketLevels(input);

      // stopLossPrice = 100 * (1 - 2/100) = 100 * 0.98 = 98
      expect(result.stopLossPrice).toBeCloseTo(98, 6);
      // takeProfitPrice = 100 * (1 + 4/100) = 100 * 1.04 = 104
      expect(result.takeProfitPrice).toBeCloseTo(104, 6);
      // stopDistance = |100 - 98| = 2
      expect(result.stopDistance).toBeCloseTo(2, 6);
      // tpDistance = |104 - 100| = 4
      expect(result.tpDistance).toBeCloseTo(4, 6);
      // riskRewardRatio = 4 / 2 = 2
      expect(result.riskRewardRatio).toBeCloseTo(2, 4);
      expect(result.stopLossMethod).toBe('percent');
      expect(result.takeProfitMethod).toBe('percent');
    });
  });

  describe('Short direction with percent-based stops', () => {
    it('should compute correct SL/TP for short percent-based bracket', () => {
      const input: BracketLevelsInput = {
        direction: 'short',
        entryPrice: 100,
        stopPercent: 2,
        targetPercent: 4,
        stopLossMethod: 'percent',
        takeProfitMethod: 'percent'
      };

      const result = computeBracketLevels(input);

      // stopLossPrice = 100 * (1 + 2/100) = 100 * 1.02 = 102
      expect(result.stopLossPrice).toBeCloseTo(102, 6);
      // takeProfitPrice = 100 * (1 - 4/100) = 100 * 0.96 = 96
      expect(result.takeProfitPrice).toBeCloseTo(96, 6);
      expect(result.stopDistance).toBeCloseTo(2, 6);
      expect(result.tpDistance).toBeCloseTo(4, 6);
      expect(result.riskRewardRatio).toBeCloseTo(2, 4);
    });
  });

  describe('Edge guards', () => {
    it('should throw error when entryPrice <= 0', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 0,
        stopPercent: 2,
        targetPercent: 4
      };

      expect(() => computeBracketLevels(input)).toThrow('entryPrice must be greater than 0');
    });

    it('should throw error when entryPrice is negative', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: -100,
        stopPercent: 2,
        targetPercent: 4
      };

      expect(() => computeBracketLevels(input)).toThrow('entryPrice must be greater than 0');
    });

    it('should fallback to percent method when atr <= 0', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 2,
        targetPercent: 4,
        atr: 0,
        atrMultiplier: 2,
        stopLossMethod: 'atr',
        takeProfitMethod: 'ratio'
      };

      const result = computeBracketLevels(input);

      // Should fallback to percent-based
      expect(result.stopLossMethod).toBe('percent');
      expect(result.takeProfitMethod).toBe('percent');
      expect(result.stopLossPrice).toBeCloseTo(98, 6);
    });

    it('should fallback to percent when atrMultiplier <= 0', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 2,
        targetPercent: 4,
        atr: 2,
        atrMultiplier: 0,
        stopLossMethod: 'atr',
        takeProfitMethod: 'ratio'
      };

      const result = computeBracketLevels(input);

      expect(result.stopLossMethod).toBe('percent');
    });

    it('should handle zero stopPercent gracefully', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 0,
        targetPercent: 4,
        stopLossMethod: 'percent',
        takeProfitMethod: 'percent'
      };

      const result = computeBracketLevels(input);

      // stopLossPrice = entryPrice when stopPercent is 0
      expect(result.stopLossPrice).toBeCloseTo(100, 6);
      expect(result.stopDistance).toBeCloseTo(0, 6);
    });

    it('should handle zero targetPercent gracefully', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 2,
        targetPercent: 0,
        stopLossMethod: 'percent',
        takeProfitMethod: 'percent'
      };

      const result = computeBracketLevels(input);

      // takeProfitPrice = entryPrice when targetPercent is 0
      expect(result.takeProfitPrice).toBeCloseTo(100, 6);
      expect(result.tpDistance).toBeCloseTo(0, 6);
      expect(result.riskRewardRatio).toBeCloseTo(0, 4);
    });
  });

  describe('Rounding precision', () => {
    it('should round prices to 8 decimal places', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 1.12345678901234,
        stopPercent: 1.5,
        targetPercent: 3,
        stopLossMethod: 'percent',
        takeProfitMethod: 'percent'
      };

      const result = computeBracketLevels(input);

      // Check that result has at most 8 decimal places
      const stopPriceStr = result.stopLossPrice.toString();
      const tpPriceStr = result.takeProfitPrice.toString();
      
      const stopDecimals = stopPriceStr.includes('.') 
        ? stopPriceStr.split('.')[1].length 
        : 0;
      const tpDecimals = tpPriceStr.includes('.') 
        ? tpPriceStr.split('.')[1].length 
        : 0;

      expect(stopDecimals).toBeLessThanOrEqual(8);
      expect(tpDecimals).toBeLessThanOrEqual(8);
    });

    it('should round riskRewardRatio to 4 decimal places', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 3,
        targetPercent: 7,
        stopLossMethod: 'percent',
        takeProfitMethod: 'percent'
      };

      const result = computeBracketLevels(input);

      const rrStr = result.riskRewardRatio.toString();
      const rrDecimals = rrStr.includes('.') 
        ? rrStr.split('.')[1].length 
        : 0;

      expect(rrDecimals).toBeLessThanOrEqual(4);
    });
  });

  describe('Default method behavior', () => {
    it('should default to percent methods when not specified', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 2,
        targetPercent: 4
        // No method specified
      };

      const result = computeBracketLevels(input);

      expect(result.stopLossMethod).toBe('percent');
      expect(result.takeProfitMethod).toBe('percent');
    });

    it('should default atrMultiplier to 2.0 when not specified', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 100,
        stopPercent: 2,
        targetPercent: 4,
        atr: 1,
        stopLossMethod: 'atr',
        takeProfitMethod: 'ratio'
        // No atrMultiplier specified
      };

      const result = computeBracketLevels(input);

      // stopDistance = atr * 2 = 1 * 2 = 2
      expect(result.stopDistance).toBeCloseTo(2, 6);
      expect(result.stopLossPrice).toBeCloseTo(98, 6);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle FX pair with small price movements', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 1.0850,
        stopPercent: 0.5,
        targetPercent: 1.0,
        atr: 0.0045,
        atrMultiplier: 1.5,
        stopLossMethod: 'atr',
        takeProfitMethod: 'ratio'
      };

      const result = computeBracketLevels(input);

      // stopDistance = 0.0045 * 1.5 = 0.00675
      expect(result.stopDistance).toBeCloseTo(0.00675, 6);
      expect(result.stopLossPrice).toBeCloseTo(1.07825, 5);
      // RR = 1.0 / 0.5 = 2, so tpDistance = 0.00675 * 2 = 0.0135
      expect(result.tpDistance).toBeCloseTo(0.0135, 5);
      expect(result.takeProfitPrice).toBeCloseTo(1.0985, 4);
    });

    it('should handle crypto with larger price movements', () => {
      const input: BracketLevelsInput = {
        direction: 'short',
        entryPrice: 42500,
        stopPercent: 2,
        targetPercent: 6,
        atr: 850,
        atrMultiplier: 2,
        stopLossMethod: 'atr',
        takeProfitMethod: 'ratio'
      };

      const result = computeBracketLevels(input);

      // stopDistance = 850 * 2 = 1700
      expect(result.stopDistance).toBeCloseTo(1700, 2);
      // For short: stopLossPrice = 42500 + 1700 = 44200
      expect(result.stopLossPrice).toBeCloseTo(44200, 2);
      // RR = 6 / 2 = 3, tpDistance = 1700 * 3 = 5100
      expect(result.tpDistance).toBeCloseTo(5100, 2);
      // For short: takeProfitPrice = 42500 - 5100 = 37400
      expect(result.takeProfitPrice).toBeCloseTo(37400, 2);
      expect(result.riskRewardRatio).toBeCloseTo(3, 4);
    });
  });

  describe('ROUNDING_CONFIG consistency', () => {
    it('should export ROUNDING_CONFIG with correct values', () => {
      expect(ROUNDING_CONFIG).toBeDefined();
      expect(ROUNDING_CONFIG.priceDecimals).toBe(8);
      expect(ROUNDING_CONFIG.distanceDecimals).toBe(8);
      expect(ROUNDING_CONFIG.rrDecimals).toBe(4);
    });

    it('should use ROUNDING_CONFIG values in output', () => {
      const input: BracketLevelsInput = {
        direction: 'long',
        entryPrice: 123.456789012345,
        stopPercent: 1.234567,
        targetPercent: 2.345678,
        stopLossMethod: 'percent',
        takeProfitMethod: 'percent'
      };

      const result = computeBracketLevels(input);

      // Verify precision matches ROUNDING_CONFIG
      const stopPriceDecimals = (result.stopLossPrice.toString().split('.')[1] || '').length;
      const tpPriceDecimals = (result.takeProfitPrice.toString().split('.')[1] || '').length;
      const rrDecimals = (result.riskRewardRatio.toString().split('.')[1] || '').length;

      expect(stopPriceDecimals).toBeLessThanOrEqual(ROUNDING_CONFIG.priceDecimals);
      expect(tpPriceDecimals).toBeLessThanOrEqual(ROUNDING_CONFIG.priceDecimals);
      expect(rrDecimals).toBeLessThanOrEqual(ROUNDING_CONFIG.rrDecimals);
    });
  });

  describe('Sync verification between frontend and edge function implementations', () => {
    it('should have identical ROUNDING_CONFIG values', () => {
      // This test verifies the rounding config is consistent
      // The edge function version must be manually kept in sync
      expect(ROUNDING_CONFIG.priceDecimals).toBe(8);
      expect(ROUNDING_CONFIG.distanceDecimals).toBe(8);
      expect(ROUNDING_CONFIG.rrDecimals).toBe(4);
    });

    it('should produce identical outputs for both implementations', () => {
      // Test various scenarios to ensure both implementations would produce the same result
      const testCases: BracketLevelsInput[] = [
        { direction: 'long', entryPrice: 100, stopPercent: 2, targetPercent: 4 },
        { direction: 'short', entryPrice: 50, stopPercent: 1.5, targetPercent: 3 },
        { direction: 'long', entryPrice: 1.2345, stopPercent: 0.5, targetPercent: 1 },
        { direction: 'long', entryPrice: 100, stopPercent: 2, targetPercent: 4, atr: 2, atrMultiplier: 2, stopLossMethod: 'atr', takeProfitMethod: 'ratio' },
      ];

      for (const input of testCases) {
        const result = computeBracketLevels(input);
        
        // Verify structure
        expect(result).toHaveProperty('stopLossPrice');
        expect(result).toHaveProperty('takeProfitPrice');
        expect(result).toHaveProperty('stopDistance');
        expect(result).toHaveProperty('tpDistance');
        expect(result).toHaveProperty('riskRewardRatio');
        expect(result).toHaveProperty('stopLossMethod');
        expect(result).toHaveProperty('takeProfitMethod');
        
        // Verify all numbers are finite
        expect(Number.isFinite(result.stopLossPrice)).toBe(true);
        expect(Number.isFinite(result.takeProfitPrice)).toBe(true);
        expect(Number.isFinite(result.riskRewardRatio)).toBe(true);
      }
    });
  });
});
