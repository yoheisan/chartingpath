# ChartingPath — UI/UX Visual Specification

> **Version:** 1.1.0  
> **Last Updated:** 2026-03-04  
> **Authority:** This is the single source of truth for all visual design decisions.  
> **Companion:** `docs/PATTERN_DISCIPLINE.md` — pattern identification logic, direction coherence, filtering rules, and social chart rendering.  
> **Rule:** Before implementing or describing any visual element, consult this document AND the Pattern Discipline document.

---

## 1. Design Philosophy

| Principle | Description |
|---|---|
| **TradingView-Inspired Minimalism** | 1px borders, muted grids, dominant chart viewport (55–100% of screen) |
| **Apple-Style Progressive Disclosure** | Show only what's relevant; collapse complexity until requested |
| **High-Signal Focus** | Remove noise — never show non-actionable visual elements |
| **Outcome-Anchored Credibility** | Show sample sizes and expectancy, not aspirational grades |

---

## 2. Color System

### 2.1 Trade Plan Colors

| Element | Hex | HSL | Usage |
|---|---|---|---|
| **Entry** | `#3b82f6` | `hsl(217, 91%, 60%)` | Entry price line, entry markers |
| **Stop Loss** | `#ef4444` | `hsl(0, 84%, 60%)` | SL price line, loss outcome markers |
| **Take Profit** | `#22c55e` | `hsl(142, 71%, 45%)` | TP price line, win outcome markers |
| **Pattern Label** | `#f97316` | `hsl(25, 95%, 53%)` | Pattern name text on markers |

### 2.2 Zone Shading

| Zone | Value | Usage |
|---|---|---|
| TP Zone | `rgba(34, 197, 94, 0.06)` | Semi-transparent green between Entry and TP |
| SL Zone | `rgba(239, 68, 68, 0.06)` | Semi-transparent red between Entry and SL |
| Time Range Zone | `rgba(59, 130, 246, 0.04)` | Vertical blue shading for trade duration |

### 2.3 Structural Overlay Colors

| Element | Value | Usage |
|---|---|---|
| ZigZag Polyline | `rgba(0, 200, 255, 0.85)` | Cyan lines connecting structural pivots |

### 2.4 Outcome Colors

| Outcome | Hex | Usage |
|---|---|---|
| Win (`hit_tp`) | `#22c55e` | Green — same as TP color |
| Loss (`hit_sl`) | `#ef4444` | Red — same as SL color |
| Pending / Timeout | `#6b7280` | Grey — muted |

### 2.5 Chart Canvas Colors

| Element | Value |
|---|---|
| Candle Up (body) | `#22c55e` |
| Candle Down (body) | `#ef4444` |
| Grid Lines | 6% opacity of foreground |
| Background | Uses `--background` CSS variable |

---

## 3. Chart Markers

### 3.1 Available Shapes (Lightweight Charts v5)

The library supports exactly **four** marker shapes:

| Shape | Value | Visual |
|---|---|---|
| Arrow Up | `'arrowUp'` | ▲ solid triangle pointing up (NOT a literal arrow with shaft) |
| Arrow Down | `'arrowDown'` | ▼ solid triangle pointing down (NOT a literal arrow with shaft) |
| Circle | `'circle'` | ● filled circle |
| Square | `'square'` | ■ filled square |

> **⚠️ IMPORTANT:**  
> - There are NO diamond, star, or other shapes available. Never describe or promise any shape not in this list.  
> - Despite the API names `arrowUp`/`arrowDown`, the rendered visuals are **solid triangles** (▲/▼), not arrows. Always describe them as "triangles" in user-facing communication and documentation.

### 3.2 Pattern Detection Marker

| Property | Value |
|---|---|
| Shape | `arrowUp` (long/bullish) or `arrowDown` (short/bearish) |
| Position | `belowBar` (long) or `aboveBar` (short) |
| Color | `#f97316` (orange — pattern label color) |
| Text | Pattern name (e.g., `"Symmetrical Triangle"`) |

### 3.3 Directional Signal Marker (Entry Confirmation)

| Property | Value |
|---|---|
| Shape | `arrowUp` (long) or `arrowDown` (short) |
| Position | `belowBar` (long) or `aboveBar` (short) |
| Color | `#22c55e` (long) or `#ef4444` (short) |
| Text | Empty string `""` — no text label |

