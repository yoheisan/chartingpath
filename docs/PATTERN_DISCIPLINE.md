# ChartingPath — Pattern Identification & Rendering Discipline

> **Version:** 1.0.0  
> **Last Updated:** 2026-03-04  
> **Authority:** This is the single source of truth for pattern identification logic, directional coherence, filtering rules, and social chart rendering.  
> **Companion to:** `docs/UI_UX_SPEC.md` (visual design) — both documents must be consulted together.  
> **Rule:** Before implementing any pattern detection, filtering, or chart rendering logic, consult this document first.

---

## 1. Design Philosophy — Apple-Style Discipline

| Principle | Description |
|---|---|
| **Zero-Noise Output** | Never surface a pattern that contradicts its own trade levels or structural logic |
| **Deterministic Direction** | Direction is ALWAYS derived from trade levels (TP > Entry = Long), never from a raw database field |
| **Contextual Integrity** | Reversal patterns require a qualifying prior trend; continuation patterns require a qualifying impulse |
| **Progressive Disclosure** | Show only actionable, validated signals — hide everything else entirely (no grey, no dimmed, no stale) |
| **Institutional Credibility** | Every public-facing chart must pass coherence, context, and visual fidelity checks before rendering |

---

## 2. Pattern-Direction Coherence (Mandatory)

Every pattern has an **inherent directional bias**. The direction displayed in UI, tweets, and charts must match this bias. If the database `direction` field conflicts with the pattern's inherent bias or the trade levels, the **trade levels are the source of truth**.

### 2.1 Direction Derivation Rule

```
IF take_profit_price > entry_price → direction = LONG
IF take_profit_price < entry_price → direction = SHORT
```

This rule overrides the `direction` field from `live_pattern_detections` in ALL rendering contexts.

### 2.2 Inherent Pattern Directions

| Pattern | Inherent Direction | Rationale |
|---|---|---|
| Double Bottom | **Long** (bullish reversal) | Two equal lows → neckline breakout upward |
| Triple Bottom | **Long** (bullish reversal) | Three equal lows → neckline breakout upward |
| Inverse Head & Shoulders | **Long** (bullish reversal) | Lower head between higher shoulders → breakout up |
| Falling Wedge | **Long** (bullish reversal) | Converging downward → breakout upward |
| Cup & Handle | **Long** (bullish continuation) | U-shape recovery with handle → breakout up |
| Bull Flag | **Long** (bullish continuation) | Small pullback after impulse → continuation up |
| Ascending Triangle | **Long** (bullish) | Flat top + rising bottoms → breakout up |
| Double Top | **Short** (bearish reversal) | Two equal highs → neckline breakdown |
| Triple Top | **Short** (bearish reversal) | Three equal highs → neckline breakdown |
| Head & Shoulders | **Short** (bearish reversal) | Higher head between lower shoulders → breakdown |
| Rising Wedge | **Short** (bearish reversal) | Converging upward → breakdown |
| Bear Flag | **Short** (bearish continuation) | Small rally after impulse → continuation down |
| Descending Triangle | **Short** (bearish) | Flat bottom + falling tops → breakdown |

### 2.3 Coherence Guard

Any pattern whose database `direction` conflicts with its inherent direction in §2.2 **MUST be blocked** from:
- Social media posting
- Email alerts
- Featured screener slots

The pattern remains in the database for audit purposes but is never surfaced publicly.

---

## 3. Contextual Filtering Rules

### 3.1 Trend Alignment Requirement

All publicly surfaced patterns must have a `trend_alignment` value. Patterns without trend data are **excluded** from public channels.

| Alignment | Allowed for Posting? | Notes |
|---|---|---|
| `with_trend` | ✅ Yes | Highest conviction — pattern aligns with dominant trend |
| `neutral` / `sideways` | ✅ Yes | Acceptable — range-bound context |
| `counter_trend` | ❌ No | Blocked from social, alerts, and featured screener |
| `null` / missing | ❌ No | Blocked — insufficient context for public credibility |

### 3.2 Reversal Pattern Context Rules

Reversal patterns require a **qualifying prior trend** to be valid per Bulkowski methodology:

