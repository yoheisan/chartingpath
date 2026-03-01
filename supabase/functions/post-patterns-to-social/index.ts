import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_DAILY_POSTS = 25; // Increased to cover US session gaps

const SESSIONS = [
  { name: 'tokyo',   start: 0,  end: 9  },
  { name: 'london',  start: 7,  end: 16 },
  { name: 'newyork', start: 13, end: 22 },
];

const ALLOWED_GRADES = ['A', 'B'];

const ASSET_EMOJI: Record<string, string> = {
  stocks: '📈', etf: '📊', forex: '💱', fx: '💱',
  crypto: '🪙', commodities: '🛢️', indices: '🌐',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCurrentSession(hourUtc: number): string {
  if (hourUtc >= 13 && hourUtc < 22) return 'newyork';
  if (hourUtc >= 7  && hourUtc < 16) return 'london';
  if (hourUtc >= 0  && hourUtc < 9)  return 'tokyo';
  return 'offhours';
}

function formatPatternName(raw: string): string {
  return raw.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function directionEmoji(direction: string): string {
  return direction?.toLowerCase() === 'bullish' ? '🟢' : '🔴';
}

function buildTweet(pattern: any): string {
  const emoji = ASSET_EMOJI[pattern.asset_type?.toLowerCase()] ?? '📉';
  const dir = directionEmoji(pattern.direction);
  const patternName = formatPatternName(pattern.pattern_name);
  const grade = pattern.quality_score?.toUpperCase() ?? '?';
  const tf = pattern.timeframe?.toUpperCase() ?? '';
  const rr = Number(pattern.risk_reward_ratio).toFixed(1);
  const entry = Number(pattern.entry_price).toPrecision(5);
  const sl = Number(pattern.stop_loss_price).toPrecision(5);
  const tp = Number(pattern.take_profit_price).toPrecision(5);

  return (
    `${emoji} ${dir} ${patternName} — ${pattern.instrument} (${tf})\n\n` +
    `Grade: ${grade} | R:R ${rr}:1\n` +
    `Entry: ${entry} | SL: ${sl} | TP: ${tp}\n\n` +
    `Free alerts at chartingpath.com`
  ).slice(0, 280);
}

// ─── Twitter OAuth ──────────────────────────────────────────────────────────

function generateOAuthSignature(
  method: string, url: string, params: Record<string, string>,
  consumerSecret: string, tokenSecret: string
): string {
  const base = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&')
  )}`;
  const key = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return createHmac('sha1', key).update(base).digest('base64');
}

function generateOAuthHeader(method: string, url: string): string {
  const apiKey = Deno.env.get('TWITTER_API_KEY')!;
  const apiSecret = Deno.env.get('TWITTER_API_SECRET')!;
  const accessToken = Deno.env.get('TWITTER_ACCESS_TOKEN')!;
  const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET')!;

  const params = {
    oauth_consumer_key: apiKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };
  const sig = generateOAuthSignature(method, url, params, apiSecret, accessTokenSecret);
  return 'OAuth ' + Object.entries({ ...params, oauth_signature: sig })
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ');
}

// ─── Twitter media upload (v1.1) ─────────────────────────────────────────────

function uint8ToBase64(data: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < data.length; i += chunkSize) {
    binary += String.fromCharCode(...data.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function uploadMediaToTwitter(imageData: Uint8Array): Promise<string> {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const base64Data = uint8ToBase64(imageData);
  const formData = new FormData();
  formData.append('media_data', base64Data);

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: generateOAuthHeader('POST', url) },
    body: formData,
  });

  const body = await res.text();
  if (!res.ok) {
    console.warn(`[pattern-poster] Media upload failed ${res.status}: ${body}`);
    throw new Error(`Twitter media upload ${res.status}: ${body}`);
  }

  const data = JSON.parse(body);
  console.log(`[pattern-poster] ✅ Media uploaded: ${data.media_id_string}`);
  return data.media_id_string;
}

async function postToTwitter(text: string, mediaId?: string): Promise<{ id: string }> {
  const url = 'https://api.x.com/2/tweets';
  const payload: any = { text };
  if (mediaId) {
    payload.media = { media_ids: [mediaId] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: generateOAuthHeader('POST', url),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text();

  if (res.status === 429) throw new RateLimitError(body);
  if (!res.ok) throw new Error(`Twitter ${res.status}: ${body}`);
  return JSON.parse(body).data;
}

class RateLimitError extends Error {
  constructor(body: string) {
    super(`Twitter 429: ${body}`);
    this.name = 'RateLimitError';
  }
}

// ─── Budget check ───────────────────────────────────────────────────────────

async function checkAndIncrementBudget(supabase: any, platform: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);

  // Upsert today's row
  const { data, error } = await supabase
    .from('social_post_budget')
    .upsert(
      { platform, post_date: today, post_count: 0, max_posts: MAX_DAILY_POSTS },
      { onConflict: 'platform,post_date', ignoreDuplicates: true }
    )
    .select()
    .single();

  // Ensure max_posts is always synced to current constant
  await supabase
    .from('social_post_budget')
    .update({ max_posts: MAX_DAILY_POSTS })
    .eq('platform', platform)
    .eq('post_date', today);

  // Re-fetch to get actual count (upsert with ignoreDuplicates won't return existing row reliably)
  const { data: budget } = await supabase
    .from('social_post_budget')
    .select('post_count, max_posts')
    .eq('platform', platform)
    .eq('post_date', today)
    .single();

  if (!budget) return true; // If no row, allow (first post)

  if (budget.post_count >= budget.max_posts) {
    console.warn(`[pattern-poster] ⛔ Daily budget exhausted: ${budget.post_count}/${budget.max_posts}`);
    return false;
  }

  // Increment
  await supabase
    .from('social_post_budget')
    .update({ post_count: budget.post_count + 1, updated_at: new Date().toISOString() })
    .eq('platform', platform)
    .eq('post_date', today);

  console.log(`[pattern-poster] 📊 Budget: ${budget.post_count + 1}/${budget.max_posts}`);
  return true;
}

// ─── Download pre-generated image (SVG → PNG via weserv.nl proxy) ───────────

async function downloadImageAsBytes(url: string): Promise<Uint8Array | null> {
  try {
    // Twitter rejects SVG — convert via free weserv.nl image proxy
    let fetchUrl = url;
    if (url.endsWith('.svg') || url.includes('image/svg')) {
      fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=png&w=1200`;
      console.log(`[pattern-poster] Converting SVG→PNG via weserv.nl`);
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      console.warn(`[pattern-poster] Image download failed: ${res.status}`);
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    console.log(`[pattern-poster] Image downloaded: ${contentType}, ${res.headers.get('content-length')} bytes`);
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (err: any) {
    console.warn(`[pattern-poster] Image download error: ${err.message}`);
    return null;
  }
}

