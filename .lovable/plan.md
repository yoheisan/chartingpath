

# Landing Page Redesign — TradingView-Inspired Simplification

## What Changes

### 1. Hero Section — Radical Simplification
Strip the hero down from 7 layers to 4, inspired by TradingView's "Look first / Then leap" approach:

- **Keep**: Badge, headline (2 lines), one subtitle line, ONE primary CTA
- **Remove**: Second subtitle line, "Create Free Account" button (move it down), trust row (3 checkmarks), copilot hint (⌘K), MetricStrip from hero
- **Single CTA**: "See Live Patterns Free" stays as the only hero button — big, bold, gradient
- **Add breathing room**: More vertical padding, let the headline speak

### 2. Move MetricStrip Below Hero
Reposition MetricStrip as its own lightweight section between hero and LivePatternPreview — acts as a visual separator and proof strip without cluttering the hero.

### 3. Consolidate "Create Free Account" CTA
Move the signup CTA to the mid-page CTA block only (which already exists). Remove it from the hero to eliminate competing actions.

### 4. Move Trust Signals
Relocate the trust checkmarks (Every signal backtested, Win rates shown upfront, No black-box indicators) into the MetricStrip section or remove entirely — they add noise in the hero.

### 5. Add Subtle Visual Element to Hero
Add a faint decorative chart/pattern SVG or gradient glow behind the headline to give "visual punch" similar to TradingView's hero imagery, without requiring an actual image asset.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Simplify hero: remove second CTA, trust row, copilot hint, extra subtitle. Move MetricStrip out of hero into its own section. Add subtle background glow. |

## Result
The hero becomes a focused 4-element stack: badge → headline → one subtitle → one CTA. Everything else moves lower where it reinforces rather than competes.

