import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Trigger Backfill - Admin endpoint to queue historical pattern backfill jobs
 * 
 * This function uses pg_net to queue HTTP requests to the seeding functions,
 * which run asynchronously in the background.
 */

interface BackfillRequest {
  partition?: string; // fx, crypto, stocks_ag, stocks_ho, stocks_pz, commodities, indices, etfs
  timeframes?: string[]; // 1h, 4h, 1d, 1wk
  priority?: 'high' | 'normal'; // high = immediate, normal = staggered
}

const PARTITIONS = [
  'fx', 'crypto', 'stocks_ag', 'stocks_ho', 'stocks_pz', 
  'commodities', 'indices', 'etfs'
];

const DEFAULT_TIMEFRAMES = ['1h', '4h', '8h', '1d', '1wk'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    let body: BackfillRequest = {};
    try {
      body = await req.json();
    } catch {}

    const targetPartitions = body.partition ? [body.partition] : PARTITIONS;
    const timeframes = body.timeframes?.length ? body.timeframes : DEFAULT_TIMEFRAMES;
    const priority = body.priority || 'normal';

    console.log(`[trigger-backfill] Queuing backfill for ${targetPartitions.length} partitions`);
    console.log(`[trigger-backfill] Timeframes: ${timeframes.join(', ')}`);
    console.log(`[trigger-backfill] Priority: ${priority}`);

    const queuedJobs: string[] = [];
    const errors: string[] = [];

    // Queue jobs via pg_net
    for (let i = 0; i < targetPartitions.length; i++) {
      const partition = targetPartitions[i];
      
      // Stagger jobs by 2 minutes each if normal priority
      const delayMinutes = priority === 'high' ? 0 : i * 2;
      
      try {
        // Use pg_net to queue the HTTP request
        const { data, error } = await supabase.rpc('http_post_delayed', {
          url: `${supabaseUrl}/functions/v1/seed-mtf-distributed`,
          headers: JSON.stringify({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          }),
          body: JSON.stringify({
            partition,
            timeframes
          }),
          delay_seconds: delayMinutes * 60
        });

        if (error) {
          // Fallback to direct call if RPC not available
          console.log(`[trigger-backfill] RPC not available, calling directly for ${partition}`);
          
          // Fire and forget - don't wait for response
          fetch(`${supabaseUrl}/functions/v1/seed-mtf-distributed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              partition,
              timeframes
            }),
          }).catch(e => console.error(`[trigger-backfill] ${partition} fire-and-forget error:`, e));
          
          queuedJobs.push(`${partition} (direct-async)`);
        } else {
          queuedJobs.push(`${partition} (queued, delay: ${delayMinutes}m)`);
        }

        // Small delay between firing requests
        if (priority === 'high') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${partition}: ${msg}`);
        console.error(`[trigger-backfill] Error queuing ${partition}:`, msg);
      }
    }

    console.log(`[trigger-backfill] Queued ${queuedJobs.length} jobs`);

    return new Response(JSON.stringify({
      success: true,
      message: `Queued ${queuedJobs.length} backfill jobs`,
      partitions: targetPartitions,
      timeframes,
      priority,
      queuedJobs,
      errors: errors.length > 0 ? errors : undefined,
      note: 'Jobs are running asynchronously in the background. Check analytics_events table for completion status.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[trigger-backfill] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
