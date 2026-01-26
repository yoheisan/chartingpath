import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    console.log('Starting market report teaser preparation...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find scheduled posts of type 'market_report' that are:
    // 1. Scheduled between now and 3 minutes from now
    // 2. Status is 'scheduled'
    // 3. Don't have content generated yet (content is null or empty)
    const now = new Date();
    const threeMinutesLater = new Date(now.getTime() + 3 * 60 * 1000);

    const { data: upcomingPosts, error: fetchError } = await supabaseClient
      .from('scheduled_posts')
      .select('*')
      .eq('post_type', 'market_report')
      .eq('status', 'scheduled')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', threeMinutesLater.toISOString())
      .or('content.is.null,content.eq.""');

    if (fetchError) {
      console.error('Error fetching upcoming posts:', fetchError);
      throw fetchError;
    }

    if (!upcomingPosts || upcomingPosts.length === 0) {
      console.log('No upcoming market report posts found in the next 3 minutes');
      return new Response(
        JSON.stringify({ 
          message: 'No upcoming posts to prepare',
          checked_window: `${now.toISOString()} to ${threeMinutesLater.toISOString()}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${upcomingPosts.length} posts to prepare`);

    const results = [];

    for (const post of upcomingPosts) {
      try {
        console.log(`Generating teaser for post ${post.id}...`);
        
        // Determine report type based on time or config
        const reportConfig = post.report_config || {};
        const reportType = reportConfig.reportType || 'post_market';
        const timezone = post.timezone || 'America/New_York';
        const linkBackUrl = post.link_back_url || 'https://chartingpath.com/tools/market-breadth';

        // Generate the teaser
        const { data: teaserData, error: teaserError } = await supabaseClient.functions.invoke(
          'generate-social-market-teaser',
          {
            body: {
              reportType,
              timezone,
              linkBackUrl,
            }
          }
        );

        if (teaserError || !teaserData?.teaser) {
          console.error(`Failed to generate teaser for post ${post.id}:`, teaserError);
          results.push({
            post_id: post.id,
            success: false,
            error: teaserError?.message || 'No teaser generated',
          });
          continue;
        }

        const generatedTeaser = teaserData.teaser;
        console.log(`Generated teaser for post ${post.id}: ${generatedTeaser.substring(0, 50)}...`);

        // Update the post with the generated content
        const { error: updateError } = await supabaseClient
          .from('scheduled_posts')
          .update({
            content: generatedTeaser,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        if (updateError) {
          console.error(`Failed to update post ${post.id}:`, updateError);
          results.push({
            post_id: post.id,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`Successfully prepared post ${post.id}`);
          results.push({
            post_id: post.id,
            success: true,
            teaser_preview: generatedTeaser.substring(0, 100),
          });
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        results.push({
          post_id: post.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Market report teaser preparation complete',
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in prepare-market-report-teasers:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
