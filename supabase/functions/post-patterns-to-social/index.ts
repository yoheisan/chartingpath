import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Session Windows (UTC hours) ────────────────────────────────────────────
// Each session: [startHour, endHour) UTC
const SESSIONS = [
  { name: 'tokyo',   start: 0,  end: 9  },  // 00:00–09:00 UTC
  { name: 'london',  start: 7,  end: 16 },  // 07:00–16:00 UTC
  { name: 'newyork', start: 13, end: 22 },  // 13:00–22:00 UTC
];

function getCurrentSession(hourUtc: number): string {
  // Priority: New York > London > Tokyo (most overlap = most liquidity)
  if (hourUtc >= 13 && hourUtc < 22) return 'newyork';
  if (hourUtc >= 7  && hourUtc < 16) return 'london';
  if (hourUtc >= 0  && hourUtc < 9)  return 'tokyo';
  return 'offhours'; // 22:00–00:00 UTC — still allow posting in off-hours
}

// ─── Quality grade filter ────────────────────────────────────────────────────
const ALLOWED_GRADES = ['A', 'B'];

// ─── Asset class label → tweet emoji ────────────────────────────────────────
const ASSET_EMOJI: Record<string, string> = {
  stocks:      '📈',
  etf:         '📊',
  forex:       '💱',
  fx:          '💱',
  crypto:      '🪙',
  commodities: '🛢️',
  indices:     '🌐',
};

// ─── Pattern name → readable label ──────────────────────────────────────────
function formatPatternName(raw: string): string {
  return raw
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Direction emoji ─────────────────────────────────────────────────────────
function directionEmoji(direction: string): string {
  return direction?.toLowerCase() === 'bullish' ? '🟢' : '🔴';
}

// ─── Build tweet text ────────────────────────────────────────────────────────
function buildTweet(pattern: any, shareUrl: string): string {
  const emoji       = ASSET_EMOJI[pattern.asset_type?.toLowerCase()] ?? '📉';
  const dir         = directionEmoji(pattern.direction);
  const patternName = formatPatternName(pattern.pattern_name);
  const grade       = pattern.quality_score?.toUpperCase() ?? '?';
  const tf          = pattern.timeframe?.toUpperCase() ?? '';
  const rr          = Number(pattern.risk_reward_ratio).toFixed(1);
  const entry       = Number(pattern.entry_price).toPrecision(5);
  const sl          = Number(pattern.stop_loss_price).toPrecision(5);
  const tp          = Number(pattern.take_profit_price).toPrecision(5);

  return (
    `${emoji} ${dir} ${patternName} — ${pattern.instrument} (${tf})\n\n` +
    `Grade: ${grade} | R:R ${rr}:1\n` +
    `Entry: ${entry} | SL: ${sl} | TP: ${tp}\n\n` +
    `🔗 Full setup → ${shareUrl}`
  ).slice(0, 280); // Twitter hard limit
}

// ─── Twitter OAuth helper ────────────────────────────────────────────────────
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
  const apiKey           = Deno.env.get('TWITTER_API_KEY')!;
  const apiSecret        = Deno.env.get('TWITTER_API_SECRET')!;
  const accessToken      = Deno.env.get('TWITTER_ACCESS_TOKEN')!;
  const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET')!;

  const params = {
    oauth_consumer_key:     apiKey,
    oauth_nonce:            Math.random().toString(36).substring(2),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
    oauth_token:            accessToken,
    oauth_version:          '1.0',
  };
  const sig = generateOAuthSignature(method, url, params, apiSecret, accessTokenSecret);
  return (
    'OAuth ' +
    Object.entries({ ...params, oauth_signature: sig })
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(', ')
  );
}

// ─── Twitter media upload (v1.1 API) ─────────────────────────────────────────

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
    headers: {
      Authorization: generateOAuthHeader('POST', url),
    },
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

  if (res.status === 429) {
    throw new RateLimitError(body);
  }

  if (!res.ok) throw new Error(`Twitter ${res.status}: ${body}`);
  return JSON.parse(body).data;
}

