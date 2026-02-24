import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('schedule-educational-posts invoked at', new Date().toISOString());
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the Twitter account
    const { data: account } = await supabase
      .from('social_media_accounts')
      .select('id')
      .eq('platform', 'twitter')
      .eq('is_active', true)
      .single();
    
    if (!account) throw new Error('No active Twitter account found');

    // Get total number of active pieces
    const { count: totalPieces } = await supabase
      .from('educational_content_pieces')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('global_order', 'is', null);
    
    if (!totalPieces || totalPieces === 0) {
      return new Response(
        JSON.stringify({ message: 'No educational content pieces available. Generate them first.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all market regions
    const { data: markets, error: marketsError } = await supabase
      .from('educational_schedule_state')
      .select('*')
      .eq('is_active', true)
      .order('market_region');
    
    if (marketsError) throw marketsError;
    if (!markets || markets.length === 0) throw new Error('No markets configured');

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    // Skip weekends
    const dayOfWeek = tomorrow.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return new Response(
        JSON.stringify({ message: 'Skipping weekend', day: dayOfWeek }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if posts already scheduled for tomorrow
    const tomorrowStart = `${tomorrowDate}T00:00:00Z`;
    const tomorrowEnd = `${tomorrowDate}T23:59:59Z`;
    
    const { data: existingPosts } = await supabase
      .from('scheduled_posts')
      .select('id')
      .eq('post_type', 'educational')
      .gte('scheduled_time', tomorrowStart)
      .lte('scheduled_time', tomorrowEnd);
    
    if (existingPosts && existingPosts.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Posts already scheduled for tomorrow', count: existingPosts.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scheduledPosts: any[] = [];

    for (const market of markets) {
      // Get the piece at the current position (with wraparound)
      const position = market.current_position % totalPieces;
      
      const { data: piece } = await supabase
        .from('educational_content_pieces')
        .select('*')
        .eq('global_order', position)
        .eq('is_active', true)
        .single();
      
      if (!piece) {
        console.warn(`No piece found at position ${position} for ${market.market_region}`);
        continue;
      }

      // Build the scheduled time: tomorrow at the optimal time
      // optimal_post_time_utc is already HH:MM:SS, so just append Z
      const timeStr = market.optimal_post_time_utc;
      const scheduledTime = `${tomorrowDate}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}Z`;
      
      // Build tweet content with hashtags and link
      const hashtags = (piece.hashtags || []).slice(0, 3).map((h: string) => `#${h}`).join(' ');
      const fullContent = `${piece.content}\n\nLearn more → ${piece.link_back_url}\n\n${hashtags}`;

      scheduledPosts.push({
        account_id: account.id,
        post_type: 'educational',
        platform: 'twitter',
        content: fullContent,
        scheduled_time: scheduledTime,
        timezone: market.timezone,
        recurrence_pattern: 'weekdays',
        status: 'scheduled',
        link_back_url: piece.link_back_url,
        report_config: {
          market_region: market.market_region,
          piece_id: piece.id,
          article_title: piece.article_title,
          piece_type: piece.piece_type,
          sequence: `${piece.sequence_number}/${piece.total_in_series}`,
          global_position: position,
        },
      });

      // Advance market position by number of markets (so each market gets unique content)
      // US=0, EU=1, Tokyo=2, Shanghai=3 → next round: US=4, EU=5, Tokyo=6, Shanghai=7
      const nextPosition = market.current_position + markets.length;
      
      await supabase
        .from('educational_schedule_state')
        .update({ 
          current_position: nextPosition,
          last_scheduled_at: new Date().toISOString(),
        })
        .eq('id', market.id);

      // Update piece posted count
      await supabase
        .from('educational_content_pieces')
        .update({ 
          posted_count: piece.posted_count + 1,
          last_posted_at: new Date().toISOString(),
        })
        .eq('id', piece.id);
    }

    // Insert all scheduled posts
    if (scheduledPosts.length > 0) {
      const { error: insertError } = await supabase
        .from('scheduled_posts')
        .insert(scheduledPosts);
      
      if (insertError) throw insertError;
    }

    console.log(`Scheduled ${scheduledPosts.length} educational posts for ${tomorrowDate}`);

    return new Response(
      JSON.stringify({
        scheduled: scheduledPosts.length,
        date: tomorrowDate,
        markets: scheduledPosts.map(p => ({
          region: p.report_config.market_region,
          time: p.scheduled_time,
          article: p.report_config.article_title,
          type: p.report_config.piece_type,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-educational-posts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
