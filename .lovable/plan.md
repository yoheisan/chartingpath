

# Add Performance Floor to Repeatability Gate

## Summary
Add a "performance floor" block in the repeatability gate section that prevents patterns with strong historical proof from being graded too low. This ensures statistically proven patterns never fall below B (strong proof) or C (sufficient proof).

## File
`supabase/functions/_shared/patternQualityScorer.ts`

## Change
Insert the following block at **line 1072** (immediately before `if (repeatabilityWarning)`):

```typescript
  // PERFORMANCE FLOOR: Strong historical proof overrides poor form score
  // If a pattern has proven statistical edge, it should never grade below B
  const thresholdsForFloor = ASSET_CLASS_THRESHOLDS[input.assetType ?? 'stocks'] ?? ASSET_CLASS_THRESHOLDS['stocks'];
  if (repeatabilityProof) {
    const { sampleSize, winRate, expectancyR } = repeatabilityProof;
    const meetsAGate = sampleSize >= thresholdsForFloor.aMinSample && winRate >= thresholdsForFloor.aWinRate && expectancyR > 0;
    const meetsBGate = sampleSize >= thresholdsForFloor.bMinSample && winRate >= thresholdsForFloor.bWinRate;
    if (meetsAGate && (grade === 'C' || grade === 'D' || grade === 'F')) {
      grade = 'B';
      warnings.push(`Grade floored to B: strong historical proof (n=${sampleSize}, win=${winRate.toFixed(1)}%)`);
    } else if (meetsBGate && (grade === 'D' || grade === 'F')) {
      grade = 'C';
      warnings.push(`Grade floored to C: sufficient historical proof (n=${sampleSize}, win=${winRate.toFixed(1)}%)`);
    }
  }
```

**Note**: The user's code references `getAssetThresholds(assetType)` but no such function exists. I'll use the existing pattern: `ASSET_CLASS_THRESHOLDS[input.assetType ?? 'stocks']` — identical to how `assetThresholds` is already computed on line 1050.

No SQL migrations. Single file edit.

