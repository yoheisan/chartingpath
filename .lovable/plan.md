

# Paper Trading Tab -- Right Sidebar Integration

## Placement Decision

After examining the dashboard layout, the **right sidebar** is the clear winner for paper trading:

**Right sidebar currently contains:**
- Top panel (tabbed): Watchlist | Alerts -- both are trade-management concerns
- Bottom panel: Market Overview -- market context

**Left/center area contains:**
- Main chart (TradingView)
- Collapsible study panel (pattern analysis, historical occurrences)

Paper trading (balance, positions, trade history) is a **trade-management activity** that naturally groups with Watchlist and Alerts. Adding it as a third tab keeps everything action-oriented on the right, while the left stays focused on analysis.

---

## Implementation

### 1. Create `PaperTradingPanel` component

New file: `src/components/command-center/PaperTradingPanel.tsx`

Content sections (vertically stacked inside ScrollArea):
- **Portfolio summary card**: current balance, total P&L, win rate (fetched from `paper_portfolios`)
- **Open positions list**: symbol, direction badge, entry price, current P&L, with "[Auto]" badge for auto-trades (from `paper_trades` where status = 'open')
- **Closed trades accordion**: recent closed trades with outcome badges (win/loss), expandable for details

Data: query `paper_portfolios` and `paper_trades` for the logged-in user via Supabase client.

### 2. Add "Paper" tab to right sidebar

In `CommandCenterLayout.tsx`:
- Add a third `TabsTrigger` value `"paper"` alongside Watchlist and Alerts
- Add matching `TabsContent` rendering `PaperTradingPanel`
- Add a briefcase/wallet icon button to the collapsed sidebar icon strip

### 3. Add collapsed sidebar icon

When sidebar is collapsed, add a `Wallet` (or `BarChart3`) icon button that opens the sidebar to the Paper tab, matching the existing pattern for Watchlist (Eye) and Alerts (Bell).

### 4. Persist tab selection

The existing `useDashboardSettings` hook already persists `watchlistTab`. The paper tab selection will flow through the same mechanism -- no new settings fields needed since `watchlistTab: 'paper'` just works.

---

## Technical Details

- **PaperTradingPanel props**: `userId`, `onSymbolSelect` (clicking a position navigates chart to that symbol)
- **Auto-trade badge**: trades with `notes` containing `[auto-trade]` get a highlighted "Auto" badge
- **Real-time**: uses Supabase realtime subscription on `paper_trades` for live position updates
- **Empty state**: shows explanation + link to alerts page to enable auto paper trading when no trades exist

