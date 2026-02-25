
# Re-enabling Ticker-Specific Image Posts on X (Twitter)

## Current State

The `post-patterns-to-social` function currently posts **text-only tweets** because image generation via `resvg_wasm` (SVG-to-PNG conversion) crashes Supabase Edge Functions with a `WORKER_LIMIT` error. The result is generic, low-engagement posts with no visual chart.

Two bottlenecks exist:
1. **Image generation timeout** -- `resvg_wasm` exceeds Edge Function compute limits (~50MB WASM + rendering)
2. **Twitter rate limits** -- Free/Basic tier X API allows ~17 tweets/24h (1,500/month); currently posting 1 per 60 min (max ~24/day), which is close to or at the limit

## Solution: Pre-generate Images in a Batch Job

Instead of generating images at tweet-time (which crashes), we split into two phases:

### Phase 1: Background Image Pre-Generation (new cron job)

Create a new edge function `pre-generate-pattern-images` that runs on a schedule (e.g., every 2 hours during off-peak) and:

1. Queries all A/B grade `live_pattern_detections` that do NOT yet have a share image in the `share-images` storage bucket
2. Generates images **one at a time** with a simpler, lighter approach -- pure SVG uploaded directly (Twitter's media upload API accepts PNG, so we use an external PNG conversion service or a simpler Canvas approach)
3. Stores the image URL back on the detection row (new column `share_image_url`)
4. Processes max 3-5 images per run to stay within compute budget

**Key change**: Replace `resvg_wasm` with a call to an external lightweight PNG renderer, OR simply upload the SVG to storage and use a pre-rendered static fallback card when SVG-to-PNG fails. The most reliable approach is to use the Supabase `og-image` pattern: render a simple branded template as pure SVG (no WASM), store it, and reference it.

### Phase 2: Update `post-patterns-to-social` to Use Pre-Generated Images

Modify the existing poster to:

1. Check if `share_image_url` exists on the detection
2. If yes, download the image bytes and upload to Twitter via the existing `uploadMediaToTwitter` v1.1 endpoint (already implemented but disabled)
3. If no image exists, fall back to text-only (current behavior)
4. This makes tweet-time execution fast and lightweight -- no image generation, just a fetch + upload

### Phase 3: Rate Limit Budget Management

Add a daily tweet budget tracker to prevent hitting X API limits:

1. New DB table `social_post_budget` tracking daily post counts per platform
2. Before posting, check: `daily_count < MAX_DAILY_POSTS` (set to 15 for safety on Basic tier)
3. Prioritize posts: pattern alerts get 10 slots, market reports get 4, educational gets 1
4. The `post-patterns-to-social` function already posts 1 per run -- reduce cron frequency to every 90 min (max ~16/day total across all post types)

## Database Changes

1. Add `share_image_url` column to `live_pattern_detections` (nullable text)
2. Create `social_post_budget` table:
   - `id`, `platform` (text), `post_date` (date), `post_count` (int), `max_posts` (int), `updated_at`
   - Unique constraint on (platform, post_date)

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/pre-generate-pattern-images/index.ts` | Create | Batch image pre-generation (runs every 2h) |
| `supabase/functions/post-patterns-to-social/index.ts` | Modify | Re-enable image attachment using pre-generated URLs; add budget check |
| `supabase/functions/generate-share-image/index.ts` | Modify | Remove `resvg_wasm`, output pure SVG stored as `.svg` (used for OG tags), add a simpler PNG path using Canvas API or skip PNG entirely |
| `supabase/config.toml` | Modify | Add config for new function |
| DB migration | Execute | Add `share_image_url` column + `social_post_budget` table |

## Image Generation Strategy (avoiding WORKER_LIMIT)

Instead of `resvg_wasm`, the pre-generator will:
1. Build the SVG string (already working -- `renderCandlestickSVG`)
2. Upload the SVG to `share-images` bucket
3. For Twitter media upload: fetch the SVG, convert using Deno's built-in `OffscreenCanvas` (available in Deno Deploy) or simply upload as-is since Twitter's media endpoint processes images server-side
4. If Twitter rejects SVG: use a simple branded static PNG template as fallback (pre-uploaded default card with ticker/pattern text overlay via SVG text elements converted via a minimal approach)

**Pragmatic fallback**: If pure SVG works for Twitter media upload (it processes images), use that. If not, generate a simple branded card with just text (ticker, pattern, grade, R:R) -- no candlestick chart -- which is still far more engaging than plain text tweets.

## Expected Outcome

- Tweets include branded chart images (or at minimum, branded text cards)
- No compute crashes -- image gen happens in a separate, throttled batch job
- Rate limits respected via daily budget tracking
- 10-15 pattern alert tweets per day with images, distributed across trading sessions
