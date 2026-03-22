

## Add Active Trades Panel to Copilot Page

### Problem
When trades are active, users can only see one trade on the Copilot center panel. To view all open positions, they must navigate away to `/tools/paper-trading`.

### Solution
Add an **Active Trades strip/panel** to the Copilot page that shows all open positions at a glance, with quick actions.

### Changes

**1. New component: `src/components/copilot/ActiveTradesStrip.tsx`**
- Horizontal strip below the MandateCard (left panel) or above the CenterPanel
- Lists all open trades: ticker, direction (long/short icon), entry price, current P&L in R
- Click a trade → selects it in the CenterPanel for chart view
- Shows count badge: "3 Active Trades"
- Each trade has a quick "Close" button that triggers the override dialog

**2. Update `src/pages/Copilot.tsx`**
- Import and render `ActiveTradesStrip` when `openTrades.length > 0`
- Pass `openTrades` from `useCopilotTrades` and a callback to set the selected trade in CenterPanel
- Wire the close action to the existing `handleCloseTrade` from `usePaperTrading`

**3. Update CenterPanel selection**
- Allow clicking a trade in the strip to switch which trade the CenterPanel displays (currently hardcoded to `openTrades[0]`)
- Add `selectedTradeId` state to Copilot page, default to first open trade

### Layout
```text
┌─────────────────────────────────────────────────┐
│ Left Panel          │ Center Panel    │ Right   │
│ ┌─────────────────┐ │                 │         │
│ │ Mandate Card    │ │  Selected Trade │         │
│ │ (accordion)     │ │  Chart View     │         │
│ ├─────────────────┤ │                 │         │
│ │ Active Trades   │ │                 │         │
│ │ AAPL ▲ +0.5R   │ │                 │         │
│ │ MSFT ▼ -0.2R   │ │                 │         │
│ │ TSLA ▲ +1.1R   │ │                 │         │
│ └─────────────────┘ │                 │         │
└─────────────────────────────────────────────────┘
```

### Files to create/modify
- **Create**: `src/components/copilot/ActiveTradesStrip.tsx`
- **Modify**: `src/pages/Copilot.tsx` — add state for selected trade, render strip
- **Modify**: `src/components/copilot/CenterPanel.tsx` — accept `selectedTradeId` prop instead of always using first trade

