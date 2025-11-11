import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Find posts scheduled for now (within 5 minute window)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const { data: duePost, error: fetchError } = await supabaseClient
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_time', fiveMinutesAgo.toISOString())
      .lte('scheduled_time', fiveMinutesFromNow.toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError);
      throw fetchError;
    }

    if (!duePost || duePost.length === 0) {
      console.log('No posts due at this time');
      return new Response(
        JSON.stringify({ message: 'No posts due' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const post = duePost[0];
    console.log('Processing post:', post.id, 'Type:', post.post_type);

    let content = post.content;
    let imageUrl = post.image_url;

    // If it's a market report type, generate a fresh teaser
    if (post.post_type === 'market_report') {
      console.log('Generating market report teaser...');
      
      // Use stored report config or fallback to defaults
      const reportConfig = post.report_config || {};
      const reportType = reportConfig.timeSpan || 
        (post.content.includes('PRE-MARKET') || post.content.includes('Pre-Market')
          ? 'pre_market'
          : 'post_market');
      const timezone = post.timezone || 'America/New_York';

      try {
        // First, get the latest market report to ensure we have fresh data
        const { data: reportData, error: reportError } = await supabaseClient.functions.invoke(
          'get-cached-market-report',
          {
            body: { 
              timezone,
              timeSpan: reportType === 'pre_market' ? 'current_day' : 'previous_day',
              markets: reportConfig.markets || ['stocks', 'forex', 'crypto', 'commodities'],
              tone: reportConfig.tone || 'professional',
              forceGenerate: false
            }
          }
        );

        if (reportError) {
          console.error('Error fetching market report:', reportError);
        }

        // Now generate the social teaser based on the report
        const { data: teaserData, error: teaserError } = await supabaseClient.functions.invoke(
          'generate-social-market-teaser',
          {
            body: { 
              reportType,
              timezone,
              markets: reportConfig.markets || ['stocks', 'forex', 'crypto', 'commodities'],
              tone: reportConfig.tone || 'professional',
              linkBackUrl: post.link_back_url || 'https://chartingpath.com/tools/market-breadth'
            }
          }
        );

        if (teaserError) {
          console.error('Error generating teaser:', teaserError);
          throw teaserError;
        }
        
        if (teaserData?.teaser) {
          content = teaserData.teaser;
          console.log('Generated teaser content:', content);
        } else {
          throw new Error('No teaser content returned');
        }
      } catch (error) {
        console.error('Failed to generate teaser, using fallback:', error);
        // Fallback content with market info and CTA
        const marketName = timezone.includes('Tokyo') ? 'Tokyo' : 
                          timezone.includes('London') ? 'London' : 'US';
        const timeLabel = reportType === 'pre_market' ? 'Pre-Market' : 'Post-Market';
        const linkUrl = post.link_back_url || 'https://chartingpath.com/tools/market-breadth';
        content = `📊 ${marketName} ${timeLabel} Analysis\n\nKey market insights and trading levels to watch!\n\n🚀 Full Report + Free Starter Scripts → ${linkUrl}`;
      }
    }
    // If it's Q&A content and content_library_id is set, get fresh content
    else if (post.post_type === 'qa_content' && post.content_library_id) {
      console.log('Fetching Q&A content from library...');
      
      const { data: libraryContent, error: libraryError } = await supabaseClient
        .from('content_library')
        .select('*')
        .eq('id', post.content_library_id)
        .single();

      if (!libraryError && libraryContent) {
        content = libraryContent.content;
        imageUrl = libraryContent.image_url;
        
        // Update last posted timestamp for rotation
        await supabaseClient
          .from('content_library')
          .update({ 
            last_posted_at: now.toISOString(),
            post_count: (libraryContent.post_count || 0) + 1
          })
          .eq('id', post.content_library_id);
      }
    }

    // Ensure content always includes link_back_url if present
    let finalContent = content;
    if (post.link_back_url) {
      // For market reports, ensure CTA is always at the end
      if (post.post_type === 'market_report' && !content.includes(post.link_back_url)) {
        finalContent = `${content}\n\n🚀 Full Analysis + Free Starter Scripts → ${post.link_back_url}`;
      } else if (!content.includes(post.link_back_url)) {
        finalContent = `${content}\n\n🔗 ${post.link_back_url}`;
      }
    }

    console.log('Final content to post:', finalContent);

    // Update post with final content before posting
    await supabaseClient
      .from('scheduled_posts')
      .update({ 
        content: finalContent,
        image_url: imageUrl,
        status: 'posting'
      })
      .eq('id', post.id);

    // Post to social media
    console.log('Posting to social media...');
    const { data: postResult, error: postError } = await supabaseClient.functions.invoke(
      'post-to-social-media',
      {
        body: { scheduledPostId: post.id }
      }
    );

    if (postError) {
      console.error('Error posting to social media:', postError);
      // Mark as failed
      await supabaseClient
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', post.id);
      
      throw postError;
    }

    console.log('Successfully posted:', postResult);

    // If it's a recurring post, schedule the next one
    if (post.recurrence_pattern) {
      const nextTime = calculateNextScheduledTime(post.scheduled_time, post.recurrence_pattern);
      
      await supabaseClient
        .from('scheduled_posts')
        .insert({
          account_id: post.account_id,
          post_type: post.post_type,
          platform: post.platform,
          content: post.post_type === 'market_report' ? post.content : '', // Will be generated fresh
          content_library_id: post.content_library_id,
          image_url: post.image_url,
          link_back_url: post.link_back_url,
          scheduled_time: nextTime,
          timezone: post.timezone,
          recurrence_pattern: post.recurrence_pattern,
          report_config: post.report_config,
          status: 'scheduled'
        });
      
      console.log('Scheduled next occurrence at:', nextTime);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        posted: postResult,
        nextScheduled: post.recurrence_pattern ? true : false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in social-media-scheduler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function calculateNextScheduledTime(currentTime: string, pattern: string): string {
  const current = new Date(currentTime);
  
  switch (pattern) {
    case 'daily':
      current.setDate(current.getDate() + 1);
      break;
    case 'weekdays':
      current.setDate(current.getDate() + 1);
      // Skip weekends
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