// ─── Ensure share token ──────────────────────────────────────────────────────

async function ensureShareToken(supabase: any, patternId: string): Promise<string> {
  const { data } = await supabase
    .from('live_pattern_detections')
    .select('share_token')
    .eq('id', patternId)
    .single();

  if (data?.share_token) return data.share_token;

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  await supabase
    .from('live_pattern_detections')
    .update({ share_token: token })
    .eq('id', patternId);

  return token;
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const nowUtc = new Date();
    const hourUtc = nowUtc.getUTCHours();
    const session = getCurrentSession(hourUtc);
    console.log(`[pattern-poster] Running at ${nowUtc.toISOString()} — session: ${session}`);

    // ── Budget check ──────────────────────────────────────────────────────
    const withinBudget = await checkAndIncrementBudget(supabase, 'twitter');
    if (!withinBudget) {
      return new Response(JSON.stringify({ posted: 0, reason: 'daily_budget_exhausted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Find already-posted pattern IDs ───────────────────────────────────
    const sessionStart = new Date(nowUtc);
    const sessionDef = SESSIONS.find(s => s.name === session);
    if (sessionDef) {
      sessionStart.setUTCHours(sessionDef.start, 0, 0, 0);
      if (sessionStart > nowUtc) sessionStart.setDate(sessionStart.getDate() - 1);
    } else {
      sessionStart.setTime(nowUtc.getTime() - 3 * 60 * 60 * 1000);
    }

    const { data: recentPosts } = await supabase
      .from('post_history')
      .select('pattern_id')
      .eq('post_type', 'pattern_alert')
      .gte('posted_at', sessionStart.toISOString());

    const postedPatternIds = new Set((recentPosts ?? []).map((p: any) => p.pattern_id).filter(Boolean));

    // ── Fetch A/B grade active patterns ───────────────────────────────────
    const { data: patterns, error: pErr } = await supabase
      .from('live_pattern_detections')
      .select('id, pattern_name, instrument, asset_type, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, share_token, share_image_url, status, trend_alignment')
      .in('quality_score', ALLOWED_GRADES)
      .in('status', ['active', 'pending'])
      .order('last_confirmed_at', { ascending: false })
      .limit(100);

    if (pErr) throw pErr;

    if (!patterns || patterns.length === 0) {
      console.log('[pattern-poster] No A/B grade patterns available');
      return new Response(JSON.stringify({ posted: 0, reason: 'no_patterns' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter for contextually-aligned patterns only:
    // Bullish setups should be with_trend or neutral (not counter_trend)
    // Bearish setups should be with_trend or neutral (not counter_trend)
    // Patterns without trend data are excluded to maintain quality
    const contextFiltered = patterns.filter((p: any) => {
      const alignment = p.trend_alignment?.toLowerCase();
      if (!alignment) {
        console.log(`[pattern-poster] Skipping ${p.instrument} ${p.pattern_name} — no trend data`);
        return false;
      }
      if (alignment === 'counter_trend') {
        console.log(`[pattern-poster] Skipping ${p.instrument} ${p.pattern_name} — counter-trend`);
        return false;
      }
      return true; // 'with_trend' or 'neutral'/'sideways'
    });

    console.log(`[pattern-poster] ${patterns.length} A/B patterns → ${contextFiltered.length} after trend filter`);

    // Prefer patterns WITH images, then without
    const unposted = contextFiltered.filter((p: any) => !postedPatternIds.has(p.id));
    const withImage = unposted.filter((p: any) => p.share_image_url);
    const toPost = (withImage.length > 0 ? withImage : unposted).slice(0, 1);

    // ── Get active Twitter account ────────────────────────────────────────
    const { data: accounts } = await supabase
      .from('social_media_accounts')
      .select('id, platform, account_name')
      .eq('platform', 'twitter')
      .eq('is_active', true)
      .limit(1);

    const twitterAccount = accounts?.[0];
    if (!twitterAccount) {
      console.warn('[pattern-poster] No active Twitter account found');
      return new Response(JSON.stringify({ posted: 0, reason: 'no_twitter_account' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Post ──────────────────────────────────────────────────────────────
    const results: any[] = [];

    for (const pattern of toPost) {
      try {
        const token = await ensureShareToken(supabase, pattern.id);
        const shareUrl = `https://chartingpath.com/s/${token}`;
        const tweet = buildTweet(pattern);

        // Try to attach pre-generated image
        let mediaId: string | undefined;
        if (pattern.share_image_url) {
          try {
            const imageBytes = await downloadImageAsBytes(pattern.share_image_url);
            if (imageBytes && imageBytes.length > 0) {
              mediaId = await uploadMediaToTwitter(imageBytes);
              console.log(`[pattern-poster] 🖼️ Image attached for ${pattern.instrument}`);
            }
          } catch (imgErr: any) {
            console.warn(`[pattern-poster] Image attach failed, posting text-only: ${imgErr.message}`);
          }
        } else {
          console.log(`[pattern-poster] No pre-generated image for ${pattern.instrument}, posting text-only`);
        }

        console.log(`[pattern-poster] Posting: ${pattern.instrument} ${pattern.pattern_name} (${pattern.quality_score})${mediaId ? ' [with image]' : ''}`);
        const twitterResponse = await postToTwitter(tweet, mediaId);

        await supabase.from('post_history').insert({
          account_id: twitterAccount.id,
          platform: 'twitter',
          post_type: 'pattern_alert',
          content: tweet,
          link_back_url: shareUrl,
          platform_post_id: twitterResponse?.id,
          platform_response: twitterResponse,
          pattern_id: pattern.id,
          session_window: session,
          posted_at: nowUtc.toISOString(),
        });

        results.push({ pattern_id: pattern.id, instrument: pattern.instrument, tweet_id: twitterResponse?.id, has_image: !!mediaId });
        console.log(`[pattern-poster] ✅ Posted ${pattern.instrument} — tweet ${twitterResponse?.id}${mediaId ? ' (with image)' : ''}`);

      } catch (err: any) {
        if (err.name === 'RateLimitError') {
          console.warn('[pattern-poster] ⏳ Rate limited — will retry next invocation');
          results.push({ pattern_id: pattern.id, instrument: pattern.instrument, error: 'rate_limited' });
          break;
        }
        console.error(`[pattern-poster] ❌ Failed to post ${pattern.instrument}:`, err.message);
        results.push({ pattern_id: pattern.id, instrument: pattern.instrument, error: err.message });
      }
    }

    console.log(`[pattern-poster] Done — posted ${results.filter(r => !r.error).length}/${toPost.length}`);

    return new Response(
      JSON.stringify({ posted: results.filter(r => !r.error).length, results, session }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[pattern-poster] Fatal error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
