import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Pattern scheduler triggered");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Call the main pattern detector function
    const detectorResponse = await supabaseService.functions.invoke('pattern-detector');
    
    if (detectorResponse.error) {
      throw new Error(`Pattern detector error: ${detectorResponse.error.message}`);
    }

    console.log("Pattern detection completed:", detectorResponse.data);

    return new Response(JSON.stringify({
      success: true,
      message: "Pattern detection scheduled and executed",
      results: detectorResponse.data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Pattern scheduler error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// This function can be called by a cron job or webhook
// Example cron schedule (every 15 minutes):
// */15 * * * * curl -X POST https://your-project.supabase.co/functions/v1/pattern-scheduler