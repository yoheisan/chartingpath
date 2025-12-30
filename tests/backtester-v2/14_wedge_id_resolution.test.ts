/**
 * Wedge Mode ID Resolution Tests
 * 
 * Tests the resolveWedgePatternId contract to ensure correct fallback behavior
 * in all 4 cases of patternId/id validity combinations.
 * 
 * This is a unit test for the ID resolution logic that runs in the edge function.
 * Since the edge function runs in Deno, we replicate the core logic here for testing.
 */

import { describe, it, expect } from '@jest/globals';

// ============================================
// REPLICATED CORE LOGIC (from edge function)
// ============================================

function normalizePatternId(patternId: string): string {
  return patternId.toLowerCase().replace(/_/g, '-').trim();
}

function getBasePatternId(patternIdOrInstanceId: string): string {
  const normalized = normalizePatternId(patternIdOrInstanceId);
  const withoutTimestamp = normalized.replace(/-\d{10,}$/, '');
  return withoutTimestamp;
}

const VALID_WEDGE_PATTERN_IDS = new Set([
  'donchian-breakout-long',
  'donchian-breakout-short',
  'double-top',
  'double-bottom',
  'ascending-triangle',
  'descending-triangle'
]);

interface WedgeIdResolution {
  baseId: string | null;
  sourceField: 'patternId' | 'id' | null;
  rejection: { reason: string } | null;
}

function resolveWedgePatternId(pattern: any): WedgeIdResolution {
  const patternName = pattern.name || pattern.patternType || 'unknown';
  const validKeysCount = VALID_WEDGE_PATTERN_IDS.size;
  
  // Step 1: Try patternId first (canonical source)
  if (pattern.patternId) {
    const baseFromPatternId = getBasePatternId(pattern.patternId);
    if (VALID_WEDGE_PATTERN_IDS.has(baseFromPatternId)) {
      // If both patternId and id exist, verify they resolve to the same base
      if (pattern.id) {
        const baseFromId = getBasePatternId(pattern.id);
        // Only reject if BOTH are valid but DIFFERENT
        if (VALID_WEDGE_PATTERN_IDS.has(baseFromId) && baseFromPatternId !== baseFromId) {
          return {
            baseId: null,
            sourceField: null,
            rejection: {
              reason: `ID mismatch: patternId base="${baseFromPatternId}" differs from id base="${baseFromId}".`
            }
          };
        }
      }
      return { baseId: baseFromPatternId, sourceField: 'patternId', rejection: null };
    }
  }
  
  // Step 2: Fallback to id (instance ID with timestamp)
  if (pattern.id) {
    const baseFromId = getBasePatternId(pattern.id);
    if (VALID_WEDGE_PATTERN_IDS.has(baseFromId)) {
      return { baseId: baseFromId, sourceField: 'id', rejection: null };
    }
  }
  
  // Step 3: Reject - neither patternId nor id is valid
  return {
    baseId: null,
    sourceField: null,
    rejection: {
      reason: `No valid registry key found. patternId="${pattern.patternId || 'undefined'}", id="${pattern.id || 'undefined'}".`
    }
  };
}

// ============================================
// TESTS
// ============================================

