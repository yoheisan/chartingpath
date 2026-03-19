

# Plan: "Deploy as Alert" from Pattern Lab Results

## What We're Building

A seamless one-click bridge from Pattern Lab backtest results to a pre-filled alert with `auto_paper_trade` enabled. When a user validates a pattern and clicks "Deploy as Alert," the system pre-fills the alert form with the validated symbol, pattern, timeframe, and enables auto paper trading by default.

## Current State

- **Pattern Lab results** show a "Create Alert" button (`BacktestResultSummary.tsx`) and "Set Alert" button (`ProjectRun.tsx`), but both navigate to `/members/alerts` without passing context.
- **`playbookContext`** (sessionStorage-based) already exists for pre-filling alerts, but is only used by `StrategyWorkspaceInterface`, not Pattern Lab.
- **MemberAlerts page** already reads `playbookContext` and pre-fills symbol, pattern, and timeframe.
- The playbook context does NOT currently carry `autoPaperTrade` or `riskPercent`.

## Changes

### 1. Extend PlaybookContext interface
**File:** `src/hooks/usePlaybookContext.tsx`
- Add optional fields: `autoPaperTrade?: boolean`, `riskPercent?: number`, `winRate?: number`, `totalTrades?: number` (to show validation badge on alerts page).

### 2. Wire "Create Alert" in BacktestResultSummary to save playbook context
**File:** `src/components/BacktestResultSummary.tsx`
- The `handleCreateAlert` function currently just calls `onCreateAlert()` (which navigates). Update the component to accept and pass backtest metadata (symbol, pattern, timeframe) so the parent can save it to playbook context before navigating.
- Add a new optional prop `onDeployAsAlert` that saves playbook context with `autoPaperTrade: true` and navigates to `/members/alerts`.

### 3. Wire "Set Alert" in ProjectRun to save playbook context
**File:** `src/pages/projects/ProjectRun.tsx`
- Import `savePlaybookContextStatic` and save the run's instrument, pattern, and timeframe before navigating to `/members/alerts`.

### 4. Read extended playbook context in MemberAlerts
**File:** `src/pages/MemberAlerts.tsx`
- In the existing `useEffect` that reads `playbookContext`, also read `autoPaperTrade` and `riskPercent` to pre-fill the automation toggles.
- Show a "Pre-filled from Pattern Lab" badge (already partially exists as "Pre-filled from Playbook").

### 5. Rename CTA button text
- In `BacktestResultSummary.tsx`: Change "Create Alert" to "Deploy as Alert" with a Zap icon to signal automation.
- In `ProjectRun.tsx`: Keep "Set Alert" but add tooltip "Auto paper trade when pattern appears."

## Technical Details

- Uses the existing `sessionStorage`-based playbook context mechanism (no new state management).
- Follows the existing URL-based context transfer standard documented in architecture memories.
- No database or Edge Function changes required.
- No new dependencies.