### 3.4 Marker Rules

1. **Active patterns only** — Never render markers for resolved, expired, or stale patterns
2. **No grey markers** — Resolved/historical patterns are removed entirely, not dimmed
3. **Deduplication** — Same `time + text` combination must not appear twice
4. **Sort order** — Markers must be sorted by time ascending before applying

---

## 4. Price Lines (Trade Plan Levels)

### 4.1 Entry Line

| Property | Value |
|---|---|
| Color | `#3b82f6` (blue) |
| Line Width | `2` |
| Line Style | `0` (solid) |
| Axis Label | Visible |
| Title | `'ENTRY'` or `'ENTRY ▲ LONG'` / `'ENTRY ▼ SHORT'` |

### 4.2 Stop Loss Line

| Property | Value |
|---|---|
| Color | `#ef4444` (red) |
| Line Width | `1` |
| Line Style | `2` (dashed) |
| Axis Label | Visible |
| Title | `'SL'` |

### 4.3 Take Profit Line

| Property | Value |
|---|---|
| Color | `#22c55e` (green) |
| Line Width | `1` |
| Line Style | `2` (dashed) |
| Axis Label | Visible |
| Title | `'TP'` |

### 4.4 Price Line Rules

1. **Active patterns only** — Never show trade levels for resolved/expired patterns
2. **Freshness window** — Hide levels if the pattern's detection timestamp exceeds the freshness window for its timeframe
3. **Price drift guard** — Hide levels if current price is >4% from entry price
4. **Extreme price filter (35%)** — If ANY level (entry, SL, or TP) is >35% away from the chart's latest close, hide ALL trade plan lines and zones entirely. This prevents Y-axis distortion where distant levels crush visible price action into a thin strip
5. **Cascading hide** — When trade plan is hidden by the extreme filter, pattern overlay zones (`historicalPatternOverlays`) are also hidden to prevent orphaned shading

---

## 5. Pattern Overlay Visibility States

### 5.1 State Machine

```
┌─────────────┐     SL/TP breach      ┌──────────────────┐     Backend confirms     ┌──────────────┐
│   ACTIVE     │ ───────────────────▶  │  LIVE RESOLVED   │ ──────────────────────▶  │   RESOLVED    │
│              │    (frontend)         │  (derived outcome)│                          │  (removed)    │
│ Full UI:     │                       │ Full UI:          │                          │               │
│ • ZigZag     │                       │ • ZigZag          │                          │ No UI shown   │
│ • Markers    │                       │ • Markers         │                          │               │
│ • Price lines│     Timeout/Expire    │ • Price lines     │                          │               │
│ • Trade zones│ ──────────────────▶   │ • Outcome color   │                          │               │
└─────────────┘                        └──────────────────┘                          └──────────────┘
```

### 5.2 What Each State Renders

| State | ZigZag | Markers | Price Lines | Trade Zones | Notes |
|---|---|---|---|---|---|
| **Active (levels in range)** | ✅ Cyan polyline | ✅ Arrow + pattern name | ✅ Entry/SL/TP | ✅ TP & SL zones | Full identification UI |
| **Active (levels extreme >35%)** | ✅ Cyan polyline | ✅ Arrow + pattern name | ❌ Hidden | ❌ Hidden | Structural ID visible, trade levels filtered to prevent Y-axis distortion |
| **Live Resolved** | ✅ Cyan polyline | ✅ Outcome-colored arrow | ✅ Entry/SL/TP | ✅ TP & SL zones | Color shifts to green (TP) or red (SL) |
| **Backend Resolved** | ❌ | ❌ | ❌ | ❌ | Completely removed from chart |
| **Expired/Stale** | ❌ | ❌ | ❌ | ❌ | Completely removed from chart |

### 5.3 Selection Priority

When multiple patterns exist for the same symbol:

1. **Active + non-expired** pattern (prefer one with pivots data)
2. **Live-resolved** pattern (frontend-derived outcome, not yet backend-confirmed)
3. **null** — show no overlay

Resolved historical patterns are **never** used as fallback.

---

## 6. ZigZag Polyline (Structural Overlay)

| Property | Value |
|---|---|
| Color | `rgba(0, 200, 255, 0.85)` (cyan) |
| Line Width | `2` |
| Rendering | Native `LineSeries` for scroll/zoom performance |
| Data Source | `visual_spec.pivots[]` |