| Pattern Type | Required Prior Trend | Minimum Trend | Rationale |
|---|---|---|---|
| Bearish Reversals (Double Top, H&S, Rising Wedge) | Prior **uptrend** | ≥2–3% | Must reverse an existing move upward |
| Bullish Reversals (Double Bottom, Inv H&S, Falling Wedge) | Prior **downtrend** | ≥2–3% | Must reverse an existing move downward |

A reversal pattern detected in a **sideways** market or **against** the required prior trend context is filtered from public output.

### 3.3 Continuation Pattern Context Rules

| Pattern Type | Required Context | Minimum Impulse |
|---|---|---|
| Bull Flag, Cup & Handle | Prior **uptrend** (pole/impulse) | ≥5% prior move (stocks/crypto) |
| Bear Flag | Prior **downtrend** (pole/impulse) | ≥5% prior move |

### 3.4 Cup & Handle — Hybrid Depth Methodology

Cup & Handle detection uses a **hybrid depth threshold** to accommodate the structural differences between asset classes:

| Asset Class | Depth Method | Minimum Cup Depth | Rationale |
|---|---|---|---|
| **FX** | Range-relative | ≥30% of lookback window's high-low range | FX daily ranges are 0.5–1.5%; a fixed 10% threshold would never trigger. Using range-relative normalizes the formation to the pair's own volatility structure. |
| **Stocks, Crypto, ETFs, Commodities, Indices** | Fixed percentage | ≥10% absolute price depth | Larger absolute price swings make fixed thresholds reliable and battle-tested per Bulkowski. |

**Prior Rise Check:** Also range-relative across all asset classes — the early 5-bar rise must be ≥15% of the window's total range (replacing the previous fixed 5% threshold). This ensures the "prior uptrend" requirement scales with volatility.

**Maximum Depth Cap:** 40% (all asset classes) — cups deeper than 40% indicate a structural breakdown rather than a consolidation pattern.

**Rim Symmetry:** Left and right rims must be within 10% of each other (unchanged).

> **Design Decision (2026-03-14):** The hybrid approach was validated via dry-run testing across 8 FX pairs and 5 stock/crypto tickers. Universal range-relative (30%) over-detected on stocks (118.8/ticker); the hybrid reduced stocks to 34/ticker while enabling FX detection from 0 → 67.9/ticker. See `supabase/functions/validate-detector-dryrun/` for validation tooling.

### 3.5 Structural Validation Guards

| Guard | Rule | Effect |
|---|---|---|
| **Pivot Resolution** | Pattern's first-to-last pivot span must be ≥2 bars at chart resolution | Prevents collapsed overlays |
| **Price Drift** | Entry price must be within 4% of current close (6% for 4H+) | Hides stale levels |
| **Extreme Filter** | Any level >35% from latest close | Hides ALL trade plan lines and zones |
| **Zone Sync Guard** | Entry must be within 3% of current close AND (reached or ≤3% away) for TP/SL shaded zones to render | Prevents visually disconnected zones above/below candles |
| **ATR Stop Floor** | SL must be ≥1× ATR from entry | Prevents unrealistic stops |
| **Minimum R:R** | Trade must offer ≥1.5:1 R:R | Ensures positive expectancy potential |

---

## 4. Formation Zone Rendering

The formation zone visually identifies the **structural period** where the pattern formed.

### 4.1 Zone Boundaries

| Property | Value | Source |
|---|---|---|
| **Start X** | First pivot timestamp | `pivots[0].timestamp` or `pivots[0].index` |
| **End X** | Last pivot timestamp | `pivots[N-1].timestamp` or `pivots[N-1].index` |
| **Start Y** | Chart top (full height) | `padding.top` |
| **End Y** | Chart bottom (full height) | `padding.top + chartHeight` |

> **⚠️ CRITICAL:** The formation zone spans **first pivot to last pivot**, NOT `window.startTs` to signal. Using `window.startTs` causes the zone to cover the entire prior price history, which is visually incorrect and misleading.

### 4.2 Fallback

If no pivots are available, fall back to `window.startTs` → `signalTs`, but this is a degraded mode and should be logged.

### 4.3 Visual Properties

| Property | Value |
|---|---|
| Color | `rgba(59, 130, 246, 0.04)` — per UI/UX Spec §2.2 Time Range Zone |
| Label | `"Formation Period"` centered at top of zone |
| Label Color | `#3b82f6` at 60% opacity |
| Label Size | 9px monospace |

