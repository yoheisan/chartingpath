

## Auto-Run Edge Analyst + Conversation UI

### What changes

**1. Auto-trigger analysis on backtest completion**
- When the run status is `succeeded`, automatically fire the Edge Analyst with a default question like "Summarize the key findings from this backtest" — no user action needed.
- The auto-analysis runs once on mount (or status transition to succeeded), using a ref to prevent re-fires.

**2. Redesign EdgeAnalyst UI into two sections**

The component will be restructured:

```text
┌─────────────────────────────────────────┐
│ 🧪 Edge Analyst              AI        │
│ Auto-generated analysis of your run     │
├─────────────────────────────────────────┤
│ [AI Summary - markdown response]        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Summary Table (if ≥10 samples)      │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 💬 Ask a follow-up question            │
│                                         │
│ [Example chips if no follow-ups yet]    │
│                                         │
│ [Previous Q&A thread - scrollable]      │
│                                         │
│ ┌──────────────────────┐ ┌────┐        │
│ │ Your question...     │ │Send│        │
│ └──────────────────────┘ └────┘        │
└─────────────────────────────────────────┘
```

**3. Conversation history within the session**
- Store a local array of `{question, answer, summary}` message pairs.
- The auto-analysis becomes the first entry.
- Each follow-up question appends to the thread, displayed chronologically.
- The input stays at the bottom, chat-style.

### Files to modify

| File | Change |
|------|--------|
| `src/components/projects/EdgeAnalyst.tsx` | Rewrite: add `autoAnalyze` prop, conversation thread state, split UI into auto-analysis section + follow-up chat section |
| `src/pages/projects/ProjectRun.tsx` | Pass `autoAnalyze={run.status === 'succeeded'}` to EdgeAnalyst |
| `supabase/functions/edge-analyst/index.ts` | Add handling for a "summarize" mode — when question is the auto-summary prompt, tailor the system prompt to give a concise overview of the run results |

### Technical details

- **EdgeAnalyst component**: New props: `autoAnalyze?: boolean`. New state: `messages: Array<{question: string, answer: string, summary: SummaryRow[]}>`. On mount, if `autoAnalyze` and `runId`, fire with "Summarize the key performance findings from this backtest run." The initial analysis renders prominently at the top. Follow-up Q&A renders below in a scrollable thread.
- **Edge function**: No structural changes needed — the existing function already handles any question. The auto-summary question is just a regular question sent automatically.
- **No DB changes** required.

