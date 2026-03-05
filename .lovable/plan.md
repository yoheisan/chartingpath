

## Analysis: Equity & Drawdown Chart Visualization

You're right -- overlaying equity and drawdown on the same chart with dual Y-axes is a common source of confusion. The scales are fundamentally different (dollars vs. percentage), and the visual correlation between the two lines can be misleading.

### How Top Platforms Handle This

| Platform | Approach |
|----------|----------|
| **QuantConnect** | Stacked panels -- equity on top (larger), drawdown as a separate smaller panel below, sharing the same X-axis |
| **TradingView** | Strategy Tester uses stacked panels: equity curve on top, drawdown as an inverted bar chart below |
| **Zipline / Quantopian** | Separate subplots sharing X-axis -- equity as area chart, drawdown as inverted filled area below |
| **TradeStation** | Equity on top, drawdown as red "underwater" chart below (inverted, filled to zero) |

The **industry standard** is clear: **stacked panels with a shared time axis**. The drawdown is rendered as an **inverted "underwater" chart** -- a filled area hanging down from the zero line, colored red. This makes the depth and duration of drawdowns immediately intuitive.

### Recommended Approach: Stacked Panels

```text
┌─────────────────────────────────────────┐
│  Equity Curve (70% height)              │
│  ┌───────────────────────────────┐      │
│  │    ╱╲    ╱╲╱╲                 │ $21k │
│  │   ╱  ╲  ╱      ╲╱╲           │      │
│  │  ╱    ╲╱            ╲        │ $14k │
│  │ ╱                    ╲       │      │
│  └───────────────────────────────┘      │
│  Drawdown "Underwater" (30% height)     │
│  ┌───────────────────────────────┐ 0%   │
│  │▓▓▓▓▓   ▓▓▓        ▓▓▓▓▓▓▓▓▓▓│      │
│  │▓▓▓▓▓▓▓▓▓▓▓▓       ▓▓▓▓▓▓▓▓▓▓│-15%  │
│  │          ▓▓▓▓▓▓▓▓▓▓          │      │
│  └───────────────────────────────┘-44%  │
│  May'24  Jul'24  Sep'24  Jan'25  Jul'25 │
└─────────────────────────────────────────┘
```

### Plan

1. **Refactor the "Equity & Drawdown" tab in `PatternLabViewer.tsx`** from a single `ComposedChart` with dual Y-axes into two vertically stacked charts sharing the same X-axis:
   - **Top panel (70% height)**: Equity curve as a green/red gradient `Area` chart with the breakeven reference line. Single left Y-axis in dollars.
   - **Bottom panel (30% height)**: Drawdown as an inverted red filled `Area` chart. Single left Y-axis in percentage, domain reversed so 0% is at top and max drawdown hangs downward. X-axis labels only on this bottom chart.
   - Remove the right Y-axis entirely.

2. **Update `AgentBacktestResults.tsx`** to use the same stacked pattern for its equity curve section (add drawdown data if available from `equity_curve_data`).

3. **Update the tab label** from "Equity & Drawdown" to just "Equity & Drawdown" but with the legend replaced by the visual separation itself -- no legend needed when charts are labeled.

4. **Shared X-axis sync**: Both panels use the same `data` array and the same `XAxis` config, but only the bottom panel renders tick labels to avoid duplication.

### Technical Details

- Use Recharts' `ResponsiveContainer` for each sub-chart inside a flex column container
- Top chart: `height="70%"` with `XAxis hide` 
- Bottom chart: `height="30%"` with visible XAxis
- Drawdown area: `<Area>` with `dataKey="drawdown"`, `fill` a red gradient, domain `[0, ddDomainMax]` reversed, so it renders as an "underwater" effect
- Minimal gap (4px) between panels to visually link them
- Tooltip synchronized isn't natively supported in Recharts across separate charts, so we'll use a shared hover state via React state to sync tooltip position across both panels

