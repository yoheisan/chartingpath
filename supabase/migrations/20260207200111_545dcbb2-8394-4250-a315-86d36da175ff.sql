-- Update the Chart Types Explained article to include visual examples
UPDATE public.learning_articles
SET content = E'# Chart Types Explained

ChartingPath uses a standardized chart system designed for professional pattern analysis. This guide explains each chart type, where you\'ll find them, and how to use their features effectively.

---

## Visual Design Standard

All charts across ChartingPath follow an **Institutional Dark Theme**:

- **Dark background** for reduced eye strain during extended sessions
- **Green candles** indicate price closed higher than the previous bar
- **Red candles** indicate price closed lower than the previous bar
- **Volume histogram** at the bottom reflects buying/selling pressure

---

## Study Chart

![Study Chart Example](/src/assets/docs/study-chart-example.png)

The **Study Chart** is your primary research workspace for analyzing any instrument.

### Where to Find It
- **Ticker Pages** (`/study/AAPL`, `/study/BTC-USD`)
- **Command Center** dashboard
- **Pattern detail views**

### Key Features
- Full-width candlestick display with volume
- Multi-timeframe switching (1H, 4H, Daily, Weekly)
- Price scale on the right side
- Time axis at the bottom
- Real-time data updates

### Interactivity
- **Scroll** to zoom in/out on the time axis
- **Shift + Drag** to pan vertically
- **Drag the price scale** to manually adjust vertical range
- **Reset button (↺)** to restore auto-fit

---

## Full Chart

![Full Chart Example](/src/assets/docs/full-chart-example.png)

The **Full Chart** is an expanded modal view for deep analysis and trade planning.

### Where to Find It
- Click the **expand icon** on any Study Chart
- Pattern occurrence detail views
- Trade playback modal

### Key Features
Everything in Study Chart, plus:
- **Trade overlay lines** (Entry, Stop Loss, Take Profit)
- **Pattern zone markers** showing formation boundaries
- **Entry arrows** indicating signal bars
- **Larger canvas** for detailed analysis
- **Trade Playback controls** for animated replay

### Trade Visualization
- **Amber horizontal line** = Entry price
- **Red dashed line** = Stop Loss level
- **Green dashed line** = Take Profit target
- **Amber arrow** = Signal/entry bar marker

---

## Thumbnail Chart

![Thumbnail Chart Example](/src/assets/docs/thumbnail-chart-example.png)

The **Thumbnail Chart** is a compact, read-only preview for quick pattern scanning.

### Where to Find It
- **Pattern Gallery** cards
- **Screener results** list
- **Historical occurrences** tables
- **Watchlist** pattern previews

### Key Features
- Minimal footprint (fits in cards/tables)
- No interactive controls
- Optimized for fast rendering
- Shows recent price action context

### Purpose
Thumbnails let you quickly scan dozens of patterns without opening each one. Click any thumbnail to open the full detail view.

---

## Signal Chart

![Signal Chart Example](/src/assets/docs/signal-chart-example.png)

The **Signal Chart** is a specialized view for detected patterns with trade execution overlays.

### Where to Find It
- **Live pattern alerts**
- **Pattern detection cards**
- **Command Center** pattern viewer
- **Historical pattern analysis**

### Key Features
- **Purple pattern zone** highlighting the formation area
- **Entry/SL/TP price lines** with labels
- **Quality score badge** showing pattern grade
- **Trend alignment indicators**
- **Risk/reward ratio display**

### Visual Elements
- **Purple shaded zone** = Pattern formation boundaries
- **Amber entry marker** = Recommended entry point
- **Horizontal price levels** = Trade plan (Entry, Stop, Target)
- **Quality badge** = A+, A, B, C, D grade

---

## Chart Controls Reference

| Action | Desktop | Mobile |
|--------|---------|--------|
| Zoom time axis | Scroll wheel | Pinch |
| Pan horizontally | Click + drag | Swipe |
| Pan vertically | Shift + drag | Two-finger drag |
| Adjust price scale | Drag right axis | Drag right edge |
| Reset view | Click ↺ button | Tap ↺ button |

---

## When to Use Each Chart

| Chart Type | Best For |
|------------|----------|
| Study Chart | Daily research, instrument analysis |
| Full Chart | Deep analysis, trade planning, playback |
| Thumbnail Chart | Quick scanning, pattern comparison |
| Signal Chart | Trade decisions, entry/exit planning |

---

## Related Guides

- [Command Center Guide](/blog/command-center-guide) - Your AI-powered trading hub
- [Platform Glossary](/blog/platform-glossary) - Complete terminology reference
- [Platform FAQ](/blog/platform-faq) - Common questions answered',
    updated_at = now()
WHERE slug = 'chart-types-explained';