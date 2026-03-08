import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const BATCH_SIZE = 5; // Process up to 5 posts per run

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    console.log('Running social media scheduler at:', now.toISOString());

    // Step 1: Mark posts older than 48 hours as 'missed'
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const { data: staleMarked } = await supabaseClient
      .from('scheduled_posts')
      .update({ status: 'failed', error_message: 'Missed: post was not processed within 48h of scheduled time' })
      .eq('status', 'scheduled')
      .lt('scheduled_time', fortyEightHoursAgo.toISOString())
      .select('id');

    if (staleMarked && staleMarked.length > 0) {
      console.log(`Marked ${staleMarked.length} stale posts as missed`);
    }

    // Step 2: Find posts due now (within 24h window, batch of BATCH_SIZE)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const { data: duePosts, error: fetchError } = await supabaseClient
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lt('retry_count', MAX_RETRIES)
      .gte('scheduled_time', twentyFourHoursAgo.toISOString())
      .lte('scheduled_time', fiveMinutesFromNow.toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError);
      throw fetchError;
    }

    if (!duePosts || duePosts.length === 0) {
      console.log('No posts due at this time');
      return new Response(
        JSON.stringify({ message: 'No posts due', staleCleaned: staleMarked?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${duePosts.length} due posts`);

    const results: any[] = [];

    for (const post of duePosts) {
      try {
        console.log(`Processing post ${post.id} (type: ${post.post_type}, retry: ${post.retry_count})`);
        await processPost(supabaseClient, post, now);
        results.push({ id: post.id, status: 'posted' });
      } catch (err: any) {
        console.error(`Failed to process post ${post.id}:`, err.message);
        const newRetryCount = (post.retry_count || 0) + 1;

        if (newRetryCount >= MAX_RETRIES) {
          // Permanently failed
          await supabaseClient
            .from('scheduled_posts')
            .update({
              status: 'failed',
              retry_count: newRetryCount,
              error_message: `Failed after ${MAX_RETRIES} retries. Last error: ${err.message?.substring(0, 500)}`,
            })
            .eq('id', post.id);
          results.push({ id: post.id, status: 'failed_permanently', error: err.message });
        } else {
          // Keep as scheduled, increment retry count — will be picked up next run
          await supabaseClient
            .from('scheduled_posts')
            .update({
              status: 'scheduled',
              retry_count: newRetryCount,
              error_message: `Retry ${newRetryCount}/${MAX_RETRIES}: ${err.message?.substring(0, 500)}`,
            })
            .eq('id', post.id);
          results.push({ id: post.id, status: 'will_retry', retry: newRetryCount });
        }

        // Add small delay between retries to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('Batch results:', JSON.stringify(results));

    return new Response(
      JSON.stringify({ results, staleCleaned: staleMarked?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in social-media-scheduler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function processPost(supabaseClient: any, post: any, now: Date) {
  let content = post.content;
  let imageUrl = post.image_url;

  const isRealTweet = (text: string | null): boolean => {
    if (!text || text.trim().length < 80) return false;
    return /[\u{1F300}-\u{1FFFF}]|https?:\/\//u.test(text);
  };

  // Generate content for market reports if needed
  if (post.post_type === 'market_report' && !isRealTweet(content)) {
    console.log(`Post ${post.id}: generating fresh teaser...`);
    const reportConfig = post.report_config || {};
    const reportType = reportConfig.timeSpan ||
      (post.content?.includes('PRE-MARKET') || post.content?.includes('Pre-Market')
        ? 'pre_market' : 'post_market');
    const timezone = post.timezone || 'America/New_York';

    try {
      const { data: teaserData, error: teaserError } = await supabaseClient.functions.invoke(
        'generate-social-market-teaser',
        {
          body: {
            reportType,
            timezone,
            markets: reportConfig.markets || ['stocks', 'forex', 'crypto', 'commodities'],
            tone: reportConfig.tone || 'professional',
            linkBackUrl: 'chartingpath.com'
          }
        }
      );

      if (teaserError) throw new Error(`Teaser generation failed: ${JSON.stringify(teaserError)}`);
      if (teaserData?.teaser) {
        content = teaserData.teaser;
      } else {
        throw new Error('No teaser content returned');
      }
    } catch (error: any) {
      console.error(`Post ${post.id}: teaser generation failed, using fallback:`, error.message);
      const marketName = timezone.includes('Tokyo') ? 'Tokyo' :
                        timezone.includes('London') ? 'London' : 'US';
      const timeLabel = reportType === 'pre_market' ? 'Pre-Market' : 'Post-Market';
      const linkUrl = 'chartingpath.com';
      content = `📊 ${marketName} ${timeLabel} Analysis\n\nKey market insights and trading levels to watch!\n\n🚀 Full Report + Free Scripts at ${linkUrl}`;
    }
  }
  // Q&A content from library
  else if (post.post_type === 'qa_content' && post.content_library_id) {
    const { data: libraryContent, error: libraryError } = await supabaseClient
      .from('content_library')
      .select('*')
      .eq('id', post.content_library_id)
      .single();

    if (!libraryError && libraryContent) {
      content = libraryContent.content;
      imageUrl = libraryContent.image_url;
      await supabaseClient
        .from('content_library')
        .update({ last_posted_at: now.toISOString(), post_count: (libraryContent.post_count || 0) + 1 })
        .eq('id', post.content_library_id);
    }
  }

  // Self-healing: if educational post has empty content, re-fetch from the source piece
  if (post.post_type === 'educational' && (!content || content.trim().length < 20)) {
    const pieceId = post.report_config?.piece_id;
    if (pieceId) {
      console.log(`Post ${post.id}: educational content empty, re-fetching piece ${pieceId}`);
      const { data: piece } = await supabaseClient
        .from('educational_content_pieces')
        .select('content, hashtags')
        .eq('id', pieceId)
        .single();

      if (piece?.content && piece.content.trim().length >= 20) {
        const hashtags = (piece.hashtags || []).slice(0, 3).map((h: string) => `#${h}`).join(' ');
        content = hashtags ? `${piece.content}\n\n${hashtags}` : piece.content;
        console.log(`Post ${post.id}: recovered content (${content.length} chars)`);
      } else {
        console.error(`Post ${post.id}: piece ${pieceId} also has no content, skipping`);
        // Mark as failed so we don't retry endlessly
        await supabaseClient
          .from('scheduled_posts')
          .update({ status: 'failed', error_message: 'Source educational piece has no content' })
          .eq('id', post.id);
        return;
      }
    }
  }

  // Ensure link_back_url is appended
  let finalContent = content;
  if (post.link_back_url && !content?.includes(post.link_back_url)) {
    if (post.post_type === 'market_report') {
      finalContent = `${content}\n\n🚀 Full Analysis + Free Starter Scripts → ${post.link_back_url}`;
    } else {
      finalContent = `${content}\n\n🔗 ${post.link_back_url}`;
    }
  }

  // Mark as posting
  await supabaseClient
    .from('scheduled_posts')
    .update({ content: finalContent, image_url: imageUrl, status: 'posting' })
    .eq('id', post.id);

  // Post to social media — use direct fetch for better error details
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const postResponse = await fetch(`${supabaseUrl}/functions/v1/post-to-social-media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ scheduledPostId: post.id }),
  });

  const responseBody = await postResponse.text();

  if (!postResponse.ok) {
    throw new Error(`post-to-social-media returned ${postResponse.status}: ${responseBody.substring(0, 500)}`);
  }

  const postResult = JSON.parse(responseBody);
  console.log(`Post ${post.id} successfully posted:`, postResult);

  // Schedule next occurrence for recurring posts
  if (post.recurrence_pattern) {
    const nextTime = calculateNextScheduledTime(post.scheduled_time, post.recurrence_pattern);
    await supabaseClient
      .from('scheduled_posts')
      .insert({
        account_id: post.account_id,
        post_type: post.post_type,
        platform: post.platform,
        content: post.post_type === 'market_report' ? null : '',
        content_library_id: post.content_library_id,
        image_url: post.image_url,
        link_back_url: post.link_back_url,
        scheduled_time: nextTime,
        timezone: post.timezone,
        recurrence_pattern: post.recurrence_pattern,
        report_config: post.report_config,
        status: 'scheduled',
        retry_count: 0,
      });
    console.log(`Scheduled next occurrence at: ${nextTime}`);
  }
}

function calculateNextScheduledTime(currentTime: string, pattern: string): string {
  const current = new Date(currentTime);

  switch (pattern) {
    case 'daily':
      current.setDate(current.getDate() + 1);
      break;
    case 'weekdays':
      current.setDate(current.getDate() + 1);
      while (current.getDay() === 0 || current.getDay() === 6) {
        current.setDate(current.getDate() + 1);
      }
      break;
    case 'weekly':
      current.setDate(current.getDate() + 7);
      break;
    default:
      current.setDate(current.getDate() + 1);
  }

  return current.toISOString();
}
