/**
 * Unit tests for project credits estimation
 */

interface EstimateInput {
  projectType: string;
  instrumentCount: number;
  patternCount: number;
  lookbackYears: number;
  timeframe: string;
}

interface EstimateResult {
  credits_estimated: number;
  breakdown: {
    base: number;
    instruments: number;
    patterns: number;
    lookback: number;
    timeframe_multiplier: number;
  };
}

/**
 * Pure function for credits estimation - mirrors edge function logic
 */
function estimateCredits(input: EstimateInput): EstimateResult {
  const { projectType, instrumentCount, patternCount, lookbackYears, timeframe } = input;
  
  // Base cost by project type
  let base = 5;
  switch (projectType) {
    case 'setup_finder': base = 5; break;
    case 'pattern_lab': base = 10; break;
    case 'portfolio_checkup': base = 3; break;
    case 'portfolio_sim': base = 8; break;
  }
  
  // Cost per instrument
  const instruments = Math.ceil(instrumentCount / 10);
  
  // Cost per pattern
  const patterns = Math.ceil(patternCount / 2);
  
  // Lookback years multiplier
  const lookback = lookbackYears;
  
  // Timeframe multiplier (lower timeframe = more data = higher cost)
  let timeframe_multiplier = 1;
  switch (timeframe) {
    case '1m': timeframe_multiplier = 4; break;
    case '5m': timeframe_multiplier = 3; break;
    case '15m': timeframe_multiplier = 2; break;
    case '1h': timeframe_multiplier = 1.5; break;
    case '4h': timeframe_multiplier = 1.2; break;
    case '1d': timeframe_multiplier = 1; break;
  }
  
  const credits_estimated = Math.ceil(
    (base + instruments + patterns + lookback) * timeframe_multiplier
  );
  
  return {
    credits_estimated,
    breakdown: {
      base,
      instruments,
      patterns,
      lookback,
      timeframe_multiplier
    }
  };
}

describe('Credits Estimation', () => {
  describe('estimateCredits', () => {
    it('should calculate setup_finder credits correctly with default params', () => {
      const result = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      // base(5) + instruments(1) + patterns(1) + lookback(1) = 8 * timeframe(1) = 8
      expect(result.credits_estimated).toBe(8);
      expect(result.breakdown.base).toBe(5);
    });
    
    it('should increase cost for more instruments', () => {
      const small = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 5,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      const large = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 50,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      expect(large.credits_estimated).toBeGreaterThan(small.credits_estimated);
    });
    
    it('should increase cost for lower timeframes', () => {
      const daily = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      const hourly = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1h'
      });
      
      expect(hourly.credits_estimated).toBeGreaterThan(daily.credits_estimated);
      expect(hourly.breakdown.timeframe_multiplier).toBe(1.5);
    });
    
    it('should have higher base cost for pattern_lab', () => {
      const setupFinder = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      const patternLab = estimateCredits({
        projectType: 'pattern_lab',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      expect(patternLab.breakdown.base).toBe(10);
      expect(setupFinder.breakdown.base).toBe(5);
      expect(patternLab.credits_estimated).toBeGreaterThan(setupFinder.credits_estimated);
    });
    
    it('should scale with lookback years', () => {
      const oneYear = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      const threeYears = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 3,
        timeframe: '1d'
      });
      
      expect(threeYears.breakdown.lookback).toBe(3);
      expect(threeYears.credits_estimated).toBeGreaterThan(oneYear.credits_estimated);
    });
    
    it('should handle 4h timeframe multiplier', () => {
      const result = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '4h'
      });
      
      expect(result.breakdown.timeframe_multiplier).toBe(1.2);
    });
    
    it('should round up credits to whole numbers', () => {
      const result = estimateCredits({
        projectType: 'portfolio_checkup',
        instrumentCount: 5,
        patternCount: 1,
        lookbackYears: 1,
        timeframe: '4h'
      });
      
      // base(3) + instruments(1) + patterns(1) + lookback(1) = 6 * 1.2 = 7.2 -> 8
      expect(Number.isInteger(result.credits_estimated)).toBe(true);
    });
  });
});
