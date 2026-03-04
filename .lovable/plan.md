

## Analysis

The root cause is clear: **Twitter rejects SVG files**, so the posting pipeline uses `weserv.nl` as a proxy to convert SVG to PNG on-the-fly. This external dependency produces inconsistent, low-quality results — which is what you saw posted.

Before the image requirement was introduced, the system posted **text-only tweets** and they worked reliably. The chart image was only used for OG meta tags on the share page (where SVG works fine in browsers).

## Plan

### 1. Remove image attachment from the social posting pipeline

In `post-patterns-to-social/index.ts`:
- Remove the `downloadImageAsBytes` function and the `weserv.nl` SVG-to-PNG proxy logic
- Remove the `uploadMediaToTwitter` call path
- Post tweets as **text-only** (which worked before)
- Remove the "prefer groups with images" sorting logic — just pick the best pattern by grade/RR

### 2. Re-enable automated posting

- Set `MAX_DAILY_POSTS` back to `3`

### 3. Keep SVG generation for share pages only

- `generate-share-image` and `pre-generate-pattern-images` remain as-is — they serve SVG for the `/s/{token}` OG preview cards in browsers, which render SVG natively. No changes needed there.

### What stays, what goes

| Component | Action |
|---|---|
| `post-patterns-to-social` | Remove image upload logic, text-only tweets, re-enable budget |
| `generate-share-image` | Keep (serves OG share pages) |
| `pre-generate-pattern-images` | Keep (pre-generates for share pages) |
| `weserv.nl` proxy | Remove entirely |

This eliminates the unstable PNG conversion layer and returns to the proven text-only posting flow.

