

## Differentiate Validate vs. Automate Modes in Pattern Lab

### Problem
Today, both modes share identical UI: same form fields, same sidebar guidance, same results page. The mode picker creates an expectation of a tailored experience but doesn't deliver one. Users arriving from the Screener with a live signal (Validate) see the same complexity as someone building a full trading system (Automate).

### Design Principles

**Validate a Signal** = "Should I take this trade?"
- User has a LIVE setup right now. Speed and clarity are paramount.
- They need: go/no-go verdict, win rate, grade context, a quick trade plan.
- They do NOT need: equity curves, exit model optimization, script export options cluttering their view.

**Build Automation** = "Can I systematize this edge?"
- User is in research mode, no urgency.
- They need: full statistical depth, multi-instrument support, optimization controls, script export.
- They benefit from maximum configuration flexibility.

### Changes

#### 1. Wizard Form (PatternLabWizard.tsx)

**Validate mode simplifications:**
- Lock instrument count to 1 (the one from the screener/copilot) -- hide "add more" affordances
- Auto-collapse the Pattern and Backtest Parameters sections (they arrive pre-filled)
- Show a "Signal Context" card at the top displaying the grade badge, pattern name, and instrument prominently -- reinforcing what they're validating
- Sidebar "What You'll Get" list changes to: Go/No-Go verdict, Win rate on this pair, Trade plan with entry/SL/TP levels, Grade confirmation
- CTA button stays "Validate Signal"

**Automate mode enhancements:**
- Keep multi-instrument selection open by default
- Keep all parameter sections expanded
- Sidebar "What You'll Get" list changes to: Full equity curve and drawdown, Setup optimizer with exit models, Repeatable winners/losers analysis, Export Pine Script v6 / MQL4/5
- CTA button stays "Run and Build Script"

#### 2. Results Page (ProjectRun.tsx)

**Validate mode -- streamlined results:**
- Show a prominent verdict card at the top: large go/no-go badge (green checkmark for positive expectancy, red X for negative) with the win rate and expectancy front and center
- Show a simplified Trade Plan section: suggested entry, stop loss, take profit based on backtest stats
- Collapse the equity curve and optimizer tabs behind "See Full Analysis" toggle
- Primary CTA: "Set Alert" (push to execution stage of the journey)
- Secondary CTA: "Promote to Automation" -- switches to automate mode with all context preserved, letting users who confirm a good edge seamlessly transition to building a script

**Automate mode -- full results (current behavior):**
- All tabs visible by default (Equity, Trade Excursion, Profit Structure)
- Setup Optimizer section prominent
- Primary CTA: "Export Script" / "Script This Strategy"
- No verdict card needed -- the user wants depth, not a quick answer

#### 3. Analytics Tracking

- Track `pattern_lab.mode_select` with the mode (already done)
- Add `pattern_lab.validate_verdict` event: logs the go/no-go result, win rate, grade
- Add `pattern_lab.promote_to_automate` event: tracks when validate users convert to automation
- Feed these into the AI journey analytics to measure mode conversion rates

### Technical Details

**Files to modify:**
- `src/pages/projects/PatternLabWizard.tsx` -- mode-aware form layout, sidebar content, signal context card
- `src/pages/projects/ProjectRun.tsx` -- mode-aware results: verdict card, simplified vs. full view, promote-to-automate CTA
- `src/services/analytics.ts` -- add new event types

**Mode persistence:** The `mode` parameter is already passed via URL (`?mode=validate`). It needs to be forwarded to the results page (currently not done) either via URL param on navigation or via location state.

**Promote to Automate flow:** When clicked, navigate back to `/projects/pattern-lab/new` with all current params plus `mode=automate`, preserving instrument, pattern, timeframe, and grade so the user doesn't re-enter anything.

