import { computeBracketLevels, BracketLevelsInput, ROUNDING_CONFIG, BRACKET_LEVELS_VERSION } from '../../src/utils/bracketLevels';
import * as fs from 'fs';

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
    const FRONTEND_PATH = 'src/utils/bracketLevels.ts';
    const EDGE_FN_PATH = 'supabase/functions/_shared/bracketLevels.ts';

    it('should have identical ROUNDING_CONFIG values', () => {
      expect(ROUNDING_CONFIG.priceDecimals).toBe(8);
      expect(ROUNDING_CONFIG.distanceDecimals).toBe(8);
      expect(ROUNDING_CONFIG.rrDecimals).toBe(4);
    });

    it('should have a valid version constant', () => {
      expect(BRACKET_LEVELS_VERSION).toBeDefined();
      expect(typeof BRACKET_LEVELS_VERSION).toBe('string');
      expect(BRACKET_LEVELS_VERSION).toMatch(/^\d+\.\d+\.\d+$/); // semver format
    });

    it('should have matching BRACKET_LEVELS_VERSION in both files', () => {
      // Read the edge function file and extract version
      const edgeFnContent = fs.readFileSync(EDGE_FN_PATH, 'utf-8');
      const versionMatch = edgeFnContent.match(/BRACKET_LEVELS_VERSION\s*=\s*['"]([^'"]+)['"]/);
      
      expect(versionMatch).not.toBeNull();
      const edgeFnVersion = versionMatch![1];
      expect(edgeFnVersion).toBe(BRACKET_LEVELS_VERSION);
    });

    it('should have matching ROUNDING_CONFIG values in both files', () => {
      const edgeFnContent = fs.readFileSync(EDGE_FN_PATH, 'utf-8');
      
      // Extract ROUNDING_CONFIG from edge function file
      const priceDecimalsMatch = edgeFnContent.match(/priceDecimals:\s*(\d+)/);
      const distanceDecimalsMatch = edgeFnContent.match(/distanceDecimals:\s*(\d+)/);
      const rrDecimalsMatch = edgeFnContent.match(/rrDecimals:\s*(\d+)/);
      
      expect(priceDecimalsMatch).not.toBeNull();
      expect(distanceDecimalsMatch).not.toBeNull();
      expect(rrDecimalsMatch).not.toBeNull();
      
      expect(Number(priceDecimalsMatch![1])).toBe(ROUNDING_CONFIG.priceDecimals);
      expect(Number(distanceDecimalsMatch![1])).toBe(ROUNDING_CONFIG.distanceDecimals);
      expect(Number(rrDecimalsMatch![1])).toBe(ROUNDING_CONFIG.rrDecimals);
    });

    it('should have identical function implementation (byte comparison after stripping headers)', () => {
      const frontendContent = fs.readFileSync(FRONTEND_PATH, 'utf-8');
      const edgeFnContent = fs.readFileSync(EDGE_FN_PATH, 'utf-8');
      
      // Strip header comments and normalize whitespace for comparison
      const stripHeader = (content: string): string => {
        // Remove leading comment block (everything until first 'export')
        const firstExportIndex = content.indexOf('export interface');
        if (firstExportIndex === -1) return content;
        return content.slice(firstExportIndex).trim();
      };
      
      const frontendBody = stripHeader(frontendContent);
      const edgeFnBody = stripHeader(edgeFnContent);
      
      // Compare the actual implementation
      expect(frontendBody).toBe(edgeFnBody);
    });

    describe('Deterministic sweep test (comprehensive combinations)', () => {
      // Define test parameter ranges
      const directions: ('long' | 'short')[] = ['long', 'short'];
      const entryPrices = [10, 100, 1234.56789, 100000];
      const atrValues = [0.5, 1, 2.25, 10];
      const atrMultipliers = [0.5, 1, 2, 3];
      const ratios = [1, 1.5, 2, 3];
      const stopPercents = [0.5, 1, 2];
      const targetPercents = [1, 2, 3];

      it('should produce consistent results for percent-based calculations (~72 cases)', () => {
        let caseCount = 0;
        
        for (const direction of directions) {
          for (const entryPrice of entryPrices) {
            for (const stopPercent of stopPercents) {
              for (const targetPercent of targetPercents) {
                const input: BracketLevelsInput = {
                  direction,
                  entryPrice,
                  stopPercent,
                  targetPercent,
                  stopLossMethod: 'percent',
                  takeProfitMethod: 'percent'
                };

                const result = computeBracketLevels(input);
                
                // Verify output consistency
                expect(Number.isFinite(result.stopLossPrice)).toBe(true);
                expect(Number.isFinite(result.takeProfitPrice)).toBe(true);
                expect(Number.isFinite(result.riskRewardRatio)).toBe(true);
                expect(result.stopLossMethod).toBe('percent');
                expect(result.takeProfitMethod).toBe('percent');
                
                // Verify direction logic
                if (direction === 'long') {
                  expect(result.stopLossPrice).toBeLessThan(entryPrice);
                  expect(result.takeProfitPrice).toBeGreaterThan(entryPrice);
                } else {
                  expect(result.stopLossPrice).toBeGreaterThan(entryPrice);
                  expect(result.takeProfitPrice).toBeLessThan(entryPrice);
                }
                
                // Verify rounding precision
                const slDecimals = (result.stopLossPrice.toString().split('.')[1] || '').length;
                const tpDecimals = (result.takeProfitPrice.toString().split('.')[1] || '').length;
                expect(slDecimals).toBeLessThanOrEqual(ROUNDING_CONFIG.priceDecimals);
                expect(tpDecimals).toBeLessThanOrEqual(ROUNDING_CONFIG.priceDecimals);
                
                caseCount++;
              }
            }
          }
        }
        
        expect(caseCount).toBe(72); // 2 * 4 * 3 * 3
      });

      it('should produce consistent results for ATR-based calculations (~128 cases)', () => {
        let caseCount = 0;
        
        for (const direction of directions) {
          for (const entryPrice of entryPrices) {
            for (const atr of atrValues) {
              for (const atrMultiplier of atrMultipliers) {
                const input: BracketLevelsInput = {
                  direction,
                  entryPrice,
                  stopPercent: 2, // fallback
                  targetPercent: 4, // for ratio calculation
                  atr,
                  atrMultiplier,
                  stopLossMethod: 'atr',
                  takeProfitMethod: 'ratio'
                };

                const result = computeBracketLevels(input);
                
                // Verify output consistency
                expect(Number.isFinite(result.stopLossPrice)).toBe(true);
                expect(Number.isFinite(result.takeProfitPrice)).toBe(true);
                expect(Number.isFinite(result.riskRewardRatio)).toBe(true);
                expect(result.stopLossMethod).toBe('atr');
                expect(result.takeProfitMethod).toBe('ratio');
                
                // Verify ATR-based stop distance
                const expectedStopDistance = atr * atrMultiplier;
                expect(result.stopDistance).toBeCloseTo(expectedStopDistance, 6);
                
                // Verify direction logic
                if (direction === 'long') {
                  expect(result.stopLossPrice).toBeCloseTo(entryPrice - expectedStopDistance, 6);
                  expect(result.takeProfitPrice).toBeGreaterThan(entryPrice);
                } else {
                  expect(result.stopLossPrice).toBeCloseTo(entryPrice + expectedStopDistance, 6);
                  expect(result.takeProfitPrice).toBeLessThan(entryPrice);
                }
                
                caseCount++;
              }
            }
          }
        }
        
        expect(caseCount).toBe(128); // 2 * 4 * 4 * 4
      });

      it('should produce consistent results for mixed ATR/ratio combinations (~256 cases)', () => {
        let caseCount = 0;
        
        for (const direction of directions) {
          for (const entryPrice of entryPrices) {
            for (const atr of atrValues) {
              for (const atrMultiplier of atrMultipliers) {
                for (const ratio of ratios) {
                  // Only run subset to keep runtime reasonable
                  if (caseCount >= 256) break;
                  
                  const stopPercent = 2;
                  const targetPercent = stopPercent * ratio;
                  
                  const input: BracketLevelsInput = {
                    direction,
                    entryPrice,
                    stopPercent,
                    targetPercent,
                    atr,
                    atrMultiplier,
                    stopLossMethod: 'atr',
                    takeProfitMethod: 'ratio'
                  };

                  const result = computeBracketLevels(input);
                  
                  // Verify RR ratio calculation
                  const expectedRR = targetPercent / stopPercent;
                  expect(result.riskRewardRatio).toBeCloseTo(expectedRR, ROUNDING_CONFIG.rrDecimals);
                  
                  // Verify TP distance is RR * stop distance
                  expect(result.tpDistance).toBeCloseTo(result.stopDistance * expectedRR, 6);
                  
                  caseCount++;
                }
              }
            }
          }
        }
        
        expect(caseCount).toBeGreaterThanOrEqual(256);
      });
    });
  });
});