### 6.1 Pivot Markers

Pivots labeled from `visual_spec.pivots[].label` (e.g., "Bottom 1", "Bottom 2") are rendered as part of the zigzag structure.

---

## 7. Formation Overlay (Canvas)

Because Lightweight Charts lacks native polygon support, formation zones are rendered on an absolutely-positioned `<canvas>` overlay synchronized with chart coordinates.

| Element | Rendering |
|---|---|
| TP Zone | `ctx.fillRect()` with `rgba(34, 197, 94, 0.06)` between entry Y and TP Y |
| SL Zone | `ctx.fillRect()` with `rgba(239, 68, 68, 0.06)` between entry Y and SL Y |

---

## 8. Typography Standards

| Context | Size | Weight | Style |
|---|---|---|---|
| Price axis labels | 11px | Normal | Tabular numerals (monospace for alignment) |
| Instrument name | 15px | Semibold | — |
| Metadata (timeframe, dates) | 11–12px | Normal | `text-muted-foreground` |
| Pattern name (on marker) | System default | — | Rendered by Lightweight Charts |
| Trade plan prices (header bar) | 12px | Medium | Monospace/tabular |

---

## 9. Chart Component Hierarchy

| Component | Purpose | Trade Plan | Playback |
|---|---|---|---|
| `CommandCenterChart` | Main dashboard chart | ✅ Active patterns only | ❌ |
| `StudyChart` | Pattern study / fallback | ✅ Static levels | ❌ |
| `FullChartPlaybackView` | Historical occurrence replay | ✅ Animated reveal | ✅ Bar-by-bar |
| `PatternOverlayChart` | Overlay wrapper with header | ✅ Via child chart | ✅ Via FullChartPlaybackView |

---

## 10. Interactive Behavior

### 10.1 Morning Briefing Strip

- **Click action:** Dual-parameter sync — updates both symbol AND timeframe to match the detected signal
- **Visual:** Compact horizontal strip with instrument logo, pattern name, direction badge

### 10.2 Patterns Button

- **Label:** `Patterns (N)` where N is count of active patterns
- **Click action:** Opens pattern detail overlay
- **Visibility:** Only shown when N > 0

### 10.3 Sidebar Behavior

- Auto-collapse on small viewports
- Dominant chart takes 55–100% of viewport width

---

## 11. Badge & Status Styling

### 11.1 Direction Badges

| Direction | Border | Text | Icon |
|---|---|---|---|
| Long / Bullish | `border-emerald-500/50` | `text-emerald-600` | `TrendingUp` |
| Short / Bearish | `border-red-500/50` | `text-red-600` | `TrendingDown` |

### 11.2 Outcome Badges

| Outcome | Border | Text | Background | Icon |
|---|---|---|---|---|
| TP Hit | `border-emerald-500/50` | `text-emerald-600` | `bg-emerald-500/10` | `CheckCircle2` |
| SL Hit | `border-red-500/50` | `text-red-600` | `bg-red-500/10` | `XCircle` |
| Timeout | `border-amber-500/50` | `text-amber-600` | `bg-amber-500/10` | `Clock` |
| Pending | `border-border` | `text-muted-foreground` | `bg-muted` | `Clock` |

### 11.3 Quality Labels

| Grade | Display Label | Usage |
|---|---|---|
| A | (Extremely rare — not displayed prominently) | — |
| B | "High Confluence" | Screener, teaser tables |
| C | "Standard Detection" | Screener, teaser tables |
| D/F | Not surfaced to users | — |

---

## 12. Anti-Patterns (Never Do This)

| ❌ Don't | ✅ Do Instead |
|---|---|
| Show grey circle markers for stale patterns | Remove stale patterns from chart entirely |
| Use diamond or star marker shapes | Use only `arrowUp`, `arrowDown`, `circle`, `square` |
| Show TP/SL lines without pattern identification | Always show full pattern UI or nothing |
| Fall back to historical resolved patterns | Show null overlay if no active pattern |
| Use custom color classes directly | Use semantic design tokens from `index.css` |
| Describe UI elements that don't exist in the code | Verify against this spec before describing |
| Show letter grades (A/B/C) directly | Use descriptive labels ("High Confluence") |

---

## 13. Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-03-03 | Initial specification codified from codebase and memories |
