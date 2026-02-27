# Elliott Wave Detection — Implementation Scope

> **Status:** Planned (not yet implemented)
> **Priority:** Medium — implement after harmonics
> **Estimated complexity:** Very High
> **Recommendation:** Start as confluence overlay before standalone scanning

---

## 1. Scope

### What to detect
- **5-wave impulse** (motive waves: 1-2-3-4-5)
- **ABC corrective** (corrective waves: A-B-C)
- **Primary trade signals:** Wave 3 breakout, Wave 5 exhaustion, Wave C completion

### What NOT to detect (initially)
- Complex corrections (WXY, WXYXZ, triangles within corrections)
- Sub-wave labeling (degree analysis)
- Leading/ending diagonals
- These can be added later as confidence in the base engine matures

---

## 2. Core Rules (Immutable)

These are the three cardinal rules that MUST be enforced. Any count violating these is automatically invalid.

| Rule | Description | Validation |
|------|-------------|------------|
| **Rule 1** | Wave 2 cannot retrace more than 100% of Wave 1 | `wave2_low > wave1_start` (bullish) |
| **Rule 2** | Wave 3 cannot be the shortest impulse wave | `wave3_length >= wave1_length OR wave3_length >= wave5_length` |
| **Rule 3** | Wave 4 cannot overlap Wave 1 price territory | `wave4_low > wave1_high` (bullish) |

### Guidelines (Soft Rules — Feed Quality Score)
- Wave 2 typically retraces 50–61.8% of Wave 1
- Wave 3 is often 1.618× Wave 1
- Wave 4 typically retraces 38.2% of Wave 3
- Wave 5 ≈ Wave 1 in length (or 0.618–1.0× Wave 1)
- Alternation: if Wave 2 is sharp, Wave 4 tends to be sideways (and vice versa)

---

## 3. Detection Approach

### State Machine Architecture

```
States: IDLE → W1_FORMING → W2_FORMING → W3_FORMING → W4_FORMING → W5_FORMING → COMPLETE
                                                                                    ↓
                                                                              ABC_A → ABC_B → ABC_C → CORRECTIVE_COMPLETE

Transitions triggered by:
- New zigzag pivot detected
- Rule validation pass/fail
- Fibonacci ratio measurement
```

### Algorithm Outline

```
1. Identify zigzag pivots (reuse existing infrastructure from VisualSpec.ts)
2. Start with most recent significant low (bullish) or high (bearish) as potential Wave 1 start
3. For each new pivot:
   a. Attempt to assign it as the next wave endpoint
   b. Validate all cardinal rules
   c. If rules pass: advance state, measure Fib ratios, update confidence
   d. If rules fail: invalidate count, try alternate labeling
4. When 5 waves complete:
   a. Score the count
   b. Project ABC corrective targets
   c. Emit signal based on trade logic
5. Maintain top-N competing counts ranked by confidence
```

### Pivot Reuse
The existing `ZigZagPivot[]` in `VisualSpec.ts` and the pivot detection in `patternDetectors.ts` provide the foundation. Elliott Wave detection layers on top by applying wave-counting rules to pivot sequences.

---

## 4. Handling Ambiguity

### The Core Challenge
Elliott Wave analysis is inherently subjective. Two analysts can look at the same chart and produce different valid wave counts. The engine must handle this gracefully.

### Approach: Confidence-Ranked Competing Counts

```typescript
interface WaveCount {
  id: string;
  direction: 'bullish' | 'bearish';
  degree: 'primary' | 'intermediate' | 'minor';
  waves: WavePoint[];         // 5 points for impulse, 3 for corrective
  currentWave: number;        // which wave is currently forming (1-5 or A-C)
  confidence: number;         // 0-100
  rulesViolated: string[];    // should be empty for valid counts
  guidelinesScore: number;    // 0-10 based on soft rules
  fibRelationships: FibRatio[];
}
```

