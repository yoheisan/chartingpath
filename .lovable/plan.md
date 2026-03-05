

## Strategic Placement of Agent Backtest

### Current State

Agent Backtest lives at `/tools/agent-scoring` but is **invisible** -- it has zero links in the main navigation (desktop or mobile), the command palette, or the footer. The only way to reach it is by direct URL or the "Send to Backtest" flow from Pattern Lab results. It is effectively a hidden page.

### The User Journey Context

The platform follows a clear funnel:

```text
Screener (Discover) → Dashboard (Triage) → Pattern Lab (Validate) → Alerts/Scripts (Execute)
```

Agent Backtest sits between **Triage** and **Validate** -- it answers "Should I take this trade?" with a multi-agent verdict before committing credits to a full backtest. It is a **decision filter**, not a discovery or validation tool.

### Recommended Placement (3 touch-points)

**1. Post-Screener CTA (highest-value placement)**
On the Screener's pattern detail rows or the study chart, add a "Score with AI Agents" action button. When a user finds a signal they like, they can get a quick TAKE/WATCH/SKIP verdict before committing to Pattern Lab. This is the natural moment of decision.

**2. Pattern Lab results page (post-backtest enrichment)**
After a backtest completes in Pattern Lab, add an "Analyze with AI Agents" button that sends the instrument + pattern context to Agent Backtest. This lets users get a second opinion on validated strategies.

**3. Navigation: under "More → Features" dropdown**
Add a single link alongside "AI Copilot" in the existing Features section of the More dropdown. This gives discoverability without cluttering the primary nav bar. Also add it to the mobile Tools section.

### Implementation Details

- **Navigation.tsx**: Add `Agent Scoring` link under `More → Features` dropdown (desktop) and under the `Tools` section (mobile)
- **Command palette**: Add an "Agent Backtest" command in the `CommandPaletteContent` for keyboard-driven access
- **Screener row action**: Add a `Bot` icon button on each live pattern row that navigates to `/tools/agent-scoring?symbol=X&pattern=Y`
- **Pattern Lab results**: Add a CTA button after backtest results render

This creates a progressive discovery model: users find it naturally through the workflow (Screener → Agent Score → Pattern Lab), and power users can reach it via nav or command palette.

