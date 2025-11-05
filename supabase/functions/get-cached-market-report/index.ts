import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timezone, markets, timeSpan, tone, forceGenerate } = await req.json();
    
    console.log("Fetching market report:", { timezone, timeSpan, forceGenerate });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user ID and IP for rate limiting
    const authHeader = req.headers.get("authorization");
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id;
    }
    
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";

    // Check rate limit (30 minutes between requests per user/IP)
    if (forceGenerate && userId) {
      const { data: rateLimitCheck } = await supabaseClient
        .rpc("check_rate_limit", {
          p_user_id: userId,
          p_ip_address: clientIp,
          p_timezone: timezone
        });

      if (!rateLimitCheck) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please wait 30 minutes between report generations.",
            cached: false
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Try to get cached report (valid for 30 minutes)
    if (!forceGenerate) {
      const { data: cachedReport } = await supabaseClient
        .from("cached_market_reports")
        .select("*")
        .eq("timezone", timezone)
        .eq("time_span", timeSpan)
        .gte("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (cachedReport) {
        console.log("Returning cached report");
        return new Response(
          JSON.stringify({ 
            report: cachedReport.report,
            generated_at: cachedReport.generated_at,
            cached: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Generate new report
    console.log("Generating new report...");
    const { data: generatedData, error: generateError } = await supabaseClient.functions.invoke(
      "generate-market-report",
      {
        body: { timezone, markets, timeSpan, tone }
      }
    );

    if (generateError) {
      console.error("Generate error:", generateError);
      
      // Check if it's a payment error
      if (generateError.message?.includes("Payment required") || generateError.message?.includes("402")) {
        return new Response(
          JSON.stringify({ 
            error: "Lovable AI credits depleted. Please add credits in Settings → Workspace → Usage to generate new reports.",
            needsCredits: true
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      // Check if it's a rate limit error
      if (generateError.message?.includes("Rate limit") || generateError.message?.includes("429")) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a moment.",
            rateLimited: true
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      throw generateError;
    }

    // Cache the new report (expires in 30 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    await supabaseClient
      .from("cached_market_reports")
      .insert({
        timezone,
        markets,
        time_span: timeSpan,
        tone,
        report: generatedData.report,
        expires_at: expiresAt.toISOString()
      });

    console.log("Report generated and cached");

    return new Response(
      JSON.stringify({ 
        report: generatedData.report,
        generated_at: new Date().toISOString(),
        cached: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in get-cached-market-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to get report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});