---

## 5. Social Chart Rendering Spec (SVG/PNG)

All charts posted to social media or shared externally must follow these rules:

### 5.1 Canvas Dimensions

| Property | Value |
|---|---|
| Width | 800px |
| Height | 400px |
| Right Margin | 140px (accommodates "ENTRY: 1234.56" labels) |
| Left Margin | 10px |
| Top Margin | 50px (title bar) |
| Bottom Margin | 30px (watermark) |
| Background | `#0f0f0f` (dark theme only) |

### 5.2 Required Visual Elements

Every social chart **must** include:

| Element | Color/Style | Required? |
|---|---|---|
| Candlesticks | Green up / Red down | ✅ Always |
| Entry Line | `#3b82f6` solid, width 2 | ✅ Always |
| SL Line | `#ef4444` dashed, width 1 | ✅ Always |
| TP Line | `#22c55e` dashed, width 1 | ✅ Always |
| TP Zone Shading | `rgba(34, 197, 94, 0.06)` | ✅ Always |
| SL Zone Shading | `rgba(239, 68, 68, 0.06)` | ✅ Always |
| Formation Zone | `rgba(59, 130, 246, 0.04)` vertical time range at pivots | ✅ When pivots available |
| ZigZag Polyline | `rgba(0, 200, 255, 0.85)` width 2 | ✅ When pivots available |
| Pivot Labels | Cyan, 9px monospace | ✅ When pivots available |
| Entry Triangle | `#3b82f6` blue, ▲ long / ▼ short | ✅ Always |
| Detection Arrow | `#f97316` orange | ✅ When signal timestamp available |
| Title | Symbol + Pattern name + Timeframe | ✅ Always |
| Direction Label | "↑ LONG" green or "↓ SHORT" red | ✅ Always (derived from levels) |
| Grade Badge | Green border, top-right corner | ✅ Always |
| Watermark | "ChartingPath.com" centered bottom | ✅ Always |

### 5.3 Label Standards

Right-side axis labels **must** use spec-standard terminology:

| Label | Format |
|---|---|
| Entry | `ENTRY: {price}` |
| Stop Loss | `SL: {price}` |
| Take Profit | `TP: {price}` |

> **Never** use "Stop:", "Target:", or any other variant. These labels are overridden in the renderer regardless of what the overlay data contains.

### 5.4 Entry Triangle Fallback

If `entryBarIndex` is not set in the visual spec:
1. Fall back to the bar at `signalTs` timestamp
2. Anchor to candle extreme (low for long, high for short) for visual connection
3. Triangle size: 8px

---

## 6. Pre-Publish Checklist

Before any pattern reaches a public channel (social, email, screener), it must pass ALL of these checks:

| # | Check | Failure Action |
|---|---|---|
| 1 | Direction coherence: pattern type matches trade level direction | **Block** — do not post |
| 2 | Trend alignment is not `counter_trend` or `null` | **Block** — do not post |
| 3 | Reversal patterns have qualifying prior trend | **Block** — do not post |
| 4 | Trade levels pass ATR floor and R:R minimum | **Block** — do not post |
| 5 | Price drift within threshold for timeframe | **Block** — stale signal |
| 6 | Chart has bar data for rendering | **Degrade** — post text-only |
| 7 | Visual spec has pivots for formation zone | **Degrade** — skip formation zone |

---

## 7. Anti-Patterns (Never Do This)

| ❌ Don't | ✅ Do Instead |
|---|---|
| Trust database `direction` field blindly | Derive direction from TP vs Entry price |
| Post a Double Bottom as SHORT | Block — coherence violation |
| Post a Double Top without prior uptrend | Block — context violation |
| Use `window.startTs` for formation zone | Use first-to-last pivot span |
| Show formation zone covering 80%+ of chart | Zone should only span the structural pivots |
| Use "Stop:" or "Target:" labels | Use "SL:" and "TP:" per spec |
| Clip right-side labels | Use 140px right margin minimum |
| Post patterns with `counter_trend` alignment | Block entirely from public channels |
| Post patterns without trend data | Block — insufficient context |

---

## 8. Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-03-04 | Initial specification codified from implementation learnings and UI/UX spec alignment |