class RateLimitError extends Error {
  constructor(body: string) {
    super(`Twitter 429: ${body}`);
    this.name = 'RateLimitError';
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

  // Generate a new token
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
    const nowUtc  = new Date();
    const hourUtc = nowUtc.getUTCHours();

    // Pattern poster is read-only and lightweight — no seeding window guard needed
    const session = getCurrentSession(hourUtc);
    console.log(`[pattern-poster] Running at ${nowUtc.toISOString()} — session: ${session}`);

    // ── 1. Find already-posted pattern IDs for this session ────────────────
    const sessionStart = new Date(nowUtc);
    // Reset to start of current session window
    const sessionDef = SESSIONS.find(s => s.name === session);
    if (sessionDef) {
      sessionStart.setUTCHours(sessionDef.start, 0, 0, 0);
      // If session start is in the past today, use that; otherwise yesterday
      if (sessionStart > nowUtc) sessionStart.setDate(sessionStart.getDate() - 1);
    } else {
      // Off-hours: look back 3 hours
      sessionStart.setTime(nowUtc.getTime() - 3 * 60 * 60 * 1000);
    }

    const { data: recentPosts } = await supabase
      .from('post_history')
      .select('pattern_id, post_type')
      .eq('post_type', 'pattern_alert')
      .gte('posted_at', sessionStart.toISOString());

    const postedPatternIds = new Set((recentPosts ?? []).map((p: any) => p.pattern_id).filter(Boolean));

    // Also track which asset classes have already been posted this session
    const { data: sessionAssetPosts } = await supabase
      .from('post_history')
      .select('pattern_id')
      .eq('post_type', 'pattern_alert')
      .eq('session_window', session)
      .gte('posted_at', sessionStart.toISOString());

    // We need asset_type — re-fetch with join
    const sessionPostedIds = new Set((sessionAssetPosts ?? []).map((p: any) => p.pattern_id).filter(Boolean));

    // ── 2. Fetch A/B grade active patterns not yet posted ──────────────────
    const { data: patterns, error: pErr } = await supabase
      .from('live_pattern_detections')
      .select('id, pattern_name, instrument, asset_type, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, share_token, status, last_confirmed_at')
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

    // ── 3. Filter: not already posted — pick only ONE to avoid rate limits ──
    const unposted = patterns.filter((p: any) => !postedPatternIds.has(p.id) && !sessionPostedIds.has(p.id));

    // Pick up to 3 unposted patterns (most recently confirmed)
    const toPost = unposted.slice(0, 3);

    // ── 4. Get the active Twitter account ──────────────────────────────────
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

    // ── 5. Post the single selected pattern ───────────────────────────────
    const results = [];

    for (const [i, pattern] of toPost.entries()) {
      // Stagger requests to avoid burst rate limits AND CPU compute limits
      // (resvg WASM PNG conversion is CPU-heavy; 10s ensures the previous
      //  generate-share-image worker has fully shut down before the next boots)
      if (i > 0) await new Promise(r => setTimeout(r, 10000));

      try {
        const token    = await ensureShareToken(supabase, pattern.id);
        const shareUrl = `https://chartingpath.com/s/${token}`;
        const tweet    = buildTweet(pattern, shareUrl);

        // Generate branded share image and upload as Twitter media
        let mediaId: string | undefined;
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

          // 1. Generate the share image (now produces PNG)
          const imgRes = await fetch(`${supabaseUrl}/functions/v1/generate-share-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ token, pattern_id: pattern.id }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            console.log(`[pattern-poster] ✅ Share image generated: ${imgData.format} — ${imgData.url}`);

            // Only upload PNGs — Twitter rejects SVGs
            if (imgData.format === 'svg') {
              console.warn(`[pattern-poster] ⚠️ Image is SVG (not PNG) — skipping media upload`);
            } else {
              // 2. Download the PNG from storage
              const pngRes = await fetch(imgData.url);
              if (pngRes.ok) {
                const pngBuffer = new Uint8Array(await pngRes.arrayBuffer());
                console.log(`[pattern-poster] Downloaded PNG: ${pngBuffer.length} bytes`);

                // 3. Upload to Twitter as media
                try {
                  mediaId = await uploadMediaToTwitter(pngBuffer);
                } catch (mediaErr: any) {
                  console.warn(`[pattern-poster] ⚠️ Media upload failed (will post without image): ${mediaErr.message}`);
                }
              }
            }
          } else {
            const errBody = await imgRes.text();
            console.warn(`[pattern-poster] ⚠️ Share image generation failed (non-blocking): ${errBody}`);
          }
        } catch (imgErr: any) {
          console.warn(`[pattern-poster] ⚠️ Share image error (non-blocking): ${imgErr.message}`);
        }

        console.log(`[pattern-poster] Posting: ${pattern.instrument} ${pattern.pattern_name} (${pattern.quality_score})${mediaId ? ' [with image]' : ''}`);

        const twitterResponse = await postToTwitter(tweet, mediaId);

        // Record in post_history
        await supabase.from('post_history').insert({
          account_id:       twitterAccount.id,
          platform:         'twitter',
          post_type:        'pattern_alert',
          content:          tweet,
          link_back_url:    shareUrl,
          platform_post_id: twitterResponse?.id,
          platform_response: twitterResponse,
          pattern_id:       pattern.id,
          session_window:   session,
          posted_at:        nowUtc.toISOString(),
        });

        results.push({ pattern_id: pattern.id, instrument: pattern.instrument, tweet_id: twitterResponse?.id });
        console.log(`[pattern-poster] ✅ Posted ${pattern.instrument} — tweet ${twitterResponse?.id}`);

      } catch (err: any) {
        if (err.name === 'RateLimitError') {
          console.warn(`[pattern-poster] ⏳ Rate limited — will retry next invocation (in 30m)`);
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
