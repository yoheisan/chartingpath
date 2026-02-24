

# Add Sort Controls to Copilot Feedback Dashboard

## Overview
Add a sort dropdown to the existing Copilot Feedback Dashboard so items within each filter tab can be reordered by different criteria.

## Current State
The dashboard already has three filter tabs (Content Gaps, High Priority, All Feedback) but always sorts by `priority_score` descending then `created_at` descending. There is no user-facing sort control.

## Changes

### File: `src/components/admin/CopilotFeedbackDashboard.tsx`

1. **Add a `sortBy` state** with options:
   - `recent` -- Sort by `created_at` descending (most recent first)
   - `priority` -- Sort by `priority_score` descending (highest priority first)
   - `quality` -- Sort by `quality_score` ascending (lowest quality = biggest gaps first)

2. **Add a Select dropdown** next to the existing filter tabs, using the shadcn `Select` component, labeled "Sort by".

3. **Update the `loadFeedback` query** to apply the selected sort order dynamically instead of the hardcoded `priority_score` + `created_at` ordering.

4. **Default sort**: `recent` so the newest feedback appears first by default.

## UI Layout

```text
+------------------------------------------+
| [Content Gaps] [High Priority] [All]     |
|                          Sort by: [v Recent ▾] |
+------------------------------------------+
| Feedback cards...                        |
```

## Technical Details

- Sort options mapped to Supabase `.order()` calls:
  - `recent` -> `.order('created_at', { ascending: false })`
  - `priority` -> `.order('priority_score', { ascending: false })`
  - `quality` -> `.order('quality_score', { ascending: true, nullsFirst: false })`
- The `useEffect` dependency array will include both `filter` and `sortBy` to reload data when either changes.
- No new files or dependencies needed; uses existing `Select` component from shadcn/ui.

