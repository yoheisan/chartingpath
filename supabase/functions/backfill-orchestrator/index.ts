import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { partition, offset = 0, timeframes = ['1d', '1wk'], maxOffset = 300 } = await req.json();

    if (!partition) {
      return new Response(JSON.stringify({ error: 'partition is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const page = Math.floor(offset / 10) + 1;
    const totalPages = Math.floor(maxOffset / 10) + 1;
    console.log(`[backfill-orchestrator] Page ${page} of ${totalPages} — partition=${partition}, offset=${offset}`);

    // Call seed-mtf-distributed
    const seedResponse = await fetch(`${supabaseUrl}/functions/v1/seed-mtf-distributed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        partition,
        timeframes,
        forceFullBackfill: true,
        incrementalMode: false,
      }),
    });

    const seedResult = await seedResponse.json();
    console.log(`[backfill-orchestrator] Page ${page} of ${totalPages} complete — inserted: ${seedResult?.summary?.totalInserted ?? 0}`);

    // Schedule next page if within bounds
    const nextOffset = offset + 10;
    let scheduled = false;

    if (nextOffset <= maxOffset) {
      // Use pg_net to schedule a delayed self-call via the database
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8';
      
      const nextBody = JSON.stringify({
        partition,
        offset: nextOffset,
        timeframes,
        maxOffset,
      });

      // Schedule via pg_net with 2-minute delay
      const { error: scheduleError } = await supabase.rpc('schedule_backfill_page', {
        p_url: `${supabaseUrl}/functions/v1/backfill-orchestrator`,
        p_headers: JSON.stringify({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        }),
        p_body: nextBody,
        p_delay_minutes: 2,
      });

      if (scheduleError) {
        // Fallback: direct delayed call via setTimeout-style approach
        console.warn(`[backfill-orchestrator] pg_net schedule failed, using direct delayed call:`, scheduleError.message);
        
        // Wait 2 minutes then call directly
        await new Promise(resolve => setTimeout(resolve, 120_000));
        
        fetch(`${supabaseUrl}/functions/v1/backfill-orchestrator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: nextBody,
        }).catch(e => console.error('[backfill-orchestrator] Fallback self-call failed:', e));
      }
      
      scheduled = true;
      console.log(`[backfill-orchestrator] Scheduled next page ${page + 1} of ${totalPages} (offset=${nextOffset})`);
    } else {
      console.log(`[backfill-orchestrator] ✅ Partition ${partition} COMPLETE — all ${totalPages} pages processed`);
    }

    return new Response(JSON.stringify({
      success: true,
      partition,
      page,
      totalPages,
      offset,
      nextOffset: scheduled ? nextOffset : null,
      seedResult: seedResult?.summary || null,
      complete: !scheduled,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[backfill-orchestrator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
