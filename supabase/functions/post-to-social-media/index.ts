import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Twitter API helpers
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  return signature;
}

function generateOAuthHeader(
  method: string,
  url: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, apiSecret, accessTokenSecret);

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  return (
    "OAuth " +
    Object.entries(signedOAuthParams)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

async function postToTwitter(content: string, credentials: any): Promise<any> {
  const url = "https://api.x.com/2/tweets";
  const method = "POST";
  
  const oauthHeader = generateOAuthHeader(
    method,
    url,
    credentials.api_key,
    credentials.api_secret,
    credentials.access_token,
    credentials.access_token_secret
  );

  console.log('Posting to Twitter...');
  
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content }),
  });

  const responseText = await response.text();
  console.log('Twitter response:', responseText);

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function postToInstagram(content: string, imageUrl: string | null, credentials: any): Promise<any> {
  // Instagram Graph API posting
  const accessToken = credentials.access_token;
  const instagramAccountId = credentials.instagram_account_id;

  console.log('Posting to Instagram...');

  // Step 1: Create media container
  const mediaUrl = imageUrl 
    ? `https://graph.facebook.com/v18.0/${instagramAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(content)}&access_token=${accessToken}`
    : `https://graph.facebook.com/v18.0/${instagramAccountId}/media?caption=${encodeURIComponent(content)}&access_token=${accessToken}`;

  const containerResponse = await fetch(mediaUrl, { method: 'POST' });
  const containerData = await containerResponse.json();

  if (!containerResponse.ok) {
    throw new Error(`Instagram container creation error: ${JSON.stringify(containerData)}`);
  }

  const creationId = containerData.id;

  // Step 2: Publish the media
  const publishUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
  const publishResponse = await fetch(publishUrl, { method: 'POST' });
  const publishData = await publishResponse.json();

  if (!publishResponse.ok) {
    throw new Error(`Instagram publish error: ${JSON.stringify(publishData)}`);
  }

  return publishData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scheduledPostId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the scheduled post
    const { data: post, error: postError } = await supabaseClient
      .from('scheduled_posts')
      .select('*, social_media_accounts(*)')
      .eq('id', scheduledPostId)
      .single();

    if (postError || !post) {
      throw new Error('Scheduled post not found');
    }

    const { content, image_url, link_back_url, social_media_accounts: account } = post;

    if (!account || !account.is_active) {
      throw new Error('Social media account not found or inactive');
    }

    let platformResponse;
    let platformPostId;

    // Post to the appropriate platform
    if (account.platform === 'twitter') {
      const fullContent = link_back_url ? `${content}\n\n${link_back_url}` : content;
      platformResponse = await postToTwitter(fullContent, account.credentials);
      platformPostId = platformResponse.data?.id;
    } else if (account.platform === 'instagram') {
      const fullContent = link_back_url ? `${content}\n\n${link_back_url}` : content;
      platformResponse = await postToInstagram(fullContent, image_url, account.credentials);
      platformPostId = platformResponse.id;
    } else {
      throw new Error(`Unsupported platform: ${account.platform}`);
    }

    // Record in post history
    const { error: historyError } = await supabaseClient
      .from('post_history')
      .insert({
        scheduled_post_id: scheduledPostId,
        account_id: account.id,
        platform: account.platform,
        content,
        image_url,
        link_back_url,
        platform_post_id: platformPostId,
        platform_response: platformResponse,
        post_type: post.post_type,
      });

    if (historyError) {
      console.error('Error recording post history:', historyError);
    }

    // Update the scheduled post status
    const { error: updateError } = await supabaseClient
      .from('scheduled_posts')
      .update({ 
        status: 'posted',
        last_posted_at: new Date().toISOString()
      })
      .eq('id', scheduledPostId);

    if (updateError) {
      console.error('Error updating scheduled post:', updateError);
    }

    console.log('Successfully posted to', account.platform);

    return new Response(
      JSON.stringify({ 
        success: true,
        platform: account.platform,
        platformPostId,
        postedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in post-to-social-media:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
