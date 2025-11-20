import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Single source of truth for timezones
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Australia/Sydney"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting scheduled market report generation...");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const results = [];
    const reportConfig = {
      markets: ["stocks", "forex", "crypto", "commodities"],
      timeSpan: "previous_day",
      tone: "professional"
    };

    // Generate reports for all timezones
    for (const timezone of TIMEZONES) {
      try {
        console.log(`Generating report for ${timezone}...`);

        // Generate the report
        const { data: generatedData, error: generateError } = await supabaseClient.functions.invoke(
          "generate-market-report",
          {
            body: {
              timezone,
              ...reportConfig
            }
          }
        );

        if (generateError) {
          console.error(`Error generating report for ${timezone}:`, generateError);
          results.push({ timezone, success: false, error: generateError.message });
          continue;
        }

        // Cache the report (expires in 12 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 12);

        const { error: cacheError } = await supabaseClient
          .from("cached_market_reports")
          .insert({
            timezone,
            markets: reportConfig.markets,
            time_span: reportConfig.timeSpan,
            tone: reportConfig.tone,
            report: generatedData.report,
            expires_at: expiresAt.toISOString()
          });

        if (cacheError) {
          console.error(`Error caching report for ${timezone}:`, cacheError);
          results.push({ timezone, success: false, error: cacheError.message });
        } else {
          console.log(`✓ Successfully cached report for ${timezone}`);
          results.push({ timezone, success: true });
        }

      } catch (error) {
        console.error(`Error processing ${timezone}:`, error);
        results.push({ timezone, success: false, error: error.message });
      }
    }

    // Clean up expired reports
    console.log("Cleaning up expired reports...");
    await supabaseClient.rpc("cleanup_expired_reports");

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Completed: ${successCount}/${TIMEZONES.length} reports generated`);

    return new Response(
      JSON.stringify({
        message: `Generated ${successCount}/${TIMEZONES.length} reports`,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in schedule-market-reports:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate scheduled reports" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
