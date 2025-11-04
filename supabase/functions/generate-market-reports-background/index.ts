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
    console.log("Starting background market report generation...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Define timezones to generate reports for
    const timezones = [
      "America/New_York",
      "Europe/London", 
      "Asia/Tokyo",
      "Asia/Hong_Kong",
      "Australia/Sydney",
      "America/Los_Angeles"
    ];

    const reportConfig = {
      markets: ["stocks", "forex", "crypto", "commodities"],
      timeSpan: "previous_day",
      tone: "professional"
    };

    const results = [];

    for (const timezone of timezones) {
      try {
        console.log(`Generating report for ${timezone}...`);
        
        // Call the generate-market-report function
        const { data: reportData, error: reportError } = await supabase.functions.invoke(
          "generate-market-report",
          {
            body: {
              timezone,
              ...reportConfig
            }
          }
        );

        if (reportError) {
          console.error(`Error generating report for ${timezone}:`, reportError);
          results.push({ timezone, success: false, error: reportError.message });
          continue;
        }

        // Store the generated report in the database
        const { error: insertError } = await supabase
          .from("market_reports")
          .insert({
            timezone,
            report_content: reportData.report,
            markets: reportConfig.markets,
            time_span: reportConfig.timeSpan,
            tone: reportConfig.tone,
            generated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Error storing report for ${timezone}:`, insertError);
          results.push({ timezone, success: false, error: insertError.message });
        } else {
          console.log(`Successfully generated and stored report for ${timezone}`);
          results.push({ timezone, success: true });
        }

        // Clean up old reports (keep only last 24 hours worth)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await supabase
          .from("market_reports")
          .delete()
          .eq("timezone", timezone)
          .lt("generated_at", oneDayAgo);

      } catch (error) {
        console.error(`Exception for ${timezone}:`, error);
        results.push({ timezone, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Background generation complete: ${successCount}/${timezones.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated reports for ${successCount}/${timezones.length} timezones`,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Background generation error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
