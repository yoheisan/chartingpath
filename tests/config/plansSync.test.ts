/**
 * Sync verification tests for plans config between frontend and edge functions
 */
import * as fs from 'fs';
import { 
  PLANS_CONFIG, 
  PLANS_CONFIG_VERSION,
  estimateCredits,
  BARS_PER_YEAR,
  CREDIT_UNIT
} from '../../src/config/plans';

describe('Plans Configuration Sync', () => {
  const FRONTEND_PATH = 'src/config/plans.ts';
  const EDGE_FN_PATH = 'supabase/functions/_shared/plans.ts';

  describe('File sync verification', () => {
    it('should have identical PLANS_CONFIG_VERSION in both files', () => {
      const edgeFnContent = fs.readFileSync(EDGE_FN_PATH, 'utf-8');
      const versionMatch = edgeFnContent.match(/PLANS_CONFIG_VERSION\s*=\s*['"]([^'"]+)['"]/);
      
      expect(versionMatch).not.toBeNull();
      const edgeFnVersion = versionMatch![1];
      expect(edgeFnVersion).toBe(PLANS_CONFIG_VERSION);
    });

    it('should have matching CREDIT_UNIT in both files', () => {
      const edgeFnContent = fs.readFileSync(EDGE_FN_PATH, 'utf-8');
      const creditUnitMatch = edgeFnContent.match(/CREDIT_UNIT\s*=\s*([\d_]+)/);
      
      expect(creditUnitMatch).not.toBeNull();
      const edgeCreditUnit = Number(creditUnitMatch![1].replace(/_/g, ''));
      expect(edgeCreditUnit).toBe(CREDIT_UNIT);
    });

    it('should have matching BARS_PER_YEAR in both files', () => {
      const edgeFnContent = fs.readFileSync(EDGE_FN_PATH, 'utf-8');
      
      // Extract BARS_PER_YEAR values
      const dailyMatch = edgeFnContent.match(/'1d':\s*(\d+)/);
      const fourHourMatch = edgeFnContent.match(/'4h':\s*(\d+)/);
      
      expect(dailyMatch).not.toBeNull();
      expect(fourHourMatch).not.toBeNull();
      
      expect(Number(dailyMatch![1])).toBe(BARS_PER_YEAR['1d']);
      expect(Number(fourHourMatch![1])).toBe(BARS_PER_YEAR['4h']);
    });

    it('should have identical tier credits in both files', () => {
      const edgeFnContent = fs.readFileSync(EDGE_FN_PATH, 'utf-8');
      
      // Check FREE tier credits
      expect(edgeFnContent).toContain('monthlyCredits: 25');
      expect(PLANS_CONFIG.tiers.FREE.monthlyCredits).toBe(25);
      
      // Check PLUS tier credits
      expect(edgeFnContent).toContain('monthlyCredits: 300');
      expect(PLANS_CONFIG.tiers.PLUS.monthlyCredits).toBe(300);
      
      // Check PRO tier credits
      expect(edgeFnContent).toContain('monthlyCredits: 900');
      expect(PLANS_CONFIG.tiers.PRO.monthlyCredits).toBe(900);
      
      // Check ELITE tier credits
      expect(edgeFnContent).toContain('monthlyCredits: 3000');
      expect(PLANS_CONFIG.tiers.ELITE.monthlyCredits).toBe(3000);
    });

    it('should have matching estimateCredits function (core logic comparison)', () => {
      const frontendContent = fs.readFileSync(FRONTEND_PATH, 'utf-8');
      const edgeFnContent = fs.readFileSync(EDGE_FN_PATH, 'utf-8');
      
      // Extract the estimateCredits function body from both files
      const extractFunction = (content: string): string => {
        const start = content.indexOf('export function estimateCredits');
        if (start === -1) return '';
        
        let braceCount = 0;
        let inFunction = false;
        let end = start;
        
        for (let i = start; i < content.length; i++) {
          if (content[i] === '{') {
            braceCount++;
            inFunction = true;
          } else if (content[i] === '}') {
            braceCount--;
            if (inFunction && braceCount === 0) {
              end = i + 1;
              break;
            }
          }
        }
        
        return content.slice(start, end);
      };
      
      const frontendFn = extractFunction(frontendContent);
      const edgeFn = extractFunction(edgeFnContent);
      
      // Normalize whitespace for comparison
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      
      expect(normalize(frontendFn)).toBe(normalize(edgeFn));
    });
  });
});

