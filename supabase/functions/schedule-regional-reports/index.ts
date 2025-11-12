import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Regional scheduling times (in UTC hours)
const REGIONAL_SCHEDULE = {
  'Asia': {
    preMarket: 23,   // 11 PM UTC = 8 AM Tokyo (before market open)
    midDay: 3,       // 3 AM UTC = 12 PM Tokyo (mid-day)
    postMarket: 7,   // 7 AM UTC = 4 PM Tokyo (after close)
    timezone: 'Asia/Tokyo'
  },
  'Europe': {
    preMarket: 7,    // 7 AM UTC = 8 AM London (before market open)
    midDay: 11,      // 11 AM UTC = 12 PM London (mid-day)
    postMarket: 16,  // 4 PM UTC = 5 PM London (after close)
    timezone: 'Europe/London'
  },
  'Americas': {
    preMarket: 13,   // 1 PM UTC = 9 AM NY (before market open)
    midDay: 17,      // 5 PM UTC = 1 PM NY (mid-day)
    postMarket: 21,  // 9 PM UTC = 5 PM NY (after close)
    timezone: 'America/New_York'
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting regional market report generation...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const currentHourUTC = new Date().getUTCHours();
    console.log(`Current UTC hour: ${currentHourUTC}`);

    const reportConfig = {
      markets: ["stocks", "forex", "crypto", "commodities"],
      timeSpan: "previous_day",
      tone: "professional"
    };

    const results = [];

    // Check which regions should generate reports at this hour
    for (const [region, schedule] of Object.entries(REGIONAL_SCHEDULE)) {
      const shouldGenerate = 
        currentHourUTC === schedule.preMarket ||
        currentHourUTC === schedule.midDay ||
        currentHourUTC === schedule.postMarket;

      if (!shouldGenerate) {
        console.log(`Skipping ${region} - not scheduled for UTC hour ${currentHourUTC}`);
        continue;
      }

      const reportType = 
        currentHourUTC === schedule.preMarket ? 'pre-market' :
        currentHourUTC === schedule.midDay ? 'mid-day' :
        'post-market';

      console.log(`Generating ${reportType} report for ${region}...`);

      try {
        // Use the fast generator with Lovable AI
        const { data: reportData, error: reportError } = await supabase.functions.invoke(
          "generate-market-report-fast",
          {
            body: {
              timezone: schedule.timezone,
              ...reportConfig
            }
          }
        );

        if (reportError) {
          console.error(`Error generating report for ${region}:`, reportError);
          results.push({ region, reportType, success: false, error: reportError.message });
          continue;
        }

        // Store with 2-hour expiry
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

        const { error: insertError } = await supabase
          .from("cached_market_reports")
          .insert({
            timezone: region, // Store by region
            report: reportData.report,
            markets: reportConfig.markets,
            time_span: reportConfig.timeSpan,
            tone: reportConfig.tone,
            generated_at: new Date().toISOString(),
            expires_at: expiresAt
          });

        if (insertError) {
          console.error(`Error caching report for ${region}:`, insertError);
          results.push({ region, reportType, success: false, error: insertError.message });
        } else {
          console.log(`✓ ${region} ${reportType} report cached (expires in 2h)`);
          results.push({ region, reportType, success: true });
        }

        // Clean up old regional reports
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        await supabase
          .from("cached_market_reports")
          .delete()
          .eq("timezone", region)
          .lt("generated_at", fourHoursAgo);

      } catch (error) {
        console.error(`Exception for ${region}:`, error);
        results.push({ region, reportType, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    if (results.length === 0) {
      console.log("No reports scheduled for this hour");
      return new Response(
        JSON.stringify({
          success: true,
          message: `No reports scheduled for UTC hour ${currentHourUTC}`,
          currentHour: currentHourUTC
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`Regional generation complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${successCount}/${results.length} regional reports`,
        currentHour: currentHourUTC,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Regional generation error:", error);
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
