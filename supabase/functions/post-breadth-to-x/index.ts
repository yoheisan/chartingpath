import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Twitter OAuth (same as post-patterns-to-social) ────────────────────────

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

async function postToTwitter(text: string): Promise<{ id: string }> {
  const url = 'https://api.x.com/2/tweets';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: generateOAuthHeader('POST', url),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Twitter ${res.status}: ${body}`);
  return JSON.parse(body).data;
}

// ─── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { region = 'Americas', reportType = 'post-market' } = await req.json().catch(() => ({}));
    const now = new Date();
    console.log(`[post-breadth] Starting at ${now.toISOString()} — region: ${region}, type: ${reportType}`);

    // Check if we already posted breadth today
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    
    const { data: existingPosts } = await supabase
      .from('post_history')
      .select('id')
      .eq('post_type', 'market_breadth')
      .gte('posted_at', todayStart.toISOString())
      .limit(1);

    if (existingPosts && existingPosts.length > 0) {
      console.log('[post-breadth] Already posted breadth today, skipping');
      return new Response(JSON.stringify({ posted: 0, reason: 'already_posted_today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate the teaser via existing function
    const timezone = 'America/New_York';
    const { data: teaserData, error: teaserError } = await supabase.functions.invoke(
      'generate-social-market-teaser',
      {
        body: {
          reportType: 'post_market',
          timezone,
          markets: ['stocks', 'forex', 'crypto', 'commodities'],
          tone: 'professional',
          linkBackUrl: 'chartingpath.com',
        },
      }
    );

    if (teaserError) throw new Error(`Teaser generation failed: ${JSON.stringify(teaserError)}`);
    
    let tweetContent = teaserData?.teaser;
    if (!tweetContent) {
      // Fallback if teaser generation returns nothing
      tweetContent = `📊 US Post-Market Breadth Report\n\nKey market insights from today's session!\n\n🚀 Full Report + Free Scripts at chartingpath.com`;
    }

    // Ensure it fits Twitter's limit
    tweetContent = tweetContent.slice(0, 280);

    console.log(`[post-breadth] Tweet (${tweetContent.length} chars): ${tweetContent.substring(0, 80)}...`);

    // Post to X
    const twitterResponse = await postToTwitter(tweetContent);
    console.log(`[post-breadth] ✅ Posted — tweet ${twitterResponse.id}`);

    // Get the Twitter account for history
    const { data: account } = await supabase
      .from('social_media_accounts')
      .select('id')
      .eq('platform', 'twitter')
      .eq('is_active', true)
      .single();

    // Record in post_history
    await supabase.from('post_history').insert({
      account_id: account?.id,
      platform: 'twitter',
      post_type: 'market_breadth',
      content: tweetContent,
      link_back_url: 'https://chartingpath.com',
      platform_post_id: twitterResponse.id,
      platform_response: twitterResponse,
      posted_at: now.toISOString(),
    });

    return new Response(
      JSON.stringify({ posted: 1, tweet_id: twitterResponse.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[post-breadth] Error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
