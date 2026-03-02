

# Add Edge Atlas to Navigation

## Current State
Edge Atlas pages (`/patterns/:patternId/statistics`, `/edge-atlas/:patternId`) are only reachable via the landing page section or direct links. They have no presence in the main navigation.

## Recommended Placement: Learning Dropdown

Edge Atlas is a research and discovery tool showing historical pattern rankings and statistics. It belongs alongside Pattern Library, Blog, and Quizzes in the **Learning** dropdown -- all are "understand before you trade" resources.

### Changes

**Navigation.tsx** -- Add Edge Atlas entry to the Learning dropdown (desktop) and Learning section (mobile):

Desktop Learning dropdown (between Pattern Library and Blog & Articles):
```
Edge Atlas  (Trophy icon, amber color)  -->  /patterns/bull-flag/statistics
```
This links to the PatternStatisticsPage which already has a grid of all patterns, serving as the Edge Atlas index.

Alternatively, we can create a lightweight `/edge-atlas` index route that lists all pattern statistics pages with their aggregate win rates -- a proper landing page for the feature.

Mobile nav Learning section: add the same link.

### Route Consideration
The landing page `EdgeAtlasSection` links to `/edge-atlas/:patternId` while the statistics pages live at `/patterns/:patternId/statistics`. The nav link should point to whichever serves as the best "index" page. Currently there is no `/edge-atlas` index route, so the simplest option is to link to `/#edge-atlas` (the landing page section) or pick a sensible default like the first pattern's statistics page.

**Recommended**: Create a simple `/edge-atlas` index page that lists all patterns with their aggregate stats, then link to that from the nav.

## Summary of File Changes

1. **`src/pages/EdgeAtlasIndexPage.tsx`** (new) -- Simple page listing all patterns with links to their statistics pages, using the existing `PATTERN_DISPLAY` map
2. **`src/App.tsx`** -- Register `/edge-atlas` route (the bare path, not the existing `/:patternId` one)
3. **`src/components/Navigation.tsx`** -- Add Edge Atlas link to Learning dropdown (desktop) and Learning section (mobile)
