

# Add TP Coherence Guard Before Pattern Push

## What
Add a coherence check after bracket levels are computed (line 1542) and quality score is calculated (line 1623), but before the pattern is pushed to `detectedPatterns` (line 1625). If the take profit price is on the wrong side of entry for the pattern's direction, the pattern is skipped with a warning log.

## Where
**File:** `supabase/functions/scan-live-patterns/index.ts`

**Insert between lines 1623 and 1625** (after `const qualityResult = ...` and before `detectedPatterns.push({`):

```typescript
        // Coherence: TP must be on the correct side of entry for the pattern's direction
        const tpCoherent = effectiveDirection === 'long'
          ? bracketLevels.takeProfitPrice > lastBar.close
          : bracketLevels.takeProfitPrice < lastBar.close;

        if (!tpCoherent) {
          console.warn(`[scan-live-patterns] Coherence violation blocked: ${patternId} ${effectiveDirection} on ${instrument}`);
          continue; // skip this pattern entirely
        }
```

## What does NOT change
- No detection logic changes
- No bracket computation changes
- No quality scorer changes
- The `detectedPatterns.push()` call and everything after it stays identical

## After
Redeploy `scan-live-patterns` edge function.