- Maintain up to **3 competing counts** per instrument
- Present the highest-confidence count as primary
- Show alternate counts as secondary (optional UI toggle)
- If no count exceeds 60% confidence, flag as "ambiguous — no signal"

---

## 5. Entry Logic

### Signal 1: Wave 3 Breakout (Primary)
- **Trigger:** Wave 2 completes (confirmed by reversal), price breaks above Wave 1 high
- **Entry type:** Close-based breakout (compatible with existing engine)
- **SL:** Below Wave 2 low
- **TP:** Wave 1 length × 1.618 projected from Wave 2 low
- **Quality:** Highest confidence signal — Wave 3 is typically the strongest move

### Signal 2: Wave 5 Exhaustion (Secondary)
- **Trigger:** Wave 5 reaches projected target zone (Wave 1 × 0.618–1.0 from Wave 4)
- **Entry type:** Limit order with reversal confirmation (similar to harmonics)
- **SL:** Beyond Wave 5 extension (1.272× Wave 1 from Wave 4)
- **TP:** Wave 4 level, then Wave 2 level
- **Quality:** Counter-trend — lower confidence, requires strong reversal candle

### Signal 3: Wave C Completion (Tertiary)
- **Trigger:** ABC correction completes at projected C target (typically Wave A × 1.0–1.618)
- **Entry type:** Limit order at C projection
- **SL:** Beyond C extension
- **TP:** New impulse Wave 3 target
- **Quality:** Best RR but requires accurate count of prior 5-wave impulse

---

## 6. Required Infrastructure

### Backend (Edge Functions)

#### New file: `supabase/functions/_shared/elliottWaveDetector.ts`
- `detectImpulse(pivots: ZigZagPivot[]): WaveCount[]`
- `detectCorrective(pivots: ZigZagPivot[], priorImpulse: WaveCount): WaveCount[]`
- `validateRules(count: WaveCount): { valid: boolean; violations: string[] }`
- `scoreCount(count: WaveCount): number`
- `projectTargets(count: WaveCount): WaveTargets`
- Helper: `measureWaveRelationships(waves: WavePoint[]): FibRatio[]`

#### Integration: `supabase/functions/scan-live-patterns/index.ts`
- Add Elliott Wave scan pass (runs after classical + harmonic)
- Needs more bar history than harmonics (~150–200 bars for reliable wave counting)
- Consider separate scan cadence if compute is too heavy (every 4H instead of every 1H)

### Database

#### Option A: New columns on `live_pattern_detections`
- `wave_count`: JSONB — full `WaveCount` object
- `current_wave_number`: integer (1-5 or null)
- `wave_confidence`: numeric (0-100)
- `alternate_counts`: JSONB array — competing interpretations

#### Option B: New table `elliott_wave_counts` (preferred for clean separation)
```sql
CREATE TABLE elliott_wave_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  direction TEXT NOT NULL,
  degree TEXT NOT NULL,
  current_wave INTEGER NOT NULL,
  wave_points JSONB NOT NULL,
  confidence NUMERIC NOT NULL,
  fib_relationships JSONB,
  rules_valid BOOLEAN NOT NULL,
  guidelines_score NUMERIC,
  is_primary_count BOOLEAN DEFAULT true,
  detected_at TIMESTAMPTZ NOT NULL,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Frontend

#### VisualSpec extensions (`src/types/VisualSpec.ts`):
```typescript
export interface WavePoint {
  waveNumber: number | string;  // 1-5 or 'A'-'C'
  price: number;
  timestamp: string;
  pivotIndex: number;
}

