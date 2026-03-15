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

  // Support force mode to clear stale clones and re-schedule
  let forceMode = false;
  try {
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      forceMode = body?.force === true;
    }
  } catch {}

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
    
    // Educational content posts every day including weekends

    // Check if posts already scheduled for tomorrow (only count non-failed ones)
    const tomorrowStart = `${tomorrowDate}T00:00:00Z`;
    const tomorrowEnd = `${tomorrowDate}T23:59:59Z`;
    
    const { data: existingPosts } = await supabase
      .from('scheduled_posts')
      .select('id')
      .eq('post_type', 'educational')
      .in('status', ['scheduled', 'posted'])
      .gte('scheduled_time', tomorrowStart)
      .lte('scheduled_time', tomorrowEnd);
    
    if (existingPosts && existingPosts.length > 0) {
      if (forceMode) {
        // Delete stale clones so we can re-schedule with correct position
        console.log(`[schedule-edu] Force mode: deleting ${existingPosts.length} existing posts for ${tomorrowDate}`);
        await supabase
          .from('scheduled_posts')
          .delete()
          .in('id', existingPosts.map(p => p.id));
      } else {
        return new Response(
          JSON.stringify({ message: 'Posts already scheduled for tomorrow', count: existingPosts.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const scheduledPosts: any[] = [];
    const stateUpdates: { marketId: string; nextPosition: number; pieceId: string; postedCount: number }[] = [];

    // Budget-aware: only 1 educational post per day (rotate through markets)
    // Pick the market whose turn it is based on day-of-year
    const dayOfYear = Math.floor((tomorrow.getTime() - new Date(tomorrow.getFullYear(), 0, 0).getTime()) / 86400000);
    const marketIndex = dayOfYear % markets.length;
    const market = markets[marketIndex];
    console.log(`[schedule-edu] Day ${dayOfYear} → market ${marketIndex}: ${market.market_region} (budget: 1 edu/day)`);

    {
      // Get the piece at the current position (with wraparound)
      const position = market.current_position % totalPieces;
      
      const { data: piece, error: pieceError } = await supabase
        .from('educational_content_pieces')
        .select('*')
        .eq('global_order', position)
        .eq('is_active', true)
        .single();
      
      if (pieceError || !piece) {
        console.warn(`No piece found at position ${position} for ${market.market_region}:`, pieceError?.message);
      } else if (!piece.content || piece.content.trim().length < 10) {
        console.warn(`Piece at position ${position} has empty/short content, skipping ${market.market_region}. Will advance position to avoid getting stuck.`);
        // Advance position so we don't get stuck on this empty piece forever
        const nextPosition = market.current_position + 1;
        await supabase
          .from('educational_schedule_state')
          .update({ current_position: nextPosition, last_scheduled_at: new Date().toISOString() })
          .eq('id', market.id);
        console.log(`[schedule-edu] Advanced ${market.market_region} position to ${nextPosition} to skip empty piece`);
      } else {
        // Build the scheduled time: tomorrow at the optimal time
        const timeStr = market.optimal_post_time_utc;
        const scheduledTime = `${tomorrowDate}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}Z`;
        
        // piece.content already contains the CTA link from generation
        // Just append hashtags
        const hashtags = (piece.hashtags || []).slice(0, 3).map((h: string) => `#${h}`).join(' ');
        const fullContent = hashtags ? `${piece.content}\n\n${hashtags}` : piece.content;

        if (fullContent && fullContent.trim().length >= 20) {
          scheduledPosts.push({
            account_id: account.id,
            post_type: 'educational',
            platform: 'twitter',
            content: fullContent,
            scheduled_time: scheduledTime,
            timezone: market.timezone,
            recurrence_pattern: 'daily',
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

          // Queue state update
          const nextPosition = market.current_position + 1;
          stateUpdates.push({
            marketId: market.id,
            nextPosition,
            pieceId: piece.id,
            postedCount: piece.posted_count,
          });
        }
      }
    }

    // Insert all scheduled posts FIRST
    if (scheduledPosts.length > 0) {
      const { error: insertError } = await supabase
        .from('scheduled_posts')
        .insert(scheduledPosts);
      
      if (insertError) throw insertError;

      // Only update state AFTER successful insert
      for (const update of stateUpdates) {
        await supabase
          .from('educational_schedule_state')
          .update({ 
            current_position: update.nextPosition,
            last_scheduled_at: new Date().toISOString(),
          })
          .eq('id', update.marketId);

        await supabase
          .from('educational_content_pieces')
          .update({ 
            posted_count: update.postedCount + 1,
            last_posted_at: new Date().toISOString(),
          })
          .eq('id', update.pieceId);
      }
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
