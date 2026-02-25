
# Fix X (Twitter) Link Preview Cards

## Problem
Tweets include a link to `chartingpath.com/s/{token}`. Twitter's crawler hits the `og-share` edge function which serves `og:image` pointing to `share-images/{token}.png` -- but that PNG was never generated (image gen is disabled due to WORKER_LIMIT). Twitter falls back to crawling the page and showing a generic, low-quality site screenshot.

## Solution
Two-part fix: a branded fallback OG image + an option to remove the card entirely for cleaner text-only posts.

### Part 1: Static Branded Fallback OG Image
- Design and upload a static 1200x630 branded "ChartingPath - Live Pattern Alert" image to the `share-images` Supabase storage bucket as `default-og.png`
- Update `supabase/functions/og-share/index.ts` to check if the pattern-specific PNG exists in storage; if not, use the fallback URL
- This way every link preview shows a clean, professional branded card instead of a blurry screenshot

### Part 2: Update og-share to include pattern details in the card
- The OG title and description are already dynamic (instrument, entry, SL, TP) -- these will display nicely alongside the branded fallback image
- Ensure `twitter:card` stays as `summary_large_image` for maximum visibility

### Part 3: Consider removing the link from pattern tweets
- Alternative: remove the `chartingpath.com/s/{token}` URL from the tweet text entirely so Twitter shows NO card -- pure text posts are cleaner and get better engagement
- Keep the share URL only in `post_history` for tracking, not in the tweet itself
- This is the simplest approach and avoids the OG image problem altogether

## Technical Changes

### Option A (Recommended): Remove link from tweets, pure text
- **`supabase/functions/post-patterns-to-social/index.ts`**: In `buildTweet()`, remove the share URL line. Replace with a CTA like "Free alerts at chartingpath.com" (no `/s/token` path, so no card generated). Twitter won't generate a link preview for bare domain mentions without `https://`.
- Redeploy the function

### Option B: Keep link, fix the card image
- Upload a static `default-og.png` (1200x630) to `share-images` bucket
- **`supabase/functions/og-share/index.ts`**: Before setting `ogImageUrl`, check if `{token}.png` exists in storage via a HEAD request; if 404, fall back to `default-og.png`
- Redeploy the function

### Recommendation
Go with **Option A** -- remove the direct share link from tweet text and replace with a plain domain mention. This gives cleaner text-only posts, better engagement (Twitter deprioritizes tweets with external links), and sidesteps the image problem entirely. The share URL is still recorded in `post_history` for analytics.