export interface ElliottWaveOverlay {
  type: 'elliott_wave';
  id: string;
  direction: 'bullish' | 'bearish';
  waves: WavePoint[];
  currentWave: number;
  confidence: number;
  isPrimaryCount: boolean;
  projectedTargets?: {
    wave3Target?: number;
    wave5Target?: number;
    waveCTarget?: number;
  };
  style: 'primary' | 'muted';  // primary count vs alternate
}
```
- Add `ElliottWaveOverlay` to the `Overlay` union type

#### SVG Renderer (`src/components/PrescriptivePatternSVG.tsx`):
- Draw wave labels (circled numbers: ①②③④⑤ or Ⓐ Ⓑ Ⓒ)
- Connect wave points with lines
- Shade projected target zones (e.g., Wave 3 target area)
- Alternate counts rendered in muted style with dashed lines
- Color coding: impulse waves in primary color, corrective in muted

#### Screener types (`src/types/screener.ts`):
- `LiveSetup.waveCount` optional field
- `LiveSetup.currentWave` optional field
- `LiveSetup.waveConfidence` optional field

---

## 7. Quality Scoring

Elliott Wave quality score (0–10) based on:

| Factor                | Weight | Description                                              |
|-----------------------|--------|----------------------------------------------------------|
| Rule adherence        | 30%    | All 3 cardinal rules pass (binary — 0 or full score)     |
| Guideline adherence   | 25%    | How closely Fib ratios match ideal guidelines             |
| Count uniqueness      | 15%    | Gap between primary and alternate count confidence        |
| Wave 3 strength       | 15%    | Wave 3 volume and momentum vs other waves                 |
| Alternation           | 10%    | Wave 2 and Wave 4 show different character                |
| Trend alignment       | 5%     | Higher-timeframe trend aligns with impulse direction      |

### Minimum Thresholds
- Score < 4: Do not emit signal
- Score 4–6: Emit with "low confidence" warning
- Score 7+: Standard signal quality

---

## 8. Confluence Overlay Mode (Recommended First Step)

Before building standalone Elliott Wave scanning, implement as a **confluence filter** on existing patterns:

### How it works
1. When a classical pattern is detected (e.g., Bull Flag on EURUSD 4H)
2. Run Elliott Wave count on the same instrument/timeframe
3. If the pattern aligns with a favorable wave position:
   - Bull Flag at start of Wave 3 → **boost quality score by +1.5**
   - Double Bottom completing Wave C → **boost quality score by +1.0**
4. If the pattern conflicts with wave position:
   - Bull Flag in late Wave 5 (exhaustion zone) → **add warning**

### Benefits
- Lower implementation cost (no separate scan infrastructure)
- Adds value to existing patterns immediately
- Tests wave-counting logic before full standalone launch
- Users get Elliott Wave insights without a separate scanner tab

---

## 9. Compute Considerations

| Concern | Mitigation |
|---------|------------|
| Wave counting is O(n²) on pivots | Limit pivot window to 200 bars max |
| Multiple competing counts multiply compute | Cap at 3 competing counts per instrument |
| Full scan across all instruments is heavy | Consider async processing or separate scan cadence |
| State must persist between scans | Use DB table to store current count state |

---

## 10. Implementation Order

1. **Phase 0 (Confluence):** Wave count as quality overlay on existing patterns
2. **Phase 1:** `elliottWaveDetector.ts` — 5-wave impulse detection with rule validation
3. **Phase 2:** ABC corrective detection after completed impulse
4. **Phase 3:** SVG renderer for wave labels and projections
5. **Phase 4:** Confidence scoring and competing count management
6. **Phase 5:** Standalone screener integration with Wave 3 breakout signals
7. **Phase 6:** Wave 5 exhaustion and Wave C completion signals

---

## 11. Files That Will Need Modification

| File | Change Type |
|------|-------------|
| `supabase/functions/_shared/elliottWaveDetector.ts` | **New file** — wave counting logic |
| `supabase/functions/scan-live-patterns/index.ts` | Add wave scan pass or confluence check |
| `src/types/VisualSpec.ts` | Add `ElliottWaveOverlay` to Overlay union |
| `src/types/screener.ts` | Add optional wave fields to `LiveSetup` |
| `src/components/PrescriptivePatternSVG.tsx` | Add wave label rendering path |
| DB migration | New table or columns for wave count state |
