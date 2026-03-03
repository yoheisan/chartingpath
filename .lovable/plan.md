

## Signal Post Generator for Social Media CMS

### What it does
Adds a new "Signals" tab to the Social Media CMS page. Clicking "Generate" fetches the top 5 A/B-grade active patterns from `live_pattern_detections` and formats each as a ready-to-copy tweet using the exact same format as the automated `post-patterns-to-social` edge function.

### UI Design
- New tab with a Zap icon labeled "Signals" in the existing tabs grid (8 cols instead of 7)
- A "Generate Signal Posts" button at the top
- Below it, a list of up to 5 cards, each showing:
  - The formatted tweet text (same `buildTweet` format)
  - Pattern metadata (instrument, grade, direction, timeframe)
  - A "Copy" button that copies the tweet text to clipboard with toast feedback

### Implementation

**1. New component: `src/components/cms/SignalPostGenerator.tsx`**
- On "Generate" click, queries `live_pattern_detections` directly via Supabase client:
  ```sql
  .from('live_pattern_detections')
  .select('pattern_name, instrument, asset_type, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, trend_alignment, status')
  .in('quality_score', ['A', 'B'])
  .in('status', ['active', 'pending'])
  .order('last_confirmed_at', { ascending: false })
  .limit(20)
  ```
- Client-side filters for `trend_alignment` (exclude `counter_trend` and null), then takes top 5
- Replicates `buildTweet` logic client-side (same emoji map, formatting, 280-char slice)
- Each result rendered as a card with pre-formatted tweet and copy button

**2. Update `src/pages/SocialMediaCMS.tsx`**
- Add "Signals" tab (with Zap icon) to the TabsList
- Change grid from 7 to 8 columns
- Add corresponding TabsContent rendering `<SignalPostGenerator />`

### No backend or DB changes needed
All data is read from the existing `live_pattern_detections` table. The tweet formatting is purely client-side, matching the edge function format exactly.

