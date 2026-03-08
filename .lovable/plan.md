

## Create Two New Utility Files

Two new files will be created exactly as specified, with no modifications to existing files.

### File 1: `src/lib/navigationRoutes.ts`
Shared route registry with 7 routes (Agent Scoring, Live Patterns, Pattern Lab, Dashboard, Market Report, Portfolio, Settings), each with labels, paths, and aliases. Includes a `fuzzyMatchRoute()` function for exact and partial matching.

### File 2: `src/lib/copilotEvents.ts`
Typed custom event system with:
- `ScoringUpdatePayload` and `NavigatePayload` interfaces
- Three dispatch helpers: `dispatchScoringUpdate`, `dispatchRunBacktest`, `dispatchNavigate`
- Panel mount tracking: `registerPanel`, `unregisterPanel`, `isPanelMounted`
- `buildDiffSummary` for human-readable change descriptions

Both files are standalone utilities with no changes to any existing code.