describe('Credit Estimation', () => {
  describe('estimateCredits - Setup Finder', () => {
    it('should calculate credits correctly for basic setup', () => {
      const result = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '1d',
        cacheHitRatio: 0
      });
      
      // base(2) + (10 * 365 * 3 * 1.0 + 10 * 2000 + 10 * 365 * 0.35) / 100000
      // = 2 + (10950 + 20000 + 1277.5) / 100000
      // = 2 + 0.322 = 3
      expect(result.creditsEstimated).toBeGreaterThanOrEqual(2);
      expect(result.breakdown.base).toBe(2);
    });

    it('should increase with more instruments', () => {
      const small = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '1d',
        cacheHitRatio: 0
      });
      
      const large = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 50,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '1d',
        cacheHitRatio: 0
      });
      
      expect(large.creditsEstimated).toBeGreaterThan(small.creditsEstimated);
    });

    it('should increase with more patterns', () => {
      const fewPatterns = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 2,
        lookbackYears: 1,
        timeframe: '1d',
        cacheHitRatio: 0
      });
      
      const manyPatterns = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 8,
        lookbackYears: 1,
        timeframe: '1d',
        cacheHitRatio: 0
      });
      
      expect(manyPatterns.creditsEstimated).toBeGreaterThan(fewPatterns.creditsEstimated);
    });

    it('should cost more for 4h than 1d timeframe', () => {
      const daily = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '1d',
        cacheHitRatio: 0
      });
      
      const fourHour = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '4h',
        cacheHitRatio: 0
      });
      
      expect(fourHour.creditsEstimated).toBeGreaterThan(daily.creditsEstimated);
    });

    it('should reduce cost with cache hit ratio', () => {
      const noCache = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '1d',
        cacheHitRatio: 0
      });
      
      const fullCache = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '1d',
        cacheHitRatio: 1.0
      });
      
      expect(fullCache.breakdown.fetchOps).toBe(0);
      expect(fullCache.creditsEstimated).toBeLessThanOrEqual(noCache.creditsEstimated);
    });

    it('should match example cost: 50 symbols, 4H, 2y, 6 patterns ≈ 17 credits', () => {
      const result = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 50,
        patternCount: 6,
        lookbackYears: 2,
        timeframe: '4h',
        cacheHitRatio: 0
      });
      
      // Should be approximately 17 credits (within reasonable range)
      expect(result.creditsEstimated).toBeGreaterThanOrEqual(10);
      expect(result.creditsEstimated).toBeLessThanOrEqual(25);
    });
  });

  describe('estimateCredits - Pattern Lab', () => {
    it('should have higher base cost than Setup Finder', () => {
      const setupFinder = estimateCredits({
        projectType: 'setup_finder',
        instrumentCount: 10,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      const patternLab = estimateCredits({
        projectType: 'pattern_lab',
        instrumentCount: 10,
        patternCount: 3,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      expect(patternLab.breakdown.base).toBe(4);
      expect(setupFinder.breakdown.base).toBe(2);
    });

    it('should include simOps in calculation', () => {
      const result = estimateCredits({
        projectType: 'pattern_lab',
        instrumentCount: 10,
        patternCount: 4,
        lookbackYears: 5,
        timeframe: '1d',
        cacheHitRatio: 0
      });
      
      expect(result.breakdown.simOps).toBeGreaterThan(0);
    });
  });

  describe('estimateCredits - Portfolio Sim', () => {
    it('should include rebalance ops in calculation', () => {
      const result = estimateCredits({
        projectType: 'portfolio_sim',
        instrumentCount: 10,
        patternCount: 0,
        lookbackYears: 5,
        timeframe: '1d',
        rebalancePerYear: 12 // monthly
      });
      
      expect(result.breakdown.rebalanceOps).toBeGreaterThan(0);
    });

    it('should cost more with more frequent rebalancing', () => {
      const yearly = estimateCredits({
        projectType: 'portfolio_sim',
        instrumentCount: 10,
        patternCount: 0,
        lookbackYears: 5,
        timeframe: '1d',
        rebalancePerYear: 1
      });
      
      const monthly = estimateCredits({
        projectType: 'portfolio_sim',
        instrumentCount: 10,
        patternCount: 0,
        lookbackYears: 5,
        timeframe: '1d',
        rebalancePerYear: 12
      });
      
      expect(monthly.creditsEstimated).toBeGreaterThan(yearly.creditsEstimated);
    });
  });

  describe('estimateCredits - Portfolio Checkup', () => {
    it('should have lowest base cost', () => {
      const result = estimateCredits({
        projectType: 'portfolio_checkup',
        instrumentCount: 10,
        patternCount: 0,
        lookbackYears: 1,
        timeframe: '1d'
      });
      
      expect(result.breakdown.base).toBe(1);
    });
  });

  describe('Monotonicity guarantees', () => {
    it('more instruments always costs more', () => {
      for (const projectType of ['setup_finder', 'pattern_lab', 'portfolio_checkup', 'portfolio_sim'] as const) {
        const small = estimateCredits({
          projectType,
          instrumentCount: 5,
          patternCount: 2,
          lookbackYears: 1,
          timeframe: '1d'
        });
        
        const large = estimateCredits({
          projectType,
          instrumentCount: 50,
          patternCount: 2,
          lookbackYears: 1,
          timeframe: '1d'
        });
        
        expect(large.creditsEstimated).toBeGreaterThanOrEqual(small.creditsEstimated);
      }
    });

    it('more years always costs more', () => {
      for (const projectType of ['setup_finder', 'pattern_lab', 'portfolio_checkup', 'portfolio_sim'] as const) {
        const oneYear = estimateCredits({
          projectType,
          instrumentCount: 10,
          patternCount: 2,
          lookbackYears: 1,
          timeframe: '1d'
        });
        
        const fiveYears = estimateCredits({
          projectType,
          instrumentCount: 10,
          patternCount: 2,
          lookbackYears: 5,
          timeframe: '1d'
        });
        
        expect(fiveYears.creditsEstimated).toBeGreaterThanOrEqual(oneYear.creditsEstimated);
      }
    });
  });
});
