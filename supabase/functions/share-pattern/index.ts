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
    const { id } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Pattern ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if pattern already has a share token
    const { data: existing, error: fetchErr } = await supabase
      .from('live_pattern_detections')
      .select('share_token, instrument, pattern_name')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return new Response(JSON.stringify({ error: 'Pattern not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return existing token if already shared
    if (existing.share_token) {
      return new Response(JSON.stringify({
        success: true,
        shareToken: existing.share_token,
        instrument: existing.instrument,
        patternName: existing.pattern_name,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a short, URL-friendly token
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    const { error: updateErr } = await supabase
      .from('live_pattern_detections')
      .update({ share_token: token })
      .eq('id', id);

    if (updateErr) {
      console.error('[share-pattern] Update error:', updateErr);
      return new Response(JSON.stringify({ error: 'Failed to generate share link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[share-pattern] Created token ${token} for ${existing.instrument} - ${existing.pattern_name}`);

    return new Response(JSON.stringify({
      success: true,
      shareToken: token,
      instrument: existing.instrument,
      patternName: existing.pattern_name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[share-pattern] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
