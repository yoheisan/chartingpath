

# Future Feature Scope: Harmonic Patterns + Elliott Wave Detection

This plan creates two scope specification files that document everything needed to implement these features later. No detection logic, no DB changes, no edge functions — just comprehensive blueprints stored in the codebase.

---

## What Gets Created

### 1. `src/specs/harmonic-patterns-scope.md`
A markdown specification covering:

- **Patterns in scope**: Bat, Gartley, Butterfly, Crab (the 4 core harmonics)
- **Detection methodology**: Fibonacci ratio tables for each pattern (e.g., Bat: XA to B = 0.382-0.50, BC to D = 1.618-2.618, D completion = 0.886 of XA)
- **How it differs from current engine**: Current engine uses structural pivot detection with close-based confirmation; harmonics require Fibonacci swing measurement between XABCD legs
- **Entry logic**: Limit order at projected D-point (not close-based breakout), with optional close-confirmation filter
- **Required infrastructure**:
  - New `harmonicDetectors.ts` shared module (parallel to `patternDetectors.ts`)
  - New DB columns on `live_pattern_detections` for Fib ratios and XABCD coordinates
  - New SVG renderer for XABCD leg visualization
  - Integration point in `scan-live-patterns` edge function
- **Quality scoring**: How to score harmonic completions (ratio precision, volume at D, trend context)
- **Asset/timeframe suitability**: Forex and Stocks on 1H/4H/1D (not suitable for 5M due to noise)
- **Estimated complexity**: High — new detection paradigm, new visualization, new DB schema

### 2. `src/specs/elliott-wave-scope.md`
A markdown specification covering:

- **Scope**: 5-wave impulse detection + ABC corrective identification
- **Core rules**: Wave 2 cannot retrace more than 100% of Wave 1, Wave 3 cannot be the shortest impulse wave, Wave 4 cannot overlap Wave 1 price territory
- **Detection approach**: State machine using zigzag pivots (reusing existing pivot infrastructure) with rule validation at each step
- **Key challenge**: Ambiguity — multiple valid wave counts can exist simultaneously; specification documents how to handle this (confidence ranking of competing counts)
- **Entry logic**: Wave 3 breakout (close-based, compatible with current engine) or Wave 5 exhaustion (limit-based, like harmonics)
- **Required infrastructure**:
  - New `elliottWaveDetector.ts` shared module
  - New DB table or columns for wave count state (current wave number, pivot coordinates, confidence)
  - New SVG renderer for wave labels (1-2-3-4-5 / A-B-C)
  - Potentially a separate scan cadence (wave counting is computationally heavier)
- **Quality scoring**: Based on rule adherence, Fibonacci relationships between waves, volume profile
- **Estimated complexity**: Very high — subjective pattern, competing interpretations, heavy compute
- **Recommendation**: Implement as confluence overlay first (flag when existing pattern aligns with a Wave 3/5 zone) before standalone scanning

---

## Technical Details

### File locations
Both specs go in a new `src/specs/` directory, keeping them close to the codebase but clearly separated as planning documents.

### Integration points documented
Each spec will reference the exact files that would need modification:
- `supabase/functions/_shared/patternDetectors.ts` — where new detectors plug in
- `supabase/functions/scan-live-patterns/index.ts` — main scan orchestrator
- `src/types/VisualSpec.ts` — visual spec extensions needed
- `src/types/screener.ts` — LiveSetup type extensions
- `src/components/PrescriptivePatternSVG.tsx` — new SVG renderers

### No code changes
This plan only creates two markdown specification files. No detection logic, no database migrations, no edge function changes.

