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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const subscription = await req.json();

    console.log("Saving subscription for user:", user.id);

    const { error } = await supabase
      .from("market_report_subscriptions")
      .upsert({
        user_id: user.id,
        email: subscription.email,
        markets: subscription.markets,
        timezone: subscription.timezone,
        frequency: subscription.frequency,
        send_time: subscription.send_time + ":00",
        tone: subscription.tone,
        time_span: subscription.time_span,
        is_active: subscription.is_active,
      }, {
        onConflict: "user_id"
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in save-market-report-subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to save subscription" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
