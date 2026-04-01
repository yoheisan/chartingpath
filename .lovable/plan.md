

## Plan: Add Article Slug Context to Copilot Prompts

### What changes

Add an `articleSlug` field to the context store and extract it from blog/learn URLs so the system prompt includes `"User is reading: {slug}"`.

### 1. `src/stores/copilotContextStore.ts`

- Add `articleSlug: string | null` to `CopilotContextState` (line 67, after `timeframe`)
- Add `setArticleSlug` action
- Initialize as `null` in the store, add setter
- In `buildLiveContextPrompt`: after the page line, if `articleSlug` is set, push `- User is reading: ${state.articleSlug}`

### 2. `src/hooks/useCopilotStoreSync.ts`

- Import and use `setArticleSlug` from the store
- In the route change effect, after determining `pageType`:
  - If route matches blog or learn paths, extract the slug from the last URL segment (e.g., `/blog/head-and-shoulders` → `head-and-shoulders`)
  - Call `setArticleSlug(slug)` for those page types, `setArticleSlug(null)` otherwise

### Files changed (2)

- `src/stores/copilotContextStore.ts`
- `src/hooks/useCopilotStoreSync.ts`

