

## Plan: Add dismiss (X) button to the tooltip popup bubble

The bouncing tooltip bubble ("Ask anything about markets, patterns & trade setups ✨") near the floating AI button needs a close/dismiss button so users can permanently hide it.

### Current behavior
- The tooltip shows when `sessionStorage` has no `copilot_opened` key (first-visit only per session).
- It disappears only when the user clicks the main AI button (which sets `copilot_opened` in sessionStorage).

### Changes

**File: `src/components/copilot/TradingCopilot.tsx` (~lines 744-748)**

1. Add a small X button to the top-right corner of the tooltip bubble.
2. On click, set `sessionStorage.setItem('copilot_opened', '1')` and hide the tooltip via local state.
3. Use `localStorage` instead of `sessionStorage` so the dismissal persists across sessions (currently it reappears every new session).

```text
Before:
┌──────────────────────────┐
│ Ask anything about ...   │
└──────────────────────────┘

After:
┌──────────────────────────┬───┐
│ Ask anything about ...   │ ✕ │
└──────────────────────────┴───┘
```

### Technical detail
- Add a `tooltipDismissed` state initialized from `localStorage.getItem('copilot_tooltip_dismissed')`.
- The X button calls `localStorage.setItem('copilot_tooltip_dismissed', '1')` and sets the state to hide.
- The existing `sessionStorage.setItem('copilot_opened', '1')` on button click also hides it (existing behavior preserved).
- Import `X` from lucide-react (already used elsewhere).

Single file change, no locale changes needed.

