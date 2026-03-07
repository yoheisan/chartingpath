

## Plan: Add Proof Gate to TradeOpportunityTable

**Single file change**: `src/components/agent-backtest/TradeOpportunityTable.tsx`

### Changes

1. **Add constants + `isProven` function** after line 33 (after `PATTERN_NAME_TO_ID`)
2. **Add `showEmerging` state** in the component (after line 154)
3. **Refactor `scoredTrades` memo** to split detections into proven (scored+sorted) and emerging (raw) — return object `{ scoredProven, emergingDetections }`
4. **Update `counts` memo** to use `scoredProven` only
5. **Update summary strip** references from `scoredTrades` to `scoredProven`, add Emerging toggle button after SKIP badge
6. **Update main table body** to iterate `scoredProven`
7. **Add Emerging Signals section** below main table (collapsed by default):
   - Header: "Emerging Signals — No Historical Data Yet" with subtitle
   - Same table columns but: Analyst shows `—`, Composite shows `—`, Verdict shows gray `UNPROVEN` badge
   - Rows at `opacity-50`
   - Basket toggle and Pattern Lab button render normally

All other files and functions (`deriveRawScores`, `AgentBacktestPanel`, edge functions) remain untouched.