describe('Wedge ID Resolution Contract', () => {
  
  describe('Case 1: Both valid and same base', () => {
    it('accepts via patternId when both resolve to same base', () => {
      const pattern = {
        patternId: 'donchian-breakout-long',
        id: 'donchian_breakout_long_1767075844752',
        name: 'Donchian Breakout (Long)'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBe('donchian-breakout-long');
      expect(result.sourceField).toBe('patternId');
      expect(result.rejection).toBeNull();
    });
    
    it('handles hyphen patternId with underscore+timestamp id', () => {
      const pattern = {
        patternId: 'double-top',
        id: 'double_top_1767000000000',
        name: 'Double Top'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBe('double-top');
      expect(result.sourceField).toBe('patternId');
      expect(result.rejection).toBeNull();
    });
  });
  
  describe('Case 2: Both valid but different bases', () => {
    it('rejects with mismatch error when both valid but different', () => {
      const pattern = {
        patternId: 'donchian-breakout-long',
        id: 'double_top_1767000000000',
        name: 'Mismatched Pattern'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBeNull();
      expect(result.sourceField).toBeNull();
      expect(result.rejection).not.toBeNull();
      expect(result.rejection!.reason).toContain('ID mismatch');
      expect(result.rejection!.reason).toContain('donchian-breakout-long');
      expect(result.rejection!.reason).toContain('double-top');
    });
  });
  
  describe('Case 3: patternId INVALID, id VALID - MUST accept via id fallback', () => {
    it('accepts via id when patternId is invalid but id is valid', () => {
      const pattern = {
        patternId: 'invalid-pattern-xyz',
        id: 'donchian_breakout_long_1767075844752',
        name: 'Should Fallback to ID'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBe('donchian-breakout-long');
      expect(result.sourceField).toBe('id');
      expect(result.rejection).toBeNull();
    });
    
    it('accepts via id when patternId is garbage but id is valid', () => {
      const pattern = {
        patternId: 'garbage_123_xyz',
        id: 'ascending_triangle_1767000000000',
        name: 'Garbage patternId'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBe('ascending-triangle');
      expect(result.sourceField).toBe('id');
      expect(result.rejection).toBeNull();
    });
    
    it('accepts via id when patternId is undefined but id is valid', () => {
      const pattern = {
        patternId: undefined,
        id: 'double_bottom_1767000000000',
        name: 'No patternId'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBe('double-bottom');
      expect(result.sourceField).toBe('id');
      expect(result.rejection).toBeNull();
    });
  });
  
  describe('Case 4: patternId VALID, id INVALID - accepts via patternId', () => {
    it('accepts via patternId when id is invalid', () => {
      const pattern = {
        patternId: 'donchian-breakout-short',
        id: 'garbage_invalid_id_1767000000000',
        name: 'Invalid ID'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBe('donchian-breakout-short');
      expect(result.sourceField).toBe('patternId');
      expect(result.rejection).toBeNull();
    });
    
    it('accepts via patternId when id is undefined', () => {
      const pattern = {
        patternId: 'descending-triangle',
        id: undefined,
        name: 'No ID'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBe('descending-triangle');
      expect(result.sourceField).toBe('patternId');
      expect(result.rejection).toBeNull();
    });
  });
  
  describe('Edge Cases', () => {
    it('rejects when both patternId and id are invalid', () => {
      const pattern = {
        patternId: 'invalid-xyz',
        id: 'also_invalid_123',
        name: 'Both Invalid'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBeNull();
      expect(result.rejection).not.toBeNull();
      expect(result.rejection!.reason).toContain('No valid registry key found');
    });
    
    it('rejects when both are undefined', () => {
      const pattern = {
        name: 'No IDs'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBeNull();
      expect(result.rejection).not.toBeNull();
    });
    
    it('correctly strips timestamp suffixes from id', () => {
      const pattern = {
        id: 'donchian_breakout_long_1767075844752123',
        name: 'Long timestamp'
      };
      
      const result = resolveWedgePatternId(pattern);
      
      expect(result.baseId).toBe('donchian-breakout-long');
      expect(result.sourceField).toBe('id');
    });
  });
});

describe('getBasePatternId normalization', () => {
  it('converts underscores to hyphens', () => {
    expect(getBasePatternId('donchian_breakout_long')).toBe('donchian-breakout-long');
  });
  
  it('strips timestamp suffix', () => {
    expect(getBasePatternId('donchian_breakout_long_1767075844752')).toBe('donchian-breakout-long');
  });
  
  it('handles already-hyphenated input', () => {
    expect(getBasePatternId('donchian-breakout-long')).toBe('donchian-breakout-long');
  });
  
  it('lowercases input', () => {
    expect(getBasePatternId('DOUBLE_TOP')).toBe('double-top');
  });
});
