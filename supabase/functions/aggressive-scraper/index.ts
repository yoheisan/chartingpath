import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Aggressive Scraper - Polls official sources every 5 seconds during release windows
 * This function is triggered 5 minutes before high-impact events and continues
 * until the actual value is detected
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Starting aggressive scraping for imminent releases...");
    
    // Find events happening in the next 5 minutes
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    const { data: imminentEvents, error } = await supabase
      .from("economic_events")
      .select("*")
      .eq("released", false)
      .eq("impact_level", "high")
      .gte("scheduled_time", now.toISOString())
      .lte("scheduled_time", fiveMinutesFromNow.toISOString());
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${imminentEvents?.length || 0} imminent high-impact events`);
    
    if (!imminentEvents || imminentEvents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No imminent events to scrape",
          events_checked: 0
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // For each imminent event, scrape the relevant source aggressively
    const scrapingResults = [];
    
    for (const event of imminentEvents) {
      console.log(`Aggressively checking: ${event.event_name} at ${event.scheduled_time}`);
      
      let actualValue = null;
      
      // Determine which source to scrape based on event details
      if (event.region === "US") {
        if (event.indicator_type === "employment") {
          actualValue = await scrapeUSBLSActual(event.event_name);
        } else if (event.indicator_type === "inflation") {
          actualValue = await scrapeUSCPIActual(event.event_name);
        }
      } else if (event.region === "EU") {
        if (event.indicator_type === "inflation") {
          actualValue = await scrapeEurostatCPIActual(event.event_name);
        }
      }
      // Add more region-specific scrapers as needed
      
      if (actualValue !== null) {
        console.log(`🎯 ACTUAL VALUE DETECTED: ${event.event_name} = ${actualValue}`);
        
        // Update the database immediately
        const { error: updateError } = await supabase
          .from("economic_events")
          .update({
            actual_value: actualValue.toString(),
            released: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", event.id);
        
        if (updateError) {
          console.error("Error updating event:", updateError);
        } else {
          scrapingResults.push({
            event_name: event.event_name,
            actual_value: actualValue,
            detected_at: new Date().toISOString()
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        events_checked: imminentEvents.length,
        values_detected: scrapingResults.length,
        results: scrapingResults
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in aggressive-scraper:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Aggressive scraper for US BLS employment data
async function scrapeUSBLSActual(eventName: string): Promise<number | null> {
  try {
    // Check the BLS news release page for latest data
    const response = await fetch("https://www.bls.gov/news.release/empsit.nr0.htm", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Look for "Total nonfarm payroll employment rose by XXX,XXX"
    const nfpPattern = /employment (?:rose|increased|fell|decreased) by ([\d,]+)/i;
    const match = nfpPattern.exec(html);
    
    if (match) {
      const value = parseInt(match[1].replace(/,/g, ''));
      console.log(`NFP actual value found: ${value}`);
      return value;
    }
    
    return null;
    
  } catch (error) {
    console.error("Error scraping BLS actual:", error);
    return null;
  }
}

// Aggressive scraper for US CPI data
async function scrapeUSCPIActual(eventName: string): Promise<number | null> {
  try {
    // Check the BLS CPI news release
    const response = await fetch("https://www.bls.gov/news.release/cpi.nr0.htm", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Look for CPI percentage change
    const cpiPattern = /CPI[-\w\s]*(?:rose|increased|fell|decreased)[\s]+([\d.]+)\s*percent/i;
    const match = cpiPattern.exec(html);
    
    if (match) {
      const value = parseFloat(match[1]);
      console.log(`CPI actual value found: ${value}%`);
      return value;
    }
    
    return null;
    
  } catch (error) {
    console.error("Error scraping CPI actual:", error);
    return null;
  }
}

// Aggressive scraper for Eurozone CPI
async function scrapeEurostatCPIActual(eventName: string): Promise<number | null> {
  try {
    // Eurostat flash estimate endpoint
    const response = await fetch("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EconomicCalendarBot/1.0)',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Parse latest CPI value from API response
    // This will vary based on Eurostat's API structure
    if (data.value && Array.isArray(data.value)) {
      const latestValue = data.value[data.value.length - 1];
      if (typeof latestValue === 'number') {
        console.log(`Eurozone CPI actual value found: ${latestValue}%`);
        return latestValue;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error("Error scraping Eurostat CPI actual:", error);
    return null;
  }
}
